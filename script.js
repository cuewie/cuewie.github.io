/**
 * script.js — cue.cat personal portfolio
 *
 * This script handles ALL interactive behaviours:
 *   1. Auto-update copyright year
 *   2. Light / Dark mode toggle (respects OS preference)
 *   3. Header "frosted glass" effect on scroll
 *   4. Name cycling animation in the hero section
 *   5. Animated stat counters (count up from 0)
 *   6. Work carousel — indicators + prev/next buttons
 *   7. Scroll-triggered entrance animations
 *
 * Everything is written in plain JavaScript — no libraries needed.
 * Code is commented heavily so beginners can follow along!
 */

'use strict'; // Strict mode catches common mistakes early

/* ============================================================
   HELPER — Wait for the DOM (page HTML) to fully load
   before running any code. This prevents "element not found"
   errors when the script runs before elements exist.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. AUTO-UPDATE COPYRIGHT YEAR
     Finds every element with id="year" or id="year-legal" and
     fills it with the current year automatically.
     SWAP: You don't need to change anything here.
     ============================================================ */
  const currentYear = new Date().getFullYear();

  // Update all year placeholders
  ['year', 'year-legal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = currentYear;
  });


  /* ============================================================
     2. LIGHT / DARK MODE TOGGLE
     
     Priority order (highest to lowest):
     1. User's manual choice (saved to localStorage)
     2. System OS preference (prefers-color-scheme)
     3. Default: light
     
     The theme is set as data-theme="light" or data-theme="dark"
     on the <html> element. CSS uses this to swap variables.
     ============================================================ */
  const htmlEl      = document.documentElement;
  const themeToggle = document.querySelector('.theme-toggle');

  /**
   * Get the theme to use on page load.
   * Checks localStorage first, then falls back to OS preference.
   */
  function getInitialTheme() {
    const saved = localStorage.getItem('color-theme');
    if (saved === 'dark' || saved === 'light') return saved;

    // Check the OS/browser preference
    const prefersD = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersD ? 'dark' : 'light';
  }

  /**
   * Apply a theme: sets data-theme on <html>, updates aria-label,
   * and saves the choice to localStorage for next visit.
   */
  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);

    // Update the toggle button's aria-label so screen readers know
    // what the button will DO when clicked (the opposite action).
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }

    // Save the user's choice
    localStorage.setItem('color-theme', theme);
  }

  // Apply the theme immediately on page load (before any user interaction)
  applyTheme(getInitialTheme());

  // Wire up the toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // If the user changes their OS preference while on the page,
  // auto-update UNLESS they've already made a manual choice.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const saved = localStorage.getItem('color-theme');
    // Only auto-update if the user hasn't manually set a preference
    if (!saved) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });


  /* ============================================================
     3. HEADER SCROLL EFFECT
     Adds the .scrolled class when the page is scrolled past 10px.
     CSS uses this to enable the frosted glass backdrop.
     ============================================================ */
  const header = document.querySelector('.main-header');

  if (header) {
    // IntersectionObserver is more performant than a scroll listener
    // because it doesn't fire on every pixel of scroll.
    // We observe a small sentinel element at the top of the page.
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:10px;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is NOT visible, the user has scrolled down
        header.classList.toggle('scrolled', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    headerObserver.observe(sentinel);
  }


  /* ============================================================
     4. NAME CYCLING ANIMATION
     
     Cycles through the name spans inside .name-cycler every ~2s.
     Uses CSS classes (.name-active, .name-exit) to trigger smooth
     opacity + blur + transform transitions defined in style.css.
     
     SWAP: Change the text inside .name-item spans in index.html
           to update the names. No changes needed here.
     ============================================================ */
  const nameCycler = document.querySelector('.name-cycler');
  const nameItems  = nameCycler ? Array.from(nameCycler.querySelectorAll('.name-item')) : [];

  if (nameItems.length > 1) {
    let currentIndex = 0;

    // Show the first name immediately
    nameItems[0].classList.add('name-active');

    // Calculate the width of the widest name so the layout doesn't
    // jump when switching between short and long names.
    function setNameCyclerWidth() {
      let maxWidth = 0;
      nameItems.forEach(item => {
        // Temporarily make it visible to measure
        item.style.visibility = 'hidden';
        item.style.position = 'relative';
        item.style.opacity = '1';
        item.style.filter = 'none';
        item.style.transform = 'none';
        const w = item.offsetWidth;
        // Reset
        item.style.visibility = '';
        item.style.position   = '';
        item.style.opacity    = '';
        item.style.filter     = '';
        item.style.transform  = '';
        if (w > maxWidth) maxWidth = w;
      });
      // Give the container a fixed width for the widest name
      if (nameCycler && maxWidth > 0) {
        nameCycler.style.minInlineSize = maxWidth + 'px';
      }
    }
    setNameCyclerWidth();

    // Cycle to the next name
    function cycleToNext() {
      const prev = nameItems[currentIndex];
      currentIndex = (currentIndex + 1) % nameItems.length;
      const next = nameItems[currentIndex];

      // 1. Mark the current one as exiting
      prev.classList.remove('name-active');
      prev.classList.add('name-exit');

      // 2. After the exit transition finishes, reset it
      prev.addEventListener('transitionend', function handler() {
        prev.classList.remove('name-exit');
        prev.removeEventListener('transitionend', handler);
      });

      // 3. Make the next one active (enters with CSS transition)
      next.classList.add('name-active');
    }

    // Start the cycling interval — change name every 2 seconds
    // SWAP: Change 2000 to a different number of milliseconds if you
    //       want the names to cycle faster or slower.
    setInterval(cycleToNext, 2000);
  }


  /* ============================================================
     5. ANIMATED STAT COUNTERS
     
     Each element with class .stat-number has a data-target attribute
     (the final number) and data-suffix (optional, e.g. "+").
     
     When the stat becomes visible on screen, it counts up from 0
     to the target using requestAnimationFrame for smooth animation.
     
     SWAP: Change data-target and data-suffix in index.html.
           No changes needed here.
     ============================================================ */
  const statEls = document.querySelectorAll('.stat-number');

  /**
   * Animate a number counter from 0 to target.
   * Uses an easing function so it slows down at the end.
   *
   * @param {HTMLElement} el     - The element to update
   * @param {number}      target - The final number
   * @param {string}      suffix - Optional suffix like "+"
   * @param {number}      duration - Animation duration in ms
   */
  function animateCounter(el, target, suffix = '', duration = 1500) {
    const startTime = performance.now();

    // Easing function: ease-out cubic — fast start, slow end
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function update(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1); // clamp to 1
      const eased    = easeOutCubic(progress);
      const value    = Math.floor(eased * target);

      el.textContent = value + suffix;

      if (progress < 1) {
        // Keep animating until we reach 1 (100%)
        requestAnimationFrame(update);
      } else {
        // Ensure the final value is exact
        el.textContent = target + suffix;
        // Add a little "pop" animation when it finishes
        el.classList.add('stat-pop');
        el.addEventListener('animationend', () => el.classList.remove('stat-pop'), { once: true });
      }
    }

    requestAnimationFrame(update);
  }

  // Use IntersectionObserver to trigger counters when they scroll into view
  if (statEls.length > 0) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = parseInt(el.getAttribute('data-target'), 10);
            const suffix = el.getAttribute('data-suffix') || '';

            // Only animate once — then stop observing
            statObserver.unobserve(el);
            animateCounter(el, target, suffix);
          }
        });
      },
      {
        // Trigger when 40% of the element is visible
        threshold: 0.4,
      }
    );

    statEls.forEach(el => statObserver.observe(el));
  }


  /* ============================================================
     6. WORK CAROUSEL — Indicators + Prev/Next buttons
     
     The carousel uses CSS scroll-snap for smooth native scrolling.
     This script adds:
       - ♦ Diamond indicator dots (one per card)
       - Indicator highlights which cards are currently visible
       - Prev/Next buttons scroll by one "page" of cards
     
     SWAP: No changes needed here. Adding/removing .work-card
           elements in index.html will automatically update the
           indicator count.
     ============================================================ */
  const carouselTrack      = document.querySelector('.carousel-track');
  const indicatorsEl       = document.querySelector('.carousel-indicators');
  const prevBtn            = document.querySelector('.carousel-btn--prev');
  const nextBtn            = document.querySelector('.carousel-btn--next');
  const cards              = carouselTrack
    ? Array.from(carouselTrack.querySelectorAll('.work-card'))
    : [];

  if (carouselTrack && cards.length > 0 && indicatorsEl) {

    /* — Build diamond indicators — */
    // Create one button per card
    const dots = cards.map((card, index) => {
      const dot = document.createElement('button');
      dot.className   = 'carousel-dot';
      dot.type        = 'button';
      dot.setAttribute('aria-label', `Go to card ${index + 1}`);

      // Clicking a dot scrolls that card into view
      dot.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      });

      indicatorsEl.appendChild(dot);
      return dot;
    });

    /* — Track which cards are in view using IntersectionObserver — */
    const visibleCards = new Set(); // Tracks currently visible card indices

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const index = cards.indexOf(entry.target);
          if (index === -1) return;

          if (entry.isIntersecting) {
            visibleCards.add(index);
          } else {
            visibleCards.delete(index);
          }
        });

        // Update indicator active states
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', visibleCards.has(i));
          dot.setAttribute('aria-current', visibleCards.has(i) ? 'true' : 'false');
        });

        // Update button disabled states
        updateButtonStates();
      },
      {
        root: carouselTrack, // Observe within the carousel scroll area
        threshold: 0.5,      // Card must be 50% visible to count
      }
    );

    cards.forEach(card => cardObserver.observe(card));

    /* — Calculate how many cards fit per "page" — */
    function getCardsPerPage() {
      const trackWidth = carouselTrack.clientWidth;
      const cardWidth  = cards[0]?.offsetWidth || 320;
      const gap        = 20; // matches var(--space-md) in CSS
      return Math.max(1, Math.floor((trackWidth + gap) / (cardWidth + gap)));
    }

    /* — Prev button: scroll back one page — */
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const perPage  = getCardsPerPage();
        const cardW    = cards[0]?.offsetWidth || 320;
        const gap      = parseInt(getComputedStyle(carouselTrack).gap) || 20;
        const scrollBy = perPage * (cardW + gap);
        carouselTrack.scrollBy({ left: -scrollBy, behavior: 'smooth' });
      });
    }

    /* — Next button: scroll forward one page — */
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const perPage  = getCardsPerPage();
        const cardW    = cards[0]?.offsetWidth || 320;
        const gap      = parseInt(getComputedStyle(carouselTrack).gap) || 20;
        const scrollBy = perPage * (cardW + gap);
        carouselTrack.scrollBy({ left: scrollBy, behavior: 'smooth' });
      });
    }

    /* — Disable buttons at the start/end of the carousel — */
    function updateButtonStates() {
      if (!prevBtn || !nextBtn) return;

      const atStart = carouselTrack.scrollLeft <= 4; // small threshold
      const atEnd   = carouselTrack.scrollLeft + carouselTrack.clientWidth
                      >= carouselTrack.scrollWidth - 4;

      prevBtn.disabled = atStart;
      nextBtn.disabled = atEnd;
    }

    // Update on scroll
    carouselTrack.addEventListener('scroll', updateButtonStates, { passive: true });
    // Initial state
    updateButtonStates();

    /* — Keyboard navigation for the carousel — */
    // When focus is inside the carousel track, arrow keys scroll it
    carouselTrack.addEventListener('keydown', (e) => {
      const cardW = cards[0]?.offsetWidth || 320;
      const gap   = parseInt(getComputedStyle(carouselTrack).gap) || 20;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        carouselTrack.scrollBy({ left: cardW + gap, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        carouselTrack.scrollBy({ left: -(cardW + gap), behavior: 'smooth' });
      }
    });
  }


  /* ============================================================
     7. SCROLL-TRIGGERED ENTRANCE ANIMATIONS
     
     Any element with class .animate-on-scroll will fade + slide up
     when it becomes visible. CSS handles the actual animation —
     this script just adds the .in-view class at the right time.
     
     We add the class to the key sections automatically here.
     ============================================================ */
  const animatableSelectors = [
    '.skill-row',
    '.social-link',
    '.contact-item',
    '.about-layout',
    '.work-card',
    '.footer-col',
  ];

  // Add the class to all matching elements
  animatableSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('animate-on-scroll');
    });
  });

  // Section headings also animate in
  document.querySelectorAll('section h2').forEach(el => {
    el.classList.add('animate-on-scroll');
  });

  // Create one IntersectionObserver for all animatable elements
  const scrollAnimObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Stop observing once the animation has played
          scrollAnimObserver.unobserve(entry.target);
        }
      });
    },
    {
      // Trigger slightly before the element fully enters the viewport
      rootMargin: '0px 0px -5% 0px',
      threshold: 0.1,
    }
  );

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    scrollAnimObserver.observe(el);
  });


  /* ============================================================
     Done! All features are now active.
     
     Quick reference for future customisation:
     
     — To add a new name to the cycle:
       Add a <span class="name-item">YourName</span> inside
       .name-cycler in index.html.
     
     — To add a new stat row:
       Copy a .skill-row in index.html, change the text and
       data-target number.
     
     — To add a work card:
       Copy a .work-card article in index.html.
     
     — To add a social link:
       Copy a <li> inside .social-grid in index.html.
     
     — To change the theme colours:
       Edit the CSS custom properties at the top of style.css.
     ============================================================ */

}); // end DOMContentLoaded