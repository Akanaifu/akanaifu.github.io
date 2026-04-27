// anime.js : gestion de l'affichage et des interactions pour anime.html
let animeData = { series: [], films: [], dropped: [] };
let currentType = "all";
let currentSort = "alpha";
let currentSortDir = "asc";
let searchTerm = "";
let favFilter = "all"; // "all" | "fav" | "nofav"

const ANILIST_USER = "Akanaifu";
const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const TYPE_ANIME = [
  "completed",
  "movie",
  "dropped",
  "ONA",
  "special",
  "paused",
  "repeating",
  "current",
  "planning",
  "series",
  "films",
];

// Score AniList (0-100) → favoriteLevel (0-5)
function scoreToFav(score) {
  if (!score) return 0;
  return Math.round(score / 20); // 100→5, 80→4, etc.
}

async function fetchAnilistData() {
  const query = `
    query ($userName: String) {
      MediaListCollection(userName: $userName, type: ANIME) {
        lists {
          status
          entries {
            score(format: POINT_100)
            status
            media {
              title { romaji english }
              format
            }
          }
        }
      }
    }
  `;

  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { userName: ANILIST_USER } }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  const result = { series: [], films: [], dropped: [] };
  const lists = json.data.MediaListCollection.lists;

  for (const list of lists) {
    for (const entry of list.entries) {
      const title =
        entry.media.title.english ||
        entry.media.title.romaji ||
        "Titre inconnu";
      const favoriteLevel = scoreToFav(entry.score);
      const type = entry.media.format.toLowerCase();

      result[type].push({ title, favoriteLevel });
    }
  }

  // Tri alpha dans chaque catégorie
  for (const key of TYPE_ANIME) {
    result[key].sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
    );
  }

  return result;
}

async function loadAnimeData() {
  const statusEl = document.getElementById("data-source-badge");

  try {
    // ── Tentative API AniList ──────────────────────────────────────────────
    if (statusEl) {
      statusEl.textContent = "⏳ Chargement depuis AniList...";
      statusEl.className = "source-badge loading";
    }

    animeData = await fetchAnilistData();
    console.log("🚀 ~ loadAnimeData ~ animeData:", animeData);

    if (statusEl) {
      statusEl.textContent = `✓ Données AniList — ${ANILIST_USER}`;
      statusEl.className = "source-badge online";
    }
  } catch (err) {
    console.log("🚀 ~ loadAnimeData ~ animeData:", animeData);
    console.warn(
      "AniList API inaccessible, fallback JSON local :",
      err.message,
    );

    // ── Fallback : fichier JSON local ──────────────────────────────────────
    try {
      const res = await fetch("DATA/animes.json");
      const json = await res.json();
      animeData = json.sections;

      if (statusEl) {
        statusEl.textContent = "⚠ Données locales (AniList indisponible)";
        statusEl.className = "source-badge offline";
      }
    } catch (fallbackErr) {
      console.error("Impossible de charger les données locales :", fallbackErr);
      if (statusEl) {
        statusEl.textContent = "✗ Aucune donnée disponible";
        statusEl.className = "source-badge error";
      }
    }
  }

  renderTable();
}

function getFilteredList() {
  let list = [];
  if (currentType === "all") {
    for (const type of TYPE_ANIME) {
      if (animeData[type] && Array.isArray(animeData[type])) {
        list.push(...animeData[type].map((e) => ({ ...e, _type: type })));
      }
    }
  } else {
    if (animeData[currentType] && Array.isArray(animeData[currentType])) {
      list = animeData[currentType].map((e) => ({ ...e, _type: currentType }));
    }
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    list = list.filter((e) => e.title.toLowerCase().includes(term));
  }

  if (favFilter === "fav") {
    list = list.filter((e) => (e.favoriteLevel || 0) > 0);
  } else if (favFilter === "nofav") {
    list = list.filter((e) => (e.favoriteLevel || 0) === 0);
  }

  if (currentSort === "alpha") {
    list.sort(
      (a, b) =>
        a.title.localeCompare(b.title, "fr", { sensitivity: "base" }) *
        (currentSortDir === "asc" ? 1 : -1),
    );
  } else if (currentSort === "fav") {
    list.sort(
      (a, b) =>
        (currentSortDir === "asc" ? 1 : -1) *
        (b.favoriteLevel - a.favoriteLevel ||
          a.title.localeCompare(b.title, "fr")),
    );
  } else if (currentSort === "type") {
    list.sort(
      (a, b) =>
        (currentSortDir === "asc" ? 1 : -1) *
        (TYPE_ANIME.indexOf(a._type) - TYPE_ANIME.indexOf(b._type) ||
          a.title.localeCompare(b.title, "fr")),
    );
  }
  return list;
}

