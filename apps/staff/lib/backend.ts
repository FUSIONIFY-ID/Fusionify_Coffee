import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const accessCookie = 'fusionify_staff_access';
const refreshCookie = 'fusionify_staff_refresh';

type StaffTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

function backendBaseUrl() {
  const value = process.env.FUSIONIFY_API_BASE_URL?.trim();
  if (!value) throw new Error('FUSIONIFY_API_BASE_URL is required.');
  return value.replace(/\/$/, '');
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function setStaffSession(tokens: StaffTokenResponse) {
  const store = await cookies();
  store.set(accessCookie, tokens.accessToken, cookieOptions(15 * 60));
  store.set(refreshCookie, tokens.refreshToken, cookieOptions(8 * 60 * 60));
}

export async function clearStaffSession() {
  const store = await cookies();
  store.set(accessCookie, '', cookieOptions(0));
  store.set(refreshCookie, '', cookieOptions(0));
}

export async function backendPublicFetch(path: string, init?: RequestInit) {
  return fetch(backendBaseUrl() + path, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

export async function backendStaffFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  const accessToken = store.get(accessCookie)?.value;

  const request = (token?: string) =>
    fetch(backendBaseUrl() + path, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

  const first = await request(accessToken);
  if (first.status !== 401) return first;

  const refreshToken = store.get(refreshCookie)?.value;
  if (!refreshToken) return first;

  const refreshed = await backendPublicFetch('/v1/staff/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshed.ok) {
    await clearStaffSession();
    return first;
  }

  const tokens = (await refreshed.json()) as StaffTokenResponse;
  await setStaffSession(tokens);
  return request(tokens.accessToken);
}

export async function forwardResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? 'application/json';
  const body = await response.text();
  return new NextResponse(body || null, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
}
