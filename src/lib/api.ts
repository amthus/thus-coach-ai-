import type { ApiErrorBody } from '../../shared/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: method === 'GET' ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Connexion au serveur impossible. Vérifiez votre réseau.');
  }
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const e = (data as ApiErrorBody | null)?.error;
    throw new ApiError(res.status, e?.code ?? 'http_error', e?.message ?? `Erreur ${res.status}`, e?.details as Record<string, string[]>);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
