// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// bulk-process.js — Confirmation queue, modal, undo logic
// Depends on: config.js, sheets.js, bulk-load.js, bulk-ui.js
// ============================================================

// ── Build queue and kick off processing ──────────────────────
async function processBulk() {
  bulkQueue = [];

  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (st && st.querySelector(".bulk-status-done")) return;

    var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (!f) return;

    var fC   = f.checked  && !f.disabled;
    var tC   = t && t.checked  && !t.disabled;
    var pC   = p && p.checked  && !p.disabled;
    var cost = (fC ? 50 : 0) + (tC ? 15 : 0) + (pC ? 10 : 0);
    if (cost > 0) bulkQueue.push({ s: s, idx: idx, food: fC, tea: tC, porridge: pC, cost: cost });
  });

  if (bulkQueue.length === 0) {
    showToast("No items ticked", "warning");
    return;
  }

  bulkIndex = 0;
  showBulkModal();
}

// ── Show confirm modal for current queue item ─────────────────
// No API calls here — opens instantly
function showBulkModal() {
  var modalEl   = document.getElementById("bulk-modal");
  var titleEl   = document.getElementById("bulk-modal-title");
  var contentEl = document.getElementById("bulk-modal-content");
  if (!modalEl || !titleEl || !contentEl) return;

  if (bulkIndex >= bulkQueue.length) {
    modalEl.classList.remove("open");
    showToast(
      "Bulk record complete! " + bulkQueue.length +
      " student" + (bulkQueue.length !== 1 ? "s" : "") + " processed.",
      "success"
    );
    return;
  }

  var entry = bulkQueue[bulkIndex];
  var s     = entry.s;
  var cost  = entry.cost;
  var bal   = s.balance || 0;
  var after = bal - cost;

  var items = [
    entry.food     ? '<span class="badge badge-food">🍽️ Lunch</span>'       : "",
    entry.tea      ? '<span class="badge badge-tea">☕ Tea</span>'           : "",
    entry.porridge ? '<span class="badge badge-porridge">🌾 Porridge</span>' : ""
  ].filter(Boolean).join(" ");

  // Overeat warning if all three ticked
  var overeatWarn = (entry.food && entry.tea && entry.porridge)
    ? '<div style="margin-top:8px;padding:8px 10px;background:rgba(243,156,18,0.1);' +
      'border:1px solid rgba(243,156,18,0.3);border-radius:6px;font-size:12px;color:var(--warning)">' +
      '⚠️ All three items — confirm this is correct.</div>'
    : "";

  titleEl.textContent = "Confirm — " + s.name + " (" + (bulkIndex + 1) + " of " + bulkQueue.length + ")";

  contentEl.innerHTML =
    '<div style="font-size:14px;line-height:1.8">' +
      '<div style="font-weight:600">' + s.name + '</div>' +
      '<div style="color:var(--muted);font-size:13px">' + s.displayGrade + '</div>' +
      '<div style="margin:8px 0">' + items + '</div>' +
      '<div class="deduction-summary">' +
        '<div class="deduction-row"><span>Deduction</span>' +
          '<span class="text-warning text-mono">− KES ' + cost + '</span></div>' +
        '<div class="deduction-row"><span>Current Balance</span>' +
          '<span class="text-mono ' + (bal >= 0 ? "text-success" : "text-danger") + '">' +
          Sheets.formatBalance(bal) + '</span></div>' +
        '<div class="deduction-row total"><span>Balance After</span>' +
          '<span class="text-mono ' + (after >= 0 ? "text-success" : "text-danger") + '">' +
          Sheets.formatBalance(after) + '</span></div>' +
      '</div>' +
      overeatWarn +
      balanceWarningHtml(bal, cost) +
      '<div style="margin-top:10px;color:var(--muted);font-size:13px">Did ' +
        '<strong style="color:var(--light)">' + s.name + '</strong> eat/drink these today?' +
      '</div>' +
    '</div>';

  modalEl.classList.add("open");
}

