// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// config.js — Global Configuration
// ============================================================

const GREENSHINE = {

  // ── Google Apps Script Web App URL ──────────────────────
  API_URL: "https://script.google.com/macros/s/AKfycbxOdToclWkzfijpWntn7XR_qBXfM3lt3Z0NdC9V_N0dg0NBMI5DrF_wdOv-8Um9Zt2KtA/exec",

  // ── School Info ─────────────────────────────────────────
  SCHOOL_NAME   : "Greenshine Academy",
  SYSTEM_NAME   : "Canteen Finance System",
  SCHOOL_WEBSITE: "https://greenshineacademy.ac.ke",

  // ── Menu Prices (KES) ───────────────────────────────────
  PRICES: {
    FOOD    : 50,
    TEA     : 15,
    PORRIDGE: 10
  },

  // ── Student Types ───────────────────────────────────────
  TYPES: {
    "0": { label: "Unranked",    color: "#888888" },
    "A": { label: "Prepaid",     color: "#2ecc71" },
    "B": { label: "Weekly Tab",  color: "#3498db" },
    "C": { label: "Occasional",  color: "#f39c12" },
    "D": { label: "Non-paying",  color: "#e74c3c" }
  },

  // ── Grade Labels ────────────────────────────────────────
  GRADES: {
    "0"  : "ECD",
    "1"  : "Grade 1",
    "2"  : "Grade 2",
    "3"  : "Grade 3",
    "4"  : "Grade 4",
    "5"  : "Grade 5",
    "6"  : "Grade 6",
    "PP1": "PP1",
    "PP2": "PP2",
    "PG" : "PG"
  },

  // ── Watchlist Thresholds ─────────────────────────────────
  DEBT_ALERT_THRESHOLD   : -500,
  MISSED_PAYMENT_DAYS    : 14,

  // ── Brand Colors ─────────────────────────────────────────
  COLORS: {
    PRIMARY  : "#1a5c2e",
    SECONDARY: "#8B3A2A",
    ACCENT   : "#C0392B",
    DARK     : "#0d0d0d",
    LIGHT    : "#f5f5f0",
    SUCCESS  : "#2ecc71",
    WARNING  : "#f39c12",
    DANGER   : "#e74c3c",
    MUTED    : "#888888"
  },

  // ── Navigation Pages ────────────────────────────────────
  NAV: [
    { label: "Dashboard",          icon: "📊", href: "dashboard.html" },
    { label: "Students",           icon: "👤", href: "students.html"  },
    { label: "Record Transaction", icon: "✏️", href: "record.html"    },
    { label: "Watchlist",          icon: "⚠️", href: "watchlist.html" },
    { label: "Reports",            icon: "📋", href: "reports.html"   }
  ]

};