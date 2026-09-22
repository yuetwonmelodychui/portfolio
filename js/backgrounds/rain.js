(function () {
// Work Experience page: a storm at night.
//  - constant diagonal rain in three depths, pale blue with a warm pink-beige mix
//  - frequent thunder: the sky lights up, a forked bolt cracks in from a different
//    angle each time, and the screen shakes
//  - press and hold (or keep clicking) and the storm grows: heavier rain, harder
//    wind, thunder closer together. It slowly calms down when you let go.
// Canvas, coded from scratch.

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

const LAYERS = [
  { cap: 2600, len: [22, 46],  spd: [620, 820],   w: 0.7, cool: 0.22, warm: 0.16 },
  { cap: 1700, len: [46, 92],  spd: [1000, 1250], w: 1.1, cool: 0.4,  warm: 0.3 },
  { cap: 900,  len: [92, 180], spd: [1500, 1900], w: 1.6, cool: 0.62, warm: 0.46 },
];

const BASE_INTENSITY = 0.32;

/* ---------- lightning shapes ---------- */

function jag(x1, y1, x2, y2, depth, disp) {
  if (depth === 0) return [[x1, y1], [x2, y2]];
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp * 0.35;
  return jag(x1, y1, mx, my, depth - 1, disp / 2).concat(jag(mx, my, x2, y2, depth - 1, disp / 2).slice(1));
}

// The bolt comes in at a different angle each time: mostly steep, sometimes
// leaning hard, and now and then nearly sideways.
function makeBolt(W, H) {
  const hard = Math.random() < 0.22;
  const lean = (hard ? rand(0.75, 1.25) : rand(0.05, 0.7)) * (Math.random() < 0.5 ? -1 : 1);
  const y1 = rand(0.45, 0.85) * H;
  const x1 = rand(0.12, 0.88) * W;
  const x0 = x1 - Math.tan(lean) * (y1 + 10);
  const main = jag(x0, -10, x1, y1, 6, W * 0.16);
  const branches = [];
  const n = randInt(2, 4);
  for (let i = 0; i < n; i++) {
    const p = main[randInt(Math.floor(main.length * 0.15), Math.floor(main.length * 0.8))];
    const dir = Math.random() < 0.5 ? -1 : 1;
    branches.push(jag(p[0], p[1], p[0] + dir * rand(0.06, 0.2) * W, p[1] + rand(0.1, 0.28) * H, 4, W * 0.07));
  }
  return { main, branches };
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
  let layerDrops = [];
  let clouds = [];

  let intensity = BASE_INTENSITY;
  let holding = false;
  let gust = 0;
  let windAngle = 0.16;
  const pointer = { x: 0, y: 0 };
  let holdRipple = 0;

  const ripples = [];
  const spray = [];
  const flashes = [];
  let nextStrike = 0;
  let nextFlicker = 0;
  let shake = 0;
  let touched = false;
  const shakeEls = Array.from(document.querySelectorAll('.center_name, .experience'));

  const hint = document.createElement('p');
  hint.className = 'rain-hint';
  hint.textContent = window.matchMedia('(pointer: coarse)').matches
    ? 'touch & hold — the storm grows'
    : 'press & hold — the storm grows, the thunder comes faster';

  /* ---------- setup ---------- */

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
    pointer.x = W / 2;
    pointer.y = H / 2;

    const area = clamp((W * H) / (1280 * 860), 0.35, 1.2);
    layerDrops = LAYERS.map((L) => Array.from({ length: Math.round(L.cap * area) }, () => makeDrop(L, true)));
    clouds = Array.from({ length: 5 }, () => ({
      x: rand(0, W), y: rand(-0.05, 0.4) * H, r: rand(0.35, 0.7) * Math.max(W, H),
      vx: rand(4, 12) * (Math.random() < 0.5 ? -1 : 1), a: rand(0.5, 1),
    }));
    if (reduce) draw(0);
  }

  function makeDrop(L, anywhere) {
    return {
      x: rand(-0.35 * W, W * 1.05),
      y: anywhere ? rand(-H * 0.2, H) : -rand(0, 1.5) * L.len[1],
      len: rand(L.len[0], L.len[1]),
      spd: rand(L.spd[0], L.spd[1]),
      warm: Math.random() < 0.3,
    };
  }

  /* ---------- storm events ---------- */

  function addRipple(x, y, max, alpha, w, ratio, delay, speed) {
    ripples.push({ x, y, r: 2, max, alpha, w, ratio, delay: delay || 0, speed: speed || 110 });
    if (ripples.length > 140) ripples.shift();
  }

  function splash(x, y) {
    const k = scale;
    addRipple(x, y, 230 * k, 0.5, 2, 0.5, 0, 170);
    addRipple(x, y, 170 * k, 0.36, 1.6, 0.5, 0.1, 140);
    addRipple(x, y, 115 * k, 0.28, 1.3, 0.5, 0.2, 120);
    for (let i = 0; i < 14; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const v = rand(120, 380);
      spray.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 });
    }
  }

  function strike(t, big) {
    const strength = big ? rand(0.85, 1.15) : rand(0.22, 0.4);
    const subs = big
      ? [{ d: 0, a: 1.0, k: 0.07 }, { d: 0.14, a: 0.78, k: 0.12 }, { d: 0.42, a: 0.36, k: 0.26 }]
      : [{ d: 0, a: 1.0, k: 0.09 }, { d: 0.18, a: 0.5, k: 0.14 }];
    const ev = { t0: t, subs, strength, big, x: rand(0.15, 0.85) * W, y: rand(0.05, 0.3) * H, v: 0, bolt: null };
    if (big) {
      ev.bolt = makeBolt(W, H);
      const top = ev.bolt.main.find((p) => p[0] > 0 && p[0] < W && p[1] > 0) || ev.bolt.main[Math.floor(ev.bolt.main.length / 3)];
      ev.x = top[0];
      ev.y = top[1];
      shake = Math.max(shake, strength);
    }
    flashes.push(ev);
  }

  function scheduleStrike(t) {
    // the higher the storm, the closer the thunder
    nextStrike = t + lerp(rand(3.2, 7), rand(1.1, 2.8), intensity);
  }
  function scheduleFlicker(t) { nextFlicker = t + rand(1.5, 4) * lerp(1, 0.5, intensity); }

  /* ---------- simulation ---------- */

  function step(dt, t) {
    // the storm: holding builds it, letting go lets it settle back slowly
    if (holding) intensity = Math.min(1, intensity + dt * 0.22);
    else intensity = Math.max(BASE_INTENSITY, intensity - dt * 0.02);
    gust *= Math.pow(0.4, dt);
    windAngle = lerp(0.16, 0.3, intensity) + gust + 0.03 * Math.sin(t * 0.3);

    if (holding) {
      holdRipple -= dt;
      if (holdRipple <= 0) {
        addRipple(pointer.x + rand(-30, 30), pointer.y + rand(-20, 20), rand(90, 170) * scale, 0.32, 1.4, 0.5, 0, 130);
        holdRipple = 0.18;
      }
    }

    const dx = Math.sin(windAngle);
    const dy = Math.cos(windAngle);
    const speedMul = 0.9 + 0.35 * intensity;
    const share = lerp(0.35, 1, intensity);
    layerDrops.forEach((arr, li) => {
      const L = LAYERS[li];
      const n = Math.floor(arr.length * share);
      for (let i = 0; i < n; i++) {
        const d = arr[i];
        const v = d.spd * speedMul * dt;
        d.x += dx * v;
        d.y += dy * v;
        if (d.y - d.len * dy > H + 10 || d.x - d.len * dx > W + 20) {
          d.x = rand(-0.35 * W, W * 1.05);
          d.y = -rand(0, 1.5) * L.len[1];
        }
      }
    });
    clouds.forEach((c) => {
      c.x += c.vx * dt * (0.8 + intensity);
      if (c.x > W + c.r * 0.5) c.x = -c.r * 0.5;
      if (c.x < -c.r * 0.5) c.x = W + c.r * 0.5;
    });

    // rain on the wet ground at the bottom
    if (Math.random() < dt * (6 + 44 * intensity)) {
      addRipple(rand(0, W), H * rand(0.9, 0.995), rand(14, 30) * scale, 0.32, 1, 0.3, 0, 40);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      if (r.delay > 0) { r.delay -= dt; continue; }
      r.r += r.speed * dt;
      if (r.r >= r.max) ripples.splice(i, 1);
    }
    for (let i = spray.length - 1; i >= 0; i--) {
      const p = spray[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 900 * dt;
      p.life -= dt * 1.6;
      if (p.life <= 0) spray.splice(i, 1);
    }

    if (t > nextStrike) { strike(t, true); scheduleStrike(t); }
    if (t > nextFlicker) { strike(t, false); scheduleFlicker(t); }

    // flash brightness = sum of decaying pulses
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      const age = t - f.t0;
      let v = 0;
      f.subs.forEach((s) => { const d = age - s.d; if (d >= 0) v += s.a * Math.exp(-d / s.k); });
      f.v = v * f.strength;
      if (age > 2.2) flashes.splice(i, 1);
    }

    // shake, decaying after each big strike
    shake *= Math.pow(0.02, dt);
    if (shake < 0.02) shake = 0;
    if (shake > 0) {
      const sx = (Math.random() - 0.5) * 2 * shake * 9;
      const sy = (Math.random() - 0.5) * 2 * shake * 9;
      canvas.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      shakeEls.forEach((el) => { el.style.transform = `translate(${(sx * 0.4).toFixed(1)}px, ${(sy * 0.4).toFixed(1)}px)`; });
    } else if (canvas.style.transform) {
      canvas.style.transform = '';
      shakeEls.forEach((el) => { el.style.transform = ''; });
    }
  }

  /* ---------- drawing ---------- */

  function flashLevel() {
    let v = 0;
    flashes.forEach((f) => { v += f.v; });
    return clamp(v, 0, 1.3);
  }

  function drawSky(flash) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04060c');
    g.addColorStop(0.55, '#060a14');
    g.addColorStop(1, '#03050a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // heavy cloud masses drifting overhead
    clouds.forEach((c) => {
      const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      const lit = 0.12 * c.a + flash * 0.1;
      cg.addColorStop(0, `rgba(34, 44, 74, ${lit})`);
      cg.addColorStop(1, 'rgba(34, 44, 74, 0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
    });
  }

  function drawFlash(t) {
    // each event lights the sky from where it struck
    flashes.forEach((f) => {
      if (f.v < 0.01) return;
      ctx.globalCompositeOperation = 'lighter';
      const R = Math.max(W, H) * 0.95;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
      g.addColorStop(0, `rgba(196, 210, 255, ${0.6 * f.v})`);
      g.addColorStop(0.5, `rgba(120, 140, 222, ${0.3 * f.v})`);
      g.addColorStop(1, `rgba(60, 72, 134, ${0.2 * f.v})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    });
  }

  function drawGround() {
    const g = ctx.createLinearGradient(0, H * 0.84, 0, H);
    g.addColorStop(0, 'rgba(2, 4, 9, 0)');
    g.addColorStop(1, 'rgba(2, 4, 9, 0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.84, W, H * 0.16);
  }

  function drawRipples() {
    ripples.forEach((r) => {
      if (r.delay > 0) return;
      const k = clamp(r.r / r.max, 0, 1);
      const a = Math.pow(1 - k, 1.5) * r.alpha;
      ctx.strokeStyle = `rgba(190, 210, 255, ${a})`;
      ctx.lineWidth = r.w * (1 - k * 0.5);
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * r.ratio, 0, 0, TAU);
      ctx.stroke();
    });
    spray.forEach((p) => {
      ctx.fillStyle = `rgba(210, 225, 255, ${p.life * 0.7})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, TAU);
      ctx.fill();
    });
  }

  function drawRainLayer(li, flash) {
    const L = LAYERS[li];
    const arr = layerDrops[li];
    const n = Math.floor(arr.length * lerp(0.35, 1, intensity));
    const k = 0.75 + 0.35 * intensity + flash * 0.7;
    const dx = Math.sin(windAngle);
    const dy = Math.cos(windAngle);
    ctx.lineWidth = L.w;
    ctx.lineCap = 'round';
    [false, true].forEach((warm) => {
      ctx.strokeStyle = warm
        ? `rgba(255, 206, 190, ${clamp(L.warm * k, 0, 1)})`
        : `rgba(150, 172, 255, ${clamp(L.cool * k, 0, 1)})`;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const d = arr[i];
        if (d.warm !== warm) continue;
        ctx.moveTo(d.x - dx * d.len, d.y - dy * d.len);
        ctx.lineTo(d.x, d.y);
      }
      ctx.stroke();
    });
  }

  function drawBolts(t) {
    flashes.forEach((f) => {
      if (!f.bolt) return;
      const age = t - f.t0;
      let a = 0;
      if (age < 0.5) a += Math.exp(-age / 0.09);
      if (age > 0.14 && age < 0.45) a += 0.6 * Math.exp(-(age - 0.14) / 0.07);
      if (a < 0.03) return;
      a = clamp(a, 0, 1);
      const paths = [f.bolt.main].concat(f.bolt.branches);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      [[12, 0.12, '110, 140, 255'], [5, 0.35, '185, 205, 255'], [1.8, 0.95, '255, 255, 255']].forEach(([w, al, col]) => {
        ctx.strokeStyle = `rgba(${col}, ${al * a})`;
        paths.forEach((p, pi) => {
          ctx.lineWidth = pi === 0 ? w : w * 0.55;
          ctx.beginPath();
          p.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
          ctx.stroke();
        });
      });
      ctx.globalCompositeOperation = 'source-over';
    });
  }

  function drawVignette() {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.85);
    vg.addColorStop(0, 'rgba(2, 3, 8, 0)');
    vg.addColorStop(1, 'rgba(2, 3, 8, 0.62)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw(t) {
    const flash = flashLevel();
    drawSky(flash);
    drawFlash(t);
    drawGround();
    drawRainLayer(0, flash);
    drawRainLayer(1, flash);
    drawRipples();
    drawBolts(t);
    drawRainLayer(2, flash);
    drawVignette();
  }

  /* ---------- input ---------- */

  function onDown(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    holding = true;
    intensity = Math.min(1, intensity + 0.1);
    gust += 0.05;
    splash(e.clientX, e.clientY);
    if (!touched) {
      touched = true;
      hint.classList.add('gone');
    }
  }
  function onMove(e) { pointer.x = e.clientX; pointer.y = e.clientY; }
  function onUp() { holding = false; }

  /* ---------- run ---------- */

  resize();
  window.addEventListener('resize', resize);

  if (reduce) {
    return function cleanup() {
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }

  // Preview hook: ?still=strike | calm freezes one moment of the storm.
  const still = new URLSearchParams(window.location.search).get('still');
  if (still) {
    const t = 1000;
    nextStrike = nextFlicker = Infinity;
    if (still === 'strike') strike(t - 0.03, true);
    intensity = still === 'strike' ? 0.6 : BASE_INTENSITY;
    step(0.0001, t);
    shake = 0;
    canvas.style.transform = '';
    shakeEls.forEach((el) => { el.style.transform = ''; });
    draw(t);
    return function cleanup() {
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }

  document.body.appendChild(hint);
  const t0 = performance.now() / 1000;
  scheduleStrike(t0 - 2);   // first thunder arrives almost at once
  scheduleFlicker(t0);

  let raf = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;
    step(dt, t);
    draw(t);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });

  return function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    canvas.style.transform = '';
    shakeEls.forEach((el) => { el.style.transform = ''; });
    hint.remove();
    canvas.remove();
  };
}

(window.__bgThemes = window.__bgThemes || {}).rain = { init };
})();
