// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// BulkDailyRecord.jsx — Main component
// ============================================================

function BulkDailyRecord() {
  const {
    useState,
    useRef
  } = React;
  const {
    grade,
    setGrade,
    date,
    setDate,
    students,
    setStudents,
    checks,
    done,
    setDone,
    loading,
    search,
    setSearch,
    pendingList,
    displayStudents,
    toggle,
    costFor,
    rowStatus,
    syncWindowStudents,
    PRICES,
    ADMIN
  } = useBulkLoad();
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dupWarn, setDupWarn] = useState("");
  const [preparing, setPreparing] = useState(false); // spinner on Process All button
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastRecorded, setLastRecorded] = useState(null);
  const undoTimerRef = useRef(null);

  // ── Fetch duplicate warning ─────────────────────────────────
  async function fetchDupWarning(entry) {
    setDupWarn("");
    if (!window.buildDuplicateWarning) return;
    try {
      const w = await window.buildDuplicateWarning(entry.student.admNo, entry.student.name, date, entry.food, entry.tea, entry.porridge);
      setDupWarn(w || "");
    } catch (e) {
      setDupWarn("");
    }
  }

  // ── Process All — show spinner on button, then open first card
  async function startProcess() {
    const q = pendingList.map(s => {
      const c = checks[s.admNo] || {};
      const food = !c.foodLocked && !!c.food;
      const tea = !c.teaLocked && !!c.tea;
      const porridge = !c.porridgeLocked && !!c.porridge;
      const cost = (food ? PRICES.FOOD : 0) + (tea ? PRICES.TEA : 0) + (porridge ? PRICES.PORRIDGE : 0);
      return {
        student: s,
        food,
        tea,
        porridge,
        cost
      };
    });
    if (!q.length) {
      bulkToast("No new items ticked", "warning");
      return;
    }

    // Show spinner on the button while fetching duplicate warning
    setPreparing(true);
    setQueue(q);
    setQueueIdx(0);
    await fetchDupWarning(q[0]);
    setPreparing(false);
    setShowModal(true);
  }

  // ── Advance to next student ─────────────────────────────────
  async function advance(q, idx) {
    const next = idx + 1;
    if (next >= q.length) {
      setShowModal(false);
      setSubmitting(false);
      bulkToast(`Done! ${q.length} student${q.length !== 1 ? "s" : ""} processed.`, "success");
    } else {
      setQueueIdx(next);
      setSubmitting(false);
      await fetchDupWarning(q[next]);
    }
  }

  // ── Confirm one student ─────────────────────────────────────
  async function handleConfirm() {
    const entry = queue[queueIdx];
    const s = entry.student;
    setSubmitting(true);
    try {
      const res = await bulkApiPost("recordMeal", {
        admNo: s.admNo,
        name: s.name,
        grade: s.grade,
        food: entry.food,
        tea: entry.tea,
        porridge: entry.porridge,
        date,
        recordedBy: ADMIN
      });
      const prevBalance = s.balance || 0;
      const newBalance = res.newBalance !== undefined ? res.newBalance : prevBalance - entry.cost;
      setStudents(prev => prev.map(st => st.admNo === s.admNo ? {
        ...st,
        balance: newBalance,
        type: res.type || st.type
      } : st));
      setDone(prev => ({
        ...prev,
        [s.admNo]: true
      }));
      syncWindowStudents(s.admNo, newBalance, res.type);

      // Undo toast
      setLastRecorded({
        admNo: s.admNo,
        prevBalance,
        name: s.name
      });
      setUndoVisible(true);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setUndoVisible(false);
        setLastRecorded(null);
      }, 5000);
      await advance(queue, queueIdx);
    } catch (err) {
      bulkToast(`Error for ${s.name}: ${err.message}`, "error");
      setSubmitting(false);
    }
  }
  async function handleSkip() {
    await advance(queue, queueIdx);
  }
  function handleUndo() {
    if (!lastRecorded) return;
    setStudents(prev => prev.map(st => st.admNo === lastRecorded.admNo ? {
      ...st,
      balance: lastRecorded.prevBalance
    } : st));
    setDone(prev => {
      const n = {
        ...prev
      };
      delete n[lastRecorded.admNo];
      return n;
    });
    if (window.allStudents) {
      const found = window.allStudents.find(a => String(a.admNo) === String(lastRecorded.admNo));
      if (found) found.balance = lastRecorded.prevBalance;
    }
    setUndoVisible(false);
    setLastRecorded(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    bulkToast(`Undone — ${lastRecorded.name} removed from today's record`, "warning");
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, `
        .gs-cb { width: 16px; height: 16px; cursor: pointer; accent-color: #2ecc71; }
        .gs-cb:disabled { cursor: not-allowed; opacity: 0.4; }
        .bulk-row:hover { background: rgba(255,255,255,0.025); }
      `), /*#__PURE__*/React.createElement(BulkTable, {
    grade: grade,
    setGrade: setGrade,
    date: date,
    setDate: setDate,
    students: students,
    displayStudents: displayStudents,
    checks: checks,
    done: done,
    loading: loading,
    search: search,
    setSearch: setSearch,
    pendingList: pendingList,
    toggle: toggle,
    costFor: costFor,
    rowStatus: rowStatus,
    onProcessAll: startProcess,
    preparing: preparing
  }), showModal && queue.length > 0 && /*#__PURE__*/React.createElement(ConfirmModal, {
    entry: queue[queueIdx],
    totalInQueue: queue.length,
    currentIdx: queueIdx,
    onConfirm: handleConfirm,
    onSkip: handleSkip,
    onClose: handleSkip,
    submitting: submitting,
    dupWarning: dupWarn
  }), undoVisible && lastRecorded && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 80,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#162a1c",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 8,
      padding: "10px 18px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 13,
      color: "var(--light)",
      zIndex: 9998,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u2705 ", lastRecorded.name, " recorded"), /*#__PURE__*/React.createElement("button", {
    onClick: handleUndo,
    style: {
      background: "rgba(231,76,60,0.15)",
      border: "1px solid rgba(231,76,60,0.4)",
      color: "#e74c3c",
      borderRadius: 6,
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "Undo")));
}

// ── Mount ─────────────────────────────────────────────────────
function mountBulkRecord() {
  const root = document.getElementById("bulk-react-root");
  if (!root) {
    console.warn("BulkDailyRecord: #bulk-react-root not found");
    return;
  }
  ReactDOM.createRoot(root).render(React.createElement(BulkDailyRecord));
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountBulkRecord);
} else {
  mountBulkRecord();
}
