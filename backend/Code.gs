/**
 * Code.gs
 * ============================================================================
 * THE PRINT LOOM — Google Apps Script Backend
 * ============================================================================
 * Deploy this as a Web App (Deploy > New deployment > Web app):
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the resulting /exec URL into js/services/config.js -> CONFIG.API.gasBaseUrl
 *
 * Required Script Properties (Project Settings > Script Properties):
 *   RAZORPAY_KEY_ID        - Razorpay public key id
 *   RAZORPAY_KEY_SECRET    - Razorpay secret key (NEVER put this in frontend)
 *   WHATSAPP_PHONE_ID      - Meta WhatsApp Cloud API phone_number_id
 *   WHATSAPP_ACCESS_TOKEN  - Meta WhatsApp Cloud API permanent access token
 *   WHATSAPP_TO_NUMBER     - Business WhatsApp number to notify (E.164, no +)
 *   SPREADSHEET_ID         - ID of the Google Sheet used as the order database
 *
 * Required Sheet: a tab named "Orders" with header row matching ORDER_HEADERS
 * below (row 1). A "Newsletter" tab and "Messages" tab are auto-created if
 * missing.
 * ============================================================================
 */

const ORDER_HEADERS = [
  'Order ID', 'Date', 'Time', 'Customer Name', 'Phone', 'Email', 'Address',
  'City', 'State', 'Pincode', 'Products', 'Quantity', 'Subtotal',
  'Shipping Charges', 'Discount', 'Grand Total', 'Payment Method',
  'Payment Status', 'Order Status', 'Razorpay Order ID', 'Razorpay Payment ID',
];

/* ------------------------------------------------------------------------ */
/*  Entry points                                                             */
/* ------------------------------------------------------------------------ */

function doGet(e) {
  try {
    const action = e.parameter.action;
    let data;
    switch (action) {
      case 'getProducts':
        data = getProductsFromSheet_();
        break;
      case 'getSettings':
        data = getSettingsFromSheet_();
        break;
      default:
        return jsonResponse_({ success: false, message: 'Unknown GET action: ' + action });
    }
    return jsonResponse_({ success: true, data });
  } catch (err) {
    return jsonResponse_({ success: false, message: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload || {};
    let data;

    switch (action) {
      case 'createOrder':
        data = createRazorpayOrder_(payload);
        break;
      case 'verifyPayment':
        data = verifyAndSaveOnlineOrder_(payload);
        break;
      case 'saveOrder':
        data = saveCodOrder_(payload);
        break;
      case 'subscribeNewsletter':
        data = subscribeNewsletter_(payload);
        break;
      case 'sendContactMessage':
        data = saveContactMessage_(payload);
        break;
      case 'getProducts':
        data = getProductsFromSheet_();
        break;
      case 'getSettings':
        data = getSettingsFromSheet_();
        break;
      default:
        return jsonResponse_({ success: false, message: 'Unknown POST action: ' + action });
    }

    return jsonResponse_({ success: true, data });
  } catch (err) {
    return jsonResponse_({ success: false, message: err.message });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------------ */
/*  Sheet helpers                                                            */
/* ------------------------------------------------------------------------ */

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function getOrdersSheet_() {
  return getOrCreateSheet_('Orders', ORDER_HEADERS);
}

/**
 * Products are optionally mirrored into a "Products" sheet so non-technical
 * staff can update stock/pricing without touching data/products.json. If no
 * such sheet exists, the frontend's api.js already falls back to the local
 * /data/products.json file, so this endpoint is optional.
 */
function getProductsFromSheet_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('Products');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getSettingsFromSheet_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return {};
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  rows.forEach(([key, value]) => { if (key) settings[key] = value; });
  return settings;
}

/* ------------------------------------------------------------------------ */
/*  Order ID generation                                                      */
/* ------------------------------------------------------------------------ */

function generateOrderId_() {
  const sheet = getOrdersSheet_();
  const lastRow = sheet.getLastRow(); // includes header row
  const seq = String(lastRow).padStart(4, '0'); // simple incrementing sequence
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyyMMdd');
  return `PL-${today}-${seq}`;
}

/* ------------------------------------------------------------------------ */
/*  Order persistence                                                       */
/* ------------------------------------------------------------------------ */

function appendOrderRow_(orderDraft, orderId, paymentStatus, razorpayOrderId, razorpayPaymentId) {
  const sheet = getOrdersSheet_();
  const now = new Date();
  const productsSummary = orderDraft.items
    .map((i) => `${i.name} (${i.size}) x${i.quantity}`)
    .join(', ');
  const totalQty = orderDraft.items.reduce((s, i) => s + i.quantity, 0);

  sheet.appendRow([
    orderId,
    Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyy-MM-dd'),
    Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Kolkata', 'HH:mm:ss'),
    orderDraft.customer.name,
    orderDraft.customer.phone,
    orderDraft.customer.email,
    orderDraft.customer.address,
    orderDraft.customer.city,
    orderDraft.customer.state,
    orderDraft.customer.pincode,
    productsSummary,
    totalQty,
    orderDraft.subtotal,
    orderDraft.shipping,
    orderDraft.discount,
    orderDraft.grandTotal,
    orderDraft.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
    paymentStatus,
    'Placed',
    razorpayOrderId || '',
    razorpayPaymentId || '',
  ]);

  return orderId;
}

function saveCodOrder_(orderDraft) {
  const orderId = generateOrderId_();
  appendOrderRow_(orderDraft, orderId, 'Pending (COD)', '', '');
  sendWhatsAppNotification_(orderDraft, orderId);
  return { orderId };
}

/* ------------------------------------------------------------------------ */
/*  Razorpay integration                                                     */
/* ------------------------------------------------------------------------ */

function getRazorpayAuthHeader_() {
  const props = PropertiesService.getScriptProperties();
  const keyId = props.getProperty('RAZORPAY_KEY_ID');
  const keySecret = props.getProperty('RAZORPAY_KEY_SECRET');
  const token = Utilities.base64Encode(`${keyId}:${keySecret}`);
  return `Basic ${token}`;
}

function createRazorpayOrder_(orderDraft) {
  const amountPaise = Math.round(orderDraft.grandTotal * 100);

  const response = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: getRazorpayAuthHeader_() },
    payload: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: 'ploom_' + new Date().getTime(),
      notes: { customerName: orderDraft.customer.name, customerPhone: orderDraft.customer.phone },
    }),
    muteHttpExceptions: true,
  });

  const result = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200) {
    throw new Error(result.error && result.error.description ? result.error.description : 'Failed to create Razorpay order.');
  }

  return {
    razorpayOrderId: result.id,
    amount: result.amount,
    currency: result.currency,
  };
}

