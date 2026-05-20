// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// dailyrecord.js — Bulk Daily Record Tab Logic
// ============================================================

var bulkStudents   = [];
var bulkQueue      = [];
var bulkIndex      = 0;
var _lastBulkGrade = ""; // remembers last loaded class for smart date-reload

// ── Populate class dropdown ───────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  var sel = document.getElementById("bulk-grade");
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  GREENSHINE.CLASSES.forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = c.value;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
});

// ── Countdown before loading ─────────────────────────────────
function bulkCountdown(container, grade, date) {
  return new Promise(function (resolve) {
    var count = 3;
    container.innerHTML =
      '<div style="text-align:center;padding:40px 20px">' +
        '<div id="bulk-cd-number" style="font-size:72px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:12px">' + count + '</div>' +
        '<div style="font-size:14px;color:var(--muted)">Loading ' + grade + ' for ' + date + '...</div>' +
      '</div>';

    var timer = setInterval(function () {
      count--;
      var numEl = document.getElementById("bulk-cd-number");
      if (numEl) {
        if (count > 0) {
          numEl.textContent = count;
          numEl.style.color = count === 2 ? "var(--warning)" : "var(--success)";
        } else {
          numEl.textContent = "🚀";
        }
      }
      if (count <= 0) {
        clearInterval(timer);
        setTimeout(resolve, 300);
      }
    }, 700);
  });
}

// ── Load class students + existing records for selected date ──
async function loadBulkClass() {
  var gradeEl   = document.getElementById("bulk-grade");
  var dateEl    = document.getElementById("bulk-date");
  var container = document.getElementById("bulk-rows");
  var footer    = document.getElementById("bulk-footer");

  var grade = gradeEl ? gradeEl.value : "";
  var date  = dateEl  ? dateEl.value  : Sheets.today();

  if (!grade) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div><p>Select a class to load students</p></div>';
    if (footer) footer.style.display = "none";
    return;
  }

  // Detect whether this is just a date change (same class already loaded)
  var isDateChange = (grade === _lastBulkGrade);
  _lastBulkGrade   = grade;

  // ── Loading indicator ────────────────────────────────────
  if (isDateChange) {
    // Quiet reload — simple spinner, no countdown
    container.innerHTML =
      '<div style="text-align:center;padding:32px 20px">' +
        '<div class="spinner" style="width:28px;height:28px;border-width:3px;margin:0 auto 12px"></div>' +
        '<div style="font-size:13px;color:var(--muted)">Loading ' + grade + ' for ' + date + '...</div>' +
      '</div>';
  } else {
    // New class selected — run the fun countdown
    await bulkCountdown(container, grade, date);
  }

  // ── Filter students for this class ───────────────────────
  bulkStudents = allStudents.filter(function (s) {
    return s.displayGrade === grade;
  });

  if (bulkStudents.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">👤</div><p>No students in ' + grade + '</p></div>';
    if (footer) footer.style.display = "none";
    _lastBulkGrade = "";
    return;
  }

  // Sort by ADM number
  bulkStudents.sort(function (a, b) {
    return Number(a.admNo) - Number(b.admNo);
  });

  // ── Load what was already recorded on this date ──────────
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
  updatePendingCount();

  // ── Toast on quiet date-reload ───────────────────────────
  if (isDateChange) {
    var d = new Date(date + "T00:00:00");
    var label = d.toLocaleDateString("en-KE", {
      weekday: "short", day: "numeric", month: "short"
    });
    showToast("Loaded " + grade + " · " + label, "success");
  }
}

