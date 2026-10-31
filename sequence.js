/* PeakLab · Constructor de secuencias de inyección.
   Orden: blancos de disolvente → idoneidad del sistema → calibrado → blanco tras el patrón alto →
   blancos de proceso → muestras (con bloques de control cada N) → bloque final → calibrado de cierre (opcional). */
"use strict";

Object.assign(EN, {
  "sq.cal": "Calibration", "sq.levels": "Levels", "sq.levelsHint": "comma-separated", "sq.rep": "Replicates per level", "sq.bracket": "Repeat at the end",
  "sq.no": "No", "sq.yes": "Yes", "sq.yesBr": "Yes (closing calibration)", "sq.sst": "System suitability injections (SST)", "sq.blankHigh": "Blank after the top standard",
  "sq.qc": "Blanks and controls", "sq.solv": "Solvent blanks at the start", "sq.proc": "Procedural blanks", "sq.qcs": "Quality controls", "sq.qcsHint": "comma-separated names",
  "sq.every": "Control block every (samples)", "sq.ccv": "Include CCV (mid standard)", "sq.blankQc": "Blank after each control block",
  "sq.smp": "Samples and instrument", "sq.samples": "Samples", "sq.samplesHint": "one per line, or just the number", "sq.smpRep": "Replicates per sample",
  "sq.run": "Run time per injection (min)", "sq.vol": "Injection volume (µL)", "sq.method": "Method", "sq.tray": "Tray", "sq.trayNum": "Numbered positions",
  "sq.tray96": "96-well plate (A1–H12)", "sq.tray54": "54-vial rack (A1–F9)", "sq.start": "First position", "sq.prefix": "Data file prefix", "sq.startTime": "Start time",
  "sq.csv": "Download CSV", "sq.copy": "Copy for Excel",
  "sq.h1": "Injection sequence",
  "sq.intro": "Build a complete sequence with blanks, system suitability, calibration, quality controls and samples, with vial positions and run time. Export it as CSV to import into your instrument software or Excel.",
});

const SQ_FIELDS = ["sqLevels", "sqCalRep", "sqBracket", "sqSolv", "sqSst", "sqBlankHigh", "sqProc", "sqSamples", "sqSmpRep", "sqEvery", "sqCcv", "sqQcs", "sqBlankQc", "sqVol", "sqMethod", "sqRun", "sqTray", "sqStart", "sqStartTime", "sqPrefix"];
const SQ_DEF = { sqLevels: "0.5, 1, 2, 5, 10, 20, 50", sqCalRep: "1", sqBracket: "no", sqSolv: "2", sqSst: "0", sqBlankHigh: "yes", sqProc: "1", sqSamples: "", sqSmpRep: "1", sqEvery: "10", sqCcv: "yes", sqQcs: "QC low, QC high", sqBlankQc: "yes", sqVol: "5", sqMethod: "", sqRun: "15", sqTray: "num", sqStart: "1", sqStartTime: "", sqPrefix: "" };

function sqVal(id) { return $(id).value; }

