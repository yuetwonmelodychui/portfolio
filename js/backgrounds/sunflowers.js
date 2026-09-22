(function () {
// Volunteer page: a huge sunflower field in the dark. Scrolling walks you down
// into it. At the top it is packed with tiny yellow buds on their stalks (a
// tight little rosebud each); the further you scroll the more of them open into
// lush, fat-petalled sunflowers, and the flowers get bigger and closer.
// A gold shimmer drifts over the petals and stars glint in the dark.
// Generative canvas art, coded from scratch, no images.

const TAU = Math.PI * 2;
const GOLDEN = 2.399963229728653;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));

/* ---------- the flower, drawn like an illustration ----------
   Long petals drawn in to a sharp point, in three shapes (straight, or leaning
   either way), each with fine veins and a warm outline, layered in three rings
   around a centre made of individual outlined seeds. The same routine paints the
   small cached pictures (for far flowers) and the big exact-size ones (near). */

const STAGES = 16;
const BANDS = 10;   // depth bands: stalks and leaves are drawn in one batch per band
const SIZE = 256;
const REACH = 118;   // radius of a fully open flower inside the sprite

const VARIANTS = [
  { base: '#f29a12', mid: '#ffc42a', tip: '#ffe27a', line: 'rgba(196, 66, 18, 0.8)', vein: 'rgba(196, 70, 20, 0.42)', sheen: 'rgba(255, 245, 200, 0.16)' },
  { base: '#ee8410', mid: '#ffb324', tip: '#ffd96a', line: 'rgba(190, 58, 14, 0.82)', vein: 'rgba(190, 62, 16, 0.42)', sheen: 'rgba(255, 190, 170, 0.16)' },
  { base: '#f5a915', mid: '#ffd534', tip: '#fff09a', line: 'rgba(200, 78, 20, 0.78)', vein: 'rgba(200, 80, 22, 0.4)', sheen: 'rgba(170, 255, 236, 0.13)' },
];

// three rings of petals, outer to inner
const RINGS = [
  { n: 26, off: 0, len: 1.0 },
  { n: 20, off: TAU / 52, len: 0.88 },
  { n: 15, off: TAU / 30, len: 0.74 },
];

const hash = (i, j, k) => { const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };

// The outline of one petal, base at (0,0), tip up at (0,-L): widest around the middle,
// then drawn in to a sharp point. kind 0 = straight, 1 = leaning left, 2 = leaning right.
function petalOutline(g, kind, L, hw) {
  const lean = kind === 1 ? -0.28 : kind === 2 ? 0.28 : 0;
  const tx = lean * hw;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-hw * 0.95, -L * 0.1, -hw * 1.12, -L * 0.5, -hw * 0.7 + tx * 0.5, -L * 0.76);
  g.quadraticCurveTo(-hw * 0.2 + tx * 0.8, -L * 0.9, tx, -L);
  g.quadraticCurveTo(hw * 0.2 + tx * 0.8, -L * 0.9, hw * 0.7 + tx * 0.5, -L * 0.76);
  g.bezierCurveTo(hw * 1.12, -L * 0.5, hw * 0.95, -L * 0.1, 0, 0);
  g.closePath();
}

const DISC_SIZE = 560;
const DISC_R = 264;

// the centre: rings of individual oval seeds, each with its own outline
function makeDiscSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = DISC_SIZE;
  const g = c.getContext('2d');
  g.translate(DISC_SIZE / 2, DISC_SIZE / 2);

  const bg = g.createRadialGradient(0, 0, 0, 0, 0, DISC_R);
  bg.addColorStop(0, '#1a0b04');
  bg.addColorStop(0.6, '#2e1508');
  bg.addColorStop(1, '#4a2109');
  g.fillStyle = bg;
  g.beginPath();
  g.arc(0, 0, DISC_R, 0, TAU);
  g.fill();

  const N = 210;
  g.lineWidth = 2.4;
  g.strokeStyle = 'rgba(46, 16, 3, 0.9)';
  for (let i = N; i >= 1; i--) {
    const f = Math.sqrt(i / N);
    const r = DISC_R * 0.93 * f;
    const a = i * GOLDEN;
    const size = DISC_R * (0.045 + 0.055 * f);
    const shade = mix([64, 28, 8], [204, 98, 28], Math.pow(f, 1.3));
    g.fillStyle = `rgb(${shade[0]}, ${shade[1]}, ${shade[2]})`;
    g.beginPath();
    g.ellipse(Math.cos(a) * r, Math.sin(a) * r, size * 1.12, size * 0.78, a, 0, TAU);
    g.fill();
    g.stroke();
  }

  // the small golden, speckled heart
  g.fillStyle = 'rgba(214, 168, 70, 0.7)';
  g.beginPath();
  g.arc(0, 0, DISC_R * 0.13, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(50, 20, 5, 0.85)';
  for (let i = 0; i < 24; i++) {
    const a = hash(i, 5, 1) * TAU;
    const r = DISC_R * 0.11 * Math.sqrt(hash(i, 5, 2));
    g.beginPath();
    g.arc(Math.cos(a) * r, Math.sin(a) * r, DISC_R * 0.012, 0, TAU);
    g.fill();
  }
  g.strokeStyle = 'rgba(214, 100, 32, 0.7)';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(0, 0, DISC_R - 2, 0, TAU);
  g.stroke();
  return c;
}

