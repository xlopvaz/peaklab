/* PeakLab · Transferencia de métodos
   - HPLC: escalado geométrico de gradientes (mismo volumen de gradiente en volúmenes de columna),
     flujo por diámetro y partícula, volumen de inyección, compensación del volumen de retardo,
     presión relativa y comprobación de L/dp según USP <621>.
   - GC: Hagen-Poiseuille para gas compresible (presión de cabeza, velocidad media, tiempo muerto).
   Depende de script.js y chroma.js (simLC, drawChrom, parseList, LC_PRESETS). */
"use strict";

Object.assign(EN, {
  "nav.methods": "Method transfer",
  "home.c6t": "Method transfer",
  "home.c6p": "Move an HPLC method to UHPLC (or any other column) with the gradient, flow and injection volume scaled, and work out GC flows and pressures.",
  "mt.h1": "Method transfer",
  "mt.intro": "Scale an HPLC method to another column while keeping the separation, or work out the pressure, velocity and hold-up time of a GC column.",
  "mt.gcTab": "GC flows",
  "mt.orig": "Original method", "mt.inj": "Injection volume (µL)", "mt.p1": "Original method pressure (bar)", "mt.p1Hint": "optional, to estimate the new one",
  "mt.grad": "Gradient", "mt.gradHint": "time (min) ; % B",
  "mt.new": "New column", "mt.fmode": "New flow", "mt.fOpt": "Scale by diameter and particle size (recommended)", "mt.fGeo": "Scale by diameter only", "mt.fMan": "Manual flow",
  "mt.f2": "Manual flow (mL/min)", "mt.v2": "Dwell volume of the new system (mL)", "mt.v2Hint": "typical UHPLC: 0.1–0.4",
  "mt.newGrad": "Scaled gradient", "mt.copy": "Copy gradient", "mt.res": "Result",
  "mt.cmpChrom": "Simulated comparison", "mt.cmpHint": "using the compounds and solvent from the HPLC simulator", "mt.sOwn": "Each on its own scale", "mt.sSame": "Same time scale",
  "mt.lab1": "Original", "mt.lab2": "Transferred",
  "gf.out": "Column outlet", "gf.atm": "Atmospheric (FID, ECD, NPD…)", "gf.vac": "Vacuum (mass spectrometer)",
  "gf.T": "Oven temperature (°C)",
  "gf.note": "Flow at reference conditions (25 °C, 1 atm), as shown by electronic pressure controllers. Computed with the Hagen-Poiseuille equation for a compressible gas.",
  "gf.tab": "Constant flow versus constant pressure",
  "gf.tabP": "What happens as the oven heats up: in constant flow the instrument raises the pressure; in constant pressure the flow drops because the gas becomes more viscous.",
});

const MT = { mode: store.get("mtMode", "lc"), scale: store.get("mtScale", "own") };
const MT_FIELDS = ["mtL1", "mtD1", "mtP1", "mtF1", "mtI1", "mtV1", "mtPr1", "mtG1", "mtL2", "mtD2", "mtP2", "mtFm", "mtF2", "mtV2", "gfL", "gfD", "gfGas", "gfOut", "gfF", "gfT"];
const MT_GRAD = "0; 10\n1; 10\n16; 95\n19; 95";

function parseGrad(text) {
  const g = [];
  text.split(/\r?\n/).forEach((line) => {
    const parts = splitLine(line.replace(/;/g, " "));
    if (parts.length >= 2) {
      const t = parseNum(parts[0]), b = parseNum(parts[1]);
      if (Number.isFinite(t) && Number.isFinite(b)) g.push([t, clamp(b, 0, 100)]);
    }
  });
  g.sort((a, b) => a[0] - b[0]);
  if (g.length && g[0][0] > 0) g.unshift([0, g[0][1]]);
  return g;
}

