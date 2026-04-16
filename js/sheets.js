// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// sheets.js — All API calls to Google Apps Script
// ============================================================

const Sheets = {

  // ── Core POST function ───────────────────────────────────
  // All requests go through here as POST with JSON body
  async post(action, params = {}) {
    try {
      const body = JSON.stringify({ action, ...params });
      const response = await fetch(GREENSHINE.API_URL, {
        method     : "POST",
        body       : body,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error(`Sheets.${action} error:`, err);
      throw err;
    }
  },

  // ── 1. Get all active students ───────────────────────────
  async getStudents() {
    return await this.post("getStudents");
  },

  // ── 2. Get all balances ──────────────────────────────────
  async getBalances() {
    return await this.post("getBalances");
  },

  // ── 3. Get transactions (all or by student) ──────────────
  async getTransactions(admNo = null) {
    return await this.post("getTransactions", admNo ? { admNo } : {});
  },

  // ── 4. Get dashboard stats ───────────────────────────────
  async getDashboard() {
    return await this.post("getDashboard");
  },

  // ── 5. Record a payment ──────────────────────────────────
  // params: { admNo, name, grade, amount, ref, recordedBy, date }
  async recordPayment(params) {
    return await this.post("recordPayment", params);
  },

  // ── 6. Record a meal deduction ───────────────────────────
  // params: { admNo, name, grade, food, tea, porridge, date, recordedBy }
  async recordMeal(params) {
    return await this.post("recordMeal", params);
  },

  // ── 7. Record bulk meals for a whole class ───────────────
  // params: { meals: [ {admNo, name, grade, food, tea, porridge, date}, ... ] }
  async recordBulkMeals(meals) {
    return await this.post("recordBulkMeals", { meals });
  },

  // ── 8. Get watchlist ─────────────────────────────────────
  async getWatchlist() {
    return await this.post("getWatchlist");
  },

  // ── 9. Get reports ───────────────────────────────────────
  // reportType: "daily" | "weekly" | "monthly" | "allBalances" | "byType"
  async getReports(reportType = "daily", date = null) {
    const params = { reportType };
    if (date) params.date = date;
    return await this.post("getReports", params);
  },

  // ── HELPERS ──────────────────────────────────────────────

  // Get students merged with their balances
  async getStudentsWithBalances() {
    const [studentsRes, balancesRes] = await Promise.all([
      this.getStudents(),
      this.getBalances()
    ]);
    const balances = balancesRes.balances || {};
    return studentsRes.students.map(student => ({
      ...student,
      ...(balances[student.admNo] || {
        type         : "0",
        balance      : 0,
        totalToppedUp: 0,
        totalSpent   : 0,
        lastPayment  : "",
        lastMeal     : ""
      })
    }));
  },

  // Get students filtered by grade
  async getStudentsByGrade(grade) {
    const students = await this.getStudentsWithBalances();
    return students.filter(s => String(s.grade) === String(grade));
  },

  // Format balance for display
  formatBalance(amount) {
    const abs    = Math.abs(amount);
    const prefix = amount < 0 ? "-" : "";
    return `${prefix}KES ${abs.toLocaleString()}`;
  },

  // Format date for display
  formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-KE", {
      day  : "numeric",
      month: "short",
      year : "numeric"
    });
  },

  // Today's date as YYYY-MM-DD
  today() {
    const d    = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  },

  // Get type badge HTML
  typeBadge(type) {
    const t = GREENSHINE.TYPES[type] || GREENSHINE.TYPES["0"];
    return `<span class="badge badge-type" style="background:${t.color}20;color:${t.color};border:1px solid ${t.color}40">${type} · ${t.label}</span>`;
  },

  // Get balance color class
  balanceClass(amount) {
    if (amount > 0)  return "positive";
    if (amount < 0)  return "negative";
    return "zero";
  }

};