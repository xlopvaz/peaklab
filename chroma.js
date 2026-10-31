/* PeakLab · Simulador de cromatogramas (HPLC y GC).
   Modelos simplificados pero físicos:
   - HPLC: fuerza disolvente lineal (log k = log kw − S·φ), migración del soluto integrada
     numéricamente con el gradiente retrasado por el volumen de retardo; anchura por van Deemter;
     presión por Darcy con la viscosidad de la mezcla agua/orgánico.
   - GC: índice de retención → n-alcano equivalente → k(T) por van 't Hoff; migración integrada
     con el programa de temperatura; anchura por Golay; presión de cabeza por Poiseuille.
   Usa las utilidades globales de script.js ($, L, fmt, fmtFix, parseNum, store, niceTicks, esc). */
"use strict";

const CH_EN = {
  "nav.chrom": "Chromatography",
  "ch.h1": "Chromatogram simulator",
  "ch.intro": "Change the column, gradient or temperature ramp and watch how peaks move, how well they separate and what pressure you would get. It is a simplified physical model: good for understanding and for steering a method, not for replacing experiments.",
  "ch.column": "Column", "ch.len": "Length (mm)", "ch.lenm": "Length (m)", "ch.id": "Internal diameter (mm)", "ch.dp": "Particle size (µm)", "ch.df": "Film thickness (µm)",
  "ch.mp": "Mobile phase and gradient", "ch.org": "Solvent B", "ch.acn": "Acetonitrile", "ch.meoh": "Methanol", "ch.flow": "Flow (mL/min)", "ch.dwell": "Dwell volume (mL)",
  "ch.b0": "Initial % B", "ch.b1": "Final % B", "ch.hold0": "Initial hold (min)", "ch.tg": "Gradient time (min)", "ch.hold1": "Final wash (min)",
  "ch.isoHint": "For an isocratic method, set the same initial and final % B.",
  "ch.cmp": "Compounds", "ch.preset": "Example mixture", "ch.pPharma": "Pharmaceuticals and emerging contaminants", "ch.pParabens": "Parabens",
  "ch.lcList": "List", "ch.lcListHint": "name ; log P ; molar mass",
  "ch.lcModel": "Reversed-phase (C18) retention estimated with the linear solvent strength model: log k = log k<sub>w</sub> − S·φ, with log k<sub>w</sub> and S approximated from log P and molar mass. pH and ionization are not taken into account.",
  "ch.gas": "Carrier gas", "ch.he": "Helium", "ch.h2": "Hydrogen", "ch.n2": "Nitrogen",
  "ch.oven": "Oven program", "ch.T0": "Initial T (°C)", "ch.h0": "Hold (min)", "ch.rate": "Ramp (°C/min)", "ch.T1": "Final T (°C)", "ch.h1": "Hold (min)",
  "ch.pPah": "16 EPA PAHs", "ch.pPhth": "Phthalates", "ch.pAlk": "n-Alkanes C8–C30",
  "ch.gcListHint": "name ; retention index (5 % phenyl type column)",
  "ch.gcModel": "Retention is computed from the Kovats retention index: each compound is treated as an equivalent n-alkane and its k changes with temperature following the van ’t Hoff equation. Indices in the examples are approximate.",
  "ch.chrom": "Simulated chromatogram", "ch.sum": "Summary", "ch.peaks": "Peaks",
};
Object.assign(EN, CH_EN);

const LC_PRESETS = {
  pharma: `Uracil (t0); -1.07; 112
Paracetamol; 0.46; 151
Caffeine; -0.07; 194
Atenolol; 0.16; 266
Sulfamethoxazole; 0.89; 253
Carbamazepine; 2.45; 236
Naproxen; 3.18; 230
Estrone; 3.13; 270
Bisphenol A; 3.32; 228
Ibuprofen; 3.97; 206
Diclofenac; 4.51; 296
Triclosan; 4.76; 290`,
  parabens: `Methylparaben; 1.96; 152
Ethylparaben; 2.47; 166
Propylparaben; 3.04; 180
Butylparaben; 3.57; 194
Benzylparaben; 3.56; 228`,
};
const GC_PRESETS = {
  pah: `Naphthalene; 1180
Acenaphthylene; 1449
Acenaphthene; 1486
Fluorene; 1585
Phenanthrene; 1774
Anthracene; 1784
Fluoranthene; 2061
Pyrene; 2106
Benz[a]anthracene; 2463
Chrysene; 2470
Benzo[b]fluoranthene; 2828
Benzo[k]fluoranthene; 2832
Benzo[a]pyrene; 2896
Indeno[1,2,3-cd]pyrene; 3260
Dibenz[a,h]anthracene; 3280
Benzo[ghi]perylene; 3330`,
  phth: `Dimethyl phthalate (DMP); 1450
Diethyl phthalate (DEP); 1594
Diisobutyl phthalate (DiBP); 1870
Dibutyl phthalate (DBP); 1960
Benzyl butyl phthalate (BBP); 2340
Bis(2-ethylhexyl) phthalate (DEHP); 2550
Di-n-octyl phthalate (DnOP); 2730`,
  alk: Array.from({ length: 12 }, (_, i) => 8 + 2 * i).map((n) => `n-C${n}; ${n * 100}`).join("\n"),
};

