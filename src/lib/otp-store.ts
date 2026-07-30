// In-memory OTP store for admin password reset.
// Kept on globalThis so it survives Next.js hot-reloads in dev (single process).
// NOTE: this is per-server-process. For multi-instance production, move to DB/Redis.

interface OtpEntry {
  otp: string;
  email: string; // admin account being reset
  expires: number;
  attempts: number;
}

const g = globalThis as unknown as { __hrmsOtp?: Map<string, OtpEntry> };
const store: Map<string, OtpEntry> = g.__hrmsOtp ?? (g.__hrmsOtp = new Map());

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOtp(email: string): string {
  const key = email.toLowerCase();
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  store.set(key, { otp, email: key, expires: Date.now() + TTL_MS, attempts: 0 });
  return otp;
}

/** Returns "ok" | "invalid" | "expired" | "locked". Consumes on success. */
export function verifyOtp(email: string, otp: string): "ok" | "invalid" | "expired" | "locked" {
  const key = email.toLowerCase();
  const entry = store.get(key);
  if (!entry) return "invalid";
  if (Date.now() > entry.expires) { store.delete(key); return "expired"; }
  if (entry.attempts >= MAX_ATTEMPTS) { store.delete(key); return "locked"; }
  if (entry.otp !== otp) { entry.attempts += 1; return "invalid"; }
  store.delete(key);
  return "ok";
}
