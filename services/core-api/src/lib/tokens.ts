import crypto from 'crypto';

/**
 * Generate a random token that can be embedded into a QR code.
 * Tokens are not stored in the database directly – only their HMAC hash.
 */
export function generateToken(): string {
  // 16 bytes = 32 hex characters. More than enough for the kiosk use‑case.
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Calculate HMAC-SHA256 hash for a raw token. The secret key is provided via
 * `TOKEN_SECRET` environment variable. This helper is used both when issuing a
 * pass and when redeeming it from the kiosk.
 */
export function hashToken(token: string): string {
  const secret = process.env.TOKEN_SECRET || '';
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export type HashedToken = string;

