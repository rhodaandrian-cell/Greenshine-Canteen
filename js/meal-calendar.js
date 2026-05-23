// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// meal-calendar.js — Meal Calendar Page Logic
// Depends on: config.js, sheets.js, animation.js
// ============================================================

var allStudents     = [];
var allMealTx       = [];
var allPaymentTx    = [];
var mode            = "student";
var selectedStudent = null;

// ── Boot ─────────────────────────────────────────────────────
window.addEventListener("load", function () {
  initParticleNetwork("particle-canvas");
  setTodayDate();
  setCustomDateDefaults();
  loadData();
});

function setTodayDate() {
  var opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  var el   = document.getElementById("today-date");
  if (el) el.textContent = new Date().toLocaleDateString("en-KE", opts);
}

function setCustomDateDefaults() {
  var now   = new Date();
  var year  = now.getFullYear();
  var month = String(now.getMonth() + 1).padStart(2, "0");
  var day   = String(now.getDate()).padStart(2, "0");
  document.getElementById("custom-from").value = year + "-" + month + "-01";
  document.getElementById("custom-to").value   = year + "-" + month + "-" + day;
}

async function loadData() {
  try {
    var studRes = await Sheets.getStudents();
    allStudents = studRes.students || [];

    var txRes = await Sheets.getTransactions();
    var all   = txRes.transactions || [];

    allMealTx    = all.filter(function (t) { return t.type === "MEAL"; });
    allPaymentTx = all.filter(function (t) { return t.type === "PAYMENT"; });

    try {
      var w  = await Sheets.getWatchlist();
      var el = document.getElementById("watchlist-count");
      if (el) el.textContent = w.watchlistCount || 0;
    } catch (_) {}

  } catch (err) {
    showToast("Failed to load data: " + err.message, "error");
  }
}

// ── Mode switching ────────────────────────────────────────────
function switchMode(m) {
  mode = m;
  document.getElementById("tab-student").classList.toggle("active", m === "student");
  document.getElementById("tab-class").classList.toggle("active",   m === "class");
  document.getElementById("grp-student").classList.toggle("hidden", m !== "student");
  document.getElementById("grp-class").classList.toggle("hidden",   m !== "class");
}

// ── Period change ─────────────────────────────────────────────
function handlePeriodChange() {
  var isCustom = document.getElementById("period-select").value === "custom";
  document.getElementById("grp-custom-from").classList.toggle("hidden", !isCustom);
  document.getElementById("grp-custom-to").classList.toggle("hidden",   !isCustom);
}

// ── Student autocomplete ──────────────────────────────────────
function searchStudents(query) {
  var dd = document.getElementById("student-dropdown");
  query  = (query || "").trim();

  if (query.length < 2) { dd.classList.add("hidden"); return; }

  var lower   = query.toLowerCase();
  var matches = allStudents.filter(function (s) {
    return s.name.toLowerCase().includes(lower) || String(s.admNo).includes(lower);
  }).slice(0, 8);

  if (!matches.length) { dd.classList.add("hidden"); return; }

  dd.innerHTML = matches.map(function (s) {
    return "<div class='dropdown-item' data-adm='" + s.admNo + "'>" +
             "<span>" + s.name + " <span class='dropdown-item-meta'>· " + s.displayGrade + "</span></span>" +
             "<span class='dropdown-item-adm'>" + s.admNo + "</span>" +
           "</div>";
  }).join("");

  dd.querySelectorAll(".dropdown-item").forEach(function (el) {
    el.addEventListener("click", function () {
      var adm = el.getAttribute("data-adm");
      var s   = allStudents.find(function (st) { return String(st.admNo) === String(adm); });
      if (s) selectStudent(s);
    });
  });

  dd.classList.remove("hidden");
}

function selectStudent(s) {
  selectedStudent = s;
  document.getElementById("student-search").value = s.name;
  document.getElementById("student-dropdown").classList.add("hidden");
}

