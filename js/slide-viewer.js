// Interactive slide viewer for presentations exported from PowerPoint.
// Usage: <div class="slide-viewer" data-slides="./path/to/slides.json" data-base="./path/to/images/"></div>
// slides.json: [{ index, title, body: [string], images: [filename], tables: [[[cell]]] }]

function renderSlideBody(slide, base) {
  const parts = [];

  if (slide.images && slide.images.length) {
    const imgs = slide.images.map((f) => `<img src="${base}${f}" alt="${slide.title || 'Slide ' + slide.index} figure"/>`).join('');
    parts.push(`<div class="slide-images${slide.images.length > 1 ? ' multi' : ''}">${imgs}</div>`);
  }

  if (slide.body && slide.body.length) {
    const text = slide.body
      .map((t) => `<p>${t.split('\n').map((line) => line.trim()).filter(Boolean).join('<br>')}</p>`)
      .join('');
    parts.push(`<div class="slide-text">${text}</div>`);
  }

  if (slide.tables && slide.tables.length) {
    const tables = slide.tables
      .map((rows) => {
        const [head, ...body] = rows;
        const thead = `<thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
        return `<table class="slide-table">${thead}${tbody}</table>`;
      })
      .join('');
    parts.push(tables);
  }

  return parts.join('');
}

function initSlideViewer(host) {
  const src = host.dataset.slides;
  const base = host.dataset.base || src.replace(/[^/]*$/, '');
  if (!src) return;

  host.innerHTML = `
    <div class="slide-viewer-stage">
      <div class="slide-viewer-topbar">
        <span class="slide-viewer-counter">Loading&hellip;</span>
      </div>
      <div class="slide-viewer-body"></div>
      <div class="slide-viewer-nav">
        <button type="button" class="slide-prev" aria-label="Previous slide">&#8249;</button>
        <div class="slide-viewer-dots"></div>
        <button type="button" class="slide-next" aria-label="Next slide">&#8250;</button>
      </div>
    </div>`;

  const counter = host.querySelector('.slide-viewer-counter');
  const body = host.querySelector('.slide-viewer-body');
  const dotsHost = host.querySelector('.slide-viewer-dots');
  const prevBtn = host.querySelector('.slide-prev');
  const nextBtn = host.querySelector('.slide-next');

  fetch(src)
    .then((r) => r.json())
    .then((slides) => {
      let i = 0;

      dotsHost.innerHTML = slides.map((_, idx) => `<button type="button" class="slide-dot" data-i="${idx}" aria-label="Go to slide ${idx + 1}"></button>`).join('');
      const dots = Array.from(dotsHost.querySelectorAll('.slide-dot'));

      function render() {
        const slide = slides[i];
        counter.textContent = `Slide ${slide.index} / ${slides.length}`;
        body.innerHTML = `
          <h4 class="slide-title">${slide.title || ''}</h4>
          ${renderSlideBody(slide, base)}
        `;
        dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
        prevBtn.disabled = i === 0;
        nextBtn.disabled = i === slides.length - 1;
      }

      function go(idx) {
        i = Math.max(0, Math.min(slides.length - 1, idx));
        render();
      }

      prevBtn.addEventListener('click', () => go(i - 1));
      nextBtn.addEventListener('click', () => go(i + 1));
      dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.i))));

      host.tabIndex = 0;
      host.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') go(i + 1);
        if (e.key === 'ArrowLeft') go(i - 1);
      });

      // Swipe support for touch devices.
      let touchX = null;
      host.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
      host.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
        touchX = null;
      }, { passive: true });

      render();
    })
    .catch(() => {
      counter.textContent = '';
      body.innerHTML = '<p class="slide-error">Could not load the presentation.</p>';
    });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.slide-viewer').forEach(initSlideViewer);
});
