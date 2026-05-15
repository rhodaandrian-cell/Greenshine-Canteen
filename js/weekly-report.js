// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// weekly-report.js — Weekly Report Page Logic
// ============================================================

var weekOffset  = 0;
var allStudents = [];
var allTx       = [];

// ── Boot ──────────────────────────────────────────────────────
window.addEventListener("load", async function () {
  initParticleNetwork("particle-canvas");
  await generateReport();
});

// ── Get Mon–Fri dates for a given week offset ─────────────────
function getWeekDates(offset) {
  var today = new Date();
  var day   = today.getDay();
  var mon   = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + (offset * 7));

  var dates = [];
  for (var i = 0; i < 5; i++) {
    var d    = new Date(mon);
    d.setDate(mon.getDate() + i);
    var yyyy = d.getFullYear();
    var mm   = String(d.getMonth() + 1).padStart(2, "0");
    var dd   = String(d.getDate()).padStart(2, "0");
    dates.push({
      date : yyyy + "-" + mm + "-" + dd,
      label: ["Mon","Tue","Wed","Thu","Fri"][i],
      full : d.toLocaleDateString("en-KE", { day:"numeric", month:"short" })
    });
  }
  return dates;
}

// ── Change week ───────────────────────────────────────────────
function changeWeek(dir) {
  weekOffset += dir;
  if (weekOffset > 0) { weekOffset = 0; return; }
  document.getElementById("next-week-btn").disabled = weekOffset >= 0;
  generateReport();
}

// ── Generate report ───────────────────────────────────────────
async function generateReport() {
  try {
    Loading.pageOverlay("Loading weekly report...");

    var dates    = getWeekDates(weekOffset);
    var mon      = dates[0];
    var fri      = dates[4];
    var weekLabel = mon.full + " – " + fri.full + " " + new Date().getFullYear();

    // Update labels
    document.getElementById("week-display").textContent      = weekLabel;
    document.getElementById("report-week-label").textContent = "Week: " + weekLabel;
    document.getElementById("table-week-label").textContent  = weekLabel;
    document.getElementById("next-week-btn").disabled        = weekOffset >= 0;

    // Load all data
    var studentsRes = await Sheets.getStudentsWithBalances();
    var txRes       = await Sheets.getTransactions();

    allStudents = studentsRes.sort(function (a, b) {
      return Number(a.admNo) - Number(b.admNo);
    });

    // Filter transactions to this week only
    allTx = (txRes.transactions || []).filter(function (tx) {
      return tx.type === "MEAL" &&
             tx.date >= mon.date &&
             tx.date <= fri.date;
    });

    renderTable(dates);

    Loading.hideOverlay();
    document.getElementById("report-page").style.display = "block";

  } catch (err) {
    document.getElementById("loading-overlay").innerHTML =
      '<div style="color:var(--danger);text-align:center">' +
        '<div style="font-size:32px;margin-bottom:12px">❌</div>' +
        '<div>Failed to load report</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:8px">' + err.message + '</div>' +
        '<a href="reports.html" class="btn btn-secondary" style="margin-top:16px">← Go Back</a>' +
      '</div>';
  }
}

