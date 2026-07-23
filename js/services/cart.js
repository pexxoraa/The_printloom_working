/**
 * cart.js
 * ----------------------------------------------------------------------------
 * Shopping cart state, persisted to localStorage. Emits a 'cart:change'
 * CustomEvent on window whenever the cart mutates, so any component
 * (navbar badge, cart drawer, cart page) can stay in sync without a
 * framework.
 * ----------------------------------------------------------------------------
 */

import { storage } from './storage.js';
import { CONFIG } from './config.js';
import { products } from './products.js';

const KEY = CONFIG.STORAGE_KEYS.cart;

function read() {
  return storage.get(KEY, []);
}

function write(items) {
  storage.set(KEY, items);
  window.dispatchEvent(new CustomEvent('cart:change', { detail: { items } }));
}

export const cart = {
  getItems() {
    return read();
  },

  count() {
    return read().reduce((sum, i) => sum + i.quantity, 0);
  },

  async addItem(productId, quantity = 1, size = 'Free Size') {
    const items = read();
    const existing = items.find((i) => i.productId === productId && i.size === size);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, size, quantity, addedAt: Date.now() });
    }
    write(items);
    return items;
  },

  updateQuantity(productId, size, quantity) {
    let items = read();
    if (quantity <= 0) {
      items = items.filter((i) => !(i.productId === productId && i.size === size));
    } else {
      const line = items.find((i) => i.productId === productId && i.size === size);
      if (line) line.quantity = quantity;
    }
    write(items);
    return items;
  },

  removeItem(productId, size) {
    const items = read().filter((i) => !(i.productId === productId && i.size === size));
    write(items);
    return items;
  },

  clear() {
    write([]);
  },

  /** Hydrate cart line items with full product data for rendering. */
  async hydrate() {
    const items = read();
    const catalog = await products.all();
    return items
      .map((line) => {
        const product = catalog.find((p) => p.id === line.productId);
        if (!product) return null;
        const unitPrice = products.finalPrice(product);
        return {
          ...line,
          product,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        };
      })
      .filter(Boolean);
  },

  async totals(couponDiscount = 0) {
    const lines = await cart.hydrate();
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const shipping = subtotal === 0 || subtotal >= CONFIG.BUSINESS.freeShippingThreshold
      ? 0
      : CONFIG.BUSINESS.flatShippingRate;
    const discount = couponDiscount;
    const grandTotal = Math.max(subtotal + shipping - discount, 0);
    return { subtotal, shipping, discount, grandTotal, itemCount: lines.length };
  },
};
