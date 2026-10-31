/* PeakLab: herramientas de química analítica que funcionan en el navegador.
   Sin dependencias externas. Todo el cálculo es local. */
"use strict";

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (id) => document.getElementById(id);

const store = {
  get(k, d) { try { const v = localStorage.getItem("peaklab:" + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("peaklab:" + k, v); } catch (e) { /* sin almacenamiento */ } },
};

// Acepta "0,5", "0.5", "1.234,5", "1e-3"
function parseNum(s) {
  if (s === null || s === undefined) return NaN;
  let t = String(s).trim().replace(/\s/g, "");
  if (!t) return NaN;
  if (t.includes(",") && t.includes(".")) {
    // el último separador es el decimal
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
  // CSV con punto decimal: "0.5,0.029"
  if (parts.length === 1 && parts[0].includes(".") && parts[0].includes(",")) parts = parts[0].split(",");
  return parts;
}

// Formato con coma decimal y cifras significativas
function fmt(x, sig = 4) {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const ax = Math.abs(x);
  if (ax >= 1e6 || ax < 1e-4) {
    const [m, e] = x.toExponential(sig - 1).split("e");
    return m.replace(".", ",") + "·10" + supNum(e);
  }
  const d = Math.max(0, sig - 1 - Math.floor(Math.log10(ax)));
  return x.toFixed(Math.min(d, 10)).replace(".", ",");
}
function fmtFix(x, d) { return Number.isFinite(x) ? x.toFixed(d).replace(".", ",") : "—"; }
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

const VIEWS = ["inicio", "calibrado", "masas", "fondo"];
function route() {
  let id = location.hash.replace("#", "") || "inicio";
  if (!VIEWS.includes(id)) id = "inicio";
  VIEWS.forEach((v) => { $(v).hidden = v !== id; });
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === id));
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

// Cromatograma decorativo de la portada
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
function tickLabel(v, step) {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return v.toFixed(Math.min(d, 6)).replace(".", ",");
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
  if (cfg.lines) for (const L of cfg.lines) {
    const x1 = Math.max(L.x1, xt.lo), x2 = Math.min(L.x2, xt.hi);
    s += `<line class="${L.cls}" x1="${X(x1)}" x2="${X(x2)}" y1="${Y(L.f(x1))}" y2="${Y(L.f(x2))}"/>`;
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
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Error relativo de cada patrón">`;
  s += `<rect class="band" x="${m.l}" width="${pw}" y="${Y(tol)}" height="${Y(-tol) - Y(tol)}"/>`;
  for (const v of yt.ticks) s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 7}" y="${Y(v) + 4}" text-anchor="end">${tickLabel(v, yt.step)}</text>`;
  s += `<line class="zero" x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  s += `<line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${m.t + ph}"/>`;
  items.forEach((it, i) => {
    s += `<line class="gridl" x1="${X(i)}" x2="${X(i)}" y1="${Y(0)}" y2="${Y(it.err)}" style="stroke:var(--line-2)"/>`;
    s += `<circle class="pt ${Math.abs(it.err) > tol ? "out" : ""}" cx="${X(i)}" cy="${Y(it.err)}" r="5"><title>${esc(fmt(it.x) + ": " + fmtFix(it.err, 1) + " %")}</title></circle>`;
    if (n <= 14 || i % Math.ceil(n / 14) === 0) s += `<text class="tick" x="${X(i)}" y="${H - m.b + 17}" text-anchor="middle">${esc(fmt(it.x, 3))}</text>`;
  });
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">Concentración del patrón</text>`;
  s += `<text class="lab" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">Error (%)</text>`;
  el.innerHTML = s + "</svg>";
}

function emptyChart(el, msg) {
  el.innerHTML = `<svg viewBox="0 0 520 300"><text class="empty" x="260" y="150" text-anchor="middle">${esc(msg)}</text></svg>`;
}

/* =========================================================
   CALIBRADO
   ========================================================= */
const CAL_EXAMPLE = `0,5\t0,0291
1\t0,0547
2\t0,1088
5\t0,2632
10\t0,5195
20\t1,0476
50\t2,6031`;
const SMP_EXAMPLE = `Río, punto 1\t0,264
Río, punto 2\t0,081
EDAR efluente\t1,912
Blanco\t0,0012`;

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
  w = w.map((v) => v * n / sw0); // normalizar: Σw = n
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

let CAL = null; // último resultado de calibrado

function updateCal() {
  const { pts: raw, bad } = parsePairs($("calData").value);
  const mode = $("calWeight").value;
  const notes = [];
  let pts = raw;
  if (mode !== "none") {
    const nz = raw.filter((p) => p.x <= 0);
    if (nz.length) notes.push(["warn", `Con ponderación se ignoran los patrones de concentración 0 o negativa (${nz.length}).`]);
    pts = raw.filter((p) => p.x > 0);
  }
  if (bad.length) notes.push(["warn", `No se han podido leer las líneas ${bad.join(", ")}.`]);

  const fit = regress(pts, mode);
  const fitU = mode === "none" ? fit : regress(pts, "none");
  CAL = null;

  if (!fit || pts.length < 3) {
    $("calStats").innerHTML = `<div class="stat wide"><div class="k">Recta</div><div class="v">Introduce al menos 3 patrones</div></div>`;
    emptyChart($("calChart"), "Faltan patrones");
    emptyChart($("resChart"), "Faltan patrones");
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
  $("calStats").innerHTML = `
    <div class="stat wide eq"><div class="k">Recta${mode !== "none" ? " (ponderada " + (mode === "x" ? "1/x" : "1/x²") + ")" : ""}</div>
      <div class="v">y = ${fmt(fit.b, 5)}·x ${sign} ${fmt(Math.abs(fit.a), 4)}</div></div>
    <div class="stat"><div class="k">R²</div><div class="v">${fmtFix(fit.r2, 5)}</div><div class="s">r = ${fmtFix(Math.sqrt(Math.max(fit.r2, 0)), 5)}</div></div>
    <div class="stat"><div class="k">Patrones</div><div class="v">${fit.n}</div><div class="s">${fmt(xMin, 3)} – ${fmt(xMax, 3)} ${esc(CAL.unitTxt)}</div></div>
    <div class="stat"><div class="k">Pendiente ± IC 95 %</div><div class="v">${fmt(fit.b, 4)}</div><div class="s">± ${fmt(t * fit.sb, 2)}</div></div>
    <div class="stat"><div class="k">Ordenada ± IC 95 %</div><div class="v">${fmt(fit.a, 3)}</div><div class="s">± ${fmt(t * fit.sa, 2)}</div></div>
    <div class="stat"><div class="k">LOD (3,3·s<sub>y/x</sub>/b)</div><div class="v">${fmt(lod, 3)}</div><div class="s">${esc(CAL.unitTxt)}</div></div>
    <div class="stat"><div class="k">LOQ (10·s<sub>y/x</sub>/b)</div><div class="v">${fmt(loq, 3)}</div><div class="s">${esc(CAL.unitTxt)}</div></div>
    <div class="stat wide"><div class="k">Desviación estándar residual (s<sub>y/x</sub>)</div><div class="v">${fmt(fit.s, 3)}</div></div>`;

  // Avisos
  const ciA = t * fit.sa;
  if (Math.abs(fit.a) <= ciA) notes.push(["good", "La ordenada en el origen no es significativamente distinta de 0 (su IC 95 % incluye el cero)."]);
  else notes.push(["", "La ordenada en el origen es significativamente distinta de 0: revisa el blanco o posibles interferencias."]);
  const outs = resid.filter((r) => Math.abs(r.err) > 20);
  if (outs.length) notes.push(["warn", `${outs.length} patrón(es) con error recalculado mayor de ±20 %: ${outs.map((o) => fmt(o.x, 3)).join(", ")}. Si los errores grandes se concentran en los patrones bajos, prueba la ponderación 1/x o 1/x².`]);
  else notes.push(["good", "Todos los patrones se recalculan dentro de ±20 %."]);
  if (fit.r2 < 0.99) notes.push(["warn", "R² < 0,99. Ojo: el R² por sí solo no demuestra linealidad; mira el gráfico de residuales."]);
  if (lod > xMin) notes.push(["warn", "El LOD estimado queda por encima del patrón más bajo: el primer patrón no aporta información fiable."]);
  notes.push(["", "LOD y LOQ se calculan con la recta sin ponderar (método de la desviación residual, ICH Q2). Confírmalos con patrones a esas concentraciones."]);
  $("calWarn").innerHTML = notes.map(([c, tx]) => `<div class="note ${c}">${esc(tx)}</div>`).join("");

  plotXY($("calChart"), {
    xMin: Math.min(0, xMin), xMax, yMin: Math.min(0, yMin, fit.a), yMax,
    xLabel: `Concentración (${CAL.unitTxt})`, yLabel: "Respuesta", aria: "Recta de calibrado",
    lines: [{ cls: "fit", x1: Math.min(0, xMin), x2: xMax, f: (x) => fit.a + fit.b * x }],
    points: pts.map((p) => ({ x: p.x, y: p.y, cls: Math.abs(((p.y - fit.a) / fit.b - p.x) / (p.x || 1) * 100) > 20 && p.x ? "out" : "", title: `${fmt(p.x)} → ${fmt(p.y)}` })),
  });
  if (resid.length) plotResiduals($("resChart"), resid, 20); else emptyChart($("resChart"), "Sin patrones distintos de 0");

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
  let html = `<thead><tr><th>Muestra</th><th class="num">Respuesta</th><th class="num">En el extracto (${esc(CAL.unitTxt)})</th><th class="num">En la muestra</th><th>Estado</th></tr></thead><tbody>`;
  for (const line of lines) {
    const parts = splitLine(line);
    const y = parseNum(parts[parts.length - 1]);
    const name = parts.length > 1 ? parts.slice(0, -1).join(" ") : "—";
    if (!Number.isFinite(y)) { html += `<tr><td>${esc(line)}</td><td colspan="4" class="sub">No se encuentra la respuesta</td></tr>`; continue; }
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
    if (y > CAL.yMax * 1.0001) tags.push(`<span class="pill warn">Por encima del rango: diluye</span>`);
    else if (y < CAL.yMin && x >= CAL.lod) tags.push(`<span class="pill warn">Por debajo del patrón más bajo</span>`);
    if (!tags.length) tags.push(`<span class="pill good">En rango</span>`);
    html += `<tr><td>${esc(name)}</td><td class="num">${fmt(y)}</td>
      <td class="num">${fmt(x)}${Number.isFinite(ci) ? `<div class="sub">± ${fmt(ci, 2)}</div>` : ""}</td>
      <td class="num">${x < CAL.lod ? "—" : fmt(vFinal) + " " + uFinal}${Number.isFinite(ciFinal) && x >= CAL.lod ? `<div class="sub">± ${fmt(ciFinal, 2)}</div>` : ""}</td>
      <td>${tags.join(" ")}</td></tr>`;
  }
  html += `</tbody>`;
  if (factor !== 1) html += `<caption class="sub" style="caption-side:bottom;text-align:left;padding-top:8px">Factor aplicado: ${fmt(factor, 4)} (preconcentración ×${fmt(1 / factor, 4)})${CAL.mode === "none" ? " · ± = intervalo de confianza al 95 % de la interpolación" : " · Con ponderación no se calcula el IC de la interpolación"}</caption>`;
  else if (CAL.mode === "none") html += `<caption class="sub" style="caption-side:bottom;text-align:left;padding-top:8px">± = intervalo de confianza al 95 % de la interpolación</caption>`;
  tbl.innerHTML = html;
}

function updateME() {
  const s = parseNum($("meSolv").value), mtx = parseNum($("meMat").value);
  const out = $("meOut");
  if (!Number.isFinite(s) || !Number.isFinite(mtx) || s === 0) { out.innerHTML = ""; return; }
  const me = (mtx / s - 1) * 100;
  const a = Math.abs(me);
  const [cls, txt] = a <= 20 ? ["good", "Efecto matriz suave (≤ 20 %): puedes calibrar en disolvente."] :
    a <= 50 ? ["warn", "Efecto matriz medio (20–50 %): calibra en matriz o usa patrón interno marcado."] :
      ["bad", "Efecto matriz fuerte (> 50 %): calibrado en matriz, patrón interno isotópico o adiciones estándar."];
  out.innerHTML = `<span class="big">${me > 0 ? "+" : ""}${fmtFix(me, 1)} %</span>${me < 0 ? "Supresión" : "Aumento"} de señal. <div class="note ${cls}" style="margin-top:6px">${txt}</div>`;
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
    html += `Recuperación media de ${rec.length} réplicas · RSD = ${fmtFix(rsd, 1)} %`;
    ok = ok && rsd <= 20;
  } else html += `Una sola réplica: añade más para calcular la RSD.`;
  html += `<div class="note ${ok ? "good" : "warn"}" style="margin-top:6px">${ok ? "Dentro de lo habitual (70–120 %, RSD ≤ 20 %; SANTE)." : "Fuera del intervalo habitual de 70–120 % con RSD ≤ 20 % (SANTE)."}</div>`;
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
  out.innerHTML = `<span class="big">${dev > 0 ? "+" : ""}${fmtFix(dev, 1)} %</span>Relación en el patrón ${fmtFix(rs * 100, 1)} % · en la muestra ${fmtFix(rm * 100, 1)} %<br>Intervalo aceptable: ${fmtFix(rs * (1 - tol / 100) * 100, 1)} – ${fmtFix(rs * (1 + tol / 100) * 100, 1)} %
    <div class="note ${ok ? "good" : "bad"}" style="margin-top:6px">${ok ? "Cumple: identificación confirmada por la relación de iones." : "No cumple: no se puede confirmar la identidad con estas transiciones."}</div>`;
}

function initCal() {
  const fields = ["calData", "smpData", "smpVs", "smpVf", "smpDil", "smpRep", "calUnit", "calWeight", "meMat", "recAdd", "recBlank", "recRep", "irStdQ", "irStdC", "irSmpQ", "irSmpC", "irTol"];
  for (const id of fields) {
    const v = store.get(id, null);
    if (v !== null) $(id).value = v;
  }
  if (!$("calData").value.trim()) $("calData").value = CAL_EXAMPLE;
  if (store.get("smpData", null) === null) $("smpData").value = SMP_EXAMPLE;
  for (const id of fields) $(id).addEventListener("input", () => { store.set(id, $(id).value); onCalInput(id); });
  $("meSolv").addEventListener("input", () => { $("meSolv").dataset.touched = "1"; updateME(); });
  $("calExample").addEventListener("click", () => {
    $("calData").value = CAL_EXAMPLE; $("smpData").value = SMP_EXAMPLE;
    $("smpVs").value = "500"; $("smpVf").value = "1"; $("smpDil").value = "1";
    ["calData", "smpData", "smpVs", "smpVf", "smpDil"].forEach((id) => store.set(id, $(id).value));
    updateCal();
  });
  $("calClear").addEventListener("click", () => {
    $("calData").value = ""; $("smpData").value = "";
    store.set("calData", ""); store.set("smpData", "");
    updateCal();
  });
  updateCal(); updateRec(); updateIR();
}
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

function parseFormula(str) {
  const s = str.replace(/\s+/g, "").replace(/[·•]/g, "");
  if (!s) throw new Error("Escribe una fórmula");
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
        if (s[i] !== ")" && s[i] !== "]") throw new Error("Falta cerrar un paréntesis");
        i++;
        const k = num();
        for (const [el, n] of Object.entries(inner)) counts[el] = (counts[el] || 0) + n * k;
      } else if (c === ")" || c === "]") {
        return counts;
      } else if (/[A-Z]/.test(c)) {
        let el = c; i++;
        if (i < s.length && /[a-z]/.test(s[i])) { el += s[i]; i++; }
        if (!ISO[el]) throw new Error(`Elemento no reconocido: ${el}`);
        const n = num();
        counts[el] = (counts[el] || 0) + n;
      } else {
        throw new Error(`Carácter no válido: «${c}»`);
      }
    }
    return counts;
  }
  const out = group();
  if (i < s.length) throw new Error("Paréntesis sin abrir");
  for (const k of Object.keys(out)) if (!out[k]) delete out[k];
  if (!Object.keys(out).length) throw new Error("Fórmula vacía");
  return out;
}

