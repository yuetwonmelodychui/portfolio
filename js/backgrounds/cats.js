(function () {
// Peeking cats, drawn by Melody (img/catswatches.jpeg) and traced into vector
// data in cats-art.js. Up to three show up at once, often, from any edge or corner.
//   - Near the top of the page they peek in from the edges of the screen.
//   - Further down (over the photos and text) they come from the corners, or
//     from edges close to a corner, so they stay out of the way.
// Each cat slides in from whichever side(s) of its card the drawing runs off,
// is randomly mirrored and turned by a quarter turn (so any drawing can come in
// from any edge, at any angle), follows the cursor with its eyes and blinks.
// Registers on window.__bgThemes.cats.

const FILL = '#0a0b10';
const LIGHT = '#eef0f6';
const TOP_BAR = 60;     // fixed nav height
const BOTTOM_BAR = 46;  // fixed footer height

function loadArt() {
  return new Promise((resolve) => {
    if (window.__catArt) { resolve(window.__catArt); return; }
    const s = document.createElement('script');
    s.src = './js/backgrounds/cats-art.js';
    s.onload = () => resolve(window.__catArt || []);
    s.onerror = () => resolve([]);
    document.body.appendChild(s);
  });
}

// Which viewport sides a cat comes from, after mirroring and quarter turns.
const TURN = { t: 'r', r: 'b', b: 'l', l: 't' };   // one clockwise quarter turn
function sidesOf(art, flip, rot) {
  let s = new Set(art.s.split('').filter(Boolean));
  if (s.has('t') && s.has('b')) { s.delete('t'); s.delete('b'); }
  if (s.has('l') && s.has('r')) { s.delete('l'); s.delete('r'); }
  if (flip) {
    const l = s.has('l');
    const r = s.has('r');
    s.delete('l'); s.delete('r');
    if (l) s.add('r');
    if (r) s.add('l');
  }
  for (let q = 0; q < (rot || 0) / 90; q++) {
    const n = new Set();
    s.forEach((x) => n.add(TURN[x]));
    s = n;
  }
  return s;
}

let uid = 0;

function catSVG(art, flip, k) {
  const id = `cc${++uid}`;
  const solid = art.k === 's';
  const sw = solid ? 2.8 : 4.2;
  let eyes = '';
  art.y.forEach((e) => {
    const [cx, cy, rx, ry, rot, ring] = e;
    if (solid) {
      // light almond with a dark slit that can slide across it
      const prx = Math.max(0.9, rx * 0.15);
      const pry = ry * 0.88;
      const mx = Math.max(0.5, rx - prx) * 0.85;
      const my = Math.max(0.3, ry - pry) * 0.4 + ry * 0.08;
      eyes += `<g transform="rotate(${rot} ${cx} ${cy})"><g class="cat-eyes">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${LIGHT}"/>
        <ellipse class="pupil" data-solid="1" data-rot="${rot}" data-mx="${mx.toFixed(2)}" data-my="${my.toFixed(2)}" cx="${cx}" cy="${cy}" rx="${prx.toFixed(2)}" ry="${pry.toFixed(2)}" fill="${FILL}"/>
      </g></g>`;
    } else {
      // ring with a dot that wanders inside it, as drawn
      eyes += `<g class="cat-eyes">
        <circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="${LIGHT}" stroke-width="2"/>
        <circle class="pupil" data-mx="${(ring * 0.34).toFixed(2)}" data-my="${(ring * 0.34).toFixed(2)}" cx="${cx}" cy="${cy}" r="${(ring * 0.42).toFixed(2)}" fill="${LIGHT}"/>
      </g>`;
    }
  });
  const mirror = flip ? ` transform="translate(${art.w} 0) scale(-1 1)"` : '';
  return `<svg viewBox="0 0 ${art.w} ${art.h}" width="${(art.w * k).toFixed(1)}" height="${(art.h * k).toFixed(1)}" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="${id}"><path d="${art.d}"/></clipPath></defs>
    <g${mirror}>
      <path d="${art.d}" fill="${FILL}"/>
      <path d="${art.e}" fill="none" stroke="${LIGHT}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#${id})" opacity="0.92"/>
      ${eyes}
    </g>
  </svg>`;
}

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const k = window.innerWidth < 640 ? 0.78 : 1.15;

  const layer = document.createElement('div');
  layer.className = 'cat-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const rand = (a, b) => a + Math.random() * (b - a);
  let running = true;
  let lastMove = 0;
  let ART = [];
  // Preview hooks: ?cat=r1c5 shows only that drawing, &cathold keeps cats on screen.
  const query = new URLSearchParams(window.location.search);
  const onlyId = query.get('cat');
  const holdForever = query.has('cathold');
  const maxOut = window.innerWidth < 640 ? 2 : 3;   // how many can show at once
  const out = [];       // cats currently showing
  const recent = [];    // last few drawings used, to avoid repeats

  /* ---------- placing ---------- */

  function place(el, sides, w, h) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const hero = window.scrollY < H * 0.6;
    const vert = sides.has('t') ? 't' : sides.has('b') ? 'b' : null;
    const hor = sides.has('l') ? 'l' : sides.has('r') ? 'r' : null;
    const st = el.style;
    st.left = st.right = st.top = st.bottom = '';

    if (vert && hor) {                       // a corner cat: sits in the corner
      st[hor === 'l' ? 'left' : 'right'] = '0';
      st[vert === 't' ? 'top' : 'bottom'] = `${vert === 't' ? TOP_BAR : BOTTOM_BAR}px`;
    } else if (vert) {                       // along the top or bottom edge
      const free = Math.max(0, W - w);
      let x;
      if (hero) x = rand(0.1, 0.9) * free;
      else x = Math.random() < 0.5 ? rand(0.02, 0.12) * W : free - rand(0.02, 0.12) * W;
      st.left = `${clamp(x, 0, free)}px`;
      st[vert === 't' ? 'top' : 'bottom'] = `${vert === 't' ? TOP_BAR : BOTTOM_BAR}px`;
    } else if (hor) {                        // along the left or right edge
      const free = Math.max(0, H - TOP_BAR - BOTTOM_BAR - h);
      let y;
      if (hero) y = rand(0.1, 0.9) * free;
      else y = Math.random() < 0.5 ? rand(0.02, 0.14) * free : free - rand(0.02, 0.14) * free;
      st[hor === 'l' ? 'left' : 'right'] = '0';
      st.top = `${TOP_BAR + clamp(y, 0, free)}px`;
    }
  }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ---------- eyes ---------- */

  // (wx, wy) = direction in the page, mag 0..1
  function look(cat, wx, wy, mag) {
    const q = (-cat.rot * Math.PI) / 180;
    const cx = wx * Math.cos(q) - wy * Math.sin(q);
    wy = wx * Math.sin(q) + wy * Math.cos(q);
    const vx = cat.flip ? -cx : cx;
    cat.pupils.forEach((p) => {
      let lx = vx;
      let ly = wy;
      if (p.solid) {
        const r = (-p.rot * Math.PI) / 180;
        lx = vx * Math.cos(r) - wy * Math.sin(r);
        ly = vx * Math.sin(r) + wy * Math.cos(r);
      }
      p.el.style.transform = `translate(${(lx * p.mx * mag).toFixed(2)}px, ${(ly * p.my * mag).toFixed(2)}px)`;
    });
  }

  function lookAt(cat, px, py) {
    const r = cat.el.getBoundingClientRect();
    const dx = px - (r.left + r.right) / 2;
    const dy = py - (r.top + r.bottom) / 2;
    const d = Math.hypot(dx, dy) || 1;
    look(cat, dx / d, dy / d, Math.min(1, d / 260));
  }

  /* ---------- show / hide ---------- */

  function hide(cat) {
    if (!cat.showing) return;
    cat.showing = false;
    clearTimeout(cat.hideId);
    cat.body.style.transform = cat.hidden;
    const i = out.indexOf(cat);
    if (i > -1) out.splice(i, 1);
    later(() => cat.el.remove(), 1400);
  }

  // Build one cat: pick a drawing, maybe mirror it, pin it to an edge/corner.
  function build() {
    let art;
    for (let n = 0; n < 8; n++) {
      art = ART[Math.floor(Math.random() * ART.length)];
      if (!recent.includes(art.id)) break;
    }
    const flip = Math.random() < 0.5;
    const rot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    const sides = sidesOf(art, flip, rot);
    const w = art.w * k;
    const h = art.h * k;
    const sideways = rot % 180 !== 0;
    const ow = sideways ? h : w;    // size of the clipping window after the turn
    const oh = sideways ? w : h;

    const hx = sides.has('l') ? -1 : sides.has('r') ? 1 : 0;
    const hy = sides.has('t') ? -1 : sides.has('b') ? 1 : 0;
    const rise = rand(0.8, 1);
    const hidden = `translate(${hx * 104}%, ${hy * 104}%)`;
    const shown = `translate(${(hx * (1 - rise) * 100).toFixed(1)}%, ${(hy * (1 - rise) * 100).toFixed(1)}%)`;

    const el = document.createElement('div');
    el.className = 'cat';
    el.style.width = `${ow}px`;
    el.style.height = `${oh}px`;
    const body = document.createElement('div');
    body.className = 'cat-body';
    body.style.transform = hidden;   // start off-screen, so it never flashes into view
    const spin = document.createElement('div');
    spin.className = 'cat-spin';
    spin.style.width = `${w}px`;
    spin.style.height = `${h}px`;
    spin.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
    spin.innerHTML = catSVG(art, flip, k);
    body.appendChild(spin);
    el.appendChild(body);
    layer.appendChild(el);
    place(el, sides, ow, oh);

    return {
      art, el, body, flip, rot, hidden, shown,
      pupils: Array.from(body.querySelectorAll('.pupil')).map((p) => ({
        el: p,
        solid: p.dataset.solid === '1',
        rot: Number(p.dataset.rot || 0),
        mx: Number(p.dataset.mx),
        my: Number(p.dataset.my),
      })),
      showing: true,
      hideId: 0,
    };
  }

  function overlaps(cat) {
    const r = cat.el.getBoundingClientRect();
    return out.some((o) => {
      const q = o.el.getBoundingClientRect();
      return Math.hypot((r.left + r.right) / 2 - (q.left + q.right) / 2, (r.top + r.bottom) / 2 - (q.top + q.bottom) / 2) < 300;
    });
  }

  function spawn() {
    if (!ART.length || out.length >= maxOut) return;

    // try a few times so two cats never pile up in the same spot
    let cat = build();
    for (let n = 0; n < 6 && overlaps(cat) && ART.length > 1; n++) {
      cat.el.remove();
      cat = build();
    }
    if (overlaps(cat)) { cat.el.remove(); return; }

    recent.push(cat.art.id);
    if (recent.length > 6) recent.shift();

    Array.from(cat.body.querySelectorAll('.cat-eyes')).forEach((g) => {
      g.style.setProperty('--blink', `${rand(3.6, 7).toFixed(2)}s`);
      g.style.setProperty('--bd', `${(-rand(0, 5)).toFixed(2)}s`);
    });
    lookAt(cat, window.innerWidth / 2, window.innerHeight / 2);

    out.push(cat);
    void cat.body.offsetWidth;   // commit the off-screen position first, then slide in
    later(() => { cat.body.style.transform = cat.shown; }, 40);
    if (!holdForever) cat.hideId = later(() => hide(cat), rand(2600, 4600));
    return cat;
  }

  /* ---------- rhythm: rare, one or two at a time ---------- */

  function loop() {
    if (!running) return;
    if (Math.random() < 0.88) spawn();
    later(loop, rand(1600, 3800));
  }

  function glance() {
    if (!running) return;
    if (performance.now() - lastMove > 2400) {
      out.forEach((c) => {
        if (Math.random() > 0.7) return;
        const a = rand(0, Math.PI * 2);
        look(c, Math.cos(a), Math.sin(a), rand(0.35, 1));
      });
    }
    later(glance, rand(1500, 3200));
  }

  let mx = 0;
  let my = 0;
  let queued = false;
  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    lastMove = performance.now();
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      out.slice().forEach((c) => {
        const r = c.el.getBoundingClientRect();
        const dist = Math.hypot(mx - (r.left + r.right) / 2, my - (r.top + r.bottom) / 2);
        if (dist < 90) hide(c);
        else lookAt(c, mx, my);
      });
    });
  }

  /* ---------- go ---------- */

  loadArt().then((art) => {
    if (!running) return;
    ART = art.filter((a) => sidesOf(a, false, 0).size > 0 && (!onlyId || a.id === onlyId));
    if (!ART.length) return;

    if (reduce) { spawn(); return; }
    later(spawn, 600);
    later(spawn, 1500);
    later(spawn, 2700);
    later(loop, 4000);
    later(glance, 3000);
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });
  });

  return function cleanup() {
    running = false;
    timers.forEach(clearTimeout);
    window.removeEventListener('pointermove', onMove);
    layer.remove();
  };
}

(window.__bgThemes = window.__bgThemes || {}).cats = { init };
})();
