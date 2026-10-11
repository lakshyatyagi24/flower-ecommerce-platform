import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { setTrackEmail, getTrackEmail, clearTrackEmail } from '../track-order-session';

describe('track-order-session', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => { vi.restoreAllMocks(); });

  it('round-trips the email', () => {
    setTrackEmail('a@b.co');
    expect(getTrackEmail()).toBe('a@b.co');
  });

  it('get returns null when nothing stored and after clear', () => {
    expect(getTrackEmail()).toBeNull();
    setTrackEmail('a@b.co');
    clearTrackEmail();
    expect(getTrackEmail()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('set overwrites the previous value', () => {
    setTrackEmail('a@b.co');
    setTrackEmail('c@d.co');
    expect(getTrackEmail()).toBe('c@d.co');
  });

  it('never throws when sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => setTrackEmail('a@b.co')).not.toThrow();
    expect(getTrackEmail()).toBeNull();
    expect(() => clearTrackEmail()).not.toThrow();
  });
});
