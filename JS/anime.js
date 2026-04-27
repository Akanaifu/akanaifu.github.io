// anime.js : gestion de l'affichage et des interactions pour anime.html
let animeData = { series: [], films: [], dropped: [] };
let currentType = "all";
let currentSort = "alpha";
let currentSortDir = "asc";
let searchTerm = "";
let favFilter = "all";
let statusFilter = "all";
let formatFilter = "all";

const ANILIST_USER = "Akanaifu";
const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const STATUS_LABELS = {
  COMPLETED: "Completed",
  CURRENT: "En cours",
  DROPPED: "Dropped",
  PAUSED: "En pause",
  REPEATING: "Revisionnage",
  PLANNING: "Planifié",
};

const FORMAT_LABELS = {
  TV: "TV",
  TV_SHORT: "TV Court",
  MOVIE: "Film",
  SPECIAL: "Spécial",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Clip",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function anilistStatusToType(status, format) {
  if (status === "DROPPED") return "dropped";
  if (format === "MOVIE" || format === "ONA" || format === "SPECIAL")
    return "films";
  return "series";
}

function scoreToFav(score) {
  if (!score) return 0;
  return Math.round(score / 20);
}

// ─── FETCH ANILIST ────────────────────────────────────────────────────────────

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

  for (const list of json.data.MediaListCollection.lists) {
    if (list.status === "PLANNING") continue;
    for (const entry of list.entries) {
      const title =
        entry.media.title.english ||
        entry.media.title.romaji ||
        "Titre inconnu";
      const score = entry.score || 0;
      const status = entry.status || "";
      const format = entry.media.format || "";
      const favoriteLevel = scoreToFav(score);
      const type = anilistStatusToType(status, format);
      result[type].push({ title, favoriteLevel, score, status, format });
    }
  }

  for (const key of ["series", "films", "dropped"]) {
    result[key].sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
    );
  }

  return result;
}

// ─── LOAD + FALLBACK ──────────────────────────────────────────────────────────

async function loadAnimeData() {
  const badge = document.getElementById("data-source-badge");

  const setBadge = (text, cls) => {
    if (!badge) return;
    badge.textContent = text;
    badge.className = `source-badge ${cls}`;
  };

  setBadge("⏳ Chargement depuis AniList...", "loading");

  try {
    animeData = await fetchAnilistData();
    setBadge(`✓ Données AniList — ${ANILIST_USER}`, "online");
  } catch (err) {
    console.warn("AniList inaccessible, fallback JSON local :", err.message);
    try {
      const res = await fetch("DATA/animes.json");
      const json = await res.json();
      const sections = json.sections;
      for (const key of ["series", "films", "dropped"]) {
        sections[key] = (sections[key] || []).map((e) => ({
          ...e,
          score: 0,
          status: key === "dropped" ? "DROPPED" : "COMPLETED",
          format: key === "films" ? "MOVIE" : "TV",
        }));
      }
      animeData = sections;
      setBadge("⚠ Données locales (AniList indisponible)", "offline");
    } catch (e2) {
      console.error("Impossible de charger les données locales :", e2);
      setBadge("✗ Aucune donnée disponible", "error");
    }
  }

  populateDynamicFilters();
  renderTable();
}

function populateDynamicFilters() {
  const all = [...animeData.series, ...animeData.films, ...animeData.dropped];
  const statuses = [
    ...new Set(all.map((e) => e.status).filter(Boolean)),
  ].sort();
  const formats = [...new Set(all.map((e) => e.format).filter(Boolean))].sort();

  const statusSel = document.getElementById("status-filter");
  const formatSel = document.getElementById("format-filter");

  while (statusSel.options.length > 1) statusSel.remove(1);
  while (formatSel.options.length > 1) formatSel.remove(1);

  for (const s of statuses) {
    const opt = new Option(STATUS_LABELS[s] || s, s);
    statusSel.appendChild(opt);
  }
  for (const f of formats) {
    const opt = new Option(FORMAT_LABELS[f] || f, f);
    formatSel.appendChild(opt);
  }
}

