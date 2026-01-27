async function loadActivityDetail() {
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const activitySlug = urlParams.get("activity");

		if (!activitySlug) {
			throw new Error("Aucune activité spécifiée");
		}

		const data = await fetch("../DATA/tabPortfolio.json").then((res) => res.json());
		const activity = data.find((item) => slugify(item.nom) === activitySlug);

		if (!activity) {
			throw new Error("Activité non trouvée");
		}

		displayActivity(activity);
	} catch (err) {
		console.error(err);
		document.getElementById("detail-container").innerHTML =
			`<p class="error">Erreur: ${err.message}</p>`;
	}
}

function slugify(str) {
	return String(str || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function displayActivity(activity) {
	const container = document.getElementById("detail-container");

	const preuvesHtml = activity.preuves
		.map((preuve) => {
			const lien = preuve.lien;
			const legende = preuve.legende || "";

			if (lien.includes("instagram.com")) {
				return `
        <div class="preuve-item instagram-embed">
          <a href="${lien}" target="_blank" rel="noopener noreferrer">
            Voir le post Instagram
          </a>
          <blockquote class="instagram-media" data-instgrm-permalink="${lien}" data-instgrm-version="14"></blockquote>
          ${legende ? `<p class="preuve-legend">${legende}</p>` : ""}
        </div>
      `;
			} else if (lien.includes("facebook.com")) {
				// Extraire l'URL du post Facebook
				const fbUrl = encodeURIComponent(lien);
				return `
        <div class="preuve-item facebook-embed">
          <iframe src="https://www.facebook.com/plugins/post.php?href=${fbUrl}&show_text=true&width=500" 
                  width="500" 
                  height="643" 
                  style="border:none;overflow:hidden" 
                  scrolling="no" 
                  frameborder="0" 
                  allowfullscreen="true" 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
          </iframe>
          ${legende ? `<p class="preuve-legend">${legende}</p>` : ""}
        </div>
        `;
			} else if (lien.includes("strava.com/athletes/")) {
				return `
        <div class="preuve-item strava-badge-container">
          <a href="${lien}" class="strava-badge- strava-badge-follow" target="_blank" rel="noopener noreferrer">
            <img src="//badges.strava.com/echelon-sprite-48.png" alt="Strava" />
          </a>
          <p class="strava-caption">${legende || "Voir le profil Strava"}</p>
        </div>
        `;
			} else if (lien.startsWith("http")) {
				return `<div class="preuve-item"><a href="${lien}" target="_blank" rel="noopener noreferrer">${
					legende || lien
				}</a></div>`;
			} else if (lien.match(/\.(mp4|webm|ogg)$/i)) {
				return `
          <div class="preuve-item video-preuve">
            <video controls>
              <source src="../IMG/preuve_portfolio/${lien}" type="video/mp4">
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            <p class="video-caption">${legende}</p>
          </div>
        `;
			} else if (lien.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
				return `
          <div class="preuve-item image-preuve">
            <img src="../IMG/preuve_portfolio/${lien}" alt="${legende}" class="zoomable-image" />
            <p class="image-caption">${legende}</p>
          </div>
        `;
			} else if (lien.match(/\.(pdf)$/i)) {
				// Embed PDF in an iframe with print/open controls
				const src = `../IMG/preuve_portfolio/${lien}`;
				return `
          <div class="preuve-item pdf-preuve">
            <div class="pdf-controls">
              <button class="btn-print" data-src="${src}">Imprimer</button>
              <a class="btn-open" href="${src}" target="_blank" rel="noopener noreferrer">Ouvrir dans un nouvel onglet</a>
            </div>
            <iframe class="pdf-frame" src="${src}" title="${legende || "PDF"}"></iframe>
            ${legende ? `<p class="pdf-caption">${legende}</p>` : ""}
          </div>
        `;
			} else {
				return `<div class="preuve-item"><a href="../IMG/preuve_portfolio/${lien}" target="_blank">${
					legende || lien
				}</a></div>`;
			}
		})
		.join("");

	container.innerHTML = `
    <div class="activity-detail">
    <a id="back-link" href="#" class="back-link">← Retour au tableau</a>
      <h1>${activity.nom}</h1>
      <p class="category">Catégorie: ${activity.categorie}</p>
      ${activity.date ? `<p class="date">Date: ${activity.date}</p>` : ""}
      
      <div class="hours-info">
        <p><strong>Heures prestées:</strong> ${activity.heures_prestees || "Non spécifié"}</p>
        <p><strong>Heures valorisées:</strong> ${activity.heures_valorisees}</p>
      </div>    
      <div 
      class="description">
        <h2>Description</h2>
        <p>${activity.description}</p>
      </div>
      
      <div class="preuves">
        <h2>Preuves</h2>
        ${preuvesHtml || "<p>Aucune preuve disponible</p>"}
      </div>
      
    </div>
    
    <!-- Lightbox pour agrandir les images -->
    <div id="image-lightbox" class="lightbox">
      <span class="lightbox-close">&times;</span>
      <img class="lightbox-content" id="lightbox-img">
      <div class="lightbox-caption"></div>
    </div>
  `;

	const backLink = document.getElementById("back-link");
	if (backLink) {
		try {
			backLink.href = new URL("../tabPortfolio.html", location.href).href;
		} catch (_e) {
			backLink.href = "../tabPortfolio.html";
		}
	}

	if (activity.preuves.some((p) => p.lien?.includes("instagram.com"))) {
		loadInstagramEmbed();
	}

	initImageZoom();

	initPdfControls();
}

function initImageZoom() {
	const lightbox = document.getElementById("image-lightbox");
	const lightboxImg = document.getElementById("lightbox-img");
	const lightboxCaption = document.querySelector(".lightbox-caption");
	const closeBtn = document.querySelector(".lightbox-close");

	document.querySelectorAll(".zoomable-image").forEach((img) => {
		img.addEventListener("click", function () {
			lightbox.style.display = "flex";
			lightboxImg.src = this.src;
			lightboxCaption.textContent = this.alt || "";
			document.body.style.overflow = "hidden";
		});
	});

	closeBtn.addEventListener("click", closeLightbox);

	lightbox.addEventListener("click", (e) => {
		if (e.target === lightbox) {
			closeLightbox();
		}
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && lightbox.style.display === "flex") {
			closeLightbox();
		}
	});

	function closeLightbox() {
		lightbox.style.display = "none";
		document.body.style.overflow = "auto";
	}
}

// initialize PDF print/open controls
function initPdfControls() {
	document.querySelectorAll(".btn-print").forEach((btn) => {
		btn.addEventListener("click", async (_e) => {
			const src = btn.dataset.src;
			if (!src) return;

			// Try to find corresponding iframe
			const iframe = document.querySelector(`iframe.pdf-frame[src="${src}"]`);
			if (iframe?.contentWindow) {
				try {
					// Some browsers require the iframe to be fully loaded
					if (!iframe.dataset.loaded) {
						await new Promise((resolve) => {
							iframe.addEventListener(
								"load",
								() => {
									iframe.dataset.loaded = "1";
									resolve();
								},
								{ once: true },
							);
						});
					}
					iframe.contentWindow.focus();
					iframe.contentWindow.print();
					return;
				} catch (err) {
					// fallthrough to open in new tab if printing fails
					console.warn("Printing via iframe failed:", err);
				}
			}

			// Fallback: open PDF in new tab; user can print from there
			window.open(src, "_blank", "noopener");
		});
	});
}

function loadInstagramEmbed() {
	if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
		const script = document.createElement("script");
		script.async = true;
		script.src = "//www.instagram.com/embed.js";
		document.body.appendChild(script);
	} else {
		if (window.instgrm) {
			window.instgrm.Embeds.process();
		}
	}
}

document.addEventListener("DOMContentLoaded", loadActivityDetail);
