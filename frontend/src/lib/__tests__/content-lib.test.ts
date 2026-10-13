import { describe, it, expect } from 'vitest';
import { formatLongDate, LEGAL_UPDATED } from '../content';
import { businessHours, contactChannels, deliverySummary, returnsSummary } from '../contact-channels';
import { validateEnquiry } from '../enquiry-validation';
import type { StoreSettings } from '../settings-context';

const base = (over: Partial<StoreSettings> = {}): StoreSettings =>
  ({
    raw: {},
    name: 'Fresh Petals India',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    instagram: '',
    gstin: '',
    shippingFlatRate: 0,
    shippingFreeThreshold: 0,
    hero: { eyebrow: '', title: '', subtitle: '', ctaLabel: '', ctaHref: '' },
    usps: [],
    social: { facebook: '', youtube: '', pinterest: '' },
    delivery: { cutoffTime: '', supportedCities: '', supportedPincodes: '', businessHours: '', leadTimeDays: 1 },
    policies: { returnsSummary: '', deliverySummary: '' },
    seo: { metaTitle: '', metaDescription: '', ogImage: '' },
    ...over,
  }) as StoreSettings;

describe('formatLongDate / LEGAL_UPDATED', () => {
  it('formats ISO dates without locale dependence', () => {
    expect(formatLongDate('2026-10-13')).toBe('13 October 2026');
    expect(formatLongDate('2026-01-05')).toBe('5 January 2026');
    expect(formatLongDate('garbage')).toBe('garbage');
  });
  it('legal dates are fixed real ISO dates', () => {
    for (const d of Object.values(LEGAL_UPDATED)) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_UPDATED.privacy).toBe('2026-10-13');
  });
});

describe('contactChannels', () => {
  it('returns nothing when every setting is blank', () => {
    expect(contactChannels(base())).toEqual([]);
  });
  it('hides placeholder values left by the seed', () => {
    const out = contactChannels(
      base({ email: 'orders@example.com', address: 'Delhi NCR - please update with real address' }),
    );
    expect(out).toEqual([]);
  });
  it('lists configured channels with safe links', () => {
    const out = contactChannels(
      base({ phone: '+91 93540 16059', whatsapp: '+91 93540 16059', email: 'hello@freshpetals.in', address: '12 Market Rd, Delhi' }),
    );
    expect(out.map((c) => c.key)).toEqual(['phone', 'whatsapp', 'email', 'address']);
    expect(out[0].href).toBe('tel:+919354016059');
    expect(out[1].href).toMatch(/^https:\/\/wa\.me\/919354016059/);
    expect(out[2].href).toBe('mailto:hello@freshpetals.in');
    expect(out[3].href).toContain('google.com/maps/search');
  });
  it('hours and policy summaries come from settings only and ignore placeholders', () => {
    expect(businessHours(base())).toBe('');
    expect(businessHours(base({ delivery: { ...base().delivery, businessHours: 'Mon-Sat 9-6' } }))).toBe('Mon-Sat 9-6');
    expect(deliverySummary(base({ policies: { returnsSummary: '', deliverySummary: 'Please update this' } }))).toBe('');
    expect(returnsSummary(base({ policies: { returnsSummary: 'Ask within 2 days', deliverySummary: '' } }))).toBe('Ask within 2 days');
  });
});

describe('validateEnquiry', () => {
  const ok = { customerName: 'Asha', customerPhone: '9354016059', customerEmail: '', quantity: '', message: '' };
  it('accepts a minimal valid enquiry', () => {
    expect(validateEnquiry(ok)).toEqual({});
  });
  it('requires name and a valid Indian phone', () => {
    expect(validateEnquiry({ ...ok, customerName: ' ', customerPhone: '' })).toMatchObject({
      customerName: expect.any(String),
      customerPhone: expect.any(String),
    });
    expect(validateEnquiry({ ...ok, customerPhone: '12345' }).customerPhone).toMatch(/valid/);
  });
  it('checks optional email and quantity only when filled', () => {
    expect(validateEnquiry({ ...ok, customerEmail: 'nope' }).customerEmail).toBeTruthy();
    expect(validateEnquiry({ ...ok, quantity: '0' }).quantity).toBeTruthy();
    expect(validateEnquiry({ ...ok, quantity: '2.5' }).quantity).toBeTruthy();
    expect(validateEnquiry({ ...ok, quantity: '10' })).toEqual({});
  });
  it('message is required only in contact mode', () => {
    expect(validateEnquiry(ok, { messageRequired: true }).message).toBeTruthy();
    expect(validateEnquiry(ok)).toEqual({});
  });
});
