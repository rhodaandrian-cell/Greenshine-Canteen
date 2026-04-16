// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// animation.js — Particle Network Background Animation
// Brownish-red nodes + connecting lines on dark background
// ============================================================

function initParticleNetwork(canvasId = "particle-canvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx    = canvas.getContext("2d");
  let   width  = canvas.width  = window.innerWidth;
  let   height = canvas.height = window.innerHeight;

  // ── Config ───────────────────────────────────────────────
  const CONFIG = {
    particleCount  : 55,
    particleRadius : { min: 2, max: 4 },
    speed          : { min: 0.2, max: 0.6 },
    connectionDist : 160,
    colors         : {
      node1 : "rgba(139, 58, 42,",   // brownish red
      node2 : "rgba(192, 57, 43,",   // bright red
      line  : "rgba(139, 58, 42,"    // line color
    },
    lineWidth      : 0.6,
    nodeOpacity    : { min: 0.5, max: 1.0 }
  };

  // ── Particle class ───────────────────────────────────────
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x      = Math.random() * width;
      this.y      = Math.random() * height;
      this.vx     = (Math.random() - 0.5) * (CONFIG.speed.max - CONFIG.speed.min) + CONFIG.speed.min;
      this.vy     = (Math.random() - 0.5) * (CONFIG.speed.max - CONFIG.speed.min) + CONFIG.speed.min;
      this.radius = Math.random() * (CONFIG.particleRadius.max - CONFIG.particleRadius.min) + CONFIG.particleRadius.min;
      this.color  = Math.random() > 0.5 ? CONFIG.colors.node1 : CONFIG.colors.node2;
      this.opacity= Math.random() * (CONFIG.nodeOpacity.max - CONFIG.nodeOpacity.min) + CONFIG.nodeOpacity.min;
      this.pulse  = Math.random() * Math.PI * 2; // phase offset for pulse
    }

    update() {
      this.x     += this.vx;
      this.y     += this.vy;
      this.pulse += 0.02;

      // Bounce off edges
      if (this.x < 0 || this.x > width)  this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Keep in bounds
      this.x = Math.max(0, Math.min(width,  this.x));
      this.y = Math.max(0, Math.min(height, this.y));
    }

    draw() {
      const pulseOpacity = this.opacity * (0.8 + 0.2 * Math.sin(this.pulse));

      // Outer glow
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
      glow.addColorStop(0,   this.color + pulseOpacity + ")");
      glow.addColorStop(1,   this.color + "0)");

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + pulseOpacity + ")";
      ctx.fill();
    }
  }

  // ── Create particles ─────────────────────────────────────
  let particles = [];
  for (let i = 0; i < CONFIG.particleCount; i++) {
    particles.push(new Particle());
  }

  // ── Draw connections ─────────────────────────────────────
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDist) {
          const opacity = (1 - dist / CONFIG.connectionDist) * 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = CONFIG.colors.line + opacity + ")";
          ctx.lineWidth   = CONFIG.lineWidth;
          ctx.stroke();
        }
      }
    }
  }

  // ── Animation loop ───────────────────────────────────────
  let animFrame;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });

    animFrame = requestAnimationFrame(animate);
  }

  animate();

  // ── Resize handler ───────────────────────────────────────
  window.addEventListener("resize", () => {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // ── Mouse interaction — particles attract to cursor ──────
  let mouse = { x: null, y: null };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Draw extra connections from nearby particles to mouse
    particles.forEach(p => {
      const dx   = p.x - mouse.x;
      const dy   = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        // Gently nudge toward mouse
        p.vx += (mouse.x - p.x) * 0.0003;
        p.vy += (mouse.y - p.y) * 0.0003;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > CONFIG.speed.max) {
          p.vx = (p.vx / speed) * CONFIG.speed.max;
          p.vy = (p.vy / speed) * CONFIG.speed.max;
        }
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