/* ---------- utilidades ---------- */
function parseList(text, nNum) {
  const out = [];
  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const parts = line.split(/;|\t/).map((s) => s.trim());
    if (parts.length < nNum + 1) return;
    const nums = parts.slice(1, 1 + nNum).map(parseNum);
    if (nums.every(Number.isFinite)) out.push({ name: parts[0], v: nums });
  });
  return out;
}
const num = (id, d) => { const v = parseNum($(id).value); return Number.isFinite(v) ? v : d; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* =========================================================
   HPLC
   ========================================================= */
// Viscosidad (cP) de mezclas agua/orgánico a ~30 °C
function etaMix(phi, org) {
  const [ew, eo, G] = org === "acn" ? [0.80, 0.33, 1.6] : [0.80, 0.51, 3.2];
  return Math.exp(phi * Math.log(eo) + (1 - phi) * Math.log(ew) + phi * (1 - phi) * G);
}

function simLC(p, cmps) {
  const Lcm = p.L / 10, rcm = p.id / 20;
  const Vm = 0.68 * Math.PI * rcm * rcm * Lcm;      // mL
  const t0 = Vm / p.F;                               // min
  const tD = p.Vd / p.F;                             // min
  const f0 = p.b0 / 100, f1 = p.b1 / 100;
  const tEnd = p.h0 + p.tg + p.h1;
  const phiAt = (t) => (t <= p.h0 ? f0 : t <= p.h0 + p.tg ? f0 + (f1 - f0) * (t - p.h0) / p.tg : f1);
  const uCm = Lcm / (t0 * 60);                       // cm/s
  const dpCm = p.dp * 1e-4;
  const sFac = p.org === "acn" ? 1 : 0.8;

  const peaks = cmps.map((c, i) => {
    const [logP, mw] = c.v;
    const logkw = 0.3 + 0.7 * logP;
    const S = 0.25 * Math.sqrt(mw) * sFac;
    const k = (phi) => Math.pow(10, logkw - S * phi);
    // integración de la migración: dz/dt = 1 / (t0 (1 + k(φ en la posición del soluto)))
    let z = 0, t = 0;
    const dt = t0 / 400, tMax = Math.max(tEnd * 4, 60 * t0, 120);
    while (z < 1 && t < tMax) {
      z += dt / (t0 * (1 + k(phiAt(t - tD - z * t0))));
      t += dt;
    }
    if (z < 1) return { ...c, i, eluted: false };
    const phiE = phiAt(t - tD - t0);
    const ke = k(phiE);
    const eta = etaMix(phiE, p.org);
    const Dm = 1e-5 * (0.89 / eta);
    const nu = uCm * dpCm / Dm;
    const H = dpCm * (1 + 2 / nu + 0.08 * nu);
    const N = Lcm / H;
    const sigma = t0 * (1 + ke) / Math.sqrt(N);
    return { ...c, i, eluted: true, tR: t, ke, N, sigma, phiE };
  });

  // presión máxima a lo largo del programa
  let etaMax = 0;
  for (let j = 0; j <= 50; j++) etaMax = Math.max(etaMax, etaMix(Math.min(f0, f1) + Math.abs(f1 - f0) * j / 50, p.org));
  const uM = uCm / 100, Lm = Lcm / 100, dpM = dpCm / 100;
  const dPbar = 1000 * etaMax * 1e-3 * Lm * uM / (dpM * dpM) / 1e5;
  return { t0, tD, tEnd, phiAt, peaks, dPbar, uCm };
}

/* =========================================================
   GC
   ========================================================= */
const TB_ALK = [[5, 36], [6, 69], [7, 98], [8, 126], [9, 151], [10, 174], [11, 196], [12, 216], [13, 235], [14, 254], [15, 271], [16, 287], [17, 302], [18, 316], [19, 330], [20, 343], [22, 369], [24, 391], [26, 412], [28, 432], [30, 450], [32, 467], [34, 483], [36, 497], [40, 525]];
function tbFromRI(ri) {
  const n = ri / 100;
  let i = 0;
  while (i < TB_ALK.length - 2 && TB_ALK[i + 1][0] < n) i++;
  const [n1, t1] = TB_ALK[i], [n2, t2] = TB_ALK[i + 1];
  return t1 + (t2 - t1) * (n - n1) / (n2 - n1);
}
const GAS = { he: { D: 0.051, eta: 1.99e-5 }, h2: { D: 0.075, eta: 0.89e-5 }, n2: { D: 0.018, eta: 1.78e-5 } };

function simGC(p, cmps) {
  const rcm = p.id / 20, Lcm = p.L * 100;
  const u = (p.F / 60) / (Math.PI * rcm * rcm);      // cm/s
  const t0 = Lcm / u / 60;                           // min
  const beta = (p.id * 1000 / 2) / (2 * p.df);
  const rampT = (p.T1 - p.T0) / p.r;
  const tEnd = p.h0 + Math.max(rampT, 0) + p.h1;
  const Tat = (t) => (t < p.h0 ? p.T0 : t < p.h0 + rampT ? p.T0 + p.r * (t - p.h0) : p.T1);
  const g = GAS[p.gas];
  const dcCm = p.id / 10, dfCm = p.df * 1e-4;

  const peaks = cmps.map((c, i) => {
    const ri = c.v[0];
    const Tb = tbFromRI(ri) + 273.15;
    const Tstar = 0.82 * Tb, dH = 88 * Tb;
    const k = (TC) => Math.exp(dH / 8.314 * (1 / (TC + 273.15) - 1 / Tstar) - Math.log(beta / 250));
    let z = 0, t = 0;
    const dt = t0 / 1500, tMax = tEnd * 3 + 30;
    while (z < 1 && t < tMax) { z += dt / (t0 * (1 + k(Tat(t)))); t += dt; }
    if (z < 1) return { ...c, i, eluted: false };
    const Te = Tat(t), ke = k(Te);
    const Dg = g.D * Math.pow((Te + 273.15) / 298, 1.75);
    const Cm = (1 + 6 * ke + 11 * ke * ke) / (96 * (1 + ke) ** 2) * dcCm * dcCm / Dg;
    const Cs = 2 * ke / (3 * (1 + ke) ** 2) * dfCm * dfCm / 5e-6;
    const H = 2 * Dg / u + (Cm + Cs) * u;
    const N = Lcm / H;
    const sigma = t0 * (1 + ke) / Math.sqrt(N);
    return { ...c, i, eluted: true, tR: t, ke, N, sigma, Te };
  });

  // presión de cabeza (Poiseuille, gas compresible), a T inicial y final
  const pIn = (TC) => {
    const eta = g.eta * Math.pow((TC + 273.15) / 298, 0.7);
    const r = p.id / 2000, Lm = p.L, po = 1.013e5, Fo = p.F * 1e-6 / 60;
    return (Math.sqrt(po * po + 16 * eta * Lm * po * Fo / (Math.PI * r ** 4)) - po) / 1e5; // bar (manométrica)
  };
  return { t0, tEnd, Tat, peaks, u, beta, pIn0: pIn(p.T0), pIn1: pIn(p.T1) };
}

/* =========================================================
   Interfaz
   ========================================================= */
const CH = { mode: store.get("chMode", "lc") };
const LC_FIELDS = ["lcL", "lcID", "lcDp", "lcOrg", "lcF", "lcVd", "lcB0", "lcB1", "lcH0", "lcTG", "lcH1", "lcPreset", "lcCmp"];
const GC_FIELDS = ["gcL", "gcID", "gcDf", "gcGas", "gcF", "gcT0", "gcH0", "gcR", "gcT1", "gcH1", "gcPreset", "gcCmp"];

function chOutputs() {
  $("lcB0o").textContent = $("lcB0").value + " %";
  $("lcB1o").textContent = $("lcB1").value + " %";
  $("lcTGo").textContent = $("lcTG").value + " min";
  $("gcRo").textContent = $("gcR").value + " °C/min";
}

function resolutions(peaks) {
  const el = peaks.filter((p) => p.eluted).sort((a, b) => a.tR - b.tR);
  for (let j = 0; j < el.length; j++) {
    el[j].rs = j > 0 ? (el[j].tR - el[j - 1].tR) / (2 * (el[j].sigma + el[j - 1].sigma)) : null;
  }
  return el;
}

function drawChrom(sim, isLC) {
  const el = resolutions(sim.peaks);
  const W = 1000, H = 340, m = { l: 50, r: 54, t: 26, b: 42 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const lastT = el.length ? el[el.length - 1].tR + 5 * el[el.length - 1].sigma : sim.tEnd;
  const tMax = Math.max(sim.tEnd, lastT) * 1.03;
  const X = (t) => m.l + t / tMax * pw;
  // señal: suma de gaussianas con área fija por compuesto (alturas ∝ 1/σ)
  const areas = el.map((p) => 0.6 + 0.4 * Math.abs(Math.sin(p.i * 2.17 + 1)));
  // muestreo: rejilla uniforme + puntos densos alrededor de cada pico (los de GC son muy estrechos)
  const sigAt = (t) => { let y = 0; el.forEach((p, q) => { const d = (t - p.tR) / p.sigma; if (Math.abs(d) < 8) y += areas[q] / p.sigma * Math.exp(-0.5 * d * d); }); return y; };
  const ts = [];
  for (let j = 0; j <= 1200; j++) ts.push(j / 1200 * tMax);
  for (const p of el) for (let d = -5; d <= 5; d += 0.25) { const t = p.tR + d * p.sigma; if (t > 0 && t < tMax) ts.push(t); }
  ts.sort((a, b) => a - b);
  const sig = ts.map(sigAt);
  const ymax = Math.max(...sig, 1e-9);
  const Y = (v) => m.t + ph - v / ymax * ph * 0.92;

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L("Cromatograma simulado", "Simulated chromatogram"))}">`;
  const xt = niceTicks(0, tMax, 10);
  for (const v of xt.ticks) if (v <= tMax) s += `<line class="gridl" x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${m.t + ph}"/><text class="tick" x="${X(v)}" y="${H - m.b + 17}" text-anchor="middle">${tickLabel(v, xt.step)}</text>`;
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"/>`;

  // programa (gradiente o temperatura) en el eje derecho
  let prog = "", yr0, yr1, unit;
  if (isLC) { yr0 = 0; yr1 = 100; unit = "% B"; }
  else { yr0 = Math.floor(Math.min(sim.Tat(0), sim.Tat(sim.tEnd)) / 50) * 50; yr1 = Math.ceil(Math.max(sim.Tat(0), sim.Tat(sim.tEnd)) / 50) * 50 + 50; unit = "°C"; }
  const YR = (v) => m.t + ph - (v - yr0) / (yr1 - yr0) * ph;
  for (let j = 0; j <= 300; j++) {
    const t = j / 300 * tMax;
    const v = isLC ? sim.phiAt(t - sim.tD) * 100 : sim.Tat(t);
    prog += (j ? "L" : "M") + X(t).toFixed(1) + " " + YR(v).toFixed(1);
  }
  s += `<path class="progline" d="${prog}"/>`;
  const rt = niceTicks(yr0, yr1, 4);
  for (const v of rt.ticks) if (v >= yr0 && v <= yr1) s += `<text class="tick prog" x="${W - m.r + 6}" y="${YR(v) + 4}">${v}</text>`;
  s += `<text class="lab prog" transform="translate(${W - 12} ${m.t + ph / 2}) rotate(90)" text-anchor="middle">${unit}${isLC ? L(" (en la columna)", " (at column)") : ""}</text>`;

  // traza
  let d = "";
  ts.forEach((t, j) => { d += (j ? "L" : "M") + X(t).toFixed(2) + " " + Y(sig[j]).toFixed(2); });
  s += `<path class="trace" d="${d}"/>`;
  for (const p of el) {
    const y = sigAt(p.tR);
    const bad = p.rs !== null && p.rs < 1.5;
    s += `<text class="pklab ${bad ? "bad" : ""}" x="${X(p.tR)}" y="${Math.max(m.t - 6, Y(y) - 6)}" text-anchor="middle">${p.i + 1}<title>${esc(p.name)} · ${fmtFix(p.tR, 2)} min</title></text>`;
  }
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${L("Tiempo (min)", "Time (min)")}</text>`;
  s += `<text class="lab" transform="translate(14 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${L("Señal", "Signal")}</text>`;
  s += `</svg>`;
  $("chChart").innerHTML = s;
  return el;
}

