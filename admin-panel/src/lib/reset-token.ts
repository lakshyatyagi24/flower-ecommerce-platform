/** A reset token is exactly 64 hex characters (32 random bytes). */
export function isValidResetToken(token: string | null | undefined): token is string {
  return typeof token === "string" && /^[0-9a-fA-F]{64}$/.test(token);
}
