/**
 * toast.js
 * ----------------------------------------------------------------------------
 * Global toast notification stack. Call `showToast()` from anywhere after
 * importing this module — it lazily creates its own container on first use.
 * ----------------------------------------------------------------------------
 */

let stackEl = null;

function ensureStack() {
  if (stackEl) return stackEl;
  stackEl = document.createElement('div');
  stackEl.className = 'toast-stack';
  stackEl.setAttribute('aria-live', 'polite');
  stackEl.setAttribute('role', 'status');
  document.body.appendChild(stackEl);
  return stackEl;
}

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'i',
};

/**
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration ms before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3200) {
  const stack = ensureStack();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span aria-hidden="true">${ICONS[type] || ICONS.info}</span><span>${message}</span>`;
  stack.appendChild(toast);

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 200);
  };
  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}
