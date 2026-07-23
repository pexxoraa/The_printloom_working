/**
 * modal.js
 * ----------------------------------------------------------------------------
 * Minimal accessible modal factory. Usage:
 *
 *   const modal = createModal({ title: 'Quick View', bodyHtml: '<p>...</p>' });
 *   modal.open();
 *   modal.on('close', () => {...});
 * ----------------------------------------------------------------------------
 */

export function createModal({ title = '', bodyHtml = '', maxWidth = 520 } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="${title}" style="max-width:${maxWidth}px;">
      <button class="btn-icon modal-close" aria-label="Close dialog">✕</button>
      ${title ? `<h3 class="mb-4">${title}</h3>` : ''}
      <div class="modal-body">${bodyHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const listeners = {};
  const emit = (evt, detail) => (listeners[evt] || []).forEach((fn) => fn(detail));

  function close() {
    overlay.classList.remove('is-open');
    document.body.classList.remove('visually-scroll-lock');
    setTimeout(() => overlay.remove(), 280);
    emit('close');
  }

  function open() {
    document.body.classList.add('visually-scroll-lock');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    emit('open');
  }

  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  });

  return {
    el: overlay,
    open,
    close,
    on(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    setBody(html) {
      overlay.querySelector('.modal-body').innerHTML = html;
    },
  };
}
