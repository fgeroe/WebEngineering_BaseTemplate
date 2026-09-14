// Fetching bear data
var baseUrl = "https://en.wikipedia.org/w/api.php";
var title = "List_of_ursids";

var params = {
  action: "parse",
  page: title,
  prop: "wikitext",
  section: 3,
  format: "json",
  origin: "*",
};

function showError(message) {
  var section = document.querySelector(".more_bears");
  if (!section) return;
  var p = document.createElement("p");
  p.style.color = "#c33";
  p.textContent = message;
  section.appendChild(p);
}

function checkResponse(res) {
  if (!res.ok) {
    throw new Error("Server responded with " + res.status);
  }
  return res.json();
}

function fetchImageUrl(fileName) {
  var imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  };

  var url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  return fetch(url)
    .then(checkResponse)
    .then(function (data) {
      var pages = data.query && data.query.pages;
      var page = pages && Object.values(pages)[0];

      if (!page || !page.imageinfo || !page.imageinfo[0]) {
        throw new Error('No image URL available for "' + fileName + '"');
      }

      return page.imageinfo[0].url;
    });
}

function canLoadImage(url) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () {
      resolve(true);
    };
    img.onerror = function () {
      resolve(false);
    };
    img.src = url;
  });
}

function resolveImage(bear) {
  if (!bear.file) {
    return Promise.resolve({ ok: false, reason: "No image available" });
  }

  return fetchImageUrl(bear.file)
    .then(function (url) {
      return canLoadImage(url).then(function (loadable) {
        if (!loadable) {
          return { ok: false, reason: "Image could not be loaded" };
        }
        return { ok: true, url: url };
      });
    })
    .catch(function (err) {
      console.error(bear.name + ":", err);
      return { ok: false, reason: "Image could not be loaded" };
    });
}

function matchField(row, field) {
  var regex = new RegExp("\\|" + field + "=(.*?)(?=\\s*\\|[\\w-]+=|$)", "m");
  var match = row.match(regex);
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
  var rows = [];
  wikitext.split("{{Species table/end}}").forEach(function (table) {
    table
      .split("{{Species table/row")
      .slice(1)
      .forEach(function (row) {
        rows.push(row);
      });
  });

  if (rows.length === 0) {
    throw new Error("No species table available");
  }

  var bears = [];
  rows.forEach(function (row) {
    var nameField = matchField(row, "name");
    var nameMatch = nameField.match(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/);
    if (!nameMatch) return;

    var image = matchField(row, "image");
    var range = matchField(row, "range");

    bears.push({
      name: nameMatch[1].trim(),
      binomial: matchField(row, "binomial") || "Unknown",
      file: image.replace("File:", ""),
      range: range ? cleanRange(range) : "Unknown",
    });
  });

  if (bears.length === 0) {
    throw new Error("No bears found inside table");
  }

  return bears;
}

function renderBears(bears) {
  var section = document.querySelector(".more_bears");

  bears.forEach(function (bear) {
    var div = document.createElement("div");
    div.className = "bear";

    if (bear.imageResult.ok) {
      var img = document.createElement("img");
      img.src = bear.imageResult.url;
      img.alt = "Image of " + bear.name;
      img.style.width = "200px";
      img.style.height = "auto";
      div.appendChild(img);
    } else {
      var placeholder = document.createElement("div");
      placeholder.textContent = bear.imageResult.reason;
      placeholder.style.width = "200px";
      placeholder.style.height = "120px";
      placeholder.style.border = "2px dashed #999";
      placeholder.style.color = "#666";
      div.appendChild(placeholder);
    }

    var namePara = document.createElement("p");
    namePara.innerHTML = "<b>" + bear.name + "</b> (" + bear.binomial + ")";
    div.appendChild(namePara);

    var rangePara = document.createElement("p");
    rangePara.textContent = "Range: " + bear.range;
    div.appendChild(rangePara);

    section.appendChild(div);
  });
}

export function loadBears() {
  var url = baseUrl + "?" + new URLSearchParams(params).toString();

  fetch(url)
    .then(checkResponse)
    .then(function (data) {
      if (!data.parse || !data.parse.wikitext) {
        throw new Error("No wiki text inside the response");
      }

      var bears = extractBears(data.parse.wikitext["*"]);

      return Promise.all(
        bears.map(function (bear) {
          return resolveImage(bear).then(function (imageResult) {
            bear.imageResult = imageResult;
            return bear;
          });
        }),
      );
    })
    .then(renderBears)
    .catch(function (err) {
      console.error("loadBears:", err);
      showError("Error while loading list of bears: " + err.message);
    });
}
