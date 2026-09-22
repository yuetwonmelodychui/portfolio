(function () {
// Awards page: a still, glowing night in monochrome, painted with light and shade.
//  - on the right, a tall waterfall over chunky faceted boulders: a great main fall
//    that splits over ledges into smaller falls, fine streaming strands, mist and
//    spray, stones standing in the pool, and the whole thing reflected in the water
//  - on the left, a detailed, elegant deer seen from behind, its head turned back
//    toward you, with big many-tined antlers: it sips at the water, lifts its head,
//    looks around, and sips again
//  - two small clusters of softly glowing butterflies fluttering about, one at the
//    top right and one at the centre left
//  - a few small birds fluttering in place in the upper sky
// Canvas, coded from scratch. Only greys and cool whites.

const TAU = Math.PI * 2;
const INK = '236, 241, 250';
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

/* ---------- butterflies: broad, sharply pointed wings, drawn as soft light ---------- */

const B_FORE = new Path2D('M0 -2 C4 -22 26 -46 58 -52 C62 -34 60 -12 46 0 C34 8 14 8 0 5 Z');
const B_HIND = new Path2D('M0 5 C16 4 38 8 44 22 C48 34 40 44 30 46 C24 50 20 60 15 70 C10 56 4 42 2 30 C0 20 0 12 0 5 Z');

// heading = the direction it is flying, in radians
function drawButterfly(ctx, x, y, size, flap, heading, alpha) {
  const open = 0.28 + 0.72 * flap;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading + Math.PI / 2);
  ctx.scale(size / 46, size / 46);
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    ctx.scale(side * open, 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(${INK}, ${0.07 * alpha})`;
    ctx.lineWidth = 10;
    ctx.stroke(B_FORE);
    ctx.stroke(B_HIND);
    const gf = ctx.createLinearGradient(0, 0, 54, -47);
    gf.addColorStop(0, `rgba(${INK}, ${0.8 * alpha})`);
    gf.addColorStop(1, `rgba(${INK}, ${0.16 * alpha})`);
    ctx.fillStyle = gf;
    ctx.fill(B_FORE);
    const gh = ctx.createLinearGradient(0, 4, 30, 66);
    gh.addColorStop(0, `rgba(${INK}, ${0.62 * alpha})`);
    gh.addColorStop(1, `rgba(${INK}, ${0.12 * alpha})`);
    ctx.fillStyle = gh;
    ctx.fill(B_HIND);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(4, 6, 10, ${0.3 * alpha})`;
    ctx.beginPath(); ctx.arc(38, -30, 3.6, 0, TAU); ctx.arc(28, 28, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(${INK}, ${0.3 * alpha})`;
    ctx.lineWidth = 0.7;
    ctx.stroke(B_FORE);
    ctx.stroke(B_HIND);
    ctx.restore();
  }
  ctx.fillStyle = `rgba(${INK}, ${0.9 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 3, 1.8, 11, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(${INK}, ${0.7 * alpha})`;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.quadraticCurveTo(-4, -18, -12, -22);
  ctx.moveTo(0, -7);
  ctx.quadraticCurveTo(4, -18, 12, -22);
  ctx.stroke();
  ctx.restore();
}

/* ---------- a small bird, like the old Twitter one, with a wing that flutters ---------- */

function drawBird(ctx, x, y, s, flap, face, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face * s, s);
  ctx.fillStyle = `rgba(${INK}, ${alpha})`;
  // the tail
  ctx.beginPath();
  ctx.moveTo(-8, 3);
  ctx.lineTo(-24, 8);
  ctx.lineTo(-22, 12);
  ctx.lineTo(-7, 9);
  ctx.closePath();
  ctx.fill();
  // body, head and a small beak
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.bezierCurveTo(-9, -2, -3, -7, 4, -8);
  ctx.bezierCurveTo(8, -11, 13, -9, 14, -6);
  ctx.lineTo(21, -4);
  ctx.lineTo(14, -2);
  ctx.bezierCurveTo(12, 6, 4, 12, -4, 11);
  ctx.bezierCurveTo(-8, 10.5, -10, 8.5, -10, 6);
  ctx.closePath();
  ctx.fill();
  // the wing swings up and down from the shoulder
  ctx.save();
  ctx.translate(-1, -2);
  ctx.rotate(lerp(-1.05, 0.6, flap));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-8, -10, 0, -26, 18, -23);
  ctx.bezierCurveTo(10, -15, 8, -7, 6, 2);
  ctx.closePath();
  ctx.fillStyle = `rgba(${INK}, ${Math.min(1, alpha * 1.25)})`;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(4, 6, 10, 0.9)';
  ctx.beginPath();
  ctx.arc(10, -6, 1.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ---------- soft streak texture for the flowing water: many fine strands ---------- */

function makeTexture(count, wMin, wMax, aMin, aMax, lMin, lMax) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d');
  for (let i = 0; i < count; i++) {
    const x = rand(0, 256);
    const w = rand(wMin, wMax);
    const a = rand(aMin, aMax);
    const len = rand(lMin, lMax);
    const y0 = rand(0, 512);
    [1, 2.4, 4.6].forEach((m, mi) => {
      const grad = g.createLinearGradient(0, y0, 0, y0 + len);
      const al = a * [1, 0.3, 0.12][mi];
      grad.addColorStop(0, `rgba(${INK}, 0)`);
      grad.addColorStop(0.5, `rgba(${INK}, ${al})`);
      grad.addColorStop(1, `rgba(${INK}, 0)`);
      g.fillStyle = grad;
      g.fillRect(x - (w * m) / 2, y0, w * m, len);
      if (y0 + len > 512) {             // wrap round the bottom so the tile has no seam
        g.save();
        g.translate(0, -512);
        g.fillRect(x - (w * m) / 2, y0, w * m, len);
        g.restore();
      }
    });
  }
  return c;
}

// rounded closed shape through points (midpoint quadratics)
function roundShape(ctx, pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const st = mid(pts[n - 1], pts[0]);
  ctx.beginPath();
  ctx.moveTo(st[0], st[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

// straight-edged closed shape, for the blocky rock
function polyPath(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
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
  let k = 1;
  let G = null;
  let strands = [];
  let rays = [];
  let mistBlobs = [];
  let glints = [];
  let dust = [];
  let clusters = [];
  let birds = [];
  let staticLayer = null;   // the wall, boulders and stones, painted once
  const spray = [];
  const ripples = [];
  let nextRipple = 0;
  let nextSpray = 0;
  const pointer = { x: -9999, y: -9999 };

  let maskC = null;
  let fallC = null;
  let fallG = null;
  let pat1 = null;
  let pat2 = null;

  // Preview hook: ?deer=up holds the deer with its head raised, ?deer=down keeps it sipping.
  const forceDeer = new URLSearchParams(window.location.search).get('deer');
  const deer = { state: 'sip', until: 0, d: 1, target: 1, yaw: 1, ear: 0, tail: 0, nextRipple: 0, x: 0, S: 1, lookT0: 0 };

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
    k = clamp(Math.min(W, H) / 800, 0.65, 1.25);
    build();
    if (reduce) { step(0.016, 3); draw(3); }
  }

  function build() {
    // on narrow screens the falls move left so they still show
    const xf = (f) => (W < 700 ? W * (0.3 + (f - 0.5) * (0.7 / 0.5)) : W * f);
    const yGround = Math.min(H - 58, H * 0.84);
    const yT = H * 0.09;                 // top of the great wall
    const yA = H * 0.5;                  // the first ledge
    const yB = H * 0.68;                 // the second ledge
    G = { yGround, yT, yA, yB, bank: xf(W < 700 ? 0.42 : 0.4), xR: xf(0.5), xf };

    // --- the falls: a great main fall that splits over the ledges into smaller ones ---
    const falls = [
      { cx: xf(0.735), w: Math.max(52, W * 0.095), y0: yT, y1: yA - H * 0.01, a: 1, main: true, land: false },
      { cx: xf(0.632), w: Math.max(10, W * 0.016), y0: yT + H * 0.09, y1: yA + H * 0.02, a: 0.6, land: false },
      { cx: xf(0.935), w: Math.max(14, W * 0.022), y0: yT + H * 0.07, y1: yA + H * 0.06, a: 0.7, land: false },
      { cx: xf(0.685), w: Math.max(18, W * 0.032), y0: yA + H * 0.02, y1: yGround, a: 0.85, land: true },
      { cx: xf(0.77), w: Math.max(30, W * 0.06), y0: yA + H * 0.02, y1: yB - H * 0.005, a: 1, land: false },
      { cx: xf(0.775), w: Math.max(32, W * 0.066), y0: yB + H * 0.012, y1: yGround, a: 1, land: true },
      { cx: xf(0.87), w: Math.max(22, W * 0.042), y0: yA + H * 0.1, y1: yGround, a: 0.9, land: true },
    ];
    G.falls = falls;
    G.landing = falls.filter((f) => f.land);

    // --- the wall, boulders and stones: flat-shaded, faceted, painted once ---
    const boulders = [];
    const ledges = [
      { x0: xf(0.66), x1: xf(0.82), y: yA + H * 0.014, n: 6, r: 44 },
      { x0: xf(0.72), x1: xf(0.84), y: yB + H * 0.01, n: 4, r: 40 },
      { x0: xf(0.83), x1: xf(0.95), y: yA + H * 0.09, n: 4, r: 36 },
    ];
    // the great wall behind: rows of big boulders, leaving gaps where the water runs
    const gap = (x, y) => falls.some((f) => y > f.y0 - 10 && y < f.y1 && Math.abs(x - f.cx) < f.w * 0.75);
    for (let row = 0; row < 7; row++) {
      const y = yT + row * H * 0.1 + rand(-10, 10);
      let x = xf(0.5) - rand(0, 40);
      while (x < W + 40) {
        const r = rand(46, 92) * k;
        if (!gap(x, y)) boulders.push({ x, y, r, tone: 1 - row * 0.09 - Math.max(0, (x - xf(0.5)) / W) * 0.3, back: true });
        x += r * rand(1.3, 1.7);
      }
    }
    // boulders lining the ledges, and a few big ones in the foreground either side
    ledges.forEach((l) => {
      for (let i = 0; i < l.n; i++) {
        const x = lerp(l.x0, l.x1, (i + rand(0.1, 0.9)) / l.n);
        if (!gap(x, l.y - 2)) boulders.push({ x, y: l.y, r: rand(0.6, 1) * l.r * k, tone: 0.75, back: false });
      }
    });
    boulders.push(
      { x: xf(0.6), y: yGround, r: 66 * k, tone: 0.9, back: false }, { x: xf(0.57), y: yGround - 2, r: 44 * k, tone: 0.8, back: false },
      { x: xf(0.965), y: yGround, r: 76 * k, tone: 0.55, back: false }, { x: xf(0.925), y: yGround + 2, r: 42 * k, tone: 0.5, back: false },
    );
    G.boulders = boulders;

    // flat stones standing in the pool
    G.poolStones = Array.from({ length: 10 }, () => ({
      x: xf(rand(0.56, 0.97)), y: yGround + rand(8, Math.min(H - 46 - yGround, H * 0.07) * 0.9), rx: rand(14, 34) * k, ry: rand(4, 8) * k,
    }));
    paintStatic();

    // --- water: fine strands, plus a flowing texture shaped by a mask ---
    strands = [];
    falls.forEach((f) => {
      const n = Math.min(70, Math.max(12, Math.round(f.w / 1.4)));
      for (let i = 0; i < n; i++) {
        strands.push({
          f, off: (Math.random() - 0.5) * f.w * 0.94, a: rand(0.16, 0.6) * (0.55 + 0.45 * f.a), w: rand(0.6, 1.8),
          dash0: rand(24, 120), dash1: rand(20, 100), speed: rand(150, 380), phase: rand(0, 300),
          amp: rand(0.8, 3), wph: rand(0, TAU), wsp: rand(0.3, 0.9),
        });
      }
    });

    const xR = G.xR;
    const fw = W - xR;
    maskC = document.createElement('canvas');
    maskC.width = Math.round(fw);
    maskC.height = Math.round(H);
    const m = maskC.getContext('2d');
    m.globalCompositeOperation = 'lighter';
    falls.forEach((f) => {
      const stepY = 6;   // whole-pixel slices that meet exactly, so no bright seams
      for (let y = Math.round(f.y0); y < f.y1; y += stepY) {
        const u = (y - f.y0) / (f.y1 - f.y0);
        const w = f.w * (0.72 + 0.5 * u);
        const cx = f.cx - xR + Math.sin(y * 0.011 + f.cx) * f.w * 0.05;
        const fade = Math.min(1, u * 14) * Math.min(1, (1 - u) * 5 + 0.25);
        const g = m.createLinearGradient(cx - w, 0, cx + w, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.24, `rgba(255,255,255,${0.75 * f.a * fade})`);
        g.addColorStop(0.5, `rgba(255,255,255,${f.a * fade})`);
        g.addColorStop(0.76, `rgba(255,255,255,${0.75 * f.a * fade})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        m.fillStyle = g;
        m.fillRect(cx - w, y, w * 2, stepY);
      }
    });
    fallC = document.createElement('canvas');
    fallC.width = Math.round(fw);
    fallC.height = Math.round(H);
    fallG = fallC.getContext('2d');
    pat1 = fallG.createPattern(makeTexture(260, 1, 4.5, 0.16, 0.6, 70, 300), 'repeat');
    pat2 = fallG.createPattern(makeTexture(60, 6, 26, 0.06, 0.2, 160, 480), 'repeat');

    // mist and foam where the water lands, banks of fog, shafts of light, glints on the water
    mistBlobs = [];
    falls.forEach((f) => {
      const n = f.main ? 5 : f.land ? 6 : 3;
      for (let i = 0; i < n; i++) {
        mistBlobs.push({ x: f.cx + rand(-1.1, 1.1) * f.w, y: f.y1 + rand(-14, 12), r: rand(40, 110) * k * (f.land ? 1.2 : 0.8), ph: rand(0, TAU), sp: rand(0.25, 0.55), gain: f.land ? 0.65 : 0.45 });
      }
    });
    rays = Array.from({ length: 5 }, (_, i) => ({
      x: W * (0.32 + i * 0.1) + rand(-24, 24), w: rand(34, 100) * k, slant: W * rand(0.14, 0.26), a: rand(0.03, 0.055), ph: rand(0, TAU),
    }));
    const refH = Math.max(0, Math.min(H - 46 - yGround, H * 0.1));
    G.refH = refH;
    glints = Array.from({ length: coarse ? 18 : 36 }, () => ({
      x: rand(G.bank + 30, W - 20), y: yGround + rand(3, Math.max(4, refH - 4)), l: rand(6, 24) * k, ph: rand(0, TAU), sp: rand(0.6, 1.6),
    }));
    dust = Array.from({ length: coarse ? 22 : 44 }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(0.6, 1.4), vy: -rand(2, 9), vx: rand(-4, 4), ph: rand(0, TAU),
    }));

    // butterflies: two small clusters that flutter about (no loops): top right, and centre left
    const makeCluster = (hx, hy, n, big, spread) => ({
      hx, hy, spread,
      members: Array.from({ length: n }, (_, i) => ({
        size: lerp(big, big * 0.62, i / Math.max(1, n - 1)) * k,
        ox: rand(-1, 1) * spread, oy: rand(-0.7, 0.7) * spread,
        f1: rand(0.18, 0.4), f2: rand(0.3, 0.7), p1: rand(0, TAU), p2: rand(0, TAU), p3: rand(0, TAU), p4: rand(0, TAU),
        flapSp: rand(8, 12), flapPh: rand(0, TAU), kx: 0, ky: 0, x: 0, y: 0, h: 0, px: 0, py: 0,
      })),
    });
    clusters = [
      makeCluster(xf(0.86), H * 0.17, randInt(3, 4), 24, 70 * k),
      makeCluster(W * 0.23, H * 0.44, randInt(3, 5), 22, 80 * k),
    ];

    // small birds fluttering in place in the upper sky
    birds = Array.from({ length: 4 }, (_, i) => ({
      hx: W * (0.3 + i * 0.07) + rand(-20, 20), hy: H * rand(0.13, 0.28), s: rand(0.7, 1.05) * k,
      p1: rand(0, TAU), p2: rand(0, TAU), p3: rand(0, TAU), fl: rand(5.5, 8), face: Math.random() < 0.5 ? 1 : -1, x: 0, y: 0, flap: 0,
    }));

    // the deer stands on the left bank, back to us, head turned to look back over its shoulder
    deer.S = clamp(H * 0.00135, 0.7, 1.4) * (W < 700 ? 0.8 : 1);
    deer.x = Math.max(140 * deer.S, G.bank - 250 * deer.S);
    deer.d = deer.target = 1;
    deer.state = 'sip';
    deer.until = 3;
  }

  // Flat-shaded boulder: a light top facet, a mid front, a dark underside.
  function boulder(c, b) {
    const pts = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.14, 0.14) - Math.PI / 2;
      const rr = b.r * rand(0.82, 1.06);
      pts.push([b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr * 0.82]);
    }
    const tone = clamp(b.tone, 0.2, 1);
    const v = Math.round(11 + tone * 20);
    polyPath(c, pts);
    c.fillStyle = `rgb(${v}, ${v + 3}, ${v + 8})`;
    c.fill();
    // light top facet
    c.beginPath();
    c.moveTo(pts[7][0], pts[7][1]);
    c.lineTo(pts[0][0], pts[0][1]);
    c.lineTo(pts[1][0], pts[1][1]);
    c.lineTo(pts[2][0], pts[2][1]);
    c.lineTo(b.x + b.r * 0.1, b.y - b.r * 0.05);
    c.lineTo(b.x - b.r * 0.35, b.y - b.r * 0.02);
    c.closePath();
    c.fillStyle = `rgba(${INK}, ${0.04 + tone * 0.07})`;
    c.fill();
    // dark underside facet
    c.beginPath();
    c.moveTo(b.x - b.r * 0.35, b.y - b.r * 0.02);
    c.lineTo(b.x + b.r * 0.1, b.y - b.r * 0.05);
    c.lineTo(pts[2][0], pts[2][1]);
    c.lineTo(pts[3][0], pts[3][1]);
    c.lineTo(pts[4][0], pts[4][1]);
    c.lineTo(pts[5][0], pts[5][1]);
    c.lineTo(pts[6][0], pts[6][1]);
    c.closePath();
    c.fillStyle = 'rgba(0, 0, 0, 0.36)';
    c.fill();
    c.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    c.lineWidth = 1.2;
    polyPath(c, pts);
    c.stroke();
    c.strokeStyle = `rgba(${INK}, 0.1)`;      // a bright edge where the top catches the light
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(pts[7][0], pts[7][1]);
    c.lineTo(pts[0][0], pts[0][1]);
    c.lineTo(pts[1][0], pts[1][1]);
    c.stroke();
  }

  function paintStatic() {
    staticLayer = document.createElement('canvas');
    staticLayer.width = Math.round(W * dpr);
    staticLayer.height = Math.round(H * dpr);
    const c = staticLayer.getContext('2d');
    c.scale(dpr, dpr);

    // the dark wall, deepening toward the water, with hazy far rock behind it
    const xw = G.xR - W * 0.04;
    const wall = c.createLinearGradient(0, G.yT, 0, G.yGround);
    wall.addColorStop(0, '#12151b');
    wall.addColorStop(1, '#06080b');
    c.fillStyle = wall;
    c.beginPath();
    c.moveTo(xw, G.yGround);
    c.lineTo(xw + W * 0.02, G.yT + H * 0.2);
    c.lineTo(xw + W * 0.05, G.yT - H * 0.01);
    c.lineTo(W + 20, G.yT - H * 0.03);
    c.lineTo(W + 20, G.yGround);
    c.closePath();
    c.fill();

    // stone slabs that the water spills over, with a lit lip
    [[0.66, 0.84, G.yA + H * 0.012, 14], [0.7, 0.86, G.yB + H * 0.01, 12]].forEach(([f0, f1, y, hh]) => {
      const x0 = G.xf(f0);
      const x1 = G.xf(f1);
      polyPath(c, [[x0, y], [x1, y - 3], [x1 + 8, y + hh], [x0 - 10, y + hh + 2]]);
      c.fillStyle = '#0d1016';
      c.fill();
      c.strokeStyle = `rgba(${INK}, 0.22)`;
      c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y - 3); c.stroke();
    });

    // boulders: the back rows first, then the ledges and foreground
    G.boulders.filter((b) => b.back).forEach((b) => boulder(c, b));
    G.boulders.filter((b) => !b.back).forEach((b) => boulder(c, b));

    // flat stones standing in the pool
    G.poolStones.forEach((s) => {
      c.save();
      c.translate(s.x, s.y);
      const g = c.createLinearGradient(0, -s.ry, 0, s.ry);
      g.addColorStop(0, '#39404b');
      g.addColorStop(1, '#10131a');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, 0, s.rx, s.ry, 0, 0, TAU);
      c.fill();
      c.strokeStyle = `rgba(${INK}, 0.14)`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(0, -s.ry * 0.25, s.rx * 0.9, s.ry * 0.7, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      c.restore();
    });
  }

  /* ---------- events ---------- */

  function addRipple(x, y, max, alpha, speed) {
    ripples.push({ x, y, r: 2, max, alpha, speed: speed || 40 });
    if (ripples.length > 70) ripples.shift();
  }

  /* ---------- deer ---------- */

  // Neck pivot on the shoulders, and how the neck and head sit when lowered to drink (d = 1)
  // or raised (d = 0). yaw is how far the face turns: 1 = profile toward the water,
  // 0 = looking straight back at us, -1 = profile looking back over the rump.
  const PIV = [68, -138];
  const NECK = 100;
  function headPose(t) {
    const e = ease(deer.d);
    const sip = e > 0.9 ? Math.max(0, Math.sin(t * 5.2)) * 2.5 : 0;
    const neckAng = lerp(-0.95, 1.0, e);
    return {
      neckAng,
      ax: PIV[0] + Math.cos(neckAng) * NECK,
      ay: PIV[1] + Math.sin(neckAng) * NECK + sip,
      tot: neckAng + lerp(0.85, 0.62, e),
    };
  }

  function muzzle(t) {
    const h = headPose(t);
    const S = deer.S;
    return { x: deer.x + (h.ax + Math.cos(h.tot) * 50) * S, y: G.yGround + (h.ay + Math.sin(h.tot) * 50) * S };
  }

  // open curve through points (midpoint quadratics)
  function smoothOpen(c, pts) {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }

  // One antler in antler-space (u = out to the side, v = up). Returns its strokes.
  const ANT_BEAM = [[6, -14], [18, -36], [30, -66], [34, -100], [30, -130], [22, -152]];
  const ANT_TINES = [
    [[10, -22], [24, -28], [31, -44], [30, -56]],           // brow
    [[20, -44], [38, -52], [46, -72], [46, -84]],           // bez
    [[31, -72], [46, -80], [56, -100], [57, -112]],         // trez
    [[34, -100], [48, -106], [57, -126], [56, -142]],       // upper tine
    [[30, -130], [42, -136], [48, -152], [46, -166]],       // crown
    [[30, -88], [18, -94], [13, -112], [14, -122]],         // inner tine
    [[22, -148], [28, -156], [28, -170]],
  ];

  // A detailed line drawing of a stag in three-quarter view from behind: the rump toward
  // us on the left, fine contour and fur lines, a long neck that dips to the water or rises
  // to look back, and big many-tined antlers.
  function drawDeer(t) {
    const D = deer;
    const S = D.S;
    const h = headPose(t);
    ctx.save();
    ctx.translate(D.x, G.yGround);
    ctx.scale(S, S);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const line = (a) => `rgba(${INK}, ${a})`;
    const fill = '#07090c';
    const stroke = (a, w) => { ctx.strokeStyle = line(a); ctx.lineWidth = w; };
    stroke(0.92, 1.5);
    const shape = (pts, dim) => {
      roundShape(ctx, pts);
      ctx.globalAlpha = dim || 1;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    // legs: the far pair first (dimmer), then the near ones, with knees, hocks and hooves
    const leg = (pts, dim) => {
      polyPath(ctx, pts);
      ctx.globalAlpha = dim || 1;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    leg([[-52, -104], [-36, -100], [-34, -76], [-40, -62], [-40, -32], [-39, -8], [-46, -8], [-47, -32], [-48, -56], [-58, -66], [-62, -84]], 0.6);
    leg([[94, -104], [108, -102], [106, -80], [103, -64], [103, -32], [102, -8], [96, -8], [96, -32], [95, -62], [92, -80]], 0.6);
    leg([[-128, -106], [-94, -102], [-92, -78], [-99, -62], [-100, -32], [-99, -8], [-107, -8], [-108, -32], [-109, -54], [-122, -64], [-130, -86]]);
    leg([[48, -108], [72, -104], [69, -78], [65, -64], [65, -32], [64, -8], [56, -8], [56, -32], [55, -64], [50, -80]]);
    // tendon and joint lines on the legs
    stroke(0.36, 0.9);
    ctx.beginPath();
    [[-108, -48, -101, -46], [-106, -28, -100, -26], [57, -58, 64, -56], [57, -32, 64, -30], [-44, -52, -38, -48], [97, -50, 103, -48]].forEach(([a, b, c2, d]) => { ctx.moveTo(a, b); ctx.lineTo(c2, d); });
    ctx.stroke();
    // hooves
    ctx.fillStyle = line(0.9);
    [[-103, 0, 7], [60, 0, 7], [-43, 0, 5], [99, 0, 5]].forEach(([x, y, w]) => {
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w * 0.75, y - 8);
      ctx.lineTo(x - w * 0.75, y - 8);
      ctx.closePath();
      ctx.fill();
    });

    // the body: a full rounded rump, a long back, a deep chest and a tucked belly
    ctx.beginPath();
    ctx.moveTo(-114, -140);
    ctx.bezierCurveTo(-92, -162, -42, -156, -6, -156);
    ctx.bezierCurveTo(24, -156, 44, -168, 74, -168);
    ctx.bezierCurveTo(90, -158, 100, -134, 92, -108);
    ctx.bezierCurveTo(86, -90, 56, -80, 22, -82);
    ctx.bezierCurveTo(-8, -84, -34, -98, -58, -100);
    ctx.bezierCurveTo(-88, -92, -116, -90, -127, -110);
    ctx.bezierCurveTo(-134, -124, -128, -134, -114, -140);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    stroke(0.92, 1.5);
    ctx.stroke();
    const bg = ctx.createLinearGradient(0, -170, 0, -80);
    bg.addColorStop(0, `rgba(${INK}, 0.12)`);
    bg.addColorStop(0.6, `rgba(${INK}, 0.02)`);
    bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bg;
    ctx.fill();

    // muscle contours: the haunch, the shoulder, the flank; and fine fur
    stroke(0.42, 1);
    ctx.beginPath();
    ctx.moveTo(-112, -142); ctx.bezierCurveTo(-96, -126, -92, -108, -96, -96);                // haunch
    ctx.moveTo(-124, -120); ctx.bezierCurveTo(-108, -118, -100, -110, -98, -98);
    ctx.moveTo(-74, -132); ctx.bezierCurveTo(-56, -122, -44, -108, -44, -96);                 // stifle
    ctx.moveTo(30, -158); ctx.bezierCurveTo(52, -146, 62, -124, 56, -100);                    // shoulder
    ctx.moveTo(44, -140); ctx.bezierCurveTo(70, -134, 80, -118, 78, -104);
    ctx.moveTo(-6, -140); ctx.bezierCurveTo(6, -128, 8, -108, 0, -90);                        // flank
    ctx.stroke();
    stroke(0.3, 0.9);
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {                                                             // spine flecks
      const x = -100 + i * 13;
      const y = -150 - Math.sin(i * 0.5) * 3 + (i > 9 ? -(i - 9) * 2 : 0);
      ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 6);
    }
    for (let i = 0; i < 12; i++) {                                                             // belly fur
      const x = -50 + i * 11;
      ctx.moveTo(x, -84 + Math.sin(i) * 1.5); ctx.lineTo(x + 3, -76 + (i % 3));
    }
    for (let i = 0; i < 5; i++) {                                                              // chest tufts
      ctx.moveTo(90 - i * 2, -128 + i * 7); ctx.lineTo(80 - i * 2, -122 + i * 7);
    }
    ctx.stroke();

    // tail: a pale tuft on the rump, with a quick flick
    ctx.save();
    ctx.translate(-116, -138);
    ctx.rotate(-0.5 - D.tail * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-18, -4, -24, -28);
    ctx.quadraticCurveTo(-6, -24, 8, -6);
    ctx.closePath();
    ctx.fillStyle = line(0.92);
    ctx.fill();
    stroke(0.5, 1);
    ctx.stroke();
    ctx.restore();

    // the neck: a tapered form pivoting at the shoulder; only its crest and throat are drawn
    ctx.save();
    ctx.translate(PIV[0], PIV[1]);
    ctx.rotate(h.neckAng);
    const crest = [[-4, -22], [22, -27], [56, -22], [84, -14], [102, -10]];
    const throat = [[102, 11], [82, 15], [54, 17], [24, 26], [-4, 30]];
    roundShape(ctx, [...crest, ...throat]);
    ctx.fillStyle = fill;
    ctx.fill();
    stroke(0.92, 1.5);
    ctx.beginPath();
    smoothOpen(ctx, crest);
    ctx.stroke();
    ctx.beginPath();
    smoothOpen(ctx, throat);
    ctx.stroke();
    stroke(0.3, 0.9);                                                                        // fur along the neck
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const x = 8 + i * 12;
      ctx.moveTo(x, 20 + (x < 40 ? 4 : 0) - i * 0.6);
      ctx.lineTo(x - 7, 25 + (x < 40 ? 4 : 0) - i * 0.4);
    }
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 13;
      ctx.moveTo(x, -20 + i * 1.2); ctx.lineTo(x + 6, -14 + i * 1.2);
    }
    ctx.stroke();
    ctx.restore();

    // the head: profile when drinking, face-on when looking back at us
    const yaw = D.yaw;
    const sideA = Math.abs(yaw);
    const mir = yaw < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(h.ax, h.ay);
    ctx.rotate(h.tot * sideA * mir);
    ctx.scale(mir * 1.12, 1.12);
    // face-on
    if (1 - sideA > 0.02) {
      ctx.globalAlpha = 1 - sideA;
      ctx.save();
      ctx.rotate(Math.PI / 2 * 0);
      roundShape(ctx, [[0, -20], [13, -12], [13, 8], [8, 26], [0, 34], [-8, 26], [-13, 8], [-13, -12]]);
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(0.92, 1.5);
      ctx.stroke();
      ctx.fillStyle = line(0.95);
      [[-7, -4], [7, -4]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 1.7, 1.2, 0, 0, TAU); ctx.fill(); });
      ctx.beginPath(); ctx.ellipse(0, 30, 4, 2.4, 0, 0, TAU); ctx.fill();
      stroke(0.4, 0.9);
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 20); ctx.moveTo(-6, 12); ctx.quadraticCurveTo(0, 18, 6, 12);
      ctx.moveTo(-9, -12); ctx.quadraticCurveTo(-4, -8, -3, 2); ctx.moveTo(9, -12); ctx.quadraticCurveTo(4, -8, 3, 2);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // profile
    if (sideA > 0.02) {
      ctx.globalAlpha = sideA;
      roundShape(ctx, [[-6, -10], [14, -12], [34, -5], [44, 0], [37, 7], [14, 11], [-6, 11]]);
      ctx.fillStyle = fill;
      ctx.fill();
      stroke(0.92, 1.5);
      ctx.stroke();
      ctx.fillStyle = line(0.95);
      ctx.beginPath(); ctx.ellipse(17, -3.5, 1.7, 1.3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(40, 0, 1.8, 1.4, 0, 0, TAU); ctx.fill();
      stroke(0.4, 0.9);
      ctx.beginPath(); ctx.moveTo(6, 3); ctx.quadraticCurveTo(24, 8, 37, 5.5);
      ctx.moveTo(4, -5); ctx.quadraticCurveTo(12, -8, 20, -9);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // ears: out to the sides when facing us, swept back in profile
    stroke(0.92, 1.4);
    [-1, 1].forEach((s) => {
      const out = 1 - sideA;
      ctx.save();
      ctx.translate(s * 9 * out + (-2) * sideA, -10);
      ctx.rotate(s * (1.05 + D.ear * 0.3) * out + (-0.9 - D.ear * 0.25) * sideA * (s === 1 ? 1 : 0.6) + (s === -1 ? 0.5 * sideA : 0));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -5, 30, -7);
      ctx.quadraticCurveTo(14, 6, 0, 0);
      ctx.fillStyle = fill;
      ctx.globalAlpha = s === 1 || out > 0.5 ? 1 : 0.7;
      ctx.fill();
      ctx.stroke();
      stroke(0.4, 0.8);
      ctx.beginPath(); ctx.moveTo(3, 0); ctx.quadraticCurveTo(14, -3, 24, -6);
      ctx.stroke();
      stroke(0.92, 1.4);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    // antlers: wide and many-tined face-on, swept back and layered in profile
    const P = (u, v, s) => {
      const faceX = s * u;
      const sideX = -u * 1.0 + v * 0.45 + s * 5;
      return [lerp(faceX, sideX, sideA), v];
    };
    ctx.rotate(-0.55 * h.tot * sideA);
    [-1, 1].forEach((s) => {
      ctx.globalAlpha = sideA > 0.5 && s === -1 ? 0.6 : 1;
      const path = (pts) => {
        const q = pts.map(([u, v]) => P(u, v, s));
        ctx.beginPath();
        smoothOpen(ctx, q);
      };
      ctx.globalCompositeOperation = 'lighter';
      stroke(0.08, 9);
      path(ANT_BEAM);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      stroke(0.95, 3);
      path(ANT_BEAM);
      ctx.stroke();
      stroke(0.9, 1.7);
      ANT_TINES.forEach((tn) => { path(tn); ctx.stroke(); });
      stroke(0.35, 0.8);                                                                       // a highlight along the beam
      path(ANT_BEAM.map(([u, v]) => [u - 1.2, v]));
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();
  }

  /* ---------- step ---------- */

  function step(dt, t) {
    // deer: sip, lift the head, look around, sip again
    const D = deer;
    if (forceDeer) { D.state = 'look'; D.lookT0 = D.lookT0 || t; D.until = Infinity; D.target = D.d = forceDeer === 'up' ? 0 : 1; }
    D.d += (D.target - D.d) * Math.min(1, dt * 2.6);
    if (t > D.until) {
      if (D.state === 'sip') { D.state = 'rise'; D.target = 0; D.until = t + 1.3; }
      else if (D.state === 'rise') { D.state = 'look'; D.until = t + rand(3.4, 5); D.lookT0 = t; }
      else if (D.state === 'look') { D.state = 'lower'; D.target = 1; D.until = t + 1.5; }
      else { D.state = 'sip'; D.until = t + rand(3, 5.5); }
    }
    // drinking: face toward the water. Up: the face turns to look around, back at us first
    let yawTarget = 1;
    if (forceDeer === 'up') yawTarget = 0;
    else if (forceDeer === 'down') yawTarget = 1;
    else if (D.state === 'look') yawTarget = Math.sin((t - D.lookT0) * 1.0 + 1.57) * 1;
    D.yaw += (yawTarget - D.yaw) * Math.min(1, forceDeer ? 1 : dt * 2.4);
    D.ear = Math.max(0, Math.sin(t * 2.3)) ** 6;
    D.tail = Math.max(0, Math.sin(t * 0.9 + 1)) ** 10;
    if (D.d > 0.9 && t > D.nextRipple) {
      const m = muzzle(t);
      addRipple(m.x, G.yGround + 4 * k, rand(36, 64) * k, 0.4, 32);
      D.nextRipple = t + rand(0.9, 1.5);
    }

    // where the water lands: ripples at the foot of the falls, and spray
    if (t > nextRipple) {
      const f = G.landing[Math.floor(Math.random() * G.landing.length)];
      addRipple(f.cx + rand(-1.2, 1.2) * f.w, G.yGround + rand(2, Math.max(4, G.refH * 0.7)), rand(30, 90) * k, 0.3, 55);
      nextRipple = t + rand(0.1, 0.26);
    }
    if (t > nextSpray) {
      const f = G.falls[Math.floor(Math.random() * G.falls.length)];
      spray.push({ x: f.cx + rand(-0.6, 0.6) * f.w, y: f.y1 - 2, vx: rand(-30, 30), vy: -rand(20, 80), life: 1, r: rand(0.6, 1.8) });
      if (spray.length > 100) spray.shift();
      nextSpray = t + rand(0.025, 0.07);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r += ripples[i].speed * dt;
      if (ripples[i].r >= ripples[i].max) ripples.splice(i, 1);
    }
    for (let i = spray.length - 1; i >= 0; i--) {
      const p = spray[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 70 * dt;
      p.life -= dt * 0.9;
      if (p.life <= 0) spray.splice(i, 1);
    }

    dust.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -5) { p.y = H + 5; p.x = rand(0, W); }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
    });

    // butterflies: each one flutters about its own patch, drifting and turning as it goes
    clusters.forEach((c) => {
      const gx = Math.sin(t * 0.11 + c.hx) * 18 * k;
      const gy = Math.sin(t * 0.09 + c.hy) * 12 * k;
      c.members.forEach((m) => {
        const x = c.hx + gx + m.ox + Math.sin(t * m.f1 + m.p1) * 34 * k + Math.sin(t * m.f2 * 1.9 + m.p2) * 12 * k + m.kx;
        const y = c.hy + gy + m.oy + Math.sin(t * m.f2 + m.p3) * 26 * k + Math.sin(t * m.f1 * 2.3 + m.p4) * 9 * k + m.ky;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 140 * k) {
          const f = (1 - d / (140 * k)) * 110 * dt;
          m.kx += (dx / (d || 1)) * f;
          m.ky += (dy / (d || 1)) * f;
        }
        m.kx *= Math.pow(0.5, dt);
        m.ky *= Math.pow(0.5, dt);
        const vx = x - (m.px || x);
        const vy = y - (m.py || y);
        if (Math.hypot(vx, vy) > 0.02) m.h = Math.atan2(vy, vx);
        m.px = x;
        m.py = y;
        m.x = x;
        m.y = y;
      });
    });

    // small birds, fluttering in place
    birds.forEach((b) => {
      b.x = b.hx + Math.sin(t * 0.32 + b.p1) * 38 * k + Math.sin(t * 0.83 + b.p2) * 8 * k;
      b.y = b.hy + Math.sin(t * 0.27 + b.p3) * 22 * k + Math.sin(t * b.fl * 0.5) * 3;
      b.flap = 0.5 + 0.5 * Math.sin(t * b.fl + b.p1 * 3);
      b.face = Math.sin(t * 0.09 + b.p2) > 0 ? 1 : -1;
    });
  }

  /* ---------- drawing ---------- */

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04060a');
    g.addColorStop(0.55, '#080b10');
    g.addColorStop(1, '#0b0f15');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W * 0.66, H * 0.02, 0, W * 0.66, H * 0.02, Math.max(W, H) * 0.7);
    r.addColorStop(0, `rgba(${INK}, 0.07)`);
    r.addColorStop(1, `rgba(${INK}, 0)`);
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
  }

  function drawDust(t) {
    dust.forEach((p) => {
      ctx.fillStyle = `rgba(${INK}, ${0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.8 + p.ph))})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    });
  }

  function drawRays(t) {
    ctx.globalCompositeOperation = 'lighter';
    rays.forEach((r) => {
      const a = r.a * (0.7 + 0.3 * Math.sin(t * 0.3 + r.ph));
      const sway = Math.sin(t * 0.12 + r.ph) * 14;
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.9);
      g.addColorStop(0, `rgba(${INK}, 1)`);
      g.addColorStop(1, `rgba(${INK}, 0)`);
      [[1, 0.5], [1.9, 0.28], [3, 0.16]].forEach(([m, al]) => {
        ctx.globalAlpha = a * al * 2.2;
        ctx.fillStyle = g;
        const w = r.w * m;
        const cx = r.x + r.w / 2 + sway;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, 0);
        ctx.lineTo(cx + w / 2, 0);
        ctx.lineTo(cx + r.slant + w * 0.8, H * 0.9);
        ctx.lineTo(cx + r.slant - w * 0.8, H * 0.9);
        ctx.closePath();
        ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawFalls(t) {
    // a soft glow behind each fall
    ctx.globalCompositeOperation = 'lighter';
    G.falls.forEach((f) => {
      const g = ctx.createLinearGradient(f.cx - f.w * 2.2, 0, f.cx + f.w * 2.2, 0);
      g.addColorStop(0, `rgba(${INK}, 0)`);
      g.addColorStop(0.5, `rgba(${INK}, ${(f.main ? 0.07 : 0.035) * f.a + 0.012 * Math.sin(t * 0.5)})`);
      g.addColorStop(1, `rgba(${INK}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(f.cx - f.w * 2.2, f.y0, f.w * 4.4, f.y1 - f.y0);
    });
    ctx.globalCompositeOperation = 'source-over';

    // flowing, finely streaked water, shaped into the falls
    const g = fallG;
    g.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, fallC.width, fallC.height);
    g.fillStyle = pat1;
    g.setTransform(1.2, 0, 0, 1, 0, (t * 260) % 512);
    g.fillRect(0, -512, fallC.width / 1.2 + 4, fallC.height + 1024);
    g.globalAlpha = 0.6;
    g.fillStyle = pat2;
    g.setTransform(1.7, 0, 0, 1, 0, (t * 130) % 512);
    g.fillRect(0, -512, fallC.width / 1.7 + 4, fallC.height + 1024);
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(maskC, 0, 0);
    g.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    for (let y = 0; y < H; y += 10) {
      const off = Math.sin(y * 0.008 + t * 0.6) * 3;
      ctx.drawImage(fallC, 0, y, fallC.width, 10, G.xR + off, y, fallC.width, 10);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // fine drawn strands running down
    ctx.lineCap = 'round';
    strands.forEach((s) => {
      const f = s.f;
      ctx.strokeStyle = `rgba(${INK}, ${s.a * (0.8 + 0.2 * Math.sin(t * 0.7 + s.wph))})`;
      ctx.lineWidth = s.w;
      ctx.setLineDash([s.dash0, s.dash1]);
      ctx.lineDashOffset = -(t * s.speed + s.phase);
      ctx.beginPath();
      for (let y = f.y0; y <= f.y1; y += 16) {
        const u = (y - f.y0) / (f.y1 - f.y0);
        const x = f.cx + s.off * (0.72 + 0.5 * u) + Math.sin(y * 0.014 + s.wph + t * s.wsp) * s.amp;
        if (y === f.y0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function drawGround(t) {
    // the floor: a clean dark bank on the left, the water on the right
    const fg = ctx.createLinearGradient(0, G.yGround, 0, H);
    fg.addColorStop(0, '#0b0e13');
    fg.addColorStop(1, '#040507');
    ctx.fillStyle = fg;
    ctx.fillRect(0, G.yGround, W, H - G.yGround);
    ctx.strokeStyle = `rgba(${INK}, 0.16)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, G.yGround);
    ctx.lineTo(W, G.yGround);
    ctx.stroke();

    // the water glows, and mirrors the falls and the rocks
    ctx.save();
    ctx.translate((G.bank + W) / 2, G.yGround + 6);
    ctx.scale(1, 0.16);
    const R = (W - G.bank) * 0.6;
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    pg.addColorStop(0, `rgba(${INK}, 0.2)`);
    pg.addColorStop(0.6, `rgba(${INK}, 0.07)`);
    pg.addColorStop(1, `rgba(${INK}, 0)`);
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (G.refH > 8) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(G.bank, G.yGround, W - G.bank, G.refH);
      ctx.clip();
      for (let y = 0; y < G.refH; y += 3) {
        const srcY = G.yGround - y - 3;
        const off = Math.sin(y * 0.55 + t * 1.5) * 2.6 * (0.4 + y / G.refH);
        const fade = 1 - y / G.refH;
        ctx.globalAlpha = 0.34 * fade;
        ctx.drawImage(staticLayer, G.bank * dpr, srcY * dpr, (W - G.bank) * dpr, 3 * dpr, G.bank + off, G.yGround + y, W - G.bank, 3);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 * fade;
        const sx = Math.max(0, G.bank - G.xR);
        ctx.drawImage(fallC, sx, srcY, fallC.width - sx, 3, Math.max(G.bank, G.xR) + off, G.yGround + y, fallC.width - sx, 3);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'lighter';
    glints.forEach((gl) => {
      const a = Math.pow(Math.max(0, Math.sin(t * gl.sp + gl.ph)), 3) * 0.4;
      if (a < 0.02) return;
      ctx.strokeStyle = `rgba(${INK}, ${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gl.x, gl.y);
      ctx.lineTo(gl.x + gl.l, gl.y);
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
    ripples.forEach((r) => {
      const kk = r.r / r.max;
      ctx.strokeStyle = `rgba(${INK}, ${r.alpha * Math.pow(1 - kk, 1.4)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.26, 0, 0, TAU);
      ctx.stroke();
    });
  }

  // mist, foam and spray, on top of the water
  function drawMist(t) {
    ctx.globalCompositeOperation = 'lighter';
    mistBlobs.forEach((b) => {
      const a = 0.17 * b.gain * (0.6 + 0.4 * Math.sin(t * b.sp + b.ph));
      const x = b.x + Math.sin(t * 0.15 + b.ph) * 14;
      const y = b.y - Math.abs(Math.sin(t * b.sp * 0.6 + b.ph)) * 12;
      const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      g.addColorStop(0, `rgba(${INK}, ${a})`);
      g.addColorStop(1, `rgba(${INK}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, TAU);
      ctx.fill();
    });
    spray.forEach((p) => {
      ctx.fillStyle = `rgba(${INK}, ${p.life * 0.55})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function draw(t) {
    drawSky();
    drawDust(t);
    ctx.drawImage(staticLayer, 0, 0, W, H);
    drawRays(t);
    drawFalls(t);
    drawGround(t);
    drawMist(t);
    birds.forEach((b) => drawBird(ctx, b.x, b.y, b.s, b.flap, b.face, 0.62));
    drawDeer(t);
    clusters.forEach((c) => c.members.forEach((m) => {
      drawButterfly(ctx, m.x, m.y, m.size, 0.5 + 0.5 * Math.sin(t * m.flapSp + m.flapPh), m.h, 0.95);
    }));
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.85);
    vg.addColorStop(0, 'rgba(2, 3, 5, 0)');
    vg.addColorStop(1, 'rgba(2, 3, 5, 0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------- input ---------- */

  function onMove(e) { pointer.x = e.clientX; pointer.y = e.clientY; }
  function onDown(e) {
    // the butterflies scatter away from a click
    clusters.forEach((c) => c.members.forEach((m) => {
      const dx = m.x - e.clientX;
      const dy = m.y - e.clientY;
      const d = Math.hypot(dx, dy) || 1;
      const f = clamp(1 - d / (320 * k), 0, 1) * 130;
      m.kx += (dx / d) * f;
      m.ky += (dy / d) * f;
    }));
  }

  /* ---------- run ---------- */

  resize();
  window.addEventListener('resize', resize);
  step(0.016, 1);

  if (reduce) {
    return function cleanup() {
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }

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

(window.__bgThemes = window.__bgThemes || {}).waterfall = { init };
})();
