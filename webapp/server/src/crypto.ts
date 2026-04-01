import crypto from 'node:crypto';

/** Same as TFS `passwordType = sha1`: hex string, 40 chars */
export function sha1Password(plain: string): string {
  return crypto.createHash('sha1').update(plain, 'utf8').digest('hex');
}