// ── Confirm — record to Sheets, blur row, show undo toast ─────
async function confirmBulkStudent() {
  var entry      = bulkQueue[bulkIndex];
  var s          = entry.s;
  var idx        = entry.idx;
  var confirmBtn = document.getElementById("bulk-modal-confirm");
  var skipBtn    = document.getElementById("bulk-modal-skip");
  var closeBtn   = document.getElementById("bulk-modal-close");
  var modalEl    = document.getElementById("bulk-modal");

  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = "Recording..."; }
  if (skipBtn)    skipBtn.disabled = true;
  if (closeBtn)   closeBtn.disabled = true;

  var itemsText = [
    entry.food     ? "Lunch"    : "",
    entry.tea      ? "Tea"      : "",
    entry.porridge ? "Porridge" : ""
  ].filter(Boolean).join(", ");

  try {
    var res = await Sheets.recordMeal({
      admNo      : s.admNo,
      name       : s.name,
      grade      : s.grade,
      food       : entry.food,
      tea        : entry.tea,
      porridge   : entry.porridge,
      date       : document.getElementById("bulk-date").value || Sheets.today(),
      recordedBy : ADMIN_NAME
    });

    // Save for undo
    _lastConfirmed = {
      entry      : entry,
      idx        : idx,
      txRowIndex : res.rowIndex || null,
      newBalance : res.newBalance,
      oldBalance : s.balance || 0,
      oldType    : s.type
    };

    // Blur row immediately
    var done  = '<span class="bulk-status-done">Done ✅</span>';
    var stEl  = document.getElementById("bulk-status-"   + idx);
    var stElM = document.getElementById("bulk-status-m-" + idx);
    if (stEl)  stEl.innerHTML  = done;
    if (stElM) stElM.innerHTML = done;
    var rowEl = document.getElementById("bulk-row-" + idx);
    if (rowEl) {
      rowEl.classList.add("done");
      rowEl.style.removeProperty("background");
      rowEl.style.removeProperty("border-left");
    }

    // Update local state
    allTxHistory[s.admNo] = (allTxHistory[s.admNo] || 0) + 1;
    var found = allStudents.find(function (a) { return String(a.admNo) === String(s.admNo); });
    if (found) { found.balance = res.newBalance; found.type = res.type; }
    s.balance = res.newBalance;
    s.type    = res.type;

    updateBulkCounter();

    // Re-enable buttons, close modal
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
    if (skipBtn)    skipBtn.disabled = false;
    if (closeBtn)   closeBtn.disabled = false;
    modalEl.classList.remove("open");

    // Undo toast runs independently — next modal opens immediately
    showUndoToast(s.name, itemsText);
    bulkIndex++;
    showBulkModal();

  } catch (err) {
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
    if (skipBtn)    skipBtn.disabled = false;
    if (closeBtn)   closeBtn.disabled = false;
    showToast("Error for " + s.name + ": " + err.message, "error");
  }
}

// ── Skip current student ──────────────────────────────────────
function skipBulkStudent() {
  bulkIndex++;
  var confirmBtn = document.getElementById("bulk-modal-confirm");
  var skipBtn    = document.getElementById("bulk-modal-skip");
  var closeBtn   = document.getElementById("bulk-modal-close");
  if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
  if (skipBtn)    skipBtn.disabled = false;
  if (closeBtn)   closeBtn.disabled = false;
  showBulkModal();
}

// ── Undo toast — 5-second window, independent of queue ───────
function showUndoToast(name, items) {
  var container = document.getElementById("toast-container");
  if (!container) return;

  var toastId = "undo-toast-" + Date.now();
  var el      = document.createElement("div");
  el.id        = toastId;
  el.className = "toast";
  el.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;" +
    "gap:12px;min-width:260px;border-color:var(--success)";

  el.innerHTML =
    '<span style="font-size:13px">✅ <strong>' + name + '</strong> — ' + items + '</span>' +
    '<button id="' + toastId + '-btn" style="background:var(--secondary);color:white;' +
      'border:none;border-radius:4px;padding:4px 10px;font-size:12px;font-weight:600;' +
      'cursor:pointer;flex-shrink:0">Undo</button>';

  container.appendChild(el);

  document.getElementById(toastId + "-btn").addEventListener("click", function () {
    el.remove();
    doUndo();
  });

  setTimeout(function () { if (el.parentNode) el.remove(); }, 5000);
}

// ── Execute undo — reverse the last confirmed meal ────────────
async function doUndo() {
  if (!_lastConfirmed) return;

  var lc  = _lastConfirmed;
  var s   = lc.entry.s;
  var idx = lc.idx;

  try {
    await Sheets.undoMeal({
      admNo      : s.admNo,
      name       : s.name,
      grade      : s.grade,
      amount     : lc.entry.cost,
      rowIndex   : lc.txRowIndex,
      oldBalance : lc.oldBalance,
      oldType    : lc.oldType
    });

    // Reset row to Pending
    var rowEl = document.getElementById("bulk-row-" + idx);
    if (rowEl) rowEl.classList.remove("done");

    var stEl  = document.getElementById("bulk-status-"   + idx);
    var stElM = document.getElementById("bulk-status-m-" + idx);
    var pe    = '<span class="bulk-status-pending">Pending</span>';
    if (stEl)  stEl.innerHTML  = pe;
    if (stElM) stElM.innerHTML = pe;

    // Untick all checkboxes
    ["bulk-food", "bulk-tea", "bulk-porridge",
     "bulk-food-m", "bulk-tea-m", "bulk-porridge-m"].forEach(function (cls) {
      var cb = document.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (cb) { cb.checked = false; cb.disabled = false; cb.style.opacity = ""; cb.style.cursor = ""; }
    });

    var costEl  = document.getElementById("bulk-cost-"   + idx);
    var costElM = document.getElementById("bulk-cost-m-" + idx);
    if (costEl)  costEl.textContent  = "KES 0";
    if (costElM) costElM.textContent = "KES 0";

    // Restore local state
    allTxHistory[s.admNo] = Math.max(0, (allTxHistory[s.admNo] || 1) - 1);
    var found = allStudents.find(function (a) { return String(a.admNo) === String(s.admNo); });
    if (found) { found.balance = lc.oldBalance; found.type = lc.oldType; }
    s.balance = lc.oldBalance;
    s.type    = lc.oldType;

    _lastConfirmed = null;
    updateBulkCounter();
    showToast("Undone — " + s.name + " reset to Pending", "success");

  } catch (err) {
    showToast("Undo failed: " + err.message, "error");
  }
}