// Guard against open-redirects. Only internal, path-absolute targets are
// allowed; anything pointing off-site (https://evil, //evil, /\evil) is
// rejected so a crafted ?callbackUrl=... cannot bounce a just-authenticated
// user to an attacker-controlled page.
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v.startsWith('/')) return null;
  // Block protocol-relative ("//host") and backslash tricks ("/\host").
  if (v[1] === '/' || v[1] === '\\') return null;
  return v;
}
