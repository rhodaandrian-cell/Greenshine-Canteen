// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// BulkModal.jsx — Confirm modal + Undo toast
// ============================================================

function ConfirmModal({
  entry,
  totalInQueue,
  currentIdx,
  onConfirm,
  onSkip,
  onClose,
  submitting,
  dupWarning
}) {
  if (!entry) return null;
  const {
    student: s,
    cost
  } = entry;
  const bal = s.balance || 0;
  const after = bal - cost;
  const items = [entry.food && "Food", entry.tea && "Tea", entry.porridge && "Porridge"].filter(Boolean);
  const balWarnHtml = window.balanceWarningHtml ? window.balanceWarningHtml(bal, cost) : bal <= 0 ? `<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:13px;color:var(--danger)">❌ Student already in debt (${bulkFmtBal(bal)}). Meal still recorded per school policy.</div>` : bal < cost ? `<div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:13px;color:var(--warning)">⚠️ Balance (${bulkFmtBal(bal)}) is less than meal cost (KES ${cost}). Student will go into debt.</div>` : "";
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay open",
    style: {
      zIndex: 1000
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, "Confirm \u2014 ", s.name, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--muted)",
      marginLeft: 8
    }
  }, "(", currentIdx + 1, " of ", totalInQueue, ")")), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    id: "bulk-modal-content",
    style: {
      padding: "16px 20px",
      fontSize: 14,
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--muted)",
      fontSize: 13
    }
  }, s.displayGrade || s.grade), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "8px 0",
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, items.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `badge badge-${i.toLowerCase()}`
  }, i === "Food" ? "🍽️ Lunch" : i === "Tea" ? "☕ Tea" : "🌾 Porridge"))), /*#__PURE__*/React.createElement("div", {
    className: "deduction-summary"
  }, /*#__PURE__*/React.createElement("div", {
    className: "deduction-row"
  }, /*#__PURE__*/React.createElement("span", null, "Deduction"), /*#__PURE__*/React.createElement("span", {
    className: "text-warning text-mono"
  }, "\u2212 KES ", cost)), /*#__PURE__*/React.createElement("div", {
    className: "deduction-row"
  }, /*#__PURE__*/React.createElement("span", null, "Current Balance"), /*#__PURE__*/React.createElement("span", {
    className: `text-mono ${bal >= 0 ? "text-success" : "text-danger"}`
  }, bulkFmtBal(bal))), /*#__PURE__*/React.createElement("div", {
    className: "deduction-row total"
  }, /*#__PURE__*/React.createElement("span", null, "Balance After"), /*#__PURE__*/React.createElement("span", {
    className: `text-mono ${after >= 0 ? "text-success" : "text-danger"}`
  }, bulkFmtBal(after)))), dupWarning && /*#__PURE__*/React.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: dupWarning
    }
  }), balWarnHtml && /*#__PURE__*/React.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: balWarnHtml
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      color: "var(--muted)",
      fontSize: 13
    }
  }, "Did ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--light)"
    }
  }, s.name), " eat/drink these today?")), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary",
    id: "bulk-modal-skip",
    onClick: onSkip,
    disabled: submitting
  }, "Skip"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    id: "bulk-modal-confirm",
    onClick: onConfirm,
    disabled: submitting,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "center"
    }
  }, submitting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner",
    style: {
      width: 16,
      height: 16,
      borderWidth: 2
    }
  }), " Recording...") : "✅ Yes, Confirm"))));
}

// ── Undo Toast ────────────────────────────────────────────────
function UndoToast({
  visible,
  name,
  onUndo
}) {
  if (!visible) return null;
  return /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("span", null, "\u2705 ", name, " recorded"), /*#__PURE__*/React.createElement("button", {
    onClick: onUndo,
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
  }, "Undo"));
}
