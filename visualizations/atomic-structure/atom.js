/* ============================================================
   Atomic Structure Builder
   ------------------------------------------------------------
   A hands-on model of the atom. The student changes the number
   of protons, neutrons, and electrons and everything else
   (element identity, charge, mass number, isotope, electron
   shells) is derived and drawn live.

   Pedagogy: the three particle counts are the ONLY inputs.
   Every label on screen is computed from them, so the student
   learns what actually *determines* each property:
     - protons  -> element identity & atomic number (Z)
     - protons + neutrons -> mass number (A)
     - protons - electrons -> charge
     - electrons -> shell structure & valence
   ============================================================ */

"use strict";

/* First 36 elements: enough to cover periods 1-4 and show shell
   filling through the d-block start. {symbol, name, mass(u)}.
   `mass` is the standard atomic weight, shown for reference next
   to the (integer) mass number the student builds. */
const ELEMENTS = [
  null, // index 0 unused so ELEMENTS[Z] works directly
  { s: "H",  n: "Hydrogen",   m: 1.008 },
  { s: "He", n: "Helium",     m: 4.003 },
  { s: "Li", n: "Lithium",    m: 6.94 },
  { s: "Be", n: "Beryllium",  m: 9.012 },
  { s: "B",  n: "Boron",      m: 10.81 },
  { s: "C",  n: "Carbon",     m: 12.011 },
  { s: "N",  n: "Nitrogen",   m: 14.007 },
  { s: "O",  n: "Oxygen",     m: 15.999 },
  { s: "F",  n: "Fluorine",   m: 18.998 },
  { s: "Ne", n: "Neon",       m: 20.180 },
  { s: "Na", n: "Sodium",     m: 22.990 },
  { s: "Mg", n: "Magnesium",  m: 24.305 },
  { s: "Al", n: "Aluminium",  m: 26.982 },
  { s: "Si", n: "Silicon",    m: 28.085 },
  { s: "P",  n: "Phosphorus", m: 30.974 },
  { s: "S",  n: "Sulfur",     m: 32.06 },
  { s: "Cl", n: "Chlorine",   m: 35.45 },
  { s: "Ar", n: "Argon",      m: 39.948 },
  { s: "K",  n: "Potassium",  m: 39.098 },
  { s: "Ca", n: "Calcium",    m: 40.078 },
  { s: "Sc", n: "Scandium",   m: 44.956 },
  { s: "Ti", n: "Titanium",   m: 47.867 },
  { s: "V",  n: "Vanadium",   m: 50.942 },
  { s: "Cr", n: "Chromium",   m: 51.996 },
  { s: "Mn", n: "Manganese",  m: 54.938 },
  { s: "Fe", n: "Iron",       m: 55.845 },
  { s: "Co", n: "Cobalt",     m: 58.933 },
  { s: "Ni", n: "Nickel",     m: 58.693 },
  { s: "Cu", n: "Copper",     m: 63.546 },
  { s: "Zn", n: "Zinc",       m: 65.38 },
  { s: "Ga", n: "Gallium",    m: 69.723 },
  { s: "Ge", n: "Germanium",  m: 72.630 },
  { s: "As", n: "Arsenic",    m: 74.922 },
  { s: "Se", n: "Selenium",   m: 78.971 },
  { s: "Br", n: "Bromine",    m: 79.904 },
  { s: "Kr", n: "Krypton",    m: 83.798 },
];
const MAX_Z = ELEMENTS.length - 1;

/* Simplified Bohr shell capacities. This "2, 8, 8, 18, 18, 32"
   filling scheme is the one taught for drawing Bohr diagrams and
   correctly reproduces the periodic structure for the first 20
   elements (where the intro curriculum lives). It intentionally
   differs from the pure 2n^2 rule for the third shell. */
const SHELL_CAP = [2, 8, 8, 18, 18, 32];

/* Particle rest masses, in unified atomic mass units (u),
   so the student can see why mass ~ protons + neutrons and why
   electrons barely matter. */
