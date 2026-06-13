export function initParticles(themeGetter) {
  const canvas = document.getElementById('particles');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let raf = 0;
  const count = 64;
  const parts = [];

  const init = () => {
    parts.length = 0;
    for (let i = 0; i < count; i += 1) {
      parts.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 1.7,
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00018,
        a: 0.06 + Math.random() * 0.18,
        cyan: Math.random() < 0.4,
      });
    }
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const dark = themeGetter() === 'dark';
    for (const p of parts) {
      if (!reduced) {
        p.x += p.vx;
        p.y += p.vy;
      }
      if (p.x < -0.02) p.x = 1.02;
      if (p.x > 1.02) p.x = -0.02;
      if (p.y < -0.02) p.y = 1.02;
      if (p.y > 1.02) p.y = -0.02;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
      if (dark) {
        ctx.fillStyle = p.cyan
          ? `rgba(0,255,225,${p.a})`
          : `rgba(200,224,240,${p.a * 0.7})`;
      } else {
        ctx.fillStyle = p.cyan
          ? `rgba(11,160,141,${p.a * 0.9})`
          : `rgba(40,70,100,${p.a * 0.6})`;
      }
      ctx.fill();
    }
    if (!reduced) raf = requestAnimationFrame(draw);
  };

  init();
  resize();
  draw();
  window.addEventListener('resize', resize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}
