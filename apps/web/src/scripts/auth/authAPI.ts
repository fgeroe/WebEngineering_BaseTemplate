import { z } from 'zod';
import { jsonBody, requestJson } from '../api';

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
