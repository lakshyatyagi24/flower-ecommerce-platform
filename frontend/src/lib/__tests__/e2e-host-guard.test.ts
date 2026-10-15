import { describe, expect, it } from 'vitest';
import { assertAllowedUrl, isAllowedUrl, normaliseHost } from '../../../e2e/support/host-guard';

describe('e2e host allowlist', () => {
  it.each([
    'http://localhost:3000',
    'http://localhost',
    'https://localhost:8443/path?x=1',
    'http://LOCALHOST:3001',
    'http://localhost.:3000',
    'http://127.0.0.1:3001',
    'http://[::1]:3000',
    'http://shop.localhost:3000',
    'http://api.e2e.test',
    'http://anything.test:8080',
  ])('allows %s', (url) => {
    expect(isAllowedUrl(url)).toBe(true);
  });

  it.each([
    ['apex', 'https://freshpetalsindia.com'],
    ['www', 'https://www.freshpetalsindia.com'],
    ['api subdomain', 'https://api.freshpetalsindia.com'],
    ['admin subdomain', 'https://admin.freshpetalsindia.com/'],
    ['trailing dot', 'https://freshpetalsindia.com.'],
    ['trailing dot subdomain', 'https://api.freshpetalsindia.com.'],
    ['uppercase', 'https://FreshPetalsIndia.COM'],
    ['percent-encoded dot lower', 'https://freshpetalsindia%2ecom'],
    ['percent-encoded dot upper', 'https://api%2Efreshpetalsindia.com'],
    ['percent-encoded letter', 'https://freshpetalsindia.c%6fm'],
    ['VPS IP', 'http://162.35.27.175'],
    ['VPS IP with port', 'http://162.35.27.175:3001'],
    ['other public IP', 'http://8.8.8.8'],
    ['private LAN IP', 'http://192.168.1.20:3000'],
    ['0.0.0.0', 'http://0.0.0.0:3000'],
    ['other IPv6', 'http://[2001:db8::1]'],
    ['look-alike suffix', 'http://localhost.evil.com'],
    ['look-alike prefix', 'http://notlocalhost'],
    ['test-ish suffix', 'http://x.test.evil.com'],
    ['userinfo trick', 'http://localhost@freshpetalsindia.com'],
    ['userinfo', 'http://user:pw@localhost:3000'],
    ['ftp', 'ftp://localhost'],
    ['not a url', 'localhost:3000'],
    ['empty', ''],
  ])('rejects %s', (_name, url) => {
    expect(isAllowedUrl(url)).toBe(false);
  });

  it('http and https are both fine on an allowed host, any port', () => {
    expect(isAllowedUrl('http://localhost:1')).toBe(true);
    expect(isAllowedUrl('https://localhost:65535')).toBe(true);
  });

  describe('E2E_ALLOW_HOST', () => {
    it('allows exactly the named host (case and trailing dot insensitive)', () => {
      expect(isAllowedUrl('https://staging.example.org', 'staging.example.org')).toBe(true);
      expect(isAllowedUrl('https://STAGING.example.org.', 'Staging.Example.org.')).toBe(true);
    });
    it('does not allow siblings, parents or children', () => {
      expect(isAllowedUrl('https://other.example.org', 'staging.example.org')).toBe(false);
      expect(isAllowedUrl('https://example.org', 'staging.example.org')).toBe(false);
      expect(isAllowedUrl('https://x.staging.example.org', 'staging.example.org')).toBe(false);
    });
    it('can opt in an explicit non-loopback IP, but never the production VPS or domain', () => {
      expect(isAllowedUrl('http://10.0.0.5:3000', '10.0.0.5')).toBe(true);
      expect(isAllowedUrl('http://162.35.27.175', '162.35.27.175')).toBe(false);
      expect(isAllowedUrl('https://freshpetalsindia.com', 'freshpetalsindia.com')).toBe(false);
      expect(isAllowedUrl('https://api.freshpetalsindia.com', 'api.freshpetalsindia.com')).toBe(false);
      expect(isAllowedUrl('https://freshpetalsindia.com.', 'freshpetalsindia.com.')).toBe(false);
    });
    it('ignores a malformed or empty value', () => {
      expect(isAllowedUrl('https://staging.example.org', '')).toBe(false);
      expect(isAllowedUrl('https://staging.example.org', '%2e')).toBe(false);
    });
  });

  it('normaliseHost lower-cases, strips trailing dots, rejects percent-encoding', () => {
    expect(normaliseHost(' Example.COM.. ')).toBe('example.com');
    expect(normaliseHost('a%2eb')).toBeNull();
    expect(normaliseHost('')).toBeNull();
  });

  it('assertAllowedUrl throws a pointed message for production', () => {
    expect(() => assertAllowedUrl('E2E_BASE_URL', 'https://freshpetalsindia.com', undefined)).toThrow(/not an allowed e2e target/);
    expect(() => assertAllowedUrl('E2E_BASE_URL', 'http://localhost:3000', undefined)).not.toThrow();
  });
});
