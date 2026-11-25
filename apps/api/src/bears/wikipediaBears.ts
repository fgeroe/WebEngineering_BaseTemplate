import { UpstreamError } from '../errors.js';
import { bearListSchema, type Bear } from './bear.js';
import { parseSpeciesTables } from './parseSpeciesTable.js';
import type { WikipediaClient } from './wikipediaClient.js';

const sourcePage = 'List_of_ursids';
const sourceSection = 3;

export async function fetchBearsFromWikipedia(
  wikipedia: WikipediaClient
): Promise<Bear[]> {
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
