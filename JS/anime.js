// anime.js : gestion de l'affichage et des interactions pour anime.html
let animeData = { series: [], films: [], dropped: [] };
let currentType = "all";
let currentSort = "alpha";
let currentSortDir = "asc";
let searchTerm = "";

async function loadAnimeData() {
  const res = await fetch("DATA/animes.json");
  const json = await res.json();
  animeData = json.sections;
  renderTable();
}

function getFilteredList() {
  let list = [];
  if (currentType === "all") {
    list = [
      ...animeData.series.map((e) => ({ ...e, _type: "series" })),
      ...animeData.films.map((e) => ({ ...e, _type: "films" })),
      ...animeData.dropped.map((e) => ({ ...e, _type: "dropped" })),
    ];
  } else {
    list = animeData[currentType].map((e) => ({ ...e, _type: currentType }));
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    list = list.filter((e) => e.title.toLowerCase().includes(term));
  }
  // tri
  if (currentSort === "alpha") {
    list.sort(
      (a, b) =>
        a.title.localeCompare(b.title, "fr", { sensitivity: "base" }) *
        (currentSortDir === "asc" ? 1 : -1),
    );
  } else if (currentSort === "fav") {
    list.sort(
      (a, b) =>
        b.favoriteLevel - a.favoriteLevel ||
        a.title.localeCompare(b.title, "fr"),
    );
  }
  return list;
}

function renderTable() {
  const tbody = document.querySelector("#anime-table tbody");
  tbody.innerHTML = "";
  const list = getFilteredList();
  for (const entry of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.title}</td>
      <td class="fav">${"★".repeat(entry.favoriteLevel || 0)}</td>
      <td>${entry._type}</td>
      <td class="actions">
        <button onclick="editEntry('${entry._type}', '${entry.title.replace(/'/g, "\'")}')">✏️</button>
        <button onclick="deleteEntry('${entry._type}', '${entry.title.replace(/'/g, "\'")}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAnimeData();
  document.getElementById("type-filter").addEventListener("change", (e) => {
    currentType = e.target.value;
    renderTable();
  });
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderTable();
  });
  document.getElementById("sort-alpha").addEventListener("click", () => {
    currentSort = "alpha";
    currentSortDir = "asc";
    renderTable();
  });
  document.getElementById("sort-alpha-desc").addEventListener("click", () => {
    currentSort = "alpha";
    currentSortDir = "desc";
    renderTable();
  });
  document.getElementById("sort-fav").addEventListener("click", () => {
    currentSort = "fav";
    renderTable();
  });
  document
    .getElementById("add-entry")
    .addEventListener("click", () => showForm("add"));
  document.getElementById("form-cancel").addEventListener("click", hideForm);
  document
    .getElementById("anime-form")
    .addEventListener("submit", handleFormSubmit);
});

function showForm(mode, type = "series", title = "", favoriteLevel = 0) {
  document.getElementById("form-section").style.display = "";
  document.getElementById("form-type").value = mode;
  document.getElementById("form-title").value = title;
  document.getElementById("form-fav").value = favoriteLevel;
  document.getElementById("form-section-type").value = type;
  document.getElementById("form-original-type").value = type;
}
function hideForm() {
  document.getElementById("form-section").style.display = "none";
}

function editEntry(type, title) {
  const entry = animeData[type].find((e) => e.title === title);
  if (!entry) return;
  showForm("edit", type, entry.title, entry.favoriteLevel);
}

function deleteEntry(type, title) {
  if (!confirm("Supprimer cette entrée ?")) return;
  animeData[type] = animeData[type].filter((e) => e.title !== title);
  renderTable();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById("form-type").value;
  const title = document.getElementById("form-title").value.trim();
  const favoriteLevel =
    parseInt(document.getElementById("form-fav").value, 10) || 0;
  const type = document.getElementById("form-section-type").value;
  const originalType = document.getElementById("form-original-type").value;
  if (!title) return;
  if (mode === "add") {
    animeData[type].push({ title, favoriteLevel, raw: title });
  } else if (mode === "edit") {
    // Remove from old type if changed
    if (type !== originalType) {
      animeData[originalType] = animeData[originalType].filter(
        (e) => e.title !== title,
      );
      animeData[type].push({ title, favoriteLevel, raw: title });
    } else {
      const entry = animeData[type].find((e) => e.title === title);
      if (entry) {
        entry.favoriteLevel = favoriteLevel;
        entry.raw = title;
      }
    }
  }
  hideForm();
  renderTable();
}
