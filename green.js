/* PeakLab · Métricas verdes y de aplicabilidad
   - AGREEprep (Wojnowski, Tobiszewski, Pena-Pereira, Psillakis, TrAC 2022, 149, 116553): 10 criterios 0–1,
     media ponderada; funciones logarítmicas tomadas del artículo y comprobadas con informes publicados.
   - BAGI (Manousi, Wojnowski, Płotka-Wasylka, Samanidou, Green Chem. 2023, 25, 7598): 10 atributos de
     2,5 a 10 puntos; la puntuación es la suma (25–100); ≥ 60 se considera práctico.
   Los pictogramas los dibuja PeakLab siguiendo esos criterios; no son los del software oficial. */
"use strict";

Object.assign(EN, {
  "nav.green": "Green metrics",
  "home.c7t": "Green metrics",
  "home.c7p": "Score your sample preparation with AGREEprep and the method's practicality with BAGI, and download the pictograms for your report.",
  "home.c8t": "GC or LC?",
  "home.c8p": "Draw a molecule and get a recommendation: GC or LC, which column, detector or ionization mode, and whether it needs derivatization.",
  "gr.h1": "Green metrics: AGREEprep and BAGI",
  "gr.intro": "AGREEprep scores how green the sample preparation is (0 to 1). BAGI scores how practical the whole method is (25 to 100). Fill in the criteria and the pictograms update as you go.",
  "gr.name": "Method name (appears on the downloaded pictograms)",
  "gr.examples": "Examples",
  "adv.h": "GC or LC?",
  "gr.resetW": "Reset weights", "gr.png": "Download PNG",
  "gr.agpRef": "Wojnowski et al., TrAC 149 (2022) 116553. Weighted mean of the 10 criteria; default weights are those in the paper.",
  "gr.bagiRef": "Manousi et al., Green Chem. 25 (2023) 7598. Sum of the 10 attributes (25–100); from 60 up the method is considered practical.",
  "gr.note": "Pictograms are drawn by PeakLab from the published criteria; their shape is not identical to the authors' official software. If you use them in a publication, cite the original papers.",
});

const AGP_W = [1, 5, 2, 4, 2, 3, 2, 4, 2, 3];
const AGP_DEF = { c1: "0", c2: "1", c3: "0", c4: "10", c5: "10", c5p: false, c6: "10", c7s: "3", c7a: "0.25", c8: "20", c9: "0.25", c10: "1", w: AGP_W.slice() };
const BAGI_DEF = { b1: 10, b2: 7.5, b3: 5, b4: 5, b5: 2.5, b6: 7.5, b7: 10, b8: 7.5, b9: 7.5, b10: 10, kind: "env" };

const GREEN_PRESETS = {
  spe: {
    name: ["SPE + LC-MS/MS, fármacos en agua de río", "SPE + LC-MS/MS, pharmaceuticals in river water"],
    agp: { c1: "0", c2: "12", c3: "0", c4: "25", c5: "500", c5p: false, c6: "4", c7s: "6", c7a: "0.25", c8: "30", c9: "0.25", c10: "2", w: AGP_W.slice() },
    bagi: { b1: 10, b2: 10, b3: 2.5, b4: 5, b5: 2.5, b6: 2.5, b7: 7.5, b8: 2.5, b9: 7.5, b10: 2.5, kind: "env" },
  },
  dllme: {
    name: ["DLLME + GC-MS, contaminantes en bebidas vegetales", "DLLME + GC-MS, contaminants in plant-based drinks"],
    agp: { c1: "0", c2: "0.05", c3: "0", c4: "6", c5: "5", c5p: false, c6: "10", c7s: "3", c7a: "0.25", c8: "5", c9: "0.25", c10: "2", w: AGP_W.slice() },
    bagi: { b1: 10, b2: 7.5, b3: 5, b4: 5, b5: 5, b6: 7.5, b7: 10, b8: 7.5, b9: 7.5, b10: 10, kind: "env" },
  },
};

