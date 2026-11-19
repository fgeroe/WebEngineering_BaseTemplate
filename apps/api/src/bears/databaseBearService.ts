import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { bears } from '../db/schema.js';
import { NotFoundError } from '../errors.js';
import type { Bear } from './bear.js';
import type { BearService } from './bearService.js';

const bearColumns = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  imageUrl: bears.imageUrl,
  range: bears.range,
};

export function createDatabaseBearService(db: Database): BearService {
  async function listBears(): Promise<Bear[]> {
    return await db
      .select(bearColumns)
      .from(bears)
      .orderBy(asc(bears.position));
  }

  async function getBear(id: string): Promise<Bear> {
    const [bear] = await db
      .select(bearColumns)
      .from(bears)
      .where(eq(bears.id, id))
      .limit(1);
    if (bear === undefined) {
      throw new NotFoundError(`No bear with id "${id}"`);
    }
    return bear;
  }

  return { listBears, getBear };
}
