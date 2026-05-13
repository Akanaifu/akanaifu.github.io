function createProfileImage(relativePath, profilePhotoSrc) {
  const image = document.createElement("img");
  image.src = profilePhotoSrc;
  image.alt = "Nathan Lemaire";
  image.className = "header-profile-img";
  image.dataset.profileMedia = "photo";
  image.dataset.profilePhotoSrc = profilePhotoSrc;
  image.dataset.profileVideoSrc = `${relativePath}IMG/Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster) [dQw4w9WgXcQ].mp4`;
  return image;
}

function createProfileVideo(profilePhotoSrc, profileVideoSrc) {
  const video = document.createElement("video");
  video.className = "header-profile-img";
  video.dataset.profileMedia = "video";
  video.dataset.profilePhotoSrc = profilePhotoSrc;
  video.dataset.profileVideoSrc = profileVideoSrc;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.controls = false;
  video.loop = false;
  video.muted = false;
  video.volume = 1;
  video.src = profileVideoSrc;
  return video;
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
  const profilePhotoCount = await countProfilePhotos(relativePath, 3);
  const safePhotoCount = profilePhotoCount > 0 ? profilePhotoCount : 1;
  const randomPhotoIndex = Math.floor(Math.random() * safePhotoCount) + 1;
  const profilePhotoSrc = `${relativePath}IMG/photo_profil/Nathan${randomPhotoIndex}.jpg`;
  const profileVideoSrc = `${relativePath}IMG/Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster) [dQw4w9WgXcQ].mp4`;

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
        <a href="${relativePath}projets.html">Mon projet</a>
        <a href="${relativePath}cv.html">CV</a>
        <a href="${relativePath}tabPortfolio.html">Portfolio</a>
      </nav>
    </div>
  `;

  document.body.insertBefore(header, document.body.firstChild);

  const menuToggle = header.querySelector(".menu-toggle");
  const nav = header.querySelector(".header-nav");
  const profileLink = header.querySelector(".header-profile-link");
  const profileMedia = createProfileImage(relativePath, profilePhotoSrc);

  if (profileLink) {
    profileLink.replaceChildren(profileMedia);

    profileLink.addEventListener("click", async () => {
      const currentMedia = profileLink.querySelector("[data-profile-media]");
      const isVideo = currentMedia?.dataset.profileMedia === "video";

      if (isVideo) {
        profileLink.replaceChildren(
          createProfileImage(relativePath, profilePhotoSrc),
        );
        return;
      }

      const video = createProfileVideo(profilePhotoSrc, profileVideoSrc);
      profileLink.replaceChildren(video);

      try {
        await video.play();
      } catch {
        profileLink.replaceChildren(
          createProfileImage(relativePath, profilePhotoSrc),
        );
      }
    });
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
