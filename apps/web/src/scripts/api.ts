import type { z } from 'zod';

async function send(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error('Server responded with ' + response.status);
  }
  return response;
}

export async function requestJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init: RequestInit = {}
): Promise<T> {
  const response = await send(url, init);
  const result = schema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('Server sent data in an unexpected format');
  }
  return result.data;
}

export async function requestWithoutContent(
  url: string,
  init: RequestInit = {}
): Promise<void> {
  await send(url, init);
}

export function jsonBody(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
