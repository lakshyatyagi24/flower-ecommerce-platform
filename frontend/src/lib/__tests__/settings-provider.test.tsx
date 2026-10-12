import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const getSettings = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ api: { getSettings: (...a: unknown[]) => getSettings(...a) } }));

import { SettingsProvider, useSettings } from '../settings-context';
import FooterContact from '@/components/chrome/FooterContact';

function Probe() {
  const s = useSettings();
  return (
    <ul>
      <li data-testid="email">{s.email}</li>
      <li data-testid="address">{s.address}</li>
      <li data-testid="phone">{s.phone}</li>
      <li data-testid="whatsapp">{s.whatsapp}</li>
    </ul>
  );
}

const OLD = {
  'store.email': 'orders@example.com',
  'store.address': 'Delhi NCR — please update',
  'store.phone': '+91 93540 16059',
  'store.whatsapp': '+91 93540 16059',
};

describe('SettingsProvider with placeholder rows still in the database', () => {
  it('treats the old seeded email/address as unset and keeps the real phone', async () => {
    getSettings.mockResolvedValue(OLD);
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('phone')).toHaveTextContent('+91 93540 16059'));
    expect(screen.getByTestId('email')).toBeEmptyDOMElement();
    expect(screen.getByTestId('address')).toBeEmptyDOMElement();
    expect(screen.getByTestId('whatsapp')).toHaveTextContent('+91 93540 16059');
  });

  it('a placeholder WhatsApp number falls back to the phone, and a placeholder phone is unset', async () => {
    getSettings.mockResolvedValue({ 'store.whatsapp': 'placeholder', 'store.phone': '+91 11111 22222' });
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('phone')).toHaveTextContent('+91 11111 22222'));
    expect(screen.getByTestId('whatsapp')).toHaveTextContent('+91 11111 22222');
  });

  it('the footer shows no email or address for the old placeholders', async () => {
    getSettings.mockResolvedValue(OLD);
    const { container } = render(
      <SettingsProvider>
        <FooterContact />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: '+91 93540 16059' })).toBeInTheDocument());
    expect(container.innerHTML).not.toMatch(/example\.com|please update|mailto:/i);
  });
});
