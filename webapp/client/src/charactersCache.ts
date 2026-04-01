const CACHE_KEY = 'ot_characters_cache_v1';
const TTL_MS = 3 * 60 * 1000;

export type CharRow = {
  id: number;
  name: string;
  level: number;
  vocation: number;
  online: boolean;
};

type CacheEntry = {
  accountId: number;
  ts: number;
  characters: CharRow[];
  limit: number;
};

function jwtPayloadB64UrlToString(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  return atob(b64);
}

/** Extrai `sub` (account id) do JWT sem validar assinatura — só para chave de cache. */
export function getAccountIdFromJwt(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(jwtPayloadB64UrlToString(parts[1])) as {
      sub?: unknown;
    };
    const sub = payload.sub;
    const id = typeof sub === 'string' ? parseInt(sub, 10) : Number(sub);
    return Number.isFinite(id) && id >= 1 ? id : null;
  } catch {
    return null;
  }
}

export function readCharactersCache(
  accountId: number
): { characters: CharRow[]; limit: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.accountId !== accountId) return null;
    if (Date.now() - entry.ts > TTL_MS) return null;
    return {
      characters: entry.characters,
      limit: entry.limit ?? 50,
    };
  } catch {
    return null;
  }
}

export function writeCharactersCache(
  accountId: number,
  characters: CharRow[],
  limit: number
): void {
  const entry: CacheEntry = {
    accountId,
    ts: Date.now(),
    characters,
    limit,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

export function invalidateCharactersCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
