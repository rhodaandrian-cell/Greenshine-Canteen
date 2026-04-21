// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// sidebar.js — Mobile Sidebar Toggle (shared across all pages)
// Must be loaded at bottom of <body> AFTER sidebar HTML exists
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  const sidebar = document.querySelector(".sidebar");
  const topbar  = document.querySelector(".topbar");
  if (!sidebar || !topbar) return;

  // ── Inject hamburger into topbar ──────────────────────────
  const hamburger = document.createElement("button");
  hamburger.className = "hamburger";
  hamburger.id = "hamburger";
  hamburger.setAttribute("aria-label", "Toggle menu");
  hamburger.innerHTML = `<span></span><span></span><span></span>`;
  hamburger.addEventListener("click", toggleSidebar);
  topbar.insertBefore(hamburger, topbar.firstChild);

  // ── Inject overlay ────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  overlay.id = "sidebar-overlay";
  overlay.addEventListener("click", closeSidebar);
  document.body.appendChild(overlay);

  // ── Close sidebar on nav link click (mobile) ──────────────
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  // ── Close on resize to desktop ────────────────────────────
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSidebar();
  });

});

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const hamburger = document.getElementById("hamburger");

  if (!sidebar) return;

  const isOpen = sidebar.classList.contains("open");

  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add("open");
    if (overlay) overlay.classList.add("open");
    if (hamburger) hamburger.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const hamburger = document.getElementById("hamburger");

  if (!sidebar) return;

  sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  if (hamburger) hamburger.classList.remove("open");
  document.body.style.overflow = "";
}