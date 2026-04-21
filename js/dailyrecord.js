// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// dailyrecord.js — Bulk Daily Record Tab Logic
// Depends on: record-init.js
// ============================================================

var bulkStudents = [];
var bulkQueue    = [];
var bulkIndex    = 0;

// ── Load students for selected class ─────────────────────────
function loadBulkClass() {
  var grade     = document.getElementById("bulk-grade").value;
  var container = document.getElementById("bulk-rows");
  var footer    = document.getElementById("bulk-footer");

  if (!grade) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📋</div>' +
        '<p>Select a class to load students</p>' +
      '</div>';
    footer.style.display = "none";
    return;
  }

  container.innerHTML =
    '<div class="loading"><div class="spinner"></div> Loading ' + grade + '...</div>';

  bulkStudents = allStudents.filter(function (s) {
    return s.displayGrade === grade;
  });

  if (bulkStudents.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">👤</div>' +
        '<p>No students found in ' + grade + '</p>' +
      '</div>';
    footer.style.display = "none";
    return;
  }

  bulkStudents.sort(function (a, b) {
    return (allTxHistory[b.admNo] || 0) - (allTxHistory[a.admNo] || 0);
  });

  renderBulkRows();
  footer.style.display = "block";
  updatePendingCount();
}

// ── Render all student rows ───────────────────────────────────
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
          '<div style="font-weight:500">' + flame + s.name + '</div>' +
          '<div style="font-size:11px;color:var(--muted)">' +
            '<span class="text-mono ' + balCls + '">' + Sheets.formatBalance(bal) + '</span>' +
            (meals > 0
              ? ' · <span style="color:var(--muted-2)">' + meals + ' meal' + (meals !== 1 ? 's' : '') + '</span>'
              : ' · <span style="color:var(--muted-2)">no meals yet</span>') +
          '</div>' +
        '</div>' +

        '<div>' +
          '<span class="badge" style="background:' + t.color + '20;color:' + t.color + ';border:1px solid ' + t.color + '40;font-size:11px">' +
            s.type +
          '</span>' +
        '</div>' +

        '<div style="text-align:center">' +
          '<input type="checkbox" class="bulk-food" data-idx="' + idx + '"/>' +
        '</div>' +

        '<div style="text-align:center">' +
          '<input type="checkbox" class="bulk-tea" data-idx="' + idx + '"/>' +
        '</div>' +

        '<div style="text-align:center">' +
          '<input type="checkbox" class="bulk-porridge" data-idx="' + idx + '"/>' +
        '</div>' +

        '<div class="bulk-cost" id="bulk-cost-' + idx + '">KES 0</div>' +

        '<div style="text-align:right">' +
          '<span class="bulk-status-pending" id="bulk-status-' + idx + '">Pending</span>' +
        '</div>' +

      '</div>';
  });

  container.innerHTML = html;

  bulkStudents.forEach(function (s, idx) {
    ["bulk-food", "bulk-tea", "bulk-porridge"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el) el.addEventListener("change", function () {
        updateBulkCost(idx);
      });
    });
  });
}

// ── Update cost for one row ───────────────────────────────────
function updateBulkCost(idx) {
  var food     = document.querySelector('.bulk-food[data-idx="' + idx + '"]');
  var tea      = document.querySelector('.bulk-tea[data-idx="' + idx + '"]');
  var porridge = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');

  if (!food) return;

  var cost =
    (food.checked ? 50 : 0) +
    (tea && tea.checked ? 15 : 0) +
    (porridge && porridge.checked ? 10 : 0);

  var costEl = document.getElementById("bulk-cost-" + idx);
  if (costEl) costEl.textContent = "KES " + cost;

  updatePendingCount();
}

// ── Count pending students ────────────────────────────────────
function updatePendingCount() {
  var pending = 0;

  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (!st || st.classList.contains("bulk-status-done")) return;

    var f = document.querySelector('.bulk-food[data-idx="' + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="' + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');

    if (f && (f.checked || (t && t.checked) || (p && p.checked))) {
      pending++;
    }
  });

  var el = document.getElementById("pending-count");
  if (el) el.textContent = pending;
}

