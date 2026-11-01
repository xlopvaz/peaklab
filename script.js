/* PeakLab: herramientas de química analítica que funcionan en el navegador.
   Cálculo 100 % local. Editor de moléculas: Kekule.js (MIT), cargado bajo demanda. */
"use strict";

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (id) => document.getElementById(id);

const store = {
  get(k, d) { try { const v = localStorage.getItem("peaklab:" + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("peaklab:" + k, v); } catch (e) { /* sin almacenamiento */ } },
};

/* ---------- Idioma ---------- */
let LANG = store.get("lang", "") || "en"; // inglés por defecto
const L = (es, en) => (LANG === "en" ? en : es);
const DEC = () => (LANG === "en" ? "." : ",");

// Acepta "0,5", "0.5", "1.234,5", "1e-3"
function parseNum(s) {
  if (s === null || s === undefined) return NaN;
  let t = String(s).trim().replace(/\s/g, "");
  if (!t) return NaN;
  if (t.includes(",") && t.includes(".")) {
    if (t.lastIndexOf(",") > t.lastIndexOf(".")) t = t.replace(/\./g, "").replace(",", ".");
    else t = t.replace(/,/g, "");
  } else {
    t = t.replace(",", ".");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

// Separa una línea en tokens (tabulador, punto y coma, espacios; CSV con punto decimal)
function splitLine(line) {
  let parts = line.trim().split(/\t|;/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) parts = parts[0].split(/\s+/).filter(Boolean);
  if (parts.length === 1 && parts[0].includes(".") && parts[0].includes(",")) parts = parts[0].split(",");
  return parts;
}

function fmt(x, sig = 4) {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const ax = Math.abs(x);
  if (ax >= 1e6 || ax < 1e-4) {
    const [m, e] = x.toExponential(sig - 1).split("e");
    return m.replace(".", DEC()) + "·10" + supNum(e);
  }
  const d = Math.max(0, sig - 1 - Math.floor(Math.log10(ax)));
  return x.toFixed(Math.min(d, 10)).replace(".", DEC());
}
function fmtFix(x, d) { return Number.isFinite(x) ? x.toFixed(d).replace(".", DEC()) : "—"; }
function fmtMz(x, d = 4) { return Number.isFinite(x) ? x.toFixed(d) : "—"; }
function supNum(e) {
  const map = { "-": "⁻", "+": "", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  return String(Number(e)).split("").map((c) => map[c] ?? c).join("");
}
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

// t de Student bilateral al 95 %
function t95(df) {
  const tab = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042 };
  if (df < 1) return NaN;
  if (tab[df]) return tab[df];
  if (df <= 40) return 2.042 - (df - 30) * (2.042 - 2.021) / 10;
  if (df <= 60) return 2.021 - (df - 40) * (2.021 - 2.000) / 20;
  if (df <= 120) return 2.000 - (df - 60) * (2.000 - 1.980) / 60;
  return 1.960;
}

/* =========================================================
   Textos de la página en inglés (el español está en el HTML)
   ========================================================= */
const EN = {
  "nav.aria": "Tools", "nav.cal": "Calibration and validation", "nav.mass": "Masses and spectra", "nav.draw": "Draw · GC or LC?", "nav.bg": "Background ions",
  theme: "Toggle theme",
  "home.h1": "Tools for the <span>chromatography</span> lab.",
  "home.lead": "Compound data before you inject, method development and transfer, injection sequences, calibration and validation, troubleshooting and working reference data. Everything runs in your browser.",
  "nav.open": "Menu", "nav.gCompound": "Compound", "nav.gMethod": "Method", "nav.gResults": "Results", "nav.gRef": "Reference",
  "nav.compound": "Compound data", "nav.compoundD": "Properties, pKa and logD, retention indices, hazards",
  "nav.drawD": "Structure editor and recommended technique", "nav.massD": "Adducts, isotope pattern, ppm error",
  "nav.chromD": "HPLC and GC: retention, resolution, pressure", "nav.methodsD": "HPLC → UHPLC and GC flows",
  "nav.seq": "Injection sequence", "nav.seqD": "Standards, blanks, QCs and samples; CSV export",
  "nav.greenD": "AGREEprep and BAGI with pictograms", "nav.calD": "Curve, LOD/LOQ, recovery, matrix effect",
  "nav.bgD": "Common contaminants by m/z", "nav.trouble": "Troubleshooting", "nav.troubleD": "Causes and fixes in GC, LC and MS",
  "nav.deriv": "Derivatization", "nav.derivD": "Reagents, conditions and derivative mass",
  "nav.cols": "Columns", "nav.colsD": "GC equivalents and USP codes",
  "nav.solv": "Solvents and buffers", "nav.solvD": "Properties, buffers and vapour volume",
  "home.c1t": "Calibration and validation",
  "home.c1p": "Paste concentrations and areas from Excel. Weighted or unweighted regression, residuals, LOD/LOQ, sample concentrations with confidence intervals, matrix effect, recovery and ion ratios.",
  "home.c2t": "Masses and spectra",
  "home.c2p": "Monoisotopic mass, ESI and EI adducts, ppm error and the isotope spectrum simulated at your instrument's resolution, from a quadrupole to an Orbitrap.",
  "home.c3t": "Draw molecules",
  "home.c3p": "ChemDraw-style structure editor. Draw, or fetch from PubChem by name, CAS or SMILES, and send the formula to the mass calculator in one click.",
  "home.c5t": "Chromatogram simulator",
  "home.c5p": "HPLC and GC: move the gradient, temperature ramp or column and see how retention times, resolution and pressure change.",
  "home.c4t": "Background ions",
  "home.c4p": "A peak that shows up in every blank? Look up its m/z among phthalates, siloxanes, column bleed, plastic additives and other usual suspects.",
  "home.soon": "Coming soon",
  "home.soonList": "<li><b>GC or LC?</b> from the drawn structure</li><li><b>Green metrics</b>: AGREEprep and BAGI</li>",
  "cal.h1": "Calibration and validation",
  "cal.intro": "One line per standard: concentration and response (area, or analyte/internal standard ratio). You can paste two columns straight from Excel; comma or point decimals both work.",
  "cal.unit": "Standard units", "cal.weight": "Weighting", "cal.w0": "Unweighted",
  "cal.stds": "Standards", "cal.stdsHint": "concentration · response", "cal.example": "Load example", "cal.clear": "Clear",
  "cal.chart1": "Calibration curve", "cal.chart2": "Relative error of each standard (back-calculated concentration)",
  "smp.h": "Samples", "smp.intro": "One sample per line: name (optional) and response. If you preconcentrated or diluted, enter the volumes to get the concentration in the original sample.",
  "smp.label": "Samples", "smp.hint": "name · response", "smp.vs": "Sample volume (or mass)", "smp.vf": "Final extract volume",
  "smp.dil": "Extra dilution of the extract", "smp.rep": "Replicates per sample (for the CI)",
  "smp.factor": "Applied factor = (V<sub>extract</sub> / V<sub>sample</sub>) × dilution, in the same volume units.",
  "val.h": "Validation parameters", "me.h": "Matrix effect", "me.p": "Compares the slope of the matrix-matched curve with the solvent curve.",
  "me.solv": "Slope in solvent", "me.solvHint": "filled in from your curve", "me.mat": "Slope in matrix",
  "rec.h": "Recovery", "rec.p": "Spiked sample against the amount added. Several replicates separated by spaces or lines.",
  "rec.add": "Concentration added", "rec.blank": "Measured in the unspiked sample", "rec.reps": "Measured in the spiked samples", "rec.repsHint": "replicates",
  "ir.h": "Ion ratio (MRM)", "ir.p": "Area of the qualifier transition divided by the quantifier.",
  "ir.sq": "Standard: quant.", "ir.sc": "Standard: qual.", "ir.mq": "Sample: quant.", "ir.mc": "Sample: qual.", "ir.tol": "Relative tolerance",
  "ms.h1": "Masses and spectra",
  "ms.intro": "Molecular formula of the neutral species, brackets allowed: <code>C15H12N2O</code>, <code>C24H38O4</code>, <code>Ca(OH)2</code>. Use <code>D</code> for deuterium in labelled internal standards (<code>C15H2D10N2O</code>). You can also draw the molecule in the <a href=\"#dibujar\">Draw</a> tab.",
  "ms.formula": "Formula", "ms.adducts": "Adducts", "ms.adHint": "Click an adduct to see its spectrum and compute the ppm error.",
  "ms.spec": "Simulated spectrum", "ms.res": "Instrument resolution", "ms.r0": "Sticks (no profile)",
  "ms.r1": "≈ 0.7 Da FWHM · quadrupole / QqQ", "ms.r2": "R = 20,000 · Q-TOF", "ms.r3": "R = 70,000 · Orbitrap",
  "ms.r4": "R = 240,000 · high-resolution Orbitrap", "ms.r5": "R = 1,000,000 · FT-ICR", "ms.meas": "Measured m/z",
  "dr.h1": "Draw molecules",
  "dr.intro": "Draw with the tools on the left (bonds, atoms, rings, charges) or type a name to get the structure. Formula, mass and name update as you draw.",
  "dr.search": "Name → structure", "dr.searchHint": "English name, CAS number or SMILES (PubChem)", "dr.load": "Load",
  "dr.loading": "Loading the editor…", "dr.struct": "Structure", "dr.toMass": "See adducts and spectrum →",
  "dr.copySmi": "Copy SMILES", "dr.png": "Download image (PNG)", "dr.clear": "Clear all",
  "dr.tip": "Tip: with the bond tool, click on the canvas to start and again on an atom to extend the chain. Use the “C” tool to change an atom's element.",
  "bg.h1": "Background ions and contaminants",
  "bg.intro": "Type the m/z of a suspicious peak. Masses are computed from each ion's formula, so you can search at high-resolution or nominal precision.",
  "bg.q": "m/z or text", "bg.ph": "445.12, phthalate, siloxane…", "bg.tol": "Tolerance", "bg.nominal": "0.5 Da (nominal)", "bg.tech": "Technique", "bg.all": "All",
  "foot.1": "PeakLab computes everything in your browser; nothing is stored or sent outside your computer, except the structures you draw or search, which are looked up in PubChem to get their name. Results are a guide: always check the criteria of the guideline that applies to your method.",
  "foot.2": "Made by Xoel López Vázquez", "foot.3": "source on GitHub", "foot.4": "Molecule editor: <a href=\"https://partridgejiang.github.io/Kekule.js/\">Kekule.js</a> (MIT)",
};

function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
    const k = el.dataset.i18n;
    el.innerHTML = LANG === "en" && EN[k] ? EN[k] : el.dataset.es;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    if (el.dataset.esPh === undefined) el.dataset.esPh = el.placeholder;
    el.placeholder = LANG === "en" ? EN[el.dataset.i18nPh] : el.dataset.esPh;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    if (el.dataset.esAria === undefined) el.dataset.esAria = el.getAttribute("aria-label");
    el.setAttribute("aria-label", LANG === "en" ? EN[el.dataset.i18nAria] : el.dataset.esAria);
  });
  $("langBtn").textContent = LANG === "en" ? "ES" : "EN";
  document.title = L("PeakLab · herramientas para cromatografía", "PeakLab · chromatography tools");
}

/* =========================================================
   Tema y navegación
   ========================================================= */
(function theme() {
  const saved = store.get("theme", "");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  $("themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store.set("theme", next);
  });
})();

const VIEWS = ["inicio", "calibrado", "masas", "dibujar", "fondo"];
let CURRENT = "inicio";
function route() {
  let id = location.hash.replace("#", "") || "inicio";
  if (!VIEWS.includes(id)) id = "inicio";
  CURRENT = id;
  VIEWS.forEach((v) => { $(v).hidden = v !== id; });
  document.querySelectorAll(".menu a[data-tab]").forEach((a) => a.classList.toggle("active", a.dataset.tab === id));
  document.querySelectorAll(".mgroup").forEach((g) => g.classList.toggle("active", !!g.querySelector(`a[data-tab="${id}"]`)));
  closeMenus();
  window.scrollTo(0, 0);
  if (id === "dibujar") initDraw();
}
window.addEventListener("hashchange", route);