/* ---------------- HPLC ---------------- */
function renderTransferLC() {
  const c1 = { L: num("mtL1", 150), id: num("mtD1", 4.6), dp: num("mtP1", 5), F: num("mtF1", 1), inj: num("mtI1", 20), Vd: num("mtV1", 1) };
  const c2 = { L: num("mtL2", 50), id: num("mtD2", 2.1), dp: num("mtP2", 1.7), Vd: num("mtV2", 0.15) };
  const fm = $("mtFm").value;
  $("mtF2wrap").hidden = fm !== "man";
  const g1 = parseGrad($("mtG1").value);
  const ok = [c1.L, c1.id, c1.dp, c1.F, c2.L, c2.id, c2.dp].every((v) => v > 0) && g1.length >= 2;
  if (!ok) {
    $("mtGtab").innerHTML = ""; $("mtStats").innerHTML = "";
    $("mtNotes").innerHTML = `<div class="note warn">${L("Revisa las dimensiones, el flujo y que el gradiente tenga al menos dos líneas.", "Check the dimensions, the flow and that the gradient has at least two lines.")}</div>`;
    $("mtChart1").innerHTML = ""; $("mtChart2").innerHTML = "";
    return;
  }

  const rV = (c2.id * c2.id * c2.L) / (c1.id * c1.id * c1.L);       // relación de volúmenes de columna
  const F2 = fm === "opt" ? c1.F * (c2.id / c1.id) ** 2 * (c1.dp / c2.dp)
    : fm === "geo" ? c1.F * (c2.id / c1.id) ** 2 : Math.max(0.001, num("mtF2", 0.4));
  const ts = rV * c1.F / F2;                                          // factor de tiempos
  const inj2 = c1.inj * rV;
  // compensación del retardo: mismo volumen de retardo expresado en volúmenes de columna
  const dly = (c1.Vd * rV - c2.Vd) / F2;                              // min (+ añadir isocrático, − retrasar inyección)
  let g2 = g1.map(([t, b]) => [t * ts, b]);
  if (dly > 0.005) g2 = [[0, g2[0][1]], ...g2.map(([t, b]) => [t + dly, b])];

  const tEnd1 = g1[g1.length - 1][0], tEnd2 = g2[g2.length - 1][0];
  const sol1 = tEnd1 * c1.F, sol2 = tEnd2 * F2;
  const pRatio = (F2 / c1.F) * (c2.L / c1.L) * (c1.id / c2.id) ** 2 * (c1.dp / c2.dp) ** 2;
  const ld1 = c1.L * 1000 / c1.dp, ld2 = c2.L * 1000 / c2.dp, ldCh = (ld2 / ld1 - 1) * 100;
  const rsRatio = Math.sqrt(ld2 / ld1);

  // presión: a partir de la original si se conoce; si no, estimación con el modelo del simulador
  const org = $("lcOrg") ? $("lcOrg").value : "acn";
  const cmps = parseList($("lcCmp") ? $("lcCmp").value : LC_PRESETS.pharma, 2);
  const sim1 = simLC({ L: c1.L, id: c1.id, dp: c1.dp, org, F: c1.F, Vd: c1.Vd, prog: g1, b0: 0, b1: 0, h0: 0, tg: 1, h1: 0 }, cmps);
  const sim2 = simLC({ L: c2.L, id: c2.id, dp: c2.dp, org, F: F2, Vd: c2.Vd, prog: g2, b0: 0, b1: 0, h0: 0, tg: 1, h1: 0 }, cmps);
  const p1user = parseNum($("mtPr1").value);
  const p1 = Number.isFinite(p1user) && p1user > 0 ? p1user : sim1.dPbar;
  const p2 = p1 * pRatio;

  // tabla del gradiente escalado
  $("mtGtab").innerHTML = `<thead><tr><th class="num">${L("Tiempo (min)", "Time (min)")}</th><th class="num">% B</th><th class="num">${L("Flujo (mL/min)", "Flow (mL/min)")}</th></tr></thead><tbody>` +
    g2.map(([t, b]) => `<tr><td class="num">${fmtFix(t, 2)}</td><td class="num">${fmt(b, 3)}</td><td class="num">${fmtFix(F2, 3)}</td></tr>`).join("") + `</tbody>`;
  MT.g2 = g2; MT.F2 = F2;

  const saveT = (1 - tEnd2 / tEnd1) * 100, saveS = (1 - sol2 / sol1) * 100;
  $("mtStats").innerHTML = `
    <div class="stat"><div class="k">${L("Flujo nuevo", "New flow")}</div><div class="v">${fmtFix(F2, 3)} mL/min</div><div class="s">${L("antes", "was")} ${fmtFix(c1.F, 3)}</div></div>
    <div class="stat"><div class="k">${L("Volumen de inyección", "Injection volume")}</div><div class="v">${fmt(inj2, 3)} µL</div><div class="s">${L("antes", "was")} ${fmt(c1.inj, 3)} µL</div></div>
    <div class="stat"><div class="k">${L("Presión estimada", "Estimated pressure")}</div><div class="v">${fmt(p2, 3)} bar</div><div class="s">×${fmt(pRatio, 3)} ${Number.isFinite(p1user) && p1user > 0 ? L("respecto a la original", "vs the original") : L("(estimación del modelo)", "(model estimate)")}</div></div>
    <div class="stat"><div class="k">${L("Duración", "Run time")}</div><div class="v">${fmtFix(tEnd2, 1)} min</div><div class="s">${L("antes", "was")} ${fmtFix(tEnd1, 1)} min · ${saveT >= 0 ? "−" : "+"}${fmtFix(Math.abs(saveT), 0)} %</div></div>
    <div class="stat"><div class="k">${L("Disolvente por análisis", "Solvent per run")}</div><div class="v">${fmt(sol2, 3)} mL</div><div class="s">${L("antes", "was")} ${fmt(sol1, 3)} mL · ${saveS >= 0 ? "−" : "+"}${fmtFix(Math.abs(saveS), 0)} %</div></div>
    <div class="stat"><div class="k">L/d<sub>p</sub></div><div class="v">${fmt(ld2, 3)}</div><div class="s">${L("antes", "was")} ${fmt(ld1, 3)} · ${ldCh >= 0 ? "+" : "−"}${fmtFix(Math.abs(ldCh), 0)} %</div></div>`;

  const notes = [];
  if (ldCh >= -25 && ldCh <= 50) notes.push(["good", L(`El cambio de L/dp (${ldCh >= 0 ? "+" : ""}${fmtFix(ldCh, 0)} %) está dentro del intervalo de −25 % a +50 % que permite la USP <621> sin revalidar.`, `The L/dp change (${ldCh >= 0 ? "+" : ""}${fmtFix(ldCh, 0)} %) is within the −25 % to +50 % range allowed by USP <621> without revalidation.`)]);
  else notes.push(["warn", L(`El cambio de L/dp (${ldCh >= 0 ? "+" : ""}${fmtFix(ldCh, 0)} %) sale del intervalo de −25 % a +50 % de la USP <621>: sería un método nuevo que habría que validar.`, `The L/dp change (${ldCh >= 0 ? "+" : ""}${fmtFix(ldCh, 0)} %) is outside the USP <621> range of −25 % to +50 %: it would be a new method needing validation.`)]);
  notes.push([rsRatio < 0.9 ? "warn" : "", L(`Resolución esperada ≈ ${fmtFix(rsRatio * 100, 0)} % de la original (proporcional a √(L/dp)).`, `Expected resolution ≈ ${fmtFix(rsRatio * 100, 0)} % of the original (proportional to √(L/dp)).`)]);
  if (dly > 0.005) notes.push(["", L(`Se ha añadido un isocrático inicial de ${fmtFix(dly, 2)} min para compensar que el nuevo equipo tiene menos volumen de retardo (así la selectividad no cambia).`, `An initial isocratic hold of ${fmtFix(dly, 2)} min was added because the new system has a smaller dwell volume (this keeps selectivity unchanged).`)]);
  else if (dly < -0.005) notes.push(["warn", L(`El nuevo equipo tiene proporcionalmente más volumen de retardo: retrasa la inyección ${fmtFix(-dly, 2)} min respecto al inicio del gradiente (si tu software lo permite) para no cambiar la selectividad.`, `The new system has proportionally more dwell volume: delay the injection by ${fmtFix(-dly, 2)} min after the gradient starts (if your software allows it) to keep selectivity unchanged.`)]);
  if (p2 > 1000) notes.push(["bad", L("La presión estimada supera 1000 bar: baja el flujo o usa una columna de partícula superficialmente porosa (core-shell), que da eficiencia parecida con menos presión.", "Estimated pressure exceeds 1000 bar: lower the flow or use a superficially porous (core-shell) column, which gives similar efficiency at lower pressure.")]);
  else if (p2 > 400) notes.push(["", L("Más de 400 bar: necesitas un equipo UHPLC.", "Above 400 bar: you need a UHPLC system.")]);
  if (inj2 < 0.5) notes.push(["warn", L("El volumen de inyección escalado es muy pequeño: puede que tu inyector no sea preciso por debajo de 0,5–1 µL. Puedes inyectar algo más si el disolvente de la muestra es débil.", "The scaled injection volume is very small: your autosampler may not be precise below 0.5–1 µL. You can inject a little more if the sample solvent is weak.")]);
  if (c2.id <= 2.1 && c1.id > 3) notes.push(["", L("En columnas de 2,1 mm el volumen extracolumna (tubos, celda del detector) pesa mucho más: usa tubos cortos y estrechos.", "With 2.1 mm columns, extra-column volume (tubing, detector cell) matters much more: use short, narrow tubing.")]);
  $("mtNotes").innerHTML = notes.map(([c, t]) => `<div class="note ${c}">${esc(t)}</div>`).join("");

  // cromatogramas comparados con la misma escala de tiempo
  if (cmps.length) {
    const last = (sim) => { const e = sim.peaks.filter((q) => q.eluted); return e.length ? Math.max(...e.map((q) => q.tR + 5 * q.sigma)) : 0; };
    document.querySelectorAll("#mtScale button").forEach((b) => b.classList.toggle("on", b.dataset.s === MT.scale));
    const tMax = MT.scale === "same" ? Math.max(tEnd1, tEnd2, last(sim1), last(sim2)) * 1.03 : 0;
    drawChrom(sim1, true, "mtChart1", tMax);
    drawChrom(sim2, true, "mtChart2", tMax);
  }
}