// one gradient per petal length is enough, and it can be reused
const gradCache = new WeakMap();
function petalGrad(g, v, vi, L) {
  let m = gradCache.get(g);
  if (!m) { m = new Map(); gradCache.set(g, m); }
  const key = vi * 10000 + L;
  let gr = m.get(key);
  if (!gr) {
    gr = g.createLinearGradient(0, 0, 0, -L);
    gr.addColorStop(0, v.base);
    gr.addColorStop(0.42, v.mid);
    gr.addColorStop(1, v.tip);
    m.set(key, gr);
  }
  return gr;
}

// A petal drawn as a true vector shape at the size it will appear: sharp, clean edges.
function drawPetal(g, vi, kind, L, hw) {
  const v = VARIANTS[vi];
  petalOutline(g, kind, L, hw);
  g.fillStyle = petalGrad(g, v, vi, Math.max(3, Math.round(L / 3) * 3));
  g.fill();
  g.strokeStyle = v.line;
  g.lineWidth = 1.5;
  g.lineJoin = 'miter';
  g.miterLimit = 10;
  g.stroke();
  // three fine veins
  g.strokeStyle = v.vein;
  g.lineWidth = 0.8;
  g.lineCap = 'round';
  const lean = kind === 1 ? -hw * 0.28 : kind === 2 ? hw * 0.28 : 0;
  g.beginPath();
  for (let q = -1; q <= 1; q++) {
    g.moveTo(q * hw * 0.12, -L * 0.06);
    g.quadraticCurveTo(q * hw * 0.5, -L * 0.5, q * hw * 0.06 + lean * 0.9, -L * 0.86);
  }
  g.stroke();
}

let DISCS = null;
function discFor(px) {
  if (!DISCS) {
    const big = makeDiscSprite();
    const mid = shrink(big, 280);
    DISCS = { big, mid, small: shrink(mid, 140) };
  }
  return px > 300 ? DISCS.big : px > 150 ? DISCS.mid : DISCS.small;
}