/* ---------- Menús desplegables ---------- */
function closeMenus() {
  document.querySelectorAll(".mgroup.open").forEach((g) => { g.classList.remove("open"); g.querySelector(".mbtn").setAttribute("aria-expanded", "false"); });
  const m = document.getElementById("menu");
  if (m && m.classList.contains("open")) { m.classList.remove("open"); document.getElementById("menuBtn").setAttribute("aria-expanded", "false"); }
}
document.querySelectorAll(".mgroup .mbtn").forEach((b) => b.addEventListener("click", (e) => {
  e.stopPropagation();
  const g = b.parentElement, was = g.classList.contains("open");
  if (!document.getElementById("menu").classList.contains("open")) document.querySelectorAll(".mgroup.open").forEach((x) => x.classList.remove("open"));
  g.classList.toggle("open", !was);
  b.setAttribute("aria-expanded", String(!was));
}));
document.getElementById("menuBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const m = document.getElementById("menu"), open = !m.classList.contains("open");
  m.classList.toggle("open", open);
  document.getElementById("menuBtn").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (e) => { if (!e.target.closest(".menu") && !e.target.closest("#menuBtn")) closeMenus(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenus(); });
document.querySelectorAll(".menu a").forEach((a) => a.addEventListener("click", () => closeMenus()));

(function heroTrace() {
  const peaks = [[70, 18, 5], [140, 60, 4], [205, 30, 6], [300, 120, 5], [330, 45, 4], [430, 85, 7], [520, 25, 5], [600, 135, 6], [690, 50, 8], [745, 20, 6]];
  let d = "", seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; };
  for (let x = 0; x <= 800; x += 2) {
    let y = 150 + rnd() * 1.6;
    for (const [c, h, w] of peaks) y -= h * Math.exp(-((x - c) ** 2) / (2 * w * w));
    d += (x ? "L" : "M") + x + " " + y.toFixed(1);
  }
  $("heroPath").setAttribute("d", d);
})();

/* =========================================================
   Gráficos SVG mínimos
   ========================================================= */
function niceTicks(min, max, n = 5) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const r = step0 / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step * 1e-9; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { lo, hi, ticks, step };
}
function tickLabel(v, step, dec = DEC()) {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return v.toFixed(Math.min(d, 6)).replace(".", dec);
}

