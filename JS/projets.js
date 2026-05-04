import * as index from "./index.js";

async function fetchJson(file) {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Erreur chargement ${file}: ${response.status}`);
  }

  return response.json();
}

async function initProjectsPage() {
  const container = document.getElementById("project-content");
  if (!container) {
    return;
  }

  try {
    const projectData = await fetchJson("DATA/projet.json");
    index.renderIndex("project-content", projectData);
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <section class="project-shell">
        <h1>Mon projet</h1>
        <article class="project-card project-error">
          <h2>Impossible de charger le contenu</h2>
          <p>Le fichier DATA/projet.json n’a pas pu être lu.</p>
        </article>
      </section>
    `;
  }
}

document.addEventListener("DOMContentLoaded", initProjectsPage);