// ── Render rows ───────────────────────────────────────────────
function renderBulkRows(recorded) {
  recorded = recorded || {};
  var container = document.getElementById("bulk-rows");
  if (!container) return;

  var html = "";
  bulkStudents.forEach(function (s, idx) {
    var t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    var bal    = s.balance || 0;
    var meals  = allTxHistory[s.admNo] || 0;
    var flame  = meals > 10 ? "🔥 " : "";
    var balCls = bal >= 0 ? "text-success" : "text-danger";

    // What did this student already eat on selected date?
    var ate = recorded[String(s.admNo)] || { food: false, tea: false, porridge: false };

    // Build checkbox — locked+blurred if already eaten, open if not
    function cb(cls, isEaten) {
      if (isEaten) {
        return '<input type="checkbox" class="' + cls + '" data-idx="' + idx + '"' +
               ' checked disabled style="opacity:0.35;cursor:not-allowed;accent-color:var(--success)"/>';
      }
      return '<input type="checkbox" class="' + cls + '" data-idx="' + idx + '"/>';
    }

    var initCost = (ate.food ? 50 : 0) + (ate.tea ? 15 : 0) + (ate.porridge ? 10 : 0);
    var status   = ate.food && ate.tea && ate.porridge
      ? '<span class="bulk-status-done">Done ✅</span>'
      : initCost > 0
        ? '<span class="bulk-status-partial">Partial</span>'
        : '<span class="bulk-status-pending">Pending</span>';

    html +=
      '<div class="bulk-row' + (ate.food && ate.tea && ate.porridge ? ' done' : '') + '" id="bulk-row-' + idx + '">' +

        '<div>' +
          '<div class="bulk-student-name">' + flame + s.name + '</div>' +
          '<div class="bulk-student-meta">' +
            '<span class="text-mono ' + balCls + '">' + Sheets.formatBalance(bal) + '</span>' +
            (meals > 0 ? ' · ' + meals + ' meal' + (meals !== 1 ? 's' : '') : ' · no meals yet') +
          '</div>' +
        '</div>' +

        '<div class="bulk-type-badge">' +
          '<span class="badge" style="background:' + t.color + '20;color:' + t.color + ';border:1px solid ' + t.color + '40;font-size:11px">' + s.type + '</span>' +
        '</div>' +

        '<div style="text-align:center">' + cb("bulk-food",     ate.food)     + '</div>' +
        '<div style="text-align:center">' + cb("bulk-tea",      ate.tea)      + '</div>' +
        '<div style="text-align:center">' + cb("bulk-porridge", ate.porridge) + '</div>' +

        '<div class="bulk-cost" id="bulk-cost-' + idx + '">KES ' + initCost + '</div>' +
        '<div style="text-align:right" id="bulk-status-' + idx + '">' + status + '</div>' +

        // Mobile cards
        '<div class="bulk-checks">' +
          '<label class="bulk-check-item' + (ate.food ? ' locked-item' : '') + '">' +
            '<span class="check-icon">🍽️</span>' +
            cb("bulk-food-m", ate.food) +
            '<span class="check-label check-label-lunch">Lunch</span>' +
            '<span class="check-price">KES 50</span>' +
          '</label>' +
          '<label class="bulk-check-item' + (ate.tea ? ' locked-item' : '') + '">' +
            '<span class="check-icon">☕</span>' +
            cb("bulk-tea-m", ate.tea) +
            '<span class="check-label check-label-tea">Tea</span>' +
            '<span class="check-price">KES 15</span>' +
          '</label>' +
          '<label class="bulk-check-item' + (ate.porridge ? ' locked-item' : '') + '">' +
            '<span class="check-icon">🌾</span>' +
            cb("bulk-porridge-m", ate.porridge) +
            '<span class="check-label check-label-porridge">Porridge</span>' +
            '<span class="check-price">KES 10</span>' +
          '</label>' +
        '</div>' +

        '<div class="bulk-footer-row">' +
          '<span class="bulk-cost" id="bulk-cost-m-' + idx + '" style="color:var(--warning);font-family:var(--font-mono)">KES ' + initCost + '</span>' +
          '<span id="bulk-status-m-' + idx + '">' + status + '</span>' +
        '</div>' +

      '</div>';
  });

  container.innerHTML = html;

  // Attach change listeners to unlocked checkboxes only
  bulkStudents.forEach(function (s, idx) {
    ["bulk-food","bulk-tea","bulk-porridge"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el && !el.disabled) el.addEventListener("change", function () {
        syncMobile(idx); updateBulkCost(idx);
      });
    });
    ["bulk-food-m","bulk-tea-m","bulk-porridge-m"].forEach(function (cls) {
      var el = container.querySelector("." + cls + '[data-idx="' + idx + '"]');
      if (el && !el.disabled) el.addEventListener("change", function () {
        syncDesktop(idx); updateBulkCost(idx);
      });
    });
  });
}

