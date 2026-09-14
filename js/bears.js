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
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var pages = data.query.pages;
      var page = Object.values(pages)[0];
      return page.imageinfo[0].url;
    })
    .catch(function () {
      return "";
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

  var bears = [];
  rows.forEach(function (row) {
    var name = matchField(row, "name");
    var nameMatch = name.match(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/);
    if (!nameMatch) return;

    var binomial = matchField(row, "binomial");
    var image = matchField(row, "image");
    var range = matchField(row, "range");

    bears.push({
      name: nameMatch[1].trim(),
      binomial: binomial || "Unknown",
      file: image.replace("File:", ""),
      range: range ? cleanRange(range) : "Unknown",
    });
  });

  Promise.all(
    bears.map(function (bear) {
      if (!bear.file) {
        bear.image = "";
        return bear;
      }
      return fetchImageUrl(bear.file).then(function (imageUrl) {
        bear.image = imageUrl;
        return bear;
      });
    }),
  ).then(function (loadedBears) {
    var moreBears = document.querySelector(".more_bears");
    loadedBears.forEach(function (bear) {
      var html =
        '<div class="bear">' +
        (bear.image
          ? '<img src="' +
            bear.image +
            '" alt="Image of ' +
            bear.name +
            '" style="width:200px; height:auto;">'
          : "") +
        "<p><b>" +
        bear.name +
        "</b> (" +
        bear.binomial +
        ")</p>" +
        "<p>Range: " +
        bear.range +
        "</p>" +
        "</div>";
      moreBears.innerHTML += html;
    });
  });
}

export function loadBears() {
  const url = baseUrl + "?" + new URLSearchParams(params).toString();
  fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      extractBears(data.parse.wikitext["*"]);
    });
}
