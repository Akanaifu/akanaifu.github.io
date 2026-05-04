import { renderHero, createElement } from "./index.js";

async function fetchJson(file) {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Erreur chargement ${file}: ${response.status}`);
  }

  return response.json();
}

function renderCvContent(container) {
  const shell = createElement("section", "cv-shell");

  const infoSection = createElement("div", "cv-info");

  const actions = createElement("div", "cv-actions");

  const openBtn = createElement("a", "btn btn-primary cv-button");
  openBtn.href = "IMG/CV_Lemaire_Nathan.pdf";
  openBtn.target = "_blank";
  openBtn.rel = "noopener noreferrer";
  openBtn.textContent = "Ouvrir le PDF";

  const downloadBtn = createElement("a", "btn btn-secondary cv-button");
  downloadBtn.href = "IMG/CV_Lemaire_Nathan.pdf";
  downloadBtn.download = true;
  downloadBtn.textContent = "Télécharger le CV";

  actions.append(openBtn, downloadBtn);

  const frameCard = createElement("div", "cv-frame-card");
  const iframe = document.createElement("iframe");
  iframe.className = "cv-frame";
  iframe.src = "IMG/CV_Lemaire_Nathan.pdf";
  iframe.title = "CV de Nathan Lemaire";

  frameCard.appendChild(iframe);

  shell.append(infoSection, actions, frameCard);
  container.appendChild(shell);
}

async function initCvPage() {
  const container = document.getElementById("cv-content");
  if (!container) {
    return;
  }

  try {
    const cvData = await fetchJson("DATA/cv.json");
    renderHero(container, cvData.hero);
    renderCvContent(container);
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <section class="cv-shell">
        <h1>Mon CV</h1>
        <article class="cv-error">
          <h2>Impossible de charger le contenu</h2>
          <p>Le fichier DATA/cv.json n'a pas pu être lu.</p>
        </article>
      </section>
    `;
  }
}

document.addEventListener("DOMContentLoaded", initCvPage);
