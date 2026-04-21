// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// record-events.js — All Event Listeners
// Loaded LAST so all functions from other files already exist
// ============================================================

window.addEventListener("load", function () {

  // ── Tab buttons ─────────────────────────────────────────────
  document.getElementById("tbtn-payment")
    .addEventListener("click", function () { switchTab("payment"); });

  document.getElementById("tbtn-meal")
    .addEventListener("click", function () { switchTab("meal"); });

  document.getElementById("tbtn-bulk")
    .addEventListener("click", function () { switchTab("bulk"); });

  // ── Payment search input ─────────────────────────────────────
  document.getElementById("pay-search")
    .addEventListener("input", function () {
      searchStudents("pay", this.value);
    });

  // ── Meal search input ────────────────────────────────────────
  document.getElementById("meal-search")
    .addEventListener("input", function () {
      searchStudents("meal", this.value);
    });

  // ── Payment amount — live preview ────────────────────────────
  document.getElementById("pay-amount")
    .addEventListener("input", updatePayPreview);

  // ── Payment confirm button ───────────────────────────────────
  document.getElementById("pay-btn")
    .addEventListener("click", submitPayment);

  // ── Meal checkboxes — live preview ───────────────────────────
  document.getElementById("meal-food")
    .addEventListener("change", updateMealPreview);

  document.getElementById("meal-tea")
    .addEventListener("change", updateMealPreview);

  document.getElementById("meal-porridge")
    .addEventListener("change", updateMealPreview);

  // ── Meal confirm button ──────────────────────────────────────
  document.getElementById("meal-btn")
    .addEventListener("click", showMealConfirm);

  // ── Meal modal buttons ───────────────────────────────────────
  document.getElementById("meal-modal-cancel")
    .addEventListener("click", closeMealModal);

  document.getElementById("meal-modal-cancel-2")
    .addEventListener("click", closeMealModal);

  document.getElementById("meal-modal-confirm")
    .addEventListener("click", submitMeal);

  // ── Bulk class dropdown ──────────────────────────────────────
  document.getElementById("bulk-grade")
    .addEventListener("change", loadBulkClass);

  // ── Bulk process button ──────────────────────────────────────
  document.getElementById("bulk-process-btn")
    .addEventListener("click", processBulk);

  // ── Bulk modal buttons ───────────────────────────────────────
  document.getElementById("bulk-modal-close")
    .addEventListener("click", skipBulkStudent);

  document.getElementById("bulk-modal-skip")
    .addEventListener("click", skipBulkStudent);

  document.getElementById("bulk-modal-confirm")
    .addEventListener("click", confirmBulkStudent);

  // ── Close dropdowns when clicking outside ───────────────────
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-wrap")) {
      document.querySelectorAll(".autocomplete-list")
        .forEach(function (d) { d.classList.remove("open"); });
    }
  });

});