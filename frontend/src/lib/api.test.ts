import { describe, expect, it } from 'vitest';
import { extractErrorMessage } from './api';

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
