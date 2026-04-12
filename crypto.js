/**
 * Cryptographie classique — alphabet latin A–Z (26 lettres).
 * Playfair : I et J sont fusionnés (J traité comme I).
 */

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function letterIndex(c) {
  const u = c.toUpperCase();
  if (u < "A" || u > "Z") return -1;
  return u.charCodeAt(0) - 65;
}

function indexLetter(i) {
  return A[(i % 26 + 26) % 26];
}

function onlyLetters(str, mergeJtoI) {
  let out = "";
  for (const ch of str.toUpperCase()) {
    let c = ch;
    if (c === "J" && mergeJtoI) c = "I";
    const idx = letterIndex(c);
    if (idx >= 0) out += c === "J" && mergeJtoI ? "I" : c;
  }
  return out;
}

function gcd(a, b) {
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function modInv(a, m) {
  a = ((a % m) + m) % m;
  for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
  return null;
}

/** César : clé = décalage entier (0–25) */
function caesarEncrypt(text, shift) {
  const n = Number.parseInt(String(shift), 10);
  const s = ((Number.isFinite(n) ? n : 0) % 26 + 26) % 26;
  let r = "";
  for (const ch of onlyLetters(text, false)) {
    r += indexLetter(letterIndex(ch) + s);
  }
  return r;
}

function caesarDecrypt(text, shift) {
  const n = Number.parseInt(String(shift), 10);
  return caesarEncrypt(text, Number.isFinite(n) ? -n : 0);
}

/** Affine : c = (a*p + b) mod 26 ; pgcd(a,26)=1 */
function affineEncrypt(text, a, b) {
  a = parseInt(a, 10);
  b = parseInt(b, 10);
  if (gcd(Math.abs(a), 26) !== 1) throw new Error("Affine : « a » doit être premier avec 26 (ex. 3, 5, 7, 9, 11, …).");
  let r = "";
  for (const ch of onlyLetters(text, false)) {
    r += indexLetter(a * letterIndex(ch) + b);
  }
  return r;
}

function affineDecrypt(text, a, b) {
  a = parseInt(a, 10);
  b = parseInt(b, 10);
  const inv = modInv(a, 26);
  if (inv == null) throw new Error("Affine : inverse de « a » introuvable.");
  let r = "";
  for (const ch of onlyLetters(text, false)) {
    r += indexLetter(inv * (letterIndex(ch) - b));
  }
  return r;
}

function vigenereKeyStream(key) {
  const k = onlyLetters(key, false);
  if (!k) throw new Error("Vigenère : clé non vide (lettres A–Z).");
  return k;
}

function vigenereEncrypt(text, key) {
  const k = vigenereKeyStream(key);
  const p = onlyLetters(text, false);
  let r = "";
  for (let i = 0; i < p.length; i++) {
    r += indexLetter(letterIndex(p[i]) + letterIndex(k[i % k.length]));
  }
  return r;
}

function vigenereDecrypt(text, key) {
  const k = vigenereKeyStream(key);
  const c = onlyLetters(text, false);
  let r = "";
  for (let i = 0; i < c.length; i++) {
    r += indexLetter(letterIndex(c[i]) - letterIndex(k[i % k.length]));
  }
  return r;
}

/**
 * Autokey (Vigenère avec auto-clé) :
 * chiffrement : suite = mot-clé + texte clair ; C_i = P_i + S_i.
 */
function autokeyEncrypt(text, key) {
  const k = vigenereKeyStream(key);
  const p = onlyLetters(text, false);
  if (!p) return "";
  let r = "";
  const n = k.length;
  for (let i = 0; i < p.length; i++) {
    const si = i < n ? k[i] : p[i - n];
    r += indexLetter(letterIndex(p[i]) + letterIndex(si));
  }
  return r;
}

function autokeyDecrypt(text, key) {
  const k = vigenereKeyStream(key);
  const c = onlyLetters(text, false);
  if (!c) return "";
  const n = k.length;
  let plain = "";
  for (let i = 0; i < c.length; i++) {
    let si;
    if (i < n) si = k[i];
    else si = plain[i - n];
    plain += indexLetter(letterIndex(c[i]) - letterIndex(si));
  }
  return plain;
}

/** Carré Playfair + chiffrement / déchiffrement */
function playfairBuildSquare(keyPhrase) {
  const seen = new Set();
  const order = [];
  const base = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // sans J

  const add = (ch) => {
    let c = ch.toUpperCase();
    if (c === "J") c = "I";
    if (c < "A" || c > "Z" || c === "J") return;
    if (!seen.has(c)) {
      seen.add(c);
      order.push(c);
    }
  };

  for (const ch of keyPhrase) add(ch);
  for (const ch of base) add(ch);

  const grid = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let col = 0; col < 5; col++) row.push(order[r * 5 + col]);
    grid.push(row);
  }
  const pos = {};
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 5; col++) {
      pos[grid[r][col]] = { r, c: col };
    }
  }
  return { grid, pos };
}

