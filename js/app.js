/**
 * app.js
 * ----------------------------------------------------------------------------
 * Bootstraps chrome shared by every page: sticky header, footer, scroll
 * reveal animations, and the back-to-top button. Each page's own <script
 * type="module"> imports `initApp()` first, then runs page-specific logic.
 * ----------------------------------------------------------------------------
 */

import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { router } from './router.js';

export async function initApp() {
  const headerRoot = document.getElementById('site-header');
  const footerRoot = document.getElementById('site-footer');

  if (headerRoot) {
    await renderNavbar(headerRoot);
    router.highlightActiveNav(headerRoot);
  }
  if (footerRoot) renderFooter(footerRoot);

  initScrollReveal();
  initBackToTop();
}

function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  const observeAll = () => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el, i) => {
      el.style.setProperty('--stagger-index', i % 8);
      observer.observe(el);
    });
  };

  observeAll();
  // Re-scan whenever components inject new content (e.g. product grids).
  window.addEventListener('reveal:refresh', observeAll);
}

function initBackToTop() {
  let btn = document.getElementById('back-to-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);
  }
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 480);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Auto-run on every page as soon as this module is imported.
initApp();
