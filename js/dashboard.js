 // ============================================================
 // GREENSHINE ACADEMY — Canteen Finance Management System
 // dashboard.js — Dashboard Page Logic
 // ============================================================

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticleNetwork("particle-canvas");
  setTodayDate();
  loadDashboard();
});

// ── Set today's date in topbar ────────────────────────────────
function setTodayDate() {
  const opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-KE", opts);
}

// ── Load all dashboard data ───────────────────────────────────
async function loadDashboard() {
  try {
    const [dashRes, watchRes] = await Promise.all([
      Sheets.getDashboard(),
      Sheets.getWatchlist()
    ]);

    renderStats(dashRes);
    renderMealsTable(dashRes.todayMeals || []);
    renderClassBreakdown(dashRes.balanceByClass || {});
    renderWatchlistBadge(watchRes.watchlistCount || 0);

  } catch (err) {
    showToast("Failed to load dashboard: " + err.message, "error");
  }
}

// ── Render stat cards ─────────────────────────────────────────
function renderStats(data) {
  document.getElementById("stat-students").textContent =
    data.activeStudents || 0;

  const bal = data.netBalance || 0;
  const balEl = document.getElementById("stat-balance");

  balEl.textContent = Sheets.formatBalance(bal);
  balEl.className = "stat-value " + Sheets.balanceClass(bal);

  document.getElementById("stat-balance-sub").textContent =
    bal >= 0 ? "Net credit" : "Net debt";

  document.getElementById("stat-collected").textContent =
    Sheets.formatBalance(data.todayCollected || 0);

  document.getElementById("stat-deducted").textContent =
    Sheets.formatBalance(data.todayDeducted || 0);

  document.getElementById("stat-debt-count").textContent =
    data.inDebtCount || 0;

  document.getElementById("stat-debt-total").textContent =
    Sheets.formatBalance(data.inDebtTotal || 0) + " owed";
}

// ── Render watchlist badge ────────────────────────────────────
function renderWatchlistBadge(count) {
  document.getElementById("stat-watchlist").textContent = count;
  document.getElementById("watchlist-count").textContent = count;

  if (count > 0) {
    const alertBtn = document.getElementById("alert-btn");
    if (alertBtn) alertBtn.style.display = "flex";

    document.getElementById("alert-count").textContent = count;

    document.getElementById("stat-watchlist-sub").textContent =
      count + " student" + (count !== 1 ? "s" : "") + " flagged";
  } else {
    document.getElementById("stat-watchlist-sub").textContent =
      "All clear ✅";
  }
}

// ── Render today's meals table ────────────────────────────────
function renderMealsTable(meals) {
  const tbody = document.getElementById("meals-table");
  const countEl = document.getElementById("meals-count");

  countEl.textContent =
    meals.length + " meal" + (meals.length !== 1 ? "s" : "");

  if (meals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="no-meals">
            <div class="no-meals-icon">🍽️</div>
            <p>No meals recorded today</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = meals.map(m => {
    const items = [
      m.food ? '<span class="badge badge-food">Food</span>' : "",
      m.tea ? '<span class="badge badge-tea">Tea</span>' : "",
      m.porridge ? '<span class="badge badge-porridge">Porridge</span>' : ""
    ].filter(Boolean).join(" ") || "—";

    return `
      <tr>
        <td class="fw-600">${m.name}</td>
        <td>${items}</td>
        <td class="text-right text-mono text-warning">
          − ${Sheets.formatBalance(m.amount)}
        </td>
      </tr>`;
  }).join("");
}

// ── Render balance by class ───────────────────────────────────
function renderClassBreakdown(byClass) {
  const container = document.getElementById("class-breakdown");

  const gradeOrder = ["PP1", "PP2", "PG", "0", "1", "2", "3", "4", "5", "6"];

  const keys = Object.keys(byClass).sort(
    (a, b) => gradeOrder.indexOf(String(a)) - gradeOrder.indexOf(String(b))
  );

  if (keys.length === 0) {
    container.innerHTML = `
      <div class="no-meals">
        <div class="no-meals-icon">📚</div>
        <p>No balance data yet</p>
      </div>`;
    return;
  }

  container.innerHTML = keys.map(grade => {
    const data = byClass[grade];
    const bal = data.balance || 0;

    const gradeLabel =
      GREENSHINE.GRADES[String(grade)] || ("Grade " + grade);

    const balCls = bal >= 0 ? "text-success" : "text-danger";

    return `
      <div class="class-item">
        <div class="class-item-left">
          <div class="class-name">${gradeLabel}</div>
          <div class="class-students">
            ${data.students} student${data.students !== 1 ? "s" : ""}
          </div>
        </div>

        <div class="class-item-balance ${balCls}">
          ${Sheets.formatBalance(bal)}
        </div>
      </div>`;
  }).join("");
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️"
  };

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;

  document.getElementById("toast-container").appendChild(el);

  setTimeout(() => el.remove(), 4000);
}