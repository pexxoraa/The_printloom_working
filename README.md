# The Print Loom — E-commerce Platform

A production-ready, serverless e-commerce frontend for **The Print Loom** (Digital Print Saree brand), built for **Pexxoraa**.

```
Frontend (GitHub Pages)
        ↓
Google Apps Script (REST-style API)
        ↓
Google Sheets (Database)
        ↓
Razorpay (Payments)
        ↓
WhatsApp Business Notification
```

---

## 1. What's included

- **Vanilla JS, ES6 modules** — no framework, no build step required.
- **Full page set**: Home, Collections, Product Detail, Search, Wishlist, Cart, Checkout, About, Contact, Track Order (guest), Order Success, 404.
- **Guest checkout only** — no login/signup, matching the brief.
- **Cart & Wishlist** persisted in `localStorage` (never payment data).
- **Google Apps Script backend** (`/backend/Code.gs`) — Razorpay order creation & signature verification, Google Sheets order storage, WhatsApp Cloud API notification, newsletter + contact form storage.
- **Swap-ready API layer** (`/js/services/api.js` + `/js/services/config.js`) — flip one flag to move from Apps Script to a future Node.js + Express + MongoDB backend without touching any UI code.
- 14 sample products across 6 categories in `/data/products.json` — replace with real photography and copy before launch.

---

## 2. Running it locally

This is a static site — any static file server works. From the project root:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`.

> **Note:** product images currently point to `picsum.photos` placeholders. Replace every `images` array in `data/products.json` with real product photography before going live (see Section 6).

---

## 3. Connecting the Google Apps Script backend

### 3.1 Create the Google Sheet
1. Create a new Google Sheet. This is your database.
2. Copy its **Spreadsheet ID** from the URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
3. You do not need to manually create the `Orders`, `Newsletter`, or `Messages` tabs — `Code.gs` creates them automatically on first write, with the correct headers.
4. Optional: add a `Products` tab and a `Settings` tab (key/value, one row per setting) if you want to manage the catalog from the Sheet instead of `data/products.json`. If absent, the frontend safely falls back to the local JSON files.

### 3.2 Deploy the Apps Script
1. Open [script.google.com](https://script.google.com), create a new project.
2. Paste the contents of `/backend/Code.gs` into `Code.gs`.
3. Go to **Project Settings → Script Properties** and add:

   | Property | Value |
   |---|---|
   | `SPREADSHEET_ID` | the Sheet ID from step 3.1 |
   | `RAZORPAY_KEY_ID` | your Razorpay Key ID |
   | `RAZORPAY_KEY_SECRET` | your Razorpay Key Secret — **never put this in frontend code** |
   | `WHATSAPP_PHONE_ID` | Meta WhatsApp Cloud API `phone_number_id` |
   | `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API access token |
   | `WHATSAPP_TO_NUMBER` | your business WhatsApp number, E.164 without `+` |

4. **Deploy → New deployment → Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the generated `/exec` URL.

### 3.3 Point the frontend at your deployment
Open `js/services/config.js` and set:

```js
API: {
  gasBaseUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  ...
}
```

Also set your **public** Razorpay key in the same file:

```js
RAZORPAY: {
  keyId: 'rzp_live_XXXXXXXXXXXX',
}
```

> The Razorpay **secret** key lives only in Apps Script's Script Properties — it is never referenced anywhere in `/js` or any HTML file.

### 3.4 WhatsApp notifications
`sendWhatsAppNotification_()` in `Code.gs` uses the official **Meta WhatsApp Cloud API**. If you use a different WhatsApp provider (e.g. Gupshup, Interakt, Twilio), replace the `UrlFetchApp.fetch` call in that function with your provider's send-message endpoint — everything else in the order flow stays the same. If the WhatsApp properties are left unset, order-saving still works; the notification step is skipped silently rather than failing the order.

---

## 4. Payment flow reference

