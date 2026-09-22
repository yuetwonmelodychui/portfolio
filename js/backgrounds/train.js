(function () {
// Home page: plain black background + the boarding pass.
// The pass stays still. A soft light follows the cursor across it, and the
// journey-to-graduation numbers are worked out from today's date.

const START = new Date(2025, 0, 1);   // boarded: January 2025
const END = new Date(2028, 4, 15);    // arrives: Spring 2028 (mid-May)

function monthsBetween(a, b) {
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return Math.max(0, m);
}

function mountJourney(reduce) {
  const now = new Date();
  const pct = Math.min(1, Math.max(0, (now - START) / (END - START)));

  const pctEl = document.getElementById('tk-pct');
  if (pctEl) pctEl.textContent = `${Math.round(pct * 100)}%`;

  const flown = document.getElementById('tk-flown');
  if (flown) {
    const m = monthsBetween(START, now);
    const y = Math.floor(m / 12);
    const r = m % 12;
    const parts = [];
    if (y) parts.push(`${y} yr`);
    if (r || !y) parts.push(`${r} mo`);
    flown.textContent = `${parts.join(' ')} in flight`;
  }

  const bar = document.getElementById('tk-bar');
  if (bar) {
    if (reduce) {
      bar.style.width = `${pct * 100}%`;
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.width = `${pct * 100}%`;
      }));
    }
  }
}

function mountGlow(ticket) {
  let hovering = false;
  function move(e) {
    const r = ticket.getBoundingClientRect();
    ticket.style.setProperty('--glx', `${((e.clientX - r.left) / r.width) * 100}%`);
    ticket.style.setProperty('--gly', `${((e.clientY - r.top) / r.height) * 100}%`);
    if (!hovering) {
      hovering = true;
      ticket.classList.add('is-lit');
    }
  }
  function leave() {
    hovering = false;
    ticket.classList.remove('is-lit');
  }
  ticket.addEventListener('pointermove', move);
  ticket.addEventListener('pointerleave', leave);
  return function cleanup() {
    ticket.removeEventListener('pointermove', move);
    ticket.removeEventListener('pointerleave', leave);
  };
}

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ticket = document.getElementById('ticket');
  if (!ticket) return null;

  mountJourney(reduce);
  return mountGlow(ticket);
}

(window.__bgThemes = window.__bgThemes || {}).train = { init };
})();
