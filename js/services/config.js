/**
 * config.js
 * ----------------------------------------------------------------------------
 * Single source of truth for environment configuration.
 *
 * IMPORTANT: This is the ONLY file that should ever change when you swap the
 * backend from Google Apps Script to a future Node.js + Express + MongoDB
 * service. Nothing else in /js/services or /js/components should read
 * environment values directly — they always go through CONFIG.
 * ----------------------------------------------------------------------------
 */

export const CONFIG = Object.freeze({
  // Toggle between backends without touching any other file.
  // 'gas'   -> Google Apps Script + Google Sheets (current production backend)
  // 'node'  -> future Node.js + Express + MongoDB backend
  BACKEND: 'gas',

  API: {
    // Replace with your deployed Google Apps Script Web App /exec URL.
    gasBaseUrl: 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec',
    // Future Node backend base URL (same route shape as GAS actions below).
    nodeBaseUrl: 'https://api.theprintloom.example.com',
    timeoutMs: 15000,
  },

  RAZORPAY: {
    // Public key only. The secret key must NEVER exist in frontend code —
    // it lives only inside the Google Apps Script project properties.
    keyId: 'rzp_test_XXXXXXXXXXXX',
  },

  STORAGE_KEYS: {
    cart: 'ploom_cart_v1',
    wishlist: 'ploom_wishlist_v1',
    recentlyViewed: 'ploom_recently_viewed_v1',
    theme: 'ploom_theme_v1',
    checkoutDraft: 'ploom_checkout_draft_v1',
    lastOrder: 'ploom_last_order_v1',
  },

  BUSINESS: {
    freeShippingThreshold: 2000,
    flatShippingRate: 79,
    currency: '₹',
    recentlyViewedLimit: 8,
  },

  ROUTES: {
    home: '/index.html',
    collections: '/pages/collections/index.html',
    product: '/pages/product/index.html',
    cart: '/pages/cart/index.html',
    checkout: '/pages/checkout/index.html',
    wishlist: '/pages/wishlist/index.html',
    about: '/pages/about/index.html',
    contact: '/pages/contact/index.html',
    profile: '/pages/profile/index.html',
    orderSuccess: '/pages/order-success/index.html',
    search: '/pages/search/index.html',
    notFound: '/pages/404/index.html',
  },
});

/** Resolve the active API base URL according to the selected backend. */
export function getApiBaseUrl() {
  return CONFIG.BACKEND === 'node' ? CONFIG.API.nodeBaseUrl : CONFIG.API.gasBaseUrl;
}