function monoMass(c) { return Object.entries(c).reduce((s, [el, n]) => s + MONO[el] * n, 0); }
function avgMass(c) { return Object.entries(c).reduce((s, [el, n]) => s + AVG[el] * n, 0); }

// Orden de Hill: C, H, luego alfabético (si no hay C, todo alfabético)
function hill(c) {
  const els = Object.keys(c).filter((e) => c[e] > 0);
  const order = [];
  if (c.C) { order.push("C"); if (c.H) order.push("H"); if (c.D) order.push("D"); }
  els.filter((e) => !order.includes(e)).sort().forEach((e) => order.push(e));
  return order.map((e) => e + (c[e] > 1 ? c[e] : "")).join("");
}
function hillHtml(c) { return hill(c).replace(/(\d+)/g, "<sub>$1</sub>"); }

function addCounts(a, b, k = 1) {
  const r = { ...a };
  for (const [el, n] of Object.entries(b)) r[el] = (r[el] || 0) + n * k;
  return r;
}
function scaleCounts(a, k) { const r = {}; for (const [el, n] of Object.entries(a)) r[el] = n * k; return r; }

// Patrón isotópico por convolución, agrupado por masa nominal
function isotopePattern(counts) {
  // Cada entrada: clave = masa redondeada a 1 mDa; valor = [intensidad, Σ masa·intensidad]
  let dist = new Map([[0, [1, 0]]]);
  let shift = 0;
  for (const [el, n] of Object.entries(counts)) {
    const iso = ISO[el];
    if (iso.length === 1) { shift += iso[0][0] * n; continue; } // monoisotópico: solo desplaza
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
  const groups = new Map();
  for (const [, [v, mv]] of dist) {
    const m = mv / v + shift;
    const g = Math.round(m - mono);
    const cur = groups.get(g) || { m: 0, i: 0 };
    cur.m += m * v; cur.i += v;
    groups.set(g, cur);
  }
  let arr = [...groups.entries()].map(([g, o]) => ({ off: g, m: o.m / o.i, i: o.i })).sort((a, b) => a.off - b.off);
  const mx = Math.max(...arr.map((p) => p.i));
  arr = arr.map((p) => ({ ...p, rel: p.i / mx * 100 })).filter((p) => p.rel >= 0.05);
  return arr;
}

// Aductos: n·M + suma − resta, carga z
const ADDUCTS = [
  { grp: "ESI positivo", lab: "[M+H]⁺", n: 1, add: "H", z: 1 },
  { grp: "ESI positivo", lab: "[M+NH₄]⁺", n: 1, add: "NH4", z: 1 },
  { grp: "ESI positivo", lab: "[M+Na]⁺", n: 1, add: "Na", z: 1 },
  { grp: "ESI positivo", lab: "[M+K]⁺", n: 1, add: "K", z: 1 },
  { grp: "ESI positivo", lab: "[M+H−H₂O]⁺", n: 1, add: "H", sub: "H2O", z: 1 },
  { grp: "ESI positivo", lab: "[M+CH₃CN+H]⁺", n: 1, add: "C2H4N", z: 1 },
  { grp: "ESI positivo", lab: "[M+2H]²⁺", n: 1, add: "H2", z: 2 },
  { grp: "ESI positivo", lab: "[2M+H]⁺", n: 2, add: "H", z: 1 },
  { grp: "ESI positivo", lab: "[2M+Na]⁺", n: 2, add: "Na", z: 1 },
  { grp: "ESI negativo", lab: "[M−H]⁻", n: 1, sub: "H", z: -1 },
  { grp: "ESI negativo", lab: "[M+Cl]⁻", n: 1, add: "Cl", z: -1 },
  { grp: "ESI negativo", lab: "[M+HCOO]⁻", n: 1, add: "CHO2", z: -1 },
  { grp: "ESI negativo", lab: "[M+CH₃COO]⁻", n: 1, add: "C2H3O2", z: -1 },
  { grp: "ESI negativo", lab: "[M−H−H₂O]⁻", n: 1, sub: "H3O", z: -1 },
  { grp: "ESI negativo", lab: "[M−2H]²⁻", n: 1, sub: "H2", z: -2 },
  { grp: "ESI negativo", lab: "[2M−H]⁻", n: 2, sub: "H", z: -1 },
  { grp: "EI / APCI", lab: "M⁺• (EI)", n: 1, z: 1 },
  { grp: "EI / APCI", lab: "M⁻• (captura electrónica)", n: 1, z: -1 },
];

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
  ["Carbamazepina", "C15H12N2O"], ["Carbamazepina-d10", "C15H2D10N2O"], ["Cafeína", "C8H10N4O2"],
  ["Atrazina", "C8H14ClN5"], ["Triclosán", "C12H7Cl3O2"], ["BDE-47", "C12H6Br4O"],
  ["PFOA", "C8HF15O2"], ["Glifosato", "C3H8NO5P"], ["Ác. dimetilarsínico", "C2H7AsO2"], ["DEHP", "C24H38O4"],
];
let MASS = { M: null, ions: [], sel: 0 };

