import { describe, expect, it } from 'vitest';
import { createInMemoryBearRepository } from '../bears/bearRepository.js';
import { createBearService } from '../bears/bearService.js';
import {
  createInMemoryCommentRepository,
  createInMemoryCommentTransaction,
} from './commentRepository.js';
import { createCommentService, type ReportStrategy } from './commentService.js';

async function reportConcurrently(
  strategy: ReportStrategy,
  reports: number
): Promise<number> {
  const bears = createBearService(
    createInMemoryBearRepository([
      {
        id: 'ursus-arctos',
        name: 'Brown bear',
        binomial: 'Ursus arctos',
        imageUrl: null,
        range: 'Europe',
      },
    ])
  );
  const repository = createInMemoryCommentRepository();
  const service = createCommentService({
    bears,
    comments: repository,
    transaction: createInMemoryCommentTransaction(repository),
    reportStrategy: strategy,
  });
  const comment = await service.addComment('ursus-arctos', {
    author: 'Anna',
    text: 'Hello',
  });

  // all reports start at the same time, like 50 parallel HTTP requests
  await Promise.all(
    Array.from({ length: reports }, async () => {
      await service.reportComment(comment.id);
    })
  );

  const state = await repository.findReportState(comment.id);
  return state?.reportCount ?? 0;
}

describe('reporting a comment concurrently', () => {
  it('loses updates with the naive read-modify-write', async () => {
    const finalCount = await reportConcurrently('naive', 50);

    expect(finalCount).toBeLessThan(50);
  });

  it('counts every report when the read and write are serialized', async () => {
    const finalCount = await reportConcurrently('locked', 50);

    expect(finalCount).toBe(50);
  });
});