function renderChroma() {
  if (!$("cromatografia")) return;
  chOutputs();
  const isLC = CH.mode === "lc";
  $("lcPane").hidden = !isLC; $("gcPane").hidden = isLC;
  document.querySelectorAll("#chMode button").forEach((b) => b.classList.toggle("on", b.dataset.m === CH.mode));
  const notes = [];
  let sim, el, stats = "";

  if (isLC) {
    const p = {
      L: num("lcL", 150), id: num("lcID", 4.6), dp: num("lcDp", 5), org: $("lcOrg").value,
      F: Math.max(0.01, num("lcF", 1)), Vd: Math.max(0, num("lcVd", 1)),
      b0: num("lcB0", 10), b1: num("lcB1", 95), h0: Math.max(0, num("lcH0", 0)), tg: Math.max(0.1, num("lcTG", 15)), h1: Math.max(0, num("lcH1", 0)),
    };
    const cmps = parseList($("lcCmp").value, 2);
    if (!cmps.length) { $("chChart").innerHTML = ""; $("chTable").innerHTML = ""; $("chStats").innerHTML = ""; $("chNotes").innerHTML = `<div class="note warn">${L("Añade compuestos a la lista.", "Add compounds to the list.")}</div>`; return; }
    sim = simLC(p, cmps);
    el = drawChrom(sim, true);
    const Nmed = el.length ? el.reduce((a, q) => a + q.N, 0) / el.length : NaN;
    stats += `<div class="stat"><div class="k">t<sub>0</sub></div><div class="v">${fmtFix(sim.t0, 2)} min</div><div class="s">${L("retardo del gradiente", "gradient delay")} ${fmtFix(sim.tD, 2)} min</div></div>`;
    stats += `<div class="stat"><div class="k">${L("Presión máxima", "Maximum pressure")}</div><div class="v">${fmt(sim.dPbar, 3)} bar</div><div class="s">${fmt(sim.dPbar * 14.5038, 3)} psi</div></div>`;
    stats += `<div class="stat"><div class="k">${L("Platos teóricos (N)", "Plate count (N)")}</div><div class="v">${fmt(Nmed, 3)}</div><div class="s">${L("velocidad", "velocity")} ${fmtFix(sim.uCm * 10, 2)} mm/s</div></div>`;
    stats += `<div class="stat"><div class="k">${L("Disolvente por análisis", "Solvent per run")}</div><div class="v">${fmt(sim.tEnd * p.F, 3)} mL</div><div class="s">${L("programa de", "program of")} ${fmtFix(sim.tEnd, 1)} min</div></div>`;
    if (sim.dPbar > 1000) notes.push(["bad", L("La presión supera los 1000 bar: fuera del alcance incluso de muchos UHPLC. Baja el flujo, usa partícula mayor o columna más corta.", "Pressure exceeds 1000 bar: beyond many UHPLC systems. Lower the flow, use larger particles or a shorter column.")]);
    else if (sim.dPbar > 400) notes.push(["warn", L("Más de 400 bar: necesitas un equipo UHPLC.", "Above 400 bar: you need a UHPLC system.")]);
    const early = el.filter((q) => q.ke < 1 && !/t0/i.test(q.name));
    if (early.length) notes.push(["warn", L(`${early.map((q) => q.name).join(", ")} sale${early.length > 1 ? "n" : ""} casi con el volumen muerto (k < 1): baja el % B inicial.`, `${early.map((q) => q.name).join(", ")} elute${early.length > 1 ? "" : "s"} close to the void volume (k < 1): lower the initial % B.`)]);
    if (el.length && el[el.length - 1].tR > sim.tEnd + sim.tD + sim.t0) notes.push(["warn", L("Algún compuesto sale después de terminar el programa: alarga el lavado final o sube el % B final.", "Some compounds elute after the program ends: lengthen the final wash or raise the final % B.")]);
  } else {
    const p = {
      L: num("gcL", 30), id: num("gcID", 0.25), df: num("gcDf", 0.25), gas: $("gcGas").value, F: Math.max(0.05, num("gcF", 1)),
      T0: num("gcT0", 50), h0: Math.max(0, num("gcH0", 0)), r: Math.max(0.1, num("gcR", 10)), T1: num("gcT1", 300), h1: Math.max(0, num("gcH1", 0)),
    };
    if (p.T1 < p.T0) p.T1 = p.T0;
    const cmps = parseList($("gcCmp").value, 1);
    if (!cmps.length) { $("chChart").innerHTML = ""; $("chTable").innerHTML = ""; $("chStats").innerHTML = ""; $("chNotes").innerHTML = `<div class="note warn">${L("Añade compuestos a la lista.", "Add compounds to the list.")}</div>`; return; }
    sim = simGC(p, cmps);
    el = drawChrom(sim, false);
    const Nmed = el.length ? el.reduce((a, q) => a + q.N, 0) / el.length : NaN;
    stats += `<div class="stat"><div class="k">t<sub>0</sub></div><div class="v">${fmtFix(sim.t0, 2)} min</div><div class="s">${L("velocidad media", "mean velocity")} ${fmtFix(sim.u, 1)} cm/s</div></div>`;
    stats += `<div class="stat"><div class="k">${L("Presión en cabeza", "Head pressure")}</div><div class="v">${fmt(sim.pIn0, 3)}–${fmt(sim.pIn1, 3)} bar</div><div class="s">${fmt(sim.pIn0 * 14.5038, 3)}–${fmt(sim.pIn1 * 14.5038, 3)} psi (${L("flujo constante", "constant flow")})</div></div>`;
    stats += `<div class="stat"><div class="k">${L("Platos teóricos (N)", "Plate count (N)")}</div><div class="v">${fmt(Nmed, 3)}</div><div class="s">β = ${fmt(sim.beta, 3)}</div></div>`;
    stats += `<div class="stat"><div class="k">${L("Duración del programa", "Program length")}</div><div class="v">${fmtFix(sim.tEnd, 1)} min</div></div>`;
    const uOpt = { he: [20, 40], h2: [35, 60], n2: [10, 18] }[p.gas];
    if (sim.u < uOpt[0]) notes.push(["", L(`La velocidad del gas (${fmtFix(sim.u, 0)} cm/s) está por debajo de la óptima para este gas (${uOpt[0]}–${uOpt[1]} cm/s): los picos se ensanchan y el análisis es más lento.`, `Gas velocity (${fmtFix(sim.u, 0)} cm/s) is below the optimum for this gas (${uOpt[0]}–${uOpt[1]} cm/s): broader peaks and a slower run.`)]);
    else if (sim.u > uOpt[1] * 1.5) notes.push(["", L(`La velocidad del gas (${fmtFix(sim.u, 0)} cm/s) es muy alta para este gas: se pierde eficiencia.`, `Gas velocity (${fmtFix(sim.u, 0)} cm/s) is very high for this gas: efficiency drops.`)]);
    if (el.length && el[el.length - 1].tR > sim.tEnd) notes.push(["warn", L("Algún compuesto sale después de terminar el programa: alarga la meseta final o sube la temperatura final.", "Some compounds elute after the program ends: lengthen the final hold or raise the final temperature.")]);
    if (p.T1 > 330) notes.push(["warn", L("Más de 325–350 °C supera el límite de la mayoría de columnas de 5 % fenilo.", "Above 325–350 °C exceeds the limit of most 5 % phenyl columns.")]);
  }

  // Notas comunes de resolución
  const notEl = sim.peaks.filter((q) => !q.eluted);
  if (notEl.length) notes.push(["bad", L(`No eluyen en un tiempo razonable: ${notEl.map((q) => q.name).join(", ")}.`, `Not eluted within a reasonable time: ${notEl.map((q) => q.name).join(", ")}.`)]);
  const pairs = el.filter((q) => q.rs !== null);
  if (pairs.length) {
    const crit = pairs.reduce((a, b) => (b.rs < a.rs ? b : a));
    const prev = el[el.indexOf(crit) - 1];
    stats += `<div class="stat wide"><div class="k">${L("Par crítico", "Critical pair")}</div><div class="v">R<sub>s</sub> = ${fmtFix(crit.rs, 2)}</div><div class="s">${esc(prev.name)} / ${esc(crit.name)}</div></div>`;
    const bad = pairs.filter((q) => q.rs < 1.5);
    if (!bad.length) notes.push(["good", L("Todos los picos tienen resolución ≥ 1,5 (separación a línea base).", "All peaks have resolution ≥ 1.5 (baseline separation).")]);
    else notes.push(["warn", L(`${bad.length} par(es) sin separar a línea base (R<sub>s</sub> < 1,5). ${isLC ? "Prueba un gradiente más suave (más tiempo de gradiente o menos diferencia de % B), cambiar de disolvente o una columna más larga o de partícula más pequeña." : "Prueba una rampa más lenta, una columna más larga o más estrecha, o hidrógeno como gas portador."}`,
      `${bad.length} pair(s) not baseline separated (R<sub>s</sub> < 1.5). ${isLC ? "Try a shallower gradient (longer gradient time or smaller % B range), another organic solvent, or a longer column or smaller particles." : "Try a slower ramp, a longer or narrower column, or hydrogen as carrier gas."}`), true]);
    const lastT = el[el.length - 1].tR;
    const progEnd = isLC ? sim.tEnd : sim.tEnd;
    if (lastT < progEnd * 0.6 && !isLC) notes.push(["", L("El último pico sale mucho antes de que acabe el programa: puedes acortarlo.", "The last peak elutes well before the program ends: you can shorten it.")]);
  }
  $("chStats").innerHTML = stats;
  $("chNotes").innerHTML = notes.map(([c, t, html]) => `<div class="note ${c}">${html ? t : esc(t)}</div>`).join("");

  // tabla
  const rows = [...el, ...sim.peaks.filter((q) => !q.eluted)];
  $("chTable").innerHTML = `<thead><tr><th>#</th><th>${L("Compuesto", "Compound")}</th><th class="num">t<sub>R</sub> (min)</th><th class="num">${isLC ? "% B" : "T (°C)"}</th><th class="num">${L("Anchura", "Width")} (s)</th><th class="num">R<sub>s</sub></th></tr></thead><tbody>` +
    rows.map((q) => q.eluted
      ? `<tr><td>${q.i + 1}</td><td>${esc(q.name)}</td><td class="num">${fmtFix(q.tR, 2)}</td><td class="num">${isLC ? fmtFix(q.phiE * 100, 0) : fmtFix(q.Te, 0)}</td><td class="num">${fmtFix(q.sigma * 4 * 60, 1)}</td><td class="num">${q.rs === null ? "—" : `<span class="${q.rs < 1.5 ? "rs-bad" : ""}">${fmtFix(q.rs, 2)}</span>`}</td></tr>`
      : `<tr><td>${q.i + 1}</td><td>${esc(q.name)}</td><td class="num" colspan="4">${L("no eluye", "not eluted")}</td></tr>`).join("") + `</tbody>`;
}

