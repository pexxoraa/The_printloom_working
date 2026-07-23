/**
 * navbar.js
 * ----------------------------------------------------------------------------
 * Renders the sticky site header into #site-header (present on every page
 * via a shared include pattern) and wires up:
 *  - desktop mega menu for Collections
 *  - live search suggestions
 *  - wishlist / cart count badges that stay in sync via CustomEvents
 *  - mobile nav drawer
 *  - dark mode toggle (persisted to localStorage)
 * ----------------------------------------------------------------------------
 */

import { CONFIG } from '../services/config.js';
import { cart } from '../services/cart.js';
import { wishlist } from '../services/wishlist.js';
import { products } from '../services/products.js';
import { storage } from '../services/storage.js';

export async function renderNavbar(root) {
  const categories = await products.categories();

  root.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to content</a>
    <header class="site-header">
      <div class="container">
        <a href="${CONFIG.ROUTES.home}" class="font-display" style="font-size:1.5rem;font-weight:700;letter-spacing:0.02em;color:var(--color-maroon);">
          The Print Loom
        </a>

        <nav class="nav-primary" aria-label="Primary">
          <a href="${CONFIG.ROUTES.home}">Home</a>
          <div class="mega-menu-trigger" style="position:relative;">
            <a href="${CONFIG.ROUTES.collections}">Collections</a>
            <div class="mega-menu" style="display:none;position:absolute;top:36px;left:-24px;background:var(--color-white);box-shadow:var(--shadow-lg);border-radius:var(--radius-md);padding:var(--space-5);min-width:560px;grid-template-columns:repeat(3,1fr);gap:var(--space-4);z-index:200;">
              ${categories.map((c) => `
                <a href="${CONFIG.ROUTES.collections}?category=${c.id}" style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;">
                  <img src="${c.image}" alt="" width="36" height="36" style="border-radius:50%;object-fit:cover;">
                  <span style="font-size:0.85rem;">${c.name}</span>
                </a>`).join('')}
            </div>
          </div>
          <a href="${CONFIG.ROUTES.about}">About</a>
          <a href="${CONFIG.ROUTES.contact}">Contact</a>
        </nav>

        <div class="nav-actions">
          <button class="btn-icon" id="nav-search-toggle" aria-label="Search">⚲</button>
          <button class="btn-icon" id="nav-theme-toggle" aria-label="Toggle dark mode">☾</button>
          <a class="btn-icon" href="${CONFIG.ROUTES.wishlist}" aria-label="Wishlist" style="position:relative;">
            ♡ <span id="wishlist-count" class="tag" style="position:absolute;top:-6px;right:-6px;background:var(--color-maroon);color:#fff;min-width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;padding:0;">0</span>
          </a>
          <button class="btn-icon" id="nav-cart-toggle" aria-label="Cart" style="position:relative;">
            ⛃ <span id="cart-count" class="tag" style="position:absolute;top:-6px;right:-6px;background:var(--color-maroon);color:#fff;min-width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;padding:0;">0</span>
          </button>
          <button class="btn-icon hide-desktop" id="nav-mobile-toggle" aria-label="Menu">☰</button>
        </div>
      </div>

      <div id="nav-search-bar" style="display:none;border-top:1px solid var(--color-border);background:var(--color-white);">
        <div class="container" style="padding-block:12px;position:relative;">
          <input type="search" id="nav-search-input" class="form-input w-full" placeholder="Search sarees, fabrics, colours..." aria-label="Search products">
          <div id="nav-search-results" class="search-suggest" style="display:none;"></div>
        </div>
      </div>
    </header>

    <div class="drawer-overlay drawer-overlay--left" id="mobile-drawer">
      <div class="drawer-panel drawer-panel--left">
        <div class="row-between" style="padding:var(--space-5);border-bottom:1px solid var(--color-border);">
          <strong class="font-display">Menu</strong>
          <button class="btn-icon" id="mobile-drawer-close" aria-label="Close menu">✕</button>
        </div>
        <nav class="stack" style="padding:var(--space-5);gap:var(--space-5);font-size:1.05rem;">
          <a href="${CONFIG.ROUTES.home}">Home</a>
          <a href="${CONFIG.ROUTES.collections}">Collections</a>
          <a href="${CONFIG.ROUTES.wishlist}">Wishlist</a>
          <a href="${CONFIG.ROUTES.cart}">Cart</a>
          <a href="${CONFIG.ROUTES.about}">About</a>
          <a href="${CONFIG.ROUTES.contact}">Contact</a>
        </nav>
      </div>
    </div>

    <div class="drawer-overlay" id="cart-drawer">
      <div class="drawer-panel">
        <div class="row-between" style="padding:var(--space-5);border-bottom:1px solid var(--color-border);">
          <strong class="font-display">Your Bag</strong>
          <button class="btn-icon" id="cart-drawer-close" aria-label="Close cart">✕</button>
        </div>
        <div id="cart-drawer-body" style="flex:1;overflow-y:auto;padding:var(--space-5);"></div>
        <div style="padding:var(--space-5);border-top:1px solid var(--color-border);">
          <a href="${CONFIG.ROUTES.cart}" class="btn btn-outline btn-block mb-3">View Cart</a>
          <a href="${CONFIG.ROUTES.checkout}" class="btn btn-primary btn-block">Checkout</a>
        </div>
      </div>
    </div>
  `;

  wireInteractions(root);
  updateBadges();
  window.addEventListener('cart:change', updateBadges);
  window.addEventListener('wishlist:change', updateBadges);
}

function updateBadges() {
  const cartCountEl = document.getElementById('cart-count');
  const wishCountEl = document.getElementById('wishlist-count');
  if (cartCountEl) cartCountEl.textContent = cart.count();
  if (wishCountEl) wishCountEl.textContent = wishlist.count();
  renderCartDrawer();
}

async function renderCartDrawer() {
  const body = document.getElementById('cart-drawer-body');
  if (!body) return;
  const lines = await cart.hydrate();
  if (!lines.length) {
    body.innerHTML = '<div class="empty-state"><p>Your bag is empty.</p></div>';
    return;
  }
  body.innerHTML = lines.map((l) => `
    <div class="mini-cart-line">
      <img src="${l.product.images[0]}" alt="${l.product.name}">
      <div class="stack" style="flex:1;">
        <span style="font-size:0.9rem;font-weight:600;">${l.product.name}</span>
        <span class="text-faint" style="font-size:0.8rem;">${l.size} × ${l.quantity}</span>
        <span class="text-maroon" style="font-weight:600;">${CONFIG.BUSINESS.currency}${l.lineTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
  `).join('');
}

function wireInteractions(root) {
  const searchToggle = root.querySelector('#nav-search-toggle');
  const searchBar = root.querySelector('#nav-search-bar');
  const searchInput = root.querySelector('#nav-search-input');
  const searchResults = root.querySelector('#nav-search-results');

  searchToggle?.addEventListener('click', () => {
    const isOpen = searchBar.style.display === 'block';
    searchBar.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) searchInput.focus();
  });

  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const q = searchInput.value.trim();
      if (!q) { searchResults.style.display = 'none'; return; }
      const matches = (await products.search(q)).slice(0, 6);
      searchResults.style.display = 'block';
      searchResults.innerHTML = matches.length
        ? matches.map((p) => `
            <a class="search-suggest__item" href="${CONFIG.ROUTES.product}?slug=${p.slug}">
              <img src="${p.images[0]}" alt="">
              <span>${p.name}</span>
            </a>`).join('')
        : '<div class="search-suggest__item">No matches found.</div>';
    }, 250);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `${CONFIG.ROUTES.search}?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  // Mega menu hover
  const trigger = root.querySelector('.mega-menu-trigger');
  const menu = root.querySelector('.mega-menu');
  if (trigger && menu) {
    trigger.addEventListener('mouseenter', () => { menu.style.display = 'grid'; });
    trigger.addEventListener('mouseleave', () => { menu.style.display = 'none'; });
  }

  // Mobile drawer
  const mobileDrawer = root.querySelector('#mobile-drawer');
  root.querySelector('#nav-mobile-toggle')?.addEventListener('click', () => mobileDrawer.classList.add('is-open'));
  root.querySelector('#mobile-drawer-close')?.addEventListener('click', () => mobileDrawer.classList.remove('is-open'));
  mobileDrawer?.addEventListener('click', (e) => { if (e.target === mobileDrawer) mobileDrawer.classList.remove('is-open'); });

  // Cart drawer
  const cartDrawer = root.querySelector('#cart-drawer');
  root.querySelector('#nav-cart-toggle')?.addEventListener('click', () => cartDrawer.classList.add('is-open'));
  root.querySelector('#cart-drawer-close')?.addEventListener('click', () => cartDrawer.classList.remove('is-open'));
  cartDrawer?.addEventListener('click', (e) => { if (e.target === cartDrawer) cartDrawer.classList.remove('is-open'); });

  // Dark mode toggle
  const themeToggle = root.querySelector('#nav-theme-toggle');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
  };
  applyTheme(storage.get(CONFIG.STORAGE_KEYS.theme, 'light'));
  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    storage.set(CONFIG.STORAGE_KEYS.theme, next);
    applyTheme(next);
  });
}
