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

  // Match by displayGrade — dropdown value = displayGrade label
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

  // Sort: most meals first → occasional → never eaten
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

        // ── Desktop: grid columns ──
        // Student name + meta
        '<div>' +
          '<div class="bulk-student-name">' + flame + s.name + '</div>' +
          '<div class="bulk-student-meta">' +
            '<span class="text-mono ' + balCls + '">' + Sheets.formatBalance(bal) + '</span>' +
            (meals > 0
              ? ' · ' + meals + ' meal' + (meals !== 1 ? 's' : '')
              : ' · no meals yet') +
          '</div>' +
        '</div>' +

        // Type badge (hidden on mobile)
        '<div class="bulk-type-badge">' +
          '<span class="badge" style="background:' + t.color + '20;color:' + t.color + ';' +
            'border:1px solid ' + t.color + '40;font-size:11px">' + s.type + '</span>' +
        '</div>' +

        // Lunch checkbox
        '<div style="text-align:center">' +
          '<input type="checkbox" class="bulk-food" data-idx="' + idx + '"/>' +
        '</div>' +

        // Tea checkbox
        '<div style="text-align:center">' +
          '<input type="checkbox" class="bulk-tea" data-idx="' + idx + '"/>' +
        '</div>' +

        // Porridge checkbox
        '<div style="text-align:center">' +
          '<input type="checkbox" class="bulk-porridge" data-idx="' + idx + '"/>' +
        '</div>' +

        // Cost
        '<div class="bulk-cost" id="bulk-cost-' + idx + '">KES 0</div>' +

        // Status
        '<div style="text-align:right">' +
          '<span class="bulk-status-pending" id="bulk-status-' + idx + '">Pending</span>' +
        '</div>' +

        // ── Mobile only: card layout ──
        // Three checkbox cards shown below name on phone
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

        // Cost + status footer for mobile card
        '<div class="bulk-footer-row">' +
          '<span class="bulk-cost" id="bulk-cost-m-' + idx + '" ' +
            'style="color:var(--warning);font-family:var(--font-mono)">KES 0</span>' +
          '<span class="bulk-status-pending" id="bulk-status-m-' + idx + '">Pending</span>' +
        '</div>' +

      '</div>';
  });

  container.innerHTML = html;

  // Attach listeners — sync desktop + mobile checkboxes
  bulkStudents.forEach(function (s, idx) {
    // Desktop checkboxes
    ["bulk-food", "bulk-tea", "bulk-porridge"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el) el.addEventListener("change", function () {
        syncMobileCheckbox(idx);
        updateBulkCost(idx);
      });
    });

    // Mobile checkboxes — sync back to desktop
    ["bulk-food-m", "bulk-tea-m", "bulk-porridge-m"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el) el.addEventListener("change", function () {
        syncDesktopCheckbox(idx);
        updateBulkCost(idx);
      });
    });
  });
}

// ── Sync mobile → desktop checkboxes ─────────────────────────
function syncDesktopCheckbox(idx) {
  var map = [
    ["bulk-food-m",     "bulk-food"    ],
    ["bulk-tea-m",      "bulk-tea"     ],
    ["bulk-porridge-m", "bulk-porridge"]
  ];
  map.forEach(function(pair) {
    var mobile  = document.querySelector("." + pair[0] + '[data-idx="' + idx + '"]');
    var desktop = document.querySelector("." + pair[1] + '[data-idx="' + idx + '"]');
    if (mobile && desktop) desktop.checked = mobile.checked;
  });
}

// ── Sync desktop → mobile checkboxes ─────────────────────────
function syncMobileCheckbox(idx) {
  var map = [
    ["bulk-food",     "bulk-food-m"    ],
    ["bulk-tea",      "bulk-tea-m"     ],
    ["bulk-porridge", "bulk-porridge-m"]
  ];
  map.forEach(function(pair) {
    var desktop = document.querySelector("." + pair[0] + '[data-idx="' + idx + '"]');
    var mobile  = document.querySelector("." + pair[1] + '[data-idx="' + idx + '"]');
    if (desktop && mobile) mobile.checked = desktop.checked;
  });
}