// Paint one flower at bloom `b` (0 = tight bud, 1 = fully open), centred at the
// origin of `g`, where a fully open flower reaches REACH units. ppu = device pixels
// per unit, so the seed centre can pick a sharp enough picture.
function paintFlower(g, b, vi, ppu) {
  g.imageSmoothingQuality = 'high';
  const open = smooth(0.1, 0.92, b);
  const discR = REACH * 0.34 * smooth(0.2, 0.85, b);
  const base = lerp(REACH * 0.03, discR * 0.86, open);
  const outerLen = REACH - base;
  const ga = g.globalAlpha;

  // green sepals cup a young bud, then tuck away as it opens
  const sep = 1 - smooth(0.04, 0.42, b);
  if (sep > 0.02) {
    g.globalAlpha = ga * sep;
    g.fillStyle = '#2f7a34';
    for (let i = 0; i < 9; i++) {
      g.save();
      g.rotate((i / 9) * TAU + 0.2);
      g.beginPath();
      g.moveTo(0, -REACH * 0.05);
      g.quadraticCurveTo(REACH * 0.11, -REACH * 0.2, 0, -REACH * 0.42);
      g.quadraticCurveTo(-REACH * 0.11, -REACH * 0.2, 0, -REACH * 0.05);
      g.fill();
      g.restore();
    }
    g.globalAlpha = ga;
  }

  RINGS.forEach((ring, ri) => {
    const closedLen = REACH * (0.27 - ri * 0.045);
    const ringLen = lerp(closedLen, outerLen * ring.len, Math.pow(open, 0.85));
    const twist = (1 - open) * (ri + 1) * 0.32;              // the bud swirls like a rose
    const b0 = lerp(REACH * 0.02, base, open);
    for (let i = 0; i < ring.n; i++) {
      // every petal a little different, so it reads as drawn rather than stamped
      const L = ringLen * lerp(0.88, 1.06, hash(i, ri, 1));
      const hw = L * lerp(0.5, 0.33, open) * lerp(0.94, 1.08, hash(i, ri, 2));
      const a = (i / ring.n) * TAU + ring.off + twist + (hash(i, ri, 3) - 0.5) * 0.16 * open;
      const h4 = hash(i, ri, 4);
      const kind = h4 < 0.5 ? 0 : h4 < 0.75 ? 1 : 2;
      g.save();
      g.rotate(a);
      g.translate(0, -b0);
      drawPetal(g, vi, kind, L, hw);
      g.restore();
    }
  });

  // the rose-like swirl at the heart of a young bud
  const swirl = 1 - open;
  if (swirl > 0.05) {
    g.strokeStyle = `rgba(165, 80, 0, ${0.4 * swirl})`;
    g.lineWidth = 1.2;
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      for (let u = 0; u < 4.2; u += 0.15) {
        const r = REACH * 0.05 * u * (0.7 + k * 0.25);
        const a = u * 1.6 + k * 2.4;
        if (u === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.stroke();
    }
  }

  if (discR > 3) {
    const disc = discFor(discR * 2 * ppu);
    const ds = (discR * 2 * DISC_SIZE) / (DISC_R * 2);
    g.drawImage(disc, -ds / 2, -ds / 2, ds, ds);
  }

}

// sprites are painted at twice the size and shrunk once, so their edges stay clean
function makeSprite(b, vi) {
  const hi = document.createElement('canvas');
  hi.width = hi.height = SIZE * 2;
  const g = hi.getContext('2d');
  g.translate(SIZE, SIZE);
  g.scale(2, 2);
  paintFlower(g, b, vi, 2);
  const c = shrink(hi, SIZE);
  const cg = c.getContext('2d');

  // a soft diagonal sheen with a slight hue tint, only where the flower is
  cg.translate(SIZE / 2, SIZE / 2);
  cg.globalCompositeOperation = 'source-atop';
  const sh = cg.createLinearGradient(-REACH, -REACH, REACH, REACH);
  sh.addColorStop(0.15, 'rgba(255,255,255,0)');
  sh.addColorStop(0.42, VARIANTS[vi].sheen);
  sh.addColorStop(0.7, 'rgba(255,255,255,0)');
  cg.fillStyle = sh;
  cg.fillRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE);
  return c;
}

function shrink(src, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, size, size);
  return c;
}

// each sprite in three sizes, so tiny far flowers are not squashed down from 256px
function buildSprites() {
  return VARIANTS.map((v, vi) => Array.from({ length: STAGES }, (_, j) => {
    const big = makeSprite(j / (STAGES - 1), vi);
    const mid = shrink(big, 128);
    return { big, mid, small: shrink(mid, 64) };
  }));
}

/* ---------- the field ---------- */

