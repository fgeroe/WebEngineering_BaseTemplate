import { z } from 'zod';
import { UpstreamError, UpstreamTimeoutError } from '../errors.js';

export interface WikipediaClientOptions {
  apiUrl: string;
  timeoutMs: number;
  userAgent: string;
}

export interface WikipediaClient {
  fetchSectionWikitext: (page: string, section: number) => Promise<string>;
  fetchImageUrls: (fileNames: string[]) => Promise<Map<string, string>>;
}

const maxTitlesPerQuery = 50;

const parseResponseSchema = z.object({
  parse: z.object({ wikitext: z.string() }),
});

const imageInfoResponseSchema = z.object({
  query: z.object({
    normalized: z
      .array(z.object({ from: z.string(), to: z.string() }))
      .optional(),
    pages: z.array(
      z.object({
        title: z.string(),
        imageinfo: z.array(z.object({ url: z.url() })).optional(),
      })
    ),
  }),
});

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function isTimeout(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'TimeoutError';
}

export function createWikipediaClient(
  options: WikipediaClientOptions
): WikipediaClient {
  async function request<T>(
    params: Record<string, string>,
    schema: z.ZodType<T>
  ): Promise<T> {
    const url = new URL(options.apiUrl);
    url.search = new URLSearchParams({
      ...params,
      format: 'json',
      formatversion: '2',
    }).toString();

    let body: unknown;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': options.userAgent,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (!response.ok) {
        throw new UpstreamError(`Wikipedia responded with ${response.status}`);
      }
      body = await response.json();
    } catch (err) {
      if (err instanceof UpstreamError) throw err;
      if (err instanceof SyntaxError) {
        throw new UpstreamError('Wikipedia returned an unexpected response', {
          cause: err,
        });
      }
      if (isTimeout(err)) {
        throw new UpstreamTimeoutError(
          `Wikipedia did not respond within ${options.timeoutMs} ms`,
          { cause: err }
        );
      }
      throw new UpstreamError('Wikipedia is not reachable', { cause: err });
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      throw new UpstreamError('Wikipedia returned an unexpected response', {
        cause: result.error,
      });
    }
    return result.data;
  }

  async function fetchSectionWikitext(
    page: string,
    section: number
  ): Promise<string> {
    const data = await request(
      { action: 'parse', page, prop: 'wikitext', section: String(section) },
      parseResponseSchema
    );
    return data.parse.wikitext;
  }

  async function fetchImageUrlChunk(
    fileNames: string[]
  ): Promise<Array<[string, string]>> {
    const data = await request(
      {
        action: 'query',
        titles: fileNames.map((fileName) => `File:${fileName}`).join('|'),
        prop: 'imageinfo',
        iiprop: 'url',
      },
      imageInfoResponseSchema
    );

    const normalized = new Map(
      (data.query.normalized ?? []).map(({ from, to }) => [from, to])
    );
    const urlsByTitle = new Map(
      data.query.pages.flatMap((page) => {
        const url = page.imageinfo?.[0]?.url;
        return url === undefined ? [] : [[page.title, url] as const];
      })
    );

    return fileNames.flatMap((fileName) => {
      const title = `File:${fileName}`;
      const url = urlsByTitle.get(normalized.get(title) ?? title);
      return url === undefined ? [] : [[fileName, url] as [string, string]];
    });
  }

  async function fetchImageUrls(
    fileNames: string[]
  ): Promise<Map<string, string>> {
    const unique = [...new Set(fileNames)];
    const results = await Promise.all(
      chunk(unique, maxTitlesPerQuery).map(fetchImageUrlChunk)
    );
    return new Map(results.flat());
  }

  return { fetchSectionWikitext, fetchImageUrls };
}
