import { describe, expect, it } from 'vitest';
import type { Comment } from './comment.js';
import { createInMemoryCommentRepository } from './commentRepository.js';

function comment(id: string, bearId: string, createdAt: string): Comment {
  return {
    id,
    bearId,
    authorId: null,
    author: 'Anna',
    text: 'Hello',
    createdAt,
  };
}

describe('in-memory comment repository', () => {
  it('lists the comments of one bear, newest first', async () => {
    const repository = createInMemoryCommentRepository();
    await repository.insert(comment('b', 'bear-1', '2026-01-02T00:00:00.000Z'));
    await repository.insert(comment('a', 'bear-1', '2026-01-01T00:00:00.000Z'));
    await repository.insert(comment('c', 'bear-2', '2026-01-01T00:00:00.000Z'));

    const result = await repository.listByBear('bear-1', { limit: 10 });

    expect(result.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it('continues after the cursor position (keyset pagination)', async () => {
    const repository = createInMemoryCommentRepository();
    await repository.insert(comment('a', 'bear-1', '2026-01-01T00:00:00.000Z'));
    await repository.insert(comment('b', 'bear-1', '2026-01-02T00:00:00.000Z'));
    await repository.insert(comment('c', 'bear-1', '2026-01-03T00:00:00.000Z'));

    const firstPage = await repository.listByBear('bear-1', { limit: 2 });
    const secondPage = await repository.listByBear('bear-1', {
      limit: 2,
      after: { createdAt: '2026-01-02T00:00:00.000Z', id: 'b' },
    });

    expect(firstPage.map((entry) => entry.id)).toEqual(['c', 'b']);
    expect(secondPage.map((entry) => entry.id)).toEqual(['a']);
  });

  it('loads the comments of many bears in one call (no N+1)', async () => {
    const repository = createInMemoryCommentRepository();
    await repository.insert(comment('a', 'bear-1', '2026-01-01T00:00:00.000Z'));
    await repository.insert(comment('b', 'bear-2', '2026-01-01T00:00:00.000Z'));

    const result = await repository.listByBears(['bear-1', 'bear-2', 'bear-3']);

    expect(result.get('bear-1')?.map((entry) => entry.id)).toEqual(['a']);
    expect(result.get('bear-2')?.map((entry) => entry.id)).toEqual(['b']);
    expect(result.get('bear-3')).toEqual([]);
  });

  it('returns copies, so callers cannot change stored data', async () => {
    const repository = createInMemoryCommentRepository();
    await repository.insert(comment('a', 'bear-1', '2026-01-01T00:00:00.000Z'));

    const [first] = await repository.listByBear('bear-1', { limit: 10 });
    if (first !== undefined) first.text = 'changed';

    const stored = await repository.findById('a');
    expect(stored?.text).toBe('Hello');
  });
});
