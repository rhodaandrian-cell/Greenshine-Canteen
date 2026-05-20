// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// animation.js — Floating Green Bubbles / Orbs Background
// Soft green orbs that rise, pulse, and glow on dark background
// ============================================================

function initParticleNetwork(canvasId = "particle-canvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx  = canvas.getContext("2d");
  let width  = canvas.width  = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  // ── Config ───────────────────────────────────────────────
  const CONFIG = {
    bubbleCount : 45,
    colors: [
      "rgba(26, 92, 46,",    // --primary  deep green
      "rgba(34, 116, 58,",   // --primary-light
      "rgba(46, 204, 113,",  // --success  bright green
      "rgba(15, 58, 28,",    // --primary-dark
    ],
    radius : { min: 4,   max: 18  },
    speed  : { min: 0.15, max: 0.5 },
    opacity: { min: 0.08, max: 0.45 },
  };

  // ── Bubble class ─────────────────────────────────────────
  class Bubble {
    constructor(fromBottom = false) {
      this.init(fromBottom);
    }

    init(fromBottom = false) {
      this.x       = Math.random() * width;
      this.y       = fromBottom ? height + Math.random() * 100
                                : Math.random() * height;
      this.radius  = Math.random() * (CONFIG.radius.max - CONFIG.radius.min) + CONFIG.radius.min;
      this.baseOp  = Math.random() * (CONFIG.opacity.max - CONFIG.opacity.min) + CONFIG.opacity.min;
      this.opacity = this.baseOp;
      this.color   = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.speed   = Math.random() * (CONFIG.speed.max - CONFIG.speed.min) + CONFIG.speed.min;
      // Gentle horizontal drift
      this.drift   = (Math.random() - 0.5) * 0.3;
      // Pulse phase
      this.phase   = Math.random() * Math.PI * 2;
      this.phaseSpeed = 0.01 + Math.random() * 0.015;
      // Wobble
      this.wobble  = 0;
      this.wobbleAmp = (Math.random() - 0.5) * 0.4;
    }

    update() {
      // Rise upward
      this.y      -= this.speed;
      // Horizontal drift + wobble
      this.wobble += 0.02;
      this.x      += this.drift + Math.sin(this.wobble) * this.wobbleAmp;
      // Pulse opacity
      this.phase  += this.phaseSpeed;
      this.opacity = this.baseOp * (0.7 + 0.3 * Math.sin(this.phase));

      // Recycle when off-screen
      if (this.y < -this.radius * 4) {
        this.init(true);
      }
      // Wrap horizontal edges softly
      if (this.x < -this.radius * 2)  this.x = width  + this.radius;
      if (this.x >  width + this.radius * 2) this.x = -this.radius;
    }

    draw() {
      // Outer soft glow (large, very transparent)
      const glowSize = this.radius * 3.5;
      const glow = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, glowSize
      );
      glow.addColorStop(0,   this.color + (this.opacity * 0.6) + ")");
      glow.addColorStop(0.5, this.color + (this.opacity * 0.2) + ")");
      glow.addColorStop(1,   this.color + "0)");

      ctx.beginPath();
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Inner bubble body with highlight
      const body = ctx.createRadialGradient(
        this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1,
        this.x, this.y, this.radius
      );
      body.addColorStop(0,   this.color + (this.opacity * 1.4 > 1 ? 1 : this.opacity * 1.4) + ")");
      body.addColorStop(0.6, this.color + this.opacity + ")");
      body.addColorStop(1,   this.color + (this.opacity * 0.5) + ")");

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      // Tiny specular highlight (white glint)
      ctx.beginPath();
      ctx.arc(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.25,
        0, Math.PI * 2
      );
      ctx.fillStyle = `rgba(255,255,255,${this.opacity * 0.4})`;
      ctx.fill();
    }
  }

  // ── Create bubbles ───────────────────────────────────────
  let bubbles = [];
  for (let i = 0; i < CONFIG.bubbleCount; i++) {
    bubbles.push(new Bubble(false)); // scatter across screen initially
  }

  // ── Animation loop ───────────────────────────────────────
  let animFrame;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    bubbles.forEach(b => { b.update(); b.draw(); });
    animFrame = requestAnimationFrame(animate);
  }

  animate();

  // ── Resize handler ───────────────────────────────────────
  window.addEventListener("resize", () => {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // ── Mouse interaction — nearby bubbles gently speed up ───
  let mouse = { x: null, y: null };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    bubbles.forEach(b => {
      const dx   = b.x - mouse.x;
      const dy   = b.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        // Nudge bubble away from cursor slightly
        b.x += dx * 0.003;
        b.y += dy * 0.003;
      }
    });
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Return stop function in case needed
  return () => cancelAnimationFrame(animFrame);
}