// ── Render table ──────────────────────────────────────────────
function renderTable(dates) {

  // Build meal map — admNo → date → { food, tea, porridge, cost }
  var mealMap = {};
  allTx.forEach(function (tx) {
    var adm = String(tx.admNo);
    if (!mealMap[adm]) mealMap[adm] = {};
    if (!mealMap[adm][tx.date]) {
      mealMap[adm][tx.date] = { food:false, tea:false, porridge:false, cost:0 };
    }
    if (tx.food     === "YES") mealMap[adm][tx.date].food     = true;
    if (tx.tea      === "YES") mealMap[adm][tx.date].tea      = true;
    if (tx.porridge === "YES") mealMap[adm][tx.date].porridge = true;
    mealMap[adm][tx.date].cost =
      (mealMap[adm][tx.date].food     ? 50 : 0) +
      (mealMap[adm][tx.date].tea      ? 15 : 0) +
      (mealMap[adm][tx.date].porridge ? 10 : 0);
  });

  // Check balance mismatch for each student
  // Expected = totalPaidIn - totalSpent
  // Flag if difference > KES 5
  var flagged   = {};
  var flagNotes = [];

  allStudents.forEach(function (s) {
    var paid     = s.totalToppedUp || 0;
    var spent    = s.totalSpent    || 0;
    var actual   = s.balance       || 0;
    var expected = paid - spent;
    var diff     = Math.abs(expected - actual);

    if (diff > 5) {
      flagged[String(s.admNo)] = {
        expected : expected,
        actual   : actual,
        diff     : diff,
        paid     : paid,
        spent    : spent
      };
    }
  });

  // Table header
  var thead = document.getElementById("week-thead");
  thead.innerHTML =
    '<tr>' +
      '<th>ADM</th>' +
      '<th>Student</th>' +
      '<th>Class</th>' +
      dates.map(function (d) {
        return '<th class="day-col">' + d.label +
          '<br><span style="font-weight:400;font-size:10px">' + d.full + '</span></th>';
      }).join("") +
      '<th class="text-right">Week Total</th>' +
      '<th class="text-right">Balance</th>' +
    '</tr>';

  // Stats
  var totalMeals        = 0;
  var totalDeducted     = 0;
  var studentsWithMeals = new Set();
  var flagCount         = 0;

  // Build rows
  var tbody   = document.getElementById("week-tbody");
  var rows    = "";

  allStudents.forEach(function (s) {
    var adm       = String(s.admNo);
    var weekTotal = 0;
    var bal       = s.balance || 0;
    var balCls    = bal >= 0 ? "text-success" : "text-danger";
    var isFlagged = flagged[adm];

    if (isFlagged) {
      flagCount++;
      flagNotes.push({
        name    : s.name,
        admNo   : s.admNo,
        grade   : s.displayGrade,
        expected: isFlagged.expected,
        actual  : isFlagged.actual,
        diff    : isFlagged.diff,
        paid    : isFlagged.paid,
        spent   : isFlagged.spent
      });
    }

    var dayCells = dates.map(function (d) {
      var m = mealMap[adm] && mealMap[adm][d.date];
      if (!m) {
        return '<td class="day-col"><span class="no-meal">—</span></td>';
      }

      studentsWithMeals.add(adm);
      totalMeals++;
      totalDeducted += m.cost;
      weekTotal     += m.cost;

      var icons =
        (m.food     ? '🍽️' : '') +
        (m.tea      ? '☕'  : '') +
        (m.porridge ? '🌾'  : '');

      return '<td class="day-col">' +
        '<div class="meal-dot">' + icons + '</div>' +
        '<div style="font-size:10px;color:var(--warning);margin-top:2px">KES ' + m.cost + '</div>' +
      '</td>';
    }).join("");

    var nameDisplay = isFlagged
      ? '<span style="color:var(--warning)">⭐ ' + s.name + '</span>'
      : s.name;

    rows +=
      '<tr' + (isFlagged ? ' style="background:rgba(243,156,18,0.06)"' : '') + '>' +
        '<td style="color:var(--muted);font-size:12px">' + s.admNo + '</td>' +
        '<td class="fw-600">' + nameDisplay + '</td>' +
        '<td style="color:var(--muted)">' + s.displayGrade + '</td>' +
        dayCells +
        '<td class="text-right text-mono ' + (weekTotal > 0 ? "text-warning" : "text-muted") + '">' +
          (weekTotal > 0 ? 'KES ' + weekTotal : '—') +
        '</td>' +
        '<td class="text-right text-mono fw-600 ' + balCls + '">' +
          (isFlagged ? '⭐ ' : '') +
          'KES ' + Math.abs(bal).toLocaleString() +
        '</td>' +
      '</tr>';
  });

  tbody.innerHTML = rows;

  // Render flag notes
  renderFlagNotes(flagNotes, flagCount);

  // Update summary cards
  document.getElementById("sum-students").textContent  = studentsWithMeals.size;
  document.getElementById("sum-meals").textContent     = totalMeals;
  document.getElementById("sum-deducted").textContent  = "KES " + totalDeducted.toLocaleString();
  document.getElementById("sum-flagged").textContent   = flagCount > 0
    ? "⭐ " + flagCount
    : "✅ 0";
}

// ── Render flag notes section ─────────────────────────────────
function renderFlagNotes(flagNotes, flagCount) {
  var flagEl = document.getElementById("flag-notes");
  if (!flagEl) return;

  if (flagCount === 0) {
    flagEl.innerHTML =
      '<div style="color:var(--success);font-size:13px;padding:12px 0">' +
        '✅ All student balances check out — no discrepancies found this week.' +
      '</div>';
    return;
  }

  var html =
    '<div style="font-size:13px;font-weight:600;color:var(--warning);margin-bottom:12px">' +
      '⭐ ' + flagCount + ' student' + (flagCount !== 1 ? 's' : '') +
      ' with balance discrepancies — please review and correct:' +
    '</div>';

  flagNotes.forEach(function (f) {
    var diff    = f.expected - f.actual;
    var msg     = diff > 0
      ? 'Balance is KES ' + Math.abs(diff) + ' less than expected — possible unrecorded payment or extra deduction'
      : 'Balance is KES ' + Math.abs(diff) + ' more than expected — possible unrecorded meal';

    html +=
      '<div style="background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.25);' +
        'border-radius:8px;padding:14px;margin-bottom:10px">' +
        '<div style="font-weight:600;color:var(--light);margin-bottom:6px;font-size:14px">' +
          '⭐ ' + f.name +
          '<span style="color:var(--muted);font-weight:400;font-size:12px;margin-left:8px">' +
            f.grade + ' · ADM ' + f.admNo +
          '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--muted);line-height:2">' +
          'Total Paid In: <strong style="color:var(--success)">KES ' + f.paid.toLocaleString() + '</strong>' +
          ' &nbsp;·&nbsp; ' +
          'Total Spent: <strong style="color:var(--warning)">KES ' + f.spent.toLocaleString() + '</strong>' +
          '<br>' +
          'Expected Balance: <strong style="color:var(--light)">KES ' + f.expected.toLocaleString() + '</strong>' +
          ' &nbsp;·&nbsp; ' +
          'Actual Balance: <strong style="color:' + (f.actual >= 0 ? 'var(--success)' : 'var(--danger)') + '">' +
            'KES ' + f.actual.toLocaleString() +
          '</strong>' +
          '<br>' +
          '<span style="color:var(--warning)">⚠️ ' + msg + '</span>' +
        '</div>' +
      '</div>';
  });

  flagEl.innerHTML = html;
}

// ── Generate PDF of this week ─────────────────────────────────
function generateWeeklyPDF() {
  PDF.weeklyReport(weekOffset);
}