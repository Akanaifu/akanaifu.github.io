const POEM_LOCK_STORAGE_KEY = "poeme-unlocked";

const POEM_LOCK_CONFIG = {
  keyPhrase: "AKN_LOCK_KEY_2026_TEMP",
  iterations: 120000,
  saltB64: "0cK+K3i0zYE3ynSMsPobCg==",
  ivB64: "GWxxA/D47KF/qRhT",
  cipherB64: "nO3CggIOa0tpcPfJV593pKELSeUxew==",
};

async function fetchPoemData() {
  const response = await fetch("DATA/poeme.json");
  if (!response.ok) {
    throw new Error(
      `Impossible de charger DATA/poeme.json (${response.status}).`,
    );
  }
  return response.json();
}

function fillText(id, text) {
  const element = document.getElementById(id);
  if (element && typeof text === "string" && text.trim()) {
    element.textContent = text;
  }
}

function renderPoemLines(lines) {
  const article = document.getElementById("poeme-article");
  if (!article || !Array.isArray(lines) || lines.length === 0) {
    return;
  }

  article.innerHTML = "";
  lines.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    article.appendChild(p);
  });
}

function applyPoemData(data) {
  if (!data || typeof data !== "object") {
    return;
  }

  fillText("poeme-auth-title", data.auth?.title);
  fillText("poeme-auth-message", data.auth?.message);
  fillText("poeme-title", data.poeme?.title);

  const submitBtn = document.getElementById("poeme-submit");
  if (
    submitBtn &&
    typeof data.auth?.button === "string" &&
    data.auth.button.trim()
  ) {
    submitBtn.textContent = data.auth.button;
  }

  const passwordInput = document.getElementById("poeme-password");
  if (
    passwordInput &&
    typeof data.auth?.placeholder === "string" &&
    data.auth.placeholder.trim()
  ) {
    passwordInput.placeholder = data.auth.placeholder;
  }

  renderPoemLines(data.poeme?.lines);
}

function b64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function decryptReferencePassword() {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto API indisponible dans ce navigateur.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(POEM_LOCK_CONFIG.keyPhrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBytes(POEM_LOCK_CONFIG.saltB64),
      iterations: POEM_LOCK_CONFIG.iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(POEM_LOCK_CONFIG.ivB64) },
    key,
    b64ToBytes(POEM_LOCK_CONFIG.cipherB64),
  );

  return decoder.decode(decryptedBuffer);
}

function setPoemVisibility(isUnlocked) {
  const authSection = document.getElementById("poeme-auth");
  const contentSection = document.getElementById("poeme-content");

  if (!authSection || !contentSection) {
    return;
  }

  authSection.style.display = isUnlocked ? "none" : "block";
  contentSection.classList.toggle("is-hidden", !isUnlocked);
}

function relockPoemPage() {
  sessionStorage.removeItem(POEM_LOCK_STORAGE_KEY);
}

function setupRelockOnExit() {
  window.addEventListener("pagehide", relockPoemPage);
  window.addEventListener("beforeunload", relockPoemPage);
}

async function setupPoemLock() {
  const form = document.getElementById("poeme-auth-form");
  const passwordInput = document.getElementById("poeme-password");
  const feedback = document.getElementById("poeme-feedback");

  if (!form || !passwordInput || !feedback) {
    return;
  }

  try {
    const data = await fetchPoemData();
    applyPoemData(data);
  } catch (error) {
    console.error(error);
    feedback.textContent = "Contenu indisponible pour le moment.";
  }

  if (sessionStorage.getItem(POEM_LOCK_STORAGE_KEY) === "1") {
    setPoemVisibility(true);
    return;
  }

  setPoemVisibility(false);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const attempt = String(passwordInput.value || "").trim();
    if (!attempt) {
      feedback.textContent = "Entre un mot de passe.";
      return;
    }

    feedback.textContent = "Verification en cours...";

    try {
      const basePassword = await decryptReferencePassword();
      if (attempt === basePassword) {
        sessionStorage.setItem(POEM_LOCK_STORAGE_KEY, "1");
        feedback.textContent = "Acces autorise.";
        setPoemVisibility(true);
        return;
      }

      feedback.textContent = "Mot de passe incorrect.";
    } catch (error) {
      console.error(error);
      feedback.textContent = "Verification impossible.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupRelockOnExit();
  setupPoemLock();
});