document.addEventListener("click", function (e) {
  if (!e.target.closest("#student-search") && !e.target.closest("#student-dropdown")) {
    var dd = document.getElementById("student-dropdown");
    if (dd) dd.classList.add("hidden");
  }
});

// ── Date helpers ──────────────────────────────────────────────
function toISODate(d) {
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}

function getDateRange() {
  var period = document.getElementById("period-select").value;
  var now    = new Date();
  var yr     = now.getFullYear();

  if (period === "this-week") {
    var dow = now.getDay();
    var mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    var fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    return { from: toISODate(mon), to: toISODate(fri), label: "This Week" };
  }
  if (period === "this-month") {
    var first = new Date(yr, now.getMonth(), 1);
    var last  = new Date(yr, now.getMonth() + 1, 0);
    return { from: toISODate(first), to: toISODate(last), label: now.toLocaleString("en-KE", { month: "long", year: "numeric" }) };
  }
  if (period === "term1") return { from: yr + "-01-06", to: yr + "-03-28", label: "Term 1 " + yr };
  if (period === "term2") return { from: yr + "-04-28", to: yr + "-07-31", label: "Term 2 " + yr };
  if (period === "term3") return { from: yr + "-09-01", to: yr + "-11-28", label: "Term 3 " + yr };
  if (period === "custom") {
    return {
      from : document.getElementById("custom-from").value,
      to   : document.getElementById("custom-to").value,
      label: document.getElementById("custom-from").value + " → " + document.getElementById("custom-to").value
    };
  }
}

function getMonthsInRange(from, to) {
  var months = [];
  var cur    = new Date(from + "T00:00:00");
  var end    = new Date(to   + "T00:00:00");
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months;
}

// ── Build meal map { date: { food, tea, porridge, amount } } ──
function buildMealMap(txList) {
  var map = {};
  txList.forEach(function (tx) {
    if (!map[tx.date]) map[tx.date] = { food: false, tea: false, porridge: false, amount: 0 };
    if (tx.food     === "YES") map[tx.date].food     = true;
    if (tx.tea      === "YES") map[tx.date].tea      = true;
    if (tx.porridge === "YES") map[tx.date].porridge = true;
    map[tx.date].amount += tx.amount;
  });
  return map;
}

// ── Build payment map { date: { amount, ref } } ───────────────
function buildPaymentMap(txList) {
  var map = {};
  txList.forEach(function (tx) {
    if (!map[tx.date]) map[tx.date] = { amount: 0, ref: tx.ref || "" };
    map[tx.date].amount += tx.amount;
    if (tx.ref && !map[tx.date].ref) map[tx.date].ref = tx.ref;
  });
  return map;
}

function mealClass(food, tea, porridge) {
  if (food && tea && porridge) return " had-all";
  if (food && porridge)        return " had-pl";
  if (food && tea)             return " had-tl";
  if (tea  && porridge)        return " had-pt";
  if (food)                    return " had-l";
  if (tea)                     return " had-t";
  if (porridge)                return " had-p";
  return "";
}

// ── Generate ──────────────────────────────────────────────────
async function generateCalendar() {
  var out   = document.getElementById("calendar-output");
  var range = getDateRange();

  if (!range || !range.from || !range.to) {
    showToast("Please fill in the date range", "warning"); return;
  }

  out.innerHTML = "<div class='loading-state'><div class='spinner'></div> Building calendar…</div>";

  try {
    if (mode === "student") {
      await generateStudentCalendar(out, range);
    } else {
      await generateClassCalendar(out, range);
    }
  } catch (err) {
    console.error(err);
    showToast("Error: " + err.message, "error");
    out.innerHTML = "<div class='empty-prompt'><div class='empty-prompt-icon'>⚠️</div><p>Error loading data.</p></div>";
  }
}

