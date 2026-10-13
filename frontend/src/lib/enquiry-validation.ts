import { PHONE_PATTERN } from './checkout-validation';

export type EnquiryFieldName = 'customerName' | 'customerPhone' | 'customerEmail' | 'quantity' | 'message';
export type EnquiryErrors = Partial<Record<EnquiryFieldName, string>>;

const phoneRe = new RegExp(`^(?:${PHONE_PATTERN})$`);
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
  else if (!phoneRe.test(f.customerPhone.trim())) e.customerPhone = 'Enter a valid 10-digit Indian mobile number';
  if (f.customerEmail.trim() && !emailRe.test(f.customerEmail.trim())) e.customerEmail = 'Enter a valid email address';
  const q = (f.quantity ?? '').trim();
  if (q && !(/^\d+$/.test(q) && Number(q) >= 1)) e.quantity = 'Enter a whole number, 1 or more';
  if (opts.messageRequired && !f.message.trim()) e.message = 'Tell us a little about what you need';
  return e;
}
