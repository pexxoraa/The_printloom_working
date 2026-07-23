/**
 * loader.js
 * ----------------------------------------------------------------------------
 * Small helpers for full-page loaders and skeleton placeholders used while
 * product data streams in from the API layer.
 * ----------------------------------------------------------------------------
 */

export function showPageLoader() {
  let el = document.getElementById('page-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'page-loader';
    el.className = 'loader-fullpage';
    el.innerHTML = '<div class="loader-spinner" role="status" aria-label="Loading"></div>';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
  return el;
}

export function hidePageLoader() {
  const el = document.getElementById('page-loader');
  if (el) el.style.display = 'none';
}

export function inlineSpinner() {
  const span = document.createElement('div');
  span.className = 'loader-spinner';
  span.setAttribute('role', 'status');
  span.setAttribute('aria-label', 'Loading');
  return span;
}

/** Returns an HTML string for `count` skeleton product-card placeholders. */
export function skeletonProductCards(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="product-card">
      <div class="skeleton product-card__media"></div>
      <div class="skeleton" style="height:14px;width:60%;margin-top:16px;border-radius:4px;"></div>
      <div class="skeleton" style="height:18px;width:80%;margin-top:8px;border-radius:4px;"></div>
      <div class="skeleton" style="height:16px;width:40%;margin-top:8px;border-radius:4px;"></div>
    </div>
  `).join('');
}