function updateMass() {
  const box = $("fmSummary");
  let M;
  try { M = parseFormula($("fmInput").value); }
  catch (e) {
    box.innerHTML = `<div class="note warn err">${esc(e.message)}</div>`;
    $("adTable").innerHTML = ""; $("isoTable").innerHTML = ""; emptyChart($("isoChart"), "—"); $("isoLabel").textContent = ""; $("ppmOut").innerHTML = "";
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
    <div class="stat"><div class="k">Fórmula (Hill)</div><div class="v">${hillHtml(M)}</div></div>
    <div class="stat"><div class="k">Masa monoisotópica</div><div class="v">${fmtMz(mono, 5)}</div><div class="s">Da</div></div>
    <div class="stat"><div class="k">Masa molar media</div><div class="v">${fmtMz(avg, 3)}</div><div class="s">g/mol</div></div>
    <div class="stat"><div class="k">Insaturaciones (DBE)</div><div class="v">${Number.isInteger(dbe) ? dbe : fmtFix(dbe, 1)}</div><div class="s">${nomOdd ? "masa nominal impar → nº impar de N" : "masa nominal par → nº par de N (o ninguno)"}</div></div>`;

  MASS.M = M;
  MASS.ions = ADDUCTS.map((ad) => { const c = ionCounts(M, ad); return c ? { ...ad, c, mz: mzOf(c, ad.z) } : null; }).filter(Boolean);
  if (MASS.sel >= MASS.ions.length) MASS.sel = 0;
  let html = `<thead><tr><th>Ion</th><th class="num">m/z</th><th>Fórmula del ion</th></tr></thead><tbody>`;
  let g = "";
  MASS.ions.forEach((ion, idx) => {
    if (ion.grp !== g) { g = ion.grp; html += `<tr class="grp"><td colspan="3">${g}</td></tr>`; }
    html += `<tr data-i="${idx}" class="${idx === MASS.sel ? "sel" : ""}"><td>${ion.lab}</td><td class="num">${fmtMz(ion.mz, 4)}</td><td class="sub">${hillHtml(ion.c)}</td></tr>`;
  });
  $("adTable").innerHTML = html + "</tbody>";
  updateIso();
}

function updateIso() {
  const ion = MASS.ions[MASS.sel];
  if (!ion) return;
  $("isoLabel").textContent = ion.lab;
  const pat = isotopePattern(ion.c);
  const z = Math.abs(ion.z);
  const peaks = pat.map((p) => ({ mz: (p.m - ion.z * E_MASS) / z, rel: p.rel, off: p.off }));
  // gráfico de barras
  const shown = peaks.filter((p) => p.rel >= 0.3).slice(0, 12);
  const W = 520, H = 230, m = { l: 40, r: 10, t: 20, b: 40 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const lo = shown[0].mz - 1 / z, hi = shown[shown.length - 1].mz + 1 / z;
  const Xs = (v) => m.l + (v - lo) / (hi - lo) * pw, Ys = (v) => m.t + ph - v / 100 * ph;
  const bw = Math.max(6, Math.min(26, pw / ((hi - lo) * z) * 0.35));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Patrón isotópico">`;
  for (const v of [0, 25, 50, 75, 100]) s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${Ys(v)}" y2="${Ys(v)}"/><text class="tick" x="${m.l - 6}" y="${Ys(v) + 4}" text-anchor="end">${v}</text>`;
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Ys(0)}" y2="${Ys(0)}"/>`;
  for (const p of shown) {
    s += `<rect class="bar" x="${Xs(p.mz) - bw / 2}" y="${Ys(p.rel)}" width="${bw}" height="${Ys(0) - Ys(p.rel)}" rx="2"><title>${fmtMz(p.mz)} · ${fmtFix(p.rel, 1)} %</title></rect>`;
    s += `<text class="barlab" x="${Xs(p.mz)}" y="${Ys(p.rel) - 5}" text-anchor="middle">${p.rel >= 99.95 ? "100" : fmtFix(p.rel, p.rel < 10 ? 1 : 0)}</text>`;
    s += `<text class="tick" x="${Xs(p.mz)}" y="${H - m.b + 16}" text-anchor="middle">${fmtMz(p.mz, z > 1 ? 2 : 1)}</text>`;
  }
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 4}" text-anchor="middle">m/z</text></svg>`;
  $("isoChart").innerHTML = s;
  const step = z > 1 ? `/${z}` : "";
  $("isoTable").innerHTML = `<thead><tr><th>Pico</th><th class="num">m/z</th><th class="num">Abundancia relativa</th></tr></thead><tbody>` +
    peaks.filter((p) => p.rel >= 0.1).slice(0, 10).map((p) => `<tr><td>M${p.off ? "+" + p.off + step : ""}</td><td class="num">${fmtMz(p.mz, 4)}</td><td class="num">${fmtFix(p.rel, 2)} %</td></tr>`).join("") + `</tbody>`;
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
  let html = `<span class="big">${ppm > 0 ? "+" : ""}${fmtFix(ppm, 2)} ppm</span>Δ = ${mda > 0 ? "+" : ""}${fmtFix(mda, 2)} mDa respecto a ${ion.lab} (${fmtMz(ion.mz)}) <span class="pill ${cls}">${a <= 5 ? "≤ 5 ppm" : a <= 10 ? "≤ 10 ppm" : "> 10 ppm"}</span>`;
  const near = MASS.ions.map((i) => ({ i, d: Math.abs(meas - i.mz) })).sort((x, y) => x.d - y.d)[0];
  if (near.i !== ion && Math.abs(near.d / near.i.mz * 1e6) < Math.min(a, 20)) html += `<div class="note warn" style="margin-top:6px">Encaja mejor con ${near.i.lab} (${fmtMz(near.i.mz)}, ${fmtFix((meas - near.i.mz) / near.i.mz * 1e6, 1)} ppm).</div>`;
  out.innerHTML = html;
}

