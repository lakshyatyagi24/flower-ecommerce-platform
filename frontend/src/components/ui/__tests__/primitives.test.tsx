import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../Button';
import Container from '../Container';
import Price from '../Price';

describe('Button', () => {
  it('renders an anchor when href is given', () => {
    render(<Button href="/x">Go</Button>);
    const el = screen.getByRole('link', { name: 'Go' });
    expect(el.getAttribute('href')).toBe('/x');
  });
  it('renders a button otherwise, defaulting to type=button', () => {
    render(<Button>Buy</Button>);
    const el = screen.getByRole('button', { name: 'Buy' });
    expect(el.getAttribute('type')).toBe('button');
  });
  it('applies variant classes', () => {
    const { rerender } = render(<Button>A</Button>);
    expect(screen.getByRole('button').className).toContain('bg-charcoal');
    rerender(<Button variant="outline">A</Button>);
    expect(screen.getByRole('button').className).toContain('border-charcoal');
    rerender(<Button variant="ghost">A</Button>);
    expect(screen.getByRole('button').className).toContain('underline');
  });
  it('supports disabled', () => {
    render(<Button disabled>A</Button>);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Price', () => {
  it('formats INR and shows a unit', () => {
    render(<Price amount={1499} unit="/ stem" />);
    expect(screen.getByText(/1,499/)).toBeTruthy();
    expect(screen.getByText('/ stem')).toBeTruthy();
  });
  it('omits unit when not given', () => {
    const { container } = render(<Price amount={50} />);
    // wrapper + amount only; no unit span
    expect(container.querySelectorAll('span').length).toBe(2);
  });
});

describe('Container', () => {
  it('renders div by default with width classes', () => {
    const { container } = render(<Container>hi</Container>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('max-w-[1280px]');
  });
  it('honours the as prop and className', () => {
    const { container } = render(<Container as="section" className="py-4">x</Container>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SECTION');
    expect(el.className).toContain('py-4');
  });
});
