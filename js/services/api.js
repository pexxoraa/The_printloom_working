/**
 * api.js
 * ----------------------------------------------------------------------------
 * All network communication with the backend goes through this file.
 * UI components and pages must NEVER call `fetch` directly against Google
 * Apps Script (or, later, Node.js) — they only call the functions exported
 * here. That indirection is what lets us swap GAS for Node + Express +
 * MongoDB later without touching a single UI component.
 *
 * Google Apps Script Web Apps only expose doGet/doPost, so we simulate a
 * REST-ish interface by sending an `action` field in the request body/query
 * and letting Code.gs route it (see /backend/Code.gs).
 * ----------------------------------------------------------------------------
 */

import { CONFIG, getApiBaseUrl } from './config.js';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Low-level request helper. Google Apps Script Web Apps respond fastest to
 * simple POST requests with a text/plain content type (avoids CORS
 * preflight, since GAS does not support OPTIONS). We always POST an
 * `action` + `payload` envelope and parse JSON back.
 */
async function request(action, payload = {}, { method = 'POST' } = {}) {
  const base = getApiBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.API.timeoutMs);

  try {
    let url = base;
    const init = {
      method,
      signal: controller.signal,
    };

    if (method === 'GET') {
      const qs = new URLSearchParams({ action, ...flatten(payload) }).toString();
      url = `${base}?${qs}`;
    } else {
      // text/plain avoids a CORS preflight against Apps Script deployments.
      init.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      init.body = JSON.stringify({ action, payload });
    }

    const response = await fetch(url, init);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError('Invalid JSON response from server', response.status, text);
    }

    if (!response.ok || data?.success === false) {
      throw new ApiError(data?.message || 'Request failed', response.status, data);
    }

    return data?.data ?? data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 0);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error', 0);
  } finally {
    clearTimeout(timeout);
  }
}

function flatten(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    out[k] = typeof v === 'object' ? JSON.stringify(v) : v;
  });
  return out;
}

/* ------------------------------------------------------------------------ */
/*  Public API surface — this is what pages/components/services import.     */
/* ------------------------------------------------------------------------ */

export const api = {
  /** Fetch product catalog. Falls back to local /data/products.json in dev. */
  async getProducts() {
    try {
      return await request('getProducts', {}, { method: 'GET' });
    } catch (err) {
      console.warn('[api.getProducts] Falling back to local data/products.json', err.message);
      const res = await fetch('/data/products.json');
      const json = await res.json();
      return json.products;
    }
  },

  /** Fetch site-wide settings (shipping rules, coupons, brand info). */
  async getSettings() {
    try {
      return await request('getSettings', {}, { method: 'GET' });
    } catch (err) {
      console.warn('[api.getSettings] Falling back to local data/settings.json', err.message);
      const res = await fetch('/data/settings.json');
      return res.json();
    }
  },

  /**
   * Create a Razorpay order server-side (Apps Script holds the Razorpay
   * secret). Returns { razorpayOrderId, amount, currency }.
   */
  async createOrder(orderDraft) {
    return request('createOrder', orderDraft);
  },

  /**
   * Verify a completed Razorpay payment signature server-side, persist the
   * order in Google Sheets, and trigger the WhatsApp notification.
   */
  async verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderDraft }) {
    return request('verifyPayment', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderDraft,
    });
  },

  /**
   * Persist a Cash-on-Delivery order directly (no payment gateway involved).
   */
  async saveOrder(orderDraft) {
    return request('saveOrder', orderDraft);
  },

  /** Subscribe an email to the newsletter list. */
  async subscribeNewsletter(email) {
    return request('subscribeNewsletter', { email });
  },

  /** Submit the contact form. */
  async sendContactMessage(payload) {
    return request('sendContactMessage', payload);
  },
};

export { ApiError };
