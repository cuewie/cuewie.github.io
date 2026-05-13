'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── 1. COPYRIGHT YEAR ─────────────────────────────────────── */
  const year = new Date().getFullYear();
  ['year', 'year-legal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = year;
  });


  /* ─── 2. THEME TOGGLE ───────────────────────────────────────── */
  const html   = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');

  function getTheme() {
    const saved = localStorage.getItem('color-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (toggle) {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    localStorage.setItem('color-theme', theme);
  }

  applyTheme(getTheme());

  if (toggle) {
    toggle.addEventListener('click', () => {
      applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('color-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });


  /* ─── 3. HEADER SCROLL EFFECT ───────────────────────────────── */
  const header   = document.querySelector('.site-header');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:10px;left:0;width:1px;height:1px;pointer-events:none;';
  document.body.prepend(sentinel);

  if (header) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('scrolled', !entry.isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }


  /* ─── 4. NAME CYCLER ────────────────────────────────────────── */
  const cycler = document.querySelector('.name-cycler');
  const names  = cycler ? [...cycler.querySelectorAll('.name-item')] : [];

  if (names.length > 1) {
    let current = 0;
    names[0].classList.add('name-active');

    // Lock the cycler width to the widest name so layout doesn't jump.
    (function measureWidth() {
      let max = 0;
      names.forEach(n => {
        const clone = n.cloneNode(true);
        Object.assign(clone.style, { visibility: 'hidden', position: 'absolute', opacity: '1', filter: 'none', transform: 'none' });
        document.body.appendChild(clone);
        max = Math.max(max, clone.offsetWidth);
        document.body.removeChild(clone);
      });
      if (max > 0) cycler.style.minInlineSize = max + 'px';
    })();

    setInterval(() => {
      const prev = names[current];
      current = (current + 1) % names.length;
      const next = names[current];

      prev.classList.remove('name-active');
      prev.classList.add('name-exit');
      prev.addEventListener('transitionend', function h() {
        prev.classList.remove('name-exit');
        prev.removeEventListener('transitionend', h);
      });

      next.classList.add('name-active');
    }, 2200);
  }


  /* ─── 5. STAT COUNTERS ──────────────────────────────────────── */
  const counters = [...document.querySelectorAll('.stat-number[data-target]')];

  if (counters.length) {
    const countUp = (el) => {
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      if (target === 0) { el.textContent = '0' + suffix; return; }
      const duration = 1400;
      const start    = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    };

    new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 }).observe(
      ...counters.length === 1 ? counters : counters
    );

    // Re-attach correctly when more than one counter
    const counterObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(c => counterObs.observe(c));
  }


  /* ─── 6. WORK CAROUSEL ──────────────────────────────────────── */
  const track    = document.querySelector('.carousel-track');
  const dotsWrap = document.querySelector('.carousel-indicators');
  const prevBtn  = document.querySelector('.carousel-btn--prev');
  const nextBtn  = document.querySelector('.carousel-btn--next');
  const cards    = track ? [...track.querySelectorAll('.work-card')] : [];

  if (track && cards.length && dotsWrap) {
    const dots = cards.map((card, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to card ${i + 1}`);
      dot.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const visible = new Set();

    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const i = cards.indexOf(e.target);
        if (i === -1) return;
        e.isIntersecting ? visible.add(i) : visible.delete(i);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', visible.has(i));
        dot.setAttribute('aria-current', visible.has(i) ? 'true' : 'false');
      });
      syncBtns();
    }, { root: track, threshold: 0.5 }).observe(...cards.length === 1 ? cards : []);

    const cardObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const i = cards.indexOf(e.target);
        if (i === -1) return;
        e.isIntersecting ? visible.add(i) : visible.delete(i);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', visible.has(i));
        dot.setAttribute('aria-current', visible.has(i) ? 'true' : 'false');
      });
      syncBtns();
    }, { root: track, threshold: 0.5 });

    cards.forEach(c => cardObs.observe(c));

    function pageWidth() {
      const cw  = cards[0]?.offsetWidth || 336;
      const gap = parseInt(getComputedStyle(track).gap) || 20;
      const pp  = Math.max(1, Math.floor((track.clientWidth + gap) / (cw + gap)));
      return pp * (cw + gap);
    }

    function syncBtns() {
      if (!prevBtn || !nextBtn) return;
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }

    prevBtn?.addEventListener('click', () => track.scrollBy({ left: -pageWidth(), behavior: 'smooth' }));
    nextBtn?.addEventListener('click', () => track.scrollBy({ left:  pageWidth(), behavior: 'smooth' }));
    track.addEventListener('scroll', syncBtns, { passive: true });
    syncBtns();

    track.addEventListener('keydown', e => {
      const cw  = cards[0]?.offsetWidth || 336;
      const gap = parseInt(getComputedStyle(track).gap) || 20;
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left:  cw + gap, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -(cw + gap), behavior: 'smooth' }); }
    });
  }


  /* ─── 7. SCROLL-TRIGGERED ANIMATIONS ───────────────────────── */
  const animSelectors = [
    '.about-layout',
    '.stat-card',
    '.social-link',
    '.contact-item',
    '.footer-col',
  ];

  animSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('animate-on-scroll'));
  });

  document.querySelectorAll('section > .wrapper > h2, section > .wrapper > .section-label').forEach(el => {
    el.classList.add('animate-on-scroll');
  });

  new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 })
    .observe(...(() => {
      const els = [...document.querySelectorAll('.animate-on-scroll')];
      return els.length ? els : [document.body];
    })());

  // Separate observer for all animatable elements
  const animObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => animObs.observe(el));

}); // end DOMContentLoaded