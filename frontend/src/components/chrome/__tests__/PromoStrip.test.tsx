import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/settings-context', async (orig) => {
  const real = await orig<typeof import('@/lib/settings-context')>();
  const h = await import('./helpers');
  return { ...real, useSettings: () => ({ ...real.useSettings(), raw: h.settingsRaw }) };
});

import PromoStrip from '../../PromoStrip';
import { resetChromeMocks, settingsRaw } from './helpers';

beforeEach(() => {
  resetChromeMocks();
  sessionStorage.clear();
});

describe('PromoStrip (announcement bar)', () => {
  it('renders nothing when no announcement is set', () => {
    render(<PromoStrip />);
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
    expect(document.body.textContent).toBe('');
  });

  it('renders nothing on the server even when set (no hydration mismatch)', () => {
    settingsRaw['homepage.announcement'] = 'Closed on Sunday';
    expect(renderToString(<PromoStrip />)).toBe('');
  });

  it('shows the announcement text after mount, as a plain line without href', () => {
    settingsRaw['homepage.announcement'] = 'Closed on Sunday';
    render(<PromoStrip />);
    const region = screen.getByRole('region', { name: 'Announcement' });
    expect(region).toHaveTextContent('Closed on Sunday');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('links to a relative path', () => {
    settingsRaw['homepage.announcement'] = 'New: wedding florals';
    settingsRaw['homepage.announcementHref'] = '/occasions/wedding';
    render(<PromoStrip />);
    expect(screen.getByRole('link', { name: 'New: wedding florals' })).toHaveAttribute('href', '/occasions/wedding');
  });

  it('renders unsafe hrefs as plain text, never a link', () => {
    settingsRaw['homepage.announcement'] = 'Hello';
    for (const bad of ['javascript:alert(1)', 'https://evil.example/x', '//evil.example']) {
      settingsRaw['homepage.announcementHref'] = bad;
      const { unmount } = render(<PromoStrip />);
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.getByRole('region', { name: 'Announcement' })).toHaveTextContent('Hello');
      unmount();
    }
  });

  it('can be dismissed for the session', async () => {
    settingsRaw['homepage.announcement'] = 'Closed on Sunday';
    const { unmount } = render(<PromoStrip />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
    expect(sessionStorage.getItem('fp_announcement_dismissed')).toBe('Closed on Sunday');
    unmount();
    render(<PromoStrip />);
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
  });

  it('comes back when the announcement text changes', () => {
    sessionStorage.setItem('fp_announcement_dismissed', 'Old text');
    settingsRaw['homepage.announcement'] = 'New text';
    render(<PromoStrip />);
    expect(screen.getByRole('region', { name: 'Announcement' })).toHaveTextContent('New text');
  });

  it('survives blocked storage', () => {
    settingsRaw['homepage.announcement'] = 'Hi';
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<PromoStrip />);
    expect(screen.getByRole('region', { name: 'Announcement' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('hides placeholder announcement text left in the database', () => {
    settingsRaw['homepage.announcement'] = 'Lorem ipsum - please update';
    render(<PromoStrip />);
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
  });

  it('never carries a delivery or limited-time claim', () => {
    settingsRaw['homepage.announcement'] = 'Hi';
    render(<PromoStrip />);
    expect(document.body.textContent).not.toMatch(/same-day|free delivery|limited time/i);
  });
});
