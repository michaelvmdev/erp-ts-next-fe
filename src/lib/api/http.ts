import type { ApiErrorBody } from './types';

/**
 * Cliente HTTP base contra el proxy de Next (`/api/*`), que a su vez reenvia al
 * backend NestJS. Al ser mismo origen no hace falta CORS ni conocer la URL real
 * del backend desde el navegador.
 *
 * Pensado para componentes de cliente. Desde un Server Component / route handler
 * la URL relativa no resuelve: define `NEXT_PUBLIC_API_BASE` con un origen
 * absoluto en ese caso.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');

type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

/** Error tipado: expone el status HTTP y el cuerpo de error de la API. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
  ) {
    super(
      body
        ? Array.isArray(body.message)
          ? body.message.join(' ')
          : body.message
        : `HTTP ${status}`,
    );
    this.name = 'ApiError';
  }

  /** Codigo estable del error (p. ej. "VALIDATION_ERROR"), si vino. */
  get code(): string | undefined {
    return this.body?.code;
  }
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // Se omiten vacios para no ensuciar la URL con `?campo=`.
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  { query, body, signal }: RequestOptions = {},
): Promise<T> {
  const hasBody = body !== undefined;
  const authHeaders = getAuthHeaders();

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...authHeaders,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
    cache: 'no-store',
  });

  // 401 → clear token and redirect to login (only in browser, not during login itself)
  if (response.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/login')) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    return undefined as T;
  }

  // 204 No Content (p. ej. DELETE de productos): sin cuerpo que parsear.
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody | null);
  }
  return data as T;
}

/** Descarga un endpoint que devuelve un archivo (CSV, PDF…) y dispara el guardado. */
async function downloadFile(
  path: string,
  filename: string,
  query?: Query,
): Promise<void> {
  const authHeaders = getAuthHeaders();
  const response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: { ...authHeaders },
    cache: 'no-store',
  });
  if (!response.ok) throw new ApiError(response.status, null);
  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('POST', path, { body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('PATCH', path, { body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('PUT', path, { body, signal }),
  delete: <T = void>(path: string, signal?: AbortSignal) =>
    request<T>('DELETE', path, { signal }),
  download: downloadFile,
};
