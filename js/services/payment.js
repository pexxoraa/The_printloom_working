/**
 * payment.js
 * ----------------------------------------------------------------------------
 * Orchestrates the two payment flows described in the architecture:
 *
 *  Cash on Delivery:
 *    frontend -> api.saveOrder() -> Apps Script writes to Sheet + WhatsApp
 *
 *  Online Payment (Razorpay):
 *    frontend -> api.createOrder() -> Apps Script creates Razorpay order
 *    -> open Razorpay Checkout -> customer pays
 *    -> frontend gets payment success -> api.verifyPayment() -> Apps Script
 *       verifies signature, writes to Sheet + WhatsApp
 *
 * The Razorpay *secret* key is never referenced here — only the public
 * Key ID (CONFIG.RAZORPAY.keyId), matching the "never expose secret key in
 * frontend" requirement.
 * ----------------------------------------------------------------------------
 */

import { CONFIG } from './config.js';
import { api } from './api.js';

let razorpayScriptPromise = null;

function loadRazorpayScript() {
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.head.appendChild(script);
  });
  return razorpayScriptPromise;
}

export const payment = {
  /** Cash on Delivery — no gateway involved. */
  async payWithCod(orderDraft) {
    return api.saveOrder(orderDraft);
  },

  /**
   * Online payment via Razorpay Checkout. Resolves with the server-verified
   * order result, or rejects if the customer cancels / verification fails.
   */
  async payWithRazorpay(orderDraft, customer) {
    await loadRazorpayScript();

    const { razorpayOrderId, amount, currency } = await api.createOrder(orderDraft);

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: CONFIG.RAZORPAY.keyId,
        order_id: razorpayOrderId,
        amount,
        currency: currency || 'INR',
        name: 'The Print Loom',
        description: 'Order payment',
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: '#5E1120' },
        handler: async (response) => {
          try {
            const result = await api.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderDraft,
            });
            resolve(result);
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment was cancelled.')),
        },
      });

      rzp.on('payment.failed', (resp) => {
        reject(new Error(resp?.error?.description || 'Payment failed. Please try again.'));
      });

      rzp.open();
    });
  },
};
