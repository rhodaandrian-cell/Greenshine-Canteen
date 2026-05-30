// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// BulkTable.jsx — Student rows, checkboxes, search, headers
// ============================================================

function BulkTable({
  grade, date, setGrade, setDate,
  students, displayStudents, checks, done,
  loading, search, setSearch,
  pendingList, toggle, costFor, rowStatus,
  onProcessAll, preparing,
}) {
  const GS    = window.GREENSHINE || {};
  const TYPES = GS.TYPES || {
    "0": { label: "Unranked",   color: "#888888" },
    "A": { label: "Prepaid",    color: "#2ecc71" },
    "B": { label: "Weekly Tab", color: "#3498db" },
    "C": { label: "Occasional", color: "#f39c12" },
    "D": { label: "Non-paying", color: "#e74c3c" },
  };

  // Renders a checkbox or 🚫 if already recorded
  const renderCb = (c, done_adm, field, lockedField) => {
    if (c[lockedField]) {
      return (
        <span title="Already recorded today" style={{ fontSize:18, cursor:"default", userSelect:"none" }}>
          🚫
        </span>
      );
    }
    return (
      <input
        type="checkbox"
        className="gs-cb"
        checked={!!c[field]}
        disabled={!!done_adm}
        onChange={() => toggle(c._admNo, field)}
      />
    );
  };

  return (
    <div className="card">

      {/* ── Card header ── */}
      <div className="card-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <span>📋 Bulk Daily Meal Record</span>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <select
            className="form-control"
            style={{ width:"auto" }}
            value={grade}
            onChange={e => setGrade(e.target.value)}
          >
            <option value="">Select Class</option>
            {(GS.CLASSES || []).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <input
            type="date"
            className="form-control"
            style={{ width:"auto" }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          {loading && (
            <span className="spinner" style={{ width:20, height:20, borderWidth:2 }} />
          )}
        </div>
      </div>

      <div className="card-body">

        {/* ── Search bar ── */}
        {grade && students.length > 0 && !loading && (
          <div style={{ marginBottom:14 }}>
            <input
              type="text"
              className="form-control"
              placeholder={`🔍 Search student in ${grade}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth:320 }}
            />
          </div>
        )}

        <p style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>
          Tick what each student consumed then click{" "}
          <strong style={{ color:"var(--light)" }}>Process All</strong>.
          🚫 = already recorded today. 🔥 = frequent eater.
        </p>

        {/* ── Empty states ── */}
        {!grade && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Select a class to load students</p>
          </div>
        )}

        {grade && loading && (
          <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--muted)" }}>
            <div className="spinner" style={{ width:36, height:36, borderWidth:3, margin:"0 auto 12px" }} />
            <div style={{ fontSize:13 }}>Loading {grade}...</div>
          </div>
        )}

        {grade && !loading && students.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>No students in {grade}</p>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && displayStudents.length > 0 && (
          <div className="bulk-scroll-wrap">

            {/* Column headers */}
            <div className="bulk-row header">
              <div>Student</div>
              <div>Type</div>
              <div className="bulk-header-cell">
                <div className="cell-icon">🍽️</div>
                <div className="cell-label label-lunch">Lunch</div>
                <div className="cell-price">KES 50</div>
              </div>
              <div className="bulk-header-cell">
                <div className="cell-icon">☕</div>
                <div className="cell-label label-tea">Tea</div>
                <div className="cell-price">KES 15</div>
              </div>
              <div className="bulk-header-cell">
                <div className="cell-icon">🌾</div>
                <div className="cell-label label-porridge">Porridge</div>
                <div className="cell-price">KES 10</div>
              </div>
              <div style={{ textAlign:"right" }}>Cost</div>
              <div style={{ textAlign:"right" }}>Status</div>
            </div>

            {/* Student rows */}
            <div id="bulk-rows">
              {displayStudents.map((s, idx) => {
                const c      = { ...checks[s.admNo] || {}, _admNo: s.admNo };
                const cost   = costFor(s.admNo);
                const status = rowStatus(s);
                const t      = TYPES[s.type] || TYPES["0"];
                const bal    = s.balance || 0;
                const meals  = (window.allTxHistory && window.allTxHistory[s.admNo]) || 0;
                const flame  = meals > 10 ? "🔥 " : "";
                const balCls = bal >= 0 ? "text-success" : "text-danger";
                const isDone = !!done[s.admNo];

                return (
                  <div
                    key={s.admNo}
                    id={`bulk-row-${idx}`}
                    className={`bulk-row${isDone ? " done" : ""}`}
                  >
                    {/* Student name + balance */}
                    <div>
                      <div className="bulk-student-name">{flame}{s.name}</div>
                      <div className="bulk-student-meta">
                        <span className={`text-mono ${balCls}`}>{bulkFmtBal(bal)}</span>
                        {meals > 0 ? ` · ${meals} meal${meals !== 1 ? "s" : ""}` : " · no meals yet"}
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="bulk-type-badge">
                      <span className="badge" style={{
                        background: `${t.color}20`, color: t.color,
                        border: `1px solid ${t.color}40`, fontSize: 11
                      }}>
                        {s.type} · {t.label}
                      </span>
                    </div>

                    {/* Food */}
                    <div style={{ textAlign:"center" }}>
                      {c.foodLocked
                        ? <span title="Already recorded today" style={{ fontSize:18 }}>🚫</span>
                        : <input type="checkbox" className="gs-cb"
                            checked={!!c.food} disabled={isDone}
                            onChange={() => toggle(s.admNo, "food")} />
                      }
                    </div>

                    {/* Tea */}
                    <div style={{ textAlign:"center" }}>
                      {c.teaLocked
                        ? <span title="Already recorded today" style={{ fontSize:18 }}>🚫</span>
                        : <input type="checkbox" className="gs-cb"
                            checked={!!c.tea} disabled={isDone}
                            onChange={() => toggle(s.admNo, "tea")} />
                      }
                    </div>

                    {/* Porridge */}
                    <div style={{ textAlign:"center" }}>
                      {c.porridgeLocked
                        ? <span title="Already recorded today" style={{ fontSize:18 }}>🚫</span>
                        : <input type="checkbox" className="gs-cb"
                            checked={!!c.porridge} disabled={isDone}
                            onChange={() => toggle(s.admNo, "porridge")} />
                      }
                    </div>

                    {/* Cost */}
                    <div className="bulk-cost" id={`bulk-cost-${idx}`} style={{ textAlign:"right" }}>
                      {cost > 0 ? `KES ${cost}` : "—"}
                    </div>

                    {/* Status */}
                    <div style={{ textAlign:"right" }} id={`bulk-status-${idx}`}>
                      {status === "done"    && <span className="bulk-status-done">Done ✅</span>}
                      {status === "partial" && <span className="bulk-status-partial">Partial</span>}
                      {status === "pending" && <span className="bulk-status-pending">Pending</span>}
                    </div>

                    {/* ── Mobile card layout ── */}
                    <div className="bulk-checks">
                      {[
                        { field:"food",     lockedField:"foodLocked",     cls:"bulk-food-m",     icon:"🍽️", label:"Lunch",    labelCls:"check-label-lunch",    price:"KES 50" },
                        { field:"tea",      lockedField:"teaLocked",      cls:"bulk-tea-m",      icon:"☕",  label:"Tea",      labelCls:"check-label-tea",      price:"KES 15" },
                        { field:"porridge", lockedField:"porridgeLocked", cls:"bulk-porridge-m", icon:"🌾", label:"Porridge", labelCls:"check-label-porridge", price:"KES 10" },
                      ].map(item => (
                        <label key={item.field} className={`bulk-check-item${c[item.lockedField] ? " locked-item" : ""}`}>
                          <span className="check-icon">{item.icon}</span>
                          {c[item.lockedField]
                            ? <span title="Already recorded today" style={{ fontSize:18 }}>🚫</span>
                            : <input type="checkbox" className={`${item.cls} gs-cb`}
                                checked={!!c[item.field]} disabled={isDone}
                                onChange={() => toggle(s.admNo, item.field)} />
                          }
                          <span className={`check-label ${item.labelCls}`}>{item.label}</span>
                          <span className="check-price">{item.price}</span>
                        </label>
                      ))}

                      {/* Mobile cost + status footer */}
                      <div className="bulk-footer-row">
                        <span className="bulk-cost" id={`bulk-cost-m-${idx}`}>
                          {cost > 0 ? `KES ${cost}` : "—"}
                        </span>
                        <span id={`bulk-status-m-${idx}`}>
                          {status === "done"    && <span className="bulk-status-done">Done ✅</span>}
                          {status === "partial" && <span className="bulk-status-partial">Partial</span>}
                          {status === "pending" && <span className="bulk-status-pending">Pending</span>}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Process All footer ── */}
        {!loading && students.length > 0 && (
          <div id="bulk-footer" style={{ marginTop:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:12, color:"var(--muted)" }}>
              {pendingList.length > 0
                ? `${pendingList.length} student${pendingList.length !== 1 ? "s" : ""} pending`
                : "All students recorded ✓"
              }
            </span>
            <button
              className="btn btn-primary"
              id="bulk-process-btn"
              onClick={onProcessAll}
              disabled={pendingList.length === 0 || preparing}
              style={{ display:"flex", alignItems:"center", gap:8 }}
            >
              {preparing
                ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Preparing...</>
                : <>✅ Process All (<span id="pending-count">{pendingList.length}</span> pending)</>
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}