let GR = (() => {
  try {
    const s = JSON.parse(store.get("green", "null"));
    if (s && s.agp && s.bagi) return { name: s.name || "", agp: { ...AGP_DEF, ...s.agp, w: (s.agp.w && s.agp.w.length === 10 ? s.agp.w : AGP_W.slice()) }, bagi: { ...BAGI_DEF, ...s.bagi } };
  } catch (e) { /* nada */ }
  return { name: "", agp: { ...AGP_DEF, w: AGP_W.slice() }, bagi: { ...BAGI_DEF } };
})();
const saveGreen = () => store.set("green", JSON.stringify(GR));

/* ---------------- Cálculo ---------------- */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
function agpScores(a) {
  const n = (v) => parseNum(v);
  const s = [];
  s[0] = Number(a.c1);
  const haz = n(a.c2);
  s[1] = !(haz > 0) ? 1 : clamp01(0.3333 - 0.145 * Math.log(haz));
  s[2] = Number(a.c3);
  const waste = n(a.c4);
  s[3] = !(waste > 0) ? 1 : clamp01(0.6295 - 0.161 * Math.log(waste));
  const smp = n(a.c5);
  s[4] = a.c5p || !(smp > 0) ? 1 : clamp01(0.6667 - 0.145 * Math.log(smp));
  const thr = n(a.c6);
  s[5] = !(thr > 0) ? 0 : clamp01(0.2354 * Math.log(thr));
  const steps = { 2: 1, 3: 0.75, 4: 0.5, 5: 0.25, 6: 0 }[a.c7s];
  s[6] = steps * Number(a.c7a);
  const wh = n(a.c8);
  s[7] = !(wh > 10) ? 1 : wh > 500 ? 0 : clamp01(1.5886 - 0.256 * Math.log(wh));
  s[8] = Number(a.c9);
  s[9] = { 0: 1, 1: 0.75, 2: 0.5, 3: 0.25, 4: 0 }[a.c10];
  const w = a.w.map((x) => Math.max(0, Number(x) || 0));
  const sw = w.reduce((p, q) => p + q, 0);
  const total = sw ? s.reduce((p, v, i) => p + v * w[i], 0) / sw : 0;
  return { s, w, total };
}
function bagiTotal(b) { return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((p, i) => p + Number(b["b" + i]), 0); }

// Escala rojo → amarillo → verde (estilo AGREE)
function agpColor(v) {
  const stops = [[0, [192, 39, 45]], [0.25, [232, 119, 34]], [0.5, [243, 210, 40]], [0.75, [140, 194, 74]], [1, [26, 140, 70]]];
  v = clamp01(v);
  for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (v - a) / (b - a);
    return `rgb(${ca.map((c, k) => Math.round(c + (cb[k] - c) * t)).join(",")})`;
  }
  return "rgb(26,140,70)";
}
const BAGI_COL = { 10: "#0c305b", 7.5: "#3a89c1", 5: "#adcffd", 2.5: "#ffffff" };

/* ---------------- Pictogramas (SVG autónomo, sin depender del tema) ---------------- */
function arcPath(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 ${lg} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 ${lg} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
}
const PICT_FONT = "font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif";

function agpSvg(res, title) {
  const W = 300, H = title ? 330 : 300, cx = 150, cy = 150, r0 = 62;
  const maxW = Math.max(...res.w, 1);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="AGREEprep ${res.total.toFixed(2)}"><rect width="${W}" height="${H}" fill="#ffffff"/>`;
  const step = 2 * Math.PI / 10, gap = 0.012;
  res.s.forEach((v, i) => {
    const a0 = i * step - step / 2 + gap, a1 = (i + 1) * step - step / 2 - gap;
    const r1 = r0 + 18 + 62 * (res.w[i] / maxW);
    s += `<path d="${arcPath(cx, cy, r0 + 4, r1, a0, a1)}" fill="${agpColor(v)}" stroke="#ffffff" stroke-width="1"><title>${i + 1}: ${v.toFixed(2)} (w ${res.w[i]})</title></path>`;
    const am = (a0 + a1) / 2, rl = r0 + 15;
    s += `<text x="${(cx + rl * Math.sin(am)).toFixed(1)}" y="${(cy - rl * Math.cos(am) + 4).toFixed(1)}" text-anchor="middle" style="${PICT_FONT};font-size:12px;font-weight:600" fill="#1d1d1d">${i + 1}</text>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="${agpColor(res.total)}" stroke="#ffffff" stroke-width="2"/>`;
  const dark = res.total > 0.32 && res.total < 0.8;
  s += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" style="${PICT_FONT};font-size:34px;font-weight:700" fill="${dark ? "#1d1d1d" : "#ffffff"}">${res.total.toFixed(2)}</text>`;
  s += `<text x="${cx}" y="${cy - 20}" text-anchor="middle" style="${PICT_FONT};font-size:11px;font-weight:600;letter-spacing:.06em" fill="${dark ? "#1d1d1d" : "#ffffff"}">AGREEprep</text>`;
  if (title) s += `<text x="${cx}" y="${H - 10}" text-anchor="middle" style="${PICT_FONT};font-size:12px" fill="#333333">${esc(title.slice(0, 60))}</text>`;
  return s + `</svg>`;
}