function verifyAndSaveOnlineOrder_(payload) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderDraft } = payload;
  const keySecret = PropertiesService.getScriptProperties().getProperty('RAZORPAY_KEY_SECRET');

  const expectedSignature = Utilities.computeHmacSha256Signature(
    `${razorpayOrderId}|${razorpayPaymentId}`,
    keySecret
  ).map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');

  if (expectedSignature !== razorpaySignature) {
    throw new Error('Payment verification failed. Signature mismatch.');
  }

  const orderId = generateOrderId_();
  appendOrderRow_(orderDraft, orderId, 'Paid', razorpayOrderId, razorpayPaymentId);
  sendWhatsAppNotification_(orderDraft, orderId);
  return { orderId, verified: true };
}

/* ------------------------------------------------------------------------ */
/*  WhatsApp notification (Meta WhatsApp Cloud API)                         */
/* ------------------------------------------------------------------------ */

function sendWhatsAppNotification_(orderDraft, orderId) {
  try {
    const props = PropertiesService.getScriptProperties();
    const phoneId = props.getProperty('WHATSAPP_PHONE_ID');
    const token = props.getProperty('WHATSAPP_ACCESS_TOKEN');
    const toNumber = props.getProperty('WHATSAPP_TO_NUMBER');
    if (!phoneId || !token || !toNumber) return; // Not configured yet — skip silently.

    const productsSummary = orderDraft.items
      .map((i) => `• ${i.name} (${i.size}) x${i.quantity}`)
      .join('\n');

    const message = [
      `*New Order — ${orderId}*`,
      `Customer: ${orderDraft.customer.name}`,
      `Phone: ${orderDraft.customer.phone}`,
      ``,
      `Products:`,
      productsSummary,
      ``,
      `Address: ${orderDraft.customer.address}, ${orderDraft.customer.city}, ${orderDraft.customer.state} - ${orderDraft.customer.pincode}`,
      `Grand Total: ₹${orderDraft.grandTotal}`,
      `Payment: ${orderDraft.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Paid)'}`,
    ].join('\n');

    UrlFetchApp.fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${token}` },
      payload: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toNumber,
        type: 'text',
        text: { body: message },
      }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    // Never let a notification failure block order confirmation.
    console.error('WhatsApp notification failed: ' + err.message);
  }
}

/* ------------------------------------------------------------------------ */
/*  Newsletter & contact form                                                */
/* ------------------------------------------------------------------------ */

function subscribeNewsletter_(payload) {
  const sheet = getOrCreateSheet_('Newsletter', ['Email', 'Subscribed At']);
  sheet.appendRow([payload.email, new Date()]);
  return { subscribed: true };
}

function saveContactMessage_(payload) {
  const sheet = getOrCreateSheet_('Messages', ['Name', 'Email', 'Subject', 'Message', 'Received At']);
  sheet.appendRow([payload.name, payload.email, payload.subject, payload.message, new Date()]);
  return { received: true };
}
