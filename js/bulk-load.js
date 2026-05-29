// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// bulk-load.js — Shared state, data loading, class dropdown
// Depends on: config.js, sheets.js, record-init.js
// ============================================================

// ── Shared state (read by bulk-ui.js and bulk-process.js) ────
var bulkStudents   = [];
var bulkQueue      = [];
var bulkIndex      = 0;
var _lastBulkGrade = "";
var _lastConfirmed = null;   // stores last confirmed entry for undo

// ── Populate class dropdown on page load ─────────────────────
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

// ── Load class + already-recorded meals for selected date ─────
async function loadBulkClass() {
  var gradeEl   = document.getElementById("bulk-grade");
  var dateEl    = document.getElementById("bulk-date");
  var container = document.getElementById("bulk-rows");
  var footer    = document.getElementById("bulk-footer");
  var searchEl  = document.getElementById("bulk-search");
  var searchBar = document.getElementById("bulk-search-bar");
  var counter   = document.getElementById("bulk-counter");

  var grade = gradeEl ? gradeEl.value : "";
  var date  = dateEl  ? dateEl.value  : Sheets.today();

  // Reset search and counter on every reload
  if (searchEl)  searchEl.value          = "";
  if (searchBar) searchBar.style.display = "none";
  if (counter)   counter.style.display   = "none";

  if (!grade) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div>' +
      '<p>Select a class to load students</p></div>';
    if (footer) footer.style.display = "none";
    return;
  }

  var isDateChange = (grade === _lastBulkGrade);
  _lastBulkGrade   = grade;

  // Loading indicator
  if (isDateChange) {
    container.innerHTML =
      '<div style="text-align:center;padding:32px 20px">' +
        '<div class="spinner" style="width:28px;height:28px;border-width:3px;margin:0 auto 12px"></div>' +
        '<div style="font-size:13px;color:var(--muted)">Loading ' + grade + ' for ' + date + '...</div>' +
      '</div>';
  } else {
    await bulkCountdown(container, grade, date);
  }

  // Filter to this class
  bulkStudents = allStudents.filter(function (s) {
    return s.displayGrade === grade;
  });

  if (bulkStudents.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">👤</div>' +
      '<p>No students in ' + grade + '</p></div>';
    if (footer) footer.style.display = "none";
    _lastBulkGrade = "";
    return;
  }

  // Sort by meal frequency — daily eaters first, tie-break by adm number
  bulkStudents.sort(function (a, b) {
    var mealsA = allTxHistory[a.admNo] || 0;
    var mealsB = allTxHistory[b.admNo] || 0;
    if (mealsB !== mealsA) return mealsB - mealsA;
    return Number(a.admNo) - Number(b.admNo);
  });

  // Fetch transactions to find what's already recorded on this date
  var recorded = {};
  try {
    var txRes = await Sheets.getTransactions();
    (txRes.transactions || []).forEach(function (tx) {
      if (tx.type !== "MEAL" || tx.date !== date) return;
      var key = String(tx.admNo);
      if (!recorded[key]) recorded[key] = { food: false, tea: false, porridge: false };
      if (tx.food     === "YES") recorded[key].food     = true;
      if (tx.tea      === "YES") recorded[key].tea      = true;
      if (tx.porridge === "YES") recorded[key].porridge = true;
    });
  } catch (e) { /* proceed without pre-fill */ }

  renderBulkRows(recorded);
  if (footer) footer.style.display = "block";
  updateBulkCounter();

  if (isDateChange) {
    var d     = new Date(date + "T00:00:00");
    var label = d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
    showToast("Loaded " + grade + " · " + label, "success");
  }
}