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

import { createRef } from 'react';
import { vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import SectionHeading from '../SectionHeading';
import Skeleton from '../Skeleton';
import { formatINR } from '@/lib/format';
import { formatINR as reexported } from '@/lib/cart-context';

describe('Button (round 1)', () => {
  it('passes anchor props through to the link', () => {
    const onClick = vi.fn();
    render(
      <Button href="/x" target="_blank" rel="noopener" aria-label="Open x" id="b1" data-foo="bar" onClick={onClick}>
        Go
      </Button>,
    );
    const el = screen.getByRole('link', { name: 'Open x' });
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener');
    expect(el.id).toBe('b1');
    expect(el.getAttribute('data-foo')).toBe('bar');
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('disabled link is inert', () => {
    const onClick = vi.fn();
    render(<Button href="/x" disabled onClick={onClick}>Go</Button>);
    const el = screen.getByText('Go');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');
    expect(el.className).toContain('pointer-events-none');
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });
  it('uses explicit disabled tokens, not opacity', () => {
    render(<Button disabled>A</Button>);
    const c = screen.getByRole('button').className;
    expect(c).toContain('disabled:bg-stone-light');
    expect(c).not.toContain('opacity-50');
  });
  it('forwards refs to button and anchor', () => {
    const b = createRef<HTMLButtonElement>();
    const a = createRef<HTMLAnchorElement>();
    render(<><Button ref={b}>B</Button><Button href="/x" ref={a}>A</Button></>);
    expect(b.current?.tagName).toBe('BUTTON');
    expect(a.current?.tagName).toBe('A');
  });
  it('ghost has a touch-friendly min height', () => {
    render(<Button variant="ghost">G</Button>);
    expect(screen.getByRole('button').className).toContain('min-h-[44px]');
  });
});

describe('SectionHeading', () => {
  it('centre variant has no conflicting md row classes', () => {
    const { container } = render(<SectionHeading title="T" align="center" />);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain('items-center');
    expect(cls).not.toContain('md:flex-row');
  });
  it('left variant is a row on md', () => {
    const { container } = render(<SectionHeading title="T" />);
    expect((container.firstElementChild as HTMLElement).className).toContain('md:flex-row');
  });
});

describe('Container (round 1)', () => {
  it('passes id / aria / data attributes', () => {
    const { container } = render(<Container id="c" aria-label="x" data-k="v">y</Container>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.id).toBe('c');
    expect(el.getAttribute('aria-label')).toBe('x');
    expect(el.getAttribute('data-k')).toBe('v');
  });
});

describe('formatINR / Price / Skeleton', () => {
  it('lives in lib/format and is re-exported from cart-context', () => {
    expect(reexported).toBe(formatINR);
    expect(formatINR(1499)).toMatch(/1,499/);
  });
  it('Price is not a client component', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('src/components/ui/Price.tsx', 'utf8');
    expect(src).not.toMatch(/use client/);
  });
  it('Skeleton is visible (stone-light tint)', () => {
    const { container } = render(<Skeleton />);
    expect((container.firstElementChild as HTMLElement).className).toContain('bg-stone-light/40');
  });
});
