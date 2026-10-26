 
// ZERO-DEPENDENCY NATIVE CONFETTI ENGINE
export function burstConfetti() {
  // 1. Create the canvas element
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  
  // Set canvas resolution
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // 2. The Brand Colors (Deep Blue, Warm Gold, Cream, Red)
  const colors = ['#0F2E4A', '#D4AF37', '#F9F6F0', '#E53935'];
  const particles = [];
  const particleCount = 150; // Total explosion size

  // 3. Initialize particles at the center of the screen
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 20, // Explode outwards
      vy: (Math.random() - 0.5) * 20 - 8, // Bias slightly upwards
      size: Math.random() * 8 + 4, // Random sizes between 4px and 12px
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      decay: 0.005 + Math.random() * 0.015,
    });
  }

  // 4. Animation Loop
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    particles.forEach(p => {
      if (p.opacity <= 0) return;
      activeParticles++;

      // Physics
      p.vy += 0.3; // Gravity
      p.vx *= 0.98; // Air friction
      p.vy *= 0.98;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      // Render
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (activeParticles > 0) {
      requestAnimationFrame(update);
    } else {
      // Cleanup when done
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  }

  // Start the animation
  requestAnimationFrame(update);
}