const M_PROTON   = 1.007276;
const M_NEUTRON  = 1.008665;
const M_ELECTRON = 0.000549;

/* Superscript / subscript digit helpers for isotope notation. */
const SUP = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
const SUB = { "0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉" };
const toSup = (n) => String(n).split("").map(d => SUP[d] || d).join("");
const toSub = (n) => String(n).split("").map(d => SUB[d] || d).join("");

/* ---------------- application state ---------------- */
const state = {
  p: 6,   // protons
  n: 6,   // neutrons
  e: 6,   // electrons
  challenge: null, // {z, a, charge, text} or null
};

/* ---------------- DOM refs ---------------- */
const $ = (id) => document.getElementById(id);
let canvas, ctx, dpr;

/* ---------------- derivations ---------------- */
function element() {
  return state.p >= 1 && state.p <= MAX_Z ? ELEMENTS[state.p] : null;
}

/* Distribute `count` electrons into shells using SHELL_CAP. */
function shells(count) {
  const out = [];
  let left = count;
  for (let i = 0; i < SHELL_CAP.length && left > 0; i++) {
    const here = Math.min(left, SHELL_CAP[i]);
    out.push(here);
    left -= here;
  }
  // any electrons beyond our capacity table go into one extra shell
  if (left > 0) out.push(left);
  return out;
}

function charge() { return state.p - state.e; }

/* ---------------- rendering: text panel ---------------- */
function renderInfo() {
  const el = element();
  const A = state.p + state.n;            // mass number
  const q = charge();
  const sh = shells(state.e);
  const valence = sh.length ? sh[sh.length - 1] : 0;
  const exactMass = (state.p * M_PROTON + state.n * M_NEUTRON + state.e * M_ELECTRON);

  // Element identity
  $("elName").textContent   = el ? el.n : (state.p === 0 ? "No nucleus" : "Beyond this model (Z > " + MAX_Z + ")");
  $("elSymbol").textContent = el ? el.s : "—";

  // Charge / ion status
  let ionWord, ionClass;
  if (q === 0)      { ionWord = "Neutral atom"; ionClass = "good"; }
  else if (q > 0)   { ionWord = "Cation (+" + q + ")"; ionClass = "warn"; }
  else              { ionWord = "Anion (" + q + ")"; ionClass = "warn"; }
  const chargeBadge = $("chargeBadge");
  chargeBadge.textContent = (q > 0 ? "+" + q : q) + " charge — " + ionWord;
  chargeBadge.className = "status " + ionClass;

  // Isotope notation:  A,Z superscript/subscript + symbol + charge
  let iso = "—";
  if (el) {
    const chargeStr = q === 0 ? "" : (Math.abs(q) === 1 ? (q > 0 ? "⁺" : "⁻")
                                      : toSup(Math.abs(q)) + (q > 0 ? "⁺" : "⁻"));
    iso = toSup(A) + toSub(state.p) + el.s + chargeStr;
  }
  $("isotope").textContent = iso;
  $("isotopeName").textContent = el ? el.n + "-" + A : "";

  // Numeric readouts
  $("readZ").textContent = state.p;
  $("readN").textContent = state.n;
  $("readE").textContent = state.e;
  $("readA").textContent = A;
  $("readCharge").textContent = q > 0 ? "+" + q : q;
  $("readValence").textContent = valence;
  $("readShells").textContent = sh.length ? sh.join(" · ") : "0";
  $("readMass").textContent = exactMass.toFixed(4) + " u";
  $("readMassApprox").textContent = "≈ " + A + " u (p+n)";
  $("readStdMass").textContent = el ? el.m + " u" : "—";

  // Plain-language notes that connect inputs -> consequences
  const notes = [];
  if (state.p === 0) {
    notes.push("With zero protons there is no element — protons define identity.");
  } else {
    notes.push("Protons (" + state.p + ") set the element: change them and you change the element itself.");
  }
  if (el && state.n !== state.p && state.p > 0) {
    notes.push("Neutrons ≠ protons → this is the isotope " + el.n + "-" + A + ".");
  }
  if (q !== 0) {
    notes.push("Electrons ≠ protons → net charge of " + (q > 0 ? "+" + q : q) +
               ", so it's an ion, not a neutral atom.");
  }
  if (valence === SHELL_CAP[sh.length - 1]) {
    notes.push("Outer shell is full (" + valence + " e⁻) → a stable, noble-gas-like arrangement.");
  } else if (q === 0 && el) {
    notes.push("Valence electrons (" + valence + ") in the outer shell drive how this atom bonds.");
  }
  $("notes").innerHTML = notes.map(t => "<li>" + t + "</li>").join("");

  // Challenge checking
  renderChallengeStatus(A, q);
}

