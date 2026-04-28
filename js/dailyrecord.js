// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// dailyrecord.js — Bulk Daily Record Tab Logic
// Depends on: record-init.js (allStudents, allTxHistory, ADMIN_NAME, showToast, balanceWarningHtml, buildDuplicateWarning)
// ============================================================

var bulkStudents = [];
var bulkQueue    = [];
var bulkIndex    = 0;

// ── Populate class dropdown on load ──────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  var sel = document.getElementById("bulk-grade");
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  GREENSHINE.CLASSES.forEach(function (c) {
    var opt         = document.createElement("option");
    opt.value       = c.value;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
});

// ── Load students for selected class ─────────────────────────
function loadBulkClass() {
  var grade     = document.getElementById("bulk-grade").value;
  var container = document.getElementById("bulk-rows");
  var footer    = document.getElementById("bulk-footer");

  if (!grade) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Select a class to load students</p></div>';
    if (footer) footer.style.display = "none";
    return;
  }

  container.innerHTML = '<div class="loading"><div class="spinner"></div> Loading ' + grade + '...</div>';

  bulkStudents = allStudents.filter(function (s) {
    return s.displayGrade === grade;
  });

  if (bulkStudents.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><p>No students in ' + grade + '</p></div>';
    if (footer) footer.style.display = "none";
    return;
  }

  // Sort: most meals first
  bulkStudents.sort(function (a, b) {
    return (allTxHistory[b.admNo] || 0) - (allTxHistory[a.admNo] || 0);
  });

  renderBulkRows();
  if (footer) footer.style.display = "block";
  updatePendingCount();
}

// ── Render student rows ───────────────────────────────────────
function renderBulkRows() {
  var container = document.getElementById("bulk-rows");
  if (!container) return;

  var html = "";
  bulkStudents.forEach(function (s, idx) {
    var t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    var bal    = s.balance || 0;
    var meals  = allTxHistory[s.admNo] || 0;
    var flame  = meals > 10 ? "🔥 " : "";
    var balCls = bal >= 0 ? "text-success" : "text-danger";

    html +=
      '<div class="bulk-row" id="bulk-row-' + idx + '">' +
        '<div>' +
          '<div class="bulk-student-name">' + flame + s.name + '</div>' +
          '<div class="bulk-student-meta">' +
            '<span class="text-mono ' + balCls + '">' + Sheets.formatBalance(bal) + '</span>' +
            (meals > 0 ? ' · ' + meals + ' meal' + (meals !== 1 ? 's' : '') : ' · no meals yet') +
          '</div>' +
        '</div>' +
        '<div class="bulk-type-badge">' +
          '<span class="badge" style="background:' + t.color + '20;color:' + t.color + ';border:1px solid ' + t.color + '40;font-size:11px">' + s.type + '</span>' +
        '</div>' +
        '<div style="text-align:center"><input type="checkbox" class="bulk-food" data-idx="' + idx + '"/></div>' +
        '<div style="text-align:center"><input type="checkbox" class="bulk-tea" data-idx="' + idx + '"/></div>' +
        '<div style="text-align:center"><input type="checkbox" class="bulk-porridge" data-idx="' + idx + '"/></div>' +
        '<div class="bulk-cost" id="bulk-cost-' + idx + '">KES 0</div>' +
        '<div style="text-align:right"><span class="bulk-status-pending" id="bulk-status-' + idx + '">Pending</span></div>' +
        '<div class="bulk-checks">' +
          '<label class="bulk-check-item">' +
            '<span class="check-icon">🍽️</span>' +
            '<input type="checkbox" class="bulk-food-m" data-idx="' + idx + '"/>' +
            '<span class="check-label check-label-lunch">Lunch</span>' +
            '<span class="check-price">KES 50</span>' +
          '</label>' +
          '<label class="bulk-check-item">' +
            '<span class="check-icon">☕</span>' +
            '<input type="checkbox" class="bulk-tea-m" data-idx="' + idx + '"/>' +
            '<span class="check-label check-label-tea">Tea</span>' +
            '<span class="check-price">KES 15</span>' +
          '</label>' +
          '<label class="bulk-check-item">' +
            '<span class="check-icon">🌾</span>' +
            '<input type="checkbox" class="bulk-porridge-m" data-idx="' + idx + '"/>' +
            '<span class="check-label check-label-porridge">Porridge</span>' +
            '<span class="check-price">KES 10</span>' +
          '</label>' +
        '</div>' +
        '<div class="bulk-footer-row">' +
          '<span class="bulk-cost" id="bulk-cost-m-' + idx + '" style="color:var(--warning);font-family:var(--font-mono)">KES 0</span>' +
          '<span class="bulk-status-pending" id="bulk-status-m-' + idx + '">Pending</span>' +
        '</div>' +
      '</div>';
  });

  container.innerHTML = html;

  // Attach checkbox listeners
  bulkStudents.forEach(function (s, idx) {
    ["bulk-food", "bulk-tea", "bulk-porridge"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el) el.addEventListener("change", function () { syncMobileCheckbox(idx); updateBulkCost(idx); });
    });
    ["bulk-food-m", "bulk-tea-m", "bulk-porridge-m"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el) el.addEventListener("change", function () { syncDesktopCheckbox(idx); updateBulkCost(idx); });
    });
  });
}

