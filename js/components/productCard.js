/**
 * productCard.js
 * ----------------------------------------------------------------------------
 * Renders product cards used on Home, Collections, Search, Wishlist and
 * Related Products. `mountProductGrid` handles both the HTML output and the
 * event wiring (wishlist toggle + quick add), so any page can just call it.
 * ----------------------------------------------------------------------------
 */

import { products } from '../services/products.js';
import { wishlist } from '../services/wishlist.js';
import { cart } from '../services/cart.js';
import { showToast } from './toast.js';
import { CONFIG } from '../services/config.js';

function badge(product) {
  if (product.tags?.includes('bestseller')) return '<span class="product-card__badge">Bestseller</span>';
  if (product.tags?.includes('new-arrival')) return '<span class="product-card__badge">New</span>';
  if (product.discount) return `<span class="product-card__badge">${product.discount}% OFF</span>`;
  return '';
}

export function productCardHtml(product) {
  const finalPrice = products.finalPrice(product);
  const isWishlisted = wishlist.has(product.id);
  const currency = CONFIG.BUSINESS.currency;

  return `
    <article class="product-card reveal" data-product-id="${product.id}">
      <a href="/pages/product/index.html?slug=${product.slug}" class="product-card__link">
        <div class="product-card__media">
          <img src="${product.images[0]}" alt="${product.name}" loading="lazy" width="600" height="800">
          ${badge(product)}
        </div>
      </a>
      <button class="product-card__wishlist ${isWishlisted ? 'is-active' : ''}" data-wishlist-toggle="${product.id}" aria-label="Toggle wishlist">
        ${isWishlisted ? '♥' : '♡'}
      </button>
      <div class="product-card__quick-add">
        <button class="btn btn-primary btn-block" data-quick-add="${product.id}">Add to Cart</button>
      </div>
      <div class="product-card__body">
        <a href="/pages/product/index.html?slug=${product.slug}">
          <p class="product-card__category">${product.fabric}</p>
          <h3 class="product-card__title">${product.name}</h3>
        </a>
        <div class="product-card__rating">
          <span class="stars">★</span> ${product.rating}
        </div>
        <div class="product-card__price">
          <span class="current">${currency}${finalPrice.toLocaleString('en-IN')}</span>
          ${product.discount ? `<span class="original">${currency}${product.price.toLocaleString('en-IN')}</span><span class="discount">${product.discount}% off</span>` : ''}
        </div>
      </div>
    </article>
  `;
}

/**
 * Render a list of products into `container` and wire up wishlist / add
 * to cart interactions. Safe to call repeatedly (e.g. on filter change).
 */
export function mountProductGrid(container, list) {
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No sarees found</h3>
        <p class="mt-2">Try adjusting your filters or search terms.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(productCardHtml).join('');

  container.querySelectorAll('[data-wishlist-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.wishlistToggle;
      const active = wishlist.toggle(id);
      btn.classList.toggle('is-active', active);
      btn.textContent = active ? '♥' : '♡';
      showToast(active ? 'Added to wishlist' : 'Removed from wishlist', 'success');
    });
  });

  container.querySelectorAll('[data-quick-add]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = btn.dataset.quickAdd;
      await cart.addItem(id, 1);
      showToast('Added to cart', 'success');
    });
  });

  // Trigger reveal-on-scroll for newly injected cards.
  window.dispatchEvent(new CustomEvent('reveal:refresh'));
}
