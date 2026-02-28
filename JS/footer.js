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
      <div class="footer-brand">Nathan Lemaire</div>
      <nav class="footer-links">
        <a href="${relativePath}index.html">Accueil</a>
        <a href="${relativePath}projets.html">Projets</a>
        <a href="${relativePath}cv.html">CV</a>
        <a href="${relativePath}tabPortfolio.html">Portfolio</a>
        <a href="${relativePath}about.html">A propos</a>
      </nav>
      <div class="footer-meta">(c) <span id="footer-year"></span> Nathan Lemaire</div>
    </div>
  `;

  document.body.appendChild(footer);

  const yearEl = footer.querySelector("#footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

document.addEventListener("DOMContentLoaded", createFooter);
