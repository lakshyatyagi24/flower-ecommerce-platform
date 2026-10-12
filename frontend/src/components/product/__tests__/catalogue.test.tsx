import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductCard from '../ProductCard';
import Pagination from '../Pagination';
import SortSelect from '../SortSelect';
import type { ApiProduct } from '@/lib/api';

const push = vi.fn();
let search = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));

const product: ApiProduct = {
  id: 1, name: 'Red Rose', slug: 'red-rose', description: null, price: 1499, image: null, stock: 9,
  featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE',
};

describe('ProductCard', () => {
  it('links to the PDP with the name and price, using the placeholder for a null image', () => {
    const { container } = render(<ProductCard product={product} />);
    const link = screen.getByRole('link', { name: /red rose/i });
    expect(link.getAttribute('href')).toBe('/products/red-rose');
    expect(link.textContent).toContain('₹1,499');
    const img = container.querySelector('img')!;
    expect(decodeURIComponent(img.getAttribute('src')!)).toContain('placeholder-bloom.jpg');
    expect(img.getAttribute('alt')).toBe('Red Rose');
  });

  it('keeps the quick-add button outside the anchor (valid HTML)', () => {
    const { container } = render(<ProductCard product={product} />);
    const btn = screen.getByRole('button', { name: /add red rose to bag/i });
    expect(btn.closest('a')).toBeNull();
    expect(container.querySelector('a button')).toBeNull();
  });

  it('marks out-of-stock products and offers no quick add', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />);
    expect(screen.getByText(/out of stock/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('treats stock below the minimum order as out of stock (no quick add)', () => {
    render(<ProductCard product={{ ...product, stock: 3, minOrderQty: 5 }} />);
    expect(screen.getByText(/out of stock/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not scale on hover when reduced motion is requested', () => {
    const { container } = render(<ProductCard product={product} />);
    expect(container.querySelector('img')!.className).toContain('motion-reduce:group-hover:scale-100');
  });

  it('shows Enquire (a link to the PDP) for enquiry products, never a button', () => {
    render(<ProductCard product={{ ...product, saleMode: 'ENQUIRY', stock: 0 }} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: /enquire about red rose/i }).getAttribute('href')).toBe('/products/red-rose');
    expect(screen.queryByText(/out of stock/i)).toBeNull();
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination params={{ page: 1 }} page={1} pages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('marks the current page, links prev/next with rel and preserves other params', () => {
    render(<Pagination params={{ category: 'roses', sort: 'popular', page: 2 }} page={2} pages={5} />);
    expect(screen.getByText('2').getAttribute('aria-current')).toBe('page');
    const prev = screen.getByRole('link', { name: 'Previous' });
    const next = screen.getByRole('link', { name: 'Next' });
    expect(prev.getAttribute('rel')).toBe('prev');
    expect(next.getAttribute('rel')).toBe('next');
    expect(prev.getAttribute('href')).toBe('/products?category=roses&sort=popular');
    expect(next.getAttribute('href')).toBe('/products?category=roses&sort=popular&page=3');
    expect(screen.getByRole('link', { name: 'Page 5' }).getAttribute('href')).toContain('page=5');
  });

  it('omits prev on the first page and next on the last', () => {
    const { rerender } = render(<Pagination params={{ page: 1 }} page={1} pages={3} />);
    expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull();
    rerender(<Pagination params={{ page: 3 }} page={3} pages={3} />);
    expect(screen.queryByRole('link', { name: 'Next' })).toBeNull();
  });
});

describe('SortSelect', () => {
  beforeEach(() => push.mockReset());

  it('pushes the new sort, keeps other params and resets the page', () => {
    search = 'category=roses&page=3&q=red';
    render(<SortSelect value="newest" />);
    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'price_asc' } });
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(push.mock.calls[0][0], 'http://x');
    expect(url.pathname).toBe('/products');
    expect(Object.fromEntries(url.searchParams)).toEqual({ category: 'roses', q: 'red', sort: 'price_asc' });
  });

  it('reflects the current sort', () => {
    search = '';
    render(<SortSelect value="popular" />);
    expect((screen.getByLabelText(/sort/i) as HTMLSelectElement).value).toBe('popular');
  });
});

describe('ListingBusy', () => {
  async function setup() {
    const { default: ListingBusy } = await import('../ListingBusy');
    search = '';
    const utils = render(
      <ListingBusy>
        <a href="/products?category=roses" onClick={(e) => e.preventDefault()}>Roses</a>
        <a href="/products/red-rose" onClick={(e) => e.preventDefault()}>Product</a>
        <select aria-label="s" defaultValue="a"><option value="a">a</option><option value="b">b</option></select>
        <div data-grid />
      </ListingBusy>,
    );
    return { root: utils.container.firstChild as HTMLElement, ...utils };
  }

  it('marks the listing busy while a filter navigation is in flight', async () => {
    const { root } = await setup();
    expect(root.getAttribute('aria-busy')).toBe('false');
    fireEvent.click(screen.getByText('Roses'));
    expect(root.getAttribute('aria-busy')).toBe('true');
  });

  it('ignores product links and modified clicks', async () => {
    const { root } = await setup();
    fireEvent.click(screen.getByText('Product'));
    fireEvent.click(screen.getByText('Roses'), { metaKey: true });
    expect(root.getAttribute('aria-busy')).toBe('false');
  });

  it('is busy while the sort select changes', async () => {
    const { root } = await setup();
    fireEvent.change(screen.getByLabelText('s'), { target: { value: 'b' } });
    expect(root.getAttribute('aria-busy')).toBe('true');
  });
});
