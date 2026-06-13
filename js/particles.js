export function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let animationId = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dots = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function seed() {
    dots.length = 0;
    const count = Math.min(120, Math.floor((width * height) / 18000));
    for (let i = 0; i < count; i += 1) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ffe1';
    dots.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > width) d.vx *= -1;
      if (d.y < 0 || d.y > height) d.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.45;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduced) animationId = requestAnimationFrame(draw);
  }

  resize();
  seed();
  if (!reduced) draw();
  else draw();

  window.addEventListener('resize', () => { resize(); seed(); });
  return () => cancelAnimationFrame(animationId);
}
