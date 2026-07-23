/**
 * checkout.js
 * ----------------------------------------------------------------------------
 * Manages the checkout draft (customer details persisted temporarily so a
 * refresh doesn't lose form progress) and assembles the final order payload
 * sent to the backend via services/payment.js -> services/api.js.
 * ----------------------------------------------------------------------------
 */

import { storage } from './storage.js';
import { CONFIG } from './config.js';
import { cart } from './cart.js';
import { validateForm, validators } from './validation.js';

const KEY = CONFIG.STORAGE_KEYS.checkoutDraft;

export const checkoutSchema = {
  name: validators.name,
  phone: validators.phone,
  email: validators.email,
  address: validators.address,
  city: validators.city,
  state: validators.state,
  pincode: validators.pincode,
};

export const checkout = {
  getDraft() {
    return storage.get(KEY, {
      name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', notes: '',
    });
  },

  saveDraft(partial) {
    const draft = { ...checkout.getDraft(), ...partial };
    storage.set(KEY, draft);
    return draft;
  },

  clearDraft() {
    storage.remove(KEY);
  },

  validate(draft) {
    return validateForm(draft, checkoutSchema);
  },

  /** Assemble the full order payload the backend expects. */
  async buildOrderDraft(customer, { paymentMethod, couponCode = null, couponDiscount = 0 }) {
    const lines = await cart.hydrate();
    const totals = await cart.totals(couponDiscount);

    return {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.replace(/\D/g, ''),
        email: customer.email.trim(),
        address: customer.address.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        pincode: customer.pincode.trim(),
        notes: customer.notes?.trim() || '',
      },
      items: lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        size: l.size,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
      })),
      couponCode,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      discount: totals.discount,
      grandTotal: totals.grandTotal,
      paymentMethod, // 'cod' | 'online'
    };
  },
};
