/**
 * Thin API client. Every request automatically carries the current user's
 * Firebase ID token, and errors are normalised into ApiError so screens can
 * show meaningful messages.
 */
import { auth } from "../config/firebase";
import { env } from "../config/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Set false for unauthenticated endpoints (e.g. /meta). Defaults true. */
  auth?: boolean;
}

const REQUEST_TIMEOUT_MS = 8000;

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth: needsAuth = true } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (needsAuth) {
    const user = auth.currentUser;
    if (!user) {
      throw new ApiError(401, "unauthorized", "Not signed in");
    }
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const timedOut =
      e instanceof Error && (e.name === "AbortError" || e.message.includes("aborted"));
    throw new ApiError(
      0,
      timedOut ? "timeout" : "network",
      timedOut ? "Network request timed out" : "Network request failed",
      e,
    );
  } finally {
    clearTimeout(timeout);
  }

  // 204 / empty body
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "error",
      err.message ?? `Request failed (${res.status})`,
      err.details,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
