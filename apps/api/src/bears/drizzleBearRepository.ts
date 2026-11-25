import { asc, eq, ilike } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { bears } from '../db/schema.js';
import type { BearRepository } from './bearRepository.js';

const bearColumns = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  imageUrl: bears.imageUrl,
  range: bears.range,
};

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}

export function createDrizzleBearRepository(db: Database): BearRepository {
  return {
    list: async ({ nameContains } = {}) =>
      await db
        .select(bearColumns)
        .from(bears)
        .where(
          nameContains === undefined
            ? undefined
            : ilike(bears.name, `%${escapeLike(nameContains)}%`)
        )
        .orderBy(asc(bears.position)),

    findById: async (id) => {
      const [bear] = await db
        .select(bearColumns)
        .from(bears)
        .where(eq(bears.id, id))
        .limit(1);
      return bear;
    },
  };
}
