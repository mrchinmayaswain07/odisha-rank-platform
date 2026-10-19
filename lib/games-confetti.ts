/**
 * Lightweight Canvas Confetti Fireworks for Game Victory
 * Zero external packages, hardware accelerated HTML5 Canvas
 */

export function triggerConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#E11D48", // Rose
  ];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vrot: number;
    alpha: number;
  }

  const particles: Particle[] = [];
  const particleCount = 120;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 100,
      y: height * 0.45,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 12,
      alpha: 1,
    });
  }

  let animFrameId: number;
  const startTime = Date.now();
  const duration = 2800; // 2.8 seconds

  function frame() {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      cancelAnimationFrame(animFrameId);
      canvas.remove();
      return;
    }

    ctx?.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.vrot;
      p.alpha = Math.max(0, 1 - elapsed / duration);

      if (!ctx) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    animFrameId = requestAnimationFrame(frame);
  }

  animFrameId = requestAnimationFrame(frame);
}
