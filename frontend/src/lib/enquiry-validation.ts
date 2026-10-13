
export type EnquiryFieldName = 'customerName' | 'customerPhone' | 'customerEmail' | 'quantity' | 'message';
export type EnquiryErrors = Partial<Record<EnquiryFieldName, string>>;

/** Mirrors the backend's normalizeIndianPhone: spaces, dashes and a +91 / 91 / 0 prefix are accepted. */
export function isValidIndianPhone(raw: string): boolean {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits);
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ENQUIRY_FIELD_ORDER: EnquiryFieldName[] = ['customerName', 'customerPhone', 'customerEmail', 'quantity', 'message'];

type Fields = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  quantity?: string;
  message: string;
};

/** Same phone rule as the backend / checkout. Email, quantity and (optionally) message are only checked when filled. */
export function validateEnquiry(f: Fields, opts: { messageRequired?: boolean } = {}): EnquiryErrors {
  const e: EnquiryErrors = {};
  if (!f.customerName.trim()) e.customerName = 'Enter your name';
  if (!f.customerPhone.trim()) e.customerPhone = 'Enter your phone number';
  else if (!isValidIndianPhone(f.customerPhone)) e.customerPhone = 'Enter a valid 10-digit Indian mobile number';
  if (f.customerEmail.trim() && !emailRe.test(f.customerEmail.trim())) e.customerEmail = 'Enter a valid email address';
  const q = (f.quantity ?? '').trim();
  if (q && !(/^\d+$/.test(q) && Number(q) >= 1)) e.quantity = 'Enter a whole number, 1 or more';
  if (opts.messageRequired && !f.message.trim()) e.message = 'Tell us a little about what you need';
  return e;
}