**Cash on Delivery**
```
Frontend → api.saveOrder() → Apps Script → generate Order ID
        → append row to "Orders" sheet → WhatsApp notify → success response
```

**Online Payment (Razorpay)**
```
Frontend → api.createOrder() → Apps Script creates Razorpay order (secret stays server-side)
        → Razorpay Checkout opens in browser → customer pays
        → Frontend gets payment success → api.verifyPayment()
        → Apps Script verifies HMAC signature → append row to "Orders" sheet
        → WhatsApp notify → success response → Order Success page
```

---

## 5. Migrating from Google Apps Script to Node.js + Express + MongoDB later

Only two things need to change — **no UI component or page should require edits**:

1. In `js/services/config.js`, set `BACKEND: 'node'` and fill in `API.nodeBaseUrl`.
2. Implement matching REST routes on your Node server for each action currently routed through Apps Script's `action` field:
   - `GET /products` ↔ `getProducts`
   - `GET /settings` ↔ `getSettings`
   - `POST /orders/create` ↔ `createOrder`
   - `POST /orders/verify` ↔ `verifyPayment`
   - `POST /orders` ↔ `saveOrder`
   - `POST /newsletter` ↔ `subscribeNewsletter`
   - `POST /contact` ↔ `sendContactMessage`

   The simplest path is to keep `api.js`'s envelope shape (`{ action, payload }` in, `{ success, data }` out) so `api.js` itself needs no changes beyond the base URL and request method per route — see the comments inside `request()` in `api.js` for exactly where to adjust if you want conventional REST verbs/paths instead.
3. Swap Google Sheets writes for MongoDB writes in your new backend, keeping the same field names as `ORDER_HEADERS` in `Code.gs` so nothing else in the data pipeline (WhatsApp message formatting, admin exports, etc.) needs to change.

---

## 6. Before launch checklist

- [ ] Replace every placeholder image URL (`picsum.photos/...`) in `data/products.json`, `data/categories.json`, and page HTML files with real, optimized product photography.
- [ ] Replace `rzp_test_XXXXXXXXXXXX` with your live Razorpay Key ID in `js/services/config.js` (test key is safe to ship to a repo; a **live secret key must never appear anywhere in this repo**).
- [ ] Update `data/settings.json` and `/backend/Code.gs`'s WhatsApp properties with your real support phone/email/address.
- [ ] Update every `https://theprintloom.example.com` canonical/OG URL once your real domain is live, and regenerate `sitemap.xml` to include one `<url>` entry per product slug.
- [ ] If deploying to a GitHub **Project** Pages URL (`username.github.io/repo-name`) rather than a custom domain or User Pages site, note that this project uses **root-relative paths** (`/css/...`, `/js/...`, `/pages/...`). Either deploy at the domain root, or add a `<base href="/repo-name/">` tag to every page's `<head>`, or run a find/replace to convert paths to relative — pick whichever suits your hosting setup.
- [ ] Swap the inline `⛃ ♡ ☰` glyph icons in `navbar.js` for a proper icon set/SVG sprite if you want a more polished icon language.
- [ ] Wire up `getOrderStatus` in `Code.gs` + the Track Order form in `pages/profile/index.html` (currently UI-complete but not yet connected — see the comment in that file) once you're ready to support guest order lookup.

---

## 7. Folder structure

```
/assets            Images, icons, fonts
/css                variables · base · layout · components · pages · animations · utilities
/js
  app.js            Shared chrome bootstrap (navbar, footer, scroll reveal, back-to-top)
  router.js         Query-param helpers (multi-page site, not an SPA router)
  /components       navbar · footer · productCard · modal · loader · toast · pagination
  /services         api · cart · wishlist · checkout · payment · storage · validation · products · config
/data               products.json · categories.json · settings.json
/pages              home(redirect) · collections · product · cart · checkout · wishlist · about · contact · profile · order-success · search · 404
/backend            Code.gs — Google Apps Script backend reference implementation
```

Built by **Pexxoraa** for **The Print Loom**.