/* ---------------- GC ---------------- */
const GF_GAS = { he: { eta: 1.99e-5, x: 0.69, u: [20, 40] }, h2: { eta: 0.89e-5, x: 0.68, u: [35, 60] }, n2: { eta: 1.78e-5, x: 0.72, u: [10, 18] } };

// Hagen-Poiseuille compresible. F en mL/min a 25 °C y 1 atm. Devuelve presiones absolutas (Pa), velocidad media (cm/s) y t0 (min).
function gcFlow(Lm, idMm, gas, F, TC, vac) {
  const g = GF_GAS[gas], T = TC + 273.15;
  const eta = g.eta * Math.pow(T / 298.15, g.x);
  const r = idMm / 2000, Pref = 101325;
  const po = vac ? 0 : Pref;
  const q = Pref * (F * 1e-6 / 60) * (T / 298.15);                  // p·Q (Pa·m³/s), se conserva
  const pi = Math.sqrt(po * po + 16 * eta * Lm * q / (Math.PI * r ** 4));
  const t0 = 32 * eta * Lm * Lm / (3 * r * r) * (pi ** 3 - po ** 3) / (pi * pi - po * po) ** 2; // s
  return { pi, po, eta, t0: t0 / 60, u: Lm * 100 / t0 };
}
// Flujo para una presión de cabeza dada (absoluta, Pa)
function gcFlowAtP(Lm, idMm, gas, pi, TC, vac) {
  const g = GF_GAS[gas], T = TC + 273.15;
  const eta = g.eta * Math.pow(T / 298.15, g.x);
  const r = idMm / 2000, Pref = 101325, po = vac ? 0 : Pref;
  const q = (pi * pi - po * po) * Math.PI * r ** 4 / (16 * eta * Lm);
  return q / (Pref * (T / 298.15)) * 60 * 1e6;
}
// Flujo que da una velocidad media dada (bisección)
function gcFlowForU(Lm, idMm, gas, uTarget, TC, vac) {
  let a = 0.001, b = 200;
  for (let j = 0; j < 60; j++) { const mid = Math.sqrt(a * b); if (gcFlow(Lm, idMm, gas, mid, TC, vac).u < uTarget) a = mid; else b = mid; }
  return Math.sqrt(a * b);
}

