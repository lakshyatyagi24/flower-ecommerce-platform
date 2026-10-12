import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ whatsapp: '', phone: '' }));
vi.mock('next/navigation', async () => {
  const h = await import('./helpers');
  return { usePathname: () => h.nav.pathname };
});
vi.mock('@/lib/cart-context', async () => {
  const h = await import('./helpers');
  return { useCart: () => h.cart };
});
vi.mock('@/lib/settings-context', async (orig) => {
  const real = await orig<typeof import('@/lib/settings-context')>();
  return { ...real, useSettings: () => ({ name: 'Fresh Petals India', whatsapp: state.whatsapp, phone: state.phone }) };
});

import WhatsAppButton from '../../WhatsAppButton';
import { resetChromeMocks, nav, cart } from './helpers';

beforeEach(() => {
  resetChromeMocks();
  state.whatsapp = '919876543210';
  state.phone = '';
});

describe('WhatsAppButton', () => {
  it('links to the configured number with an accessible name', () => {
    render(<WhatsAppButton />);
    const a = screen.getByRole('link', { name: 'Chat on WhatsApp' });
    expect(a.getAttribute('href')).toContain('https://wa.me/919876543210');
    expect(a).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('is hidden when no number is configured', () => {
    state.whatsapp = '';
    render(<WhatsAppButton />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('is hidden on checkout routes', () => {
    for (const p of ['/checkout', '/checkout/success']) {
      nav.pathname = p;
      const { unmount } = render(<WhatsAppButton />);
      expect(screen.queryByRole('link')).toBeNull();
      unmount();
    }
  });

  it('is hidden while the cart drawer is open', () => {
    cart.isOpen = true;
    render(<WhatsAppButton />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
