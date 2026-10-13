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

  it('starts at the minimum order quantity, steps by it, lands on stock and can always go back down', () => {
    render(<ProductBuyBox product={{ ...product, minOrderQty: 5, stock: 18 }} />);
    expect(qty()).toBe('5');
    expect(screen.getByText(/minimum order: 5 stems/i)).toBeTruthy();
    expect(screen.queryByText(/bunches/i)).toBeNull();
    const dec = screen.getByRole('button', { name: /decrease quantity/i }) as HTMLButtonElement;
    const inc = screen.getByRole('button', { name: /increase quantity/i }) as HTMLButtonElement;
    expect(dec.disabled).toBe(true);
    fireEvent.click(inc);
    expect(qty()).toBe('10');
    fireEvent.click(inc);
    expect(qty()).toBe('15');
    fireEvent.click(inc);
    expect(qty()).toBe('18'); // the last step lands on stock
    expect(inc.disabled).toBe(true);
    expect(dec.disabled).toBe(false); // never both stuck
    fireEvent.click(dec);
    expect(qty()).toBe('13');
    fireEvent.click(dec);
    fireEvent.click(dec);
    expect(qty()).toBe('5');
    expect(dec.disabled).toBe(true);
  });

  it('uses the product unit word in the minimum copy, and none when the unit is a bunch word or missing', () => {
    const { unmount } = render(<ProductBuyBox product={{ ...product, minOrderQty: 10, unit: 'piece' }} />);
    expect(screen.getByText(/minimum order: 10 pieces/i)).toBeTruthy();
    unmount();
    const b = render(<ProductBuyBox product={{ ...product, minOrderQty: 10, unit: 'bunch' }} />);
    expect(screen.getByText(/^minimum order: 10\.\s*$/i)).toBeTruthy();
    b.unmount();
    render(<ProductBuyBox product={{ ...product, minOrderQty: 10, unit: undefined }} />);
    expect(screen.getByText(/^minimum order: 10\.\s*$/i)).toBeTruthy();
  });

  it('shows no minimum note when the minimum is 1', () => {
    render(<ProductBuyBox product={product} />);
    expect(screen.queryByText(/minimum order/i)).toBeNull();
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

  it('with a minimum of 4 and 6 in stock the stepper goes 4 -> 6 -> 4 (every server-valid quantity is reachable)', () => {
    render(<ProductBuyBox product={{ ...product, minOrderQty: 4, stock: 6 }} />);
    const inc = screen.getByRole('button', { name: /increase quantity/i }) as HTMLButtonElement;
    const dec = screen.getByRole('button', { name: /decrease quantity/i }) as HTMLButtonElement;
    expect(qty()).toBe('4');
    expect(inc.disabled).toBe(false);
    fireEvent.click(inc);
    expect(qty()).toBe('6');
    expect(inc.disabled).toBe(true);
    expect(dec.disabled).toBe(false);
    fireEvent.click(dec);
    expect(qty()).toBe('4');
  });

  it('with a minimum equal to stock the stepper cannot move at all', () => {
    render(<ProductBuyBox product={{ ...product, minOrderQty: 6, stock: 6 }} />);
    expect((screen.getByRole('button', { name: /increase quantity/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /decrease quantity/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(qty()).toBe('6');
  });

  it.each([
    [10, true],
    [1, true],
    [11, false],
    [20, false],
  ])('stock %i: "Only N left" shown is %s (honest, only up to 10 units)', (stock, shown) => {
    render(<ProductBuyBox product={{ ...product, stock }} />);
    expect(!!screen.queryByText(new RegExp(`only ${stock} left`, 'i'))).toBe(shown);
  });

  it('treats stock below the minimum order as out of stock', () => {
    render(<ProductBuyBox product={{ ...product, minOrderQty: 5, stock: 3 }} />);
    expect((screen.getByRole('button', { name: /out of stock/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /add to bag/i })).toBeNull();
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

  it('shows the PIN check for purchasable products only', () => {
    const pin = () => screen.queryByLabelText(/delivery pin code/i);
    const { unmount } = render(<ProductBuyBox product={product} />);
    expect(pin()).not.toBeNull();
    unmount();
    const enquiry = render(<ProductBuyBox product={{ ...product, saleMode: 'ENQUIRY' }} />);
    expect(pin()).toBeNull();
    enquiry.unmount();
    render(<ProductBuyBox product={{ ...product, stock: 0 }} />);
    expect(pin()).toBeNull();
  });
});
