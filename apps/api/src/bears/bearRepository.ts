import type { Bear } from './bear.js';

export interface BearRepository {
  list: () => Promise<Bear[]>;
  findById: (id: string) => Promise<Bear | undefined>;
}

export function createInMemoryBearRepository(
  initial: Bear[] = []
): BearRepository {
  const bears = initial.map((bear) => ({ ...bear }));

  return {
    list: async () => bears.map((bear) => ({ ...bear })),

    findById: async (id) => {
      const bear = bears.find((candidate) => candidate.id === id);
      return bear === undefined ? undefined : { ...bear };
    },
  };
}
