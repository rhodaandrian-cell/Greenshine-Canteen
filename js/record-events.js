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
  // tbtn-meal removed — single meal tab has been removed

  // ── Payment ───────────────────────────────────────────────
  on("pay-search", "input",  function () { searchStudents("pay", this.value); });
  on("pay-amount", "input",  function () { updatePayPreview(); });
  on("pay-btn",    "click",  function () { submitPayment(); });

  // ── Bulk ──────────────────────────────────────────────────
  on("bulk-grade",       "change", function () { loadBulkClass(); });
  on("bulk-process-btn", "click",  async function () { await processBulk(); });

  // ── Bulk date: if a class is already selected, reload it ──
  on("bulk-date", "change", function () {
    var gradeEl = document.getElementById("bulk-grade");
    if (gradeEl && gradeEl.value) {
      loadBulkClass();
    }
  });

  // ── Bulk modal ────────────────────────────────────────────
  on("bulk-modal-close",   "click", async function () { await skipBulkStudent(); });
  on("bulk-modal-skip",    "click", async function () { await skipBulkStudent(); });
  on("bulk-modal-confirm", "click", async function () { await confirmBulkStudent(); });

  // ── Close dropdowns on outside click ─────────────────────
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-wrap")) {
      document.querySelectorAll(".autocomplete-list").forEach(function (d) {
        d.classList.remove("open");
      });
    }
  });

});