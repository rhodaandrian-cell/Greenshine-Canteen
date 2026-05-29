// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// bulk-ui.js — Row rendering, counters, filters, cost updates
// Depends on: config.js, sheets.js, bulk-load.js
// ============================================================

// ── Countdown animation before loading a new class ───────────
function bulkCountdown(container, grade, date) {
  return new Promise(function (resolve) {
    var count = 3;
    container.innerHTML =
      '<div style="text-align:center;padding:40px 20px">' +
        '<div id="bulk-cd-number" style="font-size:72px;font-weight:700;' +
          'color:var(--accent);line-height:1;margin-bottom:12px">' + count + '</div>' +
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
      if (count <= 0) { clearInterval(timer); setTimeout(resolve, 300); }
    }, 700);
  });
}

// ── Render all student rows into the table ────────────────────
function renderBulkRows(recorded) {
  recorded = recorded || {};
  var container = document.getElementById("bulk-rows");
  var searchBar = document.getElementById("bulk-search-bar");
  var counter   = document.getElementById("bulk-counter");
  if (!container) return;

  if (searchBar) searchBar.style.display = "block";
  if (counter)   counter.style.display   = "flex";

  var html = "";

  bulkStudents.forEach(function (s, idx) {
    var t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    var bal    = s.balance || 0;
    var meals  = allTxHistory[s.admNo] || 0;
    var flame  = meals > 10 ? "🔥 " : "";
    var ate    = recorded[String(s.admNo)] || { food: false, tea: false, porridge: false };

    // Balance warning: red tint if in debt or will go into debt
    var mealCost   = (ate.food ? 50 : 0) + (ate.tea ? 15 : 0) + (ate.porridge ? 10 : 0);
    var balWarning = bal < 0 || (bal - mealCost) < 0;
    var balCls     = bal >= 0 ? "text-success" : "text-danger";

    // Status logic based on how many items already recorded today
    var ateCount = (ate.food ? 1 : 0) + (ate.tea ? 1 : 0) + (ate.porridge ? 1 : 0);
    var allDone  = ateCount >= 2;   // ate 2 or more items = Done
    var partial  = ateCount === 1;  // ate exactly 1 item = Partial

    var initCost = mealCost;
    var status   = allDone  ? '<span class="bulk-status-done">Done ✅</span>'
                 : partial  ? '<span class="bulk-status-partial">Partial 〰</span>'
                 :             '<span class="bulk-status-pending">Pending</span>';

    var rowStyle = balWarning && !allDone
      ? ' style="background:rgba(231,76,60,0.06);border-left:3px solid rgba(231,76,60,0.4)"'
      : '';

    html +=
      '<div class="bulk-row' + (allDone ? ' done' : '') + '" id="bulk-row-' + idx + '"' + rowStyle + '>' +

        '<div>' +
          '<div class="bulk-student-name">' + flame + s.name +
            (balWarning && !allDone
              ? ' <span style="font-size:10px;color:var(--danger)">⚠</span>'
              : '') +
          '</div>' +
          '<div class="bulk-student-meta">' +
            '<span class="text-mono ' + balCls + '">' + Sheets.formatBalance(bal) + '</span>' +
            (meals > 0
              ? ' · ' + meals + ' meal' + (meals !== 1 ? 's' : '')
              : ' · no meals yet') +
          '</div>' +
        '</div>' +

        '<div class="bulk-type-badge">' +
          '<span class="badge" style="background:' + t.color + '20;color:' + t.color +
            ';border:1px solid ' + t.color + '40;font-size:11px">' + s.type + '</span>' +
        '</div>' +

        '<div style="text-align:center">' + makeCb("bulk-food",     idx, ate.food)     + '</div>' +
        '<div style="text-align:center">' + makeCb("bulk-tea",      idx, ate.tea)      + '</div>' +
        '<div style="text-align:center">' + makeCb("bulk-porridge", idx, ate.porridge) + '</div>' +

        '<div class="bulk-cost" id="bulk-cost-' + idx + '">KES ' + initCost + '</div>' +
        '<div style="text-align:right" id="bulk-status-' + idx + '">' + status + '</div>' +

        // Mobile card
        '<div class="bulk-checks">' +
          makeMobileCheck("bulk-food-m",     idx, ate.food,     "🍽️", "Lunch",    "check-label-lunch",    "KES 50") +
          makeMobileCheck("bulk-tea-m",      idx, ate.tea,      "☕", "Tea",      "check-label-tea",      "KES 15") +
          makeMobileCheck("bulk-porridge-m", idx, ate.porridge, "🌾", "Porridge", "check-label-porridge", "KES 10") +
          '<div class="bulk-cost-m" id="bulk-cost-m-' + idx + '">KES ' + initCost + '</div>' +
          '<div id="bulk-status-m-' + idx + '">' + status + '</div>' +
        '</div>' +

      '</div>';
  });

  container.innerHTML = html;
  wireCheckboxes(container);
}

// ── Build a checkbox (locked if already eaten) ────────────────
function makeCb(cls, idx, isEaten) {
  if (isEaten) {
    return '<input type="checkbox" class="' + cls + '" data-idx="' + idx + '"' +
           ' checked disabled style="opacity:0.35;cursor:not-allowed;accent-color:var(--success)"/>';
  }
  return '<input type="checkbox" class="' + cls + '" data-idx="' + idx + '"/>';
}

// ── Build a mobile check label ────────────────────────────────
function makeMobileCheck(cls, idx, isEaten, icon, label, labelCls, price) {
  return '<label class="bulk-check-item' + (isEaten ? ' locked-item' : '') + '">' +
    '<span class="check-icon">' + icon + '</span>' +
    makeCb(cls, idx, isEaten) +
    '<span class="check-label ' + labelCls + '">' + label + '</span>' +
    '<span class="check-price">' + price + '</span>' +
  '</label>';
}

