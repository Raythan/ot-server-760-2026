const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (path.startsWith('/')) {
    return base ? `${base}${path}` : path;
  }
  return base ? `${base}/${path}` : `/${path}`;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new Error(
      'Sem ligação ao servidor. Confirme que a API está a executar e, em desenvolvimento, que abre o site pelo endereço do Vite (por exemplo localhost:5173) para o encaminhamento de /api funcionar.'
    );
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(text.slice(0, 200));
    }
  }
  if (!res.ok) {
    const o = data as { error?: string; detail?: string };
    let msg = o?.error ?? res.statusText;
    if (o?.detail) {
      msg = `${msg} (${o.detail})`;
    }
    throw new Error(msg);
  }
  return data as T;
}
