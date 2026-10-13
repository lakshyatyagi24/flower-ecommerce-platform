import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LAST_ORDER_EMAIL_KEY, clearLastOrderEmail, getLastOrderEmail, setLastOrderEmail } from '../guest-order';

beforeEach(() => window.sessionStorage.clear());

describe('guest order email', () => {
  it('uses the agreed sessionStorage key', () => {
    expect(LAST_ORDER_EMAIL_KEY).toBe('fp_last_order_email');
    setLastOrderEmail(' a@b.co ');
    expect(window.sessionStorage.getItem('fp_last_order_email')).toBe('a@b.co');
  });
  it('round-trips and clears', () => {
    expect(getLastOrderEmail()).toBeNull();
    setLastOrderEmail('a@b.co');
    expect(getLastOrderEmail()).toBe('a@b.co');
    clearLastOrderEmail();
    expect(getLastOrderEmail()).toBeNull();
  });
  it('ignores a blank email', () => {
    setLastOrderEmail('   ');
    expect(getLastOrderEmail()).toBeNull();
  });
  it('is never stored anywhere but sessionStorage', () => {
    setLastOrderEmail('a@b.co');
    expect(window.localStorage.length).toBe(0);
    expect(window.location.href).not.toContain('a@b.co');
  });
  it('survives storage that throws (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => setLastOrderEmail('a@b.co')).not.toThrow();
    spy.mockRestore();
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(getLastOrderEmail()).toBeNull();
    get.mockRestore();
  });
});
