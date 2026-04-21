// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// students.js — Students Page Logic
// ============================================================

// ── State ─────────────────────────────────────────────────────
let allStudents = [];
let filteredStudents = [];

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticleNetwork("particle-canvas");
  loadStudents();
});

// ── Load students + balances ──────────────────────────────────
async function loadStudents() {
  try {
    allStudents = await Sheets.getStudentsWithBalances();
    filteredStudents = [...allStudents];

    document.getElementById("student-count-label").textContent =
      allStudents.length + " active students";

    renderTable(filteredStudents);

    const wRes = await Sheets.getWatchlist();
    document.getElementById("watchlist-count").textContent =
      wRes.watchlistCount || 0;

  } catch (err) {
    showToast("Failed to load students: " + err.message, "error");
  }
}

// ── Filter students ───────────────────────────────────────────
function filterStudents() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const grade = document.getElementById("filter-grade").value;
  const type = document.getElementById("filter-type").value;
  const balance = document.getElementById("filter-balance").value;

  filteredStudents = allStudents.filter(s => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search) ||
      String(s.admNo).includes(search);

    const matchGrade = !grade || s.displayGrade === grade;
    const matchType = !type || s.type === type;

    const bal = s.balance || 0;
    const matchBalance =
      !balance ||
      (balance === "positive" && bal > 0) ||
      (balance === "negative" && bal < 0) ||
      (balance === "zero" && bal === 0);

    return matchSearch && matchGrade && matchType && matchBalance;
  });

  renderTable(filteredStudents);
}

// ── Render students table ─────────────────────────────────────
function renderTable(students) {
  const tbody = document.getElementById("students-table");

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-icon">👤</div>
            <p>No students found</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const t = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    const bal = s.balance || 0;
    const balCls =
      bal > 0 ? "text-success" :
      bal < 0 ? "text-danger" :
      "text-muted";

    const items =
      [
        s.food ? '<span class="badge badge-food">Food</span>' : "",
        s.tea ? '<span class="badge badge-tea">Tea</span>' : "",
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
        <td class="text-right ${balCls} text-mono fw-600">
          ${Sheets.formatBalance(bal)}
        </td>
        <td>
          <div style="display:flex;gap:6px">
            <a href="record.html?adm=${s.admNo}&name=${encodeURIComponent(s.name)}&grade=${s.grade}"
               class="btn btn-success btn-sm"
               onclick="event.stopPropagation()">+ Pay</a>

            <button class="btn btn-secondary btn-sm"
              onclick="event.stopPropagation();openDetail(${s.admNo})">
              Detail
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// ── Open detail panel ─────────────────────────────────────────
async function openDetail(admNo) {
  document.querySelectorAll(".student-row")
    .forEach(r => r.classList.remove("selected"));

  const row = document.querySelector(`[data-adm="${admNo}"]`);
  if (row) row.classList.add("selected");

  const panel = document.getElementById("detail-panel");
  const body = document.getElementById("detail-body");
  panel.classList.add("open");

  const s = allStudents.find(st => String(st.admNo) === String(admNo));
  if (!s) return;

  const t = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
  const bal = s.balance || 0;
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

      <div class="balance-big ${balCls}">
        ${Sheets.formatBalance(bal)}
      </div>
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
       class="btn btn-primary mt-16"
       style="width:100%;justify-content:center">
      + Record Payment
    </a>

    <div style="font-size:13px;font-weight:600;color:var(--muted);margin:20px 0 12px">
      Transaction History
    </div>

    <div id="tx-history">
      <div class="loading"><div class="spinner"></div> Loading...</div>
    </div>`;

  try {
    const res = await Sheets.getTransactions(admNo);
    const txs = res.transactions || [];
    const el = document.getElementById("tx-history");

    if (txs.length === 0) {
      el.innerHTML = `<div class="empty-state"><p>No transactions yet</p></div>`;
      return;
    }

    el.innerHTML = txs.slice(0, 20).map(tx => {
      const isMeal = tx.type === "MEAL";
      const sign = isMeal ? "−" : "+";
      const cls = isMeal ? "tx-type-meal" : "tx-type-payment";
      const label = isMeal ? "Meal" : "Payment";

      const detail = isMeal
        ? [
            tx.food === "YES" ? "Food" : "",
            tx.tea === "YES" ? "Tea" : "",
            tx.porridge === "YES" ? "Porridge" : ""
          ].filter(Boolean).join(", ")
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
  document.querySelectorAll(".student-row")
    .forEach(r => r.classList.remove("selected"));
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