// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// students.js — Students Page Logic
// ============================================================

// ── State ─────────────────────────────────────────────────────
let allStudents      = [];
let filteredStudents = [];

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticleNetwork("particle-canvas");
  loadStudents();
});

// ── Load students + balances ──────────────────────────────────
async function loadStudents() {
  try {
    allStudents      = await Sheets.getStudentsWithBalances();
    filteredStudents = [...allStudents];

    document.getElementById("student-count-label").textContent =
      allStudents.length + " active students";

    renderTable(filteredStudents);

    // Watchlist badge
    const wRes = await Sheets.getWatchlist();
    document.getElementById("watchlist-count").textContent =
      wRes.watchlistCount || 0;

  } catch (err) {
    showToast("Failed to load students: " + err.message, "error");
  }
}

// ── Filter students ───────────────────────────────────────────
function filterStudents() {
  const search  = document.getElementById("search-input").value.toLowerCase();
  const grade   = document.getElementById("filter-grade").value;
  const type    = document.getElementById("filter-type").value;
  const balance = document.getElementById("filter-balance").value;

  filteredStudents = allStudents.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search) ||
      String(s.admNo).includes(search);

    const matchGrade = !grade || s.displayGrade === grade;
    const matchType  = !type  || s.type === type;

    const bal = s.balance || 0;
    const matchBalance =
      !balance ||
      (balance === "positive" && bal > 0)  ||
      (balance === "negative" && bal < 0)  ||
      (balance === "zero"     && bal === 0);

    return matchSearch && matchGrade && matchType && matchBalance;
  });

  renderTable(filteredStudents);
}

