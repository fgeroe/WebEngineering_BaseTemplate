import { bearListSchema, type Bear } from './types';

export async function fetchBears(signal: AbortSignal): Promise<Bear[]> {
  const response = await fetch('/api/bears', {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Server responded with ' + response.status);
  }

  const result = bearListSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('Server sent bear data in an unexpected format');
  }
  return result.data;
}
