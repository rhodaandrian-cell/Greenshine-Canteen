// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// sidebar.js — Sidebar toggle (tablet) + active nav state
// Bottom nav is in HTML directly — no JS needed to build it
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  buildHamburger();
  buildOverlay();
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1024) closeSidebar();
  });

});

// ── Hamburger button for tablet ───────────────────────────────
function buildHamburger() {
  var topbar = document.querySelector(".topbar");
  if (!topbar) return;

  var btn = document.createElement("button");
  btn.className = "hamburger";
  btn.id        = "hamburger";
  btn.setAttribute("aria-label", "Toggle menu");
  btn.innerHTML = "<span></span><span></span><span></span>";
  btn.addEventListener("click", toggleSidebar);
  topbar.insertBefore(btn, topbar.firstChild);
}

// ── Dark overlay behind sidebar ───────────────────────────────
function buildOverlay() {
  var overlay       = document.createElement("div");
  overlay.className = "sidebar-overlay";
  overlay.id        = "sidebar-overlay";
  overlay.addEventListener("click", closeSidebar);
  document.body.appendChild(overlay);
}

// ── Toggle ────────────────────────────────────────────────────
function toggleSidebar() {
  var sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
}

function openSidebar() {
  var sidebar   = document.querySelector(".sidebar");
  var overlay   = document.getElementById("sidebar-overlay");
  var hamburger = document.getElementById("hamburger");
  if (sidebar)   sidebar.classList.add("open");
  if (overlay)   overlay.classList.add("open");
  if (hamburger) hamburger.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  var sidebar   = document.querySelector(".sidebar");
  var overlay   = document.getElementById("sidebar-overlay");
  var hamburger = document.getElementById("hamburger");
  if (sidebar)   sidebar.classList.remove("open");
  if (overlay)   overlay.classList.remove("open");
  if (hamburger) hamburger.classList.remove("open");
  document.body.style.overflow = "";
}