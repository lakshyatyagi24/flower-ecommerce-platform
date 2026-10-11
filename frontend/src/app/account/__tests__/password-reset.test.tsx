import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let search = '';
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/account/reset-password',
}));

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return { ApiError, api: { resetPassword: vi.fn(), forgotPassword: vi.fn() } };
});

import { api, ApiError } from '@/lib/api';
import { isValidResetToken } from '@/lib/reset-token';
import ResetPasswordView from '../reset-password/reset-password-view';
import ForgotPasswordView from '../forgot-password/forgot-password-view';

const TOKEN = 'a1'.repeat(32);
const INVALID = 'This link is invalid or has expired.';

describe('isValidResetToken', () => {
  it('accepts only 64 hex chars', () => {
    expect(isValidResetToken(TOKEN)).toBe(true);
    expect(isValidResetToken('A'.repeat(64))).toBe(true);
    expect(isValidResetToken('a'.repeat(63))).toBe(false);
    expect(isValidResetToken('g'.repeat(64))).toBe(false);
    expect(isValidResetToken(null)).toBe(false);
    expect(isValidResetToken(undefined)).toBe(false);
  });
});

describe('ResetPasswordView', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it.each([
    ['missing', ''],
    ['63 chars', `?token=${'a'.repeat(63)}`],
    ['non-hex', `?token=${'z'.repeat(64)}`],
  ])('shows invalid state and no form for %s token', (_n, q) => {
    search = q;
    render(<ResetPasswordView />);
    expect(screen.getByText(INVALID)).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).toBeNull();
    expect(screen.getByRole('link', { name: /request a new reset link/i })).toHaveAttribute('href', '/account/forgot-password');
  });

  async function fill(pw: string, confirm: string) {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('New password'), pw);
    await user.type(screen.getByLabelText('Confirm new password'), confirm);
    await user.click(screen.getByRole('button', { name: 'Update password' }));
  }

  it('mismatched passwords do not call the API', async () => {
    search = `?token=${TOKEN}`;
    render(<ResetPasswordView />);
    await fill('password-one', 'password-two');
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  it('success calls the API, scrubs the URL and shows success', async () => {
    search = `?token=${TOKEN}`;
    vi.mocked(api.resetPassword).mockResolvedValue({ ok: true });
    render(<ResetPasswordView />);
    await fill('password-one', 'password-one');
    expect(await screen.findByText('Your password has been updated.')).toBeInTheDocument();
    expect(api.resetPassword).toHaveBeenCalledWith(TOKEN, 'password-one');
    expect(replace).toHaveBeenCalledWith('/account/reset-password');
    expect(screen.getByRole('link', { name: /go to sign in/i })).toHaveAttribute('href', '/account/login');
  });

  it('a 400 shows the invalid-link message', async () => {
    search = `?token=${TOKEN}`;
    vi.mocked(api.resetPassword).mockRejectedValue(new ApiError('Invalid or expired reset link', 400, null));
    render(<ResetPasswordView />);
    await fill('password-one', 'password-one');
    expect(await screen.findByText(INVALID)).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).toBeNull();
  });
});

describe('ForgotPasswordView', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows the generic success message on a resolved call', async () => {
    vi.mocked(api.forgotPassword).mockResolvedValue({ ok: true });
    render(<ForgotPasswordView />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(
      await screen.findByText('If an account exists for that email, a reset link is on its way.'),
    ).toBeInTheDocument();
    expect(api.forgotPassword).toHaveBeenCalledWith('a@b.co');
  });

  it('shows the rate-limit message on 429', async () => {
    vi.mocked(api.forgotPassword).mockRejectedValue(new ApiError('Too Many Requests', 429, null));
    render(<ForgotPasswordView />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByText('Too many requests. Please wait a minute and try again.')).toBeInTheDocument(),
    );
  });
});
