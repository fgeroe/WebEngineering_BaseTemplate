import { z } from 'zod';
import { ValidationError } from '../errors.js';
import type { Comment } from './comment.js';

export interface CommentCursor {
  createdAt: string;
  id: string;
}

const cursorSchema = z.object({ createdAt: z.iso.datetime(), id: z.uuid() });

export function encodeCursor({ createdAt, id }: Comment): string {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64url');
}

export function decodeCursor(cursor: string): CommentCursor {
  try {
    const json: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8')
    );
    return cursorSchema.parse(json);
  } catch {
    throw new ValidationError('The cursor is invalid.', [
      {
        in: 'querystring',
        pointer: '/cursor',
        detail: 'Use the nextCursor value of the previous page',
      },
    ]);
  }
}