async function generateStudentCalendar(out, range) {
  if (!selectedStudent) {
    showToast("Please select a student first", "warning");
    out.innerHTML = "<div class='empty-prompt'><div class='empty-prompt-icon'>👤</div><p>No student selected.</p></div>";
    return;
  }
  var res    = await Sheets.getTransactions(selectedStudent.admNo);
  var all    = res.transactions || [];
  var txList = all.filter(function (t) {
    return t.date >= range.from && t.date <= range.to;
  });
  var mealTx    = txList.filter(function (t) { return t.type === "MEAL"; });
  var paymentTx = txList.filter(function (t) { return t.type === "PAYMENT"; });

  var months = getMonthsInRange(range.from, range.to);
  out.innerHTML = months.map(function (m) {
    return renderStudentMonth(selectedStudent, m.year, m.month, mealTx, paymentTx, range.label);
  }).join("");
}

async function generateClassCalendar(out, range) {
  var classVal = document.getElementById("class-select").value;
  var students = allStudents;
  if (classVal) {
    students = students.filter(function (s) {
      return s.grade === classVal || s.displayGrade === classVal;
    });
  }
  if (!students.length) {
    showToast("No students found for this class", "warning");
    out.innerHTML = "<div class='empty-prompt'><div class='empty-prompt-icon'>🏫</div><p>No students found.</p></div>";
    return;
  }
  var admSet = {};
  students.forEach(function (s) { admSet[String(s.admNo)] = true; });

  var classMealTx = allMealTx.filter(function (t) {
    return t.date >= range.from && t.date <= range.to && admSet[String(t.admNo)];
  });
  var classPayTx = allPaymentTx.filter(function (t) {
    return t.date >= range.from && t.date <= range.to && admSet[String(t.admNo)];
  });

  var months = getMonthsInRange(range.from, range.to);
  out.innerHTML = months.map(function (m) {
    return renderClassMonth(students, m.year, m.month, classMealTx, classPayTx, classVal || "All Classes", range.label);
  }).join("");
}

// ── Render student month ──────────────────────────────────────
function renderStudentMonth(student, year, month, mealTx, paymentTx, periodLabel) {
  var monthMealTx = mealTx.filter(function (t) {
    var d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });
  var monthPayTx = paymentTx.filter(function (t) {
    var d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });

  var mealMap    = buildMealMap(monthMealTx);
  var paymentMap = buildPaymentMap(monthPayTx);
  var monthName  = new Date(year, month, 1).toLocaleString("en-KE", { month: "long" });
  var todayStr   = toISODate(new Date());

  var mealDays = 0, lCount = 0, tCount = 0, pCount = 0, totalMealKES = 0, totalPayKES = 0;
  Object.values(mealMap).forEach(function (m) {
    mealDays++;
    if (m.food)     lCount++;
    if (m.tea)      tCount++;
    if (m.porridge) pCount++;
    totalMealKES += m.amount;
  });
  Object.values(paymentMap).forEach(function (p) { totalPayKES += p.amount; });

  return buildCalPage(
    buildPageHeader(student.name, student.displayGrade + " · Adm No. " + student.admNo, periodLabel),
    buildMonthStrip(monthName, year, mealDays + " Meal Days", "Meals KES " + totalMealKES, "Paid KES " + totalPayKES),
    buildDayCells(year, month, todayStr, mealMap, paymentMap, false),
    buildLegend(false),
    "",
    buildFooter()
  );
}