function initMass() {
  $("fmChips").innerHTML = EXAMPLES.map(([n, f]) => `<button type="button" class="chip" data-f="${f}">${esc(n)}</button>`).join("");
  $("fmChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    $("fmInput").value = b.dataset.f; MASS.sel = 0; updateMass();
  });
  const saved = store.get("formula", "");
  if (saved) $("fmInput").value = saved;
  $("fmInput").addEventListener("input", updateMass);
  $("adTable").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-i]"); if (!tr) return;
    MASS.sel = Number(tr.dataset.i);
    document.querySelectorAll("#adTable tr.sel").forEach((r) => r.classList.remove("sel"));
    tr.classList.add("sel");
    updateIso();
  });
  $("ppmMeas").addEventListener("input", updatePpm);
  updateMass();
}

/* =========================================================
   IONES DE FONDO
   f: fórmula de la especie neutra (o del ion si ad = "ion")
   ========================================================= */
const BG_RAW = [
  // ---- LC-ESI positivo
  ["esi+", "C2H3N", "[M+Na]⁺", "Acetonitrilo, aducto sódico", "Fase móvil"],
  ["esi+", "C4H6N2", "[M+H]⁺", "Dímero de acetonitrilo [2ACN+H]⁺", "Fase móvil"],
  ["esi+", "C2H6OS", "[M+H]⁺", "Dimetilsulfóxido (DMSO)", "Disolvente de patrones"],
  ["esi+", "C2H6OS", "[M+Na]⁺", "Dimetilsulfóxido (DMSO)", "Disolvente de patrones"],
  ["esi+", "C6H15N", "[M+H]⁺", "Trietilamina", "Aditivo de fase móvil, arrastre de usos previos"],
  ["esi+", "CHO2Na2", "ion", "Formiato sódico [HCOONa+Na]⁺", "Clúster de formiato sódico (calibrante, sodio + ácido fórmico)"],
  ["esi+", "C2H2O4Na3", "ion", "Formiato sódico [2HCOONa+Na]⁺", "Clúster de formiato sódico"],
  ["esi+", "C3H3O6Na4", "ion", "Formiato sódico [3HCOONa+Na]⁺", "Clúster de formiato sódico"],
  ["esi+", "C8H5O3", "ion", "Fragmento común de ftalatos (anhídrido ftálico protonado)", "Plásticos, tubos, guantes, tapones"],
  ["esi+", "C10H15NO2S", "[M+H]⁺", "N-Butilbencenosulfonamida", "Plastificante de tubos y conectores de nailon"],
  ["esi+", "C12H27O4P", "[M+H]⁺", "Fosfato de tributilo", "Plastificante, antiespumante"],
  ["esi+", "C16H22O4", "[M+H]⁺", "Ftalato de dibutilo (DBP)", "Plásticos, aire del laboratorio"],
  ["esi+", "C16H22O4", "[M+Na]⁺", "Ftalato de dibutilo (DBP)", "Plásticos, aire del laboratorio"],
  ["esi+", "C18H15OP", "[M+H]⁺", "Óxido de trifenilfosfina", "Subproducto de síntesis, muy ubicuo"],
  ["esi+", "C18H35NO", "[M+H]⁺", "Oleamida", "Agente deslizante de plásticos (puntas, tubos Eppendorf)"],
  ["esi+", "C21H38N", "ion", "Cloruro de benzalconio C12 (catión)", "Desinfectantes, jabones de laboratorio"],
  ["esi+", "C22H43NO", "[M+H]⁺", "Erucamida", "Agente deslizante de bolsas y plásticos"],
  ["esi+", "C22H43NO", "[M+Na]⁺", "Erucamida", "Agente deslizante de bolsas y plásticos"],
  ["esi+", "C24H38O4", "[M+H]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Plásticos de PVC, tubos, guantes"],
  ["esi+", "C24H38O4", "[M+NH₄]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Plásticos de PVC, tubos, guantes"],
  ["esi+", "C24H38O4", "[M+Na]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Plásticos de PVC, tubos, guantes"],
  ["esi+", "C24H38O4", "[2M+Na]⁺", "Ftalato de bis(2-etilhexilo) (DEHP)", "Plásticos de PVC, tubos, guantes"],
  ["esi+", "C42H63O4P", "[M+H]⁺", "Irgafos 168 oxidado", "Antioxidante de polipropileno (viales, tubos)"],
  ["esi+", "C10H30O5Si5", "[M+H]⁺", "Decametilciclopentasiloxano (D5)", "Aire del laboratorio, cosméticos, septos"],
  ["esi+", "C12H36O6Si6", "[M+H]⁺", "Dodecametilciclohexasiloxano (D6)", "Aire del laboratorio, cosméticos, septos"],
  ["esi+", "C12H36O6Si6", "[M+NH₄]⁺", "Dodecametilciclohexasiloxano (D6)", "Aire del laboratorio, cosméticos, septos"],
  ["esi+", "C14H42O7Si7", "[M+H]⁺", "Tetradecametilcicloheptasiloxano (D7)", "Aire del laboratorio, cosméticos, septos"],
  // ---- LC-ESI negativo
  ["esi-", "CH2O2", "[M−H]⁻", "Formiato", "Ácido fórmico de la fase móvil"],
  ["esi-", "C2H4O2", "[M−H]⁻", "Acetato", "Ácido acético o acetato amónico"],
  ["esi-", "C2HF3O2", "[M−H]⁻", "Ácido trifluoroacético (TFA)", "Aditivo de fase móvil; persiste mucho en el sistema"],
  ["esi-", "C14H28O2", "[M−H]⁻", "Ácido mirístico", "Ácidos grasos: dedos, jabones, plásticos"],
  ["esi-", "C16H32O2", "[M−H]⁻", "Ácido palmítico", "Ácidos grasos: dedos, jabones, estearato de los plásticos"],
  ["esi-", "C18H34O2", "[M−H]⁻", "Ácido oleico", "Ácidos grasos: dedos, jabones, plásticos"],
  ["esi-", "C18H36O2", "[M−H]⁻", "Ácido esteárico", "Ácidos grasos: estearatos de plásticos"],
  ["esi-", "C12H26O4S", "[M−H]⁻", "Dodecilsulfato (SDS)", "Detergentes"],
  ["esi-", "C18H30O3S", "[M−H]⁻", "Ácido dodecilbencenosulfónico (LAS C12)", "Detergentes"],
  ["esi-", "C8HF15O2", "[M−H]⁻", "PFOA", "Piezas de PTFE del propio equipo; usa columna retardadora para PFAS"],
  // ---- GC-EI
  ["ei", "H2O", "ion", "Agua", "Fuga de aire o humedad en el gas portador"],
  ["ei", "N2", "ion", "Nitrógeno", "Fuga de aire"],
  ["ei", "O2", "ion", "Oxígeno", "Fuga de aire (si 28/32 ≈ 4, es aire)"],
  ["ei", "Ar", "ion", "Argón", "Fuga de aire"],
  ["ei", "CO2", "ion", "Dióxido de carbono", "Fuga de aire"],
  ["ei", "C2H3O", "ion", "Acetona (fragmento)", "Disolvente de limpieza"],
  ["ei", "C3H6O", "ion", "Acetona (M⁺•)", "Disolvente de limpieza"],
  ["ei", "CH2Cl", "ion", "Diclorometano (fragmento)", "Disolvente"],
  ["ei", "CH2Cl2", "ion", "Diclorometano (M⁺•)", "Disolvente"],
  ["ei", "C4H9", "ion", "Hidrocarburos (serie 57, 71, 85…)", "Aceite de bomba, grasa, huellas"],
  ["ei", "C5H11", "ion", "Hidrocarburos (serie 57, 71, 85…)", "Aceite de bomba, grasa, huellas"],
  ["ei", "C6H13", "ion", "Hidrocarburos (serie 57, 71, 85…)", "Aceite de bomba, grasa, huellas"],
  ["ei", "C7H7", "ion", "Ion tropilio", "Tolueno y alquilbencenos"],
  ["ei", "CF3", "ion", "PFTBA (CF₃⁺)", "Calibrante del autotune"],
  ["ei", "C4F9", "ion", "PFTBA (C₄F₉⁺)", "Calibrante del autotune"],
  ["ei", "C9F20N", "ion", "PFTBA (C₉F₂₀N⁺)", "Calibrante del autotune"],
  ["ei", "C3H9Si", "ion", "Trimetilsililo", "Siloxanos, derivados TMS, sangrado"],
  ["ei", "C5H15OSi2", "ion", "Pentametildisiloxanilo", "Derivados TMS, siloxanos"],
  ["ei", "C5H15O3Si3", "ion", "Sangrado de columna (D3 − CH₃)", "Fase estacionaria degradada: oxígeno o temperatura alta"],
  ["ei", "C7H21O4Si4", "ion", "Sangrado de columna (D4 − CH₃)", "Columna o septo"],
  ["ei", "C9H27O5Si5", "ion", "Sangrado de septo / columna (D5 − CH₃)", "Septo del inyector, liner"],
  ["ei", "C11H33O6Si6", "ion", "Sangrado de septo (D6 − CH₃)", "Septo del inyector"],
  ["ei", "C8H5O3", "ion", "Fragmento de ftalatos", "Plásticos, tapones, guantes"],
];

