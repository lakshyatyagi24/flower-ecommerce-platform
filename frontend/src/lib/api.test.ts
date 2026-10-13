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
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
