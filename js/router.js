/**
 * router.js
 * ----------------------------------------------------------------------------
 * The Print Loom is a multi-page site (each folder under /pages has its own
 * index.html) so that it deploys cleanly to GitHub Pages with real, indexable
 * URLs for SEO. This module is NOT a SPA router — it's a small shared helper
 * for reading query params and building links consistently across pages.
 * ----------------------------------------------------------------------------
 */

import { CONFIG } from './services/config.js';

export const router = {
  /** Read the current page's query string into a plain object. */
  params() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
  },

  /** Read a single query param with an optional fallback. */
  param(key, fallback = null) {
    const value = new URLSearchParams(window.location.search).get(key);
    return value === null ? fallback : value;
  },

  /** Update the query string in place (e.g. filters, pagination) without reload. */
  setParams(params, { replace = true } = {}) {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    if (replace) window.history.replaceState({}, '', url);
    else window.history.pushState({}, '', url);
  },

  go(routeKey, query = {}) {
    const base = CONFIG.ROUTES[routeKey] || routeKey;
    const qs = new URLSearchParams(query).toString();
    window.location.href = qs ? `${base}?${qs}` : base;
  },

  /** Highlight the current top-level nav link based on pathname. */
  highlightActiveNav(root) {
    const path = window.location.pathname;
    root.querySelectorAll('.nav-primary a, .drawer-panel--left a').forEach((a) => {
      const linkPath = new URL(a.href, window.location.origin).pathname;
      if (linkPath === path) a.setAttribute('aria-current', 'page');
    });
  },
};
