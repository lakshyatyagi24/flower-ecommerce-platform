import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorState from '../ErrorState';
import EmptyState from '../EmptyState';

describe('ErrorState', () => {
  it('renders an alert with the message and retry', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Nope" onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('Nope');
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
  it('renders an optional link instead of retry', () => {
    render(<ErrorState message="x" link={{ href: '/account/orders', label: 'My orders' }} />);
    expect(screen.getByRole('link', { name: 'My orders' }).getAttribute('href')).toBe('/account/orders');
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders title, body and cta', () => {
    render(<EmptyState title="Nothing" body="Come back" cta={{ href: '/products', label: 'Browse' }} />);
    expect(screen.getByRole('heading', { name: 'Nothing' })).toBeTruthy();
    expect(screen.getByText('Come back')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse' }).getAttribute('href')).toBe('/products');
  });
});
