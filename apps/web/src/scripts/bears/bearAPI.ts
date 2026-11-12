import { requestJson } from '../api';
import { bearListSchema, type Bear } from './types';

export async function fetchBears(signal: AbortSignal): Promise<Bear[]> {
  return await requestJson('/api/bears', bearListSchema, { signal });
}