// ── Render students table ─────────────────────────────────────
function renderTable(students) {
  const tbody = document.getElementById("students-table");

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <p>No students found</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    const bal    = s.balance || 0;
    const balCls = bal > 0 ? "text-success" : bal < 0 ? "text-danger" : "text-muted";

    const items = [
      s.food     ? '<span class="badge badge-food">Food</span>'         : "",
      s.tea      ? '<span class="badge badge-tea">Tea</span>'           : "",
      s.porridge ? '<span class="badge badge-porridge">Porridge</span>' : ""
    ].filter(Boolean).join(" ") ||
      '<span style="color:var(--muted);font-size:12px">—</span>';

    const dailyCost = s.dailyCost
      ? `<span class="text-mono" style="font-size:12px">KES ${s.dailyCost}</span>`
      : '<span style="color:var(--muted)">—</span>';

    return `
      <tr class="student-row" onclick="openDetail(${s.admNo})" data-adm="${s.admNo}">
        <td class="fw-600">${s.name}</td>
        <td style="color:var(--muted);font-size:12px">${s.admNo}</td>
        <td>${s.displayGrade}</td>
        <td>
          <span class="badge"
            style="background:${t.color}20;color:${t.color};border:1px solid ${t.color}40">
            ${s.type} · ${t.label}
          </span>
        </td>
        <td>${items}</td>
        <td class="text-right">${dailyCost}</td>
        <td class="text-right ${balCls} text-mono fw-600">${Sheets.formatBalance(bal)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <a href="record.html?adm=${s.admNo}&name=${encodeURIComponent(s.name)}&grade=${s.grade}"
               class="btn btn-success btn-sm"
               onclick="event.stopPropagation()">+ Pay</a>
            <button class="btn btn-secondary btn-sm"
              onclick="event.stopPropagation();openDetail(${s.admNo})">Detail</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// ── Open detail panel ─────────────────────────────────────────
async function openDetail(admNo) {
  // Highlight row
  document.querySelectorAll(".student-row").forEach(r => r.classList.remove("selected"));
  const row = document.querySelector(`[data-adm="${admNo}"]`);
  if (row) row.classList.add("selected");

  const panel = document.getElementById("detail-panel");
  const body  = document.getElementById("detail-body");
  panel.classList.add("open");

  const s = allStudents.find(st => String(st.admNo) === String(admNo));
  if (!s) return;

  const t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
  const bal    = s.balance || 0;
  const balCls = bal >= 0 ? "text-success" : "text-danger";

  body.innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div class="detail-avatar" style="margin:0 auto">${s.name.charAt(0)}</div>
      <div style="font-size:18px;font-weight:600;margin-top:8px">${s.name}</div>
      <div style="font-size:13px;color:var(--muted)">${s.displayGrade}</div>
      <span class="badge mt-8"
        style="background:${t.color}20;color:${t.color};border:1px solid ${t.color}40">
        ${s.type} · ${t.label}
      </span>
      <div class="balance-big ${balCls}">${Sheets.formatBalance(bal)}</div>
    </div>

    <div class="detail-field">
      <div class="detail-field-label">ADM No.</div>
      <div class="detail-field-value">${s.admNo}</div>
    </div>
    ${s.guardian ? `
    <div class="detail-field">
      <div class="detail-field-label">Guardian</div>
      <div class="detail-field-value">${s.guardian}</div>
    </div>` : ""}
    ${s.phone ? `
    <div class="detail-field">
      <div class="detail-field-label">Phone</div>
      <div class="detail-field-value">${s.phone}</div>
    </div>` : ""}
    <div class="detail-field">
      <div class="detail-field-label">Total Topped Up</div>
      <div class="detail-field-value text-success text-mono">
        ${Sheets.formatBalance(s.totalToppedUp || 0)}
      </div>
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Total Spent</div>
      <div class="detail-field-value text-warning text-mono">
        ${Sheets.formatBalance(s.totalSpent || 0)}
      </div>
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Last Payment</div>
      <div class="detail-field-value">${Sheets.formatDate(s.lastPayment)}</div>
    </div>
    <div class="detail-field">
      <div class="detail-field-label">Last Meal</div>
      <div class="detail-field-value">${Sheets.formatDate(s.lastMeal)}</div>
    </div>

    <a href="record.html?adm=${s.admNo}&name=${encodeURIComponent(s.name)}&grade=${s.grade}"
       class="btn btn-primary mt-16" style="width:100%;justify-content:center">
      + Record Payment
    </a>

    <div style="font-size:13px;font-weight:600;color:var(--light);margin:20px 0 10px">
      📅 This Week
    </div>
    <div id="week-calendar">
      <div class="loading"><div class="spinner"></div></div>
    </div>

    <div style="font-size:13px;font-weight:600;color:var(--muted);margin:20px 0 12px">
      Transaction History
    </div>
    <div id="tx-history">
      <div class="loading"><div class="spinner"></div> Loading...</div>
    </div>`;

  // Load transaction history + build weekly calendar
  try {
    const res = await Sheets.getTransactions(admNo);
    const txs = res.transactions || [];

    // ── Build weekly calendar ──────────────────────────────
    const calEl = document.getElementById("week-calendar");
    if (calEl) {
      const weekHtml = buildWeekCalendar(txs);
      calEl.innerHTML = weekHtml;
    }

    const el  = document.getElementById("tx-history");

    if (txs.length === 0) {
      el.innerHTML = `<div class="empty-state"><p>No transactions yet</p></div>`;
      return;
    }

    el.innerHTML = txs.slice(0, 20).map(tx => {
      const isMeal = tx.type === "MEAL";
      const sign   = isMeal ? "−" : "+";
      const cls    = isMeal ? "tx-type-meal" : "tx-type-payment";
      const label  = isMeal ? "Meal" : "Payment";
      const detail = isMeal
        ? [tx.food === "YES" ? "Food" : "", tx.tea === "YES" ? "Tea" : "",
           tx.porridge === "YES" ? "Porridge" : ""].filter(Boolean).join(", ")
        : (tx.ref || "");

      return `
        <div class="tx-item">
          <div class="tx-item-top">
            <span class="${cls} fw-600">${sign} ${label}</span>
            <span class="text-mono ${cls}">
              ${sign}KES ${Math.abs(tx.amount).toLocaleString()}
            </span>
          </div>
          <div style="font-size:12px;color:var(--muted)">
            ${detail || "—"} · ${tx.date}
          </div>
        </div>`;
    }).join("");

  } catch (err) {
    document.getElementById("tx-history").innerHTML =
      `<div style="color:var(--danger);font-size:13px">Failed to load history</div>`;
  }
}