function playfairPreparePlain(text) {
  let t = onlyLetters(text, true).replace(/J/g, "I");
  const pairs = [];
  for (let i = 0; i < t.length; ) {
    if (i === t.length - 1) {
      pairs.push([t[i], "X"]);
      break;
    }
    let a = t[i];
    let b = t[i + 1];
    if (a === b) {
      pairs.push([a, "X"]);
      i += 1;
    } else {
      pairs.push([a, b]);
      i += 2;
    }
  }
  return pairs;
}

function playfairPrepareCipher(text) {
  let t = onlyLetters(text, true).replace(/J/g, "I");
  const pairs = [];
  for (let i = 0; i < t.length; i += 2) {
    if (i + 1 < t.length) pairs.push([t[i], t[i + 1]]);
    else pairs.push([t[i], "X"]);
  }
  return pairs;
}

function playfairTransform(pairs, grid, pos, decrypt) {
  const out = [];
  const colShift = decrypt ? -1 : 1;
  const rowDelta = decrypt ? -1 : 1;

  for (const [a, b] of pairs) {
    const pa = pos[a];
    const pb = pos[b];
    if (!pa || !pb) throw new Error("Playfair : caractère hors grille.");

    if (pa.r === pb.r) {
      out.push(grid[pa.r][(pa.c + colShift + 5) % 5]);
      out.push(grid[pb.r][(pb.c + colShift + 5) % 5]);
    } else if (pa.c === pb.c) {
      out.push(grid[(pa.r + rowDelta + 5) % 5][pa.c]);
      out.push(grid[(pb.r + rowDelta + 5) % 5][pb.c]);
    } else {
      out.push(grid[pa.r][pb.c]);
      out.push(grid[pb.r][pa.c]);
    }
  }
  return out.join("");
}

function playfairEncrypt(text, keyPhrase) {
  const { grid, pos } = playfairBuildSquare(keyPhrase);
  if (!keyPhrase.trim()) throw new Error("Playfair : indiquez une clé (mot ou phrase).");
  const pairs = playfairPreparePlain(text);
  return playfairTransform(pairs, grid, pos, false);
}

function playfairDecrypt(text, keyPhrase) {
  const { grid, pos } = playfairBuildSquare(keyPhrase);
  if (!keyPhrase.trim()) throw new Error("Playfair : indiquez une clé (mot ou phrase).");
  const pairs = playfairPrepareCipher(text);
  return playfairTransform(pairs, grid, pos, true);
}

window.CryptoClassic = {
  caesarEncrypt,
  caesarDecrypt,
  affineEncrypt,
  affineDecrypt,
  vigenereEncrypt,
  vigenereDecrypt,
  autokeyEncrypt,
  autokeyDecrypt,
  playfairEncrypt,
  playfairDecrypt,
  playfairBuildSquare,
};