// ── Build queue ───────────────────────────────────────────────
function processBulk() {
  bulkQueue = [];

  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (st && st.classList.contains("bulk-status-done")) return;

    var f = document.querySelector('.bulk-food[data-idx="' + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="' + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');

    if (!f) return;

    var fC = f.checked;
    var tC = t && t.checked;
    var pC = p && p.checked;

    var cost =
      (fC ? 50 : 0) +
      (tC ? 15 : 0) +
      (pC ? 10 : 0);

    if (cost > 0) {
      bulkQueue.push({ s, idx, food: fC, tea: tC, porridge: pC, cost });
    }
  });

  if (bulkQueue.length === 0) {
    showToast("No items ticked — tick what each student consumed first", "warning");
    return;
  }

  bulkIndex = 0;
  showBulkModal();
}

// ── Modal ─────────────────────────────────────────────────────
function showBulkModal() {
  var modalEl   = document.getElementById("bulk-modal");
  var titleEl   = document.getElementById("bulk-modal-title");
  var contentEl = document.getElementById("bulk-modal-content");

  if (!modalEl || !titleEl || !contentEl) return;

  if (bulkIndex >= bulkQueue.length) {
    modalEl.classList.remove("open");
    showToast(
      "Bulk record complete! " + bulkQueue.length + " student" +
      (bulkQueue.length !== 1 ? "s" : "") + " processed.",
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
    entry.food     ? '<span class="badge badge-food">🍽️ Lunch</span>' : "",
    entry.tea      ? '<span class="badge badge-tea">☕ Tea</span>' : "",
    entry.porridge ? '<span class="badge badge-porridge">🌾 Porridge</span>' : ""
  ].filter(Boolean).join(" ");

  titleEl.textContent =
    "Confirm — " + s.name + " (" + (bulkIndex + 1) + " of " + bulkQueue.length + ")";

  contentEl.innerHTML =
    '<div style="font-size:14px;line-height:1.8">' +
      '<div style="font-weight:600">' + s.name + '</div>' +
      '<div style="color:var(--muted);font-size:13px">' + s.displayGrade + '</div>' +
      '<div class="confirm-items" style="margin:8px 0">' + items + '</div>' +
      '<div class="deduction-summary">' +
        '<div class="deduction-row">' +
          '<span>Deduction</span>' +
          '<span class="text-warning text-mono">− KES ' + cost + '</span>' +
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
      balanceWarningHtml(bal, cost) +
      '<div style="margin-top:10px;color:var(--muted);font-size:13px">' +
        'Did <strong style="color:var(--light)">' + s.name + '</strong> actually eat/drink these today?' +
      '</div>' +
    '</div>';

  modalEl.classList.add("open");
}

// ── Confirm student ───────────────────────────────────────────
async function confirmBulkStudent() {
  var entry = bulkQueue[bulkIndex];
  var s     = entry.s;
  var idx   = entry.idx;

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

    var statusEl = document.getElementById("bulk-status-" + idx);
    if (statusEl) {
      statusEl.textContent = "Done ✅";
      statusEl.className   = "bulk-status-done";
    }

    var rowEl = document.getElementById("bulk-row-" + idx);
    if (rowEl) rowEl.classList.add("done");

    allTxHistory[s.admNo] = (allTxHistory[s.admNo] || 0) + 1;

    var found = allStudents.find(a => String(a.admNo) === String(s.admNo));
    if (found) {
      found.balance = res.newBalance;
      found.type    = res.type;
    }

  } catch (err) {
    showToast("Error for " + s.name + ": " + err.message, "error");
  }

  bulkIndex++;
  updatePendingCount();
  showBulkModal();
}

// ── Skip ──────────────────────────────────────────────────────
function skipBulkStudent() {
  bulkIndex++;
  showBulkModal();
}