function renderTransferGC() {
  const Lm = num("gfL", 30), id = num("gfD", 0.25), gas = $("gfGas").value, vac = $("gfOut").value === "vac";
  const F = num("gfF", 1), T = num("gfT", 50);
  if (!(Lm > 0 && id > 0 && F > 0)) { $("gfStats").innerHTML = ""; $("gfTable").innerHTML = ""; return; }
  const r = gcFlow(Lm, id, gas, F, T, vac);
  const gauge = (r.pi - 101325) / 1e5;
  const psi = gauge * 14.5038, kpa = gauge * 100;
  const g = GF_GAS[gas];
  const fLo = gcFlowForU(Lm, id, gas, g.u[0], T, vac), fHi = gcFlowForU(Lm, id, gas, g.u[1], T, vac);
  $("gfStats").innerHTML = `
    <div class="stat"><div class="k">${L("Presión en cabeza (manométrica)", "Head pressure (gauge)")}</div><div class="v">${fmtFix(psi, 2)} psi</div><div class="s">${fmtFix(kpa, 1)} kPa · ${fmtFix(gauge, 3)} bar</div></div>
    <div class="stat"><div class="k">${L("Velocidad media del gas", "Average gas velocity")}</div><div class="v">${fmtFix(r.u, 1)} cm/s</div><div class="s">${L("óptimo para este gas", "optimum for this gas")}: ${g.u[0]}–${g.u[1]}</div></div>
    <div class="stat"><div class="k">${L("Tiempo muerto (t₀)", "Hold-up time (t₀)")}</div><div class="v">${fmtFix(r.t0, 3)} min</div><div class="s">${fmtFix(r.t0 * 60, 1)} s</div></div>
    <div class="stat"><div class="k">${L("Flujo para la velocidad óptima", "Flow for optimal velocity")}</div><div class="v">${fmtFix(fLo, 2)}–${fmtFix(fHi, 2)}</div><div class="s">mL/min</div></div>`;
  const notes = [];
  if (gauge < 0) notes.push(["warn", L("La presión de cabeza sale por debajo de la atmosférica: con salida a vacío y columnas cortas o anchas el control de presión no es estable. Usa una columna más larga o más estrecha, o un restrictor.", "Head pressure comes out below atmospheric: with a vacuum outlet and short or wide columns, pressure control is unstable. Use a longer or narrower column, or a restrictor.")]);
  if (r.u < g.u[0]) notes.push(["", L("Velocidad por debajo del óptimo: análisis más lento y picos más anchos.", "Velocity below the optimum: slower run and broader peaks.")]);
  else if (r.u > g.u[1] * 1.3) notes.push(["", L("Velocidad bastante por encima del óptimo: ganas tiempo pero pierdes eficiencia.", "Velocity well above the optimum: faster, but less efficient.")]);
  else notes.push(["good", L("Velocidad dentro del intervalo óptimo para este gas.", "Velocity within the optimal range for this gas.")]);
  if (vac && F > 2 && id <= 0.25) notes.push(["warn", L("Más de 2 mL/min en un MS puede superar la capacidad de bombeo de muchos equipos de sobremesa.", "More than 2 mL/min into an MS may exceed the pumping capacity of many benchtop instruments.")]);
  if (gas === "h2") notes.push(["", L("Con hidrógeno, revisa la seguridad (sensor de fugas) y, en GC-MS, que la fuente esté preparada para H₂.", "With hydrogen, check safety (leak sensor) and, for GC-MS, that the ion source is suited to H₂.")]);
  $("gfNotes").innerHTML = notes.map(([c, t]) => `<div class="note ${c}">${esc(t)}</div>`).join("");

  // tabla de temperaturas: flujo constante vs presión constante (la fijada a la T indicada)
  const temps = [...new Set([T, 50, 100, 150, 200, 250, 300, 325].filter((x) => x >= Math.min(T, 50)))].sort((a, b) => a - b);
  $("gfTable").innerHTML = `<thead><tr><th class="num">T (°C)</th><th class="num">${L("Flujo constante: presión (psi)", "Constant flow: pressure (psi)")}</th><th class="num">${L("Flujo constante: velocidad (cm/s)", "Constant flow: velocity (cm/s)")}</th><th class="num">${L("Presión constante: flujo (mL/min)", "Constant pressure: flow (mL/min)")}</th><th class="num">${L("Presión constante: velocidad (cm/s)", "Constant pressure: velocity (cm/s)")}</th></tr></thead><tbody>` +
    temps.map((tc) => {
      const cf = gcFlow(Lm, id, gas, F, tc, vac);
      const fcp = gcFlowAtP(Lm, id, gas, r.pi, tc, vac);
      const cp = gcFlow(Lm, id, gas, fcp, tc, vac);
      return `<tr${tc === T ? ' class="hit"' : ""}><td class="num">${tc}</td><td class="num">${fmtFix((cf.pi - 101325) / 1e5 * 14.5038, 2)}</td><td class="num">${fmtFix(cf.u, 1)}</td><td class="num">${fmtFix(fcp, 3)}</td><td class="num">${fmtFix(cp.u, 1)}</td></tr>`;
    }).join("") + `</tbody>`;
}

