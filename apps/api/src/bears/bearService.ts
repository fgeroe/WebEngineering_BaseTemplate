import { NotFoundError, UpstreamError } from '../errors.js';
import { bearListSchema, type Bear } from './bear.js';
import { parseSpeciesTables } from './parseSpeciesTable.js';
import type { WikipediaClient } from './wikipediaClient.js';

const sourcePage = 'List_of_ursids';
const sourceSection = 3;

export interface BearService {
  listBears: () => Promise<Bear[]>;
  getBear: (id: string) => Promise<Bear>;
}

export function createBearService(wikipedia: WikipediaClient): BearService {
  async function listBears(): Promise<Bear[]> {
    const wikitext = await wikipedia.fetchSectionWikitext(
      sourcePage,
      sourceSection
    );
    const parsed = parseSpeciesTables(wikitext);
    const imageUrls = await wikipedia.fetchImageUrls(
      parsed.flatMap((bear) => (bear.file === null ? [] : [bear.file]))
    );

    const result = bearListSchema.safeParse(
      parsed.map(({ file, ...bear }) => ({
        ...bear,
        imageUrl: file === null ? null : (imageUrls.get(file) ?? null),
      }))
    );
    if (!result.success) {
      throw new UpstreamError(
        'Wikipedia returned bear data in an unexpected format',
        { cause: result.error }
      );
    }
    return result.data;
  }

  async function getBear(id: string): Promise<Bear> {
    const bear = (await listBears()).find((candidate) => candidate.id === id);
    if (bear === undefined) {
      throw new NotFoundError(`No bear with id "${id}"`);
    }
    return bear;
  }

  return { listBears, getBear };
}
