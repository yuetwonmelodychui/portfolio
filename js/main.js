const NAV_ITEMS = [
  {
    label: 'Education',
    href: './education.html',
    children: [
      { label: 'High School', href: './education.html#school-hs' },
      { label: 'College', href: './education.html#school-nyu' },
    ],
  },
  {
    label: 'Projects',
    href: './projects.html',
    children: [
      { label: 'Clubs (Leadership)', href: './projects.html#clubs' },
      { label: 'Performances', href: './projects.html#performances' },
      { label: 'Personal Projects', href: './projects.html#personal-projects' },
      { label: 'Creative Outlets', href: './projects.html#creative-outlets' },
      { label: 'Instagram Story Design', href: './projects.html#instagram-story-design' },
      { label: '3D Printing Gifts', href: './projects.html#3d-printing' },
      { label: 'Personal Photography', href: './projects.html#photography' },
    ],
  },
  {
    label: 'Volunteer',
    href: './volunteer.html',
    children: [
      { label: 'Student Teaching English Program', href: './volunteer.html#student-teaching-english-program' },
      { label: 'Key Community Service Club', href: './volunteer.html#international-key-club' },
      { label: 'P.E. Equipment Room', href: './volunteer.html#pe-equipment-room' },
      { label: 'Records & Media', href: './volunteer.html#records-media' },
    ],
  },
  {
    label: 'Work Experience',
    href: './work_experience.html',
    children: [
      { label: 'OASIS Mentoring', href: './work_experience.html#oasis-mentoring' },
      { label: 'AURA by Nisha', href: './work_experience.html#aura-by-nisha' },
      { label: 'VIP Ability Project', href: './work_experience.html#vip-ability-project' },
      { label: 'NYCU Research', href: './work_experience.html#nycu-research' },
      { label: 'Synchrotron Research', href: './work_experience.html#synchrotron-research' },
      { label: 'Physics TA', href: './work_experience.html#physics-ta' },
    ],
  },
  { label: 'Awards', href: './awards.html' },
];

// Per-section menus for pages with several sections (Education, Projects, Volunteer,
// Work Experience). Awards is left out — 20 entries is too many for a dropdown.
const SECTION_DROPDOWNS = true;

const CONTACT_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/yuetwonmelodychui/' },
  { label: 'Instagram', href: 'https://www.instagram.com/melody_chui/' },
  { label: 'GitHub', href: 'https://github.com/ymc8474' },
  { label: 'Handshake', href: 'https://app.joinhandshake.com/profiles/ymc8474' },
  { label: 'Email', href: 'mailto:melody.yw.chui@gmail.com' },
  { label: 'Phone', href: 'tel:+17185002763' },
  { label: 'Resume', href: "./sections/contact/files/Yuetwon Melody Chui's University Resume (IDM | updated on 03.11.2026).pdf" },
];

function currentPage() {
  return location.pathname.split('/').pop() || 'index.html';
}

function isCurrent(href) {
  const page = href.split('#')[0].replace('./', '');
  return page === currentPage();
}

