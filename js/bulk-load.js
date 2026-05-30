// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// bulk-load.js — Data loading custom hook
// ============================================================

// ── Helpers ───────────────────────────────────────────────────
function bulkToday() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function bulkFmtBal(n) {
  if (typeof Sheets !== "undefined" && Sheets.formatBalance) return Sheets.formatBalance(n);
  return (n < 0 ? "-" : "") + "KES " + Math.abs(n).toLocaleString();
}

function bulkToast(msg, type) {
  type = type || "success";
  if (typeof showToast !== "undefined") { showToast(msg, type); return; }
  console.log("[bulk]", type, msg);
}

async function bulkApiPost(action, params) {
  return await Sheets.post(action, params || {});
}

// ── useBulkLoad — custom React hook ──────────────────────────
function useBulkLoad() {
  const { useState, useEffect, useCallback, useRef } = React;

  const GS     = window.GREENSHINE || {};
  const PRICES = GS.PRICES || { FOOD: 50, TEA: 15, PORRIDGE: 10 };
  const ADMIN  = GS.ADMIN_NAME || "Tr Jedida";

  const [grade,    setGrade]    = useState("");
  const [date,     setDate]     = useState(bulkToday());
  const [students, setStudents] = useState([]);
  const [checks,   setChecks]   = useState({});
  const [done,     setDone]     = useState({});
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");

  const lastGradeRef = useRef("");

  const loadClass = useCallback(async (g, d) => {
    if (!g) return;
    setLoading(true);
    setStudents([]);
    setChecks({});
    setDone({});
    setSearch("");

    const isDateChange = g === lastGradeRef.current;
    lastGradeRef.current = g;

    if (!isDateChange) await new Promise(r => setTimeout(r, 400));

    try {
      const allS  = window.allStudents  || [];
      const allTx = window.allTxHistory || {};

      const filtered = allS
        .filter(s => s.displayGrade === g || String(s.grade) === g)
        .sort((a, b) => {
          const mA = allTx[a.admNo] || 0;
          const mB = allTx[b.admNo] || 0;
          if (mB !== mA) return mB - mA;
          return Number(a.admNo) - Number(b.admNo);
        });

      let recorded = {};
      try {
        const txRes = await Sheets.getTransactions();
        (txRes.transactions || []).forEach(tx => {
          if (tx.type !== "MEAL" || tx.date !== d) return;
          const key = String(tx.admNo);
          if (!recorded[key]) recorded[key] = { food: false, tea: false, porridge: false };
          if (tx.food     === "YES") recorded[key].food     = true;
          if (tx.tea      === "YES") recorded[key].tea      = true;
          if (tx.porridge === "YES") recorded[key].porridge = true;
        });
      } catch (e) { /* proceed without pre-fill */ }

      setStudents(filtered);

      const initChecks = {}, initDone = {};
      filtered.forEach(s => {
        const ate = recorded[String(s.admNo)] || {};
        initChecks[s.admNo] = {
          food:          !!ate.food,
          tea:           !!ate.tea,
          porridge:      !!ate.porridge,
          foodLocked:    !!ate.food,
          teaLocked:     !!ate.tea,
          porridgeLocked:!!ate.porridge,
        };
        if (ate.food && ate.tea && ate.porridge) initDone[s.admNo] = true;
      });
      setChecks(initChecks);
      setDone(initDone);

      if (isDateChange) {
        const dl    = new Date(d + "T00:00:00");
        const label = dl.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
        bulkToast(`Loaded ${g} · ${label}`, "success");
      }

    } catch (err) {
      bulkToast("Failed to load: " + err.message, "error");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (grade) loadClass(grade, date);
  }, [grade, date, loadClass]);

  function toggle(admNo, field) {
    setChecks(prev => {
      const c = prev[admNo] || {};
      if (c[field + "Locked"] || done[admNo]) return prev;
      return { ...prev, [admNo]: { ...c, [field]: !c[field] } };
    });
  }

  function costFor(admNo) {
    const c = checks[admNo] || {};
    return (c.food ? PRICES.FOOD : 0)
         + (c.tea  ? PRICES.TEA  : 0)
         + (c.porridge ? PRICES.PORRIDGE : 0);
  }

  function rowStatus(s) {
    if (done[s.admNo]) return "done";
    const c = checks[s.admNo] || {};
    if ((c.food || c.tea || c.porridge) &&
        (c.foodLocked || c.teaLocked || c.porridgeLocked)) return "partial";
    return "pending";
  }

  const pendingList = students.filter(s => {
    if (done[s.admNo]) return false;
    const c = checks[s.admNo] || {};
    return (!c.foodLocked     && c.food     ? PRICES.FOOD     : 0)
         + (!c.teaLocked      && c.tea      ? PRICES.TEA      : 0)
         + (!c.porridgeLocked && c.porridge ? PRICES.PORRIDGE : 0) > 0;
  });

  const displayStudents = search.trim().length >= 2
    ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : students;

  function syncWindowStudents(admNo, newBalance, newType) {
    if (window.allStudents) {
      const found = window.allStudents.find(a => String(a.admNo) === String(admNo));
      if (found) {
        found.balance = newBalance;
        if (newType) found.type = newType;
      }
    }
    if (window.allTxHistory) {
      window.allTxHistory[admNo] = (window.allTxHistory[admNo] || 0) + 1;
    }
  }

  return {
    grade, setGrade,
    date,  setDate,
    students, setStudents,
    checks,
    done,   setDone,
    loading,
    search, setSearch,
    pendingList,
    displayStudents,
    toggle,
    costFor,
    rowStatus,
    syncWindowStudents,
    PRICES,
    ADMIN,
  };
}