function plotXY(el, cfg) {
  const W = 520, H = 300, m = { l: 58, r: 14, t: 12, b: 44 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const xt = niceTicks(cfg.xMin, cfg.xMax), yt = niceTicks(cfg.yMin, cfg.yMax);
  const X = (v) => m.l + (v - xt.lo) / (xt.hi - xt.lo) * pw;
  const Y = (v) => m.t + ph - (v - yt.lo) / (yt.hi - yt.lo) * ph;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.aria || "")}">`;
  for (const v of yt.ticks) s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 7}" y="${Y(v) + 4}" text-anchor="end">${tickLabel(v, yt.step)}</text>`;
  for (const v of xt.ticks) s += `<text class="tick" x="${X(v)}" y="${H - m.b + 17}" text-anchor="middle">${tickLabel(v, xt.step)}</text>`;
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"/><line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${m.t + ph}"/>`;
  if (cfg.lines) for (const Ln of cfg.lines) {
    const x1 = Math.max(Ln.x1, xt.lo), x2 = Math.min(Ln.x2, xt.hi);
    s += `<line class="${Ln.cls}" x1="${X(x1)}" x2="${X(x2)}" y1="${Y(Ln.f(x1))}" y2="${Y(Ln.f(x2))}"/>`;
  }
  if (cfg.points) for (const p of cfg.points) s += `<circle class="pt ${p.cls || ""}" cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r || 5}"><title>${esc(p.title || "")}</title></circle>`;
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(cfg.xLabel)}</text>`;
  s += `<text class="lab" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(cfg.yLabel)}</text>`;
  el.innerHTML = s + "</svg>";
}

function plotResiduals(el, items, tol) {
  const W = 520, H = 300, m = { l: 50, r: 14, t: 12, b: 44 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const maxAbs = Math.max(tol * 1.5, ...items.map((i) => Math.abs(i.err))) * 1.1;
  const yt = niceTicks(-maxAbs, maxAbs, 6);
  const Y = (v) => m.t + ph - (v - yt.lo) / (yt.hi - yt.lo) * ph;
  const n = items.length, X = (i) => m.l + (i + 0.5) * pw / n;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L("Error relativo de cada patrón", "Relative error of each standard"))}">`;
  s += `<rect class="band" x="${m.l}" width="${pw}" y="${Y(tol)}" height="${Y(-tol) - Y(tol)}"/>`;
  for (const v of yt.ticks) s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 7}" y="${Y(v) + 4}" text-anchor="end">${tickLabel(v, yt.step)}</text>`;
  s += `<line class="zero" x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  s += `<line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${m.t + ph}"/>`;
  items.forEach((it, i) => {
    s += `<line x1="${X(i)}" x2="${X(i)}" y1="${Y(0)}" y2="${Y(it.err)}" style="stroke:var(--line-2)"/>`;
    s += `<circle class="pt ${Math.abs(it.err) > tol ? "out" : ""}" cx="${X(i)}" cy="${Y(it.err)}" r="5"><title>${esc(fmt(it.x) + ": " + fmtFix(it.err, 1) + " %")}</title></circle>`;
    if (n <= 14 || i % Math.ceil(n / 14) === 0) s += `<text class="tick" x="${X(i)}" y="${H - m.b + 17}" text-anchor="middle">${esc(fmt(it.x, 3))}</text>`;
  });
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(L("Concentración del patrón", "Standard concentration"))}</text>`;
  s += `<text class="lab" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(L("Error (%)", "Error (%)"))}</text>`;
  el.innerHTML = s + "</svg>";
}

function emptyChart(el, msg) {
  el.innerHTML = `<svg viewBox="0 0 520 300"><text class="empty" x="260" y="150" text-anchor="middle">${esc(msg)}</text></svg>`;
}

/* =========================================================
   CALIBRADO
   ========================================================= */
const CAL_EXAMPLE = () => [[0.5, 0.0291], [1, 0.0547], [2, 0.1088], [5, 0.2632], [10, 0.5195], [20, 1.0476], [50, 2.6031]]
  .map(([x, y]) => `${String(x).replace(".", DEC())}\t${String(y).replace(".", DEC())}`).join("\n");
const SMP_EXAMPLE = () => [[L("Río, punto 1", "River, site 1"), "0.264"], [L("Río, punto 2", "River, site 2"), "0.081"], [L("EDAR efluente", "WWTP effluent"), "1.912"], [L("Blanco", "Blank"), "0.0012"]]
  .map(([n, y]) => `${n}\t${y.replace(".", DEC())}`).join("\n");

function parsePairs(text) {
  const pts = [], bad = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || /^[#/]/.test(line.trim())) return;
    const p = splitLine(line).map(parseNum);
    if (p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])) pts.push({ x: p[0], y: p[1], line: i + 1 });
    else if (!/[a-z]/i.test(line) || p.some(Number.isFinite)) bad.push(i + 1);
  });
  return { pts, bad };
}

function regress(pts, mode) {
  const n = pts.length;
  if (n < 2) return null;
  let w = pts.map((p) => mode === "x" ? 1 / p.x : mode === "x2" ? 1 / (p.x * p.x) : 1);
  const sw0 = w.reduce((a, b) => a + b, 0);
  w = w.map((v) => v * n / sw0);
  let Sw = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
  pts.forEach((p, i) => { Sw += w[i]; Sx += w[i] * p.x; Sy += w[i] * p.y; Sxx += w[i] * p.x * p.x; Sxy += w[i] * p.x * p.y; });
  const D = Sw * Sxx - Sx * Sx;
  if (Math.abs(D) < 1e-300) return null;
  const b = (Sw * Sxy - Sx * Sy) / D;
  const a = (Sy - b * Sx) / Sw;
  const ym = Sy / Sw;
  let ssr = 0, sst = 0;
  pts.forEach((p, i) => { ssr += w[i] * (p.y - (a + b * p.x)) ** 2; sst += w[i] * (p.y - ym) ** 2; });
  const df = n - 2;
  const s = df > 0 ? Math.sqrt(ssr / df) : NaN;
  const xm = pts.reduce((acc, p) => acc + p.x, 0) / n;
  const SxxC = pts.reduce((acc, p) => acc + (p.x - xm) ** 2, 0);
  return {
    n, a, b, r2: sst > 0 ? 1 - ssr / sst : NaN, s, df,
    sb: s * Math.sqrt(Sw / D), sa: s * Math.sqrt(Sxx / D),
    xm, ym: pts.reduce((acc, p) => acc + p.y, 0) / n, SxxC,
  };
}

let CAL = null;

function updateCal() {
  const { pts: raw, bad } = parsePairs($("calData").value);
  const mode = $("calWeight").value;
  const notes = [];
  let pts = raw;
  if (mode !== "none") {
    const nz = raw.filter((p) => p.x <= 0);
    if (nz.length) notes.push(["warn", L(`Con ponderación se ignoran los patrones de concentración 0 o negativa (${nz.length}).`, `With weighting, standards at zero or negative concentration are ignored (${nz.length}).`)]);
    pts = raw.filter((p) => p.x > 0);
  }
  if (bad.length) notes.push(["warn", L(`No se han podido leer las líneas ${bad.join(", ")}.`, `Could not read lines ${bad.join(", ")}.`)]);

  const fit = regress(pts, mode);
  const fitU = mode === "none" ? fit : regress(pts, "none");
  CAL = null;

  if (!fit || pts.length < 3) {
    $("calStats").innerHTML = `<div class="stat wide"><div class="k">${L("Recta", "Curve")}</div><div class="v">${L("Introduce al menos 3 patrones", "Enter at least 3 standards")}</div></div>`;
    emptyChart($("calChart"), L("Faltan patrones", "Not enough standards"));
    emptyChart($("resChart"), L("Faltan patrones", "Not enough standards"));
    $("calWarn").innerHTML = notes.map(([c, t]) => `<div class="note ${c}">${esc(t)}</div>`).join("");
    updateSamples();
    return;
  }

  const lod = 3.3 * fitU.s / fitU.b, loq = 10 * fitU.s / fitU.b;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const yMin = Math.min(...ys), yMax = Math.max(...ys), xMin = Math.min(...xs), xMax = Math.max(...xs);
  const resid = pts.filter((p) => p.x !== 0).map((p) => ({ x: p.x, err: ((p.y - fit.a) / fit.b - p.x) / p.x * 100 }));
  CAL = { fit, fitU, lod, loq, yMin, yMax, xMin, xMax, mode, unit: Number($("calUnit").value), unitTxt: $("calUnit").selectedOptions[0].textContent.split(" ")[0] };

  const sign = fit.a < 0 ? "−" : "+";
  const t = t95(fit.df);
  const wTxt = mode !== "none" ? L(" (ponderada ", " (weighted ") + (mode === "x" ? "1/x" : "1/x²") + ")" : "";
  $("calStats").innerHTML = `
    <div class="stat wide eq"><div class="k">${L("Recta", "Curve")}${wTxt}</div>
      <div class="v">y = ${fmt(fit.b, 5)}·x ${sign} ${fmt(Math.abs(fit.a), 4)}</div></div>
    <div class="stat"><div class="k">R²</div><div class="v">${fmtFix(fit.r2, 5)}</div><div class="s">r = ${fmtFix(Math.sqrt(Math.max(fit.r2, 0)), 5)}</div></div>
    <div class="stat"><div class="k">${L("Patrones", "Standards")}</div><div class="v">${fit.n}</div><div class="s">${fmt(xMin, 3)} – ${fmt(xMax, 3)} ${esc(CAL.unitTxt)}</div></div>
    <div class="stat"><div class="k">${L("Pendiente ± IC 95 %", "Slope ± 95 % CI")}</div><div class="v">${fmt(fit.b, 4)}</div><div class="s">± ${fmt(t * fit.sb, 2)}</div></div>
    <div class="stat"><div class="k">${L("Ordenada ± IC 95 %", "Intercept ± 95 % CI")}</div><div class="v">${fmt(fit.a, 3)}</div><div class="s">± ${fmt(t * fit.sa, 2)}</div></div>
    <div class="stat"><div class="k">LOD (3${DEC()}3·s<sub>y/x</sub>/b)</div><div class="v">${fmt(lod, 3)}</div><div class="s">${esc(CAL.unitTxt)}</div></div>
    <div class="stat"><div class="k">LOQ (10·s<sub>y/x</sub>/b)</div><div class="v">${fmt(loq, 3)}</div><div class="s">${esc(CAL.unitTxt)}</div></div>
    <div class="stat wide"><div class="k">${L("Desviación estándar residual", "Residual standard deviation")} (s<sub>y/x</sub>)</div><div class="v">${fmt(fit.s, 3)}</div></div>`;

  const ciA = t * fit.sa;
  if (Math.abs(fit.a) <= ciA) notes.push(["good", L("La ordenada en el origen no es significativamente distinta de 0 (su IC 95 % incluye el cero).", "The intercept is not significantly different from 0 (its 95 % CI includes zero).")]);
  else notes.push(["", L("La ordenada en el origen es significativamente distinta de 0: revisa el blanco o posibles interferencias.", "The intercept is significantly different from 0: check the blank or possible interferences.")]);
  const outs = resid.filter((r) => Math.abs(r.err) > 20);
  if (outs.length) notes.push(["warn", L(`${outs.length} patrón(es) con error recalculado mayor de ±20 %: ${outs.map((o) => fmt(o.x, 3)).join(", ")}. Si los errores grandes se concentran en los patrones bajos, prueba la ponderación 1/x o 1/x².`,
    `${outs.length} standard(s) back-calculate outside ±20 %: ${outs.map((o) => fmt(o.x, 3)).join(", ")}. If the large errors are at the low end, try 1/x or 1/x² weighting.`)]);
  else notes.push(["good", L("Todos los patrones se recalculan dentro de ±20 %.", "All standards back-calculate within ±20 %.")]);
  if (fit.r2 < 0.99) notes.push(["warn", L("R² < 0,99. Ojo: el R² por sí solo no demuestra linealidad; mira el gráfico de residuales.", "R² < 0.99. Note that R² alone does not prove linearity; check the residual plot.")]);
  if (lod > xMin) notes.push(["warn", L("El LOD estimado queda por encima del patrón más bajo: el primer patrón no aporta información fiable.", "The estimated LOD is above the lowest standard: that standard is not reliable.")]);
  notes.push(["", L("LOD y LOQ se calculan con la recta sin ponderar (método de la desviación residual, ICH Q2). Confírmalos con patrones a esas concentraciones.", "LOD and LOQ use the unweighted curve (residual standard deviation approach, ICH Q2). Confirm them with standards at those levels.")]);
  $("calWarn").innerHTML = notes.map(([c, tx]) => `<div class="note ${c}">${esc(tx)}</div>`).join("");

  plotXY($("calChart"), {
    xMin: Math.min(0, xMin), xMax, yMin: Math.min(0, yMin, fit.a), yMax,
    xLabel: `${L("Concentración", "Concentration")} (${CAL.unitTxt})`, yLabel: L("Respuesta", "Response"), aria: L("Recta de calibrado", "Calibration curve"),
    lines: [{ cls: "fit", x1: Math.min(0, xMin), x2: xMax, f: (x) => fit.a + fit.b * x }],
    points: pts.map((p) => ({ x: p.x, y: p.y, cls: p.x && Math.abs(((p.y - fit.a) / fit.b - p.x) / p.x * 100) > 20 ? "out" : "", title: `${fmt(p.x)} → ${fmt(p.y)}` })),
  });
  if (resid.length) plotResiduals($("resChart"), resid, 20); else emptyChart($("resChart"), L("Sin patrones distintos de 0", "No non-zero standards"));

  if (!$("meSolv").dataset.touched) $("meSolv").value = fmt(fit.b, 5);
  updateSamples();
  updateME();
}

function bestUnit(gPerL) {
  const units = [[1, "g/L"], [1e-3, "mg/L"], [1e-6, "µg/L"], [1e-9, "ng/L"], [1e-12, "pg/L"]];
  for (const [f, u] of units) if (Math.abs(gPerL) >= f) return [gPerL / f, u, f];
  return [gPerL / 1e-12, "pg/L", 1e-12];
}

function updateSamples() {
  const tbl = $("smpTable");
  const lines = $("smpData").value.split(/\r?\n/).filter((l) => l.trim());
  if (!CAL || !lines.length) { tbl.innerHTML = ""; return; }
  const vs = parseNum($("smpVs").value), vf = parseNum($("smpVf").value);
  const dil = parseNum($("smpDil").value) || 1;
  const m = Math.max(1, Math.round(parseNum($("smpRep").value) || 1));
  const factor = (Number.isFinite(vs) && Number.isFinite(vf) && vs > 0 && vf > 0 ? vf / vs : 1) * dil;
  const { fit, fitU } = CAL;
  const t = t95(fitU.df);
  let html = `<thead><tr><th>${L("Muestra", "Sample")}</th><th class="num">${L("Respuesta", "Response")}</th><th class="num">${L("En el extracto", "In the extract")} (${esc(CAL.unitTxt)})</th><th class="num">${L("En la muestra", "In the sample")}</th><th>${L("Estado", "Status")}</th></tr></thead><tbody>`;
  for (const line of lines) {
    const parts = splitLine(line);
    const y = parseNum(parts[parts.length - 1]);
    const name = parts.length > 1 ? parts.slice(0, -1).join(" ") : "—";
    if (!Number.isFinite(y)) { html += `<tr><td>${esc(line)}</td><td colspan="4" class="sub">${L("No se encuentra la respuesta", "No response found")}</td></tr>`; continue; }
    const x = (y - fit.a) / fit.b;
    let ci = NaN;
    if (CAL.mode === "none") {
      const sx0 = (fitU.s / fitU.b) * Math.sqrt(1 / m + 1 / fitU.n + (y - fitU.ym) ** 2 / (fitU.b ** 2 * fitU.SxxC));
      ci = t * sx0;
    }
    const [vFinal, uFinal, f] = bestUnit(x * factor * CAL.unit);
    const ciFinal = ci * factor * CAL.unit / f;
    const tags = [];
    if (x < CAL.lod) tags.push(`<span class="pill bad">&lt; LOD</span>`);
    else if (x < CAL.loq) tags.push(`<span class="pill warn">&lt; LOQ</span>`);
    if (y > CAL.yMax * 1.0001) tags.push(`<span class="pill warn">${L("Por encima del rango: diluye", "Above range: dilute")}</span>`);
    else if (y < CAL.yMin && x >= CAL.lod) tags.push(`<span class="pill warn">${L("Por debajo del patrón más bajo", "Below the lowest standard")}</span>`);
    if (!tags.length) tags.push(`<span class="pill good">${L("En rango", "In range")}</span>`);
    html += `<tr><td>${esc(name)}</td><td class="num">${fmt(y)}</td>
      <td class="num">${fmt(x)}${Number.isFinite(ci) ? `<div class="sub">± ${fmt(ci, 2)}</div>` : ""}</td>
      <td class="num">${x < CAL.lod ? "—" : fmt(vFinal) + " " + uFinal}${Number.isFinite(ciFinal) && x >= CAL.lod ? `<div class="sub">± ${fmt(ciFinal, 2)}</div>` : ""}</td>
      <td>${tags.join(" ")}</td></tr>`;
  }
  html += `</tbody>`;
  const ciTxt = CAL.mode === "none" ? L("± = intervalo de confianza al 95 % de la interpolación", "± = 95 % confidence interval of the interpolated value") : L("Con ponderación no se calcula el IC de la interpolación", "No interpolation CI is given for weighted fits");
  const facTxt = factor !== 1 ? L(`Factor aplicado: ${fmt(factor, 4)} (preconcentración ×${fmt(1 / factor, 4)}) · `, `Applied factor: ${fmt(factor, 4)} (preconcentration ×${fmt(1 / factor, 4)}) · `) : "";
  html += `<caption class="sub" style="caption-side:bottom;text-align:left;padding-top:8px">${facTxt}${ciTxt}</caption>`;
  tbl.innerHTML = html;
}

function updateME() {
  const s = parseNum($("meSolv").value), mtx = parseNum($("meMat").value);
  const out = $("meOut");
  if (!Number.isFinite(s) || !Number.isFinite(mtx) || s === 0) { out.innerHTML = ""; return; }
  const me = (mtx / s - 1) * 100;
  const a = Math.abs(me);
  const [cls, txt] = a <= 20 ? ["good", L("Efecto matriz suave (≤ 20 %): puedes calibrar en disolvente.", "Soft matrix effect (≤ 20 %): solvent calibration is fine.")] :
    a <= 50 ? ["warn", L("Efecto matriz medio (20–50 %): calibra en matriz o usa patrón interno marcado.", "Medium matrix effect (20–50 %): use matrix-matched calibration or a labelled internal standard.")] :
      ["bad", L("Efecto matriz fuerte (> 50 %): calibrado en matriz, patrón interno isotópico o adiciones estándar.", "Strong matrix effect (> 50 %): matrix-matched calibration, isotope-labelled internal standard or standard addition.")];
  out.innerHTML = `<span class="big">${me > 0 ? "+" : ""}${fmtFix(me, 1)} %</span>${me < 0 ? L("Supresión de señal.", "Signal suppression.") : L("Aumento de señal.", "Signal enhancement.")} <div class="note ${cls}" style="margin-top:6px">${txt}</div>`;
}

function updateRec() {
  const add = parseNum($("recAdd").value), blank = parseNum($("recBlank").value) || 0;
  const reps = $("recRep").value.split(/[\s;\t]+/).map(parseNum).filter(Number.isFinite);
  const out = $("recOut");
  if (!Number.isFinite(add) || add <= 0 || !reps.length) { out.innerHTML = ""; return; }
  const rec = reps.map((v) => (v - blank) / add * 100);
  const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
  let html = `<span class="big">${fmtFix(mean, 1)} %</span>`;
  let ok = mean >= 70 && mean <= 120;
  if (rec.length > 1) {
    const sd = Math.sqrt(rec.reduce((a, b) => a + (b - mean) ** 2, 0) / (rec.length - 1));
    const rsd = sd / mean * 100;
    html += L(`Recuperación media de ${rec.length} réplicas · RSD = ${fmtFix(rsd, 1)} %`, `Mean recovery of ${rec.length} replicates · RSD = ${fmtFix(rsd, 1)} %`);
    ok = ok && rsd <= 20;
  } else html += L("Una sola réplica: añade más para calcular la RSD.", "Single replicate: add more to compute the RSD.");
  html += `<div class="note ${ok ? "good" : "warn"}" style="margin-top:6px">${ok ? L("Dentro de lo habitual (70–120 %, RSD ≤ 20 %; SANTE).", "Within the usual range (70–120 %, RSD ≤ 20 %; SANTE).") : L("Fuera del intervalo habitual de 70–120 % con RSD ≤ 20 % (SANTE).", "Outside the usual 70–120 % with RSD ≤ 20 % (SANTE).")}</div>`;
  out.innerHTML = html;
}

function updateIR() {
  const sq = parseNum($("irStdQ").value), sc = parseNum($("irStdC").value);
  const mq = parseNum($("irSmpQ").value), mc = parseNum($("irSmpC").value);
  const tol = Number($("irTol").value);
  const out = $("irOut");
  if (![sq, sc, mq, mc].every(Number.isFinite) || sq <= 0 || mq <= 0) { out.innerHTML = ""; return; }
  const rs = sc / sq, rm = mc / mq, dev = (rm / rs - 1) * 100;
  const ok = Math.abs(dev) <= tol;
  out.innerHTML = `<span class="big">${dev > 0 ? "+" : ""}${fmtFix(dev, 1)} %</span>${L("Relación en el patrón", "Ratio in the standard")} ${fmtFix(rs * 100, 1)} % · ${L("en la muestra", "in the sample")} ${fmtFix(rm * 100, 1)} %<br>${L("Intervalo aceptable", "Acceptable range")}: ${fmtFix(rs * (1 - tol / 100) * 100, 1)} – ${fmtFix(rs * (1 + tol / 100) * 100, 1)} %
    <div class="note ${ok ? "good" : "bad"}" style="margin-top:6px">${ok ? L("Cumple: identificación confirmada por la relación de iones.", "Pass: identity confirmed by the ion ratio.") : L("No cumple: no se puede confirmar la identidad con estas transiciones.", "Fail: identity cannot be confirmed with these transitions.")}</div>`;
}

function initCal() {
  const fields = ["calData", "smpData", "smpVs", "smpVf", "smpDil", "smpRep", "calUnit", "calWeight", "meMat", "recAdd", "recBlank", "recRep", "irStdQ", "irStdC", "irSmpQ", "irSmpC", "irTol"];
  for (const id of fields) {
    const v = store.get(id, null);
    if (v !== null) $(id).value = v;
  }
  if (store.get("calData", null) === null) $("calData").value = CAL_EXAMPLE();
  if (store.get("smpData", null) === null) $("smpData").value = SMP_EXAMPLE();
  for (const id of fields) $(id).addEventListener("input", () => { store.set(id, $(id).value); onCalInput(id); });
  $("meSolv").addEventListener("input", () => { $("meSolv").dataset.touched = "1"; updateME(); });
  $("calExample").addEventListener("click", () => {
    $("calData").value = CAL_EXAMPLE(); $("smpData").value = SMP_EXAMPLE();
    $("smpVs").value = "500"; $("smpVf").value = "1"; $("smpDil").value = "1";
    ["calData", "smpData", "smpVs", "smpVf", "smpDil"].forEach((id) => store.set(id, $(id).value));
    updateCal();
  });
  $("calClear").addEventListener("click", () => {
    $("calData").value = ""; $("smpData").value = "";
    store.set("calData", ""); store.set("smpData", "");
    updateCal();
  });
}
function renderCal() { updateCal(); updateRec(); updateIR(); }
function onCalInput(id) {
  if (["calData", "calUnit", "calWeight"].includes(id)) updateCal();
  else if (id.startsWith("smp")) updateSamples();
  else if (id.startsWith("me")) updateME();
  else if (id.startsWith("rec")) updateRec();
  else if (id.startsWith("ir")) updateIR();
}

/* =========================================================
   MASAS: datos isotópicos (IUPAC/NIST)
   ========================================================= */
const ISO = {
  H: [[1.00782503207, 0.999885], [2.0141017778, 0.000115]],
  D: [[2.0141017778, 1]],
  B: [[10.0129370, 0.199], [11.0093054, 0.801]],
  C: [[12, 0.9893], [13.0033548378, 0.0107]],
  N: [[14.0030740048, 0.99636], [15.0001088982, 0.00364]],
  O: [[15.99491461956, 0.99757], [16.99913170, 0.00038], [17.9991610, 0.00205]],
  F: [[18.99840322, 1]],
  Na: [[22.9897692809, 1]],
  Mg: [[23.985041700, 0.7899], [24.98583692, 0.1000], [25.982592929, 0.1101]],
  Al: [[26.98153863, 1]],
  Si: [[27.9769265325, 0.92223], [28.976494700, 0.04685], [29.97377017, 0.03092]],
  P: [[30.97376163, 1]],
  S: [[31.97207100, 0.9499], [32.97145876, 0.0075], [33.96786690, 0.0425], [35.96708076, 0.0001]],
  Cl: [[34.96885268, 0.7576], [36.96590259, 0.2424]],
  Ar: [[35.967545106, 0.003336], [37.9627324, 0.000629], [39.9623831225, 0.996035]],
  K: [[38.96370668, 0.932581], [39.96399848, 0.000117], [40.96182576, 0.067302]],
  Ca: [[39.96259098, 0.96941], [41.95861801, 0.00647], [42.9587666, 0.00135], [43.9554818, 0.02086], [45.9536926, 0.00004], [47.952534, 0.00187]],
  Fe: [[53.9396105, 0.05845], [55.9349375, 0.91754], [56.9353940, 0.02119], [57.9332756, 0.00282]],
  Cu: [[62.9295975, 0.6915], [64.9277895, 0.3085]],
  Zn: [[63.9291422, 0.4917], [65.9260334, 0.2773], [66.9271273, 0.0404], [67.9248442, 0.1845], [69.9253193, 0.0061]],
  As: [[74.9215965, 1]],
  Se: [[73.9224764, 0.0089], [75.9192136, 0.0937], [76.9199140, 0.0763], [77.9173091, 0.2377], [79.9165213, 0.4961], [81.9166994, 0.0873]],
  Br: [[78.9183371, 0.5069], [80.9162906, 0.4931]],
  Sn: [[111.904818, 0.0097], [113.902779, 0.0066], [114.903342, 0.0034], [115.901741, 0.1454], [116.902952, 0.0768], [117.901603, 0.2422], [118.903308, 0.0859], [119.9021947, 0.3258], [121.9034390, 0.0463], [123.9052739, 0.0579]],
  I: [[126.904473, 1]],
  Hg: [[195.965833, 0.0015], [197.966769, 0.0997], [198.968280, 0.1687], [199.968326, 0.2310], [200.970302, 0.1318], [201.970643, 0.2986], [203.973494, 0.0687]],
  Pb: [[203.9730436, 0.014], [205.9744653, 0.241], [206.9758969, 0.221], [207.9766521, 0.524]],
};
const E_MASS = 0.000548579909;
const MONO = {}, AVG = {};
for (const [el, iso] of Object.entries(ISO)) {
  MONO[el] = iso.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  AVG[el] = iso.reduce((s, [m, ab]) => s + m * ab, 0) / iso.reduce((s, [, ab]) => s + ab, 0);
}

class FormulaError extends Error {}
function parseFormula(str) {
  const s = str.replace(/\s+/g, "").replace(/[·•]/g, "");
  if (!s) throw new FormulaError(L("Escribe una fórmula", "Type a formula"));
  let i = 0;
  function num() {
    let j = i;
    while (j < s.length && /\d/.test(s[j])) j++;
    const n = j > i ? parseInt(s.slice(i, j), 10) : 1;
    i = j;
    return n;
  }
  function group() {
    const counts = {};
    while (i < s.length) {
      const c = s[i];
      if (c === "(" || c === "[") {
        i++;
        const inner = group();
        if (s[i] !== ")" && s[i] !== "]") throw new FormulaError(L("Falta cerrar un paréntesis", "Missing closing bracket"));
        i++;
        const k = num();
        for (const [el, n] of Object.entries(inner)) counts[el] = (counts[el] || 0) + n * k;
      } else if (c === ")" || c === "]") {
        return counts;
      } else if (/[A-Z]/.test(c)) {
        let el = c; i++;
        if (i < s.length && /[a-z]/.test(s[i])) { el += s[i]; i++; }
        if (!ISO[el]) throw new FormulaError(L(`Elemento no reconocido: ${el}`, `Unknown element: ${el}`));
        const n = num();
        counts[el] = (counts[el] || 0) + n;
      } else {
        throw new FormulaError(L(`Carácter no válido: «${c}»`, `Invalid character: “${c}”`));
      }
    }
    return counts;
  }
  const out = group();
  if (i < s.length) throw new FormulaError(L("Paréntesis sin abrir", "Unopened bracket"));
  for (const k of Object.keys(out)) if (!out[k]) delete out[k];
  if (!Object.keys(out).length) throw new FormulaError(L("Fórmula vacía", "Empty formula"));
  return out;
}

function monoMass(c) { return Object.entries(c).reduce((s, [el, n]) => s + MONO[el] * n, 0); }
function avgMass(c) { return Object.entries(c).reduce((s, [el, n]) => s + AVG[el] * n, 0); }

function hill(c) {
  const els = Object.keys(c).filter((e) => c[e] > 0);
  const order = [];
  if (c.C) { order.push("C"); if (c.H) order.push("H"); if (c.D) order.push("D"); }
  els.filter((e) => !order.includes(e)).sort().forEach((e) => order.push(e));
  return order.map((e) => e + (c[e] > 1 ? c[e] : "")).join("");
}
function hillHtml(c) { return hill(c).replace(/(\d+)/g, "<sub>$1</sub>"); }
function addCounts(a, b, k = 1) { const r = { ...a }; for (const [el, n] of Object.entries(b)) r[el] = (r[el] || 0) + n * k; return r; }
function scaleCounts(a, k) { const r = {}; for (const [el, n] of Object.entries(a)) r[el] = n * k; return r; }

// Distribución isotópica con estructura fina (cubos de 1 mDa) y agrupada por masa nominal
function isotopeDist(counts) {
  let dist = new Map([[0, [1, 0]]]);
  let shift = 0;
  for (const [el, n] of Object.entries(counts)) {
    const iso = ISO[el];
    if (iso.length === 1) { shift += iso[0][0] * n; continue; }
    for (let a = 0; a < n; a++) {
      const nd = new Map();
      for (const [, [v, mv]] of dist) {
        const m0 = mv / v;
        for (const [m, ab] of iso) {
          const mm = m0 + m, kk = Math.round(mm * 1e3), w = v * ab;
          const cur = nd.get(kk);
          if (cur) { cur[0] += w; cur[1] += w * mm; } else nd.set(kk, [w, w * mm]);
        }
      }
      let mx = 0;
      for (const [v] of nd.values()) if (v > mx) mx = v;
      for (const [k, [v]] of nd) if (v < mx * 1e-9) nd.delete(k);
      dist = nd;
    }
  }
  const mono = monoMass(counts);
  let fine = [...dist.values()].map(([v, mv]) => ({ m: mv / v + shift, i: v }));
  const groups = new Map();
  for (const p of fine) {
    const g = Math.round(p.m - mono);
    const cur = groups.get(g) || { m: 0, i: 0 };
    cur.m += p.m * p.i; cur.i += p.i;
    groups.set(g, cur);
  }
  let nom = [...groups.entries()].map(([g, o]) => ({ off: g, m: o.m / o.i, i: o.i })).sort((a, b) => a.off - b.off);
  const mxN = Math.max(...nom.map((p) => p.i));
  nom = nom.map((p) => ({ ...p, rel: p.i / mxN * 100 })).filter((p) => p.rel >= 0.05);
  fine = fine.map((p) => ({ ...p, off: Math.round(p.m - mono), rel: p.i / mxN * 100 })).filter((p) => p.rel >= 0.005).sort((a, b) => a.m - b.m);
  return { nom, fine };
}
function isotopePattern(counts) { return isotopeDist(counts).nom; }

const ADDUCTS = [
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+H]⁺", n: 1, add: "H", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+NH₄]⁺", n: 1, add: "NH4", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+Na]⁺", n: 1, add: "Na", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+K]⁺", n: 1, add: "K", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+H−H₂O]⁺", n: 1, add: "H", sub: "H2O", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+CH₃CN+H]⁺", n: 1, add: "C2H4N", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[M+2H]²⁺", n: 1, add: "H2", z: 2 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[2M+H]⁺", n: 2, add: "H", z: 1 },
  { grp: ["ESI positivo", "ESI positive"], lab: "[2M+Na]⁺", n: 2, add: "Na", z: 1 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[M−H]⁻", n: 1, sub: "H", z: -1 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[M+Cl]⁻", n: 1, add: "Cl", z: -1 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[M+HCOO]⁻", n: 1, add: "CHO2", z: -1 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[M+CH₃COO]⁻", n: 1, add: "C2H3O2", z: -1 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[M−H−H₂O]⁻", n: 1, sub: "H3O", z: -1 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[M−2H]²⁻", n: 1, sub: "H2", z: -2 },
  { grp: ["ESI negativo", "ESI negative"], lab: "[2M−H]⁻", n: 2, sub: "H", z: -1 },
  { grp: ["EI / APCI", "EI / APCI"], lab: "M⁺• (EI)", n: 1, z: 1 },
  { grp: ["EI / APCI", "EI / APCI"], lab: ["M⁻• (captura electrónica)", "M⁻• (electron capture)"], n: 1, z: -1 },
];
const adLab = (ad) => (Array.isArray(ad.lab) ? L(ad.lab[0], ad.lab[1]) : ad.lab);

function ionCounts(M, ad) {
  let c = scaleCounts(M, ad.n);
  if (ad.add) c = addCounts(c, parseFormula(ad.add));
  if (ad.sub) c = addCounts(c, parseFormula(ad.sub), -1);
  for (const v of Object.values(c)) if (v < 0) return null;
  for (const k of Object.keys(c)) if (!c[k]) delete c[k];
  return c;
}
function mzOf(counts, z) { return (monoMass(counts) - z * E_MASS) / Math.abs(z); }

/* =========================================================
   MASAS: interfaz
   ========================================================= */
const EXAMPLES = [
  [["Carbamazepina", "Carbamazepine"], "C15H12N2O"], [["Carbamazepina-d10", "Carbamazepine-d10"], "C15H2D10N2O"], [["Cafeína", "Caffeine"], "C8H10N4O2"],
  [["Atrazina", "Atrazine"], "C8H14ClN5"], [["Triclosán", "Triclosan"], "C12H7Cl3O2"], [["BDE-47", "BDE-47"], "C12H6Br4O"],
  [["PFOA", "PFOA"], "C8HF15O2"], [["Glifosato", "Glyphosate"], "C3H8NO5P"], [["Ác. dimetilarsínico", "Dimethylarsinic acid"], "C2H7AsO2"], [["Sulfametoxazol", "Sulfamethoxazole"], "C10H11N3O3S"],
];
let MASS = { M: null, ions: [], sel: 0, zoom: "all" };

function renderChips() {
  $("fmChips").innerHTML = EXAMPLES.map(([n, f]) => `<button type="button" class="chip" data-f="${f}">${esc(L(n[0], n[1]))}</button>`).join("");
}

function updateMass() {
  const box = $("fmSummary");
  let M;
  try { M = parseFormula($("fmInput").value); }
  catch (e) {
    box.innerHTML = `<div class="note warn err">${esc(e.message)}</div>`;
    $("adTable").innerHTML = ""; $("isoTable").innerHTML = ""; emptyChart($("isoChart"), "—"); $("isoLabel").textContent = ""; $("ppmOut").innerHTML = ""; $("msZoom").innerHTML = ""; $("specNote").textContent = "";
    MASS.M = null;
    return;
  }
  store.set("formula", $("fmInput").value);
  const mono = monoMass(M), avg = avgMass(M);
  const C = M.C || 0, H = (M.H || 0) + (M.D || 0), N = M.N || 0, P = M.P || 0, B = M.B || 0;
  const X = ["F", "Cl", "Br", "I", "Na", "K"].reduce((s, e) => s + (M[e] || 0), 0);
  const Si = M.Si || 0;
  const dbe = C + Si + 1 + (N + P + B) / 2 - (H + X) / 2;
  const nomOdd = Math.round(mono) % 2 === 1;
  box.innerHTML = `
    <div class="stat"><div class="k">${L("Fórmula (Hill)", "Formula (Hill)")}</div><div class="v">${hillHtml(M)}</div></div>
    <div class="stat"><div class="k">${L("Masa monoisotópica", "Monoisotopic mass")}</div><div class="v">${fmtMz(mono, 5)}</div><div class="s">Da</div></div>
    <div class="stat"><div class="k">${L("Masa molar media", "Average molar mass")}</div><div class="v">${fmtMz(avg, 3)}</div><div class="s">g/mol</div></div>
    <div class="stat"><div class="k">${L("Insaturaciones (DBE)", "Double bond equivalents")}</div><div class="v">${Number.isInteger(dbe) ? dbe : fmtFix(dbe, 1)}</div><div class="s">${nomOdd ? L("masa nominal impar → nº impar de N", "odd nominal mass → odd number of N") : L("masa nominal par → nº par de N (o ninguno)", "even nominal mass → even number of N (or none)")}</div></div>`;

  MASS.M = M;
  MASS.ions = ADDUCTS.map((ad) => { const c = ionCounts(M, ad); return c ? { ...ad, c, mz: mzOf(c, ad.z) } : null; }).filter(Boolean);
  if (MASS.sel >= MASS.ions.length) MASS.sel = 0;
  let html = `<thead><tr><th>Ion</th><th class="num">m/z</th><th>${L("Fórmula del ion", "Ion formula")}</th></tr></thead><tbody>`;
  let g = "";
  MASS.ions.forEach((ion, idx) => {
    const gl = L(ion.grp[0], ion.grp[1]);
    if (gl !== g) { g = gl; html += `<tr class="grp"><td colspan="3">${g}</td></tr>`; }
    html += `<tr data-i="${idx}" class="${idx === MASS.sel ? "sel" : ""}"><td>${adLab(ion)}</td><td class="num">${fmtMz(ion.mz, 4)}</td><td class="sub">${hillHtml(ion.c)}</td></tr>`;
  });
  $("adTable").innerHTML = html + "</tbody>";
  updateIso();
}

// Perfil gaussiano: segmentos alrededor de cada pico para no muestrear miles de puntos vacíos
function profilePoints(peaks, lo, hi, fwhmAt) {
  const ivs = [];
  for (const p of peaks) {
    const sg = fwhmAt(p.mz) / 2.3548;
    const a = Math.max(lo, p.mz - 5 * sg), b = Math.min(hi, p.mz + 5 * sg);
    if (b > a) ivs.push([a, b, sg]);
  }
  ivs.sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const iv of ivs) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) { last[1] = Math.max(last[1], iv[1]); last[2] = Math.min(last[2], iv[2]); }
    else merged.push([...iv]);
  }
  const pts = [[lo, 0]];
  for (const [a, b, sg] of merged) {
    const step = Math.max(sg / 4, (hi - lo) / 6000);
    pts.push([a, 0]);
    for (let x = a; x <= b; x += step) {
      let y = 0;
      for (const p of peaks) {
        const s2 = fwhmAt(p.mz) / 2.3548;
        const d = x - p.mz;
        if (Math.abs(d) < 6 * s2) y += p.rel * Math.exp(-(d * d) / (2 * s2 * s2));
      }
      pts.push([x, y]);
    }
    pts.push([b, 0]);
  }
  pts.push([hi, 0]);
  return pts;
}

function updateIso() {
  const ion = MASS.ions[MASS.sel];
  if (!ion) return;
  $("isoLabel").textContent = adLab(ion);
  const { nom, fine } = isotopeDist(ion.c);
  const z = Math.abs(ion.z);
  const toMz = (m) => (m - ion.z * E_MASS) / z;
  const nomPk = nom.map((p) => ({ mz: toMz(p.m), rel: p.rel, off: p.off }));
  const finePk = fine.map((p) => ({ mz: toMz(p.m), rel: p.rel, off: p.off }));

  const resV = $("msRes").value;
  const R = resV === "q" ? null : Number(resV);
  const fwhmAt = resV === "q" ? () => 0.7 : (mz) => mz / R;

  // Botones de zoom
  const zoomable = nomPk.filter((p) => p.rel >= 1).slice(0, 8);
  if (MASS.zoom !== "all" && !zoomable.some((p) => String(p.off) === MASS.zoom)) MASS.zoom = "all";
  $("msZoom").innerHTML = `<button type="button" data-z="all" class="${MASS.zoom === "all" ? "on" : ""}">${L("Todo", "All")}</button>` +
    zoomable.map((p) => `<button type="button" data-z="${p.off}" class="${String(p.off) === MASS.zoom ? "on" : ""}">M${p.off ? "+" + p.off : ""}</button>`).join("");

  // Ventana
  let lo, hi, peaksIn, sticks;
  if (MASS.zoom === "all") {
    const shown = nomPk.filter((p) => p.rel >= 0.3).slice(0, 12);
    const pad = resV === "q" ? 1.5 : 1 / z;
    lo = shown[0].mz - pad; hi = shown[shown.length - 1].mz + pad;
    peaksIn = finePk.filter((p) => p.mz >= lo && p.mz <= hi);
    sticks = R === 0 ? shown : [];
  } else {
    const off = Number(MASS.zoom);
    const grp = finePk.filter((p) => p.off === off);
    const c = nomPk.find((p) => p.off === off).mz;
    const spread = Math.max(...grp.map((p) => Math.abs(p.mz - c)));
    const w = R === 0 ? Math.max(0.01, spread * 1.6) : Math.max(spread + 3 * fwhmAt(c), 3 * fwhmAt(c), 0.006);
    lo = c - w; hi = c + w;
    peaksIn = finePk.filter((p) => p.mz >= lo - 5 * fwhmAt(c) && p.mz <= hi + 5 * fwhmAt(c));
    sticks = grp;
  }

  const W = 520, H = 250, m = { l: 40, r: 10, t: 22, b: 40 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const Xs = (v) => m.l + (v - lo) / (hi - lo) * pw;
  let prof = null, ymax = 100;
  if (R !== 0) {
    prof = profilePoints(peaksIn, lo, hi, fwhmAt);
    ymax = Math.max(...prof.map((p) => p[1]), 1e-9);
  } else if (sticks.length) ymax = Math.max(...sticks.map((p) => p.rel));
  const Ys = (v) => m.t + ph - Math.min(v / ymax, 1.05) * ph;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L("Espectro de masas simulado", "Simulated mass spectrum"))}">`;
  for (const v of [0, 25, 50, 75, 100]) s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${Ys(v / 100 * ymax)}" y2="${Ys(v / 100 * ymax)}"/><text class="tick" x="${m.l - 6}" y="${Ys(v / 100 * ymax) + 4}" text-anchor="end">${v}</text>`;
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Ys(0)}" y2="${Ys(0)}"/>`;
  const xt = niceTicks(lo, hi, 5);
  const xdec = Math.max(0, Math.min(4, -Math.floor(Math.log10(xt.step) + 1e-9)));
  for (const v of xt.ticks) if (v >= lo && v <= hi) s += `<text class="tick" x="${Xs(v)}" y="${H - m.b + 16}" text-anchor="middle">${v.toFixed(xdec)}</text><line class="axis" x1="${Xs(v)}" x2="${Xs(v)}" y1="${Ys(0)}" y2="${Ys(0) + 4}"/>`;
  if (prof) {
    const d = prof.map((p, i) => (i ? "L" : "M") + Xs(p[0]).toFixed(2) + " " + Ys(p[1]).toFixed(2)).join("");
    s += `<path class="profFill" d="${d}Z"/><path class="prof" d="${d}"/>`;
    // estructura fina como líneas finas
    if (MASS.zoom !== "all") for (const p of peaksIn) if (p.mz >= lo && p.mz <= hi) s += `<line class="stick" x1="${Xs(p.mz)}" x2="${Xs(p.mz)}" y1="${Ys(0)}" y2="${Ys(p.rel)}"><title>${fmtMz(p.mz, 5)} · ${fmtFix(p.rel, 2)} %</title></line>`;
    // etiquetas en los máximos nominales (vista completa)
    if (MASS.zoom === "all") for (const p of nomPk.filter((q) => q.rel >= 0.3 && q.mz > lo && q.mz < hi).slice(0, 12)) {
      s += `<text class="barlab" x="${Xs(p.mz)}" y="${Math.max(m.t - 4, Ys(p.rel / 100 * ymax) - 6)}" text-anchor="middle">${p.rel >= 99.95 ? "100" : fmtFix(p.rel, p.rel < 10 ? 1 : 0)}</text>`;
    }
  } else {
    const bw = MASS.zoom === "all" ? Math.max(6, Math.min(26, pw / ((hi - lo) * z) * 0.35)) : 3;
    for (const p of sticks) {
      s += `<rect class="bar" x="${Xs(p.mz) - bw / 2}" y="${Ys(p.rel)}" width="${bw}" height="${Ys(0) - Ys(p.rel)}" rx="1.5"><title>${fmtMz(p.mz, 5)} · ${fmtFix(p.rel, 2)} %</title></rect>`;
      s += `<text class="barlab" x="${Xs(p.mz)}" y="${Ys(p.rel) - 5}" text-anchor="middle">${fmtFix(p.rel / ymax * 100, p.rel / ymax * 100 < 10 ? 1 : 0)}</text>`;
    }
  }
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 4}" text-anchor="middle">m/z</text></svg>`;
  $("isoChart").innerHTML = s;

  // Nota explicativa
  const refMz = MASS.zoom === "all" ? nomPk[0].mz : nomPk.find((p) => String(p.off) === MASS.zoom).mz;
  let note;
  if (R === 0) note = MASS.zoom === "all" ? L("Abundancias isotópicas agrupadas por masa nominal. Pulsa M+1, M+2… para ver la estructura fina.", "Isotope abundances grouped by nominal mass. Tap M+1, M+2… to see the fine structure.") : L("Isotopólogos individuales dentro de esta masa nominal (estructura fina).", "Individual isotopologues within this nominal mass (fine structure).");
  else {
    const f = fwhmAt(refMz);
    note = L(`Anchura de pico (FWHM) a m/z ${fmtMz(refMz, 1)}: ${f >= 0.1 ? fmtFix(f, 2) + " Da" : fmtFix(f * 1000, 2) + " mDa"}.`, `Peak width (FWHM) at m/z ${fmtMz(refMz, 1)}: ${f >= 0.1 ? fmtFix(f, 2) + " Da" : fmtFix(f * 1000, 2) + " mDa"}.`);
    if (MASS.zoom !== "all") {
      const grp = finePk.filter((p) => String(p.off) === MASS.zoom && p.rel >= 0.05);
      note += " " + L(`Las líneas naranjas son los ${grp.length} isotopólogos de esta masa nominal; si están más juntos que la FWHM, el equipo los ve como un solo pico.`, `Orange lines are the ${grp.length} isotopologues at this nominal mass; if they are closer than the FWHM, the instrument sees a single peak.`);
    } else note += " " + L("Pulsa M+1, M+2… para ampliar y ver si tu equipo separa la estructura fina.", "Tap M+1, M+2… to zoom in and see whether your instrument resolves the fine structure.");
  }
  $("specNote").textContent = note;

  const step = z > 1 ? `/${z}` : "";
  $("isoTable").innerHTML = `<thead><tr><th>${L("Pico", "Peak")}</th><th class="num">m/z</th><th class="num">${L("Abundancia relativa", "Relative abundance")}</th></tr></thead><tbody>` +
    nomPk.filter((p) => p.rel >= 0.1).slice(0, 10).map((p) => `<tr><td>M${p.off ? "+" + p.off + step : ""}</td><td class="num">${fmtMz(p.mz, 4)}</td><td class="num">${fmtFix(p.rel, 2)} %</td></tr>`).join("") + `</tbody>`;
  updatePpm();
}

