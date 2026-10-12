import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductBuyBox from '../ProductBuyBox';
import type { ApiProduct } from '@/lib/api';

const add = vi.fn();
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add }) }));
vi.mock('@/components/EnquiryModal', () => ({
  default: ({ open, heading }: { open: boolean; heading?: string }) => (open ? <div role="dialog">{heading}</div> : null),
}));

const product: ApiProduct = {
  id: 7, name: 'Red Rose', slug: 'red-rose', description: null, price: 100, image: null, stock: 20,
  featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE', gstRate: 0, minOrderQty: 1, unit: 'stem',
};

const qty = () => screen.getByTestId('qty').textContent;

describe('ProductBuyBox', () => {
  beforeEach(() => add.mockReset());

  it('starts at the minimum order quantity and steps by it', () => {
    render(<ProductBuyBox product={{ ...product, minOrderQty: 5 }} />);
    expect(qty()).toBe('5');
    expect(screen.getByText(/sold in bunches of 5/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(qty()).toBe('10');
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(qty()).toBe('5');
    expect((screen.getByRole('button', { name: /decrease quantity/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('never exceeds stock and says how many are left when low', () => {
    render(<ProductBuyBox product={{ ...product, stock: 3 }} />);
    expect(screen.getByText(/only 3 left/i)).toBeTruthy();
    const inc = screen.getByRole('button', { name: /increase quantity/i }) as HTMLButtonElement;
    fireEvent.click(inc);
    fireEvent.click(inc);
    fireEvent.click(inc);
    expect(qty()).toBe('3');
    expect(inc.disabled).toBe(true);
  });

  it('keeps the quantity a multiple of the bunch size within stock', () => {
    render(<ProductBuyBox product={{ ...product, minOrderQty: 4, stock: 10 }} />);
    const inc = screen.getByRole('button', { name: /increase quantity/i }) as HTMLButtonElement;
    fireEvent.click(inc);
    fireEvent.click(inc);
    expect(qty()).toBe('8');
    expect(inc.disabled).toBe(true);
  });

  it('does not show "only N left" for well-stocked items', () => {
    render(<ProductBuyBox product={product} />);
    expect(screen.queryByText(/left/i)).toBeNull();
  });

  it('adds the chosen quantity to the cart with the cart item shape', () => {
    render(<ProductBuyBox product={product} />);
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    fireEvent.click(screen.getByRole('button', { name: /add to bag/i }));
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][1]).toBe(3);
    expect(add.mock.calls[0][0]).toMatchObject({ productId: 7, slug: 'red-rose', name: 'Red Rose', price: 100, stock: 20, minOrderQty: 1 });
  });

  it('shows a disabled out-of-stock button with a note', () => {
    render(<ProductBuyBox product={{ ...product, stock: 0 }} />);
    const btn = screen.getByRole('button', { name: /out of stock/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /add to bag/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /increase quantity/i })).toBeNull();
    expect(screen.getByText(/currently unavailable/i)).toBeTruthy();
    fireEvent.click(btn);
    expect(add).not.toHaveBeenCalled();
  });

  it('enquiry products open the enquiry modal instead of adding to the bag', () => {
    render(<ProductBuyBox product={{ ...product, saleMode: 'ENQUIRY', stock: 0 }} />);
    expect(screen.queryByRole('button', { name: /add to bag/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /increase quantity/i })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^enquire$/i }));
    expect(screen.getByRole('dialog').textContent).toContain('Red Rose');
    expect(add).not.toHaveBeenCalled();
  });
});
