/* Lightweight confetti burst. No dependencies. */
export function burstConfetti(options = {}) {
  const {
    colors = ['#0f2e4a', '#1e5f9c', '#2ba8d4', '#d4952b', '#8b1e12', '#f5ecd9'],
    count = 90,
    duration = 2400,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const originX = W / 2;
  const originY = H * 0.42;

  const pieces = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: 6 + Math.random() * 8,
      h: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.4,
      opacity: 1,
    };
  });

  const start = performance.now();

  function frame(now) {
    const t = (now - start) / duration;
    const elapsed = now - start;

    ctx.clearRect(0, 0, W, H);

    pieces.forEach(p => {
      p.vy += 0.28;             /* gravity */
      p.vx *= 0.985;            /* drag */
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.opacity = Math.max(0, 1 - t * 1.15);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