// ── Sync checkboxes ───────────────────────────────────────────
function syncDesktopCheckbox(idx) {
  [["bulk-food-m","bulk-food"],["bulk-tea-m","bulk-tea"],["bulk-porridge-m","bulk-porridge"]].forEach(function(p) {
    var m = document.querySelector("." + p[0] + '[data-idx="' + idx + '"]');
    var d = document.querySelector("." + p[1] + '[data-idx="' + idx + '"]');
    if (m && d) d.checked = m.checked;
  });
}

function syncMobileCheckbox(idx) {
  [["bulk-food","bulk-food-m"],["bulk-tea","bulk-tea-m"],["bulk-porridge","bulk-porridge-m"]].forEach(function(p) {
    var d = document.querySelector("." + p[0] + '[data-idx="' + idx + '"]');
    var m = document.querySelector("." + p[1] + '[data-idx="' + idx + '"]');
    if (d && m) m.checked = d.checked;
  });
}

// ── Update cost ───────────────────────────────────────────────
function updateBulkCost(idx) {
  var f = document.querySelector('.bulk-food[data-idx="' + idx + '"]');
  var t = document.querySelector('.bulk-tea[data-idx="' + idx + '"]');
  var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
  if (!f) return;
  var cost = (f.checked ? 50 : 0) + (t && t.checked ? 15 : 0) + (p && p.checked ? 10 : 0);
  var el  = document.getElementById("bulk-cost-" + idx);
  var elm = document.getElementById("bulk-cost-m-" + idx);
  if (el)  el.textContent  = "KES " + cost;
  if (elm) elm.textContent = "KES " + cost;
  updatePendingCount();
}

// ── Count pending ─────────────────────────────────────────────
function updatePendingCount() {
  var pending = 0;
  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (!st || st.classList.contains("bulk-status-done")) return;
    var f = document.querySelector('.bulk-food[data-idx="' + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="' + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (f && (f.checked || (t && t.checked) || (p && p.checked))) pending++;
  });
  var el = document.getElementById("pending-count");
  if (el) el.textContent = pending;
}

// ── Build queue and start ─────────────────────────────────────
async function processBulk() {
  bulkQueue = [];
  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (st && st.classList.contains("bulk-status-done")) return;
    var f  = document.querySelector('.bulk-food[data-idx="' + idx + '"]');
    var t  = document.querySelector('.bulk-tea[data-idx="' + idx + '"]');
    var p  = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (!f) return;
    var fC = f.checked, tC = t && t.checked, pC = p && p.checked;
    var cost = (fC ? 50 : 0) + (tC ? 15 : 0) + (pC ? 10 : 0);
    if (cost > 0) bulkQueue.push({ s:s, idx:idx, food:fC, tea:tC, porridge:pC, cost:cost });
  });

  if (bulkQueue.length === 0) {
    showToast("No items ticked — tick what each student consumed first", "warning");
    return;
  }

  bulkIndex = 0;
  await showBulkModal();
}

// ── Show confirm modal ────────────────────────────────────────
async function showBulkModal() {
  var modalEl   = document.getElementById("bulk-modal");
  var titleEl   = document.getElementById("bulk-modal-title");
  var contentEl = document.getElementById("bulk-modal-content");
  if (!modalEl || !titleEl || !contentEl) return;

  // All done
  if (bulkIndex >= bulkQueue.length) {
    modalEl.classList.remove("open");
    showToast("Bulk record complete! " + bulkQueue.length + " student" + (bulkQueue.length !== 1 ? "s" : "") + " processed.", "success");
    return;
  }

  var entry = bulkQueue[bulkIndex];
  var s     = entry.s;
  var cost  = entry.cost;
  var bal   = s.balance || 0;
  var after = bal - cost;
  var date  = document.getElementById("bulk-date").value || Sheets.today();

  var items = [
    entry.food     ? '<span class="badge badge-food">🍽️ Lunch</span>'       : "",
    entry.tea      ? '<span class="badge badge-tea">☕ Tea</span>'           : "",
    entry.porridge ? '<span class="badge badge-porridge">🌾 Porridge</span>' : ""
  ].filter(Boolean).join(" ");

  // Check for duplicate meals — safely
  var dupWarn = "";
  try {
    dupWarn = await buildDuplicateWarning(s.admNo, s.name, date, entry.food, entry.tea, entry.porridge);
  } catch (e) {
    dupWarn = "";
  }

  titleEl.textContent = "Confirm — " + s.name + " (" + (bulkIndex + 1) + " of " + bulkQueue.length + ")";

  contentEl.innerHTML =
    '<div style="font-size:14px;line-height:1.8">' +
      '<div style="font-weight:600">' + s.name + '</div>' +
      '<div style="color:var(--muted);font-size:13px">' + s.displayGrade + '</div>' +
      '<div class="confirm-items" style="margin:8px 0">' + items + '</div>' +
      '<div class="deduction-summary">' +
        '<div class="deduction-row"><span>Deduction</span><span class="text-warning text-mono">- KES ' + cost + '</span></div>' +
        '<div class="deduction-row"><span>Current Balance</span><span class="text-mono ' + (bal >= 0 ? "text-success" : "text-danger") + '">' + Sheets.formatBalance(bal) + '</span></div>' +
        '<div class="deduction-row total"><span>Balance After</span><span class="text-mono ' + (after >= 0 ? "text-success" : "text-danger") + '">' + Sheets.formatBalance(after) + '</span></div>' +
      '</div>' +
      dupWarn +
      balanceWarningHtml(bal, cost) +
      '<div style="margin-top:10px;color:var(--muted);font-size:13px">Did <strong style="color:var(--light)">' + s.name + '</strong> actually eat/drink these today?</div>' +
    '</div>';

  modalEl.classList.add("open");
}

