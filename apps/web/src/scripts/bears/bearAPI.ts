import type { Bear, BearWithImage, ImageResult } from './types';

const baseUrl = 'https://en.wikipedia.org/w/api.php';
const title = 'List_of_ursids';

const params: Record<string, string> = {
  action: 'parse',
  page: title,
  prop: 'wikitext',
  section: '3',
  format: 'json',
  origin: '*',
};

// ---------- Validation of API data ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`"${name}" is not an object`);
  }
  return value;
}

function getRecord(
  obj: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  return asRecord(obj[key], key);
}

function getArray(obj: Record<string, unknown>, key: string): unknown[] {
  const value = obj[key];
  if (!Array.isArray(value)) {
    throw new Error(`"${key}" is not an array`);
  }
  return value;
}

function getString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== 'string') {
    throw new Error(`"${key}" is not a string`);
  }
  return value;
}

function extractWikitext(data: unknown): string {
  const response = asRecord(data, 'response');
  const parse = getRecord(response, 'parse');
  const wikitext = getRecord(parse, 'wikitext');
  return getString(wikitext, '*');
}

function extractImageUrl(data: unknown): string {
  const response = asRecord(data, 'response');
  const query = getRecord(response, 'query');
  const pages = getRecord(query, 'pages');
  const page = asRecord(Object.values(pages)[0], 'page');
  const imageinfo = getArray(page, 'imageinfo');
  const firstInfo = asRecord(imageinfo[0], 'image info');
  return getString(firstInfo, 'url');
}

// ---------- Network ----------

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error('Server responded with ' + res.status);
  }
  return await res.json();
}

async function fetchImageUrl(
  fileName: string,
  signal: AbortSignal
): Promise<string> {
  const imageParams: Record<string, string> = {
    action: 'query',
    titles: 'File:' + fileName,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    origin: '*',
  };

  const url = baseUrl + '?' + new URLSearchParams(imageParams).toString();
  const data = await fetchJson(url, signal);
  return extractImageUrl(data);
}

async function canLoadImage(url: string): Promise<boolean> {
  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = url;
  });
}

async function resolveImage(
  bear: Bear,
  signal: AbortSignal
): Promise<ImageResult> {
  if (bear.file === null) {
    return { ok: false, reason: 'No image found' };
  }

  try {
    const url = await fetchImageUrl(bear.file, signal);
    const loadable = await canLoadImage(url);

    if (!loadable) {
      return { ok: false, reason: 'Not possible to load image' };
    }
    return { ok: true, url };
  } catch (err) {
    // Re-throw aborted requests instead of treating them as image errors
    if (signal.aborted) throw err;
    console.error(bear.name + ':', err);
    return { ok: false, reason: 'Error while loading image' };
  }
}

// ---------- Parsing the wikitext ----------

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchField(row: string, field: string): string {
  const regex = new RegExp('\\|' + field + '=(.*?)(?=\\s*\\|[\\w-]+=|$)', 'm');
  const match = row.match(regex);
  return match?.[1]?.trim() ?? '';
}

function cleanRange(text: string): string {
  return text
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBears(wikitext: string): Bear[] {
  const rows = wikitext
    .split('{{Species table/end}}')
    .flatMap((table) => table.split('{{Species table/row').slice(1));

  const bears: Bear[] = [];
  rows.forEach((row) => {
    const nameField = matchField(row, 'name');
    const nameMatch = nameField.match(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/);
    const name = nameMatch?.[1]?.trim();
    if (name === undefined || name === '') return;

    const binomial = matchField(row, 'binomial');
    const image = matchField(row, 'image');
    const range = matchField(row, 'range');

    bears.push({
      id: toSlug(binomial !== '' ? binomial : name),
      name,
      binomial: binomial !== '' ? binomial : 'Unknown',
      file: image !== '' ? image.replace('File:', '') : null,
      range: range !== '' ? cleanRange(range) : 'Unknown',
    });
  });

  return bears;
}

// ---------- Public entry point ----------

export async function fetchBears(
  signal: AbortSignal
): Promise<BearWithImage[]> {
  const url = baseUrl + '?' + new URLSearchParams(params).toString();
  const data = await fetchJson(url, signal);
  const wikitext = extractWikitext(data);
  const bears = extractBears(wikitext);

  return await Promise.all(
    bears.map(async (bear) => ({
      ...bear,
      imageResult: await resolveImage(bear, signal),
    }))
  );
}