function setSortHeader(col) {
  if (currentSort === col) {
    currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
  } else {
    currentSort = col;
    currentSortDir = "asc";
  }
}

function updateHeaderArrows() {
  const cols = ["alpha", "fav", "type"];
  cols.forEach((col) => {
    const th = document.getElementById(`th-${col}`);
    if (!th) return;
    // Remove existing arrow indicators
    th.querySelector(".sort-arrow")?.remove();
    if (currentSort === col) {
      const arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      arrow.textContent = currentSortDir === "asc" ? " ▲" : " ▼";
      th.appendChild(arrow);
    }
  });
}

function renderTable() {
  const tbody = document.querySelector("#anime-table tbody");
  tbody.innerHTML = "";
  const list = getFilteredList();

  // Update count
  const countEl = document.getElementById("anime-count");
  if (countEl)
    countEl.textContent = `${list.length} animé${list.length > 1 ? "s" : ""}`;

  updateHeaderArrows();

  if (list.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align:center;opacity:0.5;font-style:italic;">Aucun résultat</td>`;
    tbody.appendChild(tr);
    return;
  }

  for (const entry of list) {
    const tr = document.createElement("tr");
    const safeTitle = entry.title
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, "&quot;");
    tr.innerHTML = `
      <td>${entry.title}</td>
      <td class="fav">${"★".repeat(entry.favoriteLevel || 0)}${"☆".repeat(5 - (entry.favoriteLevel || 0))}</td>
      <td><span class="badge badge-${entry._type}">${entry._type}</span></td>
      <td class="actions">
        <button class="btn-edit" title="Modifier" onclick="openEditModal('${entry._type}', '${safeTitle}')">✏️</button>
        <button class="btn-delete" title="Supprimer" onclick="openDeleteModal('${entry._type}', '${safeTitle}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// ─── TOGGLE FORM VIEW ────────────────────────────────────────────────────────

function toggleView() {
  const tableView = document.getElementById("table-view");
  const formView = document.getElementById("form-view");
  const toggleBtn = document.getElementById("toggle-view-btn");
  const isFormVisible = formView.style.display !== "none";

  if (isFormVisible) {
    formView.style.display = "none";
    tableView.style.display = "";
    toggleBtn.textContent = "+ Ajouter un animé";
    toggleBtn.classList.remove("active");
    resetForm();
  } else {
    formView.style.display = "";
    tableView.style.display = "none";
    toggleBtn.textContent = "← Retour au tableau";
    toggleBtn.classList.add("active");
    document.getElementById("form-type").value = "add";
    document.getElementById("form-title").focus();
  }
}

function resetForm() {
  document.getElementById("form-type").value = "add";
  document.getElementById("form-title").value = "";
  document.getElementById("form-fav").value = 0;
  document.getElementById("form-section-type").value = "series";
  document.getElementById("form-original-type").value = "";
  document.getElementById("form-original-title").value = "";
  updateStarPreview();
}

// ─── MODAL EDIT ──────────────────────────────────────────────────────────────

function openEditModal(type, title) {
  const entry = animeData[type].find((e) => e.title === title);
  if (!entry) return;

  document.getElementById("modal-title-text").textContent = "Modifier l'animé";
  document.getElementById("modal-form-type").value = "edit";
  document.getElementById("modal-form-title").value = entry.title;
  document.getElementById("modal-form-fav").value = entry.favoriteLevel || 0;
  document.getElementById("modal-form-section-type").value = type;
  document.getElementById("modal-form-original-type").value = type;
  document.getElementById("modal-form-original-title").value = entry.title;
  updateModalStars();

  document.getElementById("modal-overlay").classList.add("visible");
  document.getElementById("modal-form-title").focus();
}

function openDeleteModal(type, title) {
  document.getElementById("delete-modal-name").textContent = title;
  document.getElementById("delete-confirm-btn").onclick = () => {
    animeData[type] = animeData[type].filter((e) => e.title !== title);
    closeDeleteModal();
    renderTable();
  };
  document.getElementById("delete-modal-overlay").classList.add("visible");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("visible");
}

function closeDeleteModal() {
  document.getElementById("delete-modal-overlay").classList.remove("visible");
}

function handleModalSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById("modal-form-type").value;
  const title = document.getElementById("modal-form-title").value.trim();
  const favoriteLevel =
    parseInt(document.getElementById("modal-form-fav").value, 10) || 0;
  const type = document.getElementById("modal-form-section-type").value;
  const originalType = document.getElementById(
    "modal-form-original-type",
  ).value;
  const originalTitle = document.getElementById(
    "modal-form-original-title",
  ).value;
  if (!title) return;

  if (mode === "edit") {
    if (type !== originalType || title !== originalTitle) {
      animeData[originalType] = animeData[originalType].filter(
        (e) => e.title !== originalTitle,
      );
      animeData[type].push({ title, favoriteLevel });
    } else {
      const entry = animeData[type].find((e) => e.title === originalTitle);
      if (entry) {
        entry.title = title;
        entry.favoriteLevel = favoriteLevel;
      }
    }
  }

  closeModal();
  renderTable();
}

// ─── MAIN FORM (add) ─────────────────────────────────────────────────────────

function handleFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("form-title").value.trim();
  const favoriteLevel =
    parseInt(document.getElementById("form-fav").value, 10) || 0;
  const type = document.getElementById("form-section-type").value;
  if (!title) return;

  animeData[type].push({ title, favoriteLevel });
  toggleView(); // retour au tableau
  renderTable();
}

// ─── STAR PREVIEWS ───────────────────────────────────────────────────────────

function updateStarPreview() {
  const val = parseInt(document.getElementById("form-fav").value, 10) || 0;
  const el = document.getElementById("star-preview");
  if (el) el.textContent = "★".repeat(val) + "☆".repeat(5 - val);
}

function updateModalStars() {
  const val =
    parseInt(document.getElementById("modal-form-fav").value, 10) || 0;
  const el = document.getElementById("modal-star-preview");
  if (el) el.textContent = "★".repeat(val) + "☆".repeat(5 - val);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadAnimeData();

  // Toggle view button
  document
    .getElementById("toggle-view-btn")
    .addEventListener("click", toggleView);

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderTable();
  });

  // Type filter
  document.getElementById("type-filter").addEventListener("change", (e) => {
    currentType = e.target.value;
    renderTable();
  });

  // Fav filter
  document.getElementById("fav-filter").addEventListener("change", (e) => {
    favFilter = e.target.value;
    renderTable();
  });

  // Sortable headers
  document.getElementById("th-alpha").addEventListener("click", () => {
    setSortHeader("alpha");
    renderTable();
  });
  document.getElementById("th-fav").addEventListener("click", () => {
    setSortHeader("fav");
    renderTable();
  });
  document.getElementById("th-type").addEventListener("click", () => {
    setSortHeader("type");
    renderTable();
  });

  // Add form
  document
    .getElementById("anime-form")
    .addEventListener("submit", handleFormSubmit);
  document
    .getElementById("form-fav")
    .addEventListener("input", updateStarPreview);

  // Edit modal
  document
    .getElementById("modal-form")
    .addEventListener("submit", handleModalSubmit);
  document
    .getElementById("modal-close-btn")
    .addEventListener("click", closeModal);
  document
    .getElementById("modal-cancel-btn")
    .addEventListener("click", closeModal);
  document
    .getElementById("modal-form-fav")
    .addEventListener("input", updateModalStars);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  // Delete modal
  document
    .getElementById("delete-cancel-btn")
    .addEventListener("click", closeDeleteModal);
  document
    .getElementById("delete-modal-overlay")
    .addEventListener("click", (e) => {
      if (e.target === document.getElementById("delete-modal-overlay"))
        closeDeleteModal();
    });

  updateStarPreview();
});