function bagiSvg(b, title) {
  const W = 300, H = title ? 330 : 300, cx = 150, cy = 150, r0 = 58, r1 = 132;
  const total = bagiTotal(b);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="BAGI ${total}"><rect width="${W}" height="${H}" fill="#ffffff"/>`;
  const step = 2 * Math.PI / 10, gap = 0.015;
  for (let i = 0; i < 10; i++) {
    const v = Number(b["b" + (i + 1)]);
    const a0 = i * step - step / 2 + gap, a1 = (i + 1) * step - step / 2 - gap;
    const rr = r0 + 8 + (r1 - r0 - 8) * (v / 10);
    s += `<path d="${arcPath(cx, cy, r0 + 6, r1, a0, a1)}" fill="#f2f6fb" stroke="none"/>`;
    s += `<path d="${arcPath(cx, cy, r0 + 6, rr, a0, a1)}" fill="${BAGI_COL[v]}" stroke="#0c305b" stroke-width="1"><title>${i + 1}: ${v}</title></path>`;
    const am = (a0 + a1) / 2, rl = r0 + 18;
    s += `<text x="${(cx + rl * Math.sin(am)).toFixed(1)}" y="${(cy - rl * Math.cos(am) + 4).toFixed(1)}" text-anchor="middle" style="${PICT_FONT};font-size:12px;font-weight:600" fill="${v >= 7.5 ? "#ffffff" : "#0c305b"}">${i + 1}</text>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="#ffffff" stroke="#0c305b" stroke-width="2"/>`;
  s += `<text x="${cx}" y="${cy - 18}" text-anchor="middle" style="${PICT_FONT};font-size:11px;font-weight:600;letter-spacing:.06em" fill="#0c305b">BAGI</text>`;
  s += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" style="${PICT_FONT};font-size:34px;font-weight:700" fill="#0c305b">${Number.isInteger(total) ? total : total.toFixed(1)}</text>`;
  if (title) s += `<text x="${cx}" y="${H - 10}" text-anchor="middle" style="${PICT_FONT};font-size:12px" fill="#333333">${esc(title.slice(0, 60))}</text>`;
  return s + `</svg>`;
}