function updatePpm() {
  const meas = parseNum($("ppmMeas").value);
  const out = $("ppmOut");
  const ion = MASS.ions[MASS.sel];
  if (!Number.isFinite(meas) || !ion) { out.innerHTML = ""; return; }
  const ppm = (meas - ion.mz) / ion.mz * 1e6, mda = (meas - ion.mz) * 1000;
  const a = Math.abs(ppm);
  const cls = a <= 5 ? "good" : a <= 10 ? "warn" : "bad";
  let html = `<span class="big">${ppm > 0 ? "+" : ""}${fmtFix(ppm, 2)} ppm</span>Δ = ${mda > 0 ? "+" : ""}${fmtFix(mda, 2)} mDa ${L("respecto a", "from")} ${adLab(ion)} (${fmtMz(ion.mz)}) <span class="pill ${cls}">${a <= 5 ? "≤ 5 ppm" : a <= 10 ? "≤ 10 ppm" : "> 10 ppm"}</span>`;
  const near = MASS.ions.map((i) => ({ i, d: Math.abs(meas - i.mz) })).sort((x, y) => x.d - y.d)[0];
  if (near.i !== ion && Math.abs(near.d / near.i.mz * 1e6) < Math.min(a, 20)) html += `<div class="note warn" style="margin-top:6px">${L("Encaja mejor con", "Better match:")} ${adLab(near.i)} (${fmtMz(near.i.mz)}, ${fmtFix((meas - near.i.mz) / near.i.mz * 1e6, 1)} ppm).</div>`;
  out.innerHTML = html;
}

