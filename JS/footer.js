function createFooter() {
  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);

  const isFile =
    segments.length > 0 && segments[segments.length - 1].includes(".");
  const depth = isFile ? segments.length - 1 : segments.length;
  const relativePath = depth > 0 ? "../".repeat(depth) : "";

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-left">
        <div class="footer-brand">Nathan Lemaire</div>
        <div class="footer-subtitle">Étudiant à l'EPHEC</div>
      </div>
      <nav class="footer-links">
        <a href="${relativePath}index.html">Accueil</a>
        <a href="${relativePath}projets.html">Projets</a>
        <a href="${relativePath}tabPortfolio.html">Portfolio</a>
      </nav>
      <div class="footer-right">
        <div class="footer-socials">
          <a href="https://github.com/akanaifu" target="_blank" rel="noopener noreferrer" title="GitHub">
            <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52 0-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82a7.56 7.56 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/nathan-lemaire-68229a373/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="mailto:lemaire.nathan@hotmail.com" title="Email">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </a>
        </div>
        <div class="footer-meta">&copy; <span id="footer-year"></span> Nathan Lemaire</div>
        <a class="footer-source" href="https://github.com/akanaifu/akanaifu.github.io" target="_blank" rel="noopener noreferrer">Code source</a>
      </div>
    </div>
  `;

  document.body.appendChild(footer);

  const yearEl = footer.querySelector("#footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

document.addEventListener("DOMContentLoaded", createFooter);
