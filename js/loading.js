// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// loading.js — All Loading States & Animations
// Used by: bulk record, weekly PDF, student calendar
// ============================================================

var Loading = {

  // ── 3 2 1 countdown with a story ─────────────────────────
  countdown: function (container, message) {
    return new Promise(function (resolve) {

      // Pick a random story — cat & mouse OR superpowers dream
      var stories = [
        // Cat and mouse
        [
          { icon: "🐭", text: "A mouse spotted some cheese...",        color: "var(--accent)"  },
          { icon: "🐱", text: "But the cat was watching...",           color: "var(--warning)" },
          { icon: "💨", text: "The chase is ON! 🐭💨🐱",              color: "var(--success)" },
          { icon: "🚀", text: null, color: "var(--success)" }
        ],
        // Superpowers dream
        [
          { icon: "😴", text: "I closed my eyes last night...",        color: "var(--accent)"  },
          { icon: "⚡", text: "Suddenly... I had SUPERPOWERS!",        color: "var(--warning)" },
          { icon: "🦸", text: "I could fly! Loading at light speed!", color: "var(--success)" },
          { icon: "🚀", text: null, color: "var(--success)" }
        ],
        // Bonus: canteen story
        [
          { icon: "🍽️", text: "Chef arrived early this morning...",    color: "var(--accent)"  },
          { icon: "☕", text: "Porridge on the stove, tea brewing...", color: "var(--warning)" },
          { icon: "🏃", text: "Students racing to the canteen!",      color: "var(--success)" },
          { icon: "🚀", text: null, color: "var(--success)" }
        ]
      ];

      var story = stories[Math.floor(Math.random() * stories.length)];
      var step  = 0;

      function renderStep() {
        var s = story[step];
        container.innerHTML =
          '<div style="text-align:center;padding:32px 20px">' +
            '<div id="cd-icon" style="font-size:64px;line-height:1;margin-bottom:14px;' +
              'animation:popIn 0.3s ease">' + s.icon + '</div>' +
            (s.text
              ? '<div style="font-size:13px;color:' + s.color + ';font-weight:500;' +
                  'margin-bottom:10px;min-height:20px">' + s.text + '</div>'
              : '') +
            '<div style="font-size:12px;color:var(--muted-2);margin-top:8px">' +
              (message || "Loading...") +
            '</div>' +
          '</div>' +
          '<style>' +
            '@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}' +
          '</style>';
      }

      renderStep();

      var timer = setInterval(function () {
        step++;
        if (step >= story.length - 1) {
          clearInterval(timer);
          renderStep();
          setTimeout(resolve, 400);
        } else {
          renderStep();
        }
      }, 800);
    });
  },

  // ── Simple spinner + message ──────────────────────────────
  spinner: function (container, message) {
    if (!container) return;
    container.innerHTML =
      '<div style="text-align:center;padding:40px 20px">' +
        '<div class="spinner" style="width:32px;height:32px;border-width:3px;' +
          'margin:0 auto 16px"></div>' +
        '<div style="font-size:14px;color:var(--muted)">' + (message || "Loading...") + '</div>' +
      '</div>';
  },

  // ── Recording with countdown ──────────────────────────────
  // Shows name + items + live counter while API saves
  recording: function (container, name, items) {
    if (!container) return null;

    container.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div class="spinner" style="width:32px;height:32px;border-width:3px;' +
          'margin:0 auto 16px"></div>' +
        '<div style="font-size:14px;font-weight:600;color:var(--light);margin-bottom:8px">' +
          'Recording ' + name + '...' +
        '</div>' +
        '<div style="font-size:13px;color:var(--muted);margin-bottom:16px">' +
          items +
        '</div>' +
        '<div id="rec-countdown" style="font-size:28px;font-weight:700;' +
          'color:var(--accent)">1</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:6px">' +
          'Please wait...' +
        '</div>' +
      '</div>';

    // Start counter — returns interval ID so caller can clearInterval
    var count = 1;
    var timer = setInterval(function () {
      count++;
      var el = document.getElementById("rec-countdown");
      if (el) el.textContent = count;
    }, 1000);

    return timer;
  },

  // ── Success state ─────────────────────────────────────────
  success: function (container, title, subtitle) {
    if (!container) return;
    container.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div style="font-size:48px;margin-bottom:12px">✅</div>' +
        '<div style="font-size:15px;font-weight:600;color:var(--success)">' +
          (title || "Done!") +
        '</div>' +
        (subtitle
          ? '<div style="font-size:13px;color:var(--muted);margin-top:6px">' + subtitle + '</div>'
          : '') +
      '</div>';
  },

  // ── Error state ───────────────────────────────────────────
  error: function (container, title, detail) {
    if (!container) return;
    container.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div style="font-size:48px;margin-bottom:12px">❌</div>' +
        '<div style="font-size:14px;color:var(--danger)">' +
          (title || "Something went wrong.") +
        '</div>' +
        (detail
          ? '<div style="font-size:12px;color:var(--muted);margin-top:8px">' + detail + '</div>'
          : '') +
        '<div style="font-size:13px;color:var(--muted);margin-top:12px">' +
          'Try again or skip.' +
        '</div>' +
      '</div>';
  },

  // ── Full page overlay (for weekly PDF generation) ─────────
  pageOverlay: function (message) {
    var existing = document.getElementById("loading-overlay");
    if (existing) {
      existing.style.display = "flex";
      var span = existing.querySelector("span");
      if (span) span.textContent = message || "Loading...";
      return;
    }
    var overlay = document.createElement("div");
    overlay.id  = "loading-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:var(--dark);z-index:999;" +
      "display:flex;align-items:center;justify-content:center;" +
      "flex-direction:column;gap:16px;color:var(--muted);font-size:14px";
    overlay.innerHTML =
      '<div class="spinner" style="width:32px;height:32px;border-width:3px"></div>' +
      '<span>' + (message || "Loading...") + '</span>';
    document.body.appendChild(overlay);
  },

  // ── Hide full page overlay ────────────────────────────────
  hideOverlay: function () {
    var overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.style.display = "none";
  },

  // ── Weekly calendar loading (for student detail panel) ────
  calendarSpinner: function (container) {
    if (!container) return;
    container.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">' +
        Array(7).fill(0).map(function () {
          return '<div style="height:60px;background:rgba(255,255,255,0.03);' +
            'border:1px solid var(--border);border-radius:6px;' +
            'animation:pulse 1.5s ease infinite"></div>';
        }).join("") +
      '</div>' +
      '<style>@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}</style>';
  }

};