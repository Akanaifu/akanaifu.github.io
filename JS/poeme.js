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

function b64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeBytesToText(bytes) {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  return decoder.decode(bytes);
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

function renderRawDecryptedText(text) {
  const lines = String(text || "").split(/\r?\n/);
  renderPoemLines(lines);
}

function setPoemVisibility(isVisible) {
  const contentSection = document.getElementById("poeme-content");
  if (!contentSection) {
    return;
  }

  contentSection.classList.toggle("is-hidden", !isVisible);
}

function applyUiLabels(data) {
  if (!data || typeof data !== "object") {
    return;
  }

  fillText("poeme-auth-title", data.auth?.title);
  fillText("poeme-auth-message", data.auth?.message);

  const submitBtn = document.getElementById("poeme-submit");
  if (
    submitBtn &&
    typeof data.auth?.button === "string" &&
    data.auth.button.trim()
  ) {
    submitBtn.textContent = data.auth.button;
  }

  const keyInput = document.getElementById("poeme-password");
  if (
    keyInput &&
    typeof data.auth?.placeholder === "string" &&
    data.auth.placeholder.trim()
  ) {
    keyInput.placeholder = data.auth.placeholder;
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function decryptPoemWithKey(keyText, encryptedConfig) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto API indisponible dans ce navigateur.");
  }

  if (!encryptedConfig || typeof encryptedConfig !== "object") {
    throw new Error("Configuration de chiffrement invalide.");
  }

  const iterations = Number(encryptedConfig.kdf?.iterations || 180000);
  const counterLength = Number(encryptedConfig.cipher?.counterLength || 64);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    throw new Error("Iterations PBKDF2 invalides.");
  }

  if (
    !Number.isInteger(counterLength) ||
    counterLength <= 0 ||
    counterLength > 128
  ) {
    throw new Error("Longueur de compteur AES-CTR invalide.");
  }

  const encoder = new TextEncoder();

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(String(keyText || "")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBytes(encryptedConfig.kdf?.saltB64 || ""),
      iterations,
      hash: encryptedConfig.kdf?.hash || "SHA-256",
    },
    keyMaterial,
    { name: "AES-CTR", length: 256 },
    false,
    ["decrypt"],
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-CTR",
      counter: b64ToBytes(encryptedConfig.cipher?.counterB64 || ""),
      length: counterLength,
    },
    key,
    b64ToBytes(encryptedConfig.cipher?.cipherB64 || ""),
  );

  return decodeBytesToText(new Uint8Array(decryptedBuffer));
}

function renderDecryptionResult(decryptedText) {
  const parsed = safeJsonParse(decryptedText);
  const hasStructuredPoem =
    parsed && typeof parsed === "object" && Array.isArray(parsed.lines);

  if (hasStructuredPoem) {
    fillText("poeme-title", parsed.title);
    renderPoemLines(parsed.lines);
    return;
  }

  fillText("poeme-title", "Résultat du déchiffrement");
  renderRawDecryptedText(decryptedText);
}

async function setupPoemPage() {
  const form = document.getElementById("poeme-auth-form");
  const keyInput = document.getElementById("poeme-password");
  const feedback = document.getElementById("poeme-feedback");

  if (!form || !keyInput || !feedback) {
    return;
  }

  setPoemVisibility(false);

  let data;

  try {
    data = await fetchPoemData();
    applyUiLabels(data);
  } catch (error) {
    console.error(error);
    feedback.textContent = "Contenu indisponible pour le moment.";
    return;
  }

  const encryptedConfig = data?.poemeEncrypted;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const keyAttempt = String(keyInput.value || "");
    if (!keyAttempt.trim()) {
      feedback.textContent = "Entre une clé de déchiffrement.";
      return;
    }

    feedback.textContent = "Déchiffrement en cours...";

    try {
      const decryptedText = await decryptPoemWithKey(
        keyAttempt,
        encryptedConfig,
      );
      renderDecryptionResult(decryptedText);
      setPoemVisibility(true);

      const parsed = safeJsonParse(decryptedText);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.lines)) {
        feedback.textContent = "Poème déchiffré.";
      } else {
        feedback.textContent =
          "Texte déchiffré affiché (clé probablement incorrecte).";
      }
    } catch (error) {
      console.error(error);
      feedback.textContent = "Déchiffrement impossible.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupPoemPage();
});