// ── Confirm student with loading countdown ────────────────────
async function confirmBulkStudent() {
  var entry      = bulkQueue[bulkIndex];
  var s          = entry.s;
  var idx        = entry.idx;
  var confirmBtn = document.getElementById("bulk-modal-confirm");
  var skipBtn    = document.getElementById("bulk-modal-skip");
  var closeBtn   = document.getElementById("bulk-modal-close");
  var contentEl  = document.getElementById("bulk-modal-content");

  // Disable buttons immediately — prevent double click
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = "Recording..."; }
  if (skipBtn)    skipBtn.disabled = true;
  if (closeBtn)   closeBtn.disabled = true;

  var items = [
    entry.food     ? "Lunch"    : "",
    entry.tea      ? "Tea"      : "",
    entry.porridge ? "Porridge" : ""
  ].filter(Boolean).join(", ");

  // Show loading + countdown
  var count = 1;
  var countEl = null;
  if (contentEl) {
    contentEl.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div class="spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 16px"></div>' +
        '<div style="font-size:14px;font-weight:600;color:var(--light);margin-bottom:8px">Recording ' + s.name + '...</div>' +
        '<div style="font-size:13px;color:var(--muted);margin-bottom:16px">' + items + '</div>' +
        '<div id="bulk-countdown" style="font-size:28px;font-weight:700;color:var(--accent)">1</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:6px">Please wait...</div>' +
      '</div>';
    countEl = document.getElementById("bulk-countdown");
  }

  var countInterval = setInterval(function () {
    count++;
    if (countEl) countEl.textContent = count;
  }, 1000);

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

    clearInterval(countInterval);

    // Show success
    if (contentEl) {
      contentEl.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
          '<div style="font-size:48px;margin-bottom:12px">✅</div>' +
          '<div style="font-size:15px;font-weight:600;color:var(--success)">' + s.name + ' recorded!</div>' +
          '<div style="font-size:13px;color:var(--muted);margin-top:6px">KES ' + entry.cost + ' deducted · ' + items + '</div>' +
        '</div>';
    }

    // Mark done
    var stEl  = document.getElementById("bulk-status-" + idx);
    var stElM = document.getElementById("bulk-status-m-" + idx);
    if (stEl)  { stEl.textContent  = "Done ✅"; stEl.className  = "bulk-status-done"; }
    if (stElM) { stElM.textContent = "Done ✅"; stElM.className = "bulk-status-done"; }
    var rowEl = document.getElementById("bulk-row-" + idx);
    if (rowEl) rowEl.classList.add("done");

    // Update local
    allTxHistory[s.admNo] = (allTxHistory[s.admNo] || 0) + 1;
    var found = allStudents.find(function (a) { return String(a.admNo) === String(s.admNo); });
    if (found) { found.balance = res.newBalance; found.type = res.type; }

    // Wait 1 second then next
    setTimeout(async function () {
      bulkIndex++;
      updatePendingCount();
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
      if (skipBtn)    skipBtn.disabled = false;
      if (closeBtn)   closeBtn.disabled = false;
      await showBulkModal();
    }, 1000);

  } catch (err) {
    clearInterval(countInterval);
    showToast("Error for " + s.name + ": " + err.message, "error");

    if (contentEl) {
      contentEl.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
          '<div style="font-size:48px;margin-bottom:12px">❌</div>' +
          '<div style="font-size:14px;color:var(--danger)">Failed to record ' + s.name + '.</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-top:8px">' + err.message + '</div>' +
          '<div style="font-size:13px;color:var(--muted);margin-top:12px">Try again or skip.</div>' +
        '</div>';
    }

    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
    if (skipBtn)    skipBtn.disabled = false;
    if (closeBtn)   closeBtn.disabled = false;
  }
}

// ── Skip student ──────────────────────────────────────────────
async function skipBulkStudent() {
  bulkIndex++;
  await showBulkModal();
}