/* ---------------- Interfaz ---------------- */
function renderTransfer() {
  if (!$("metodos")) return;
  const isLC = MT.mode === "lc";
  $("mtLc").hidden = !isLC; $("mtGc").hidden = isLC;
  document.querySelectorAll("#mtMode button").forEach((b) => b.classList.toggle("on", b.dataset.m === MT.mode));
  if (isLC) renderTransferLC(); else renderTransferGC();
}

function initTransfer() {
  if (!$("metodos")) return;
  for (const id of MT_FIELDS) { const v = store.get(id, null); if (v !== null) $(id).value = v; }
  if (!$("mtG1").value.trim()) $("mtG1").value = MT_GRAD;
  let pending = null;
  const schedule = () => { if (pending) return; pending = requestAnimationFrame(() => { pending = null; renderTransfer(); }); };
  for (const id of MT_FIELDS) $(id).addEventListener("input", () => { store.set(id, $(id).value); schedule(); });
  $("mtMode").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]"); if (!b) return;
    MT.mode = b.dataset.m; store.set("mtMode", MT.mode); renderTransfer();
  });
  $("mtScale").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-s]"); if (!b) return;
    MT.scale = b.dataset.s; store.set("mtScale", MT.scale); renderTransfer();
  });
  $("mtCopy").addEventListener("click", async () => {
    if (!MT.g2) return;
    const txt = MT.g2.map(([t, b]) => `${fmtFix(t, 2)}\t${fmt(b, 3)}\t${fmtFix(MT.F2, 3)}`).join("\n");
    try { await navigator.clipboard.writeText(txt); $("mtCopy").textContent = L("¡Copiado!", "Copied!"); setTimeout(applyStatic, 1500); } catch (e) { /* nada */ }
  });
  // los compuestos del simulador también afectan a la comparación
  ["lcCmp", "lcOrg", "lcPreset"].forEach((id) => $(id) && $(id).addEventListener("input", () => { if (CURRENT === "metodos") schedule(); }));
  renderTransfer();
}

VIEWS.splice(VIEWS.indexOf("fondo"), 0, "metodos");
const _renderAll2 = renderAll;
renderAll = function () { _renderAll2(); renderTransfer(); };
initTransfer();
applyStatic();
route();
// al entrar en la pestaña, recalcular (los compuestos del simulador pueden haber cambiado)
window.addEventListener("hashchange", () => { if (location.hash === "#metodos") renderTransfer(); });
