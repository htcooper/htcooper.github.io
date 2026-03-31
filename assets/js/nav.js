/* nav.js — Shared component loader + mobile nav toggle */

(function () {
  'use strict';

  /* Determine path prefix based on page depth.
     Pages at root (index.html) use "/components/header.html".
     Pages in subdirs (work/doc-summarizer.html) use "../components/header.html".
     We detect depth by checking the <meta name="path-depth"> tag, defaulting to root. */
  const depthMeta = document.querySelector('meta[name="path-depth"]');
  const depth = depthMeta ? parseInt(depthMeta.content, 10) : 0;
  const prefix = depth > 0 ? '../'.repeat(depth) : '';

  async function loadComponent(selector, path) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(prefix + path);
      if (!res.ok) throw new Error(res.statusText);
      el.innerHTML = await res.text();
    } catch (err) {
      console.warn('Failed to load component:', path, err);
    }
  }

  async function init() {
    await Promise.all([
      loadComponent('#site-header', 'components/header.html'),
      loadComponent('#site-footer', 'components/footer.html')
    ]);

    highlightActiveNav();
    setupMobileNav();
  }

  function highlightActiveNav() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.site-header__nav a, .mobile-nav a');
    links.forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;
      /* Match exact path or match if current path starts with the link's href
         (e.g., /work/doc-summarizer.html matches /work) */
      const normalized = href.replace(/index\.html$/, '').replace(/\/$/, '');
      const currentNormalized = path.replace(/index\.html$/, '').replace(/\/$/, '');
      if (
        currentNormalized === normalized ||
        (normalized.length > 1 && currentNormalized.startsWith(normalized))
      ) {
        link.classList.add('active');
      }
    });
  }

  function setupMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    /* Close mobile nav when a link is clicked */
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