function buildSequence() {
  const levels = sqVal("sqLevels").split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
  const calRep = Math.max(1, parseInt(sqVal("sqCalRep"), 10) || 1);
  const smpRep = Math.max(1, parseInt(sqVal("sqSmpRep"), 10) || 1);
  const every = Math.max(0, parseInt(sqVal("sqEvery"), 10) || 0);
  const nSolv = Math.max(0, parseInt(sqVal("sqSolv"), 10) || 0);
  const nSst = Math.max(0, parseInt(sqVal("sqSst"), 10) || 0);
  const nProc = Math.max(0, parseInt(sqVal("sqProc"), 10) || 0);
  const qcs = sqVal("sqQcs").split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  const prefix = sqVal("sqPrefix").trim();
  let samples = sqVal("sqSamples").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (samples.length === 1 && /^\d+$/.test(samples[0])) samples = Array.from({ length: Number(samples[0]) }, (_, i) => `${L("Muestra", "Sample")} ${String(i + 1).padStart(2, "0")}`);
  const mid = levels.length ? levels[Math.floor((levels.length - 1) / 2)] : "";
  const unit = "";

  // viales: uno por disolución distinta
  const vials = new Map();
  const vialOf = (key) => { if (!vials.has(key)) vials.set(key, vials.size); return vials.get(key); };
  const rows = [];
  const add = (type, name, key, level = "", rep = "") => rows.push({ type, name, key, level, rep, vial: vialOf(key) });
  const T = {
    solv: L("Blanco de disolvente", "Solvent blank"), sst: L("Idoneidad del sistema", "System suitability"), cal: L("Patrón", "Standard"),
    proc: L("Blanco de proceso", "Procedural blank"), ccv: L("Control de calibrado (CCV)", "Calibration check (CCV)"), qc: "QC", smp: L("Muestra", "Sample"),
  };
  const solvBlank = (force) => { const last = rows[rows.length - 1]; if (!force && last && last.key === "solv") return; add("blank", T.solv, "solv"); };
  const calBlock = (tag) => {
    levels.forEach((lv, i) => { for (let r = 1; r <= calRep; r++) add("cal", `${T.cal} ${i + 1}`, "cal" + i, lv, calRep > 1 ? r : ""); });
    if (sqVal("sqBlankHigh") === "yes" && levels.length) solvBlank();
  };
  const qcBlock = () => {
    if (sqVal("sqCcv") === "yes" && mid) add("ccv", T.ccv, "cal" + Math.floor((levels.length - 1) / 2), mid);
    qcs.forEach((q, i) => add("qc", q, "qc" + i));
    if (sqVal("sqBlankQc") === "yes" && (qcs.length || sqVal("sqCcv") === "yes")) solvBlank();
  };

  for (let i = 0; i < nSolv; i++) solvBlank(true);
  for (let i = 0; i < nSst; i++) add("sst", T.sst, "cal" + Math.floor((levels.length - 1) / 2), mid, nSst > 1 ? i + 1 : "");
  calBlock();
  for (let i = 0; i < nProc; i++) add("blank", T.proc, "proc" + i);
  if (qcs.length) qcs.forEach((q, i) => add("qc", q, "qc" + i));
  samples.forEach((s, i) => {
    for (let r = 1; r <= smpRep; r++) add("sample", s, "s" + i, "", smpRep > 1 ? r : "");
    if (every && (i + 1) % every === 0 && i < samples.length - 1) qcBlock();
  });
  if (samples.length) qcBlock();
  if (sqVal("sqBracket") === "yes") calBlock();
  if (nSolv) solvBlank();

  // posiciones
  const start = Math.max(1, parseInt(sqVal("sqStart"), 10) || 1);
  const tray = sqVal("sqTray");
  const pos = (n) => {
    const k = start - 1 + n;
    if (tray === "num") return String(k + 1);
    const [rowsN, cols] = tray === "p96" ? [8, 12] : [6, 9];
    const plate = Math.floor(k / (rowsN * cols)), w = k % (rowsN * cols);
    return (plate ? `P${plate + 1}-` : "") + String.fromCharCode(65 + Math.floor(w / cols)) + (w % cols + 1);
  };
  rows.forEach((r, i) => { r.n = i + 1; r.pos = pos(r.vial); r.file = (prefix ? prefix + "_" : "") + String(i + 1).padStart(3, "0"); });
  return { rows, nVials: vials.size, samples: samples.length };
}