function setFormula(f) {
  $("fmInput").value = f; MASS.sel = 0; MASS.zoom = "all"; updateMass();
}

function initMass() {
  $("fmChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    setFormula(b.dataset.f);
  });
  const saved = store.get("formula", "");
  if (saved) $("fmInput").value = saved;
  const res = store.get("msRes", "");
  if (res && [...$("msRes").options].some((o) => o.value === res)) $("msRes").value = res;
  else $("msRes").value = "70000";
  $("fmInput").addEventListener("input", () => { MASS.zoom = "all"; updateMass(); });
  $("adTable").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-i]"); if (!tr) return;
    MASS.sel = Number(tr.dataset.i); MASS.zoom = "all";
    document.querySelectorAll("#adTable tr.sel").forEach((r) => r.classList.remove("sel"));
    tr.classList.add("sel");
    updateIso();
  });
  $("msRes").addEventListener("input", () => { store.set("msRes", $("msRes").value); updateIso(); });
  $("msZoom").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-z]"); if (!b) return;
    MASS.zoom = b.dataset.z; updateIso();
  });
  $("ppmMeas").addEventListener("input", updatePpm);
}
function renderMass() { renderChips(); updateMass(); }

/* =========================================================
   DIBUJAR (Kekule.js bajo demanda + PubChem)
   ========================================================= */