// ── Close detail panel ────────────────────────────────────────
function closeDetail() {
  document.getElementById("detail-panel").classList.remove("open");
  document.querySelectorAll(".student-row").forEach(r => r.classList.remove("selected"));
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  const el    = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Build weekly calendar ─────────────────────────────────────
function buildWeekCalendar(txs) {
  // Get Mon–Fri of current week
  var today = new Date();
  var day   = today.getDay(); // 0=Sun
  var mon   = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(mon);
    d.setDate(mon.getDate() + i);
    var yyyy = d.getFullYear();
    var mm   = String(d.getMonth() + 1).padStart(2, "0");
    var dd   = String(d.getDate()).padStart(2, "0");
    days.push({
      date : yyyy + "-" + mm + "-" + dd,
      label: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
      isToday: yyyy + "-" + mm + "-" + dd === Sheets.today()
    });
  }

  // Build meal map — date → items eaten
  var mealMap = {};
  txs.forEach(function (tx) {
    if (tx.type !== "MEAL") return;
    if (!mealMap[tx.date]) mealMap[tx.date] = { food: false, tea: false, porridge: false };
    if (tx.food     === "YES") mealMap[tx.date].food     = true;
    if (tx.tea      === "YES") mealMap[tx.date].tea      = true;
    if (tx.porridge === "YES") mealMap[tx.date].porridge = true;
  });

  // Build calendar HTML
  var html =
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">';

  // Day labels row
  days.forEach(function (d) {
    html +=
      '<div style="text-align:center;font-size:10px;font-weight:600;' +
        'color:' + (d.isToday ? 'var(--accent)' : 'var(--muted)') + ';' +
        'padding-bottom:4px">' +
        d.label +
      '</div>';
  });

  // Meal icons row
  days.forEach(function (d) {
    var meals = mealMap[d.date];
    var icons = "";
    var hasAny = false;

    if (meals) {
      if (meals.food)     { icons += '<div style="font-size:14px">🍽️</div>'; hasAny = true; }
      if (meals.tea)      { icons += '<div style="font-size:14px">☕</div>';  hasAny = true; }
      if (meals.porridge) { icons += '<div style="font-size:14px">🌾</div>';  hasAny = true; }
    }

    var bg     = hasAny ? 'rgba(46,204,113,0.1)'  : 'rgba(255,255,255,0.03)';
    var border = hasAny ? 'rgba(46,204,113,0.3)'  : 'var(--border)';
    var dot    = d.isToday
      ? '<div style="width:6px;height:6px;border-radius:50%;background:var(--accent);margin:2px auto 0"></div>'
      : '';

    html +=
      '<div style="text-align:center;background:' + bg + ';border:1px solid ' + border + ';' +
        'border-radius:6px;padding:6px 2px;min-height:60px;display:flex;' +
        'flex-direction:column;align-items:center;justify-content:center">' +
        (hasAny ? icons : '<div style="color:var(--muted-2);font-size:18px">—</div>') +
        dot +
      '</div>';
  });

  html += '</div>';

  // Legend
  html +=
    '<div style="display:flex;gap:12px;font-size:11px;color:var(--muted);margin-top:4px">' +
      '<span>🍽️ Lunch</span>' +
      '<span>☕ Tea</span>' +
      '<span>🌾 Porridge</span>' +
      '<span style="color:var(--accent)">● Today</span>' +
    '</div>';

  return html;
}