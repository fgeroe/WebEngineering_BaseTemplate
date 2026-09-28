import { getElement } from "./dom";

const baseUrl = "https://en.wikipedia.org/w/api.php";
const title = "List_of_ursids";

const params: Record<string, string> = {
  action: "parse",
  page: title,
  prop: "wikitext",
  section: "3",
  format: "json",
  origin: "*",
};


interface Bear {
  name: string;
  binomial: string;
  file: string | null;
  range: string;
}

type ImageResult = { ok: true; url: string } | { ok: false; reason: string };

interface BearWithImage extends Bear {
  imageResult: ImageResult;
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`"${name}" is not an object`);
  }
  return value;
}

function getRecord(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  return asRecord(obj[key], key);
}

function getArray(obj: Record<string, unknown>, key: string): unknown[] {
  const value = obj[key];
  if (!Array.isArray(value)) {
    throw new Error(`"${key}" is not an Array`);
  }
  return value;
}

function getString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string") {
    throw new Error(`"${key}" is not a String`);
  }
  return value;
}

function extractWikitext(data: unknown): string {
  const response = asRecord(data, "Antwort");
  const parse = getRecord(response, "parse");
  const wikitext = getRecord(parse, "wikitext");
  return getString(wikitext, "*");
}

function extractImageUrl(data: unknown): string {
  const response = asRecord(data, "Antwort");
  const query = getRecord(response, "query");
  const pages = getRecord(query, "pages");
  const page = asRecord(Object.values(pages)[0], "Seite");
  const imageinfo = getArray(page, "imageinfo");
  const firstInfo = asRecord(imageinfo[0], "Bildinfo");
  return getString(firstInfo, "url");
}


async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Server responded with " + res.status);
  }
  return res.json();
}

async function fetchImageUrl(fileName: string): Promise<string> {
  const imageParams: Record<string, string> = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  const url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  const data = await fetchJson(url);
  return extractImageUrl(data);
}

function canLoadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function resolveImage(bear: Bear): Promise<ImageResult> {
  if (!bear.file) {
    return { ok: false, reason: "No image found" };
  }

  try {
    const url = await fetchImageUrl(bear.file);
    const loadable = await canLoadImage(url);

    if (!loadable) {
      return { ok: false, reason: "Not possible to load image" };
    }
    return { ok: true, url };
  } catch (err) {
    console.error(bear.name + ":", err);
    return { ok: false, reason: "Error while loading image" };
  }
}


function matchField(row: string, field: string): string {
  const regex = new RegExp("\\|" + field + "=(.*?)(?=\\s*\\|[\\w-]+=|$)", "m");
  const match = row.match(regex);
  return match?.[1]?.trim() ?? "";
}

function cleanRange(text: string): string {
  return text
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBears(wikitext: string): Bear[] {
  const rows = wikitext
    .split("{{Species table/end}}")
    .flatMap((table) => table.split("{{Species table/row").slice(1));

  if (rows.length === 0) {
    throw new Error("No species table available");
  }

  const bears: Bear[] = [];
  rows.forEach((row) => {
    const nameField = matchField(row, "name");
    const nameMatch = nameField.match(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/);
    const name = nameMatch?.[1]?.trim();
    if (!name) return;

    const image = matchField(row, "image");
    const range = matchField(row, "range");

    bears.push({
      name,
      binomial: matchField(row, "binomial") || "Unknown",
      file: image ? image.replace("File:", "") : null,
      range: range ? cleanRange(range) : "Unknown",
    });
  });

  if (bears.length === 0) {
    throw new Error("No bears found in table");
  }

  return bears;
}


function showError(message: string): void {
  const section = document.querySelector(".more_bears");
  if (!section) return;
  const p = document.createElement("p");
  p.style.color = "#c33";
  p.textContent = message;
  section.appendChild(p);
}

function renderBears(bears: BearWithImage[]): void {
  const section = getElement(".more_bears", HTMLElement);

  bears.forEach((bear) => {
    const div = document.createElement("div");
    div.className = "bear";

    if (bear.imageResult.ok) {
      const img = document.createElement("img");
      img.src = bear.imageResult.url;
      img.alt = "Image of " + bear.name;
      img.style.width = "200px";
      img.style.height = "auto";
      div.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.textContent = bear.imageResult.reason;
      placeholder.style.width = "200px";
      placeholder.style.height = "120px";
      placeholder.style.border = "2px dashed #999";
      placeholder.style.color = "#666";
      div.appendChild(placeholder);
    }

    const namePara = document.createElement("p");
    const nameBold = document.createElement("b");
    nameBold.textContent = bear.name;
    namePara.append(nameBold, " (" + bear.binomial + ")");
    div.appendChild(namePara);

    const rangePara = document.createElement("p");
    rangePara.textContent = "Range: " + bear.range;
    div.appendChild(rangePara);

    section.appendChild(div);
  });
}

export async function loadBears(): Promise<void> {
  try {
    const url = baseUrl + "?" + new URLSearchParams(params).toString();
    const data = await fetchJson(url);
    const wikitext = extractWikitext(data);
    const bears = extractBears(wikitext);

    const results: BearWithImage[] = await Promise.all(
      bears.map(async (bear) => ({
        ...bear,
        imageResult: await resolveImage(bear),
      })),
    );

    renderBears(results);
  } catch (err) {
    console.error("loadBears:", err);
    const message = err instanceof Error ? err.message : String(err);
    showError("Not possible to load list of bears: " + message);
  }
}