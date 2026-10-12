import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let search = '';
const push = vi.fn();
const replace = vi.fn();
const login = vi.fn();
const register = vi.fn();
let authUser: unknown = null;

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ push, replace }),
}));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ login, register, user: authUser, loading: false }),
}));
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return { ApiError, api: {} };
});

import { ApiError } from '@/lib/api';
import LoginPage from '../login/page';
import RegisterPage from '../register/page';
import loginLayout, { metadata as loginMeta } from '../login/layout';

beforeEach(() => {
  vi.clearAllMocks();
  search = '';
  authUser = null;
  vi.useRealTimers();
});

describe('Login page', () => {
  it('has a single centred 420px column with labelled, autocomplete-ready fields', () => {
    const { container } = render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument();
    expect(container.querySelector('.max-w-\\[420px\\]')).not.toBeNull();
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText(/^password/i, { selector: 'input' })).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/account/forgot-password');
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute(
      'href',
      '/account/register?callbackUrl=%2Faccount%2Forders',
    );
  });

  it('password toggle switches the type with aria-pressed', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const pw = screen.getByLabelText(/^password/i, { selector: 'input' }) as HTMLInputElement;
    await user.type(pw, 'secret1');
    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(pw.type).toBe('text');
    expect(pw.value).toBe('secret1');
    expect(screen.getByRole('button', { name: /hide password/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the unchanged validation messages and does not call login', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the server message on failure', async () => {
    login.mockRejectedValue(new ApiError('Invalid credentials', 401));
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('redirects to a safe callbackUrl after signing in and ignores an unsafe one', async () => {
    login.mockResolvedValue(undefined);
    search = '?callbackUrl=%2Fcheckout';
    const user = userEvent.setup();
    const first = render(<LoginPage />);
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/checkout'), { timeout: 2000 });
    first.unmount();

    push.mockClear();
    search = '?callbackUrl=https%3A%2F%2Fevil.example';
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/account/orders'), { timeout: 2000 });
  });

  it('forwards an already signed-in user to the callback', () => {
    authUser = { id: 1 };
    search = '?callbackUrl=%2Fcheckout';
    render(<LoginPage />);
    expect(replace).toHaveBeenCalledWith('/checkout');
  });

  it('keeps the noindex metadata', () => {
    expect(loginMeta.robots).toEqual({ index: false, follow: false });
    expect(typeof loginLayout).toBe('function');
  });
});

describe('Register page', () => {
  it('marks phone optional, sets autocomplete and keeps the 8-character rule', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    expect(screen.getByText('(optional)')).toBeInTheDocument();
    expect(screen.getByLabelText(/^full name/i)).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText(/^phone/i)).toHaveAttribute('autocomplete', 'tel');
    const pw = screen.getByLabelText(/^password/i, { selector: 'input' });
    expect(pw).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText(/^confirm password/i)).toHaveAttribute('autocomplete', 'new-password');
    await user.type(screen.getByLabelText(/^full name/i), 'Asha');
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co');
    await user.type(pw, 'short');
    await user.type(screen.getByLabelText(/^confirm password/i), 'other');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers and redirects to the safe callback', async () => {
    register.mockResolvedValue(undefined);
    search = '?callbackUrl=%2Fcheckout';
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/^full name/i), 'Asha');
    await user.type(screen.getByLabelText(/^email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'longenough');
    await user.type(screen.getByLabelText(/^confirm password/i), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(register).toHaveBeenCalledWith({ email: 'a@b.co', password: 'longenough', name: 'Asha', phone: undefined }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/checkout'), { timeout: 2000 });
  });
});
