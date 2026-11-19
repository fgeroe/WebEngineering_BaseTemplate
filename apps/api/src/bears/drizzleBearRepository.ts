import { asc, eq } from 'drizzle-orm';
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

export function createDrizzleBearRepository(db: Database): BearRepository {
  return {
    list: async () =>
      await db.select(bearColumns).from(bears).orderBy(asc(bears.position)),

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