function renderChallengeStatus(A, q) {
  const box = $("challengeStatus");
  if (!state.challenge) { box.textContent = ""; box.className = "status"; return; }
  const c = state.challenge;
  const ok = state.p === c.z && A === c.a && q === c.charge;
  if (ok) {
    box.textContent = "✓ Solved! " + c.text;
    box.className = "status good";
  } else {
    box.textContent = "Target: " + c.text + " — keep adjusting.";
    box.className = "status";
  }
}

/* ---------------- rendering: canvas ---------------- */
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* Deterministic jitter so nucleus packing looks organic but stable. */
function nucleusLayout(total) {
  const pts = [];
  let placed = 0, ring = 0;
  while (placed < total) {
    const inThisRing = ring === 0 ? 1 : Math.floor(ring * 6);
    const r = ring * 9;
    for (let i = 0; i < inThisRing && placed < total; i++) {
      const ang = (i / inThisRing) * Math.PI * 2 + ring * 0.7;
      pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
      placed++;
    }
    ring++;
  }
  return pts;
}

let nucleusOrder = []; // shuffled p/n assignment, recomputed on count change
function rebuildNucleusOrder() {
  const total = state.p + state.n;
  nucleusOrder = [];
  for (let i = 0; i < total; i++) nucleusOrder.push(i < state.p ? "p" : "n");
  // interleave deterministically so protons & neutrons mix visually
  nucleusOrder.sort((a, b) => ((a.charCodeAt(0) * 7) % 5) - ((b.charCodeAt(0) * 7) % 5));
}

