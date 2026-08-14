import type { ApiErrorBody } from './types';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');

type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

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

  get code(): string | undefined {
    return this.body?.code;
  }
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
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

// ── Silent refresh ────────────────────────────────────────────────────────────
// One in-flight refresh promise shared across concurrent 401s.
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refresh cookie
        cache: 'no-store',
      });
      if (!response.ok) return false;

      const data = (await response.json()) as { accessToken: string };
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  { query, body, signal }: RequestOptions = {},
): Promise<T> {
  const isAuthPath = path.includes('/auth/login') || path.includes('/auth/refresh');
  const hasBody = body !== undefined;

  const doFetch = () =>
    fetch(buildUrl(path, query), {
      method,
      headers: {
        ...getAuthHeaders(),
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal,
      cache: 'no-store',
    });

  let response = await doFetch();

  // 401 on a non-auth endpoint → attempt silent refresh and retry once
  if (response.status === 401 && !isAuthPath && typeof window !== 'undefined') {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      response = await doFetch();
    } else {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return undefined as T;
    }
  }

  // Still 401 after retry → force logout
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    return undefined as T;
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody | null);
  }
  return data as T;
}

async function downloadFile(
  path: string,
  filename: string,
  query?: Query,
): Promise<void> {
  const response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: { ...getAuthHeaders() },
    credentials: 'include',
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