function init(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const sprites = buildSprites();
  let W = 0;
  let H = 0;
  let dpr = 1;
  let worldH = 0;
  let flowers = [];
  let bands = [];
  const visible = [];
  let stars = [];
  let target = 0;
  let pS = 0;
  const pointer = { x: -9999, y: -9999, on: false };

  // Preview hook: ?bloom=0.5 pins the field at that point of the scroll (0 to 1).
  const forced = new URLSearchParams(window.location.search).get('bloom');
  const scrollProgress = () => {
    if (forced !== null && forced !== '') return clamp(parseFloat(forced) || 0, 0, 1);
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return clamp(window.scrollY / max, 0, 1);
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildField();
    if (reduce) draw(0);
  }

  function buildField() {
    flowers = [];
    const k = clamp(W / 1280, 0.62, 1);
    const rFar = 17 * k;
    const rNear = 155 * k;
    worldH = H * 4.2;
    const cols = [
      { stem: [15, 42, 28], leaf: [20, 62, 34] },   // far: swallowed by the dark
      { stem: [40, 118, 54], leaf: [52, 142, 62] }, // near: bright and lush
    ];
    bands = Array.from({ length: BANDS }, (_, b) => {
      const dd = Math.pow((b + 0.5) / BANDS, 0.8);
      return {
        stem: `rgb(${mix(cols[0].stem, cols[1].stem, dd).join(',')})`,
        leaf: `rgb(${mix(cols[0].leaf, cols[1].leaf, dd).join(',')})`,
      };
    });
    let y = H * 0.05;
    let row = 0;
    while (y < worldH + 200) {
      const d = clamp(y / worldH, 0, 1);
      const r = lerp(rFar, rNear, Math.pow(d, 1.55));
      const spacing = r * 2.25;
      const off = (row % 2) * spacing * 0.5 + rand(-0.15, 0.15) * spacing;
      for (let x = -spacing + off; x < W + spacing; x += spacing * rand(0.85, 1.15)) {
        const rr = r * rand(0.85, 1.15);
        const len = Math.max(rr * 5.5, 150);
        flowers.push({
          x, y: y + rand(-0.35, 0.35) * r, r: rr, d,
          v: Math.floor(Math.random() * VARIANTS.length),
          rot: rand(0, TAU), phase: rand(0, TAU),
          jitter: rand(-0.05, 0.06),
          lean: rand(-0.16, 0.16),
          stemLen: len,
          stemW: clamp(rr * 0.1, 1.1, 20),
          band: Math.min(BANDS - 1, Math.floor(d * BANDS)),
          leaves: rr > 9 ? (rr > 40 ? 3 : 2) : 0,
          leafScale: lerp(0.8, 1.05, d),
          side: Math.random() < 0.5 ? 1 : -1,
        });
      }
      y += r * 1.25;
      row++;
    }
    flowers.sort((a, b) => a.y - b.y);

    const n = coarse ? 14 : 28;
    stars = Array.from({ length: n }, () => ({
      x: rand(0, W), y: rand(0, H), s: rand(2, 6.5), ph: rand(0, TAU), sp: rand(0.6, 1.6),
      dx: rand(-2.5, 2.5), dy: rand(-1.5, 1.5),
    }));
  }

  /* ---------- drawing helpers ---------- */

  function star(x, y, s, alpha, tint) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y);
    ctx.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s);
    ctx.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y);
    ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawField(t, camY) {
    const px = pointer.x;
    const py = pointer.y;

    // which flowers are on screen, and where their heads are right now
    visible.length = 0;
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];
      const sy = f.y - camY * (0.85 + 0.3 * f.d);
      if (sy - f.r * 1.5 > H || sy + f.stemLen < -10) continue;
      const sway = Math.sin(t * 0.6 + f.phase);
      let hx = f.x + sway * f.r * 0.05;
      let hy = sy;
      // heads lean a touch toward the cursor, like they follow the sun
      if (pointer.on) {
        const dx = px - hx;
        const dy = py - hy;
        const dist = Math.hypot(dx, dy);
        if (dist < 520) {
          const fall = ((1 - dist / 520) * f.r * 0.08) / (dist || 1);
          hx += dx * fall;
          hy += dy * fall;
        }
      }
      f.sy = sy; f.sway = sway; f.hx = hx; f.hy = hy;
      f.cx = f.x + f.lean * f.stemLen * 0.2 + sway * f.r * 0.12;
      f.cy = sy + f.stemLen * 0.5;
      f.bx = f.x + f.lean * f.stemLen;
      f.by = sy + f.stemLen;
      visible.push(f);
    }

    // back to front, one depth band at a time
    hiBudget = 3;
    let i = 0;
    while (i < visible.length) {
      const band = visible[i].band;
      let j = i;
      while (j < visible.length && visible[j].band === band) j++;
      drawBand(i, j, bands[band], t);
      i = j;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Pictures of big flowers painted at exactly the pixel size they show, kept for reuse.
  // A few are painted per frame at most; the rest wait their turn.
  const hiCache = new Map();
  let hiBytes = 0;
  let hiBudget = 0;
  function hiSprite(vi, stage, C) {
    const key = vi * 1e7 + stage * 1e4 + C;
    let c = hiCache.get(key);
    if (c) {                                   // keep the most recently used at the end
      hiCache.delete(key);
      hiCache.set(key, c);
      return c;
    }
    if (hiBudget <= 0) return null;
    hiBudget--;
    c = document.createElement('canvas');
    c.width = c.height = C;
    const g = c.getContext('2d');
    const ppu = C / 256;
    g.translate(C / 2, C / 2);
    g.scale(ppu, ppu);
    paintFlower(g, stage / (STAGES - 1), vi, ppu);
    g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(-REACH, -REACH, REACH, REACH);
    sh.addColorStop(0.15, 'rgba(255,255,255,0)');
    sh.addColorStop(0.42, VARIANTS[vi].sheen);
    sh.addColorStop(0.7, 'rgba(255,255,255,0)');
    g.fillStyle = sh;
    g.fillRect(-128, -128, 256, 256);
    hiCache.set(key, c);
    hiBytes += C * C * 4;
    while (hiBytes > 140e6 && hiCache.size > 1) {     // drop the least recently used
      const [k0, c0] = hiCache.entries().next().value;
      hiCache.delete(k0);
      hiBytes -= c0.width * c0.height * 4;
    }
    return c;
  }

  function drawBand(i0, i1, col, t) {
    // stalks: one path, one stroke
    let wsum = 0;
    ctx.strokeStyle = col.stem;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = i0; i < i1; i++) {
      const f = visible[i];
      ctx.moveTo(f.hx, f.hy + f.r * 0.15);
      ctx.quadraticCurveTo(f.cx, f.cy, f.bx, f.by);
      wsum += f.stemW;
    }
    ctx.lineWidth = wsum / (i1 - i0);
    ctx.stroke();

    // leaves: one path, one fill
    let veins = false;
    ctx.fillStyle = col.leaf;
    ctx.beginPath();
    for (let i = i0; i < i1; i++) {
      const f = visible[i];
      for (let l = 0; l < f.leaves; l++) {
        const u = 0.28 + l * 0.22;
        const v = 1 - u;
        const ox = v * v * f.hx + 2 * v * u * f.cx + u * u * f.bx;
        const oy = v * v * (f.hy + f.r * 0.15) + 2 * v * u * f.cy + u * u * f.by;
        const side = l % 2 === 0 ? f.side : -f.side;
        const ang = side * (0.95 + 0.1 * Math.sin(t * 0.7 + f.phase + l));
        const len = f.r * (1.05 - l * 0.08) * f.leafScale;
        const wid = f.r * 0.42 * f.leafScale;
        const dx = Math.sin(ang);
        const dy = -Math.cos(ang);
        const sx = Math.cos(ang);
        const sy = Math.sin(ang);
        const c1x = ox + sx * wid * 0.95 + dx * len * 0.25;
        const c1y = oy + sy * wid * 0.95 + dy * len * 0.25;
        const c2x = ox + sx * wid * 0.8 + dx * len * 0.75;
        const c2y = oy + sy * wid * 0.8 + dy * len * 0.75;
        const d1x = ox - sx * wid * 0.95 + dx * len * 0.25;
        const d1y = oy - sy * wid * 0.95 + dy * len * 0.25;
        const d2x = ox - sx * wid * 0.8 + dx * len * 0.75;
        const d2y = oy - sy * wid * 0.8 + dy * len * 0.75;
        const tx = ox + dx * len;
        const ty = oy + dy * len;
        ctx.moveTo(ox, oy);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty);
        ctx.bezierCurveTo(d2x, d2y, d1x, d1y, ox, oy);
        if (f.r > 40) veins = true;
      }
    }
    ctx.fill();
    if (veins) {
      ctx.strokeStyle = 'rgba(210, 255, 200, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = i0; i < i1; i++) {
        const f = visible[i];
        if (f.r <= 40) continue;
        for (let l = 0; l < f.leaves; l++) {
          const u = 0.28 + l * 0.22;
          const v = 1 - u;
          const ox = v * v * f.hx + 2 * v * u * f.cx + u * u * f.bx;
          const oy = v * v * (f.hy + f.r * 0.15) + 2 * v * u * f.cy + u * u * f.by;
          const side = l % 2 === 0 ? f.side : -f.side;
          const ang = side * (0.95 + 0.1 * Math.sin(t * 0.7 + f.phase + l));
          const len = f.r * (1.05 - l * 0.08) * f.leafScale;
          ctx.moveTo(ox + Math.sin(ang) * len * 0.05, oy - Math.cos(ang) * len * 0.05);
          ctx.lineTo(ox + Math.sin(ang) * len * 0.92, oy - Math.cos(ang) * len * 0.92);
        }
      }
      ctx.stroke();
    }

    // the flowers themselves
    for (let i = i0; i < i1; i++) {
      const f = visible[i];
      // bloom depends on how far down the field we are, staggered by depth
      const b = smooth(f.d * 0.75 + f.jitter, f.d * 0.75 + f.jitter + 0.45, pS * 1.15);
      const stage = b * (STAGES - 1);
      const j0 = Math.floor(stage);
      const j1 = Math.min(STAGES - 1, j0 + 1);
      const fr = stage - j0;
      const size = SIZE * (f.r / REACH);
      const alpha = 0.42 + 0.5 * Math.pow(f.d, 0.6);
      const ang = f.rot + f.sway * 0.05;
      const co = Math.cos(ang) * dpr;
      const si = Math.sin(ang) * dpr;
      let done = false;
      if (size * dpr > 170) {
        // big flowers: a picture painted at exactly the size it shows, so nothing is stretched
        const C = clamp(Math.ceil((size * dpr) / 48) * 48, 192, 960);
        const needB = fr > 0.01 && j1 !== j0;
        const a0 = hiSprite(f.v, j0, C);
        const a1 = needB ? hiSprite(f.v, j1, C) : null;
        if (a0 && (!needB || a1)) {
          ctx.setTransform(co, si, -si, co, f.hx * dpr, f.hy * dpr);
          ctx.globalAlpha = alpha;
          ctx.drawImage(a0, -size / 2, -size / 2, size, size);
          if (a1) {
            ctx.globalAlpha = alpha * fr;
            ctx.drawImage(a1, -size / 2, -size / 2, size, size);
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.globalAlpha = 1;
          done = true;
        }
      }
      if (!done) {
        // small flowers (and the odd big one still being painted): the cached pictures
        const dev = size * dpr;
        const which = dev >= 120 ? 'big' : dev >= 60 ? 'mid' : 'small';
        ctx.setTransform(co, si, -si, co, f.hx * dpr, f.hy * dpr);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprites[f.v][j0][which], -size / 2, -size / 2, size, size);
        if (fr > 0.01 && j1 !== j0) {
          ctx.globalAlpha = alpha * fr;
          ctx.drawImage(sprites[f.v][j1][which], -size / 2, -size / 2, size, size);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = 1;
      }

      // shimmer: a breathing gold glow and a glint that travels round the petals
      if (f.r > 26 && b > 0.35) {
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + f.phase * 2);
        const gr = ctx.createRadialGradient(f.hx, f.hy, f.r * 0.1, f.hx, f.hy, f.r * 1.1);
        gr.addColorStop(0, `rgba(255, 200, 90, ${(0.05 + 0.07 * pulse) * b})`);
        gr.addColorStop(1, 'rgba(255, 200, 90, 0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(f.hx, f.hy, f.r * 1.1, 0, TAU);
        ctx.fill();
        const glint = Math.pow(Math.max(0, Math.sin(t * 1.9 + f.phase * 3)), 8);
        if (glint > 0.05 && b > 0.6) {
          const a = f.phase + t * 0.25;
          star(f.hx + Math.cos(a) * f.r * 0.68, f.hy + Math.sin(a) * f.r * 0.68, f.r * 0.17, glint * 0.9, '#fff4c8');
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  function draw(t) {
    // the dark, with a warm glow that grows as the field blooms
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#03070a');
    bg.addColorStop(0.6, '#040a09');
    bg.addColorStop(1, '#050d08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.05, 0, W * 0.5, H * 0.05, Math.max(W, H) * 0.75);
    glow.addColorStop(0, `rgba(255, 190, 70, ${0.05 + 0.12 * pS})`);
    glow.addColorStop(1, 'rgba(255, 190, 70, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const camY = pS * (worldH - H);
    drawField(t, camY);

    // stars glinting in the dark
    ctx.globalCompositeOperation = 'lighter';
    stars.forEach((s) => {
      const tw = Math.pow(0.5 + 0.5 * Math.sin(t * s.sp + s.ph), 3);
      const x = ((s.x + s.dx * t) % W + W) % W;
      const y = ((s.y + s.dy * t) % H + H) % H;
      star(x, y, s.s * (0.6 + 0.6 * tw), 0.15 + 0.7 * tw, '#ffffff');
    });
    ctx.globalCompositeOperation = 'source-over';

    // vignette keeps the edges deep
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(2, 5, 6, 0)');
    vg.addColorStop(1, 'rgba(2, 5, 6, 0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------- run ---------- */

  function onScroll() {
    target = scrollProgress();
    if (reduce) { pS = target; draw(0); }
  }
  function onMove(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.on = true;
  }
  function onLeave() { pointer.on = false; }

  target = pS = scrollProgress();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });

  if (reduce) {
    return function cleanup() {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      canvas.remove();
    };
  }

  let raf = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    pS += (target - pS) * Math.min(1, dt * 6);   // ease the bloom so it never jerks
    draw(now / 1000);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  return function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    canvas.remove();
  };
}

(window.__bgThemes = window.__bgThemes || {}).sunflowers = { init };
})();
