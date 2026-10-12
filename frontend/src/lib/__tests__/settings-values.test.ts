import { describe, it, expect } from 'vitest';
import {
  isPlaceholderSetting,
  whatsappLink,
  telLink,
  mailtoLink,
  instagramLink,
} from '../settings-context';

describe('isPlaceholderSetting', () => {
  it.each([
    '',
    '   ',
    'orders@example.com',
    'Delhi NCR — please update with real address',
    'Delhi NCR — please update',
    'PLACEHOLDER text',
    'Lorem ipsum dolor',
  ])('treats %j as unset', (v) => expect(isPlaceholderSetting(v)).toBe(true));

  it.each(['+91 93540 16059', 'hello@freshpetals.in', '12 Mandi Road, Delhi'])('keeps %j', (v) =>
    expect(isPlaceholderSetting(v)).toBe(false),
  );

  it('treats undefined/null as unset', () => {
    expect(isPlaceholderSetting(undefined)).toBe(true);
    expect(isPlaceholderSetting(null)).toBe(true);
  });
});

describe('link builders', () => {
  it('mailtoLink strips ?, # and whitespace and rejects bad shapes', () => {
    expect(mailtoLink('hello@example.in')).toBe('mailto:hello@example.in');
    expect(mailtoLink(' a@b.co ')).toBe('mailto:a@b.co');
    expect(mailtoLink('a@b.co?subject=x')).toBe('mailto:a@b.cosubject=x');
    expect(mailtoLink('a@b.co#x')).toBe('mailto:a@b.cox');
    expect(mailtoLink('a@b.co?bcc=x@y.z')).toBeNull();
    expect(mailtoLink('not an email')).toBeNull();
    expect(mailtoLink('')).toBeNull();
  });

  it('telLink keeps digits and a leading plus only', () => {
    expect(telLink('+91 93540-16059')).toBe('tel:+919354016059');
    expect(telLink('tel:12;ext=5 (3)')).toBe('tel:1253');
    expect(telLink('abc')).toBeNull();
  });

  it('instagramLink strips @, encodes the handle, and only accepts instagram.com URLs', () => {
    expect(instagramLink('@fresh.petals')).toBe('https://www.instagram.com/fresh.petals');
    expect(instagramLink('a b/c?d')).toBe('https://www.instagram.com/a%20b%2Fc%3Fd');
    expect(instagramLink('https://www.instagram.com/fp')).toBe('https://www.instagram.com/fp');
    expect(instagramLink('https://evil.example/x')).toBeNull();
    expect(instagramLink('javascript:alert(1)')).toBe('https://www.instagram.com/javascript%3Aalert(1)');
    expect(instagramLink('')).toBeNull();
  });

  it('whatsappLink builds from digits and accepts only an exact wa.me link', () => {
    expect(whatsappLink('+91 93540 16059')).toBe('https://wa.me/919354016059');
    expect(whatsappLink('919354016059', 'Hi there')).toBe('https://wa.me/919354016059?text=Hi%20there');
    expect(whatsappLink('https://wa.me/919354016059')).toBe('https://wa.me/919354016059');
    expect(whatsappLink('https://evil.example/919354016059')).toBeNull();
    expect(whatsappLink('http://wa.me/9193')).toBeNull();
    expect(whatsappLink('123')).toBeNull();
    expect(whatsappLink('')).toBeNull();
  });
});
