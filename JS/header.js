function redirectToProfileEasterEgg() {
  const urlParts = ["https://www.", "youtube.com/watch?v=", "dQw4w9WgXcQ"];
  const targetUrl = urlParts.join("");
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

async function countProfilePhotos(relativePath, maxPhotos = 50) {
  let count = 0;

  // Count contiguous NathanX.jpg files (Nathan1, Nathan2, ...)
  for (let i = 1; i <= maxPhotos; i += 1) {
    const testPath = `${relativePath}IMG/photo_profil/Nathan${i}.jpg`;

    const exists = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = testPath;
    });

    if (!exists) break;
    count += 1;
  }

  return count;
}

async function createHeader() {
  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);

  const isFile =
    segments.length > 0 && segments[segments.length - 1].includes(".");
  const depth = isFile ? segments.length - 1 : segments.length;
  const relativePath = depth > 0 ? "../".repeat(depth) : "";
  const profilePhotoCount = await countProfilePhotos(relativePath);
  const safePhotoCount = profilePhotoCount > 0 ? profilePhotoCount : 1;
  const randomPhotoIndex = Math.floor(Math.random() * safePhotoCount) + 1;
  const profilePhotoSrc = `${relativePath}IMG/photo_profil/Nathan${randomPhotoIndex}.jpg`;

  const header = document.createElement("header");
  header.innerHTML = `
    <div class="header-container">
      <div class="header-left">
      <button type="button" class="header-profile-link" aria-label="Ouvrir le lien profil">
        <img src="${profilePhotoSrc}" alt="Nathan Lemaire" class="header-profile-img" />
      </button>
      <a href="${relativePath}index.html" class="header-logo">Nathan Lemaire</a>
      </div>
      <button class="menu-toggle" aria-label="Toggle menu">
        ☰
      </button>
      <nav class="header-nav">
        <a href="${relativePath}projets.html">Projets</a>
        <a href="${relativePath}tabPortfolio.html">Portfolio</a>
      </nav>
    </div>
  `;

  document.body.insertBefore(header, document.body.firstChild);

  const menuToggle = header.querySelector(".menu-toggle");
  const nav = header.querySelector(".header-nav");
  const profileLink = header.querySelector(".header-profile-link");

  if (profileLink) {
    profileLink.addEventListener("click", redirectToProfileEasterEgg);
  }

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
    const normalizedLinkPath = linkPath.endsWith("/")
      ? `${linkPath}index.html`
      : linkPath;
    if (normalizedLinkPath === currentPath) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", createHeader);