function buildNavHTML() {
  return NAV_ITEMS.map((item) => {
    const hasChildren = SECTION_DROPDOWNS && Boolean(item.children && item.children.length);
    const current = isCurrent(item.href);
    const caret = hasChildren
      ? `<button type="button" class="nav-caret" aria-label="Open ${item.label} menu"><svg class="caret-icon" width="9" height="6" viewBox="0 0 9 6" aria-hidden="true"><path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
      : '';
    return `
      <li class="nav-item${hasChildren ? ' has-dropdown' : ''}${current ? ' current' : ''}">
        <a href="${item.href}">${item.label}</a>${caret}
        ${hasChildren ? `<ul class="dropdown">${item.children.map((c) => `<li><a href="${c.href}">${c.label}</a></li>`).join('')}</ul>` : ''}
      </li>`;
  }).join('');
}

function buildContactHTML() {
  return CONTACT_LINKS.map((link) => {
    const pendingAttrs = link.pending ? ' class="pending" aria-disabled="true"' : '';
    const soonTag = link.pending ? ' <span class="soon-tag">soon</span>' : '';
    return `<li><a href="${link.href}"${pendingAttrs}>${link.label}${soonTag}</a></li>`;
  }).join('');
}

function renderChrome() {
  const headerSlot = document.getElementById('site-header');
  if (headerSlot) {
    headerSlot.outerHTML = `
      <header>
        <a href="./index.html" class="site-logo"><h1>Yuetwon Melody Chui</h1></a>
        <span class="mobile-menu" id="mobile-menu">&#8942;</span>
        <nav>
          <ul id="menu">
            ${buildNavHTML()}
            <li class="nav-item has-dropdown contact-item">
              <a href="#" class="contact-trigger">Contact</a><button type="button" class="nav-caret" aria-label="Open contact menu"><svg class="caret-icon" width="9" height="6" viewBox="0 0 9 6" aria-hidden="true"><path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <ul class="dropdown">${buildContactHTML()}</ul>
            </li>
          </ul>
        </nav>
      </header>`;
  }

  const footerSlot = document.getElementById('site-footer');
  if (footerSlot) {
    footerSlot.outerHTML = `
      <footer>
        <p class="footer-credit">&copy; 2026 Yuetwon Melody Chui</p>
        <ul class="footer-links">
          <li><a href="mailto:melody.yw.chui@gmail.com">Email</a></li>
          <li><a href="tel:+17185002763">Phone</a></li>
          <li><a href="./sections/contact/files/Yuetwon Melody Chui's University Resume (IDM | updated on 03.11.2026).pdf">Resume</a></li>
        </ul>
      </footer>`;
  }
}

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.querySelector('header nav').classList.toggle('show');
  });
}

function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const loop = document.body.dataset.typewriterLoop === 'true';
  const txt = document.body.dataset.pageTitle || 'Yuetwon Melody Chui';
  let i = 0;

  function type() {
    if (i < txt.length) {
      el.textContent += txt.charAt(i);
      i++;
      setTimeout(type, 100);
    } else if (loop) {
      setTimeout(reset, 3000);
    }
  }

  function reset() {
    el.textContent = '';
    i = 0;
    type();
  }

  type();
}

function initDropdowns() {
  document.addEventListener('click', (e) => {
    const caret = e.target.closest('.nav-caret');
    const contactTrigger = e.target.closest('.contact-trigger');

    if (caret || contactTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const li = (caret || contactTrigger).closest('.nav-item');
      const isOpen = li.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach((o) => o.classList.remove('open'));
      if (!isOpen) li.classList.add('open');
      return;
    }

    document.querySelectorAll('.nav-item.open').forEach((o) => o.classList.remove('open'));
  });
}

function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const triggers = Array.from(group.querySelectorAll('[data-tab-trigger]'));
    const panels = Array.from(group.querySelectorAll('[data-tab-panel]'));
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const key = trigger.dataset.tabTrigger;
        triggers.forEach((t) => t.classList.toggle('active', t === trigger));
        panels.forEach((p) => p.classList.toggle('active', p.dataset.tabPanel === key));
      });
    });
  });
}

function initScrollSpy() {
  const sections = Array.from(document.querySelectorAll('[data-spy]'));
  if (sections.length < 2) return;

  const line = document.createElement('div');
  line.className = 'spy-line';
  // Many sections (e.g. Awards) need a tighter dot spacing so the line doesn't
  // run off the top/bottom of the viewport.
  if (sections.length > 10) line.classList.add('spy-line-compact');
  line.innerHTML = sections
    .map((s, i) => `<button class="spy-tick" data-index="${i}" title="${s.dataset.spy}"><span class="spy-dot"></span></button>`)
    .join('');
  document.body.appendChild(line);

  const ticks = Array.from(line.querySelectorAll('.spy-tick'));
  ticks.forEach((tick) => {
    tick.addEventListener('click', () => {
      sections[Number(tick.dataset.index)].scrollIntoView({ behavior: 'smooth' });
    });
  });

  function update() {
    const mid = window.scrollY + window.innerHeight / 2;
    let activeIndex = 0;
    sections.forEach((s, i) => {
      if (s.offsetTop <= mid) activeIndex = i;
    });
    ticks.forEach((t, i) => t.classList.toggle('active', i === activeIndex));
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

// A small line at the bottom that says how to play with the page's background.
// Set on <body>: data-hint="text" and data-hint-dismiss="scroll | click | timer".
function initHint() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const text = (coarse && document.body.dataset.hintTouch) || document.body.dataset.hint;
  if (!text) return;
  const hint = document.createElement('p');
  hint.className = 'page-hint';
  hint.textContent = text;
  document.body.appendChild(hint);
  const how = document.body.dataset.hintDismiss || 'timer';
  const hide = () => {
    hint.classList.add('gone');
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointerdown', hide);
  };
  const onScroll = () => { if (window.scrollY > 40) hide(); };
  if (how === 'scroll') window.addEventListener('scroll', onScroll, { passive: true });
  else if (how === 'click') window.addEventListener('pointerdown', hide, { passive: true });
  else setTimeout(hide, 14000);
}

function initBackground() {
  const name = document.body.dataset.bg;
  if (!name) return;
  const host = document.querySelector('.bg');
  if (!host) return;
  // Each theme lives in js/backgrounds/<name>.js and registers itself on
  // window.__bgThemes. Plain scripts (not ES modules) so the site also works
  // when opened straight from disk.
  const script = document.createElement('script');
  script.src = `./js/backgrounds/${name}.js`;
  script.onload = () => {
    const theme = window.__bgThemes && window.__bgThemes[name];
    if (theme && typeof theme.init === 'function') theme.init(host);
  };
  script.onerror = () => console.warn(`Background "${name}" failed to load`);
  document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome();
  initMobileMenu();
  initTypewriter();
  initDropdowns();
  initTabs();
  initScrollSpy();
  initBackground();
  initHint();
});
