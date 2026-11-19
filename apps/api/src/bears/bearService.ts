import { NotFoundError } from '../errors.js';
import type { Bear } from './bear.js';
import type { BearRepository } from './bearRepository.js';

export interface BearService {
  listBears: (query?: string) => Promise<Bear[]>;
  getBear: (id: string) => Promise<Bear>;
}

export function createBearService(repository: BearRepository): BearService {
  async function listBears(query?: string): Promise<Bear[]> {
    const nameContains = query?.trim() ?? '';
    return await repository.list(nameContains === '' ? {} : { nameContains });
  }

  async function getBear(id: string): Promise<Bear> {
    const bear = await repository.findById(id);
    if (bear === undefined) {
      throw new NotFoundError(`No bear with id "${id}"`);
    }
    return bear;
  }

  return { listBears, getBear };
}