const BG = BG_RAW.map(([mode, f, ad, name, src]) => {
  const M = parseFormula(f);
  let c, z;
  if (ad === "ion") { c = M; z = 1; }
  else {
    const def = ADDUCTS.find((a) => a.lab === ad);
    c = ionCounts(M, def); z = def.z;
  }
  return { mode, ad: ad === "ion" ? "ion" : ad, name, src, c, z, mz: mzOf(c, z), neutral: f };
}).sort((a, b) => a.mz - b.mz);

// Serie de PEG: HO(C2H4O)nH
for (let n = 4; n <= 14; n++) {
  const f = `C${2 * n}H${4 * n + 2}O${n + 1}`;
  for (const ad of ["[M+H]⁺", "[M+NH₄]⁺", "[M+Na]⁺"]) {
    const def = ADDUCTS.find((a) => a.lab === ad);
    const c = ionCounts(parseFormula(f), def);
    BG.push({ mode: "esi+", ad, name: `Polietilenglicol (PEG), n = ${n}`, src: "Detergentes (Tritón, Tween), cremas de manos, viales; serie separada 44,026", c, z: 1, mz: mzOf(c, 1), neutral: f });
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
  let isNum = Number.isFinite(target) && /^[\d.,\s]+$/.test(q);
  if (isNum) {
    const tol = (r) => tolS.startsWith("ppm") ? r.mz * Number(tolS.slice(3)) * 1e-6 : Number(tolS.slice(2));
    rows = rows.filter((r) => Math.abs(r.mz - target) <= tol(r)).sort((a, b) => Math.abs(a.mz - target) - Math.abs(b.mz - target));
  } else if (q) {
    const nq = norm(q);
    rows = rows.filter((r) => norm(r.name + " " + r.src + " " + r.neutral).includes(nq));
  }
  $("bgCount").textContent = isNum
    ? (rows.length ? `${rows.length} coincidencia(s) para m/z ${target}` : `Nada a m/z ${target} con esa tolerancia. Prueba a ampliarla o cambia de técnica.`)
    : `${rows.length} iones${q ? " encontrados" : " en la base de datos"}`;
  let html = `<thead><tr><th class="num">m/z</th>${isNum ? `<th class="num">Δ</th>` : ""}<th>Ion</th><th>Compuesto</th><th>Origen probable</th></tr></thead><tbody>`;
  for (const r of rows) {
    const d = r.mz - target;
    const dTxt = isNum ? (Math.abs(d) < 0.05 ? `${fmtFix(d / r.mz * 1e6, 1)} ppm` : `${fmtFix(d, 3)} Da`) : "";
    html += `<tr>
      <td class="num">${fmtMz(r.mz, 4)}</td>${isNum ? `<td class="num sub">${dTxt}</td>` : ""}
      <td><span class="badge">${MODE_LAB[r.mode]}</span> ${r.ad === "ion" ? hillHtml(r.c) + "<sup>+</sup>" : r.ad}</td>
      <td>${esc(r.name)}${r.ad !== "ion" ? `<div class="sub">${hillHtml(parseFormula(r.neutral))}</div>` : ""}</td>
      <td class="sub">${esc(r.src)}</td></tr>`;
  }
  $("bgTable").innerHTML = html + "</tbody>";
}

function initBg() {
  ["bgQuery", "bgMode", "bgTol"].forEach((id) => $(id).addEventListener("input", updateBg));
  updateBg();
}

/* =========================================================
   Arranque
   ========================================================= */
initCal();
initMass();
initBg();
route();
