import { isPlaceholderSetting, mailtoLink, telLink, whatsappLink, type StoreSettings } from './settings-context';

export type ContactChannel = {
  key: 'phone' | 'whatsapp' | 'email' | 'address';
  label: string;
  /** Text shown to the customer. */
  text: string;
  href: string;
  external: boolean;
};

const real = (v: string | null | undefined): string => (isPlaceholderSetting(v) ? '' : (v as string).trim());

/**
 * The ways to reach the store that are actually configured. A channel whose setting is blank or still holds
 * seed placeholder text is OMITTED (never rendered as "coming soon" or a fake value).
 */
export function contactChannels(s: StoreSettings): ContactChannel[] {
  const out: ContactChannel[] = [];
  const phone = real(s.phone);
  const phoneHref = phone ? telLink(phone) : null;
  if (phone && phoneHref) out.push({ key: 'phone', label: 'Phone', text: phone, href: phoneHref, external: false });

  const wa = real(s.whatsapp);
  const waHref = wa ? whatsappLink(wa, "Hi, I'd like to enquire about your flowers.") : null;
  if (waHref) out.push({ key: 'whatsapp', label: 'WhatsApp', text: 'Message us on WhatsApp', href: waHref, external: true });

  const email = real(s.email);
  const mailHref = email ? mailtoLink(email) : null;
  if (email && mailHref) out.push({ key: 'email', label: 'Email', text: email, href: mailHref, external: false });

  const address = real(s.address);
  if (address) {
    out.push({
      key: 'address',
      label: 'Address',
      text: address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      external: true,
    });
  }
  return out;
}

/** Opening hours from settings (`delivery.businessHours`); empty when unset. Never hardcoded. */
export function businessHours(s: StoreSettings): string {
  return real(s.delivery.businessHours);
}

export function deliverySummary(s: StoreSettings): string {
  return real(s.policies.deliverySummary);
}

export function returnsSummary(s: StoreSettings): string {
  return real(s.policies.returnsSummary);
}