// ── Wire checkbox events after rendering ──────────────────────
function wireCheckboxes(container) {
  // Desktop checkboxes: update cost + status on change
  container.querySelectorAll(".bulk-food, .bulk-tea, .bulk-porridge").forEach(function (cb) {
    if (cb.disabled) return;
    cb.addEventListener("change", function () {
      var idx = parseInt(this.getAttribute("data-idx"));
      syncMobileFromDesktop(container, idx);
      updateBulkCost(idx);
    });
  });

  // Mobile checkboxes: mirror to desktop then update cost + status
  container.querySelectorAll(".bulk-food-m, .bulk-tea-m, .bulk-porridge-m").forEach(function (cb) {
    if (cb.disabled) return;
    cb.addEventListener("change", function () {
      var idx = parseInt(this.getAttribute("data-idx"));
      syncDesktopFromMobile(container, idx);
      updateBulkCost(idx);
    });
  });
}

// ── Mirror desktop → mobile ───────────────────────────────────
function syncMobileFromDesktop(container, idx) {
  [["bulk-food","bulk-food-m"],["bulk-tea","bulk-tea-m"],["bulk-porridge","bulk-porridge-m"]].forEach(function (p) {
    var d = container.querySelector("." + p[0] + '[data-idx="' + idx + '"]');
    var m = container.querySelector("." + p[1] + '[data-idx="' + idx + '"]');
    if (d && m && !m.disabled) m.checked = d.checked;
  });
}

// ── Mirror mobile → desktop ───────────────────────────────────
function syncDesktopFromMobile(container, idx) {
  [["bulk-food-m","bulk-food"],["bulk-tea-m","bulk-tea"],["bulk-porridge-m","bulk-porridge"]].forEach(function (p) {
    var m = container.querySelector("." + p[0] + '[data-idx="' + idx + '"]');
    var d = container.querySelector("." + p[1] + '[data-idx="' + idx + '"]');
    if (m && d && !d.disabled) d.checked = m.checked;
  });
}

// ── Update cost display + status badge for one row ────────────
function updateBulkCost(idx) {
  var f = document.querySelector('.bulk-food[data-idx="'     + idx + '"]');
  var t = document.querySelector('.bulk-tea[data-idx="'      + idx + '"]');
  var p = document.querySelector('.bulk-porridge[data-idx="' + idx + '"]');
  if (!f) return;

  var fC   = f.checked && !f.disabled;
  var tC   = t && t.checked && !t.disabled;
  var pC   = p && p.checked && !p.disabled;
  var cost = (fC ? 50 : 0) + (tC ? 15 : 0) + (pC ? 10 : 0);

  var el  = document.getElementById("bulk-cost-"   + idx);
  var elm = document.getElementById("bulk-cost-m-" + idx);
  if (el)  el.textContent  = "KES " + cost;
  if (elm) elm.textContent = "KES " + cost;

  var stEl  = document.getElementById("bulk-status-"   + idx);
  var stElM = document.getElementById("bulk-status-m-" + idx);

  // Never overwrite a confirmed Done row
  if (stEl && stEl.querySelector(".bulk-status-done")) return;

  var statusHtml;
  if (fC && tC && pC) {
    statusHtml = '<span class="bulk-status-overeat">Overeat ⚠️</span>';
  } else if (cost > 0) {
    statusHtml = '<span class="bulk-status-ready">Ready ✓</span>';
  } else {
    statusHtml = '<span class="bulk-status-pending">Pending</span>';
  }

  if (stEl)  stEl.innerHTML  = statusHtml;
  if (stElM) stElM.innerHTML = statusHtml;

  updateBulkCounter();
}

// ── Filter visible rows by name / adm search ─────────────────
function filterBulkRows(query) {
  query = (query || "").toLowerCase().trim();
  bulkStudents.forEach(function (s, idx) {
    var row = document.getElementById("bulk-row-" + idx);
    if (!row) return;
    var match = !query ||
      s.name.toLowerCase().includes(query) ||
      String(s.admNo).includes(query);
    row.style.display = match ? "" : "none";
  });
  updateBulkCounter();
}

// ── Update Done / Pending counter bar ────────────────────────
function updateBulkCounter() {
  var done    = 0;
  var pending = 0;

  bulkStudents.forEach(function (s, idx) {
    var row = document.getElementById("bulk-row-" + idx);
    if (row && row.style.display === "none") return;

    var st = document.getElementById("bulk-status-" + idx);
    if (!st) return;

    if (st.querySelector(".bulk-status-done")) {
      done++;
    } else {
      pending++;
    }
  });

  var doneEl    = document.getElementById("bulk-count-done");
  var pendingEl = document.getElementById("bulk-count-pending");
  if (doneEl)    doneEl.textContent    = done;
  if (pendingEl) pendingEl.textContent = pending;

  var btnCount = document.getElementById("pending-count");
  if (btnCount) btnCount.textContent = pending;
}

// ── Balance warning HTML for modal ───────────────────────────
function balanceWarningHtml(bal, cost) {
  if (bal - cost < 0 && bal >= 0) {
    return '<div style="margin-top:8px;padding:8px 10px;background:rgba(243,156,18,0.1);' +
           'border:1px solid rgba(243,156,18,0.3);border-radius:6px;font-size:12px;color:var(--warning)">' +
           '⚠️ This will put the student into debt.</div>';
  }
  if (bal < 0) {
    return '<div style="margin-top:8px;padding:8px 10px;background:rgba(231,76,60,0.1);' +
           'border:1px solid rgba(231,76,60,0.3);border-radius:6px;font-size:12px;color:var(--danger)">' +
           '🔴 Student is already in debt.</div>';
  }
  return "";
}