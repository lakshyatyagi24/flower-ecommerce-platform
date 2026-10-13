// Guard against open-redirects. Only internal, path-absolute targets are
// allowed; anything pointing off-site (https://evil, //evil, /\evil, or tricks
// using control characters that browsers strip, e.g. "/\t/evil.com") is
// rejected so a crafted ?callbackUrl=... cannot bounce a just-authenticated
// user to an attacker-controlled page.
const BAD_CHARS = new RegExp('[\\u0000-\\u001f\\u007f\\\\]');

function isSameOrigin(v: string): boolean {
  try {
    const u = new URL(v, 'http://x');
    return u.host === 'x' && u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v.startsWith('/')) return null;
  if (BAD_CHARS.test(v)) return null;
  // Block protocol-relative ("//host").
  if (v[1] === '/') return null;
  // A percent-encoded control char / backslash / second slash right after the first slash
  // can turn into "//host" if anything downstream decodes the value again.
  let decoded = v;
  try {
    decoded = decodeURIComponent(v);
  } catch {
    return null;
  }
  if (BAD_CHARS.test(decoded) || decoded.startsWith('//')) return null;
  if (!isSameOrigin(v) || !isSameOrigin(decoded)) return null;
  return v;
}