// ── Render class month ────────────────────────────────────────
function renderClassMonth(students, year, month, mealTx, paymentTx, classLabel, periodLabel) {
  var monthMealTx = mealTx.filter(function (t) {
    var d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });
  var monthPayTx = paymentTx.filter(function (t) {
    var d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });

  var studentMaps    = {};
  var studentPayMaps = {};
  students.forEach(function (s) {
    studentMaps[s.admNo]    = buildMealMap(monthMealTx.filter(function (t) { return String(t.admNo) === String(s.admNo); }));
    studentPayMaps[s.admNo] = buildPaymentMap(monthPayTx.filter(function (t) { return String(t.admNo) === String(s.admNo); }));
  });

  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var dayTotals   = {};
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    var lC = 0, tC = 0, pC = 0, payC = 0, payAmt = 0;
    students.forEach(function (s) {
      var m  = studentMaps[s.admNo]    && studentMaps[s.admNo][dateStr];
      var py = studentPayMaps[s.admNo] && studentPayMaps[s.admNo][dateStr];
      if (m)  { if (m.food) lC++; if (m.tea) tC++; if (m.porridge) pC++; }
      if (py) { payC++; payAmt += py.amount; }
    });
    dayTotals[dateStr] = { lCount: lC, tCount: tC, pCount: pC, payCount: payC, payAmount: payAmt };
  }

  var monthName  = new Date(year, month, 1).toLocaleString("en-KE", { month: "long" });
  var todayStr   = toISODate(new Date());
  var activeDays = Object.values(dayTotals).filter(function (d) { return d.lCount || d.tCount || d.pCount; }).length;
  var totalMeals = Object.values(dayTotals).reduce(function (s, d) { return s + d.lCount + d.tCount + d.pCount; }, 0);
  var totalPaid  = Object.values(dayTotals).reduce(function (s, d) { return s + d.payAmount; }, 0);

  var summaryCards = students.map(function (s) {
    var sm    = studentMaps[s.admNo]    || {};
    var pm    = studentPayMaps[s.admNo] || {};
    var days  = Object.keys(sm).length;
    var spent = Object.values(sm).reduce(function (a, m) { return a + m.amount; }, 0);
    var paid  = Object.values(pm).reduce(function (a, p) { return a + p.amount; }, 0);
    return "<div class='cal-summary-card'>" +
             "<span class='cal-summary-card-name'>" + s.name + "</span>" +
             "<span class='cal-summary-card-stats'>" + days + "d · KES " + spent + " spent" +
               (paid ? " · <span style='color:#1a6e3a'>+KES " + paid + " paid</span>" : "") +
             "</span>" +
           "</div>";
  }).join("");

  var extra = "<div class='cal-student-summary'>" +
                "<div class='cal-student-summary-title'>Student Summary — " + monthName + "</div>" +
                "<div class='cal-student-summary-grid'>" + summaryCards + "</div>" +
              "</div>";

  return buildCalPage(
    buildPageHeader(classLabel, students.length + " students · Numbers = how many ate / paid", periodLabel),
    buildMonthStrip(monthName, year, students.length + " Students", activeDays + " Active Days", "Paid KES " + totalPaid),
    buildDayCells(year, month, todayStr, dayTotals, {}, true),
    buildLegend(true),
    extra,
    buildFooter()
  );
}

// ── Day cells builder ─────────────────────────────────────────
function buildDayCells(year, month, todayStr, mealData, paymentData, isClass) {
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var firstDOW    = new Date(year, month, 1).getDay();
  var startPad    = firstDOW === 0 ? 6 : firstDOW - 1;

  var DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var headers    = DOW_LABELS.map(function (l, i) {
    return "<div class='cal-dow" + (i >= 5 ? " weekend" : "") + "'>" + l + "</div>";
  }).join("");

  var padding = "";
  for (var i = 0; i < startPad; i++) padding += "<div class='cal-day empty'></div>";

  var dayCells = "";
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    var dow     = new Date(dateStr + "T00:00:00").getDay();
    var meal    = mealData[dateStr];
    var pay     = isClass ? null : (paymentData[dateStr] || null);

    var cellCls = "cal-day";
    if (dow === 0 || dow === 6) cellCls += " weekend-day";
    if (dateStr === todayStr)   cellCls += " today";

    var badges  = "";
    var costStr = "";

    if (isClass) {
      var dt = meal; // dayTotals object
      if (dt && (dt.lCount || dt.tCount || dt.pCount)) {
        cellCls += mealClass(dt.lCount > 0, dt.tCount > 0, dt.pCount > 0);
        if (dt.pCount)    badges += "<div class='cal-badge P'>P &times;" + dt.pCount + "</div>";
        if (dt.tCount)    badges += "<div class='cal-badge T'>T &times;" + dt.tCount + "</div>";
        if (dt.lCount)    badges += "<div class='cal-badge L'>L &times;" + dt.lCount + "</div>";
      }
      if (dt && dt.payCount) {
        badges += "<div class='cal-badge PAY'>💰 &times;" + dt.payCount + "</div>";
      }
    } else {
      if (meal) {
        cellCls += mealClass(meal.food, meal.tea, meal.porridge);
        if (meal.porridge) badges  += "<div class='cal-badge P'>P Porridge</div>";
        if (meal.tea)      badges  += "<div class='cal-badge T'>T Tea</div>";
        if (meal.food)     badges  += "<div class='cal-badge L'>L Lunch</div>";
        costStr = "<div class='cal-day-cost'>-KES " + meal.amount + "</div>";
      }
      if (pay) {
        badges  += "<div class='cal-badge PAY'>💰 KES " + pay.amount + "</div>";
      }
    }

    dayCells += "<div class='" + cellCls + "'>" +
                  "<div class='cal-day-num'>" + d + "</div>" +
                  "<div class='cal-meals'>" + badges + "</div>" +
                  costStr +
                "</div>";
  }

  return "<div class='cal-grid-wrap'><div class='cal-grid'>" + headers + padding + dayCells + "</div></div>";
}

