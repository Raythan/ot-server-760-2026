import crypto, { timingSafeEqual } from 'node:crypto';

/** Same as TFS `passwordType = sha1`: hex string, 40 chars */
export function sha1Password(plain: string): string {
  return crypto.createHash('sha1').update(plain, 'utf8').digest('hex');
}

const RECOVERY_KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Remove espaços e traços; maiúsculas — para hash e comparação. */
export function normalizeRecoveryKeyInput(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export function hashRecoveryKey(plain: string): string {
  const n = normalizeRecoveryKeyInput(plain);
  return crypto.createHash('sha256').update(n, 'utf8').digest('hex');
}

/** Formato XXXX-XXXX-XXXX-XXXX (sem I, O, 0, 1). */
export function generateRecoveryKeyPlain(): string {
  let s = '';
  for (let g = 0; g < 4; g++) {
    if (g > 0) s += '-';
    for (let i = 0; i < 4; i++) {
      s += RECOVERY_KEY_CHARS[crypto.randomInt(0, RECOVERY_KEY_CHARS.length)]!;
    }
  }
  return s;
}

export function generateResetTokenPlain(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashResetToken(plain: string): string {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex');
}

/** Compara dois hashes SHA-256 em hex (64 chars) em tempo aproximadamente constante. */
export function hexHashesEqual(a: string, b: string): boolean {
  if (a.length !== 64 || b.length !== 64) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
