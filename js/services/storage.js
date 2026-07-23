/**
 * storage.js
 * ----------------------------------------------------------------------------
 * Safe wrapper around window.localStorage.
 * Never store payment information here — only temporary customer progress
 * (cart, wishlist, recently viewed, theme preference, checkout draft).
 * ----------------------------------------------------------------------------
 */

function isAvailable() {
  try {
    const testKey = '__ploom_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

const STORAGE_OK = isAvailable();

export const storage = {
  get(key, fallback = null) {
    if (!STORAGE_OK) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[storage] Failed to read "${key}"`, err);
      return fallback;
    }
  },

  set(key, value) {
    if (!STORAGE_OK) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storage] Failed to write "${key}"`, err);
      return false;
    }
  },

  remove(key) {
    if (!STORAGE_OK) return;
    window.localStorage.removeItem(key);
  },

  isAvailable: STORAGE_OK,
};