const KEKULE = "https://cdn.jsdelivr.net/npm/kekule@1.0.4/dist/";
let DRAW = { state: "idle", composer: null, smi: null, formula: null, timer: null };

function loadKekule() {
  return new Promise((resolve, reject) => {
    if (window.Kekule && window.Kekule.Editor) return resolve();
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = KEKULE + "themes/default/kekule.css";
    document.head.appendChild(css);
    const sc = document.createElement("script");
    sc.src = KEKULE + "kekule.min.js?modules=io,chemWidget,algorithm,calculation";
    sc.onload = () => {
      // kekule.min.js carga sus módulos en cadena; esperamos a que exista el editor
      let n = 0;
      const iv = setInterval(() => {
        if (window.Kekule && Kekule.Editor && Kekule.Editor.Composer) { clearInterval(iv); resolve(); }
        else if (++n > 200) { clearInterval(iv); reject(new Error("timeout")); }
      }, 50);
    };
    sc.onerror = () => reject(new Error("load"));
    document.head.appendChild(sc);
  });
}

function initDraw() {
  if (DRAW.state !== "idle") return;
  DRAW.state = "loading";
  loadKekule().then(() => {
    const el = $("composer");
    el.innerHTML = "";
    DRAW.composer = new Kekule.Editor.Composer(el);
    try { DRAW.composer.setAutoSetMinDimension && DRAW.composer.setAutoSetMinDimension(false); } catch (e) { /* opcional */ }
    const fit = () => { try { DRAW.composer.resized(); } catch (e) { /* nada */ } };
    requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    DRAW.state = "ready";
    const saved = store.get("molfile", "");
    if (saved) { try { DRAW.composer.setChemObj(Kekule.IO.loadFormatData(saved, "mol")); } catch (e) { /* ignorar */ } }
    DRAW.timer = setInterval(() => { if (CURRENT === "dibujar") readStructure(); }, 600);
    readStructure(true);
  }).catch(() => {
    DRAW.state = "idle";
    $("composer").innerHTML = `<p class="composer-loading">${L("No se ha podido cargar el editor. Comprueba tu conexión y recarga la página.", "Could not load the editor. Check your connection and reload the page.")}</p>`;
  });
}

function currentMols() {
  try { return DRAW.composer.exportObjs(Kekule.Molecule) || []; } catch (e) { return []; }
}

function readStructure(force) {
  if (DRAW.state !== "ready") return;
  let smi = "";
  const mols = currentMols();
  try { smi = mols.length ? mols.map((mo) => Kekule.IO.saveFormatData(mo, "smi")).join(".") : ""; } catch (e) { smi = ""; }
  if (!force && smi === DRAW.smi) return;
  DRAW.smi = smi;
  let counts = null, charge = 0, err = "";
  if (mols.length) {
    try {
      counts = {};
      for (const mo of mols) {
        const txt = mo.calcFormula().getText().replace(/<[^>]+>/g, "");
        const mch = txt.match(/([+-]\d*|\d*[+-])$/);
        if (mch) { const s = mch[1]; const k = parseInt(s.replace(/[+-]/, ""), 10) || 1; charge += (s.includes("-") ? -1 : 1) * k; }
        counts = addCounts(counts, parseFormula(txt.replace(/([+-]\d*|\d*[+-])$/, "")));
      }
    } catch (e) { counts = null; err = e.message; }
    try { store.set("molfile", Kekule.IO.saveFormatData(DRAW.composer.getChemObj(), "mol")); } catch (e) { /* nada */ }
  } else store.set("molfile", "");
  DRAW.formula = counts ? hill(counts) : null;
  DRAW.charge = charge;
  DRAW.name = { state: smi ? "wait" : "none" };
  renderDrawPanel(err);
  clearTimeout(DRAW.nameTimer);
  if (smi) DRAW.nameTimer = setTimeout(() => identify(smi), 900);
}

function renderDrawPanel(err) {
  const out = $("drOut");
  const has = !!DRAW.formula;
  ["drToMass", "drCopySmi", "drPng"].forEach((id) => { $(id).disabled = !has; });
  if (DRAW.state !== "ready") { out.innerHTML = ""; return; }
  if (!has) {
    $("drName").innerHTML = "";
    out.innerHTML = `<div class="stat"><div class="k">${L("Fórmula", "Formula")}</div><div class="v">${err ? esc(err) : L("Dibuja una molécula", "Draw a molecule")}</div></div>`;
    return;
  }
  const c = parseFormula(DRAW.formula);
  const nMol = DRAW.smi ? DRAW.smi.split(".").length : 1;
  out.innerHTML = `
    <div class="stat"><div class="k">${L("Fórmula", "Formula")}${nMol > 1 ? L(` (${nMol} fragmentos, suma)`, ` (${nMol} fragments, total)`) : ""}</div><div class="v">${hillHtml(c)}${DRAW.charge ? `<sup>${Math.abs(DRAW.charge) > 1 ? Math.abs(DRAW.charge) : ""}${DRAW.charge > 0 ? "+" : "−"}</sup>` : ""}</div></div>
    <div class="stat"><div class="k">${L("Masa monoisotópica", "Monoisotopic mass")}</div><div class="v">${fmtMz(monoMass(c), 5)}</div></div>
    <div class="stat"><div class="k">${L("Masa molar media", "Average molar mass")}</div><div class="v">${fmtMz(avgMass(c), 3)} g/mol</div></div>
    <div class="stat"><div class="k">SMILES</div><div class="v smi">${esc(DRAW.smi)}</div></div>`;
  renderName();
}

