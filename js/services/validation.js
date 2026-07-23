/**
 * validation.js
 * ----------------------------------------------------------------------------
 * Small, dependency-free validators. Each returns null when valid, or a
 * human-readable error string when invalid — designed to plug straight into
 * a .form-error element next to any field.
 * ----------------------------------------------------------------------------
 */

export const validators = {
  required(value, label = 'This field') {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${label} is required.`;
    }
    return null;
  },

  name(value) {
    if (!value || value.trim().length < 2) return 'Please enter your full name.';
    if (!/^[a-zA-Z\s.'-]+$/.test(value)) return 'Name can only contain letters.';
    return null;
  },

  phone(value) {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length !== 10) return 'Enter a valid 10-digit mobile number.';
    if (!/^[6-9]/.test(digits)) return 'Enter a valid Indian mobile number.';
    return null;
  },

  email(value) {
    if (!value) return 'Email is required.';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return 'Enter a valid email address.';
    return null;
  },

  pincode(value) {
    if (!/^\d{6}$/.test(value || '')) return 'Enter a valid 6-digit pincode.';
    return null;
  },

  address(value) {
    if (!value || value.trim().length < 8) return 'Please enter your complete address.';
    return null;
  },

  city(value) {
    if (!value || value.trim().length < 2) return 'Please enter your city.';
    return null;
  },

  state(value) {
    if (!value || value.trim().length < 2) return 'Please select your state.';
    return null;
  },

  minLength(value, min, label = 'This field') {
    if (!value || value.trim().length < min) return `${label} must be at least ${min} characters.`;
    return null;
  },
};

/**
 * Validate a form object against a schema of { field: validatorFn }.
 * Returns { valid: boolean, errors: { field: message } }.
 */
export function validateForm(data, schema) {
  const errors = {};
  Object.entries(schema).forEach(([field, validatorFn]) => {
    const message = validatorFn(data[field]);
    if (message) errors[field] = message;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}
