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
  on("tbtn-meal",    "click", function () { switchTab("meal");    });
  on("tbtn-bulk",    "click", function () { switchTab("bulk");    });

  // ── Payment ───────────────────────────────────────────────
  on("pay-search", "input",  function () { searchStudents("pay", this.value); });
  on("pay-amount", "input",  function () { updatePayPreview(); });
  on("pay-btn",    "click",  function () { submitPayment(); });

  // ── Meal ──────────────────────────────────────────────────
  on("meal-search",   "input",  function () { searchStudents("meal", this.value); });
  on("meal-food",     "change", function () { updateMealPreview(); });
  on("meal-tea",      "change", function () { updateMealPreview(); });
  on("meal-porridge", "change", function () { updateMealPreview(); });
  on("meal-btn",      "click",  function () { showMealConfirm(); });

  // ── Meal modal ────────────────────────────────────────────
  on("meal-modal-cancel",   "click", function () { closeMealModal(); });
  on("meal-modal-cancel-2", "click", function () { closeMealModal(); });
  on("meal-modal-confirm",  "click", function () { submitMeal(); });

  // ── Bulk ──────────────────────────────────────────────────
  on("bulk-grade",       "change", function () { loadBulkClass(); });
  on("bulk-process-btn", "click",  function () { processBulk(); });

  // ── Bulk modal ────────────────────────────────────────────
  on("bulk-modal-close",   "click", function () { skipBulkStudent(); });
  on("bulk-modal-skip",    "click", function () { skipBulkStudent(); });
  on("bulk-modal-confirm", "click", function () { confirmBulkStudent(); });

  // ── Close dropdowns on outside click ─────────────────────
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-wrap")) {
      document.querySelectorAll(".autocomplete-list").forEach(function (d) {
        d.classList.remove("open");
      });
    }
  });

});