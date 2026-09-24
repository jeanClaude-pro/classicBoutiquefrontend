/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginPayload, RegisterPayload, LoginResponse, User } from "../types/auth";
import { serverUrl } from "../utils/constants";
import { ApiError, apiErrorFromPayload, toApiError } from "../lib/apiError";

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res: Response;
  try {
    res = await fetch(`${serverUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  } catch (error) {
    throw toApiError(error);
  }

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    // On the login form a 401 means wrong credentials, not an expired session.
    if (path === "/auth/login" && res.status === 401) {
      throw new ApiError({ status: 401, title: "Connexion refusée", message: "Email ou mot de passe incorrect." });
    }
    throw apiErrorFromPayload(res.status, data);
  }
  return data as T;
}

export function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function register(payload: RegisterPayload) {
  return apiFetch<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Only if you implement it on the server:
export function fetchMe() {
  return apiFetch<User>("/users/me", { method: "GET" });
}
