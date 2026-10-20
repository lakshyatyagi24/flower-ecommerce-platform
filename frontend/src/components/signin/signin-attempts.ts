export const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const POST_SIGNIN_REDIRECT_KEY = "post_signin_redirect";

type AttemptRecord = { count: number; lockUntil?: number };

// Failed attempts are tracked per email in sessionStorage (a UX throttle; the server enforces the real limit).
const attemptKey = (email: string) => `signin_fail_${(email || "guest").toLowerCase()}`;

function readRecord(email: string): AttemptRecord {
  try {
    const v = sessionStorage.getItem(attemptKey(email));
    const rec = v ? (JSON.parse(v) as AttemptRecord) : { count: 0 };
    // Once a lock window has elapsed, grant a fresh set of attempts instead of leaving count pinned at MAX
    // (which permanently showed "no attempts remaining" and re-locked on the very next failure).
    return rec.lockUntil && rec.lockUntil <= Date.now() ? { count: 0 } : rec;
  } catch {
    return { count: 0 };
  }
}

function writeRecord(email: string, rec: AttemptRecord): void {
  try {
    sessionStorage.setItem(attemptKey(email), JSON.stringify(rec));
  } catch {}
}

export function recordFailure(email: string): void {
  const rec = readRecord(email);
  rec.count = (rec.count || 0) + 1;
  if (rec.count >= MAX_ATTEMPTS) rec.lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
  writeRecord(email, rec);
}

export function clearFailures(email: string): void {
  try {
    sessionStorage.removeItem(attemptKey(email));
  } catch {}
}

/** The timestamp the lock ends at, or 0 when the email is not locked. */
export function lockedUntil(email: string): number {
  const { lockUntil } = readRecord(email);
  return lockUntil && lockUntil > Date.now() ? lockUntil : 0;
}

export function remainingAttempts(email: string): number {
  return Math.max(0, MAX_ATTEMPTS - (readRecord(email).count || 0));
}

function readFromQuery(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("callbackUrl") || params.get("redirect") || null;
  } catch {
    return null;
  }
}

function readFromStorage(): string | null {
  try {
    return sessionStorage.getItem(POST_SIGNIN_REDIRECT_KEY) || null;
  } catch {
    return null;
  }
}

/** Where to go after signing in: the callback in the URL first, else the one a gated action stored. */
export function readRedirectTarget(): string | null {
  return readFromQuery() ?? readFromStorage();
}

export function clearStoredRedirect(): void {
  try {
    sessionStorage.removeItem(POST_SIGNIN_REDIRECT_KEY);
  } catch {}
}

export function lockedMessage(lockUntil: number): string {
  const mins = Math.ceil((lockUntil - Date.now()) / 60000);
  return `Too many failed attempts. Try again in ${mins} minute(s).`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
