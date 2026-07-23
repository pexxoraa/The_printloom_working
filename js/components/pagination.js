/**
 * pagination.js
 * ----------------------------------------------------------------------------
 * Renders a pagination control into `container` and invokes `onChange(page)`
 * whenever the user selects a new page. Purely presentational — callers own
 * the actual slicing/rendering of items per page.
 * ----------------------------------------------------------------------------
 */

export function renderPagination(container, { totalItems, pageSize, currentPage, onChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const items = [];
  const add = (page, label = page) => items.push(
    `<button class="pagination__item ${page === currentPage ? 'is-active' : ''}" data-page="${page}" aria-label="Page ${page}">${label}</button>`
  );

  add(Math.max(1, currentPage - 1), '‹');
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      add(p);
    } else if (Math.abs(p - currentPage) === 2) {
      items.push('<span class="pagination__item" aria-hidden="true">…</span>');
    }
  }
  add(Math.min(totalPages, currentPage + 1), '›');

  container.innerHTML = `<nav class="pagination" aria-label="Pagination">${items.join('')}</nav>`;
  container.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => onChange(Number(btn.dataset.page)));
  });
}
