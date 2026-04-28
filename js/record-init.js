// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// record-init.js — Shared State, Data Loading & Utilities
// ============================================================

// ── Shared state ──────────────────────────────────────────────
var allStudents  = [];
var allTxHistory = {};
var ADMIN_NAME   = "Tr Jedida";

// ── Boot ─────────────────────────────────────────────────────
window.addEventListener("load", function () {
  initParticleNetwork("particle-canvas");
  setDates();
  loadData();
});

// ── Set today on all date fields ──────────────────────────────
function setDates() {
  var today = Sheets.today();
  ["pay-date", "meal-date", "bulk-date"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = today;
  });
  var opts   = { weekday:"long", day:"numeric", month:"long", year:"numeric" };
  var dateEl = document.getElementById("today-date");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-KE", opts);
}

// ── Load students + meal history from API ─────────────────────
async function loadData() {
  try {
    allStudents = await Sheets.getStudentsWithBalances();

    // Build meal frequency map — used by bulk for priority sort
    var txRes = await Sheets.getTransactions();
    (txRes.transactions || []).forEach(function (tx) {
      if (tx.type === "MEAL") {
        allTxHistory[tx.admNo] = (allTxHistory[tx.admNo] || 0) + 1;
      }
    });

    // Watchlist badge
    var wRes = await Sheets.getWatchlist();
    var wEl  = document.getElementById("watchlist-count");
    if (wEl) wEl.textContent = wRes.watchlistCount || 0;

    // Populate bulk class dropdown
    populateBulkDropdown();

    // Pre-fill from URL if coming from Students page
    prefillFromURL();

  } catch (err) {
    showToast("Failed to load students: " + err.message, "error");
  }
}

