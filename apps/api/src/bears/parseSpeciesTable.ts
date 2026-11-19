export interface ParsedBear {
  id: string;
  name: string;
  binomial: string;
  file: string | null;
  range: string;
}

const wikiLink = /\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/;

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchField(text: string, field: string): string {
  const regex = new RegExp('\\|' + field + '=(.*?)(?=\\s*\\|[\\w-]+=|$)', 'm');
  return text.match(regex)?.[1]?.trim() ?? '';
}

function linkText(text: string): string {
  return text.match(wikiLink)?.[1]?.trim() ?? '';
}

function cleanWikitext(text: string): string {
  return text
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(new RegExp(wikiLink.source, 'g'), '$1')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandBinomial(binomial: string, genus: string): string {
  const abbreviated = binomial.match(/^([A-Z])\.\s*(.+)$/);
  if (abbreviated === null || genus[0] !== abbreviated[1]) {
    return binomial;
  }
  return `${genus} ${abbreviated[2]}`;
}

function parseRow(row: string, genus: string): ParsedBear | null {
  const name = linkText(matchField(row, 'name'));
  if (name === '') return null;

  const binomial = expandBinomial(
    cleanWikitext(matchField(row, 'binomial')),
    genus
  );
  const image = matchField(row, 'image');
  const range = cleanWikitext(matchField(row, 'range'));

  return {
    id: toSlug(binomial !== '' ? binomial : name),
    name,
    binomial: binomial !== '' ? binomial : 'Unknown',
    file: image !== '' ? image.replace(/^File:/, '') : null,
    range: range !== '' ? range : 'Unknown',
  };
}

export function parseSpeciesTables(wikitext: string): ParsedBear[] {
  return wikitext.split('{{Species table/end}}').flatMap((table) => {
    const [header = '', ...rows] = table.split('{{Species table/row');
    const genus = cleanWikitext(matchField(header, 'genus'));
    return rows
      .map((row) => parseRow(row, genus))
      .filter((bear) => bear !== null);
  });
}
