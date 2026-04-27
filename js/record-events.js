// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// record-events.js — All Event Listeners
// Loaded LAST — wires HTML elements to JS functions
// ============================================================

window.addEventListener("load", function () {

  // Helper — safely attach listener, skip if element missing
  function on(id, event, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  }

  // ── Tab buttons ───────────────────────────────────────────
  on("tbtn-payment", "click", function () { switchTab("payment"); });
  on("tbtn-meal",    "click", function () { switchTab("meal");    });
  on("tbtn-bulk",    "click", function () { switchTab("bulk");    });

  // ── Payment search ────────────────────────────────────────
  on("pay-search", "input", function () {
    searchStudents("pay", this.value);
  });

  // ── Payment amount — live preview ─────────────────────────
  on("pay-amount", "input", updatePayPreview);

  // ── Payment confirm ───────────────────────────────────────
  on("pay-btn", "click", submitPayment);

  // ── Meal search ───────────────────────────────────────────
  on("meal-search", "input", function () {
    searchStudents("meal", this.value);
  });

  // ── Meal checkboxes — live preview ────────────────────────
  on("meal-food",     "change", updateMealPreview);
  on("meal-tea",      "change", updateMealPreview);
  on("meal-porridge", "change", updateMealPreview);

  // ── Meal confirm button ───────────────────────────────────
  on("meal-btn", "click", showMealConfirm);

  // ── Meal modal ────────────────────────────────────────────
  on("meal-modal-cancel",   "click", closeMealModal);
  on("meal-modal-cancel-2", "click", closeMealModal);
  on("meal-modal-confirm",  "click", submitMeal);

  // ── Bulk class dropdown ───────────────────────────────────
  on("bulk-grade", "change", loadBulkClass);

  // ── Bulk process button ───────────────────────────────────
  on("bulk-process-btn", "click", processBulk);

  // ── Bulk modal ────────────────────────────────────────────
  on("bulk-modal-close",   "click", skipBulkStudent);
  on("bulk-modal-skip",    "click", skipBulkStudent);
  on("bulk-modal-confirm", "click", confirmBulkStudent);

  // ── Close dropdowns on outside click ─────────────────────
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-wrap")) {
      document.querySelectorAll(".autocomplete-list").forEach(function (d) {
        d.classList.remove("open");
      });
    }
  });

});