function draw(tMs) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const cx = w / 2, cy = h / 2;
  ctx.clearRect(0, 0, w, h);

  // --- electron shells (rings) ---
  const sh = shells(state.e);
  const baseR = Math.min(w, h) * 0.13;
  const ringGap = (Math.min(w, h) * 0.5 - baseR) / Math.max(sh.length, 1);

  for (let i = 0; i < sh.length; i++) {
    const r = baseR + ringGap * (i + 1);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(74,214,255,0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // electrons on this shell, orbiting (outer shells slower)
    const count = sh[i];
    const speed = 0.0004 / (i + 1);
    for (let k = 0; k < count; k++) {
      const ang = (k / count) * Math.PI * 2 + tMs * speed + i;
      const ex = cx + Math.cos(ang) * r;
      const ey = cy + Math.sin(ang) * r;
      ctx.beginPath();
      ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#4ad6ff";
      ctx.shadowColor = "#4ad6ff";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // --- nucleus ---
  const layout = nucleusLayout(state.p + state.n);
  // gentle breathing wobble
  const wob = Math.sin(tMs * 0.002) * 1.5;
  for (let i = 0; i < layout.length; i++) {
    const kind = nucleusOrder[i] || (i < state.p ? "p" : "n");
    const px = cx + layout[i].x + Math.sin(i + tMs * 0.001) * wob;
    const py = cy + layout[i].y + Math.cos(i + tMs * 0.001) * wob;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = kind === "p" ? "#ff5d6c" : "#9aa3c7";
    ctx.fill();
  }

  // center label (element symbol) if nucleus empty
  if (state.p + state.n === 0) {
    ctx.fillStyle = "rgba(170,178,213,0.7)";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("empty nucleus", cx, cy);
  }

  requestAnimationFrame(draw);
}

/* ---------------- mutations ---------------- */
function set(part, value) {
  value = Math.max(0, Math.min(value, part === "p" ? MAX_Z : 200));
  state[part] = value;
  if (part === "p" || part === "n") rebuildNucleusOrder();
  syncControls();
  renderInfo();
}
function bump(part, delta) { set(part, state[part] + delta); }

function syncControls() {
  $("pNum").value = state.p; $("pRange").value = state.p;
  $("nNum").value = state.n; $("nRange").value = state.n;
  $("eNum").value = state.e; $("eRange").value = state.e;
}

/* Load a neutral atom of element Z (electrons = protons, neutrons
   chosen to match the nearest whole standard atomic weight). */
function loadElement(z) {
  const el = ELEMENTS[z];
  const a = Math.round(el.m);
  state.p = z;
  state.e = z;
  state.n = Math.max(0, a - z);
  rebuildNucleusOrder();
  syncControls();
  renderInfo();
}

/* ---------------- challenge mode ---------------- */
const CHALLENGES = [
  () => { const z = 6,  a = 14, c = 0;  return { z, a, charge: c, text: "Carbon-14, neutral (a radioactive isotope)" }; },
  () => { const z = 11, a = 23, c = 1;  return { z, a, charge: c, text: "a sodium ion Na⁺ (lost 1 electron)" }; },
  () => { const z = 17, a = 35, c = -1; return { z, a, charge: c, text: "a chloride ion Cl⁻ (gained 1 electron)" }; },
  () => { const z = 8,  a = 16, c = -2; return { z, a, charge: c, text: "an oxide ion O²⁻" }; },
  () => { const z = 2,  a = 4,  c = 0;  return { z, a, charge: c, text: "a neutral helium atom (full outer shell)" }; },
  () => { const z = 26, a = 56, c = 3;  return { z, a, charge: c, text: "an iron(III) ion Fe³⁺" }; },
  () => { const z = 1,  a = 2,  c = 0;  return { z, a, charge: c, text: "deuterium (heavy hydrogen, ²H)" }; },
];
function newChallenge() {
  const make = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  state.challenge = make();
  $("challengePrompt").textContent = "Build: " + state.challenge.text;
  $("challengePrompt").style.display = "block";
  renderInfo();
}
function clearChallenge() {
  state.challenge = null;
  $("challengePrompt").style.display = "none";
  renderInfo();
}

/* ---------------- wiring ---------------- */
function wire() {
  // +/- buttons and ranges/numbers for each particle
  for (const part of ["p", "n", "e"]) {
    $(part + "Plus").addEventListener("click", () => bump(part, +1));
    $(part + "Minus").addEventListener("click", () => bump(part, -1));
    $(part + "Range").addEventListener("input", (e) => set(part, +e.target.value));
    $(part + "Num").addEventListener("input", (e) => set(part, +e.target.value || 0));
  }
  // quick actions
  $("makeNeutral").addEventListener("click", () => { set("e", state.p); });
  $("resetBtn").addEventListener("click", () => { state.p = 6; state.n = 6; state.e = 6; rebuildNucleusOrder(); syncControls(); renderInfo(); });

  // preset element dropdown
  const sel = $("preset");
  for (let z = 1; z <= MAX_Z; z++) {
    const o = document.createElement("option");
    o.value = z; o.textContent = z + " — " + ELEMENTS[z].n + " (" + ELEMENTS[z].s + ")";
    sel.appendChild(o);
  }
  sel.value = 6;
  sel.addEventListener("change", (e) => loadElement(+e.target.value));

  // challenges
  $("newChallenge").addEventListener("click", newChallenge);
  $("clearChallenge").addEventListener("click", clearChallenge);

  window.addEventListener("resize", resizeCanvas);
}

/* ---------------- boot ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  canvas = $("stage");
  ctx = canvas.getContext("2d");
  resizeCanvas();
  rebuildNucleusOrder();
  wire();
  syncControls();
  renderInfo();
  requestAnimationFrame(draw);
});