// ── Sync desktop → mobile checkboxes ─────────────────────────
function syncMobile(idx) {
  [["bulk-food","bulk-food-m"],["bulk-tea","bulk-tea-m"],["bulk-porridge","bulk-porridge-m"]].forEach(function (p) {
    var d = document.querySelector("." + p[0] + '[data-idx="' + idx + '"]');
    var m = document.querySelector("." + p[1] + '[data-idx="' + idx + '"]');
    if (d && m && !m.disabled) m.checked = d.checked;
  });
}

// ── Sync mobile → desktop checkboxes ─────────────────────────
function syncDesktop(idx) {
  [["bulk-food-m","bulk-food"],["bulk-tea-m","bulk-tea"],["bulk-porridge-m","bulk-porridge"]].forEach(function (p) {
    var m = document.querySelector("." + p[0] + '[data-idx="' + idx + '"]');
    var d = document.querySelector("." + p[1] + '[data-idx="' + idx + '"]');
    if (m && d && !d.disabled) d.checked = m.checked;
  });
}

// ── Update cost for one row ───────────────────────────────────
function updateBulkCost(idx) {
  var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
  var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
  var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
  if (!f) return;
  var cost = (f.checked ? 50 : 0) + (t && t.checked ? 15 : 0) + (p && p.checked ? 10 : 0);
  var el  = document.getElementById("bulk-cost-"   + idx);
  var elm = document.getElementById("bulk-cost-m-" + idx);
  if (el)  el.textContent  = "KES " + cost;
  if (elm) elm.textContent = "KES " + cost;
  updatePendingCount();
}

// ── Count pending rows ────────────────────────────────────────
function updatePendingCount() {
  var pending = 0;
  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (!st || st.querySelector(".bulk-status-done")) return;
    var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (f && !f.disabled && (f.checked || (t && t.checked) || (p && p.checked))) pending++;
  });
  var el = document.getElementById("pending-count");
  if (el) el.textContent = pending;
}

// ── Build queue from ticked unlocked rows ─────────────────────
async function processBulk() {
  bulkQueue = [];
  bulkStudents.forEach(function (s, idx) {
    var st = document.getElementById("bulk-status-" + idx);
    if (st && st.querySelector(".bulk-status-done")) return;
    var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
    var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
    var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
    if (!f) return;
    var fC   = f.checked  && !f.disabled;
    var tC   = t && t.checked  && !t.disabled;
    var pC   = p && p.checked  && !p.disabled;
    var cost = (fC ? 50 : 0) + (tC ? 15 : 0) + (pC ? 10 : 0);
    if (cost > 0) bulkQueue.push({ s: s, idx: idx, food: fC, tea: tC, porridge: pC, cost: cost });
  });

  if (bulkQueue.length === 0) {
    showToast("No new items ticked", "warning");
    return;
  }
  bulkIndex = 0;
  await showBulkModal();
}

// ── Show confirm modal ────────────────────────────────────────
async function showBulkModal() {
  var modalEl   = document.getElementById("bulk-modal");
  var titleEl   = document.getElementById("bulk-modal-title");
  var contentEl = document.getElementById("bulk-modal-content");
  if (!modalEl || !titleEl || !contentEl) return;

  if (bulkIndex >= bulkQueue.length) {
    modalEl.classList.remove("open");
    showToast(
      "Bulk record complete! " + bulkQueue.length +
      " student" + (bulkQueue.length !== 1 ? "s" : "") + " processed.",
      "success"
    );
    return;
  }

  var entry = bulkQueue[bulkIndex];
  var s     = entry.s;
  var cost  = entry.cost;
  var bal   = s.balance || 0;
  var after = bal - cost;
  var date  = document.getElementById("bulk-date").value || Sheets.today();

  var items = [
    entry.food     ? '<span class="badge badge-food">🍽️ Lunch</span>'       : "",
    entry.tea      ? '<span class="badge badge-tea">☕ Tea</span>'           : "",
    entry.porridge ? '<span class="badge badge-porridge">🌾 Porridge</span>' : ""
  ].filter(Boolean).join(" ");

  var dupWarn = "";
  try {
    dupWarn = await buildDuplicateWarning(s.admNo, s.name, date, entry.food, entry.tea, entry.porridge);
  } catch (e) { dupWarn = ""; }

  titleEl.textContent = "Confirm — " + s.name + " (" + (bulkIndex + 1) + " of " + bulkQueue.length + ")";

  contentEl.innerHTML =
    '<div style="font-size:14px;line-height:1.8">' +
      '<div style="font-weight:600">' + s.name + '</div>' +
      '<div style="color:var(--muted);font-size:13px">' + s.displayGrade + '</div>' +
      '<div style="margin:8px 0">' + items + '</div>' +
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
      dupWarn +
      balanceWarningHtml(bal, cost) +
      '<div style="margin-top:10px;color:var(--muted);font-size:13px">' +
        'Did <strong style="color:var(--light)">' + s.name + '</strong> eat/drink these today?' +
      '</div>' +
    '</div>';

  modalEl.classList.add("open");
}

