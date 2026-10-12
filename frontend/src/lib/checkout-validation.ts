/**
 * Checkout field rules. The pattern strings are the Phase 1 ones, used both as the HTML `pattern` attribute
 * (kept on the inputs) and, anchored, by the inline validation here.
 */
export const PHONE_PATTERN = '(\\+?91[\\s\\-]?|0)?[6-9][0-9]{4}[\\s\\-]?[0-9]{5}';
export const PIN_PATTERN = '[1-9][0-9]{5}';

const phoneRe = new RegExp(`^(?:${PHONE_PATTERN})$`);
const pinRe = new RegExp(`^(?:${PIN_PATTERN})$`);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutFields = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
};
export type CheckoutFieldName = keyof CheckoutFields;
export type CheckoutErrors = Partial<Record<CheckoutFieldName, string>>;

export const CHECKOUT_FIELD_ORDER: CheckoutFieldName[] = [
  'customerName',
  'customerEmail',
  'customerPhone',
  'shippingAddress',
  'city',
  'postalCode',
];

/** Returns an error message per invalid field (empty object when everything is valid). */
export function validateCheckout(f: CheckoutFields): CheckoutErrors {
  const e: CheckoutErrors = {};
  if (!f.customerName.trim()) e.customerName = 'Enter your full name';
  if (!f.customerEmail.trim()) e.customerEmail = 'Enter your email address';
  else if (!emailRe.test(f.customerEmail.trim())) e.customerEmail = 'Enter a valid email address';
  if (!f.customerPhone.trim()) e.customerPhone = 'Enter your phone number';
  else if (!phoneRe.test(f.customerPhone.trim())) e.customerPhone = 'Enter a valid 10-digit Indian mobile number';
  if (!f.shippingAddress.trim()) e.shippingAddress = 'Enter the delivery address';
  if (!f.city.trim()) e.city = 'Enter the city';
  if (!f.postalCode.trim()) e.postalCode = 'Enter the PIN code';
  else if (!pinRe.test(f.postalCode.trim())) e.postalCode = 'Enter a valid 6-digit PIN code';
  return e;
}
