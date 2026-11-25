import { z } from 'zod';
import { ApiError, jsonBody, requestJson, requestWithoutContent } from '../api';

export const passwordMinLength = 6;

const userSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  role: z.string(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;

export interface Registration {
  email: string;
  password: string;
}

export async function registerUser(registration: Registration): Promise<User> {
  return await requestJson('/api/auth/register', userSchema, {
    method: 'POST',
    ...jsonBody(registration),
  });
}

export interface Credentials {
  email: string;
  password: string;
}

export async function loginUser(credentials: Credentials): Promise<User> {
  return await requestJson('/api/auth/login', userSchema, {
    method: 'POST',
    ...jsonBody(credentials),
  });
}

export async function logoutUser(): Promise<void> {
  await requestWithoutContent('/api/auth/logout', { method: 'POST' });
}

/** The logged-in user, or null when there is no valid session (401). */
export async function fetchCurrentUser(
  signal: AbortSignal
): Promise<User | null> {
  try {
    return await requestJson('/api/auth/me', userSchema, { signal });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}
