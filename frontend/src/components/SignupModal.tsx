"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { AuthMessage } from '@/components/account/AuthLayout';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input, { PasswordInput } from '@/components/ui/Input';
import { textLink } from '@/components/ui/form-styles';

type Props = {
  onClose: () => void;
};

/**
 * Sign-up form shown inside the SignInModal dialog. Focus trap, Escape, scroll lock and the heading/back/close
 * chrome belong to the dialog; this is only the content.
 */
const SignupModal: React.FC<Props> = ({ onClose }) => {
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!email || !password) {
      setAlert({ type: 'error', message: 'Email and password are required' });
      return;
    }
    if (password.length < 8) {
      setAlert({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password, name: name || undefined, phone: phone || undefined });
      setAlert({ type: 'success', message: 'Account created. Welcome!' });
      setTimeout(() => onClose(), 600);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign up failed';
      setAlert({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 id="signup-title" className="font-display text-3xl text-charcoal">Create your account</h2>

      <div className="mt-8">
        {alert && <AuthMessage type={alert.type}>{alert.message}</AuthMessage>}

        <form onSubmit={handleSignup} noValidate className="space-y-6">
          <Field id="signup-name" label="Full name" optional>
            <Input ref={firstInputRef} data-autofocus type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field id="signup-email" label="Email">
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field id="signup-phone" label="Phone" optional>
            <Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 11111" />
          </Field>
          <Field id="signup-password" label="Password" hint="At least 8 characters.">
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? 'Creating...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-stone-dark">
          By creating an account you agree to our{' '}
          <Link href="/terms" onClick={onClose} className={textLink}>
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default SignupModal;
