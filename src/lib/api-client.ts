// Minimal typed fetch wrapper for the Django REST backend.
// - Reads base URL from VITE_API_BASE_URL
// - Attaches JWT bearer from localStorage
// - Transparently refreshes the access token on 401 using the refresh token
// - Throws a typed ApiError with parsed body on non-2xx responses

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const ACCESS_KEY = "mkk.access";
const REFRESH_KEY = "mkk.refresh";
const USER_KEY = "mkk.user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh: string) {
  window.localStorage.setItem(ACCESS_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}
export function setStoredUser(user: unknown) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh || !BASE) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return false;
    window.localStorage.setItem(ACCESS_KEY, data.access);
    if (data.refresh) window.localStorage.setItem(REFRESH_KEY, data.refresh);
    return true;
  } catch {
    return false;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown | FormData;
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function doFetch(path: string, opts: Options): Promise<Response> {
  if (!BASE) {
    throw new ApiError(
      0,
      null,
      "VITE_API_BASE_URL is not configured. Copy .env.example to .env and point it at your Django backend.",
    );
  }

  const headers: Record<string, string> = { Accept: "application/json", ...(opts.headers || {}) };
  const isFormData = opts.body instanceof FormData;

  // Only set Content-Type for non‑FormData bodies
  if (opts.body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  // For FormData, the browser sets the correct Content-Type with boundary.

  if (opts.auth !== false) {
    const t = getAccessToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const body = isFormData ? (opts.body as FormData) : (opts.body !== undefined ? JSON.stringify(opts.body) : undefined);

  return fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
  });
}

export async function apiRequest<T>(path: string, opts: Options = {}): Promise<T> {
  let res = await doFetch(path, opts);

  // Refresh once on 401 if we're authenticated and have a refresh token.
  if (res.status === 401 && opts.auth !== false && getRefreshToken()) {
    const ok = await tryRefresh();
    if (ok) {
      res = await doFetch(path, opts);
    } else {
      clearAuth();
    }
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body: unknown = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (isJson && body && typeof body === "object" && "detail" in body && typeof (body as { detail: unknown }).detail === "string"
        ? (body as { detail: string }).detail
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, body, message);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, opts: Omit<Options, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts: Omit<Options, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts: Omit<Options, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts: Omit<Options, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};