/* ---------- Estructura → nombre (PubChem) ---------- */
const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/";
async function identify(smi) {
  try {
    const r = await fetch(PUG + "smiles/property/Title,IUPACName/JSON", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "smiles=" + encodeURIComponent(smi) });
    if (smi !== DRAW.smi) return;
    if (!r.ok) throw new Error("http");
    const j = await r.json();
    const p = j && j.PropertyTable && j.PropertyTable.Properties && j.PropertyTable.Properties[0];
    if (!p || !p.CID) { DRAW.name = { state: "notfound" }; renderName(); return; }
    DRAW.name = { state: "ok", cid: p.CID, title: p.Title || "", iupac: p.IUPACName || "", cas: "" };
    renderName();
    try {
      const r2 = await fetch(PUG + "cid/" + p.CID + "/synonyms/JSON");
      if (r2.ok && smi === DRAW.smi) {
        const j2 = await r2.json();
        const syn = (j2.InformationList && j2.InformationList.Information[0].Synonym) || [];
        const cas = syn.find((x) => /^\d{2,7}-\d{2}-\d$/.test(x));
        if (cas) { DRAW.name.cas = cas; renderName(); }
      }
    } catch (e) { /* sin CAS */ }
  } catch (e) {
    if (smi !== DRAW.smi) return;
    DRAW.name = { state: "error" }; renderName();
  }
}

function renderName() {
  const el = $("drName");
  const n = DRAW.name || { state: "none" };
  if (!DRAW.formula || n.state === "none") { el.innerHTML = ""; return; }
  let v;
  if (n.state === "wait") v = `<div class="v small-v">${L("Buscando en PubChem…", "Looking up PubChem…")}</div>`;
  else if (n.state === "notfound") v = `<div class="v small-v">${L("No está en PubChem (puede ser una molécula nueva o el dibujo estar incompleto).", "Not in PubChem (it may be a new compound or the drawing may be incomplete).")}</div>`;
  else if (n.state === "error") v = `<div class="v small-v">${L("No se ha podido consultar PubChem.", "Could not reach PubChem.")}</div>`;
  else {
    const same = n.title && n.iupac && n.title.toLowerCase() === n.iupac.toLowerCase();
    v = `<div class="v name-v">${esc(n.title || n.iupac)}</div>` +
      (n.iupac && !same ? `<div class="s name-s">IUPAC: ${esc(n.iupac)}</div>` : "") +
      `<div class="s">${n.cas ? "CAS " + esc(n.cas) + " · " : ""}<a href="https://pubchem.ncbi.nlm.nih.gov/compound/${n.cid}" target="_blank" rel="noopener">PubChem CID ${n.cid}</a></div>`;
  }
  el.innerHTML = `<div class="stat"><div class="k">${L("Nombre", "Name")}</div>${v}</div>`;
}

function pcMsg(t, isErr) { const el = $("pcMsg"); el.textContent = t; el.classList.toggle("err", !!isErr); }

async function pubchemLoad(q) {
  q = q.trim();
  if (!q) return;
  if (DRAW.state !== "ready") { pcMsg(L("Espera a que cargue el editor.", "Wait for the editor to load."), true); return; }
  $("pcBtn").disabled = true;
  pcMsg(L("Buscando en PubChem…", "Searching PubChem…"));
  const base = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/";
  const tries = [
    () => fetch(base + "name/" + encodeURIComponent(q) + "/SDF?record_type=2d"),
    () => fetch(base + "smiles/SDF?record_type=2d", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "smiles=" + encodeURIComponent(q) }),
  ];
  try {
    let sdf = null;
    for (const t of tries) {
      try { const r = await t(); if (r.ok) { const txt = await r.text(); if (txt.includes("M  END")) { sdf = txt; break; } } } catch (e) { /* siguiente */ }
    }
    if (!sdf) { pcMsg(L(`No se ha encontrado «${q}» en PubChem. Prueba con el nombre en inglés, el CAS o un SMILES.`, `“${q}” was not found in PubChem. Try the English name, CAS number or a SMILES.`), true); return; }
    const molblock = sdf.slice(0, sdf.indexOf("M  END") + 6);
    const cid = molblock.split("\n")[0].trim();
    const mol = Kekule.IO.loadFormatData(molblock, "mol");
    DRAW.composer.setChemObj(mol);
    pcMsg(L(`Cargado desde PubChem${/^\d+$/.test(cid) ? " (CID " + cid + ")" : ""}.`, `Loaded from PubChem${/^\d+$/.test(cid) ? " (CID " + cid + ")" : ""}.`));
    readStructure(true);
  } finally { $("pcBtn").disabled = false; }
}

function initDrawUI() {
  $("pcForm").addEventListener("submit", (e) => { e.preventDefault(); pubchemLoad($("pcQuery").value); });
  $("drToMass").addEventListener("click", () => {
    if (!DRAW.formula) return;
    setFormula(DRAW.formula);
    location.hash = "#masas";
  });
  $("drCopySmi").addEventListener("click", async () => {
    if (!DRAW.smi) return;
    try { await navigator.clipboard.writeText(DRAW.smi); pcMsg(L("SMILES copiado.", "SMILES copied.")); }
    catch (e) { pcMsg(DRAW.smi); }
  });
  $("drPng").addEventListener("click", () => {
    const mols = currentMols(); if (!mols.length) return;
    const d = document.createElement("div");
    d.style.cssText = "width:900px;height:600px;position:fixed;left:-10000px;top:0;background:#fff";
    document.body.appendChild(d);
    try {
      const v = new Kekule.ChemWidget.Viewer(d);
      v.setChemObj(DRAW.composer.getChemObj());
      setTimeout(() => {
        const uri = v.exportToDataUri("image/png");
        const a = document.createElement("a");
        a.href = uri; a.download = (DRAW.formula || "molecule") + ".png";
        document.body.appendChild(a); a.click(); a.remove();
        v.finalize && v.finalize(); d.remove();
      }, 200);
    } catch (e) { d.remove(); pcMsg(L("No se ha podido exportar la imagen.", "Could not export the image."), true); }
  });
  $("drClear").addEventListener("click", () => {
    if (DRAW.state !== "ready") return;
    DRAW.composer.newDoc();
    pcMsg("");
    readStructure(true);
  });
  renderDrawPanel();
}

/* =========================================================
   IONES DE FONDO
   [técnica, fórmula, aducto ("ion" = la fórmula ya es el catión), nombre ES, nombre EN, origen ES, origen EN]
   ========================================================= */