function initChroma() {
  if (!$("cromatografia")) return;
  for (const id of [...LC_FIELDS, ...GC_FIELDS]) {
    const v = store.get(id, null);
    if (v !== null) $(id).value = v;
  }
  if (store.get("lcCmp", null) === null) $("lcCmp").value = LC_PRESETS[$("lcPreset").value];
  if (store.get("gcCmp", null) === null) $("gcCmp").value = GC_PRESETS[$("gcPreset").value];
  let pending = null;
  const schedule = () => { if (pending) return; pending = requestAnimationFrame(() => { pending = null; renderChroma(); }); };
  for (const id of [...LC_FIELDS, ...GC_FIELDS]) {
    $(id).addEventListener("input", () => {
      if (id === "lcPreset") $("lcCmp").value = LC_PRESETS[$("lcPreset").value];
      if (id === "gcPreset") $("gcCmp").value = GC_PRESETS[$("gcPreset").value];
      store.set(id, $(id).value);
      if (id === "lcPreset") store.set("lcCmp", $("lcCmp").value);
      if (id === "gcPreset") store.set("gcCmp", $("gcCmp").value);
      chOutputs(); schedule();
    });
  }
  $("chMode").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]"); if (!b) return;
    CH.mode = b.dataset.m; store.set("chMode", CH.mode); renderChroma();
  });
  renderChroma();
}

// Enganchar con la navegación y el cambio de idioma de script.js
VIEWS.splice(VIEWS.indexOf("fondo"), 0, "cromatografia");
const _renderAll = renderAll;
renderAll = function () { _renderAll(); renderChroma(); };
initChroma();
applyStatic();
route();
