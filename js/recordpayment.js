// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// recordpayment.js — Record Payment Tab Logic
// Depends on: record-init.js (allStudents, ADMIN_NAME, showToast)
// ============================================================

var payStudent = null;

// ── Fill selected student bar ─────────────────────────────────
function selectPayStudent(s) {
  payStudent = s;

  var bal = s.balance || 0;
  var t   = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];

  document.getElementById("pay-selected").style.display = "flex";
  document.getElementById("pay-s-name").textContent     = s.name;
  document.getElementById("pay-s-meta").textContent     =
    s.displayGrade + " · " + s.type + " · " + t.label;

  var balEl = document.getElementById("pay-s-bal");
  balEl.textContent = Sheets.formatBalance(bal);
  balEl.className   = "s-bal " + (bal >= 0 ? "text-success" : "text-danger");

  updatePayPreview();
}

// ── Live balance preview ──────────────────────────────────────
function updatePayPreview() {
  if (!payStudent) return;

  var amount = parseFloat(document.getElementById("pay-amount").value) || 0;
  var bal    = payStudent.balance || 0;
  var after  = bal + amount;

  if (amount > 0) {
    document.getElementById("pay-preview").style.display = "block";

    document.getElementById("pay-prev-current").textContent =
      Sheets.formatBalance(bal);

    document.getElementById("pay-prev-amount").textContent =
      "+ " + Sheets.formatBalance(amount);

    var afterEl = document.getElementById("pay-prev-after");
    afterEl.textContent = Sheets.formatBalance(after);
    afterEl.className   =
      "text-mono " + (after >= 0 ? "text-success" : "text-danger");

    document.getElementById("pay-btn").disabled = false;
  } else {
    document.getElementById("pay-preview").style.display = "none";
    document.getElementById("pay-btn").disabled = true;
  }
}

// ── Submit payment to Google Sheet ────────────────────────────
async function submitPayment() {
  if (!payStudent) {
    showToast("Please select a student first", "warning");
    return;
  }

  var amount = parseFloat(document.getElementById("pay-amount").value);
  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount", "warning");
    return;
  }

  var ref        = document.getElementById("pay-ref").value || "";
  var date       = document.getElementById("pay-date").value || Sheets.today();
  var recordedBy = document.getElementById("pay-recorded-by").value || ADMIN_NAME;

  var btn = document.getElementById("pay-btn");
  btn.disabled = true;
  btn.textContent = "Recording...";

  try {
    var res = await Sheets.recordPayment({
      admNo      : payStudent.admNo,
      name       : payStudent.name,
      grade      : payStudent.grade,
      amount     : amount,
      ref        : ref,
      date       : date,
      recordedBy : recordedBy
    });

    showToast(
      "Payment of KES " + amount + " recorded for " + payStudent.name,
      "success"
    );

    // Update local balance
    var found = allStudents.find(function (st) {
      return String(st.admNo) === String(payStudent.admNo);
    });

    if (found) {
      found.balance = res.newBalance;
      found.type    = res.type;
    }

    payStudent.balance = res.newBalance;
    payStudent.type    = res.type;

    // Reset form
    document.getElementById("pay-amount").value = "";
    document.getElementById("pay-ref").value = "";
    document.getElementById("pay-preview").style.display = "none";
    document.getElementById("pay-btn").disabled = true;

    // Refresh student bar with new balance
    selectPayStudent(payStudent);

  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "✅ Confirm Payment";
  }
}