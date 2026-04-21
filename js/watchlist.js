// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// watchlist.js — Watchlist & Alerts Page Logic
// ============================================================

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticleNetwork("particle-canvas");
  setTodayDate();
  loadWatchlist();
});

function setTodayDate() {
  const opts = { weekday:"long", day:"numeric", month:"long", year:"numeric" };
  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-KE", opts);
}

// ── Load Watchlist ────────────────────────────────────────────
async function loadWatchlist() {
  try {
    const res = await Sheets.getWatchlist();

    renderSummary(res);
    renderHighDebt(res.highDebt || []);
    renderMissedPayB(res.missedPayB || []);

    document.getElementById("watchlist-count").textContent =
      res.watchlistCount || 0;

  } catch (err) {
    showToast("Failed to load watchlist: " + err.message, "error");
  }
}

// ── Summary ───────────────────────────────────────────────────
function renderSummary(res) {
  document.getElementById("sum-high-debt").textContent =
    (res.highDebt || []).length;

  document.getElementById("sum-missed-b").textContent =
    (res.missedPayB || []).length;

  document.getElementById("sum-outstanding").textContent =
    Sheets.formatBalance(res.totalOutstanding || 0);

  document.getElementById("sum-total-count").textContent =
    res.watchlistCount || 0;
}

// ── High Debt Table ───────────────────────────────────────────
function renderHighDebt(students) {
  const tbody = document.getElementById("high-debt-table");
  const count = document.getElementById("high-debt-count");

  count.textContent = students.length;

  if (!students.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="all-clear">
            <div class="clear-icon">✅</div>
            <p>No students with high debt</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const t = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    const gradeLabel = GREENSHINE.GRADES[String(s.grade)] || ("Grade " + s.grade);
    const daily = s.dailyCost ? `KES ${s.dailyCost}/day` : "—";

    return `
      <tr>
        <td class="fw-600">${s.name}</td>
        <td>${gradeLabel}</td>
        <td>
          <span class="badge"
            style="background:${t.color}20;color:${t.color};border:1px solid ${t.color}40">
            ${s.type} · ${t.label}
          </span>
        </td>
        <td class="text-danger text-mono fw-600">
          ${Sheets.formatBalance(s.balance || 0)}
        </td>
        <td style="color:var(--muted);font-size:12px">${daily}</td>
        <td>
          <a class="btn btn-success btn-sm"
             href="record.html?adm=${s.admNo}&name=${encodeURIComponent(s.name)}&grade=${s.grade}">
            💰 Pay
          </a>
        </td>
      </tr>`;
  }).join("");

  const total = students.reduce((sum, s) => sum + Math.abs(s.balance || 0), 0);

  document.getElementById("high-debt-total").innerHTML = `
    <div class="outstanding-total">
      <span class="ot-label">Total outstanding</span>
      <span class="ot-value">− KES ${total.toLocaleString()}</span>
    </div>`;
}

// ── Missed Payments (Type B) ─────────────────────────────────
function renderMissedPayB(students) {
  const tbody = document.getElementById("missed-b-table");
  const count = document.getElementById("missed-b-count");

  count.textContent = students.length;

  if (!students.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="all-clear">
            <div class="clear-icon">✅</div>
            <p>No Type B students with missed payments</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const gradeLabel = GREENSHINE.GRADES[String(s.grade)] || ("Grade " + s.grade);
    const isCritical = s.daysSince >= 21;

    return `
      <tr>
        <td class="fw-600">${s.name}</td>
        <td>${gradeLabel}</td>
        <td>${Sheets.formatDate(s.lastPayment)}</td>
        <td>
          <span class="${isCritical ? "days-badge critical" : "days-badge"}">
            ${s.daysSince} days
          </span>
        </td>
        <td class="${s.balance >= 0 ? "text-success" : "text-danger"} text-mono">
          ${Sheets.formatBalance(s.balance || 0)}
        </td>
        <td>
          <a class="btn btn-primary btn-sm"
             href="record.html?adm=${s.admNo}&name=${encodeURIComponent(s.name)}&grade=${s.grade}">
            💰 Record Payment
          </a>
        </td>
      </tr>`;
  }).join("");
}

// ── Redirect to Debt Report ──────────────────────────────────
function downloadDebtReport() {
  window.location.href = "debt-report.html";
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const icons = { success: "✅", error: "❌", warning: "⚠️" };

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;

  document.getElementById("toast-container").appendChild(el);

  setTimeout(() => el.remove(), 4000);
}