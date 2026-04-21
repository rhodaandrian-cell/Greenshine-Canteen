// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// config.js — Global Configuration
// ============================================================

const GREENSHINE = {

  API_URL: "https://script.google.com/macros/s/AKfycbxOdToclWkzfijpWntn7XR_qBXfM3lt3Z0NdC9V_N0dg0NBMI5DrF_wdOv-8Um9Zt2KtA/exec",

  SCHOOL_NAME   : "Greenshine Academy",
  SYSTEM_NAME   : "Canteen Finance System",
  ADMIN_NAME    : "Tr Jedida",

  PRICES: {
    FOOD    : 50,
    TEA     : 15,
    PORRIDGE: 10
  },

  TYPES: {
    "0": { label: "Unranked",    color: "#888888" },
    "A": { label: "Prepaid",     color: "#2ecc71" },
    "B": { label: "Weekly Tab",  color: "#3498db" },
    "C": { label: "Occasional",  color: "#f39c12" },
    "D": { label: "Non-paying",  color: "#e74c3c" }
  },

  GRADES: {
    "PP1"  : "PP1",
    "PP2"  : "PP2",
    "PG"   : "PG",
    "0"    : "ECD",
    "1"    : "Grade 1",
    "2"    : "Grade 2",
    "3"    : "Grade 3",
    "4"    : "Grade 4",
    "5"    : "Grade 5",
    "6"    : "Grade 6"
  },

  CLASSES: [
    { value: "PP1",     label: "PP1" },
    { value: "PP2",     label: "PP2" },
    { value: "PG",      label: "PG" },
    { value: "Grade 1", label: "Grade 1" },
    { value: "Grade 2", label: "Grade 2" },
    { value: "Grade 3", label: "Grade 3" },
    { value: "Grade 4", label: "Grade 4" },
    { value: "Grade 5", label: "Grade 5" },
    { value: "Grade 6", label: "Grade 6" }
  ],

  DEBT_ALERT_THRESHOLD : -500,
  MISSED_PAYMENT_DAYS  : 14,

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
  }

};