function downloadSvg(svg, base, asPng) {
  const name = (base || "pictogram").replace(/[^\w\-]+/g, "_");
  if (!asPng) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = name + ".svg"; document.body.appendChild(a); a.click(); a.remove();
    return;
  }
  const img = new Image();
  img.onload = () => {
    const k = 4, c = document.createElement("canvas");
    c.width = img.width * k; c.height = img.height * k;
    const ctx = c.getContext("2d"); ctx.scale(k, k); ctx.drawImage(img, 0, 0);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png"); a.download = name + ".png";
    document.body.appendChild(a); a.click(); a.remove();
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* ---------------- Formularios ---------------- */
function agpCriteria() {
  return [
    { k: "c1", t: L("Posición de la preparación de muestra", "Sample preparation placement"), type: "sel", opts: [["1", L("En línea / in situ", "In-line / in situ")], ["0.66", L("On-line / in situ", "On-line / in situ")], ["0.33", L("En el lugar de muestreo (on-site)", "On site")], ["0", L("Ex situ (en el laboratorio)", "Ex situ (in the lab)")]] },
    { k: "c2", t: L("Sustancias peligrosas", "Hazardous materials"), type: "num", unit: "mL · g", hint: L("Suma de disolventes y reactivos tóxicos, persistentes o bioacumulables. 0 si no se usan.", "Total toxic, persistent or bioaccumulative solvents and reagents. 0 if none.") },
    { k: "c3", t: L("Materiales sostenibles, renovables o reutilizables", "Sustainable, renewable or reusable materials"), type: "sel", opts: [["1", L("Solo sostenibles o renovables y reutilizados", "Only sustainable/renewable, used several times")], ["0.75", L("Más del 75 % sostenibles o renovables", "More than 75 % sustainable/renewable")], ["0.5", L("50–75 % de un solo uso, o no sostenibles pero reutilizables", "50–75 % single-use, or non-sustainable but reusable")], ["0.25", L("25–50 % sostenibles o renovables", "25–50 % sustainable/renewable")], ["0", L("Menos del 25 % y de un solo uso", "Under 25 % and single-use")]] },
    { k: "c4", t: L("Residuos generados", "Waste"), type: "num", unit: "mL · g", hint: L("Todo lo que se añade y acaba como residuo: disolventes, reactivos, cartuchos, viales…", "Everything added that ends up as waste: solvents, reagents, cartridges, vials…") },
    { k: "c5", t: L("Cantidad de muestra", "Sample size"), type: "num", unit: "mL · g", check: ["c5p", L("Muestreador pasivo (solo se recogen los analitos)", "Passive sampler (only analytes are collected)")] },
    { k: "c6", t: L("Muestras preparadas por hora", "Samples prepared per hour"), type: "num", unit: L("muestras/h", "samples/h"), hint: L("Cuenta las que se procesan en paralelo.", "Count samples processed in parallel.") },
    { k: "c7", t: L("Integración de etapas y automatización", "Integration of steps and automation"), type: "two" },
    { k: "c8", t: L("Consumo de energía", "Energy consumption"), type: "num", unit: L("Wh/muestra", "Wh/sample"), hint: L("Potencia (W) × tiempo (h) ÷ muestras que se procesan a la vez, para cada equipo.", "Power (W) × time (h) ÷ samples processed together, for each device.") },
    { k: "c9", t: L("Técnica de medida posterior", "Post-sample preparation configuration"), type: "sel", opts: [["1", L("Detección sencilla (smartphone, escáner)", "Simple detection (smartphone, scanner)")], ["0.75", L("Espectroscopía óptica, voltamperometría, potenciometría", "Optical spectroscopy, voltammetry, potentiometry")], ["0.5", L("GC sin MS, AAS, electroforesis capilar", "GC without MS, AAS, capillary electrophoresis")], ["0.25", L("LC, o GC con MS de cuadrupolo", "LC, or GC with quadrupole MS")], ["0", L("MS avanzada, ICP-OES, ICP-MS", "Advanced MS, ICP-OES, ICP-MS")]] },
    { k: "c10", t: L("Riesgos para el operador", "Operator's safety"), type: "sel", opts: [["0", L("Ningún riesgo", "No hazards")], ["1", L("1 riesgo", "1 hazard")], ["2", L("2 riesgos", "2 hazards")], ["3", L("3 riesgos", "3 hazards")], ["4", L("4 o más", "4 or more")]], hint: L("Pictogramas de peligro químico, físico, eléctrico o biológico.", "Chemical, physical, electrical or biological hazard pictograms.") },
  ];
}
function bagiAttrs(kind) {
  const bio = kind === "bio";
  return [
    [L("Tipo de análisis", "Type of analysis"), [[10, L("Cuantitativo y confirmatorio", "Quantitative and confirmatory")], [7.5, L("Cuantitativo", "Quantitative")], [5, L("Cribado", "Screening")], [2.5, L("Cualitativo", "Qualitative")]]],
    [L("Número de analitos", "Number of analytes"), [[10, L("Más de 15 compuestos", "More than 15 compounds")], [7.5, L("6–15 de la misma familia, o 2–15 de familias distintas", "6–15 of the same class, or 2–15 of different classes")], [5, L("2–5 de la misma familia", "2–5 of the same class")], [2.5, L("Un solo analito", "A single analyte")]]],
    [L("Instrumentación", "Instrumentation"), [[10, L("Sencilla y portátil (smartphone, GC portátil)", "Simple, portable (smartphone, portable GC)")], [7.5, L("Sencilla, presente en casi todos los laboratorios (UV, HPLC-UV/DAD, UHPLC, AAS, ICP-OES, GC-FID)", "Simple, available in most labs (UV, HPLC-UV/DAD, UHPLC, AAS, ICP-OES, GC-FID)")], [5, L("Sofisticada (LC-MS, GC-MS, ICP-MS, sistemas caseros)", "Sophisticated (LC-MS, GC-MS, ICP-MS, home-made systems)")], [2.5, L("Poco común (LC-MS/MS, GC-MS/MS, SFC, 2D-GC, 2D-LC)", "Not commonly available (LC-MS/MS, GC-MS/MS, SFC, 2D-GC, 2D-LC)")]]],
    [L("Muestras tratadas a la vez", "Samples treated simultaneously"), [[10, L("Más de 95", "More than 95")], [7.5, "13–95"], [5, "2–12"], [2.5, "1"]]],
    [L("Preparación de muestra", "Sample preparation"), [[10, L("No hace falta, o se hace en el lugar de muestreo", "Not required, or on site")], [7.5, L("Sencilla y barata (p. ej. precipitación de proteínas)", "Simple, low-cost (e.g. protein precipitation)")], [5, L("Extracción miniaturizada (SPME, DLLME, MEPS, SBSE, d-SPE, FPSE)", "Miniaturized extraction (SPME, DLLME, MEPS, SBSE, d-SPE, FPSE)")], [2.5, L("Varias etapas (LLE, SPE y/o derivatización)", "Multi-step (LLE, SPE and/or derivatization)")]]],
    [L("Muestras por hora (preparación + análisis)", "Samples per hour (preparation + analysis)"), [[10, L("Más de 10", "More than 10")], [7.5, "5–10"], [5, "2–4"], [2.5, "≤ 1"]]],
    [L("Reactivos y materiales", "Reagents and materials"), [[10, L("Comunes y comerciales (metanol, acetonitrilo, HNO₃, gases)", "Common, commercially available (methanol, acetonitrile, HNO₃, gases)")], [7.5, L("Comerciales pero poco habituales (derivatizantes, cartuchos SPE, fibras SPME)", "Commercial but less common (derivatization reagents, SPE cartridges, SPME fibres)")], [5, L("Se sintetizan en el laboratorio de forma sencilla", "Synthesized in the lab in a simple way")], [2.5, L("Se sintetizan con equipos o conocimientos avanzados (MOF, nanomateriales modificados)", "Synthesized with advanced equipment or know-how (MOFs, modified nanomaterials)")]]],
    [L("Preconcentración", "Preconcentration"), [[10, L("No hace falta: se cumplen directamente la sensibilidad o la legislación", "Not required: sensitivity or legal limits are met directly")], [7.5, L("Hace falta, en una sola etapa", "Required, in a single step")], [2.5, L("Hace falta, en varias etapas (extracción, evaporación, reconstitución)", "Required, in several steps (extraction, evaporation, reconstitution)")]]],
    [L("Grado de automatización", "Automation degree"), [[10, L("Totalmente automatizado con dispositivos avanzados (robótica, lab-in-syringe)", "Fully automated with advanced devices (robotics, lab-in-syringe)")], [7.5, L("Semiautomático con equipos comunes (inyector automático)", "Semi-automated with common devices (autosampler)")], [5, L("Semiautomático con equipos poco comunes (caseros)", "Semi-automated with uncommon (home-made) devices")], [2.5, L("Manual", "Manual")]]],
    [L("Cantidad de muestra", "Amount of sample"), bio
      ? [[10, "≤ 100 µL (mg)"], [7.5, "101–500 µL (mg)"], [5, "501–1000 µL (mg)"], [2.5, "> 1000 µL (mg)"]]
      : [[10, "≤ 10 mL (g)"], [7.5, "10–50 mL (g)"], [5, "51–100 mL (g)"], [2.5, "> 100 mL (g)"]]],
  ];
}

function buildGreenForms() {
  const crit = agpCriteria();
  const a = GR.agp;
  let h = "";
  crit.forEach((c, i) => {
    h += `<div class="crit" data-i="${i}"><div class="crit-head"><span class="crit-n">${i + 1}</span><span class="crit-t">${esc(c.t)}</span><span class="crit-s" id="agpS${i}"></span>
      <label class="crit-w" title="${esc(L("Peso", "Weight"))}">${L("peso", "weight")} <input type="number" min="0" max="5" step="1" data-w="${i}" value="${a.w[i]}"></label></div>`;
    if (c.type === "sel") h += `<select data-k="${c.k}">${c.opts.map(([v, tx]) => `<option value="${v}"${String(a[c.k]) === v ? " selected" : ""}>${esc(tx)}</option>`).join("")}</select>`;
    else if (c.type === "num") h += `<div class="num-u"><input type="text" inputmode="decimal" data-k="${c.k}" value="${esc(a[c.k])}"><span>${esc(c.unit)}</span></div>`;
    else if (c.type === "two") h += `<div class="field-row"><select data-k="c7s" class="grow">${[["2", L("≤ 2 etapas", "≤ 2 steps")], ["3", L("3 etapas", "3 steps")], ["4", L("4 etapas", "4 steps")], ["5", L("5 etapas", "5 steps")], ["6", L("6 o más", "6 or more")]].map(([v, tx]) => `<option value="${v}"${a.c7s === v ? " selected" : ""}>${tx}</option>`).join("")}</select>
      <select data-k="c7a" class="grow">${[["1", L("Totalmente automatizado", "Fully automated")], ["0.5", L("Semiautomático", "Semi-automated")], ["0.25", L("Manual", "Manual")]].map(([v, tx]) => `<option value="${v}"${a.c7a === v ? " selected" : ""}>${tx}</option>`).join("")}</select></div>`;
    if (c.check) h += `<label class="chk"><input type="checkbox" data-k="${c.check[0]}"${a[c.check[0]] ? " checked" : ""}> ${esc(c.check[1])}</label>`;
    if (c.hint) h += `<p class="hint small">${esc(c.hint)}</p>`;
    h += `</div>`;
  });
  $("agpForm").innerHTML = h;

  const b = GR.bagi;
  let hb = `<div class="crit"><div class="crit-head"><span class="crit-t">${L("Tipo de muestra (cambia la escala del atributo 10)", "Sample type (changes the scale of attribute 10)")}</span></div>
    <select data-bk="kind"><option value="env"${b.kind === "env" ? " selected" : ""}>${L("Alimentos, ambientales y otras", "Food, environmental and other")}</option><option value="bio"${b.kind === "bio" ? " selected" : ""}>${L("Bioanalíticas (sangre, orina, plasma…)", "Bioanalytical (blood, urine, plasma…)")}</option></select></div>`;
  bagiAttrs(b.kind).forEach(([t, opts], i) => {
    hb += `<div class="crit"><div class="crit-head"><span class="crit-n blue">${i + 1}</span><span class="crit-t">${esc(t)}</span><span class="crit-s" id="bagiS${i}"></span></div>
      <select data-bk="b${i + 1}">${opts.map(([v, tx]) => `<option value="${v}"${Number(b["b" + (i + 1)]) === v ? " selected" : ""}>${esc(tx)} · ${String(v).replace(".", DEC())}</option>`).join("")}</select></div>`;
  });
  $("bagiForm").innerHTML = hb;
  $("grName").value = GR.name;
  $("grPresets").innerHTML = Object.entries(GREEN_PRESETS).map(([k, p]) => `<button type="button" class="chip" data-p="${k}">${esc(L(p.name[0], p.name[1]))}</button>`).join("");
}

function renderGreen() {
  if (!$("verde")) return;
  const res = agpScores(GR.agp);
  res.s.forEach((v, i) => { const el = $("agpS" + i); if (el) { el.textContent = fmtFix(v, 2); el.style.background = agpColor(v); el.style.color = v > 0.32 && v < 0.8 ? "#1d1d1d" : "#fff"; } });
  $("agpPict").innerHTML = agpSvg(res, "");
  const lab = res.total >= 0.75 ? L("muy verde", "very green") : res.total >= 0.5 ? L("aceptable", "acceptable") : res.total >= 0.25 ? L("poco verde", "not very green") : L("nada verde", "not green");
  const worst = res.s.map((v, i) => ({ v, i, imp: (1 - v) * res.w[i] })).sort((x, y) => y.imp - x.imp).slice(0, 2).filter((x) => x.imp > 0.5);
  const crit = agpCriteria();
  $("agpSum").innerHTML = `<div class="big-score" style="color:${agpColor(res.total)}">${fmtFix(res.total, 2)}</div><p>${L("Preparación de muestra", "Sample preparation")} <b>${lab}</b>.</p>` +
    (worst.length ? `<p class="hint small">${L("Lo que más resta (puntuación × peso):", "What costs the most (score × weight):")} ${worst.map((x) => `${x.i + 1}. ${esc(crit[x.i].t)}`).join("; ")}.</p>` : "");

  const tot = bagiTotal(GR.bagi);
  for (let i = 0; i < 10; i++) {
    const v = Number(GR.bagi["b" + (i + 1)]), el = $("bagiS" + i);
    if (el) { el.textContent = String(v).replace(".", DEC()); el.style.background = BAGI_COL[v]; el.style.color = v >= 7.5 ? "#fff" : "#0c305b"; el.style.border = "1px solid #0c305b"; }
  }
  $("bagiPict").innerHTML = bagiSvg(GR.bagi, "");
  const prac = tot >= 60;
  $("bagiSum").innerHTML = `<div class="big-score" style="color:#3a89c1">${String(tot).replace(".", DEC())}</div><p>${prac ? L("El método se considera <b>práctico</b> (≥ 60).", "The method is considered <b>practical</b> (≥ 60).") : L("Por debajo de 60: el método se considera <b>poco práctico</b>.", "Below 60: the method is considered <b>not very practical</b>.")}</p>`;
  saveGreen();
}

function initGreen() {
  if (!$("verde")) return;
  buildGreenForms();
  $("agpForm").addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.w !== undefined) GR.agp.w[Number(t.dataset.w)] = Math.max(0, Math.min(5, Number(t.value) || 0));
    else if (t.dataset.k) GR.agp[t.dataset.k] = t.type === "checkbox" ? t.checked : t.value;
    renderGreen();
  });
  $("bagiForm").addEventListener("input", (e) => {
    const t = e.target; if (!t.dataset.bk) return;
    if (t.dataset.bk === "kind") { GR.bagi.kind = t.value; buildGreenForms(); }
    else GR.bagi[t.dataset.bk] = Number(t.value);
    renderGreen();
  });
  $("grName").addEventListener("input", () => { GR.name = $("grName").value; saveGreen(); });
  $("grPresets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    const p = GREEN_PRESETS[b.dataset.p];
    GR = { name: L(p.name[0], p.name[1]), agp: { ...p.agp, w: p.agp.w.slice() }, bagi: { ...p.bagi } };
    buildGreenForms(); renderGreen();
  });
  $("agpReset").addEventListener("click", () => { GR.agp.w = AGP_W.slice(); buildGreenForms(); renderGreen(); });
  const dl = (kind, png) => {
    const t = GR.name.trim();
    const svg = kind === "agp" ? agpSvg(agpScores(GR.agp), t) : bagiSvg(GR.bagi, t);
    downloadSvg(svg, (kind === "agp" ? "AGREEprep" : "BAGI") + (t ? "_" + t : ""), png);
  };
  $("agpPng").addEventListener("click", () => dl("agp", true));
  $("agpSvg").addEventListener("click", () => dl("agp", false));
  $("bagiPng").addEventListener("click", () => dl("bagi", true));
  $("bagiSvg").addEventListener("click", () => dl("bagi", false));
  renderGreen();
}

VIEWS.splice(VIEWS.indexOf("fondo"), 0, "verde");
const _renderAll4 = renderAll;
renderAll = function () { _renderAll4(); if ($("verde")) { buildGreenForms(); renderGreen(); } };
initGreen();
applyStatic();
route();
