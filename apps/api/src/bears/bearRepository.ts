import type { Bear } from './bear.js';

export interface BearFilter {
  nameContains?: string;
}

export interface BearRepository {
  list: (filter?: BearFilter) => Promise<Bear[]>;
  findById: (id: string) => Promise<Bear | undefined>;
}

export function createInMemoryBearRepository(
  initial: Bear[] = []
): BearRepository {
  const bears = initial.map((bear) => ({ ...bear }));

  return {
    list: async ({ nameContains } = {}) =>
      bears
        .filter(
          (bear) =>
            nameContains === undefined ||
            bear.name.toLowerCase().includes(nameContains.toLowerCase())
        )
        .map((bear) => ({ ...bear })),

    findById: async (id) => {
      const bear = bears.find((candidate) => candidate.id === id);
      return bear === undefined ? undefined : { ...bear };
    },
  };
}
