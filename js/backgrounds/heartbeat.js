(function () {
// Awards page: a heartbeat line running across a black screen, and behind it a
// field of thin vertical lines that keep generating like a voice recording.
//  - the heartbeat is a scrolling trace: a fresh beat (P wave, sharp QRS spike, T wave)
//    is drawn at the glowing head and scrolls off to the left, fading as it goes
//  - the recording lines are made by a little synthetic "voice": words of loud and soft
//    syllables with pauses in between, drawn as thin mirrored lines that scroll with the trace
//  - a click makes the heart give one extra strong beat (and a burst of voice)
// Canvas, coded from scratch, monochrome.

const INK = '236, 241, 250';
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const gauss = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2);

// One heartbeat, p = 0..1 through the beat (about 1 = the full height of a normal R spike).
// Every beat gets its own shape, so no two are quite the same.
function ecg(p, b) {
  return (
    b.pA * gauss(p, b.pPos, b.pW) -           // P wave
    b.qA * gauss(p, b.rPos - 0.03, 0.01) +    // Q dip
    b.rH * gauss(p, b.rPos, b.rW) -           // R spike
    b.sA * gauss(p, b.rPos + 0.03, b.rW + 0.002) + // S dip
    b.tA * gauss(p, b.tPos, b.tW)             // T wave
  );
}

function init(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const DX = 1.5;        // spacing of heartbeat samples, px
  const BDX = 7;         // spacing of recording lines, px
  let W = 0;
  let H = 0;
  let dpr = 1;
  let cy = 0;            // baseline of both the heartbeat and the recording
  let headX = 0;         // where new data appears
  let speed = 150;       // px / second
  let amp = 150;         // height of a beat
  let barMax = 150;      // tallest recording line (half height)

  // heartbeat generator
  let ys = [];
  let sIdx = 0;
  let beatT = 0;
  let beat = null;
  let rate = 1;          // wanders slowly, so the pace of the heart drifts
  let sinceOdd = 0;
  let wantBeat = false;
  // voice generator
  let bars = [];
  let bIdx = 0;
  let mode = 'pause';
  let modeT = 0.4;
  let syllT = 0;
  let target = 0;
  let env = 0;
  let wordGain = 1;
  let burst = 0;
  let D = 0;             // distance scrolled so far
  // hover lens: the part of the line under the pointer swells (taller and stretched wider)
  const pointer = { x: -9999, y: -9999 };
  const lens = { x: 0, s: 0 };
  let lensR = 150;

  function nextBeat(strong) {
    beatT = 0;
    rate = clamp(rate + rand(-0.09, 0.09), 0.62, 1.3);
    sinceOdd++;
    const odd = !strong && sinceOdd > 3 && Math.random() < 0.16;
    if (odd) sinceOdd = 0;
    beat = {
      len: rate * rand(0.86, 1.14),
      pPos: rand(0.12, 0.16), pW: rand(0.028, 0.045), pA: rand(0.05, 0.17),
      rPos: rand(0.3, 0.33), rW: rand(0.008, 0.014), rH: rand(0.62, 1.15),
      qA: rand(0.04, 0.22), sA: rand(0.1, 0.45),
      tPos: rand(0.5, 0.63), tW: rand(0.035, 0.07), tA: rand(0.1, 0.34),
    };
    if (strong) { beat.rH = rand(1.3, 1.5); beat.sA += 0.15; }
    if (odd) {
      // an early, wide, unusual beat, with no P wave and the T wave flipped
      beat.len *= rand(0.5, 0.7);
      beat.pA = 0;
      beat.rW = rand(0.022, 0.034);
      beat.rH = rand(1.1, 1.5) * (Math.random() < 0.3 ? -0.7 : 1);
      beat.sA = rand(0.2, 0.5);
      beat.tA = -rand(0.15, 0.4);
      beat.tW = rand(0.06, 0.09);
    } else if (Math.random() < 0.09) {
      beat.len += rand(0.35, 0.9);                       // now and then the heart waits
    }
  }

  function makeSample() {
    const dt = DX / speed;
    beatT += dt;
    let p = beatT / beat.len;
    if (p >= 1 || (wantBeat && p > 0.7)) {
      nextBeat(wantBeat);
      if (wantBeat) burst = 1;
      wantBeat = false;
      p = 0;
    }
    const pos = sIdx * DX;
    const wander = 0.03 * Math.sin(pos * 0.0041 + 1.3) + 0.018 * Math.sin(pos * 0.0113) + 0.008 * Math.sin(pos * 0.029);
    ys.push(ecg(p, beat) + wander + (Math.random() - 0.5) * 0.01);
  }

  function makeBar() {
    const dt = BDX / speed;
    modeT -= dt;
    syllT -= dt;
    if (modeT <= 0) {
      if (mode === 'pause') {
        mode = 'talk';
        modeT = rand(0.3, 2.6);
        wordGain = Math.random() < 0.15 ? rand(0.9, 1.15) : rand(0.3, 1);
      } else {
        mode = 'pause';
        modeT = Math.random() < 0.2 ? rand(1, 2) : rand(0.2, 0.9);
      }
      syllT = 0;
    }
    if (syllT <= 0) {
      syllT = rand(0.05, 0.24);
      target = mode === 'talk' ? rand(0.3, 1) * wordGain : rand(0, 0.05);
    }
    if (burst > 0) { target = Math.max(target, 0.9 * burst); burst = Math.max(0, burst - 0.25); }
    env += (target - env) * (1 - Math.exp(-dt / 0.035));
    bars.push(Math.max(0.012, Math.min(1, env * (0.5 + 0.5 * Math.random()))));
  }

  // scroll forward by some distance, generating whatever data that uncovers
  function advance(dist) {
    D += dist;
    while ((sIdx + 1) * DX <= D) { makeSample(); sIdx++; }
    while ((bIdx + 1) * BDX <= D) { makeBar(); bIdx++; }
    const maxS = Math.ceil(headX / DX) + 4;
    if (ys.length > maxS) ys.splice(0, ys.length - maxS);
    const maxB = Math.ceil(headX / BDX) + 4;
    if (bars.length > maxB) bars.splice(0, bars.length - maxB);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cy = H * 0.55;
    headX = W - 3;
    speed = clamp(W * 0.15, 115, 230);
    amp = clamp(H * 0.26, 100, 260);
    barMax = clamp(Math.min(H * 0.32, H - cy - 46), 80, 300);
    lensR = clamp(W * 0.16, 120, 240);
    // start with the whole screen already filled with history
    ys = [];
    bars = [];
    sIdx = 0;
    bIdx = 0;
    D = 0;
    beatT = 0;
    nextBeat(false);
    beatT = beat.len * 0.5;
    advance(headX + 20);
    if (reduce) draw();
  }

  /* ---------- drawing ---------- */

  // Fisheye around the lens: returns the new x and how much taller things get there.
  function lensAt(x) {
    if (lens.s < 0.01) return [x, 1];
    const d = x - lens.x;
    const t = Math.abs(d) / lensR;
    if (t >= 1) return [x, 1];
    const mag = 2.3 * lens.s;
    const nt = ((mag + 1) * t) / (mag * t + 1);
    return [lens.x + Math.sign(d) * lensR * nt, 1 + 0.75 * lens.s * (1 - t * t) * (1 - t * t)];
  }

  function draw() {
    ctx.fillStyle = '#020304';
    ctx.fillRect(0, 0, W, H);
    const bgl = ctx.createRadialGradient(headX * 0.7, cy, 0, headX * 0.7, cy, Math.max(W, H) * 0.7);
    bgl.addColorStop(0, `rgba(${INK}, 0.045)`);
    bgl.addColorStop(1, `rgba(${INK}, 0)`);
    ctx.fillStyle = bgl;
    ctx.fillRect(0, 0, W, H);

    // the recording: thin mirrored lines, bunched into brightness groups so it is a few strokes
    const off = D - (bIdx - 1) * BDX;         // how far past the newest bar the head is
    const LEVELS = 8;
    const paths = Array.from({ length: LEVELS }, () => new Path2D());
    const n = bars.length;
    for (let j = 0; j < n; j++) {
      const x0 = headX - off - (n - 1 - j) * BDX;
      if (x0 < -4) continue;
      const [x, gain] = lensAt(x0);
      const fade = 0.3 + 0.7 * clamp(x0 / headX, 0, 1);
      const h = bars[j];
      const lv = clamp(Math.floor((0.15 + 0.85 * h) * fade * gain * LEVELS * 0.98), 0, LEVELS - 1);
      const hh = Math.max(1.4, h * barMax * gain);
      const px = Math.round(x) + 0.5;
      paths[lv].moveTo(px, cy - hh);
      paths[lv].lineTo(px, cy + hh);
    }
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (let lv = 0; lv < LEVELS; lv++) {
      ctx.strokeStyle = `rgba(${INK}, ${0.07 + (lv / (LEVELS - 1)) * 0.5})`;
      ctx.stroke(paths[lv]);
    }

    // the heartbeat trace
    const sOff = D - (sIdx - 1) * DX;
    const m = ys.length;
    const trace = new Path2D();
    let firstX = 0;
    for (let j = 0; j < m; j++) {
      const [x, gain] = lensAt(headX - sOff - (m - 1 - j) * DX);
      const y = cy - ys[j] * amp * gain;
      if (j === 0) { trace.moveTo(x, y); firstX = x; } else trace.lineTo(x, y);
    }
    const [hx, hGain] = lensAt(headX);
    const headY = cy - ys[m - 1] * amp * hGain;
    trace.lineTo(hx, headY);
    const fadeG = (a) => {
      const g = ctx.createLinearGradient(firstX, 0, hx, 0);
      g.addColorStop(0, `rgba(${INK}, ${a * 0.4})`);
      g.addColorStop(0.55, `rgba(${INK}, ${a * 0.75})`);
      g.addColorStop(1, `rgba(${INK}, ${a})`);
      return g;
    };
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = fadeG(0.1);
    ctx.lineWidth = 11;
    ctx.stroke(trace);
    ctx.strokeStyle = fadeG(0.2);
    ctx.lineWidth = 5;
    ctx.stroke(trace);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = fadeG(1);
    ctx.lineWidth = 2.2;
    ctx.stroke(trace);

    // the glowing head, and a faint line marking where the recording is being written
    const vg = ctx.createLinearGradient(0, cy - barMax * 1.2, 0, cy + barMax * 1.2);
    vg.addColorStop(0, `rgba(${INK}, 0)`);
    vg.addColorStop(0.5, `rgba(${INK}, 0.2)`);
    vg.addColorStop(1, `rgba(${INK}, 0)`);
    ctx.strokeStyle = vg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX + 0.5, cy - barMax * 1.2);
    ctx.lineTo(headX + 0.5, cy + barMax * 1.2);
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createRadialGradient(hx, headY, 0, hx, headY, 26);
    hg.addColorStop(0, `rgba(${INK}, 0.55)`);
    hg.addColorStop(1, `rgba(${INK}, 0)`);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, headY, 26, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(${INK}, 1)`;
    ctx.beginPath();
    ctx.arc(hx, headY, 2.6, 0, TAU);
    ctx.fill();

    if (lens.s > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(lens.x, cy, 0, lens.x, cy, lensR * 1.5);
      lg.addColorStop(0, `rgba(${INK}, ${0.07 * lens.s})`);
      lg.addColorStop(1, `rgba(${INK}, 0)`);
      ctx.fillStyle = lg;
      ctx.fillRect(lens.x - lensR * 1.5, cy - lensR * 1.5, lensR * 3, lensR * 3);
      ctx.globalCompositeOperation = 'source-over';
    }

    const vgn = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.85);
    vgn.addColorStop(0, 'rgba(2, 3, 4, 0)');
    vgn.addColorStop(1, 'rgba(2, 3, 4, 0.55)');
    ctx.fillStyle = vgn;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------- input ---------- */

  function onDown() { wantBeat = true; }
  function onMove(e) { pointer.x = e.clientX; pointer.y = e.clientY; }
  function onLeave() { pointer.y = -9999; }

  /* ---------- run ---------- */

  resize();
  window.addEventListener('resize', resize);

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
    advance(speed * dt);
    // the lens follows the pointer while it is over the line's band, and relaxes away otherwise
    const over = Math.abs(pointer.y - cy) < barMax * 1.1;
    if (lens.s < 0.02) lens.x = pointer.x;
    lens.x += (pointer.x - lens.x) * Math.min(1, dt * 14);
    lens.s += ((over ? 1 : 0) - lens.s) * Math.min(1, dt * (over ? 7 : 4));
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  return function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    canvas.remove();
  };
}

(window.__bgThemes = window.__bgThemes || {}).heartbeat = { init };
})();
