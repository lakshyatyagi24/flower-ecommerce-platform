import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiProduct } from '@/lib/api';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('sort=popular'),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));

import CatalogueView from '../CatalogueView';
import RelatedLinks from '../RelatedLinks';

const mk = (id: number, name: string): ApiProduct => ({
  id, name, slug: name.toLowerCase().replace(/ /g, '-'), description: null, price: 100 * id, image: null,
  stock: 5, featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE',
});
const result = (items: ApiProduct[], page = 1, pages = 1, total = items.length) => ({ items, total, page, pages, take: 24 });
const cats = [
  { id: 1, name: 'Roses', slug: 'roses' },
  { id: 2, name: 'Plants', slug: 'plants' },
];

describe('CatalogueView', () => {
  beforeEach(() => push.mockReset());

  it('renders eyebrow, heading, intro, count, grid and ItemList + BreadcrumbList JSON-LD', () => {
    const { container } = render(
      <CatalogueView
        basePath="/collections/roses"
        params={{ page: 1 }}
        result={result([mk(1, 'Red Rose'), mk(2, 'Pink Rose')], 1, 1, 2)}
        eyebrow="The collection"
        heading="Roses"
        intro="All about roses."
        breadcrumb={[{ name: 'Home', path: '/' }, { name: 'Roses', path: '/collections/roses' }]}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Roses');
    expect(screen.getByText('All about roses.')).toBeTruthy();
    expect(screen.getByText('The collection')).toBeTruthy();
    expect(container.textContent).toContain('2 products');
    expect(screen.getByRole('link', { name: /red rose/i }).getAttribute('href')).toBe('/products/red-rose');
    const types = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!)['@type']);
    expect(types.sort()).toEqual(['BreadcrumbList', 'ItemList']);
    const bc = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(bc.querySelector('a')!.getAttribute('href')).toBe('/');
    expect(bc.querySelector('[aria-current="page"]')!.textContent).toBe('Roses');
  });

  it('builds pagination and prev/next links from its own basePath', () => {
    const { container } = render(
      <CatalogueView basePath="/collections/roses" params={{ page: 2, sort: 'popular' }} result={result([mk(1, 'Red Rose')], 2, 4, 90)} eyebrow="e" heading="Roses" intro="i" />,
    );
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe('/collections/roses?sort=popular&page=3');
    expect(screen.getByRole('link', { name: 'Previous' }).getAttribute('href')).toBe('/collections/roses?sort=popular');
    expect(container.querySelector('link[rel="next"]')!.getAttribute('href')).toBe('/collections/roses?sort=popular&page=3');
    expect(container.querySelector('link[rel="prev"]')!.getAttribute('href')).toBe('/collections/roses?sort=popular');
    const hrefs = [...container.querySelectorAll('nav[aria-label="Pagination"] a')].map((a) => a.getAttribute('href')!);
    expect(hrefs.every((h) => h.startsWith('/collections/roses'))).toBe(true);
  });

  it('sorts on its own basePath', () => {
    render(<CatalogueView basePath="/occasions/birthday" params={{ page: 1 }} result={result([mk(1, 'Red Rose')])} eyebrow="e" heading="h" intro="i" />);
    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'price_asc' } });
    expect(push).toHaveBeenCalledWith('/occasions/birthday?sort=price_asc');
  });

  it('category chips link to the collections; the active one is current; All goes to /products', () => {
    render(
      <CatalogueView basePath="/collections/roses" params={{ page: 1, sort: 'popular' }} result={result([mk(1, 'Red Rose')])} categories={cats} activeCategorySlug="roses" eyebrow="e" heading="Roses" intro="i" />,
    );
    const nav = screen.getByRole('navigation', { name: 'Categories' });
    expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      '/products?sort=popular', '/collections/roses?sort=popular', '/collections/plants?sort=popular',
    ]);
    expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe('Roses');
  });

  it('hides the category bar when no categories are passed (occasion pages)', () => {
    render(<CatalogueView basePath="/occasions/birthday" params={{ page: 1 }} result={result([mk(1, 'Red Rose')])} eyebrow="e" heading="h" intro="i" />);
    expect(screen.queryByRole('navigation', { name: 'Categories' })).toBeNull();
  });

  it('shows the custom empty state and no JSON-LD ItemList or pagination', () => {
    const { container } = render(
      <CatalogueView
        basePath="/collections/plants" params={{ page: 1 }} result={result([], 1, 0, 0)} eyebrow="e" heading="Plants" intro="i"
        empty={{ title: 'New stems coming soon', body: 'Soon.', cta: { href: '/products', label: 'Browse all flowers' } }}
      />,
    );
    expect(screen.getByText('New stems coming soon')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse all flowers' }).getAttribute('href')).toBe('/products');
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
    expect(container.textContent).toContain('0 products');
  });

  it('renders the related block under the listing', () => {
    render(
      <CatalogueView basePath="/products" params={{ page: 1 }} result={result([mk(1, 'Red Rose')])} eyebrow="e" heading="h" intro="i" related={<p>related-block</p>} />,
    );
    expect(screen.getByText('related-block')).toBeTruthy();
  });
});

describe('ExpandableIntro (inside CatalogueView)', () => {
  const long = 'Long intro sentence. '.repeat(20).trim();

  it('keeps the whole intro in the DOM and toggles the mobile clamp', () => {
    render(<CatalogueView basePath="/occasions/birthday" params={{ page: 1 }} result={result([mk(1, 'Red Rose')])} eyebrow="e" heading="h" intro={long} />);
    const p = screen.getByText(long);
    expect(p.className).toContain('line-clamp-4');
    const btn = screen.getByRole('button', { name: 'Read more' });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Read less' }).getAttribute('aria-expanded')).toBe('true');
    expect(p.className).not.toContain('line-clamp-4');
  });

  it('shows no toggle for a short intro', () => {
    render(<CatalogueView basePath="/products" params={{ page: 1 }} result={result([mk(1, 'Red Rose')])} eyebrow="e" heading="h" intro="Short." />);
    expect(screen.queryByRole('button', { name: /read/i })).toBeNull();
  });
});

describe('RelatedLinks', () => {
  it('links other collections and occasions, leaving out the current one', () => {
    render(<RelatedLinks collections={cats} currentCollection="roses" />);
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toContain('/collections/plants');
    expect(links).not.toContain('/collections/roses');
    expect(links).toContain('/occasions/birthday');
    expect(links.filter((l) => l!.startsWith('/occasions/'))).toHaveLength(8);
    expect(screen.getByRole('heading', { name: 'Shop by occasion' })).toBeTruthy();
  });

  it('omits the collections list when there is nothing else, and the current occasion', () => {
    render(<RelatedLinks collections={[]} currentOccasion="birthday" />);
    expect(screen.queryByRole('heading', { name: 'More collections' })).toBeNull();
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).not.toContain('/occasions/birthday');
    expect(links).toHaveLength(7);
  });
});
