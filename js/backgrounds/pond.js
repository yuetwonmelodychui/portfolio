(function () {
// Projects page: a dark navy pond. Slow pools of deeper and lighter water,
// pale foam shapes, simple navy fish with soft white markings. Move the cursor
// to leave ripples; the fish drift over to look. Click to splash: rings spread,
// droplets fly and the fish scatter. Coded from scratch on <canvas>, no assets.

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

/* ---------- water: pools and foam ---------- */

function makeBlob(kind) {
  const foam = kind === 'foam';
  return {
    kind,
    x: rand(-0.1, 1.1),
    y: rand(-0.1, 1.1),
    vx: rand(-0.006, 0.006),
    vy: rand(-0.004, 0.004),
    R: foam ? rand(34, 96) : rand(150, 340),
    p: [rand(0, TAU), rand(0, TAU), rand(0, TAU)],
    s: [rand(0.05, 0.16) * (Math.random() < 0.5 ? -1 : 1), rand(0.04, 0.12), rand(0.03, 0.09) * (Math.random() < 0.5 ? -1 : 1)],
    a: foam ? [0.24, 0.15, 0.08] : [0.15, 0.1, 0.06],
  };
}

/* ---------- fish ---------- */

const PROFILE = [ // [position along body 0..1, half-width as a fraction of length]
  [0, 0.028], [0.07, 0.078], [0.2, 0.112], [0.4, 0.098], [0.6, 0.064], [0.8, 0.036], [1, 0.02],
];
function profile(t) {
  for (let i = 1; i < PROFILE.length; i++) {
    if (t <= PROFILE[i][0]) {
      const [t0, w0] = PROFILE[i - 1];
      const [t1, w1] = PROFILE[i];
      return w0 + ((t - t0) / (t1 - t0)) * (w1 - w0);
    }
  }
  return PROFILE[PROFILE.length - 1][1];
}

const BODY_COLORS = [
  { body: 'rgba(30, 78, 170, 0.94)', fin: 'rgba(60, 118, 214, 0.5)' },
  { body: 'rgba(18, 48, 120, 0.96)', fin: 'rgba(44, 92, 190, 0.46)' },
  { body: 'rgba(52, 104, 196, 0.92)', fin: 'rgba(120, 165, 236, 0.44)' },
];
const SEGMENTS = 13;

const RAINBOW_INDEX = 4; // exactly one fish is a rainbow; the rest stay blue

function makeFish(W, H, i) {
  const rainbow = i === RAINBOW_INDEX;
  const len = rainbow ? rand(132, 156) : rand(78, 150);
  const x = rand(0.1, 0.9) * W;
  const y = rand(0.15, 0.85) * H;
  const a = rand(0, TAU);
  const gap = len / (SEGMENTS - 1);
  const spine = Array.from({ length: SEGMENTS }, (_, k) => ({
    x: x - Math.cos(a) * gap * k,
    y: y - Math.sin(a) * gap * k,
  }));
  return {
    len, gap, spine,
    a, x, y,
    base: rand(26, 46),
    boost: 0,
    wt: rand(0, TAU),
    wr: rand(0.35, 0.8),
    phase: rand(0, TAU),
    rainbow,
    color: BODY_COLORS[i % BODY_COLORS.length],
    spots: Array.from({ length: 3 }, () => ({
      i: 2 + Math.floor(rand(0, 6)),
      off: rand(-0.55, 0.55),
      r: rand(0.5, 0.95),
    })),
  };
}

function init(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0;
  let H = 0;
  let dpr = 1;
  let scale = 1;
  let blobs = [];
  let fish = [];
  const ripples = [];
  const drops = [];
  const pointer = { x: -999, y: -999, seen: 0, lastRipple: { x: 0, y: 0 } };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = clamp(Math.min(W, H) / 800, 0.6, 1.3);

    if (!blobs.length) {
      blobs = [
        ...Array.from({ length: 5 }, () => makeBlob('light')),
        ...Array.from({ length: 4 }, () => makeBlob('dark')),
        ...Array.from({ length: coarse ? 4 : 6 }, () => makeBlob('foam')),
      ];
    }
    if (!fish.length) {
      const n = W < 640 ? 6 : 9;
      fish = Array.from({ length: n }, (_, i) => makeFish(W, H, i));
    }
  }

  /* ---------- drawing ---------- */

  function blobPath(b, t) {
    const cx = b.x * W;
    const cy = b.y * H;
    const R = b.R * scale;
    const n = 56;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * TAU;
      const r = R * (1
        + b.a[0] * Math.sin(2 * th + b.p[0] + t * b.s[0])
        + b.a[1] * Math.sin(3 * th + b.p[1] + t * b.s[1])
        + b.a[2] * Math.sin(5 * th + b.p[2] + t * b.s[2]));
      const x = cx + Math.cos(th) * r;
      const y = cy + Math.sin(th) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function drawWater(t) {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, '#040b1c');
    g.addColorStop(0.5, '#071a3b');
    g.addColorStop(1, '#030a1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // deeper pools first, then lighter ones, then foam on top
    blobs.forEach((b) => {
      if (b.kind !== 'dark') return;
      blobPath(b, t);
      ctx.fillStyle = 'rgba(1, 6, 20, 0.4)';
      ctx.fill();
    });
    blobs.forEach((b) => {
      if (b.kind !== 'light') return;
      blobPath(b, t);
      ctx.fillStyle = 'rgba(30, 88, 178, 0.17)';
      ctx.fill();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190, 215, 255, 0.05)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.11)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
    blobs.forEach((b) => {
      if (b.kind !== 'foam') return;
      blobPath(b, t);
      ctx.fillStyle = 'rgba(214, 231, 255, 0.075)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(214, 231, 255, 0.05)';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(230, 240, 255, 0.26)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(2, 6, 18, 0)');
    g.addColorStop(1, 'rgba(2, 6, 18, 0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // smooth closed curve through points (midpoint quadratic technique)
  function smoothClosed(P) {
    const n = P.length;
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const s = mid(P[n - 1], P[0]);
    ctx.moveTo(s.x, s.y);
    for (let i = 0; i < n; i++) {
      const m = mid(P[i], P[(i + 1) % n]);
      ctx.quadraticCurveTo(P[i].x, P[i].y, m.x, m.y);
    }
    ctx.closePath();
  }

  function fishGeometry(f) {
    const N = f.spine.length;
    const speedFactor = clamp((f.speed || f.base) / 60, 0.4, 2.2);
    const amp = f.len * 0.045 * speedFactor;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = f.spine[Math.max(i - 1, 0)];
      const b = f.spine[Math.min(i + 1, N - 1)];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const nx = -dy;
      const ny = dx;
      const t = i / (N - 1);
      const wag = Math.sin(f.phase - i * 0.55) * amp * Math.pow(t, 1.25);
      pts.push({
        x: f.spine[i].x + nx * wag,
        y: f.spine[i].y + ny * wag,
        nx, ny, dx, dy,
        w: profile(t) * f.len,
      });
    }
    return pts;
  }

  function bodyPath(pts) {
    const left = pts.map((p) => ({ x: p.x + p.nx * p.w, y: p.y + p.ny * p.w }));
    const right = pts.map((p) => ({ x: p.x - p.nx * p.w, y: p.y - p.ny * p.w })).reverse();
    ctx.beginPath();
    smoothClosed([...left, ...right]);
  }

  // One fixed rainbow that runs head to tail-tip, shared by body and tail so they
  // read as a single colour set. Kept fairly transparent so the water shows through.
  function rainbowPaint(from, to) {
    const g = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    const hues = [330, 20, 52, 140, 190, 235, 275];
    hues.forEach((h, i) => g.addColorStop(i / (hues.length - 1), `hsla(${h}, 85%, 66%, 0.5)`));
    return g;
  }

  function drawFish(f, shadow) {
    const pts = fishGeometry(f);
    const N = pts.length;
    const last = pts[N - 1];
    const prev = pts[N - 2];
    let tx = last.x - prev.x;
    let ty = last.y - prev.y;
    const td = Math.hypot(tx, ty) || 1;
    tx /= td; ty /= td;

    ctx.save();
    if (shadow) {
      ctx.translate(11 * scale, 18 * scale);
      ctx.fillStyle = 'rgba(0, 3, 12, 0.34)';
    }

    // tail fin
    const flick = Math.sin(f.phase - N * 0.55) * 0.4;
    const cos = Math.cos(flick);
    const sin = Math.sin(flick);
    const rot = (dx, dy) => ({ x: dx * cos - dy * sin, y: dx * sin + dy * cos });
    const along = rot(tx, ty);
    const side = { x: -along.y, y: along.x };
    const finLen = f.len * 0.34;
    const finW = f.len * 0.17;
    const base = { x: last.x, y: last.y };
    const fin = [
      { x: base.x + side.x * f.len * 0.02, y: base.y + side.y * f.len * 0.02 },
      { x: base.x + along.x * finLen + side.x * finW, y: base.y + along.y * finLen + side.y * finW },
      { x: base.x + along.x * finLen * 0.62, y: base.y + along.y * finLen * 0.62 },
      { x: base.x + along.x * finLen - side.x * finW, y: base.y + along.y * finLen - side.y * finW },
      { x: base.x - side.x * f.len * 0.02, y: base.y - side.y * f.len * 0.02 },
    ];
    ctx.beginPath();
    smoothClosed(fin);
    const rainbowFill = f.rainbow && !shadow ? rainbowPaint(pts[0], { x: base.x + along.x * finLen, y: base.y + along.y * finLen }) : null;
    if (!shadow) ctx.fillStyle = rainbowFill || f.color.fin;
    ctx.fill();

    // body
    bodyPath(pts);
    if (!shadow) {
      ctx.fillStyle = rainbowFill || f.color.body;
      ctx.fill();
      ctx.strokeStyle = 'rgba(170, 200, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fill();
    }

    if (!shadow) {
      // pale patches, clipped to the body
      ctx.save();
      bodyPath(pts);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
      f.spots.forEach((s) => {
        const p = pts[Math.min(s.i, N - 1)];
        ctx.beginPath();
        ctx.arc(p.x + p.nx * p.w * s.off, p.y + p.ny * p.w * s.off, Math.max(3, p.w * s.r), 0, TAU);
        ctx.fill();
      });
      ctx.restore();

      // pectoral fins
      const pf = pts[3];
      const ang = Math.atan2(pf.dy, pf.dx);
      const flap = Math.sin(f.phase * 0.9) * 0.18;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.17)';
      [-1, 1].forEach((sd) => {
        ctx.beginPath();
        ctx.ellipse(
          pf.x + pf.nx * sd * (pf.w + f.len * 0.02),
          pf.y + pf.ny * sd * (pf.w + f.len * 0.02),
          f.len * 0.1, f.len * 0.036,
          ang + sd * (0.9 + flap), 0, TAU,
        );
        ctx.fill();
      });

      // eyes
      const e = pts[1];
      ctx.fillStyle = 'rgba(225, 238, 255, 0.85)';
      [-1, 1].forEach((sd) => {
        ctx.beginPath();
        ctx.arc(e.x + e.nx * sd * e.w * 0.62, e.y + e.ny * sd * e.w * 0.62, Math.max(1.2, f.len * 0.011), 0, TAU);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawRipples() {
    ripples.forEach((r) => {
      if (r.delay > 0) return;
      const k = clamp(r.r / r.max, 0, 1);
      const a = Math.pow(1 - k, 1.6) * r.alpha;
      ctx.strokeStyle = `rgba(200, 222, 255, ${a})`;
      ctx.lineWidth = r.w * (1 - k * 0.55);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      if (r.r > 26) {
        ctx.strokeStyle = `rgba(200, 222, 255, ${a * 0.45})`;
        ctx.lineWidth = r.w * 0.6;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r * 0.72, 0, TAU);
        ctx.stroke();
      }
      if (r.flash > 0) {
        const g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r * 0.9 + 20);
        g.addColorStop(0, `rgba(255, 255, 255, ${0.22 * r.flash})`);
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r * 0.9 + 20, 0, TAU);
        ctx.fill();
      }
    });
    drops.forEach((d) => {
      ctx.fillStyle = `rgba(235, 245, 255, ${d.life * 0.7})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (0.5 + d.life * 0.5), 0, TAU);
      ctx.fill();
    });
  }

  /* ---------- simulation ---------- */

  function addRipple(x, y, max, alpha, w, delay = 0, speed = 90, flash = 0) {
    ripples.push({ x, y, r: 2, max, alpha, w, delay, speed, flash });
    if (ripples.length > 90) ripples.shift();
  }

  function splash(x, y) {
    const k = scale;
    addRipple(x, y, 240 * k, 0.5, 2.2, 0, 150, 1);
    addRipple(x, y, 190 * k, 0.38, 1.8, 0.09, 130);
    addRipple(x, y, 140 * k, 0.3, 1.5, 0.18, 110);
    for (let i = 0; i < 12; i++) {
      const a = rand(0, TAU);
      const v = rand(60, 190);
      drops.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(1.2, 3), life: 1 });
    }
    // fish dart away from the splash
    fish.forEach((f) => {
      const dx = f.x - x;
      const dy = f.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 360 * k) {
        const push = 1 - d / (360 * k);
        f.a += wrap(Math.atan2(dy, dx) - f.a) * (0.5 + push * 0.5);
        f.boost = Math.max(f.boost, 70 + push * 260);
      }
    });
  }

  function step(dt, t) {
    blobs.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x > 1.3) b.x = -0.3;
      if (b.x < -0.3) b.x = 1.3;
      if (b.y > 1.3) b.y = -0.3;
      if (b.y < -0.3) b.y = 1.3;
    });

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      if (r.delay > 0) { r.delay -= dt; continue; }
      r.r += r.speed * dt;
      r.flash = Math.max(0, r.flash - dt * 2.4);
      if (r.r >= r.max) ripples.splice(i, 1);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.94;
      d.vy *= 0.94;
      d.life -= dt * 1.6;
      if (d.life <= 0) drops.splice(i, 1);
    }

    // a quiet drip now and then keeps the surface alive
    if (Math.random() < dt * 0.35) {
      addRipple(rand(0, W), rand(0, H), rand(70, 130) * scale, 0.16, 1.2, 0, 55);
    }

    const pointerActive = t - pointer.seen < 2200;
    fish.forEach((f) => {
      f.wt += dt * f.wr;
      let sx = Math.cos(f.a + Math.sin(f.wt) * 0.9);
      let sy = Math.sin(f.a + Math.sin(f.wt) * 0.9);

      // stay inside the pond
      const m = 140;
      if (f.x < m) sx += ((m - f.x) / m) * 2.6;
      if (f.x > W - m) sx -= ((f.x - (W - m)) / m) * 2.6;
      if (f.y < m) sy += ((m - f.y) / m) * 2.6;
      if (f.y > H - m) sy -= ((f.y - (H - m)) / m) * 2.6;

      // curious about the cursor, but not right on top of it
      if (pointerActive) {
        const dx = pointer.x - f.x;
        const dy = pointer.y - f.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 480) {
          const near = 100 * scale;
          const dir = d > near ? 0.85 : -1.5;
          sx += (dx / d) * dir;
          sy += (dy / d) * dir;
        }
      }
      // keep some space between fish
      fish.forEach((o) => {
        if (o === f) return;
        const dx = f.x - o.x;
        const dy = f.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 110 * scale) {
          sx += (dx / d) * 0.7;
          sy += (dy / d) * 0.7;
        }
      });

      // wide arcs like a real koi: the faster it swims, the tighter it can turn
      const turn = clamp(((f.base + f.boost) / (f.len * 0.5)), 0.55, 2.4);
      f.a += clamp(wrap(Math.atan2(sy, sx) - f.a), -turn * dt, turn * dt);
      f.boost *= Math.pow(0.35, dt);
      f.speed = f.base + f.boost;
      f.x += Math.cos(f.a) * f.speed * dt;
      f.y += Math.sin(f.a) * f.speed * dt;
      f.phase += dt * (3.2 + f.speed * 0.055);

      f.spine[0].x = f.x;
      f.spine[0].y = f.y;
      for (let i = 1; i < f.spine.length; i++) {
        const p = f.spine[i - 1];
        const s = f.spine[i];
        let dx = s.x - p.x;
        let dy = s.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        s.x = p.x + (dx / d) * f.gap;
        s.y = p.y + (dy / d) * f.gap;
      }
    });
  }

  function render(t) {
    drawWater(t);
    fish.forEach((f) => drawFish(f, true));
    fish.forEach((f) => drawFish(f, false));
    drawRipples();
    drawVignette();
  }

  /* ---------- input ---------- */

  function onMove(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = performance.now();
    const dx = e.clientX - pointer.lastRipple.x;
    const dy = e.clientY - pointer.lastRipple.y;
    const d = Math.hypot(dx, dy);
    if (d > 34) {
      pointer.lastRipple.x = e.clientX;
      pointer.lastRipple.y = e.clientY;
      addRipple(e.clientX, e.clientY, clamp(50 + d * 0.9, 60, 120) * scale, 0.3, 1.5, 0, 80);
    }
  }
  function onDown(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = performance.now();
    splash(e.clientX, e.clientY);
  }

  /* ---------- run ---------- */

  resize();
  window.addEventListener('resize', resize);

  let raf = 0;
  let last = performance.now();

  if (reduce) {
    render(0);
    return function cleanup() {
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt, now);
    render(now / 1000);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });

  return function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    canvas.remove();
  };
}

(window.__bgThemes = window.__bgThemes || {}).pond = { init };
})();
