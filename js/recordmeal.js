// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// recordmeal.js — Record Meal Tab Logic
// Depends on: record-init.js
// All students can eat regardless of balance — debt is recorded
// ============================================================

var mealStudent = null;

// ── Fill selected student bar ─────────────────────────────────
function selectMealStudent(s) {
  mealStudent   = s;
  var bal       = s.balance || 0;
  var t         = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];

  document.getElementById("meal-selected").style.display = "flex";
  document.getElementById("meal-s-name").textContent     = s.name;
  document.getElementById("meal-s-meta").textContent     =
    s.displayGrade + " · " + s.type + " · " + t.label;

  var balEl         = document.getElementById("meal-s-bal");
  balEl.textContent = Sheets.formatBalance(bal);
  balEl.className   = "s-bal " + (bal >= 0 ? "text-success" : "text-danger");

  updateMealPreview();
}

// ── Live deduction preview ────────────────────────────────────
function updateMealPreview() {
  var food     = document.getElementById("meal-food").checked;
  var tea      = document.getElementById("meal-tea").checked;
  var porridge = document.getElementById("meal-porridge").checked;
  var total    = (food ? 50 : 0) + (tea ? 15 : 0) + (porridge ? 10 : 0);

  document.getElementById("meal-prev-deduction").textContent = "KES " + total;

  if (mealStudent) {
    var bal   = mealStudent.balance || 0;
    var after = bal - total;

    document.getElementById("meal-prev-current").textContent = Sheets.formatBalance(bal);

    var afterEl         = document.getElementById("meal-prev-after");
    afterEl.textContent = Sheets.formatBalance(after);
    afterEl.className   =
      "text-mono " + (after >= 0 ? "text-success" : "text-danger");
  }

  // Enable button only if student selected and at least one item ticked
  document.getElementById("meal-btn").disabled = !mealStudent || total === 0;
}

// ── Build and open confirm modal ──────────────────────────────
async function showMealConfirm() {
  if (!mealStudent) return;

  var food     = document.getElementById("meal-food").checked;
  var tea      = document.getElementById("meal-tea").checked;
  var porridge = document.getElementById("meal-porridge").checked;
  var total    = (food ? 50 : 0) + (tea ? 15 : 0) + (porridge ? 10 : 0);

  if (total === 0) {
    showToast("Please tick at least one item", "warning");
    return;
  }

  // ── Check if student already ate any of these today ────────
  var date     = document.getElementById("meal-date").value || Sheets.today();
  var dupWarn  = await buildDuplicateWarning(mealStudent.admNo, mealStudent.name, date, food, tea, porridge);

  var bal   = mealStudent.balance || 0;
  var after = bal - total;

  var items = [
    food     ? '<span class="badge badge-food">🍽️ Lunch</span>'       : "",
    tea      ? '<span class="badge badge-tea">☕ Tea</span>'           : "",
    porridge ? '<span class="badge badge-porridge">🌾 Porridge</span>' : ""
  ].filter(Boolean).join(" ");

  document.getElementById("meal-modal-content").innerHTML =
    '<div style="font-size:14px;line-height:1.8">' +
      '<div style="font-weight:600;font-size:15px">' + mealStudent.name + '</div>' +
      '<div style="color:var(--muted);font-size:13px;margin-bottom:8px">' +
        mealStudent.displayGrade +
      '</div>' +
      '<div class="confirm-items">' + items + '</div>' +
      '<div class="deduction-summary" style="margin-top:12px">' +
        '<div class="deduction-row">' +
          '<span>Deduction</span>' +
          '<span class="text-warning text-mono">− KES ' + total + '</span>' +
        '</div>' +
        '<div class="deduction-row">' +
          '<span>Current Balance</span>' +
          '<span class="text-mono ' + (bal >= 0 ? "text-success" : "text-danger") + '">' +
            Sheets.formatBalance(bal) +
          '</span>' +
        '</div>' +
        '<div class="deduction-row total">' +
          '<span>Balance After</span>' +
          '<span class="text-mono ' + (after >= 0 ? "text-success" : "text-danger") + '">' +
            Sheets.formatBalance(after) +
          '</span>' +
        '</div>' +
      '</div>' +
      (dupWarn || "") +
      balanceWarningHtml(bal, total) +
      '<div style="margin-top:14px;color:var(--muted);font-size:13px">' +
        'Did <strong style="color:var(--light)">' + mealStudent.name +
        '</strong> actually eat/drink these today?' +
      '</div>' +
    '</div>';

  document.getElementById("meal-modal").classList.add("open");
}

// ── Close confirm modal ───────────────────────────────────────
function closeMealModal() {
  document.getElementById("meal-modal").classList.remove("open");
}

// ── Submit meal to Google Sheet ───────────────────────────────
async function submitMeal() {
  if (!mealStudent) return;

  var food     = document.getElementById("meal-food").checked;
  var tea      = document.getElementById("meal-tea").checked;
  var porridge = document.getElementById("meal-porridge").checked;
  var total    = (food ? 50 : 0) + (tea ? 15 : 0) + (porridge ? 10 : 0);

  if (total === 0) { showToast("No items selected", "warning"); return; }

  var date    = document.getElementById("meal-date").value || Sheets.today();
  var btn     = document.getElementById("meal-modal-confirm");
  btn.disabled    = true;
  btn.textContent = "Recording...";

  try {
    var res = await Sheets.recordMeal({
      admNo      : mealStudent.admNo,
      name       : mealStudent.name,
      grade      : mealStudent.grade,
      food       : food,
      tea        : tea,
      porridge   : porridge,
      date       : date,
      recordedBy : ADMIN_NAME
    });

    var newBal = res.newBalance;
    showToast(
      "KES " + total + " deducted for " + mealStudent.name +
      (newBal < 0 ? " (debt: " + Sheets.formatBalance(newBal) + ")" : ""),
      newBal < 0 ? "warning" : "success"
    );

    // Update local state
    allTxHistory[mealStudent.admNo] = (allTxHistory[mealStudent.admNo] || 0) + 1;
    var found = allStudents.find(function (st) {
      return String(st.admNo) === String(mealStudent.admNo);
    });
    if (found) { found.balance = res.newBalance; found.type = res.type; }
    mealStudent.balance = res.newBalance;
    mealStudent.type    = res.type;

    // Reset checkboxes + preview
    document.getElementById("meal-food").checked     = false;
    document.getElementById("meal-tea").checked      = false;
    document.getElementById("meal-porridge").checked = false;
    updateMealPreview();
    selectMealStudent(mealStudent);
    closeMealModal();

  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "✅ Yes, Confirm";
  }
}