// ─── FILTRAGE & TRI ───────────────────────────────────────────────────────────

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
  if (statusFilter !== "all")
    list = list.filter((e) => e.status === statusFilter);
  if (formatFilter !== "all")
    list = list.filter((e) => e.format === formatFilter);

  const d = currentSortDir === "asc" ? 1 : -1;
  const alpha = (a, b) =>
    a.title.localeCompare(b.title, "fr", { sensitivity: "base" });

  const sorts = {
    alpha: (a, b) => d * alpha(a, b),
    fav: (a, b) => d * (b.favoriteLevel - a.favoriteLevel || alpha(a, b)),
    score: (a, b) => d * (b.score - a.score || alpha(a, b)),
    status: (a, b) =>
      d * ((a.status || "").localeCompare(b.status || "") || alpha(a, b)),
    format: (a, b) =>
      d * ((a.format || "").localeCompare(b.format || "") || alpha(a, b)),
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
  ["alpha", "fav", "type", "status", "format", "score"].forEach((col) => {
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

// ─── RENDU TABLEAU ────────────────────────────────────────────────────────────

function renderTable() {
  const tbody = document.querySelector("#anime-table tbody");
  tbody.innerHTML = "";
  const list = getFilteredList();

  const countEl = document.getElementById("anime-count");
  if (countEl)
    countEl.textContent = `${list.length} animé${list.length > 1 ? "s" : ""}`;

  updateHeaderArrows();

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;opacity:0.5;font-style:italic;">Aucun résultat</td></tr>`;
    return;
  }

  for (const entry of list) {
    const safe = entry.title
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, "&quot;");
    const slbl = STATUS_LABELS[entry.status] || entry.status || "—";
    const flbl = FORMAT_LABELS[entry.format] || entry.format || "—";
    const scoreHtml = entry.score
      ? `<span class="score-val">${entry.score}</span><span class="score-max">/100</span>`
      : `<span class="score-none">—</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.title}</td>
      <td class="fav">${"★".repeat(entry.favoriteLevel || 0)}${"☆".repeat(5 - (entry.favoriteLevel || 0))}</td>
      <td><span class="badge badge-${entry._type}">${entry._type}</span></td>
      <td><span class="badge badge-status badge-status-${(entry.status || "").toLowerCase()}">${slbl}</span></td>
      <td><span class="badge badge-format">${flbl}</span></td>
      <td class="score-cell">${scoreHtml}</td>
      <td class="actions">
        <button class="btn-edit"   title="Modifier"   onclick="openEditModal('${entry._type}','${safe}')">✏️</button>
        <button class="btn-delete" title="Supprimer"  onclick="openDeleteModal('${entry._type}','${safe}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  }
}

// ─── TOGGLE FORM VIEW ─────────────────────────────────────────────────────────

function toggleView() {
  const tableView = document.getElementById("table-view");
  const formView = document.getElementById("form-view");
  const btn = document.getElementById("toggle-view-btn");
  const visible = formView.style.display !== "none";

  if (visible) {
    formView.style.display = "none";
    tableView.style.display = "";
    btn.textContent = "+ Ajouter un animé";
    btn.classList.remove("active");
    resetForm();
  } else {
    tableView.style.display = "none";
    formView.style.display = "";
    btn.textContent = "← Retour au tableau";
    btn.classList.add("active");
    document.getElementById("form-title").focus();
  }
}

function resetForm() {
  ["form-title", "form-original-type", "form-original-title"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("form-type").value = "add";
  document.getElementById("form-fav").value = 0;
  document.getElementById("form-score").value = 0;
  document.getElementById("form-status").value = "COMPLETED";
  document.getElementById("form-format").value = "TV";
  document.getElementById("form-section-type").value = "series";
  updateStarPreview();
  updateScorePreview();
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function openEditModal(type, title) {
  const entry = animeData[type].find((e) => e.title === title);
  if (!entry) return;

  document.getElementById("modal-form-title").value = entry.title;
  document.getElementById("modal-form-fav").value = entry.favoriteLevel || 0;
  document.getElementById("modal-form-score").value = entry.score || 0;
  document.getElementById("modal-form-status").value =
    entry.status || "COMPLETED";
  document.getElementById("modal-form-format").value = entry.format || "TV";
  document.getElementById("modal-form-section-type").value = type;
  document.getElementById("modal-form-original-type").value = type;
  document.getElementById("modal-form-original-title").value = entry.title;
  updateModalStars();
  updateModalScorePreview();

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
  const title = document.getElementById("modal-form-title").value.trim();
  const favoriteLevel =
    parseInt(document.getElementById("modal-form-fav").value, 10) || 0;
  const score =
    parseInt(document.getElementById("modal-form-score").value, 10) || 0;
  const status = document.getElementById("modal-form-status").value;
  const format = document.getElementById("modal-form-format").value;
  const type = document.getElementById("modal-form-section-type").value;
  const origType = document.getElementById("modal-form-original-type").value;
  const origTitle = document.getElementById("modal-form-original-title").value;
  if (!title) return;

  if (type !== origType || title !== origTitle) {
    animeData[origType] = animeData[origType].filter(
      (e) => e.title !== origTitle,
    );
    animeData[type].push({ title, favoriteLevel, score, status, format });
  } else {
    const entry = animeData[type].find((e) => e.title === origTitle);
    if (entry)
      Object.assign(entry, { title, favoriteLevel, score, status, format });
  }

  closeModal();
  renderTable();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("form-title").value.trim();
  const favoriteLevel =
    parseInt(document.getElementById("form-fav").value, 10) || 0;
  const score = parseInt(document.getElementById("form-score").value, 10) || 0;
  const status = document.getElementById("form-status").value;
  const format = document.getElementById("form-format").value;
  const type = document.getElementById("form-section-type").value;
  if (!title) return;

  animeData[type].push({ title, favoriteLevel, score, status, format });
  toggleView();
  renderTable();
}

// ─── PREVIEWS ────────────────────────────────────────────────────────────────

function updateStarPreview() {
  const v = parseInt(document.getElementById("form-fav").value, 10) || 0;
  const el = document.getElementById("star-preview");
  if (el) el.textContent = "★".repeat(v) + "☆".repeat(5 - v);
}

function updateScorePreview() {
  const v = document.getElementById("form-score").value;
  const el = document.getElementById("score-preview");
  if (el) el.textContent = `${v}/100`;
}

function updateModalStars() {
  const v = parseInt(document.getElementById("modal-form-fav").value, 10) || 0;
  const el = document.getElementById("modal-star-preview");
  if (el) el.textContent = "★".repeat(v) + "☆".repeat(5 - v);
}

function updateModalScorePreview() {
  const v = document.getElementById("modal-form-score").value;
  const el = document.getElementById("modal-score-preview");
  if (el) el.textContent = `${v}/100`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadAnimeData();

  document
    .getElementById("toggle-view-btn")
    .addEventListener("click", toggleView);
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderTable();
  });
  document.getElementById("type-filter").addEventListener("change", (e) => {
    currentType = e.target.value;
    renderTable();
  });
  document.getElementById("fav-filter").addEventListener("change", (e) => {
    favFilter = e.target.value;
    renderTable();
  });
  document.getElementById("status-filter").addEventListener("change", (e) => {
    statusFilter = e.target.value;
    renderTable();
  });
  document.getElementById("format-filter").addEventListener("change", (e) => {
    formatFilter = e.target.value;
    renderTable();
  });

  // Headers triables
  [
    ["th-alpha", "alpha"],
    ["th-fav", "fav"],
    ["th-type", "type"],
    ["th-status", "status"],
    ["th-format", "format"],
    ["th-score", "score"],
  ].forEach(([id, col]) => {
    document.getElementById(id)?.addEventListener("click", () => {
      setSortHeader(col);
      renderTable();
    });
  });

  // Formulaire d'ajout
  document
    .getElementById("anime-form")
    .addEventListener("submit", handleFormSubmit);
  document
    .getElementById("form-fav")
    .addEventListener("input", updateStarPreview);
  document
    .getElementById("form-score")
    .addEventListener("input", updateScorePreview);

  // Modal édition
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
  document
    .getElementById("modal-form-score")
    .addEventListener("input", updateModalScorePreview);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  // Modal suppression
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
  updateScorePreview();
});
