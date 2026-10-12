import { describe, it, expect, vi, afterEach } from 'vitest';
import { cloudinaryOgPhotoUrl, fetchOgPhoto, clampProductName, ogPrice, nameFontSize } from '../og';

afterEach(() => {
  vi.unstubAllGlobals();
});

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const resp = (body: Uint8Array, init: ResponseInit = {}) => new Response(body as unknown as BodyInit, { status: 200, ...init });
const URL1 = 'https://res.cloudinary.com/d/image/upload/a.jpg';

describe('cloudinaryOgPhotoUrl', () => {
  it('only accepts https res.cloudinary.com and injects a crop transform', () => {
    expect(cloudinaryOgPhotoUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_jpg,c_fill,w_600,h_630/v1/a.jpg',
    );
  });
  it('rejects placeholders, local paths and other hosts', () => {
    expect(cloudinaryOgPhotoUrl('/images/placeholder-bloom.jpg')).toBeNull();
    expect(cloudinaryOgPhotoUrl('https://evil.example/a.jpg')).toBeNull();
    expect(cloudinaryOgPhotoUrl('http://res.cloudinary.com/a.jpg')).toBeNull();
    expect(cloudinaryOgPhotoUrl('https://res.cloudinary.com.evil.test/a.jpg')).toBeNull();
    expect(cloudinaryOgPhotoUrl(null)).toBeNull();
  });
});

describe('fetchOgPhoto', () => {
  it('returns a data URI for a jpeg/png response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(JPEG)));
    expect(await fetchOgPhoto(URL1)).toMatch(/^data:image\/jpeg;base64,/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(PNG)));
    expect(await fetchOgPhoto(URL1)).toMatch(/^data:image\/png;base64,/);
  });
  it('returns null for non-Cloudinary input without fetching', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await fetchOgPhoto('/images/placeholder-bloom.jpg')).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it('returns null on HTTP error, network error, unsupported bytes and oversize', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(JPEG, { status: 404 })));
    expect(await fetchOgPhoto(URL1)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    expect(await fetchOgPhoto(URL1)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))));
    expect(await fetchOgPhoto(URL1)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(JPEG, { headers: { 'content-length': String(10 * 1024 * 1024) } })));
    expect(await fetchOgPhoto(URL1)).toBeNull();
    const big = new Uint8Array(3 * 1024 * 1024);
    big.set(JPEG);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp(big)));
    expect(await fetchOgPhoto(URL1)).toBeNull();
  });
  it('passes an abort signal (timeout)', async () => {
    const f = vi.fn().mockResolvedValue(resp(JPEG));
    vi.stubGlobal('fetch', f);
    await fetchOgPhoto(URL1);
    expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('clampProductName / ogPrice', () => {
  it('leaves short names, truncates very long ones with an ellipsis', () => {
    expect(clampProductName('Red Rose')).toBe('Red Rose');
    const long = 'Premium Long Stem Imported Red Roses Luxury Gift Bouquet With Seasonal Fillers And Greens Extra Large';
    const out = clampProductName(long);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith('…')).toBe(true);
    expect(long.startsWith(out.slice(0, -1).trimEnd())).toBe(true);
  });
  it('formats INR, and returns null for enquiry/invalid prices', () => {
    expect(ogPrice({ price: 1499, saleMode: 'PURCHASE' })).toBe('₹1,499');
    expect(ogPrice({ price: '499', saleMode: undefined })).toBe('₹499');
    expect(ogPrice({ price: 499, saleMode: 'ENQUIRY' })).toBeNull();
    expect(ogPrice({ price: NaN, saleMode: 'PURCHASE' })).toBeNull();
  });
});

describe('nameFontSize', () => {
  it('is large for short names and smaller for long ones', () => {
    expect(nameFontSize('Red Rose')).toBe(96);
    expect(nameFontSize('Premium Red Rose Bouquet Large')).toBe(78);
    expect(nameFontSize('x '.repeat(40).trim())).toBeLessThanOrEqual(52);
  });
  it('shrinks so one very long word still fits the column, never below 36', () => {
    expect(nameFontSize('Chrysanthemums')).toBeLessThan(96);
    expect(nameFontSize("Chrysanthemums") * 14 * 0.58).toBeLessThanOrEqual(468);
    expect(nameFontSize('A'.repeat(60))).toBe(36);
  });
});
