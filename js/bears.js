// Fetching bear data
const baseUrl = "https://en.wikipedia.org/w/api.php";
const title = "List_of_ursids";

const params = {
  action: "parse",
  page: title,
  prop: "wikitext",
  section: 3,
  format: "json",
  origin: "*",
};

function showError(message) {
  const section = document.querySelector(".more_bears");
  if (!section) return;
  const p = document.createElement("p");
  p.style.color = "#c33";
  p.textContent = message;
  section.appendChild(p);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Server antwortete mit Status " + res.status);
  }
  return res.json();
}

async function fetchImageUrl(fileName) {
  const imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  const url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  const data = await fetchJson(url);

  const pages = data.query && data.query.pages;
  const page = pages && Object.values(pages)[0];

  if (!page || !page.imageinfo || !page.imageinfo[0]) {
    throw new Error('Keine Bild-URL für "' + fileName + '"');
  }

  return page.imageinfo[0].url;
}

function canLoadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function resolveImage(bear) {
  if (!bear.file) {
    return { ok: false, reason: "Kein Bild vorhanden" };
  }

  try {
    const url = await fetchImageUrl(bear.file);
    const loadable = await canLoadImage(url);

    if (!loadable) {
      return { ok: false, reason: "Bild nicht ladbar" };
    }
    return { ok: true, url };
  } catch (err) {
    console.error(bear.name + ":", err);
    return { ok: false, reason: "Bild konnte nicht geladen werden" };
  }
}

function matchField(row, field) {
  const regex = new RegExp("\\|" + field + "=(.*?)(?=\\s*\\|[\\w-]+=|$)", "m");
  const match = row.match(regex);
  return match ? match[1].trim() : "";
}

function cleanRange(text) {
  return text
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBears(wikitext) {
  const rows = wikitext
    .split("{{Species table/end}}")
    .flatMap((table) => table.split("{{Species table/row").slice(1));

  if (rows.length === 0) {
    throw new Error("Keine Artentabellen gefunden");
  }

  const bears = [];
  rows.forEach((row) => {
    const nameField = matchField(row, "name");
    const nameMatch = nameField.match(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/);
    if (!nameMatch) return;

    const image = matchField(row, "image");
    const range = matchField(row, "range");

    bears.push({
      name: nameMatch[1].trim(),
      binomial: matchField(row, "binomial") || "Unknown",
      file: image.replace("File:", ""),
      range: range ? cleanRange(range) : "Unknown",
    });
  });

  if (bears.length === 0) {
    throw new Error("Keine Bären in den Tabellenzeilen gefunden");
  }

  return bears;
}

function renderBears(bears) {
  const section = document.querySelector(".more_bears");

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
    namePara.innerHTML = "<b>" + bear.name + "</b> (" + bear.binomial + ")";
    div.appendChild(namePara);

    const rangePara = document.createElement("p");
    rangePara.textContent = "Range: " + bear.range;
    div.appendChild(rangePara);

    section.appendChild(div);
  });
}

export async function loadBears() {
  try {
    const url = baseUrl + "?" + new URLSearchParams(params).toString();
    const data = await fetchJson(url);

    if (!data.parse || !data.parse.wikitext) {
      throw new Error("Die Antwort enthielt keinen Wikitext");
    }

    const bears = extractBears(data.parse.wikitext["*"]);

    const results = await Promise.all(
      bears.map(async (bear) => {
        bear.imageResult = await resolveImage(bear);
        return bear;
      }),
    );

    renderBears(results);
  } catch (err) {
    console.error("loadBears:", err);
    showError("Die Bärenliste konnte nicht geladen werden: " + err.message);
  }
}
