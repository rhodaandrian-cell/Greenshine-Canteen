/* ============================================================
   GREENSHINE ACADEMY — Canteen Finance Management System
   reports.js — Reports Page Logic
   ============================================================ */

// ── State ─────────────────────────────────────────────────────
let currentReport = "daily";
let currentDate   = Sheets.today();

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticleNetwork("particle-canvas");
  setTodayDate();
  loadWatchlistBadge();
  loadReport("daily");
});

function setTodayDate() {
  const opts = { weekday:"long", day:"numeric", month:"long", year:"numeric" };
  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-KE", opts);
  document.getElementById("report-date").value = Sheets.today();
}

async function loadWatchlistBadge() {
  try {
    const res = await Sheets.getWatchlist();
    document.getElementById("watchlist-count").textContent =
      res.watchlistCount || 0;
  } catch (e) {}
}

// ── Switch report tab ─────────────────────────────────────────
function switchReport(type, btn) {
  currentReport = type;

  document.querySelectorAll(".tab-btn")
    .forEach(b => b.classList.remove("active"));

  btn.classList.add("active");

  const dateWrap = document.getElementById("date-wrap");
  dateWrap.style.display =
    (type === "allBalances" || type === "byType") ? "none" : "flex";

  loadReport(type);
}

// ── Load report from API ──────────────────────────────────────
async function loadReport(type) {
  const body  = document.getElementById("report-body");
  const date  = document.getElementById("report-date").value || Sheets.today();

  currentDate = date;

  body.innerHTML =
    `<div class="loading"><div class="spinner"></div> Loading report...</div>`;

  try {
    const res  = await Sheets.getReports(type, date);
    const data = res.data || {};

    switch (type) {
      case "daily":       renderDaily(data, date); break;
      case "weekly":      renderWeekly(data, date); break;
      case "monthly":     renderMonthly(data, date); break;
      case "allBalances": renderAllBalances(data); break;
      case "byType":      renderByType(data); break;
    }

  } catch (err) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <p>Failed to load report: ${err.message}</p>
      </div>`;
  }
}

// ── Daily Report ──────────────────────────────────────────────
function renderDaily(data, date) {
  const txs      = data.transactions || [];
  const meals    = txs.filter(t => t.type === "MEAL");
  const payments = txs.filter(t => t.type === "PAYMENT");

  document.getElementById("report-body").innerHTML = `
    <div class="report-stats">
      <div class="report-stat">
        <div class="rs-label">Meals Served</div>
        <div class="rs-value" style="color:var(--warning)">
          ${data.mealsServed || 0}
        </div>
      </div>

      <div class="report-stat">
        <div class="rs-label">Total Deducted</div>
        <div class="rs-value" style="color:var(--danger)">
          ${Sheets.formatBalance(data.totalDeducted || 0)}
        </div>
      </div>

      <div class="report-stat">
        <div class="rs-label">Payments Received</div>
        <div class="rs-value" style="color:var(--success)">
          ${Sheets.formatBalance(data.paymentsReceived || 0)}
        </div>
      </div>
    </div>

    ${meals.length === 0 && payments.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No transactions for ${Sheets.formatDate(date)}</p>
      </div>` : ``}
  `;
}

// ── Weekly Report ─────────────────────────────────────────────
function renderWeekly(data, date) {
  const txs = data.transactions || [];

  if (!txs.length) {
    document.getElementById("report-body").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <p>No transactions this week</p>
      </div>`;
    return;
  }

  const d   = new Date(date);
  const day = d.getDay();
  const mon = new Date(d);

  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));

  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const wd = new Date(mon);
    wd.setDate(mon.getDate() + i);

    weekDays.push({
      date: Sheets.today().slice(0, 4) + "-" +
            String(wd.getMonth()+1).padStart(2,"0") + "-" +
            String(wd.getDate()).padStart(2,"0"),

      label: wd.toLocaleDateString("en-KE",
        { weekday:"short", day:"numeric" })
    });
  }

  const byStudent = {};
  txs.filter(t => t.type === "MEAL").forEach(tx => {
    if (!byStudent[tx.admNo]) {
      byStudent[tx.admNo] = {
        name: tx.name,
        grade: tx.grade,
        days: {}
      };
    }
    byStudent[tx.admNo].days[tx.date] = tx.amount;
  });

  const rows = Object.values(byStudent);

  document.getElementById("report-body").innerHTML = `
    <div class="card">
      <div class="card-header">📅 Weekly Meals</div>
      <div class="card-body">

        <div class="week-day-header">
          <div>Student</div>
          ${weekDays.map(d =>
            `<div style="text-align:center">${d.label}</div>`
          ).join("")}
        </div>

        ${rows.map(s => `
          <div class="week-row">
            <div>
              <div style="font-weight:500">${s.name}</div>
            </div>

            ${weekDays.map(d => {
              const amt = s.days[d.date];
              return amt
                ? `<div class="week-cell-meal" style="text-align:center">KES ${amt}</div>`
                : `<div class="week-cell-empty" style="text-align:center">—</div>`;
            }).join("")}
          </div>
        `).join("")}

      </div>
    </div>
  `;
}

// ── Monthly Report ────────────────────────────────────────────
function renderMonthly(data, date) {
  document.getElementById("report-body").innerHTML = `
    <div class="report-stats">
      <div class="report-stat">
        <div class="rs-label">Total Deducted</div>
        <div class="rs-value">${Sheets.formatBalance(data.totalDeducted || 0)}</div>
      </div>

      <div class="report-stat">
        <div class="rs-label">Total Collected</div>
        <div class="rs-value">${Sheets.formatBalance(data.totalCollected || 0)}</div>
      </div>

      <div class="report-stat">
        <div class="rs-label">Net</div>
        <div class="rs-value">
          ${Sheets.formatBalance(
            (data.totalCollected || 0) - (data.totalDeducted || 0)
          )}
        </div>
      </div>
    </div>
  `;
}

// ── All Balances Report ───────────────────────────────────────
function renderAllBalances(data) {
  const balances = data.balances || [];

  document.getElementById("report-body").innerHTML = `
    <div class="report-stats">
      <div class="report-stat">
        <div class="rs-label">Total Students</div>
        <div class="rs-value">${balances.length}</div>
      </div>
    </div>
  `;
}

// ── By Type Report ────────────────────────────────────────────
function renderByType(data) {
  document.getElementById("report-body").innerHTML = `
    <div class="type-summary-grid"></div>
  `;
}

// ── Print ─────────────────────────────────────────────────────
function printReport() {
  window.print();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const icons = { success:"✅", error:"❌", warning:"⚠️" };

  const el = document.createElement("div");
  el.className = `toast ${type}`;

  el.innerHTML = `
    <span>${icons[type]}</span>
    <span>${msg}</span>
  `;

  document.getElementById("toast-container").appendChild(el);

  setTimeout(() => el.remove(), 4000);
}