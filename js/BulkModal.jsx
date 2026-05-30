// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// BulkModal.jsx — Confirm modal + Undo toast
// ============================================================

function ConfirmModal({
  entry, totalInQueue, currentIdx,
  onConfirm, onSkip, onClose,
  submitting, dupWarning,
}) {
  if (!entry) return null;

  const { student: s, cost } = entry;
  const bal   = s.balance || 0;
  const after = bal - cost;

  const items = [
    entry.food     && "Food",
    entry.tea      && "Tea",
    entry.porridge && "Porridge",
  ].filter(Boolean);

  const balWarnHtml = window.balanceWarningHtml
    ? window.balanceWarningHtml(bal, cost)
    : bal <= 0
      ? `<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:13px;color:var(--danger)">❌ Student already in debt (${bulkFmtBal(bal)}). Meal still recorded per school policy.</div>`
      : bal < cost
        ? `<div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:13px;color:var(--warning)">⚠️ Balance (${bulkFmtBal(bal)}) is less than meal cost (KES ${cost}). Student will go into debt.</div>`
        : "";

  return (
    <div className="modal-overlay open" style={{ zIndex: 1000 }}>
      <div className="modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            Confirm — {s.name}
            <span style={{ fontSize:11, color:"var(--muted)", marginLeft:8 }}>
              ({currentIdx + 1} of {totalInQueue})
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div id="bulk-modal-content" style={{ padding:"16px 20px", fontSize:14, lineHeight:1.8 }}>

          <div style={{ fontWeight:600 }}>{s.name}</div>
          <div style={{ color:"var(--muted)", fontSize:13 }}>{s.displayGrade || s.grade}</div>

          <div style={{ margin:"8px 0", display:"flex", gap:6, flexWrap:"wrap" }}>
            {items.map(i => (
              <span key={i} className={`badge badge-${i.toLowerCase()}`}>
                {i === "Food" ? "🍽️ Lunch" : i === "Tea" ? "☕ Tea" : "🌾 Porridge"}
              </span>
            ))}
          </div>

          <div className="deduction-summary">
            <div className="deduction-row">
              <span>Deduction</span>
              <span className="text-warning text-mono">− KES {cost}</span>
            </div>
            <div className="deduction-row">
              <span>Current Balance</span>
              <span className={`text-mono ${bal >= 0 ? "text-success" : "text-danger"}`}>
                {bulkFmtBal(bal)}
              </span>
            </div>
            <div className="deduction-row total">
              <span>Balance After</span>
              <span className={`text-mono ${after >= 0 ? "text-success" : "text-danger"}`}>
                {bulkFmtBal(after)}
              </span>
            </div>
          </div>

          {dupWarning && <div dangerouslySetInnerHTML={{ __html: dupWarning }} />}
          {balWarnHtml && <div dangerouslySetInnerHTML={{ __html: balWarnHtml }} />}

          <div style={{ marginTop:10, color:"var(--muted)", fontSize:13 }}>
            Did <strong style={{ color:"var(--light)" }}>{s.name}</strong> eat/drink these today?
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn btn-secondary" id="bulk-modal-skip" onClick={onSkip} disabled={submitting}>
            Skip
          </button>
          <button
            className="btn btn-primary"
            id="bulk-modal-confirm"
            onClick={onConfirm}
            disabled={submitting}
            style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}
          >
            {submitting
              ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Recording...</>
              : "✅ Yes, Confirm"
            }
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Undo Toast ────────────────────────────────────────────────
function UndoToast({ visible, name, onUndo }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
      background:"#162a1c", border:"1px solid rgba(255,255,255,0.15)",
      borderRadius:8, padding:"10px 18px",
      display:"flex", alignItems:"center", gap:12,
      fontSize:13, color:"var(--light)", zIndex:9998,
      boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
      whiteSpace:"nowrap",
    }}>
      <span>✅ {name} recorded</span>
      <button onClick={onUndo} style={{
        background:"rgba(231,76,60,0.15)",
        border:"1px solid rgba(231,76,60,0.4)",
        color:"#e74c3c", borderRadius:6,
        padding:"4px 12px", fontSize:12,
        fontWeight:600, cursor:"pointer",
      }}>
        Undo
      </button>
    </div>
  );
}