const POPUP_ID = "card-popup";

const TECH_ICON_MAP = {
  "react.js": "react",
  react: "react",
  mongodb: "mongodb",
  firebase: "firebase",
  nosql: "databricks",
  mysql: "mysql",
  typescript: "typescript",
  c: "c",
  flask: "flask",
  fastapi: "fastapi",
  "node.js": "nodedotjs",
  nodejs: "nodedotjs",
  python: "python",
  angularjs: "angular",
  angular: "angular",
  "react native": "react",
  css: "css",
  html: "html5",
  jsx: "react",
  js: "javascript",
  matlab: "mathworks",
  mathlab: "mathworks",
  panda: "pandas",
  pandas: "pandas",
  numpy: "numpy",
  github: "github",
  git: "git",
  kicad: "kicad",
  micropython: "micropython",
  lightburn: "lightburn",
};

function normalizeTechName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseDetailList(detail) {
  if (!detail) {
    return [];
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof detail === "string") {
    const trimmed = detail.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback below if parsing fails.
      }
    }
  }

  return String(detail)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTechIconSlug(label) {
  const normalized = normalizeTechName(label);
  return TECH_ICON_MAP[normalized] || null;
}

function createTechItem(label, slug) {
  const item = document.createElement("div");
  item.className = "tech-logo-item";

  if (slug) {
    const icon = document.createElement("img");
    icon.className = "tech-logo-icon";
    icon.src = `https://cdn.simpleicons.org/${slug}`;
    icon.alt = `Logo ${label}`;
    icon.loading = "lazy";
    icon.addEventListener("error", () => {
      icon.remove();
      item.classList.add("no-logo");
    });
    item.appendChild(icon);
  } else {
    item.classList.add("no-logo");
  }

  const text = document.createElement("span");
  text.textContent = label;
  item.appendChild(text);

  return item;
}

function renderTechLogos(container, detailList) {
  container.textContent = "";

  detailList.forEach((tech) => {
    const slug = getTechIconSlug(tech);
    const techItem = createTechItem(tech, slug);
    container.appendChild(techItem);
  });
}

function getOrCreatePopup() {
  let popup = document.getElementById(POPUP_ID);

  if (popup) {
    return popup;
  }

  popup = document.createElement("div");
  popup.id = POPUP_ID;
  popup.className = "card-popup-overlay";
  popup.innerHTML = `
    <div class="card-popup" role="dialog" aria-modal="true" aria-labelledby="card-popup-title">
      <button class="card-popup-close" type="button" aria-label="Fermer">&times;</button>
      <h3 id="card-popup-title"></h3>
      <p id="card-popup-description"></p>
      <div id="card-popup-logos" class="card-popup-logos"></div>
    </div>
  `;

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closePopup();
    }
  });

  const closeButton = popup.querySelector(".card-popup-close");
  if (closeButton) {
    closeButton.addEventListener("click", closePopup);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("is-open")) {
      closePopup();
    }
  });

  document.body.appendChild(popup);
  return popup;
}

function openPopup(title, description, options = {}) {
  const { showLogos = false, detailList = [] } = options;
  const popup = getOrCreatePopup();
  const titleElement = popup.querySelector("#card-popup-title");
  const descriptionElement = popup.querySelector("#card-popup-description");
  const logosContainer = popup.querySelector("#card-popup-logos");

  if (titleElement) {
    titleElement.textContent = title;
  }

  if (descriptionElement) {
    descriptionElement.textContent = description;
  }

  if (logosContainer) {
    logosContainer.textContent = "";

    if (showLogos && detailList.length > 0) {
      logosContainer.classList.add("is-visible");
      renderTechLogos(logosContainer, detailList);
    } else {
      logosContainer.classList.remove("is-visible");
    }
  }

  popup.classList.add("is-open");
}

function closePopup() {
  const popup = document.getElementById(POPUP_ID);
  if (!popup) {
    return;
  }

  popup.classList.remove("is-open");
}

function bindCard(card) {
  if (card.dataset.popupBound === "true") {
    return;
  }

  card.dataset.popupBound = "true";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const openCardPopup = () => {
    const title = card.querySelector("h3")?.textContent?.trim() || "Détail";
    const rawDetail = card.dataset.popupDetail || "";
    const sectionTitle = card.dataset.sectionTitle?.trim() || "";
    const detailList = parseDetailList(rawDetail);
    const isCompetencesSection =
      normalizeTechName(sectionTitle) === "competences" ||
      normalizeTechName(sectionTitle) === "compétences";

    const description = detailList.join(", ")
      ? ""
      : card.querySelector("p")?.textContent?.trim();

    openPopup(title, description, {
      showLogos: isCompetencesSection,
      detailList,
    });
  };

  card.addEventListener("click", openCardPopup);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCardPopup();
    }
  });
}

export function initCardsPopup() {
  const cards = document.querySelectorAll(".skills-grid .skill-card");
  cards.forEach(bindCard);
}
