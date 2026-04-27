// anime-json.js : affichage et modification des animés depuis le JSON local
let animeData = { series: [], films: [], dropped: [] };
let currentSort = "alpha";
let currentSortDir = "asc";
let searchTerm = "";

const favFilter = "all";
const currentType = "all";
const TYPE_LABELS = {
  series: "Série",
  films: "Film",
  dropped: "Abandonné",
};

async function loadAnimeData() {
  const badge = document.getElementById("data-source-badge");
  if (badge) {
    badge.textContent = "⏳ Chargement JSON local...";
    badge.className = "source-badge offline";
  }
  try {
    const res = await fetch("DATA/animes.json");
    const json = await res.json();
    animeData = json.sections;
    if (badge) {
      badge.textContent = "";
      badge.className = "";
    }
  } catch (_) {
    if (badge) {
      badge.textContent = "✗ Erreur JSON";
      badge.className = "source-badge error";
    }
    animeData = { series: [], films: [], dropped: [] };
  }
  renderTable();
}

function getFilteredList() {
  let list =
    currentType === "all"
      ? [
          ...animeData.series.map((e) => ({ ...e, _type: "series" })),
          ...animeData.films.map((e) => ({ ...e, _type: "films" })),
          ...animeData.dropped.map((e) => ({ ...e, _type: "dropped" })),
        ]
      : animeData[currentType].map((e) => ({ ...e, _type: currentType }));
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    list = list.filter((e) => e.title.toLowerCase().includes(t));
  }
  if (favFilter === "fav")
    list = list.filter((e) => (e.favoriteLevel || 0) > 0);
  if (favFilter === "nofav")
    list = list.filter((e) => (e.favoriteLevel || 0) === 0);
  const d = currentSortDir === "asc" ? 1 : -1;
  const alpha = (a, b) =>
    a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
  const sorts = {
    alpha: (a, b) => d * alpha(a, b),
    fav: (a, b) => d * (b.favoriteLevel - a.favoriteLevel || alpha(a, b)),
    type: (a, b) => {
      const order = { series: 0, films: 1, dropped: 2 };
      return d * (order[a._type] - order[b._type] || alpha(a, b));
    },
  };
  if (sorts[currentSort]) list.sort(sorts[currentSort]);
  return list;
}

function setSortHeader(col) {
  currentSort = currentSort === col ? currentSort : col;
  currentSortDir =
    currentSort === col && currentSortDir === "asc" ? "desc" : "asc";
  if (currentSort !== col) currentSortDir = "asc";
  currentSort = col;
}

function updateHeaderArrows() {
  ["alpha", "fav", "type"].forEach((col) => {
    const th = document.getElementById(`th-${col}`);
    if (!th) return;
    th.querySelector(".sort-arrow")?.remove();
    if (currentSort === col) {
      const s = document.createElement("span");
      s.className = "sort-arrow";
      s.textContent = currentSortDir === "asc" ? " ▲" : " ▼";
      th.appendChild(s);
    }
  });
}

function renderTable() {
  const tbody = document.querySelector("#anime-table tbody");
  tbody.innerHTML = "";
  const list = getFilteredList();
  const countEl = document.getElementById("anime-count");
  if (countEl)
    countEl.textContent = `${list.length} animé${list.length > 1 ? "s" : ""}`;
  updateHeaderArrows();
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:0.5;font-style:italic;">Aucun résultat</td></tr>`;
    return;
  }
  for (const entry of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="capitalize">${entry.title}</td>
        <td class="fav">${"★".repeat(entry.favoriteLevel || 0)}${"☆".repeat(5 - (entry.favoriteLevel || 0))}</td>
        <td><span class="badge badge-${entry._type}">${TYPE_LABELS[entry._type] || entry._type}</span></td>
      `;
    tbody.appendChild(tr);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAnimeData();
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderTable();
  });
  [
    ["th-alpha", "alpha"],
    ["th-fav", "fav"],
    ["th-type", "type"],
  ].forEach(([id, col]) => {
    document.getElementById(id)?.addEventListener("click", () => {
      setSortHeader(col);
      renderTable();
    });
  });
});
