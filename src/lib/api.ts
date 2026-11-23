/* eslint-disable @typescript-eslint/no-explicit-any */

import { serverUrl } from "../utils/constants";

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    // The session is the httpOnly cookie the browser sends by itself.
    const res = await fetch(`${serverUrl}/${path}`, {
        ...options,
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const data = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data as T;
};