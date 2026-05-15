'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── YEAR ─────────────────────────────────────────────────
  const yr = new Date().getFullYear();
  document.querySelectorAll('#year, #year-legal').forEach(el => { el.textContent = yr; });

  // ── THEME ─────────────────────────────────────────────────
  const html      = document.documentElement;
  const toggleBtn = document.querySelector('.theme-toggle');

  function savedTheme() {
    const s = localStorage.getItem('theme');
    if (s === 'dark' || s === 'light') return s;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    if (toggleBtn) toggleBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem('theme', t);
  }

  applyTheme(savedTheme());

  toggleBtn?.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  // ── HEADER SCROLL ─────────────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    const obs = new IntersectionObserver(([e]) => header.classList.toggle('scrolled', !e.isIntersecting));
    const sentinel = Object.assign(document.createElement('div'), {
      style: 'position:absolute;top:1px;left:0;width:1px;height:1px;pointer-events:none;'
    });
    document.body.prepend(sentinel);
    obs.observe(sentinel);
  }

  // ── NAME CYCLER ────────────────────────────────────────────
  const cycler = document.querySelector('.name-cycler');
  const items  = cycler ? [...cycler.querySelectorAll('.name-item')] : [];

  if (items.length > 1) {
    // Lock container width to widest name so layout stays stable
    let maxW = 0;
    items.forEach(n => {
      const clone = n.cloneNode(true);
      Object.assign(clone.style, { visibility:'hidden', position:'absolute', opacity:'1', filter:'none', transform:'none' });
      document.body.appendChild(clone);
      maxW = Math.max(maxW, clone.offsetWidth);
      clone.remove();
    });
    if (maxW > 0) cycler.style.minInlineSize = maxW + 'px';

    let cur = 0;
    items[0].classList.add('is-active');

    setInterval(() => {
      const prev = items[cur];
      cur = (cur + 1) % items.length;
      const next = items[cur];

      prev.classList.replace('is-active', 'is-exit');
      prev.addEventListener('transitionend', function h() {
        prev.classList.remove('is-exit');
        prev.removeEventListener('transitionend', h);
      }, { once: true });
      next.classList.add('is-active');
    }, 2400);
  }

  // ── STAT COUNTERS ──────────────────────────────────────────
  const counters = [...document.querySelectorAll('.stat-num[data-target]')];

  if (counters.length) {
    const countUp = el => {
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      if (target === 0) { el.textContent = '0' + suffix; return; }
      const start = performance.now();
      const dur   = 1400;
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
        el.textContent = Math.round(e * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => io.observe(el));
  }

  // ── WORK MODAL ─────────────────────────────────────────────
  const modal     = document.getElementById('work-modal');
  const mImg      = document.getElementById('modal-img');
  const mTitle    = document.getElementById('modal-title');
  const mDate     = document.getElementById('modal-date');
  const mBody     = document.getElementById('modal-body');
  const mFoot     = document.getElementById('modal-foot');
  const cards     = [...document.querySelectorAll('.work-card .card-btn')];
  let   lastTrig  = null;

  const FOCUSABLE = 'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    const els = [...modal.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden]'));
    const first = els[0];
    const last  = els[els.length - 1];
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
  }

  function openModal(card) {
    const btn  = card.querySelector('.card-btn');
    const img  = card.querySelector('.card-thumb img');
    const desc = card.querySelector('.card-desc');
    const url  = card.dataset.linkUrl;
    const lbl  = card.dataset.linkLabel;

    mImg.src           = img ? img.src : '';
    mImg.alt           = '';
    mTitle.textContent = card.querySelector('.card-cname')?.textContent || '';
    mDate.textContent  = card.querySelector('.card-cdate')?.textContent || '';
    mBody.innerHTML    = desc ? desc.innerHTML : '';
    mFoot.innerHTML    = '';

    if (url) {
      const a = document.createElement('a');
      a.href      = url;
      a.target    = '_blank';
      a.rel       = 'noopener noreferrer';
      a.className = 'modal-ext-link';
      a.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" viewBox="0 0 24 24" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>${lbl || 'Visit'}`;
      mFoot.appendChild(a);
    }

    lastTrig = btn;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);

    // Focus first focusable element in modal
    requestAnimationFrame(() => {
      const first = modal.querySelector(FOCUSABLE);
      first?.focus();
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    lastTrig?.focus();
    lastTrig = null;
  }

  function onKey(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab')    trapFocus(e);
  }

  cards.forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.closest('.work-card')));
  });

  modal?.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  // ── SCROLL REVEAL ──────────────────────────────────────────
  const revealTargets = [
    '.about-layout',
    '.stat-item',
    '.work-card',
    '.social-link',
    '.contact-item',
    '.footer-col',
  ];

  revealTargets.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('js-reveal'));
  });

  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.07 });

  document.querySelectorAll('.js-reveal').forEach(el => revealObs.observe(el));

});
