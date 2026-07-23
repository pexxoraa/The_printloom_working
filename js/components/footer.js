/**
 * footer.js
 * ----------------------------------------------------------------------------
 * Renders the shared footer into #site-footer, including the newsletter
 * subscription form wired to api.subscribeNewsletter().
 * ----------------------------------------------------------------------------
 */

import { CONFIG } from '../services/config.js';
import { api } from '../services/api.js';
import { showToast } from './toast.js';

export function renderFooter(root) {
  const year = new Date().getFullYear();

  root.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h3 class="font-display" style="color:var(--color-on-maroon);font-size:1.4rem;">The Print Loom</h3>
            <p class="mt-3" style="color:rgba(246,236,228,0.78);max-width:32ch;">
              Handloom soul, digital precision. Premium digital print sarees crafted for the modern Indian woman.
            </p>
            <div class="row gap-3 mt-5">
              <a href="https://instagram.com" aria-label="Instagram" style="color:var(--color-on-maroon);">Instagram</a>
              <a href="https://facebook.com" aria-label="Facebook" style="color:var(--color-on-maroon);">Facebook</a>
              <a href="https://pinterest.com" aria-label="Pinterest" style="color:var(--color-on-maroon);">Pinterest</a>
            </div>
          </div>

          <div>
            <p class="eyebrow" style="color:var(--color-gold-light);">Shop</p>
            <nav class="stack mt-3 gap-2" style="color:rgba(246,236,228,0.85);">
              <a href="${CONFIG.ROUTES.collections}?category=cat-silk">Digital Silk Sarees</a>
              <a href="${CONFIG.ROUTES.collections}?category=cat-georgette">Georgette Sarees</a>
              <a href="${CONFIG.ROUTES.collections}?category=cat-bridal">Bridal Edit</a>
              <a href="${CONFIG.ROUTES.collections}">All Collections</a>
            </nav>
          </div>

          <div>
            <p class="eyebrow" style="color:var(--color-gold-light);">Company</p>
            <nav class="stack mt-3 gap-2" style="color:rgba(246,236,228,0.85);">
              <a href="${CONFIG.ROUTES.about}">About Us</a>
              <a href="${CONFIG.ROUTES.contact}">Contact</a>
              <a href="${CONFIG.ROUTES.profile}">Track Order</a>
            </nav>
          </div>

          <div>
            <p class="eyebrow" style="color:var(--color-gold-light);">Stay in the loop</p>
            <p class="mt-3" style="color:rgba(246,236,228,0.78);font-size:0.9rem;">Get early access to new arrivals and festive edits.</p>
            <form id="footer-newsletter-form" class="row gap-2 mt-4">
              <input type="email" required placeholder="Your email" class="form-input" style="background:rgba(255,255,255,0.08);border-color:rgba(246,236,228,0.24);color:var(--color-on-maroon);" aria-label="Email for newsletter">
              <button type="submit" class="btn btn-gold">Join</button>
            </form>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© ${year} The Print Loom. Built by Pexxoraa. All rights reserved.</span>
          <span>Guest checkout · Cash on Delivery · Secure Online Payments</span>
        </div>
      </div>
    </footer>
  `;

  root.querySelector('#footer-newsletter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    try {
      await api.subscribeNewsletter(input.value.trim());
      showToast('Subscribed! Watch your inbox for new arrivals.', 'success');
      input.value = '';
    } catch (err) {
      showToast(err.message || 'Could not subscribe right now.', 'error');
    }
  });
}