function renderSequence() {
  if (!$("secuencia")) return;
  const S = buildSequence();
  const run = num("sqRun", 15), vol = sqVal("sqVol"), method = sqVal("sqMethod");
  const totMin = S.rows.length * run;
  const st = sqVal("sqStartTime");
  let endTxt = "";
  if (st && /^\d{1,2}:\d{2}$/.test(st)) {
    const [h, m] = st.split(":").map(Number);
    const end = h * 60 + m + totMin;
    const days = Math.floor(end / 1440), mm = end % 1440;
    endTxt = `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}${days ? ` (+${days} ${L(days > 1 ? "días" : "día", days > 1 ? "days" : "day")})` : ""}`;
  }
  const cnt = (t) => S.rows.filter((r) => r.type === t).length;
  $("sqStats").innerHTML = `
    <div class="stat"><div class="k">${L("Inyecciones", "Injections")}</div><div class="v">${S.rows.length}</div><div class="s">${S.samples} ${L("muestras", "samples")} · ${cnt("cal")} ${L("patrones", "standards")} · ${cnt("qc") + cnt("ccv")} QC · ${cnt("blank")} ${L("blancos", "blanks")}</div></div>
    <div class="stat"><div class="k">${L("Viales", "Vials")}</div><div class="v">${S.nVials}</div></div>
    <div class="stat"><div class="k">${L("Duración", "Duration")}</div><div class="v">${fmtFix(totMin / 60, 1)} h</div><div class="s">${endTxt ? L("termina hacia las ", "ends around ") + endTxt : L("indica la hora de inicio para ver cuándo acaba", "set a start time to see when it ends")}</div></div>
    <div class="stat"><div class="k">${L("Muestras por hora", "Samples per hour")}</div><div class="v">${totMin ? fmtFix(S.samples / (totMin / 60), 1) : "—"}</div><div class="s">${L("útil para BAGI y AGREEprep", "useful for BAGI and AGREEprep")}</div></div>`;
  const typeLab = { blank: L("Blanco", "Blank"), sst: "SST", cal: L("Calibrado", "Calibration"), ccv: "CCV", qc: "QC", sample: L("Muestra", "Sample") };
  $("sqTable").innerHTML = `<thead><tr><th class="num">#</th><th>${L("Tipo", "Type")}</th><th>${L("Nombre", "Name")}</th><th class="num">${L("Nivel", "Level")}</th><th class="num">${L("Réplica", "Replicate")}</th><th class="num">${L("Vial", "Vial")}</th><th>${L("Archivo", "Data file")}</th></tr></thead><tbody>` +
    S.rows.map((r) => `<tr class="sq-${r.type}"><td class="num">${r.n}</td><td><span class="badge sq-b-${r.type}">${typeLab[r.type]}</span></td><td>${esc(r.name)}</td><td class="num">${esc(r.level)}</td><td class="num">${r.rep}</td><td class="num">${r.pos}</td><td class="sub">${esc(r.file)}</td></tr>`).join("") + `</tbody>`;
  CSEQ = { S, vol, method };
}
let CSEQ = null;

function seqCsv(sep) {
  const { S, vol, method } = CSEQ;
  const head = ["#", "Type", "Sample name", "Level", "Replicate", "Vial", "Injection volume (uL)", "Method", "Data file"];
  const q = (x) => { x = String(x ?? ""); return sep === "," && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  return [head, ...S.rows.map((r) => [r.n, r.type, r.name, r.level, r.rep, r.pos, vol, method, r.file])].map((row) => row.map(q).join(sep)).join("\n");
}

function initSequence() {
  if (!$("secuencia")) return;
  for (const id of SQ_FIELDS) { const v = store.get(id, null); $(id).value = v !== null ? v : SQ_DEF[id]; }
  if (!$("sqSamples").value.trim()) $("sqSamples").value = "24";
  let pend = null;
  for (const id of SQ_FIELDS) $(id).addEventListener("input", () => { store.set(id, $(id).value); if (!pend) pend = requestAnimationFrame(() => { pend = null; renderSequence(); }); });
  $("sqCsv").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + seqCsv(",")], { type: "text/csv" }));
    a.download = (sqVal("sqPrefix").trim() || "sequence") + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  });
  $("sqCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(seqCsv("\t")); $("sqCopy").textContent = L("¡Copiado!", "Copied!"); setTimeout(applyStatic, 1500); } catch (e) { /* nada */ }
  });
  renderSequence();
}

VIEWS.splice(VIEWS.indexOf("verde"), 0, "secuencia");
const _renderAll8 = renderAll;
renderAll = function () { _renderAll8(); renderSequence(); };
initSequence();
applyStatic();
route();
