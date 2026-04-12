const ALGO_DESC = {
  caesar:
    "Chiffrement de César : chaque lettre est décalée d’un nombre fixe de positions dans l’alphabet (modulo 26). La clé est un entier entre 0 et 25.",
  affine:
    "Chiffrement affine : à chaque lettre (numérotée 0…25) on applique x ↦ (a·x + b) mod 26. Il faut que PGCD(a, 26) = 1 pour pouvoir déchiffrer.",
  vigenere:
    "Chiffrement de Vigenère : suite de décalages déterminée par un mot-clé répété. C_i = P_i + K_{i mod n} (mod 26).",
  autokey:
    "Autokey : comme Vigenère pour les premières lettres, puis la suite de décalages reprend les lettres du texte clair déjà obtenu (clé + début du clair).",
  playfair:
    "Playfair : bigrammes sur un carré 5×5 (alphabet sans J, J→I). Même lettre doublée : insertion de X. Rectangle : échange des colonnes ; même ligne : décalage circulaire.",
};

let currentAlgo = "caesar";

const algoDescEl = document.getElementById("algo-desc");
const keyPanelEl = document.getElementById("key-panel");
const playfairWrap = document.getElementById("playfair-grid-wrap");
const playfairGridEl = document.getElementById("playfair-grid");
const messageEl = document.getElementById("message");
const resultEl = document.getElementById("result");
const btnEncrypt = document.getElementById("btn-encrypt");
const btnDecrypt = document.getElementById("btn-decrypt");
const btnCopyResult = document.getElementById("btn-copy-result");
const btnResetInputs = document.getElementById("btn-reset-inputs");
const copyFeedbackEl = document.getElementById("copy-feedback");
const playfairHintEl = document.getElementById("playfair-hint");

function renderKeyPanel() {
  keyPanelEl.innerHTML = "";
  playfairWrap.classList.add("hidden");
  playfairWrap.setAttribute("aria-hidden", "true");

  if (currentAlgo === "caesar") {
    keyPanelEl.innerHTML = `
      <div class="key-field">
        <span>Décalage (0–25)</span>
        <input type="number" id="key-shift" min="0" max="25" value="3" />
      </div>`;
  } else if (currentAlgo === "affine") {
    keyPanelEl.innerHTML = `
      <div class="key-field">
        <span>a (premier avec 26)</span>
        <input type="number" id="key-a" value="5" />
      </div>
      <div class="key-field">
        <span>b</span>
        <input type="number" id="key-b" value="8" />
      </div>`;
  } else if (currentAlgo === "vigenere" || currentAlgo === "autokey") {
    keyPanelEl.innerHTML = `
      <div class="key-field" style="flex:1 1 100%">
        <span>Mot-clé</span>
        <input type="text" id="key-word" placeholder="ex: CRYPTO" autocomplete="off" />
      </div>`;
  } else if (currentAlgo === "playfair") {
    keyPanelEl.innerHTML = `
      <div class="key-field" style="flex:1 1 100%">
        <span>Clé (mot ou phrase)</span>
        <input type="text" id="key-playfair" placeholder="ex: MONARCHY" autocomplete="off" />
      </div>`;
    playfairWrap.classList.remove("hidden");
    playfairWrap.setAttribute("aria-hidden", "false");
    const inp = keyPanelEl.querySelector("#key-playfair");
    inp.addEventListener("input", () => updatePlayfairGrid(inp.value));
    updatePlayfairGrid(inp.value);
  }

  algoDescEl.textContent = ALGO_DESC[currentAlgo];
  if (playfairHintEl) {
    playfairHintEl.classList.toggle("hidden", currentAlgo !== "playfair");
  }
}

function updatePlayfairGrid(keyPhrase) {
  playfairGridEl.innerHTML = "";
  try {
    if (!keyPhrase.trim()) {
      playfairGridEl.innerHTML = "";
      return;
    }
    const { grid } = window.CryptoClassic.playfairBuildSquare(keyPhrase);
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement("span");
        cell.textContent = grid[r][col];
        playfairGridEl.appendChild(cell);
      }
    }
  } catch {
    playfairGridEl.innerHTML = "";
  }
}

function setActiveNav() {
  document.querySelectorAll(".algo-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.algo === currentAlgo);
  });
}

document.querySelectorAll(".algo-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAlgo = btn.dataset.algo;
    setActiveNav();
    renderKeyPanel();
    resultEl.value = "";
  });
});

function showError(msg) {
  let el = document.getElementById("crypto-err");
  if (!el) {
    el = document.createElement("p");
    el.id = "crypto-err";
    el.className = "err";
    keyPanelEl.after(el);
  }
  el.textContent = msg;
}

function clearError() {
  const el = document.getElementById("crypto-err");
  if (el) el.remove();
}

function run(encrypt) {
  clearError();
  const text = messageEl.value;
  let out = "";
  try {
    const C = window.CryptoClassic;
    if (currentAlgo === "caesar") {
      const s = document.getElementById("key-shift")?.value ?? "3";
      out = encrypt ? C.caesarEncrypt(text, s) : C.caesarDecrypt(text, s);
    } else if (currentAlgo === "affine") {
      const a = document.getElementById("key-a")?.value ?? "5";
      const b = document.getElementById("key-b")?.value ?? "8";
      out = encrypt ? C.affineEncrypt(text, a, b) : C.affineDecrypt(text, a, b);
    } else if (currentAlgo === "vigenere") {
      const k = document.getElementById("key-word")?.value ?? "";
      out = encrypt ? C.vigenereEncrypt(text, k) : C.vigenereDecrypt(text, k);
    } else if (currentAlgo === "autokey") {
      const k = document.getElementById("key-word")?.value ?? "";
      out = encrypt ? C.autokeyEncrypt(text, k) : C.autokeyDecrypt(text, k);
    } else if (currentAlgo === "playfair") {
      const k = document.getElementById("key-playfair")?.value ?? "";
      out = encrypt ? C.playfairEncrypt(text, k) : C.playfairDecrypt(text, k);
    }
    resultEl.value = out;
  } catch (e) {
    showError(e.message || String(e));
    resultEl.value = "";
  }
}

btnEncrypt.addEventListener("click", () => run(true));
btnDecrypt.addEventListener("click", () => run(false));

let copyFeedbackTimer = null;
btnCopyResult?.addEventListener("click", async () => {
  const text = resultEl.value;
  const setFb = (msg) => {
    if (copyFeedbackEl) copyFeedbackEl.textContent = msg;
  };
  if (!text) {
    setFb("Rien à copier");
    clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = setTimeout(() => setFb(""), 2000);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setFb("Copié");
  } catch {
    setFb("Copie impossible");
  }
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => setFb(""), 2000);
});

btnResetInputs?.addEventListener("click", () => {
  messageEl.value = "";
  resultEl.value = "";
  clearError();
  renderKeyPanel();
  messageEl.focus();
});

setActiveNav();
renderKeyPanel();