// ── HTML helpers ──────────────────────────────────────────────
function buildPageHeader(name, meta, periodLabel) {
  return "<div class='cal-page-header'>" +
           "<div><div class='cal-school-name'>🍽️ Greenshine Academy</div>" +
           "<div class='cal-school-sub'>Canteen Finance System · Meal Record · " + periodLabel + "</div></div>" +
           "<div class='cal-student-info'><div class='cal-student-name'>" + name + "</div>" +
           "<div class='cal-student-meta'>" + meta + "</div></div></div>";
}

function buildMonthStrip(monthName, year, s1, s2, s3) {
  return "<div class='cal-month-strip'>" +
           "<div class='cal-month-title'>" + monthName + " " + year + "</div>" +
           "<div class='cal-month-stats'>" +
             "<div class='cal-stat'><div class='cal-stat-val'>" + s1 + "</div></div>" +
             "<div class='cal-stat'><div class='cal-stat-val'>" + s2 + "</div></div>" +
             "<div class='cal-stat'><div class='cal-stat-val'>" + s3 + "</div></div>" +
           "</div></div>";
}

function buildLegend(isClass) {
  var note = isClass ? "<span class='legend-note'>· Numbers = students who ate / paid that day</span>" : "";
  return "<div class='cal-legend'><div class='cal-legend-title'>Key</div>" +
           "<div class='legend-items'>" +
             "<div class='legend-item'><div class='legend-badge L'>L</div><span class='legend-text'>Lunch — KES 50</span></div>" +
             "<div class='legend-item'><div class='legend-badge T'>T</div><span class='legend-text'>Tea — KES 15</span></div>" +
             "<div class='legend-item'><div class='legend-badge P'>P</div><span class='legend-text'>Porridge — KES 10</span></div>" +
             "<div class='legend-item'><div class='legend-badge PAY'>💰</div><span class='legend-text'>Payment received</span></div>" +
             note +
           "</div></div>";
}

function buildFooter() {
  var printed = new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
  return "<div class='cal-footer'>" +
           "<span>Greenshine Academy · Canteen Finance System · Confidential — Internal Use Only</span>" +
           "<span>Printed: " + printed + "</span>" +
         "</div>";
}

function buildCalPage(header, monthStrip, grid, legend, extra, footer) {
  return "<div class='cal-page'>" + header + monthStrip + grid + extra + legend + footer + "</div>";
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type) {
  var el = document.createElement("div");
  el.className = "toast";
  if (type === "error")   el.style.borderColor = "var(--danger)";
  if (type === "warning") el.style.borderColor = "var(--warning)";
  el.textContent = msg;
  var container = document.getElementById("toast-container");
  if (container) container.appendChild(el);
  setTimeout(function () { el.remove(); }, 3500);
}