const BG_RAW = [
  ["esi+", "C2H3N", "[M+Na]⁺", "Acetonitrilo, aducto sódico", "Acetonitrile, sodium adduct", "Fase móvil", "Mobile phase"],
  ["esi+", "C4H6N2", "[M+H]⁺", "Dímero de acetonitrilo [2ACN+H]⁺", "Acetonitrile dimer [2ACN+H]⁺", "Fase móvil", "Mobile phase"],
  ["esi+", "C2H6OS", "[M+H]⁺", "Dimetilsulfóxido (DMSO)", "Dimethyl sulfoxide (DMSO)", "Disolvente de patrones", "Stock solution solvent"],
  ["esi+", "C2H6OS", "[M+Na]⁺", "Dimetilsulfóxido (DMSO)", "Dimethyl sulfoxide (DMSO)", "Disolvente de patrones", "Stock solution solvent"],
  ["esi+", "C6H15N", "[M+H]⁺", "Trietilamina", "Triethylamine", "Aditivo de fase móvil, arrastre de usos previos", "Mobile phase additive, carry-over from previous use"],
  ["esi+", "CHO2Na2", "ion", "Formiato sódico [HCOONa+Na]⁺", "Sodium formate [HCOONa+Na]⁺", "Clúster de formiato sódico (calibrante, sodio + ácido fórmico)", "Sodium formate cluster (calibrant, sodium + formic acid)"],
  ["esi+", "C2H2O4Na3", "ion", "Formiato sódico [2HCOONa+Na]⁺", "Sodium formate [2HCOONa+Na]⁺", "Clúster de formiato sódico", "Sodium formate cluster"],
  ["esi+", "C3H3O6Na4", "ion", "Formiato sódico [3HCOONa+Na]⁺", "Sodium formate [3HCOONa+Na]⁺", "Clúster de formiato sódico", "Sodium formate cluster"],
  ["esi+", "C8H5O3", "ion", "Fragmento común de ftalatos (anhídrido ftálico protonado)", "Common phthalate fragment (protonated phthalic anhydride)", "Plásticos, tubos, guantes, tapones", "Plastics, tubing, gloves, caps"],
  ["esi+", "C10H15NO2S", "[M+H]⁺", "N-Butilbencenosulfonamida", "N-Butylbenzenesulfonamide", "Plastificante de tubos y conectores de nailon", "Plasticizer in nylon tubing and fittings"],
  ["esi+", "C12H27O4P", "[M+H]⁺", "Fosfato de tributilo", "Tributyl phosphate", "Plastificante, antiespumante", "Plasticizer, antifoam"],
  ["esi+", "C16H22O4", "[M+H]⁺", "Ftalato de dibutilo (DBP)", "Dibutyl phthalate (DBP)", "Plásticos, aire del laboratorio", "Plastics, lab air"],
  ["esi+", "C16H22O4", "[M+Na]⁺", "Ftalato de dibutilo (DBP)", "Dibutyl phthalate (DBP)", "Plásticos, aire del laboratorio", "Plastics, lab air"],
  ["esi+", "C18H15OP", "[M+H]⁺", "Óxido de trifenilfosfina", "Triphenylphosphine oxide", "Subproducto de síntesis, muy ubicuo", "Synthesis by-product, very common"],
  ["esi+", "C18H35NO", "[M+H]⁺", "Oleamida", "Oleamide", "Agente deslizante de plásticos (puntas, tubos Eppendorf)", "Slip agent in plastics (tips, microtubes)"],
  ["esi+", "C21H38N", "ion", "Cloruro de benzalconio C12 (catión)", "Benzalkonium chloride C12 (cation)", "Desinfectantes, jabones de laboratorio", "Disinfectants, lab soaps"],
  ["esi+", "C22H43NO", "[M+H]⁺", "Erucamida", "Erucamide", "Agente deslizante de bolsas y plásticos", "Slip agent in bags and plastics"],
  ["esi+", "C22H43NO", "[M+Na]⁺", "Erucamida", "Erucamide", "Agente deslizante de bolsas y plásticos", "Slip agent in bags and plastics"],
  ["esi+", "C24H38O4", "[M+H]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Bis(2-ethylhexyl) phthalate (DEHP)", "Plásticos de PVC, tubos, guantes", "PVC plastics, tubing, gloves"],
  ["esi+", "C24H38O4", "[M+NH₄]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Bis(2-ethylhexyl) phthalate (DEHP)", "Plásticos de PVC, tubos, guantes", "PVC plastics, tubing, gloves"],
  ["esi+", "C24H38O4", "[M+Na]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Bis(2-ethylhexyl) phthalate (DEHP)", "Plásticos de PVC, tubos, guantes", "PVC plastics, tubing, gloves"],
  ["esi+", "C24H38O4", "[2M+Na]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Bis(2-ethylhexyl) phthalate (DEHP)", "Plásticos de PVC, tubos, guantes", "PVC plastics, tubing, gloves"],
  ["esi+", "C42H63O4P", "[M+H]⁺", "Irgafos 168 oxidado", "Oxidized Irgafos 168", "Antioxidante de polipropileno (viales, tubos)", "Polypropylene antioxidant (vials, tubes)"],
  ["esi+", "C10H30O5Si5", "[M+H]⁺", "Decametilciclopentasiloxano (D5)", "Decamethylcyclopentasiloxane (D5)", "Aire del laboratorio, cosméticos, septos", "Lab air, cosmetics, septa"],
  ["esi+", "C12H36O6Si6", "[M+H]⁺", "Dodecametilciclohexasiloxano (D6)", "Dodecamethylcyclohexasiloxane (D6)", "Aire del laboratorio, cosméticos, septos", "Lab air, cosmetics, septa"],
  ["esi+", "C12H36O6Si6", "[M+NH₄]⁺", "Dodecametilciclohexasiloxano (D6)", "Dodecamethylcyclohexasiloxane (D6)", "Aire del laboratorio, cosméticos, septos", "Lab air, cosmetics, septa"],
  ["esi+", "C14H42O7Si7", "[M+H]⁺", "Tetradecametilcicloheptasiloxano (D7)", "Tetradecamethylcycloheptasiloxane (D7)", "Aire del laboratorio, cosméticos, septos", "Lab air, cosmetics, septa"],
  ["esi-", "CH2O2", "[M−H]⁻", "Formiato", "Formate", "Ácido fórmico de la fase móvil", "Formic acid in the mobile phase"],
  ["esi-", "C2H4O2", "[M−H]⁻", "Acetato", "Acetate", "Ácido acético o acetato amónico", "Acetic acid or ammonium acetate"],
  ["esi-", "C2HF3O2", "[M−H]⁻", "Ácido trifluoroacético (TFA)", "Trifluoroacetic acid (TFA)", "Aditivo de fase móvil; persiste mucho en el sistema", "Mobile phase additive; lingers in the system"],
  ["esi-", "C14H28O2", "[M−H]⁻", "Ácido mirístico", "Myristic acid", "Ácidos grasos: dedos, jabones, plásticos", "Fatty acids: fingers, soaps, plastics"],
  ["esi-", "C16H32O2", "[M−H]⁻", "Ácido palmítico", "Palmitic acid", "Ácidos grasos: dedos, jabones, estearato de los plásticos", "Fatty acids: fingers, soaps, plastic stearates"],
  ["esi-", "C18H34O2", "[M−H]⁻", "Ácido oleico", "Oleic acid", "Ácidos grasos: dedos, jabones, plásticos", "Fatty acids: fingers, soaps, plastics"],
  ["esi-", "C18H36O2", "[M−H]⁻", "Ácido esteárico", "Stearic acid", "Ácidos grasos: estearatos de plásticos", "Fatty acids: plastic stearates"],
  ["esi-", "C12H26O4S", "[M−H]⁻", "Dodecilsulfato (SDS)", "Dodecyl sulfate (SDS)", "Detergentes", "Detergents"],
  ["esi-", "C18H30O3S", "[M−H]⁻", "Ácido dodecilbencenosulfónico (LAS C12)", "Dodecylbenzenesulfonic acid (LAS C12)", "Detergentes", "Detergents"],
  ["esi-", "C8HF15O2", "[M−H]⁻", "PFOA", "PFOA", "Piezas de PTFE del propio equipo; usa columna retardadora para PFAS", "PTFE parts in the instrument; use a delay column for PFAS"],
  ["ei", "H2O", "ion", "Agua", "Water", "Fuga de aire o humedad en el gas portador", "Air leak or moisture in the carrier gas"],
  ["ei", "N2", "ion", "Nitrógeno", "Nitrogen", "Fuga de aire", "Air leak"],
  ["ei", "O2", "ion", "Oxígeno", "Oxygen", "Fuga de aire (si 28/32 ≈ 4, es aire)", "Air leak (28/32 ≈ 4 means air)"],
  ["ei", "Ar", "ion", "Argón", "Argon", "Fuga de aire", "Air leak"],
  ["ei", "CO2", "ion", "Dióxido de carbono", "Carbon dioxide", "Fuga de aire", "Air leak"],
  ["ei", "C2H3O", "ion", "Acetona (fragmento)", "Acetone (fragment)", "Disolvente de limpieza", "Cleaning solvent"],
  ["ei", "C3H6O", "ion", "Acetona (M⁺•)", "Acetone (M⁺•)", "Disolvente de limpieza", "Cleaning solvent"],
  ["ei", "CH2Cl", "ion", "Diclorometano (fragmento)", "Dichloromethane (fragment)", "Disolvente", "Solvent"],
  ["ei", "CH2Cl2", "ion", "Diclorometano (M⁺•)", "Dichloromethane (M⁺•)", "Disolvente", "Solvent"],
  ["ei", "C4H9", "ion", "Hidrocarburos (serie 57, 71, 85…)", "Hydrocarbons (57, 71, 85… series)", "Aceite de bomba, grasa, huellas", "Pump oil, grease, fingerprints"],
  ["ei", "C5H11", "ion", "Hidrocarburos (serie 57, 71, 85…)", "Hydrocarbons (57, 71, 85… series)", "Aceite de bomba, grasa, huellas", "Pump oil, grease, fingerprints"],
  ["ei", "C6H13", "ion", "Hidrocarburos (serie 57, 71, 85…)", "Hydrocarbons (57, 71, 85… series)", "Aceite de bomba, grasa, huellas", "Pump oil, grease, fingerprints"],
  ["ei", "C7H7", "ion", "Ion tropilio", "Tropylium ion", "Tolueno y alquilbencenos", "Toluene and alkylbenzenes"],
  ["ei", "CF3", "ion", "PFTBA (CF₃⁺)", "PFTBA (CF₃⁺)", "Calibrante del autotune", "Autotune calibrant"],
  ["ei", "C4F9", "ion", "PFTBA (C₄F₉⁺)", "PFTBA (C₄F₉⁺)", "Calibrante del autotune", "Autotune calibrant"],
  ["ei", "C9F20N", "ion", "PFTBA (C₉F₂₀N⁺)", "PFTBA (C₉F₂₀N⁺)", "Calibrante del autotune", "Autotune calibrant"],
  ["ei", "C3H9Si", "ion", "Trimetilsililo", "Trimethylsilyl", "Siloxanos, derivados TMS, sangrado", "Siloxanes, TMS derivatives, bleed"],
  ["ei", "C5H15OSi2", "ion", "Pentametildisiloxanilo", "Pentamethyldisiloxanyl", "Derivados TMS, siloxanos", "TMS derivatives, siloxanes"],
  ["ei", "C5H15O3Si3", "ion", "Sangrado de columna (D3 − CH₃)", "Column bleed (D3 − CH₃)", "Fase estacionaria degradada: oxígeno o temperatura alta", "Degraded stationary phase: oxygen or high temperature"],
  ["ei", "C7H21O4Si4", "ion", "Sangrado de columna (D4 − CH₃)", "Column bleed (D4 − CH₃)", "Columna o septo", "Column or septum"],
  ["ei", "C9H27O5Si5", "ion", "Sangrado de septo / columna (D5 − CH₃)", "Septum / column bleed (D5 − CH₃)", "Septo del inyector, liner", "Inlet septum, liner"],
  ["ei", "C11H33O6Si6", "ion", "Sangrado de septo (D6 − CH₃)", "Septum bleed (D6 − CH₃)", "Septo del inyector", "Inlet septum"],
  ["ei", "C8H5O3", "ion", "Fragmento de ftalatos", "Phthalate fragment", "Plásticos, tapones, guantes", "Plastics, caps, gloves"],
];

const BG = BG_RAW.map(([mode, f, ad, nEs, nEn, sEs, sEn]) => {
  const M = parseFormula(f);
  let c, z;
  if (ad === "ion") { c = M; z = 1; }
  else { const def = ADDUCTS.find((a) => a.lab === ad); c = ionCounts(M, def); z = def.z; }
  return { mode, ad, name: [nEs, nEn], src: [sEs, sEn], c, z, mz: mzOf(c, z), neutral: f };
});
for (let n = 4; n <= 14; n++) {
  const f = `C${2 * n}H${4 * n + 2}O${n + 1}`;
  for (const ad of ["[M+H]⁺", "[M+NH₄]⁺", "[M+Na]⁺"]) {
    const def = ADDUCTS.find((a) => a.lab === ad);
    const c = ionCounts(parseFormula(f), def);
    BG.push({ mode: "esi+", ad, name: [`Polietilenglicol (PEG), n = ${n}`, `Polyethylene glycol (PEG), n = ${n}`],
      src: ["Detergentes (Tritón, Tween), cremas de manos, viales; serie separada 44,026", "Detergents (Triton, Tween), hand cream, vials; series spaced by 44.026"], c, z: 1, mz: mzOf(c, 1), neutral: f });
  }
}
BG.sort((a, b) => a.mz - b.mz);

const MODE_LAB = { "esi+": "ESI(+)", "esi-": "ESI(−)", ei: "EI" };

function updateBg() {
  const q = $("bgQuery").value.trim();
  const mode = $("bgMode").value;
  const tolS = $("bgTol").value;
  const target = parseNum(q);
  let rows = BG.filter((r) => mode === "all" || r.mode === mode);
  const isNum = Number.isFinite(target) && /^[\d.,\s]+$/.test(q);
  if (isNum) {
    const tol = (r) => tolS.startsWith("ppm") ? r.mz * Number(tolS.slice(3)) * 1e-6 : Number(tolS.slice(2));
    rows = rows.filter((r) => Math.abs(r.mz - target) <= tol(r)).sort((a, b) => Math.abs(a.mz - target) - Math.abs(b.mz - target));
  } else if (q) {
    const nq = norm(q);
    rows = rows.filter((r) => norm(r.name.join(" ") + " " + r.src.join(" ") + " " + r.neutral).includes(nq));
  }
  $("bgCount").textContent = isNum
    ? (rows.length ? L(`${rows.length} coincidencia(s) para m/z ${target}`, `${rows.length} match(es) for m/z ${target}`) : L(`Nada a m/z ${target} con esa tolerancia. Prueba a ampliarla o cambia de técnica.`, `Nothing at m/z ${target} with that tolerance. Try widening it or changing technique.`))
    : L(`${rows.length} iones${q ? " encontrados" : " en la base de datos"}`, `${rows.length} ions${q ? " found" : " in the database"}`);
  let html = `<thead><tr><th class="num">m/z</th>${isNum ? `<th class="num">Δ</th>` : ""}<th>Ion</th><th>${L("Compuesto", "Compound")}</th><th>${L("Origen probable", "Likely source")}</th></tr></thead><tbody>`;
  for (const r of rows) {
    const d = r.mz - target;
    const dTxt = isNum ? (Math.abs(d) < 0.05 ? `${fmtFix(d / r.mz * 1e6, 1)} ppm` : `${fmtFix(d, 3)} Da`) : "";
    html += `<tr>
      <td class="num">${fmtMz(r.mz, 4)}</td>${isNum ? `<td class="num sub">${dTxt}</td>` : ""}
      <td><span class="badge">${MODE_LAB[r.mode]}</span> ${r.ad === "ion" ? hillHtml(r.c) + "<sup>+</sup>" : r.ad}</td>
      <td>${esc(L(r.name[0], r.name[1]))}${r.ad !== "ion" ? `<div class="sub">${hillHtml(parseFormula(r.neutral))}</div>` : ""}</td>
      <td class="sub">${esc(L(r.src[0], r.src[1]))}</td></tr>`;
  }
  $("bgTable").innerHTML = html + "</tbody>";
}

function initBg() {
  ["bgQuery", "bgMode", "bgTol"].forEach((id) => $(id).addEventListener("input", updateBg));
}

/* =========================================================
   Arranque
   ========================================================= */
function renderAll() {
  applyStatic();
  renderCal();
  renderMass();
  updateBg();
  if (DRAW.state === "ready") readStructure(true); else renderDrawPanel();
}

$("langBtn").addEventListener("click", () => {
  const exCal = CAL_EXAMPLE(), exSmp = SMP_EXAMPLE();
  LANG = LANG === "en" ? "es" : "en";
  store.set("lang", LANG);
  // si los datos de ejemplo siguen sin tocar, se cambian al otro idioma
  if ($("calData").value === exCal) { $("calData").value = CAL_EXAMPLE(); store.set("calData", $("calData").value); }
  if ($("smpData").value === exSmp) { $("smpData").value = SMP_EXAMPLE(); store.set("smpData", $("smpData").value); }
  renderAll();
});

initCal();
initMass();
initDrawUI();
initBg();
renderAll();
route();
