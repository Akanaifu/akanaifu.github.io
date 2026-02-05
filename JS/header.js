function createHeader() {
	const pathname = window.location.pathname;
	const segments = pathname.split("/").filter(Boolean);

	const isFile = segments.length > 0 && segments[segments.length - 1].includes(".");
	const depth = isFile ? segments.length - 1 : segments.length;
	const relativePath = depth > 0 ? "../".repeat(depth) : "";

	const header = document.createElement("header");
	header.innerHTML = `
    <div class="header-container">
      <div class="header-left">
      <a href="${relativePath}index.html">
        <img src="${relativePath}IMG/photo_profil/Nathan1.jpg" alt="Nathan Lemaire" class="header-profile-img" />
      </a>
      <a href="${relativePath}index.html" class="header-logo">Nathan Lemaire</a>
      </div>
      <button class="menu-toggle" aria-label="Toggle menu">
        ☰
      </button>
      <nav class="header-nav">
        <a href="${relativePath}projets.html">Projets</a>
        <a href="${relativePath}cv.html">CV</a>
        <a href="${relativePath}tabPortfolio.html">Portfolio</a>
      </nav>
    </div>
  `;

	document.body.insertBefore(header, document.body.firstChild);

	const menuToggle = header.querySelector(".menu-toggle");
	const nav = header.querySelector(".header-nav");

	menuToggle.addEventListener("click", () => {
		nav.classList.toggle("active");
	});

	nav.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => {
			nav.classList.remove("active");
		});
	});

	// Use absolute pathname resolution for accurate active link detection
	const currentPath = window.location.pathname.endsWith("/")
		? `${window.location.pathname}index.html`
		: window.location.pathname;
	nav.querySelectorAll("a").forEach((link) => {
		const href = link.getAttribute("href");
		if (!href) return;
		const linkPath = new URL(href, window.location.href).pathname;
		const normalizedLinkPath = linkPath.endsWith("/") ? `${linkPath}index.html` : linkPath;
		if (normalizedLinkPath === currentPath) {
			link.classList.add("active");
		}
	});
}

document.addEventListener("DOMContentLoaded", createHeader);
