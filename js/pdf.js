// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// pdf.js — All PDF Generation
// Uses browser print dialog — no external libraries needed
// ============================================================

// ── Self-contained toast — pdf.js never relies on other files ─
function _pdfToast(msg, type) {
  type = type || "success";
  var icons = { success:"✅", error:"❌", warning:"⚠️" };
  var container = document.getElementById("toast-container");
  if (!container) return;
  var el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = "<span>" + (icons[type] || "ℹ️") + "</span><span>" + msg + "</span>";
  container.appendChild(el);
  setTimeout(function () { el.remove(); }, 4000);
}

var PDF = {

  // ── Shared school branding header ─────────────────────────
  header: function (title, subtitle) {
    return (
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;' +
        'margin-bottom:8px">' +
        '<div>' +
          '<div style="font-size:20px;font-weight:700;color:#1a5c2e">🍽️ Greenshine Academy</div>' +
          '<div style="font-size:12px;color:#666">Canteen Finance System — Confidential</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:14px;font-weight:600;color:#C0392B">' + title + '</div>' +
          '<div style="font-size:11px;color:#666">' + subtitle + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="height:3px;background:linear-gradient(90deg,#1a5c2e,#8B3A2A,#C0392B);' +
        'border-radius:2px;margin-bottom:20px"></div>'
    );
  },

  // ── Shared print styles ────────────────────────────────────
  printStyles: function () {
    return (
      '<style>' +
        'body{font-family:Arial,sans-serif;font-size:13px;color:#111;background:white;margin:0;padding:20px}' +
        'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}' +
        'thead th{background:#1a5c2e;color:white;padding:8px 10px;text-align:left;font-size:11px;' +
          'letter-spacing:0.5px;text-transform:uppercase}' +
        'tbody tr:nth-child(even){background:#f9f9f9}' +
        'tbody tr:hover{background:#f0f0f0}' +
        'tbody td{padding:8px 10px;border-bottom:1px solid #eee}' +
        '.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}' +
        '.badge-food{background:#d5f5e3;color:#1a7a40}' +
        '.badge-tea{background:#d6eaf8;color:#1a6fa8}' +
        '.badge-porridge{background:#fef9e7;color:#b7770d}' +
        '.positive{color:#1a7a40;font-weight:600}' +
        '.negative{color:#C0392B;font-weight:600}' +
        '.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}' +
        '.summary-card{background:#f8f8f8;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center}' +
        '.summary-card .val{font-size:22px;font-weight:700;color:#1a5c2e}' +
        '.summary-card .lbl{font-size:10px;color:#666;margin-top:4px}' +
        '.section-title{font-size:13px;font-weight:700;color:#1a5c2e;' +
          'border-bottom:2px solid #1a5c2e;padding-bottom:4px;margin:20px 0 10px}' +
        '.footer{margin-top:24px;padding-top:12px;border-top:1px solid #ddd;' +
          'font-size:10px;color:#999;display:flex;justify-content:space-between}' +
        '.period-badge{display:inline-block;background:#1a5c2e;color:white;' +
          'padding:3px 10px;border-radius:12px;font-size:11px;margin-bottom:16px}' +
        '@media print{body{padding:10px}button{display:none}}' +
      '</style>'
    );
  },

  // ── Open print window ──────────────────────────────────────
  print: function (html, title) {
    var win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      _pdfToast("Please allow popups to generate PDF", "warning");
      return;
    }
    win.document.write(
      '<!DOCTYPE html><html><head>' +
        '<meta charset="UTF-8"/>' +
        '<title>' + title + ' — Greenshine Canteen</title>' +
        PDF.printStyles() +
      '</head><body>' +
        html +
        '<script>window.onload=function(){window.print();}<\/script>' +
      '</body></html>'
    );
    win.document.close();
  },

  // ── Period picker popup ────────────────────────────────────
  // Shows modal asking admin which period to generate report for
  pickPeriod: function (studentName, callback) {
    // Remove existing picker
    var existing = document.getElementById("pdf-period-modal");
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.id  = "pdf-period-modal";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;" +
      "display:flex;align-items:center;justify-content:center;" +
      "backdrop-filter:blur(4px)";

    modal.innerHTML =
      '<div style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.15);' +
        'border-radius:12px;padding:28px;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">' +
        '<div style="font-size:16px;font-weight:600;color:#f5f5f0;margin-bottom:6px">' +
          '📄 Generate Report' +
        '</div>' +
        '<div style="font-size:13px;color:#888;margin-bottom:20px">' +
          'for <strong style="color:#f5f5f0">' + studentName + '</strong>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">' +
          ['past-3-days','past-week','past-30-days','full-report'].map(function (id, i) {
            var labels = ["Past 3 Days", "Past One Week", "Last 30 Days", "Full Report (all time)"];
            var icons  = ["📅", "🗓️", "📆", "📚"];
            return (
              '<label style="display:flex;align-items:center;gap:12px;' +
                'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);' +
                'border-radius:8px;padding:12px 14px;cursor:pointer;transition:all 0.2s">' +
                '<input type="radio" name="pdf-period" value="' + id + '" ' +
                  (i === 0 ? 'checked' : '') + ' style="accent-color:#C0392B;width:16px;height:16px"/>' +
                '<span style="font-size:18px">' + icons[i] + '</span>' +
                '<span style="font-size:14px;color:#f5f5f0">' + labels[i] + '</span>' +
              '</label>'
            );
          }).join("") +
        '</div>' +

        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
          '<button onclick="document.getElementById(\'pdf-period-modal\').remove()" ' +
            'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);' +
            'color:#f5f5f0;padding:9px 18px;border-radius:6px;cursor:pointer;font-size:13px">' +
            '✕ Cancel' +
          '</button>' +
          '<button onclick="PDF._confirmPeriod()" ' +
            'style="background:#C0392B;border:none;color:white;padding:9px 18px;' +
            'border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">' +
            '📄 Generate PDF' +
          '</button>' +
        '</div>' +
      '</div>';

    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
    PDF._periodCallback = callback;
  },

  _periodCallback: null,

  _confirmPeriod: function () {
    var selected = document.querySelector('input[name="pdf-period"]:checked');
    if (!selected) return;
    var modal = document.getElementById("pdf-period-modal");
    if (modal) modal.remove();
    if (PDF._periodCallback) PDF._periodCallback(selected.value);
  },

  // ── Get date range from period key ────────────────────────
  getDateRange: function (period) {
    var today  = new Date();
    var toDate = today.toISOString().slice(0, 10);
    var fromDate;

    if (period === "past-3-days") {
      var d = new Date(today); d.setDate(d.getDate() - 3);
      fromDate = d.toISOString().slice(0, 10);
    } else if (period === "past-week") {
      var d = new Date(today); d.setDate(d.getDate() - 7);
      fromDate = d.toISOString().slice(0, 10);
    } else if (period === "past-30-days") {
      var d = new Date(today); d.setDate(d.getDate() - 30);
      fromDate = d.toISOString().slice(0, 10);
    } else {
      fromDate = "2000-01-01"; // full report
    }

    return { from: fromDate, to: toDate };
  },

  // ── Period label for display ──────────────────────────────
  periodLabel: function (period) {
    var labels = {
      "past-3-days"  : "Past 3 Days",
      "past-week"    : "Past One Week",
      "past-30-days" : "Last 30 Days",
      "full-report"  : "Full Report (All Time)"
    };
    return labels[period] || period;
  },

  // ============================================================
  // STUDENT REPORT — Single student meal + payment history
  // Called from Students page — "Report" button per student
  // ============================================================
  studentReport: async function (student) {
    PDF.pickPeriod(student.name, async function (period) {
      try {
        _pdfToast("Generating report for " + student.name + "...", "success");

        var range  = PDF.getDateRange(period);
        var txRes  = await Sheets.getTransactions(student.admNo);
        var allTxs = (txRes.transactions || []).filter(function (tx) {
          return tx.date >= range.from && tx.date <= range.to;
        });

        var meals    = allTxs.filter(function (tx) { return tx.type === "MEAL"; });
        var payments = allTxs.filter(function (tx) { return tx.type === "PAYMENT"; });

        var totalSpent  = meals.reduce(function (s, tx) { return s + (tx.amount || 0); }, 0);
        var totalPaid   = payments.reduce(function (s, tx) { return s + (tx.amount || 0); }, 0);
        var bal         = student.balance || 0;
        var t           = GREENSHINE.TYPES[student.type] || GREENSHINE.TYPES["0"];

        var generated = new Date().toLocaleString("en-KE", {
          weekday:"long", day:"numeric", month:"long", year:"numeric",
          hour:"2-digit", minute:"2-digit"
        });

        var html =
          PDF.header("Student Meal Report", "Generated: " + generated) +

          // Student info
          '<div style="background:#f8f8f8;border:1px solid #ddd;border-radius:8px;' +
            'padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;' +
            'align-items:flex-start">' +
            '<div>' +
              '<div style="font-size:18px;font-weight:700;color:#1a5c2e">' + student.name + '</div>' +
              '<div style="font-size:12px;color:#666;margin-top:4px">' +
                'ADM: ' + student.admNo + ' · ' + student.displayGrade +
                ' · Type: ' + student.type + ' (' + t.label + ')' +
              '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<div style="font-size:22px;font-weight:700;color:' + (bal >= 0 ? "#1a7a40" : "#C0392B") + '">' +
                'KES ' + Math.abs(bal).toLocaleString() +
              '</div>' +
              '<div style="font-size:11px;color:#666">' + (bal >= 0 ? "Credit Balance" : "Outstanding Debt") + '</div>' +
            '</div>' +
          '</div>' +

          '<span class="period-badge">' + PDF.periodLabel(period) + '</span>' +

          // Summary cards
          '<div class="summary-grid">' +
            '<div class="summary-card"><div class="val">' + meals.length + '</div><div class="lbl">Meals Recorded</div></div>' +
            '<div class="summary-card"><div class="val">' + payments.length + '</div><div class="lbl">Payments Made</div></div>' +
            '<div class="summary-card"><div class="val" style="color:#b7770d">KES ' + totalSpent.toLocaleString() + '</div><div class="lbl">Total Deducted</div></div>' +
            '<div class="summary-card"><div class="val" style="color:#1a7a40">KES ' + totalPaid.toLocaleString() + '</div><div class="lbl">Total Paid In</div></div>' +
          '</div>' +

          // Meal history
          '<div class="section-title">🍽️ Meal History</div>' +
          (meals.length === 0
            ? '<div style="color:#999;padding:16px 0">No meals recorded in this period.</div>'
            : '<table>' +
                '<thead><tr>' +
                  '<th>Date</th><th>Day</th><th>Items</th><th style="text-align:right">Cost</th>' +
                '</tr></thead>' +
                '<tbody>' +
                  meals.sort(function (a, b) { return b.date.localeCompare(a.date); })
                  .map(function (tx) {
                    var d     = new Date(tx.date);
                    var day   = d.toLocaleDateString("en-KE", { weekday:"short" });
                    var items = [
                      tx.food     === "YES" ? '<span class="badge badge-food">🍽️ Lunch</span>'       : "",
                      tx.tea      === "YES" ? '<span class="badge badge-tea">☕ Tea</span>'           : "",
                      tx.porridge === "YES" ? '<span class="badge badge-porridge">🌾 Porridge</span>' : ""
                    ].filter(Boolean).join(" ");
                    var cost = (tx.food === "YES" ? 50 : 0) +
                               (tx.tea  === "YES" ? 15 : 0) +
                               (tx.porridge === "YES" ? 10 : 0);
                    return '<tr>' +
                      '<td>' + tx.date + '</td>' +
                      '<td>' + day + '</td>' +
                      '<td>' + (items || "—") + '</td>' +
                      '<td style="text-align:right;color:#b7770d;font-weight:600">KES ' + cost + '</td>' +
                    '</tr>';
                  }).join("") +
                '</tbody>' +
              '</table>'
          ) +

          // Payment history
          '<div class="section-title">💰 Payment History</div>' +
          (payments.length === 0
            ? '<div style="color:#999;padding:16px 0">No payments recorded in this period.</div>'
            : '<table>' +
                '<thead><tr>' +
                  '<th>Date</th><th>Reference</th>' +
                  '<th style="text-align:right">Amount</th>' +
                  '<th>Recorded By</th>' +
                '</tr></thead>' +
                '<tbody>' +
                  payments.sort(function (a, b) { return b.date.localeCompare(a.date); })
                  .map(function (tx) {
                    return '<tr>' +
                      '<td>' + tx.date + '</td>' +
                      '<td>' + (tx.ref || "—") + '</td>' +
                      '<td style="text-align:right;color:#1a7a40;font-weight:600">+ KES ' + (tx.amount || 0).toLocaleString() + '</td>' +
                      '<td>' + (tx.recordedBy || "—") + '</td>' +
                    '</tr>';
                  }).join("") +
                '</tbody>' +
              '</table>'
          ) +

          // Footer
          '<div class="footer">' +
            '<span>Greenshine Academy · Canteen Finance System · Confidential</span>' +
            '<span>Generated: ' + generated + '</span>' +
          '</div>';

        PDF.print(html, student.name + " Meal Report");

      } catch (err) {
        _pdfToast("Failed to generate report: " + err.message, "error");
      }
    });
  },

  // ============================================================
  // ALL BALANCES REPORT — Every student, sorted by ADM
  // ============================================================
  allBalancesReport: async function () {
    try {
      _pdfToast("Generating all balances report...", "success");

      var studentsRes = await Sheets.getStudentsWithBalances();
      var students    = studentsRes.sort(function (a, b) {
        return Number(a.admNo) - Number(b.admNo);
      });

      var totalCredit  = 0;
      var totalDebt    = 0;
      var inDebt       = 0;
      var generated    = new Date().toLocaleString("en-KE", {
        weekday:"long", day:"numeric", month:"long", year:"numeric",
        hour:"2-digit", minute:"2-digit"
      });

      // Class order — Grade 6 down to PG
      var classOrder = ["Grade 6","Grade 5","Grade 4","Grade 3","Grade 2","Grade 1","PP2","PP1","PG"];
      var grouped    = {};
      classOrder.forEach(function (g) { grouped[g] = []; });

      students.forEach(function (s) {
        var bal = s.balance || 0;
        if (bal >= 0) totalCredit += bal;
        else { totalDebt += Math.abs(bal); inDebt++; }
        // Only include students who have eaten (totalSpent > 0)
        if ((s.totalSpent || 0) === 0 && (s.totalToppedUp || 0) === 0) return;
        var grp = s.displayGrade || "Other";
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(s);
      });

      // Build grouped rows
      var tableRows = "";
      classOrder.forEach(function (grp) {
        var grpStudents = grouped[grp];
        if (!grpStudents || grpStudents.length === 0) return;

        tableRows +=
          '<tr style="background:#1a5c2e">' +
            '<td colspan="7" style="color:white;font-weight:700;font-size:12px;' +
              'padding:6px 10px;letter-spacing:0.5px">' +
              '📚 ' + grp + ' — ' + grpStudents.length + ' student' + (grpStudents.length !== 1 ? 's' : '') +
            '</td>' +
          '</tr>';

        grpStudents.forEach(function (s) {
          var bal    = s.balance || 0;
          var balCls = bal >= 0 ? "positive" : "negative";
          var t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
          tableRows +=
            '<tr>' +
              '<td style="color:#666;font-size:11px">' + s.admNo + '</td>' +
              '<td style="font-weight:600">' + s.name + '</td>' +
              '<td>' + s.displayGrade + '</td>' +
              '<td>' + s.type + ' · ' + t.label + '</td>' +
              '<td style="text-align:right;color:#1a7a40">KES ' + (s.totalToppedUp || 0).toLocaleString() + '</td>' +
              '<td style="text-align:right;color:#b7770d">KES ' + (s.totalSpent || 0).toLocaleString() + '</td>' +
              '<td style="text-align:right" class="' + balCls + '">' +
                (bal >= 0 ? "" : "- ") + 'KES ' + Math.abs(bal).toLocaleString() +
              '</td>' +
            '</tr>';
        });
      });

      var html =
        PDF.header("All Student Balances", "Generated: " + generated) +

        '<div class="summary-grid">' +
          '<div class="summary-card"><div class="val">' + students.length + '</div><div class="lbl">Active Students</div></div>' +
          '<div class="summary-card"><div class="val">' + inDebt + '</div><div class="lbl">In Debt</div></div>' +
          '<div class="summary-card"><div class="val" style="color:#1a7a40">KES ' + totalCredit.toLocaleString() + '</div><div class="lbl">Total Credit</div></div>' +
          '<div class="summary-card"><div class="val" style="color:#C0392B">KES ' + totalDebt.toLocaleString() + '</div><div class="lbl">Total Debt</div></div>' +
        '</div>' +

        '<table>' +
          '<thead><tr>' +
            '<th>ADM</th><th>Student Name</th><th>Class</th><th>Type</th>' +
            '<th style="text-align:right">Total Paid</th>' +
            '<th style="text-align:right">Total Spent</th>' +
            '<th style="text-align:right">Balance</th>' +
          '</tr></thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +

        '<div class="footer">' +
          '<span>Greenshine Academy · Canteen Finance System · Confidential — Internal Use Only</span>' +
          '<span>Generated: ' + generated + '</span>' +
        '</div>';

      PDF.print(html, "All Student Balances");

    } catch (err) {
      _pdfToast("Failed to generate report: " + err.message, "error");
    }
  },

  // ============================================================
  // DEBT REPORT — Students with negative balances only
  // ============================================================
  debtReport: async function () {
    try {
      _pdfToast("Generating debt report...", "success");

      var students  = await Sheets.getStudentsWithBalances();
      var debtors   = students
        .filter(function (s) { return (s.balance || 0) < 0; })
        .sort(function (a, b) { return (a.balance || 0) - (b.balance || 0); });

      var totalDebt = debtors.reduce(function (sum, s) { return sum + Math.abs(s.balance || 0); }, 0);
      var generated = new Date().toLocaleString("en-KE", {
        weekday:"long", day:"numeric", month:"long", year:"numeric",
        hour:"2-digit", minute:"2-digit"
      });

      var html =
        PDF.header("⚠️ Student Debt Report", "Generated: " + generated) +

        '<div style="background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;' +
          'padding:10px 14px;margin-bottom:16px;font-size:12px;color:#721c24">' +
          '<strong>Action Required:</strong> All students below have negative canteen balances. ' +
          'Please follow up with parents or guardians. Students continue to receive meals regardless of balance.' +
        '</div>' +

        '<div class="summary-grid">' +
          '<div class="summary-card"><div class="val" style="color:#C0392B">' + debtors.length + '</div><div class="lbl">Students in Debt</div></div>' +
          '<div class="summary-card"><div class="val" style="color:#C0392B">KES ' + totalDebt.toLocaleString() + '</div><div class="lbl">Total Outstanding</div></div>' +
        '</div>' +

        '<table>' +
          '<thead><tr>' +
            '<th>ADM</th><th>Student Name</th><th>Class</th><th>Type</th>' +
            '<th style="text-align:right">Daily Cost</th>' +
            '<th style="text-align:right">Balance</th>' +
            '<th style="text-align:right">Equiv. Days</th>' +
          '</tr></thead>' +
          '<tbody>' +
            debtors.map(function (s) {
              var bal      = s.balance || 0;
              var daily    = s.dailyCost || 0;
              var equiv    = daily > 0 ? Math.ceil(Math.abs(bal) / daily) : "—";
              var t        = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
              return '<tr>' +
                '<td style="color:#666;font-size:11px">' + s.admNo + '</td>' +
                '<td style="font-weight:600">' + s.name + '</td>' +
                '<td>' + s.displayGrade + '</td>' +
                '<td>' + s.type + ' · ' + t.label + '</td>' +
                '<td style="text-align:right">KES ' + daily + '/day</td>' +
                '<td style="text-align:right" class="negative">- KES ' + Math.abs(bal).toLocaleString() + '</td>' +
                '<td style="text-align:right;color:#666">' + equiv + ' days</td>' +
              '</tr>';
            }).join("") +
          '</tbody>' +
        '</table>' +

        '<div style="margin-top:16px;padding:10px 14px;background:#f8f8f8;' +
          'border-radius:6px;font-size:12px;text-align:right">' +
          '<strong>Total Outstanding: KES ' + totalDebt.toLocaleString() + '</strong> · ' +
          debtors.length + ' students' +
        '</div>' +

        '<div class="footer">' +
          '<span>Greenshine Academy · Canteen Finance System · Confidential — Internal Use Only</span>' +
          '<span>Printed: ' + generated + '</span>' +
        '</div>';

      PDF.print(html, "Student Debt Report");

    } catch (err) {
      _pdfToast("Failed to generate debt report: " + err.message, "error");
    }
  },

  // ============================================================
  // WEEKLY REPORT — All students, Mon-Fri meal grid
  // ============================================================
  weeklyReport: async function (weekOffset) {
    try {
      weekOffset = weekOffset || 0;
      _pdfToast("Generating weekly report...", "success");

      // Get Mon-Fri dates
      var today = new Date();
      var day   = today.getDay();
      var mon   = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7));

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

      var weekLabel = dates[0].full + " – " + dates[4].full + " " + today.getFullYear();

      var [studentsRes, txRes] = await Promise.all([
        Sheets.getStudentsWithBalances(),
        Sheets.getTransactions()
      ]);

      var students = studentsRes.sort(function (a, b) {
        return Number(a.admNo) - Number(b.admNo);
      });

      // Build meal map
      var mealMap = {};
      (txRes.transactions || []).forEach(function (tx) {
        if (tx.type !== "MEAL") return;
        var adm = String(tx.admNo);
        if (!mealMap[adm]) mealMap[adm] = {};
        if (!mealMap[adm][tx.date]) mealMap[adm][tx.date] = { food:false, tea:false, porridge:false };
        if (tx.food     === "YES") mealMap[adm][tx.date].food     = true;
        if (tx.tea      === "YES") mealMap[adm][tx.date].tea      = true;
        if (tx.porridge === "YES") mealMap[adm][tx.date].porridge = true;
      });

      var generated = new Date().toLocaleString("en-KE", {
        weekday:"long", day:"numeric", month:"long",
        year:"numeric", hour:"2-digit", minute:"2-digit"
      });

      var totalMeals        = 0;
      var studentsWithMeals = 0;
      var totalDeducted     = 0;

      // Class order — Grade 6 down to PG
      var classOrder = ["Grade 6","Grade 5","Grade 4","Grade 3","Grade 2","Grade 1","PP2","PP1","PG"];

      // Group students by class, skip those with no meals this period
      var grouped = {};
      classOrder.forEach(function (g) { grouped[g] = []; });

      students.forEach(function (s) {
        var adm     = String(s.admNo);
        var hasMeals = dates.some(function (d) {
          return mealMap[adm] && mealMap[adm][d.date];
        });
        if (!hasMeals) return; // Skip students with no meals
        var grp = s.displayGrade || "Other";
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(s);
        studentsWithMeals++;
      });

      // Build rows grouped by class
      var rows = "";
      classOrder.forEach(function (grp) {
        var grpStudents = grouped[grp];
        if (!grpStudents || grpStudents.length === 0) return;

        // Class header row
        rows +=
          '<tr style="background:#1a5c2e">' +
            '<td colspan="' + (5 + dates.length + 2) + '" ' +
              'style="color:white;font-weight:700;font-size:12px;padding:6px 10px;letter-spacing:0.5px">' +
              '📚 ' + grp + ' — ' + grpStudents.length + ' student' + (grpStudents.length !== 1 ? 's' : '') +
            '</td>' +
          '</tr>';

        grpStudents.forEach(function (s) {
          var adm       = String(s.admNo);
          var weekTotal = 0;
          var bal       = s.balance || 0;

          var dayCells = dates.map(function (d) {
            var m = mealMap[adm] && mealMap[adm][d.date];
            if (!m) return '<td style="text-align:center;color:#ccc">—</td>';
            totalMeals++;
            var cost = (m.food ? 50 : 0) + (m.tea ? 15 : 0) + (m.porridge ? 10 : 0);
            weekTotal    += cost;
            totalDeducted += cost;
            var icons = (m.food ? "🍽️" : "") + (m.tea ? "☕" : "") + (m.porridge ? "🌾" : "");
            return '<td style="text-align:center">' +
              '<div style="font-size:14px">' + icons + '</div>' +
              '<div style="font-size:10px;color:#b7770d">KES ' + cost + '</div>' +
            '</td>';
          }).join("");

          rows +=
            '<tr>' +
              '<td style="font-size:11px;color:#666">' + s.admNo + '</td>' +
              '<td style="font-weight:600">' + s.name + '</td>' +
              '<td style="color:#666">' + s.displayGrade + '</td>' +
              dayCells +
              '<td style="text-align:right;font-weight:600;color:#b7770d">' +
                'KES ' + weekTotal +
              '</td>' +
              '<td style="text-align:right;font-weight:600;color:' + (bal >= 0 ? '#1a7a40' : '#C0392B') + '">' +
                (bal >= 0 ? "" : "- ") + 'KES ' + Math.abs(bal).toLocaleString() +
              '</td>' +
            '</tr>';
        });
      });

      var html =
        PDF.header("Weekly Meal Summary", "Week: " + weekLabel) +

        '<div class="summary-grid">' +
          '<div class="summary-card"><div class="val">' + students.length + '</div><div class="lbl">Total Students</div></div>' +
          '<div class="summary-card"><div class="val">' + studentsWithMeals + '</div><div class="lbl">Ate This Week</div></div>' +
          '<div class="summary-card"><div class="val">' + totalMeals + '</div><div class="lbl">Total Meals</div></div>' +
          '<div class="summary-card"><div class="val" style="color:#b7770d">KES ' + totalDeducted + '</div><div class="lbl">Total Deducted</div></div>' +
        '</div>' +

        '<table>' +
          '<thead><tr>' +
            '<th>ADM</th><th>Student</th><th>Class</th>' +
            dates.map(function (d) {
              return '<th style="text-align:center">' + d.label + '<br><span style="font-weight:400;font-size:10px">' + d.full + '</span></th>';
            }).join("") +
            '<th style="text-align:right">Week Total</th>' +
            '<th style="text-align:right">Balance</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +

        '<div class="footer">' +
          '<span>Greenshine Academy · Canteen Finance System · Confidential — Internal Use Only</span>' +
          '<span>Generated: ' + generated + '</span>' +
        '</div>';

      PDF.print(html, "Weekly Meal Report — " + weekLabel);

    } catch (err) {
      _pdfToast("Failed to generate weekly report: " + err.message, "error");
    }
  }

};