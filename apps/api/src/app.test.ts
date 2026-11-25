import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import type { Bear } from './bears/bear.js';
import { createInMemoryBearRepository } from './bears/bearRepository.js';
import { createBearService } from './bears/bearService.js';
import type { CommentPage } from './comments/comment.js';
import {
  createInMemoryCommentRepository,
  createInMemoryCommentTransaction,
} from './comments/commentRepository.js';
import { createCommentService } from './comments/commentService.js';

const testBears: Bear[] = [
  {
    id: 'ursus-arctos',
    name: 'Brown bear',
    binomial: 'Ursus arctos',
    imageUrl: null,
    range: 'Europe, Asia and North America',
  },
  {
    id: 'ursus-maritimus',
    name: 'Polar bear',
    binomial: 'Ursus maritimus',
    imageUrl: null,
    range: 'Arctic',
  },
];

const unknownCommentId = '00000000-0000-4000-8000-000000000000';

let app: FastifyInstance;
let databaseUp: boolean;

beforeEach(() => {
  databaseUp = true;
  const bears = createBearService(createInMemoryBearRepository(testBears));
  const commentRepository = createInMemoryCommentRepository();
  const comments = createCommentService({
    bears,
    comments: commentRepository,
    transaction: createInMemoryCommentTransaction(commentRepository),
  });
  app = buildApp({
    bears,
    comments,
    checkDatabase: async () => {
      if (!databaseUp) throw new Error('database down');
    },
  });
});

afterEach(async () => {
  await app.close();
});

describe('bears', () => {
  it('lists the bears in their stored order', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/bears' });

    expect(response.statusCode).toBe(200);
    expect(response.json<Bear[]>().map((bear) => bear.id)).toEqual([
      'ursus-arctos',
      'ursus-maritimus',
    ]);
  });

  it('filters the bears by name with ?q=', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears?q=POLAR',
    });

    expect(response.json<Bear[]>().map((bear) => bear.id)).toEqual([
      'ursus-maritimus',
    ]);
  });

  it('answers 404 as Problem Details for an unknown bear', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears/unknown',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain(
      'application/problem+json'
    );
  });
});

describe('comments', () => {
  it('creates, lists and deletes a comment', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      payload: { author: 'Anna', text: 'Big bear!' },
    });
    expect(created.statusCode).toBe(201);
    const { id } = created.json<{ id: string }>();
    expect(created.headers.location).toBe(`/api/comments/${id}`);

    const listed = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments',
    });
    expect(listed.json<CommentPage>().items).toHaveLength(1);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${id}`,
    });
    expect(deleted.statusCode).toBe(204);

    const deletedAgain = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${id}`,
    });
    expect(deletedAgain.statusCode).toBe(404);
  });

  it('pages through all comments with the cursor', async () => {
    for (let i = 1; i <= 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/bears/ursus-arctos/comments',
        payload: { author: 'Anna', text: `Comment ${i}` },
      });
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const query: string = cursor === null ? '' : `&cursor=${cursor}`;
      const response = await app.inject({
        method: 'GET',
        url: `/api/bears/ursus-arctos/comments?limit=2${query}`,
      });
      const page = response.json<CommentPage>();
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor;
      pages++;
    } while (cursor !== null);

    expect(pages).toBe(3);
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('rejects an invalid cursor with 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments?cursor=garbage',
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects an empty comment with 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      payload: { author: ' ', text: '' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('answers 404 for comments on an unknown bear', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bears/unknown/comments',
      payload: { author: 'Anna', text: 'Hello' },
    });

    expect(response.statusCode).toBe(404);
  });

  it('answers 400 for a comment id that is not a uuid', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/comments/not-a-uuid',
    });

    expect(response.statusCode).toBe(400);
  });

  it('answers 404 for an unknown comment', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${unknownCommentId}`,
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('reports', () => {
  it('hides a comment after the third report', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      payload: { author: 'Troll', text: 'Spam' },
    });
    const { id } = created.json<{ id: string }>();

    const reports = [];
    for (let i = 0; i < 3; i++) {
      const response = await app.inject({
        method: 'POST',
        url: `/api/comments/${id}/report`,
      });
      reports.push(response.json<{ reportCount: number; hidden: boolean }>());
    }

    expect(reports.map((report) => report.hidden)).toEqual([
      false,
      false,
      true,
    ]);
    expect(reports[2]?.reportCount).toBe(3);

    const listed = await app.inject({
      method: 'GET',
      url: '/api/bears/ursus-arctos/comments',
    });
    expect(listed.json<CommentPage>().items).toHaveLength(0);
  });

  it('answers 404 when reporting an unknown comment', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/comments/${unknownCommentId}/report`,
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('health', () => {
  it('is ready while the database answers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
  });

  it('is not ready but still alive while the database is down', async () => {
    databaseUp = false;

    const ready = await app.inject({ method: 'GET', url: '/health/ready' });
    const live = await app.inject({ method: 'GET', url: '/health' });

    expect(ready.statusCode).toBe(503);
    expect(live.statusCode).toBe(200);
  });
});
