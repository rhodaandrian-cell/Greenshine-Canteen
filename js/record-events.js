// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// record-events.js — All Event Listeners
// Loaded LAST — wires HTML elements to JS functions
// ============================================================

window.addEventListener("load", function () {

  // Safe attach — skips silently if element missing
  function on(id, event, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  }

  // ── Tabs ──────────────────────────────────────────────────
  on("tbtn-payment", "click", function () { switchTab("payment"); });
  on("tbtn-bulk",    "click", function () { switchTab("bulk");    });

  // ── Payment ───────────────────────────────────────────────
  on("pay-search", "input",  function () { searchStudents("pay", this.value); });
  on("pay-amount", "input",  function () { updatePayPreview(); });
  on("pay-btn",    "click",  function () { submitPayment(); });

  // ── Bulk ──────────────────────────────────────────────────
  // Removed: loadBulkClass, processBulk, skipBulkStudent,
  //          confirmBulkStudent, bulk-modal events.
  //          React (BulkDailyRecord.jsx) handles all of this now.

  // ── Close dropdowns on outside click ─────────────────────
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-wrap")) {
      document.querySelectorAll(".autocomplete-list").forEach(function (d) {
        d.classList.remove("open");
      });
    }
  });

});