// ── Update cost for one row ───────────────────────────────────
function updateBulkCost(idx) {
  var food     = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
  var tea      = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
  var porridge = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
  if (!food) return;

  var cost =
    (food.checked               ? 50 : 0) +
    (tea      && tea.checked    ? 15 : 0) +
    (porridge && porridge.checked ? 10 : 0);

  var costEl = document.getElementById("bulk-cost-" + idx);
  if (costEl) costEl.textContent = "KES " + cost;

  updatePendingCount();
}

// ── Count ticked pending students ────────────────────────────
function updatePendingCount() {
  var pending = 0;
  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (!st || st.classList.contains("bulk-status-done")) return;
    var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (f && (f.checked || (t && t.checked) || (p && p.checked))) pending++;
  });
  var el = document.getElementById("pending-count");
  if (el) el.textContent = pending;
}

// ── Build queue from ticked rows and start processing ─────────
function processBulk() {
  bulkQueue = [];

  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (st && st.classList.contains("bulk-status-done")) return;

    var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (!f) return;

    var fC   = f.checked;
    var tC   = t && t.checked;
    var pC   = p && p.checked;
    var cost = (fC ? 50 : 0) + (tC ? 15 : 0) + (pC ? 10 : 0);

    if (cost > 0) {
      bulkQueue.push({ s: s, idx: idx, food: fC, tea: tC, porridge: pC, cost: cost });
    }
  });

  if (bulkQueue.length === 0) {
    showToast("No items ticked — tick what each student consumed first", "warning");
    return;
  }

  bulkIndex = 0;
  showBulkModal();
}

// ── Show confirm modal for current student in queue ───────────
function showBulkModal() {
  var modalEl   = document.getElementById("bulk-modal");
  var titleEl   = document.getElementById("bulk-modal-title");
  var contentEl = document.getElementById("bulk-modal-content");
  if (!modalEl || !titleEl || !contentEl) return;

  // All done
  if (bulkIndex >= bulkQueue.length) {
    modalEl.classList.remove("open");
    showToast(
      "Bulk record complete! " + bulkQueue.length +
      " student" + (bulkQueue.length !== 1 ? "s" : "") + " processed.",
      "success"
    );
    return;
  }

  var entry    = bulkQueue[bulkIndex];
  var s        = entry.s;
  var cost     = entry.cost;
  var bal      = s.balance || 0;
  var after    = bal - cost;

  var items = [
    entry.food     ? '<span class="badge badge-food">🍽️ Lunch</span>'       : "",
    entry.tea      ? '<span class="badge badge-tea">☕ Tea</span>'           : "",
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
        'Did <strong style="color:var(--light)">' + s.name + '</strong>' +
        ' actually eat/drink these today?' +
      '</div>' +
    '</div>';

  modalEl.classList.add("open");
}

// ── Confirm and submit current student ───────────────────────
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

    // Mark row as done — desktop + mobile
    var statusEl = document.getElementById("bulk-status-" + idx);
    if (statusEl) { statusEl.textContent = "Done ✅"; statusEl.className = "bulk-status-done"; }

    var statusElM = document.getElementById("bulk-status-m-" + idx);
    if (statusElM) { statusElM.textContent = "Done ✅"; statusElM.className = "bulk-status-done"; }

    var rowEl = document.getElementById("bulk-row-" + idx);
    if (rowEl) rowEl.classList.add("done");

    // Update local state
    allTxHistory[s.admNo] = (allTxHistory[s.admNo] || 0) + 1;
    var found = allStudents.find(function (a) {
      return String(a.admNo) === String(s.admNo);
    });
    if (found) { found.balance = res.newBalance; found.type = res.type; }

  } catch (err) {
    showToast("Error for " + s.name + ": " + err.message, "error");
  }

  bulkIndex++;
  updatePendingCount();
  showBulkModal();
}

// ── Skip current student ──────────────────────────────────────
function skipBulkStudent() {
  bulkIndex++;
  showBulkModal();
}