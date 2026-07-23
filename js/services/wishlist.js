/**
 * wishlist.js
 * ----------------------------------------------------------------------------
 * Wishlist state, persisted to localStorage. Mirrors cart.js's pub/sub
 * pattern via a 'wishlist:change' CustomEvent.
 * ----------------------------------------------------------------------------
 */

import { storage } from './storage.js';
import { CONFIG } from './config.js';
import { products } from './products.js';

const KEY = CONFIG.STORAGE_KEYS.wishlist;

function read() {
  return storage.get(KEY, []);
}

function write(ids) {
  storage.set(KEY, ids);
  window.dispatchEvent(new CustomEvent('wishlist:change', { detail: { ids } }));
}

export const wishlist = {
  getIds() {
    return read();
  },

  has(productId) {
    return read().includes(productId);
  },

  toggle(productId) {
    const ids = read();
    const idx = ids.indexOf(productId);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(productId);
    write(ids);
    return ids.includes(productId);
  },

  remove(productId) {
    write(read().filter((id) => id !== productId));
  },

  count() {
    return read().length;
  },

  async hydrate() {
    const ids = read();
    const catalog = await products.all();
    return ids.map((id) => catalog.find((p) => p.id === id)).filter(Boolean);
  },
};