// ── Confirm — record to Google Sheets ────────────────────────
async function confirmBulkStudent() {
  var entry      = bulkQueue[bulkIndex];
  var s          = entry.s;
  var idx        = entry.idx;
  var confirmBtn = document.getElementById("bulk-modal-confirm");
  var skipBtn    = document.getElementById("bulk-modal-skip");
  var closeBtn   = document.getElementById("bulk-modal-close");
  var contentEl  = document.getElementById("bulk-modal-content");

  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = "Recording..."; }
  if (skipBtn)    skipBtn.disabled = true;
  if (closeBtn)   closeBtn.disabled = true;

  var items = [
    entry.food     ? "Lunch"    : "",
    entry.tea      ? "Tea"      : "",
    entry.porridge ? "Porridge" : ""
  ].filter(Boolean).join(", ");

  var count   = 1;
  var countEl = null;

  if (contentEl) {
    contentEl.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div class="spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 16px"></div>' +
        '<div style="font-size:14px;font-weight:600;color:var(--light);margin-bottom:8px">Recording ' + s.name + '...</div>' +
        '<div style="font-size:13px;color:var(--muted);margin-bottom:16px">' + items + '</div>' +
        '<div id="bulk-countdown" style="font-size:28px;font-weight:700;color:var(--accent)">1</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:6px">Please wait...</div>' +
      '</div>';
    countEl = document.getElementById("bulk-countdown");
  }

  var timer = setInterval(function () {
    count++;
    if (countEl) countEl.textContent = count;
  }, 1000);

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

    clearInterval(timer);

    if (contentEl) {
      contentEl.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
          '<div style="font-size:48px;margin-bottom:12px">✅</div>' +
          '<div style="font-size:15px;font-weight:600;color:var(--success)">' + s.name + ' recorded!</div>' +
          '<div style="font-size:13px;color:var(--muted);margin-top:6px">KES ' + entry.cost + ' · ' + items + '</div>' +
        '</div>';
    }

    // Mark row done in the table
    var stEl  = document.getElementById("bulk-status-"   + idx);
    var stElM = document.getElementById("bulk-status-m-" + idx);
    var done  = '<span class="bulk-status-done">Done ✅</span>';
    if (stEl)  stEl.innerHTML  = done;
    if (stElM) stElM.innerHTML = done;
    var rowEl = document.getElementById("bulk-row-" + idx);
    if (rowEl) rowEl.classList.add("done");

    // Update local state
    allTxHistory[s.admNo] = (allTxHistory[s.admNo] || 0) + 1;
    var found = allStudents.find(function (a) {
      return String(a.admNo) === String(s.admNo);
    });
    if (found) { found.balance = res.newBalance; found.type = res.type; }

    setTimeout(async function () {
      bulkIndex++;
      updatePendingCount();
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
      if (skipBtn)    skipBtn.disabled = false;
      if (closeBtn)   closeBtn.disabled = false;
      await showBulkModal();
    }, 1000);

  } catch (err) {
    clearInterval(timer);
    showToast("Error for " + s.name + ": " + err.message, "error");
    if (contentEl) {
      contentEl.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
          '<div style="font-size:48px;margin-bottom:12px">❌</div>' +
          '<div style="font-size:14px;color:var(--danger)">Failed to record ' + s.name + '.</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-top:8px">' + err.message + '</div>' +
        '</div>';
    }
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "✅ Yes, Confirm"; }
    if (skipBtn)    skipBtn.disabled = false;
    if (closeBtn)   closeBtn.disabled = false;
  }
}

// ── Skip current student ──────────────────────────────────────
async function skipBulkStudent() {
  bulkIndex++;
  await showBulkModal();
}