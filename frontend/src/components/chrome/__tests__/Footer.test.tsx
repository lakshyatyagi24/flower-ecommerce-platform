import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

const settings = vi.hoisted(() => ({
  value: { name: 'Fresh Petals India', email: '', phone: '', whatsapp: '', address: '', instagram: '' } as Record<string, string>,
}));
vi.mock('@/lib/settings-context', async (orig) => {
  const real = await orig<typeof import('@/lib/settings-context')>();
  return { ...real, useSettings: () => settings.value };
});

import Footer from '../../Footer';
import { OCCASIONS } from '@/lib/occasions';

const set = (v: Partial<Record<string, string>>) => {
  settings.value = { name: 'Fresh Petals India', email: '', phone: '', whatsapp: '', address: '', instagram: '', ...v } as Record<string, string>;
};

describe('Footer', () => {
  it('renders static link columns in the server HTML (no client data needed)', () => {
    set({});
    const html = renderToString(<Footer />);
    const hrefs = [
      '/products', '/corporate', '/track-order', '/faq', '/contact', '/refund-policy', '/about', '/privacy', '/terms',
      ...OCCASIONS.map((o) => `/occasions/${o.slug}`),
    ];
    for (const h of hrefs) expect(html).toContain(`href="${h}"`);
    expect(html).not.toMatch(/same-day|same day|free delivery|limited time/i);
  });

  it('has labelled columns and the legal line with the current year', () => {
    set({});
    render(<Footer />);
    for (const h of ['Shop', 'Help', 'Company', 'Contact']) expect(screen.getByRole('heading', { name: h })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Fresh Petals India`))).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull(); // no newsletter
  });

  it('shows no contact details that are not set (and no hardcoded ones)', () => {
    set({});
    render(<Footer />);
    const contact = screen.getByRole('heading', { name: 'Contact' }).parentElement!;
    expect(within(contact).queryAllByRole('link')).toHaveLength(0);
    expect(document.body.innerHTML).not.toMatch(/tel:|mailto:|wa\.me/);
  });

  it('shows only the contact fields that are set, as tel/mailto/WhatsApp/Instagram links', () => {
    set({ phone: '+91 98765 43210', email: 'hello@example.com', address: '12 Mandi Road, Delhi', whatsapp: '919876543210', instagram: '@freshpetals' });
    render(<Footer />);
    const contact = screen.getByRole('heading', { name: 'Contact' }).parentElement!;
    expect(within(contact).getByRole('link', { name: '+91 98765 43210' })).toHaveAttribute('href', 'tel:+919876543210');
    expect(within(contact).getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');
    expect(within(contact).getByText('12 Mandi Road, Delhi')).toBeInTheDocument();
    expect(within(contact).getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', expect.stringContaining('wa.me/919876543210'));
    expect(within(contact).getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', 'https://www.instagram.com/freshpetals');
  });

  it('shows just the email when only the email is set', () => {
    set({ email: 'hello@example.com' });
    render(<Footer />);
    const contact = screen.getByRole('heading', { name: 'Contact' }).parentElement!;
    expect(within(contact).getAllByRole('link')).toHaveLength(1);
  });
});
