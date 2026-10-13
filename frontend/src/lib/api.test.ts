import { describe, expect, it, vi } from 'vitest';
import { api, extractErrorMessage } from './api';

describe('extractErrorMessage', () => {
  it('returns string messages as is', () => {
    expect(extractErrorMessage({ message: 'Nope' }, 400)).toBe('Nope');
  });
  it('joins ValidationPipe array messages', () => {
    expect(
      extractErrorMessage({ message: ['Enter a valid 10-digit Indian mobile number', 'Enter a valid 6-digit PIN code'] }, 400),
    ).toBe('Enter a valid 10-digit Indian mobile number. Enter a valid 6-digit PIN code');
  });
  it('falls back to status', () => {
    expect(extractErrorMessage(null, 500)).toBe('Request failed (500)');
    expect(extractErrorMessage({ message: [] }, 400)).toBe('Request failed (400)');
  });
});

describe('api.checkPincode', () => {
  it('GETs /delivery/check with the encoded pincode and returns the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ serviceable: true, message: 'We deliver to this PIN code.' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(api.checkPincode('110001')).resolves.toEqual({ serviceable: true, message: 'We deliver to this PIN code.' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toMatch(/\/delivery\/check\?pincode=110001$/);
      expect(init.method).toBe('GET');
      expect(init.signal).toBeDefined(); // 5s timeout signal
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('api.getDeliveryOptions', () => {
  it('GETs /delivery/options without caching and returns the window', async () => {
    const body = { earliest: '2026-10-14', latest: '2026-10-28', blackoutDates: ['2026-10-20'] };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(api.getDeliveryOptions()).resolves.toEqual(body);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toMatch(/\/delivery\/options$/);
      expect(init.method).toBe('GET');
      expect(init.cache).toBe('no-store');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('api.trackOrder', () => {
  it('POSTs the email in the body and never puts it in the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 12 }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(api.trackOrder(12, 'Guest+tag@example.com')).resolves.toEqual({ id: 12 });
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toMatch(/\/orders\/track\/12$/);
      expect(String(url)).not.toContain('example.com');
      expect(String(url)).not.toContain('?');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ email: 'Guest+tag@example.com' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