// ── Populate bulk class dropdown from config ──────────────────
function populateBulkDropdown() {
  var sel = document.getElementById("bulk-grade");
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  GREENSHINE.CLASSES.forEach(function (c) {
    var opt         = document.createElement("option");
    opt.value       = c.value;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
}

// ── Pre-fill student from URL (from Students page Pay button) ─
function prefillFromURL() {
  var params = new URLSearchParams(window.location.search);
  var adm    = params.get("adm");
  var name   = params.get("name");
  if (!adm || !name) return;

  var el = document.getElementById("pay-search");
  if (el) el.value = decodeURIComponent(name);

  var s = allStudents.find(function (st) {
    return String(st.admNo) === String(adm);
  });
  if (s) selectPayStudent(s);
}

// ── Tab switching ─────────────────────────────────────────────
function switchTab(tab) {
  ["payment", "meal", "bulk"].forEach(function (t) {
    var content = document.getElementById("tab-" + t);
    var btn     = document.getElementById("tbtn-" + t);
    if (content) content.classList.toggle("active", t === tab);
    if (btn)     btn.classList.toggle("active", t === tab);
  });
}

// ── Autocomplete — works for both pay and meal modes ──────────
// Called with mode = "pay" or "meal"
function searchStudents(mode, query) {
  var dropdown = document.getElementById(mode + "-dropdown");
  if (!dropdown) return;

  query = (query || "").trim();

  if (query.length === 0) {
    dropdown.classList.remove("open");
    return;
  }

  var lower   = query.toLowerCase();
  var matches = allStudents.filter(function (s) {
    return s.name.toLowerCase().includes(lower) ||
           String(s.admNo).includes(lower);
  }).slice(0, 10);

  if (matches.length === 0) {
    dropdown.innerHTML =
      '<div class="autocomplete-item" ' +
        'style="color:var(--muted);pointer-events:none;font-style:italic">' +
        'No student found for "' + query + '"' +
      '</div>';
    dropdown.classList.add("open");
    return;
  }

  // Escape special regex chars then bold matching letters
  var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var re       = new RegExp("(" + escaped + ")", "gi");

  dropdown.innerHTML = matches.map(function (s) {
    var bal    = s.balance || 0;
    var t      = GREENSHINE.TYPES[s.type] || GREENSHINE.TYPES["0"];
    var balCls = bal >= 0 ? "text-success" : "text-danger";
    var name   = s.name.replace(re,
      "<strong style='color:var(--light)'>$1</strong>"
    );
    return (
      '<div class="autocomplete-item" ' +
        'onclick="selectStudent(\'' + mode + '\',' + s.admNo + ')">' +
        '<div class="item-name">' +
          name +
          '<span style="font-size:11px;color:var(--muted-2);margin-left:6px">' +
            '#' + s.admNo +
          '</span>' +
        '</div>' +
        '<div class="item-meta">' +
          s.displayGrade +
          ' · <span style="color:' + t.color + '">' + s.type + ' · ' + t.label + '</span>' +
          ' · <span class="' + balCls + '">' + Sheets.formatBalance(bal) + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  dropdown.classList.add("open");
}

// ── Route dropdown click to correct handler ───────────────────
function selectStudent(mode, admNo) {
  var s = allStudents.find(function (st) {
    return String(st.admNo) === String(admNo);
  });
  if (!s) return;

  var dropdown = document.getElementById(mode + "-dropdown");
  var searchEl = document.getElementById(mode + "-search");
  if (dropdown) dropdown.classList.remove("open");
  if (searchEl) searchEl.value = s.name;

  // Route to the right tab handler
  if (mode === "pay")  selectPayStudent(s);
  if (mode === "meal") selectMealStudent(s);
}

// ── Shared toast notification ─────────────────────────────────
function showToast(msg, type) {
  type      = type || "success";
  var icons = { success:"✅", error:"❌", warning:"⚠️" };
  var el    = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML =
    "<span>" + (icons[type] || "ℹ️") + "</span>" +
    "<span>" + msg + "</span>";
  document.getElementById("toast-container").appendChild(el);
  setTimeout(function () { el.remove(); }, 4000);
}

// ── Shared balance warning HTML ───────────────────────────────
function balanceWarningHtml(bal, cost) {
  if (bal > 0 && bal < cost) {
    return (
      '<div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);' +
      'border-radius:6px;padding:10px 12px;margin-top:10px;font-size:13px;color:var(--warning)">' +
      '⚠️ Balance (' + Sheets.formatBalance(bal) + ') is less than meal cost (KES ' + cost + '). ' +
      'Student will go into debt.</div>'
    );
  }
  if (bal <= 0) {
    return (
      '<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);' +
      'border-radius:6px;padding:10px 12px;margin-top:10px;font-size:13px;color:var(--danger)">' +
      '❌ Student already in debt (' + Sheets.formatBalance(bal) + '). ' +
      'Meal still recorded per school policy.</div>'
    );
  }
  return "";
}

// ── Check for duplicate meals today ──────────────────────────
// Returns warning HTML if student already ate any of the same
// items today, otherwise returns empty string
async function buildDuplicateWarning(admNo, name, date, food, tea, porridge) {
  try {
    var res      = await Sheets.checkTodayMeals(admNo, date);
    var today    = res.todayItems || {};
    var dupes    = [];

    if (food     && today.food)     dupes.push("Lunch");
    if (tea      && today.tea)      dupes.push("Tea");
    if (porridge && today.porridge) dupes.push("Porridge");

    if (dupes.length === 0) return "";

    var already = [];
    if (today.food)     already.push("Lunch");
    if (today.tea)      already.push("Tea");
    if (today.porridge) already.push("Porridge");

    return (
      '<div style="background:rgba(52,152,219,0.1);border:1px solid rgba(52,152,219,0.4);' +
      'border-radius:6px;padding:12px;margin-top:10px;font-size:13px;color:#3498db">' +
        '<div style="font-weight:600;margin-bottom:6px">' +
          '⚠️ Already recorded today (' + date + ')' +
        '</div>' +
        '<div style="margin-bottom:6px">' +
          name + ' was already recorded for: <strong>' + already.join(", ") + '</strong>' +
        '</div>' +
        '<div>' +
          'Duplicate items: <strong>' + dupes.join(", ") + '</strong>' +
        '</div>' +
        '<div style="margin-top:8px;color:rgba(52,152,219,0.8)">' +
          'Confirm below only if ' + name.split(" ")[0] + ' genuinely had these again today.' +
        '</div>' +
      '</div>'
    );
  } catch (err) {
    // If check fails just proceed without warning
    return "";
  }
}