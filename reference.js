/* PeakLab · Referencia: derivatización, columnas, disolventes y tampones, normativa.
   Los datos de normativa y equivalencias se han contrastado con las fuentes enlazadas en cada tarjeta. */
"use strict";

Object.assign(EN, {
  "dv.calc": "Derivative calculator", "dv.formula": "Analyte formula", "dv.reagent": "Reagent", "dv.sites": "Sites", "dv.fromDraw": "Use the drawn structure",
  "dv.note": "Indicative conditions: optimise them for your analyte and matrix. All these reagents are moisture-sensitive or toxic; work in a fume hood and check the safety data sheet.",
  "co.gc": "GC: equivalent phases", "co.lc": "LC: USP codes and example columns",
  "co.gcNote": "“Equivalent” means the same phase composition; inertness, bleed and temperature limits differ between brands. * Approximate code: check with the manufacturer.",
  "co.lcNote": "In LC, two columns with the same USP code can separate very differently. To find substitutes, use the USP column equivalency database (PQRI) or the manufacturer's tool. If two peaks co-elute on C18, the biggest selectivity changes come from: methanol ↔ acetonitrile, pH, phenyl or PFP, and temperature.",
  "sv.props": "Solvent properties", "sv.note": "Typical values at 20–25 °C; the UV cut-off depends on solvent grade. P′: Snyder polarity index.",
  "sv.vv": "GC: vapour volume in the inlet", "sv.solvent": "Solvent", "sv.inj": "Injected volume (µL)", "sv.T": "Inlet temperature (°C)", "sv.P": "Head pressure",
  "sv.liner": "Liner volume", "sv.l4": "4 mm i.d. (~0.9 mL)", "sv.l2": "2 mm i.d. (~0.25 mL)", "sv.l4t": "4 mm tapered (~0.75 mL)",
  "sv.buf": "LC: buffer calculator", "sv.sys": "System", "sv.bFor": "Ammonium formate / formic acid (pH 2.8–4.8)", "sv.bAce": "Ammonium acetate / acetic acid (pH 3.8–5.8)",
  "sv.bAmm": "Ammonium acetate / ammonia (pH 8.3–10.3)", "sv.bP1": "KH₂PO₄ / H₃PO₄ (pH 1.2–3.2)", "sv.bP2": "KH₂PO₄ / K₂HPO₄ (pH 6.2–8.2)",
  "sv.pH": "Target pH", "sv.conc": "Concentration (mM)", "sv.vol": "Volume (mL)", "sv.bufHint": "Concentration refers to the salt (for phosphate pH 6–8, total phosphate).",
  "sv.add": "Mobile-phase additives and buffers", "sv.addNote": "Useful range of a buffer: pKa ± 1. pKa values are in water at 25 °C; with organic modifier the apparent pH shifts.",
  "dv.h1": "Derivatization",
  "dv.intro": "Common GC and LC derivatization reagents: what they react with, typical conditions and diagnostic ions. The calculator gives the formula and mass of the derivative to look for in your spectrum.",
  "co.h1": "Columns",
  "co.intro": "Equivalent GC phases across manufacturers with their USP code, and USP L codes for LC with example columns and when to use them.",
  "sv.h1": "Solvents and buffers",
  "sv.intro": "Solvent properties for LC and GC, the vapour volume of your injection compared with the liner, LC mobile-phase additives and a buffer calculator.",
  "nr.h1": "Guidelines",
  "nr.intro": "Key numerical criteria of the most used chromatography guidelines, with a link to the official text. Always check the version in force before applying them.",
});

/* =========================================================
   DERIVATIZACIÓN
   ========================================================= */
// d: cambio de fórmula por sitio; g: grupos que reaccionan (para proponer el nº de sitios)
const DERIV = [
  { id: "bstfa", n: "BSTFA (+1 % TMCS)", type: "GC", fam: ["Sililación (TMS)", "Silylation (TMS)"], d: { C: 3, H: 8, Si: 1 }, g: ["alcohol", "phenol", "acid", "thiol", "amineNH"],
    tg: ["–OH, –COOH, –SH, –NH (aminas)", "–OH, –COOH, –SH, –NH (amines)"],
    cond: ["60–80 °C, 30–60 min, en piridina o acetonitrilo secos; se inyecta con el exceso de reactivo.", "60–80 °C, 30–60 min, in dry pyridine or acetonitrile; inject with the excess reagent."],
    ions: ["m/z 73 [Si(CH₃)₃]⁺, [M−15]⁺; m/z 147 con varios grupos TMS", "m/z 73 [Si(CH₃)₃]⁺, [M−15]⁺; m/z 147 with several TMS groups"],
    note: ["Muy sensible a la humedad. El TMCS cataliza los grupos impedidos.", "Very moisture-sensitive. TMCS catalyses hindered groups."] },
  { id: "mstfa", n: "MSTFA", type: "GC", fam: ["Sililación (TMS)", "Silylation (TMS)"], d: { C: 3, H: 8, Si: 1 }, g: ["alcohol", "phenol", "acid", "thiol", "amineNH"],
    tg: ["–OH, –COOH, –SH, –NH", "–OH, –COOH, –SH, –NH"],
    cond: ["30–60 °C, 30–60 min. En metabolómica, después de la oximación con MOX.", "30–60 °C, 30–60 min. In metabolomics, after oximation with MOX."],
    ions: ["m/z 73, [M−15]⁺", "m/z 73, [M−15]⁺"],
    note: ["Su subproducto es el más volátil de los reactivos TMS: interfiere menos con los picos tempranos.", "Its by-product is the most volatile of the TMS reagents: less interference with early peaks."] },
  { id: "mtbstfa", n: "MTBSTFA", type: "GC", fam: ["Sililación (TBDMS)", "Silylation (TBDMS)"], d: { C: 6, H: 14, Si: 1 }, g: ["alcohol", "phenol", "acid", "thiol", "amineNH"],
    tg: ["–OH, –COOH, –SH, –NH", "–OH, –COOH, –SH, –NH"],
    cond: ["60–100 °C, 30–60 min o más.", "60–100 °C, 30–60 min or longer."],
    ions: ["[M−57]⁺ (pérdida de terc-butilo) muy intenso; m/z 73, 75", "[M−57]⁺ (loss of tert-butyl), very intense; m/z 73, 75"],
    note: ["Derivados mucho más estables a la hidrólisis que los TMS; reacciona mal con grupos muy impedidos.", "Derivatives far more stable to hydrolysis than TMS; reacts poorly with very hindered groups."] },
  { id: "bf3", n: "BF₃/metanol (10–14 %)", type: "GC", fam: ["Esterificación (metil ésteres)", "Esterification (methyl esters)"], d: { C: 1, H: 2 }, g: ["acid"],
    tg: ["–COOH (y transesterificación de lípidos)", "–COOH (and transesterification of lipids)"],
    cond: ["60–100 °C, 5–30 min; extracción de los ésteres con hexano.", "60–100 °C, 5–30 min; extract the esters into hexane."],
    ions: ["FAME saturados: m/z 74 (McLafferty) y 87", "Saturated FAMEs: m/z 74 (McLafferty) and 87"],
    note: ["Método clásico para ésteres metílicos de ácidos grasos (FAME).", "Classic method for fatty acid methyl esters (FAMEs)."] },
  { id: "tmsh", n: "TMSH", type: "GC", fam: ["Metilación en el inyector", "In-inlet methylation"], d: { C: 1, H: 2 }, g: ["acid", "phenol"],
    tg: ["–COOH, fenoles", "–COOH, phenols"],
    cond: ["Se mezcla con la muestra y reacciona en el inyector caliente (≥ 250 °C).", "Mixed with the sample; reacts in the hot inlet (≥ 250 °C)."],
    ions: ["Igual que los metil ésteres", "As for methyl esters"],
    note: ["Rápido y automatizable; ensucia el liner con el tiempo.", "Fast and automatable; fouls the liner over time."] },
  { id: "tmsdm", n: "TMS-diazometano", type: "GC", fam: ["Metilación", "Methylation"], d: { C: 1, H: 2 }, g: ["acid"],
    tg: ["–COOH (fenoles, lentamente)", "–COOH (phenols, slowly)"],
    cond: ["Temperatura ambiente, en metanol/tolueno.", "Room temperature, in methanol/toluene."],
    ions: ["Igual que los metil ésteres", "As for methyl esters"],
    note: ["Sustituto más seguro que el diazometano, pero muy tóxico por inhalación: siempre en vitrina.", "Safer than diazomethane but very toxic by inhalation: always in a fume hood."] },
  { id: "tfaa", n: "TFAA", type: "GC", fam: ["Acilación (trifluoroacetil)", "Acylation (trifluoroacetyl)"], d: { C: 2, F: 3, O: 1, H: -1 }, g: ["amineNH", "alcohol", "phenol", "thiol"],
    tg: ["Aminas, –OH, fenoles", "Amines, –OH, phenols"],
    cond: ["50–70 °C, 15–30 min en acetato de etilo; evapora el ácido formado antes de inyectar.", "50–70 °C, 15–30 min in ethyl acetate; evaporate the acid formed before injecting."],
    ions: ["m/z 69 [CF₃]⁺", "m/z 69 [CF₃]⁺"],
    note: ["Muy útil para anfetaminas y aminas. Sensible en ECD y NCI.", "Very useful for amphetamines and amines. Sensitive in ECD and NCI."] },
  { id: "pfpa", n: "PFPA", type: "GC", fam: ["Acilación (pentafluoropropionil)", "Acylation (pentafluoropropionyl)"], d: { C: 3, F: 5, O: 1, H: -1 }, g: ["amineNH", "alcohol", "phenol", "thiol"],
    tg: ["Aminas, –OH, fenoles", "Amines, –OH, phenols"], cond: ["50–70 °C, 15–30 min; evapora el ácido antes de inyectar.", "50–70 °C, 15–30 min; evaporate the acid before injecting."],
    ions: ["m/z 119 [C₂F₅]⁺", "m/z 119 [C₂F₅]⁺"], note: ["Más masa y más sensibilidad en ECD que TFAA.", "Higher mass and ECD response than TFAA."] },
  { id: "hfba", n: "HFBA", type: "GC", fam: ["Acilación (heptafluorobutiril)", "Acylation (heptafluorobutyryl)"], d: { C: 4, F: 7, O: 1, H: -1 }, g: ["amineNH", "alcohol", "phenol", "thiol"],
    tg: ["Aminas, –OH, fenoles", "Amines, –OH, phenols"], cond: ["50–70 °C, 15–30 min; evapora el ácido antes de inyectar.", "50–70 °C, 15–30 min; evaporate the acid before injecting."],
    ions: ["m/z 169 [C₃F₇]⁺", "m/z 169 [C₃F₇]⁺"], note: ["El que más aumenta la masa: aleja los iones del ruido de fondo.", "Adds the most mass: moves ions away from background noise."] },
  { id: "ac2o", n: ["Anhídrido acético", "Acetic anhydride"], type: "GC", fam: ["Acetilación", "Acetylation"], d: { C: 2, H: 2, O: 1 }, g: ["amineNH", "alcohol", "phenol"],
    tg: ["Fenoles (en medio acuoso), –OH y aminas (con piridina)", "Phenols (in aqueous medium), –OH and amines (with pyridine)"],
    cond: ["Fenoles: directamente en la muestra acuosa con K₂CO₃. Alcoholes y aminas: con piridina a 60 °C.", "Phenols: directly in the aqueous sample with K₂CO₃. Alcohols and amines: with pyridine at 60 °C."],
    ions: ["Pérdida de 42 (cetena) desde el ion molecular", "Loss of 42 (ketene) from the molecular ion"],
    note: ["Barato y compatible con agua para fenoles y clorofenoles.", "Cheap and water-compatible for phenols and chlorophenols."] },
  { id: "pfbbr", n: "PFBBr", type: "GC", fam: ["Pentafluorobencilación", "Pentafluorobenzylation"], d: { C: 7, H: 1, F: 5 }, g: ["acid", "phenol", "thiol"],
    tg: ["–COOH, fenoles, tioles", "–COOH, phenols, thiols"],
    cond: ["Con K₂CO₃ en acetona, 60 °C, 30–60 min.", "With K₂CO₃ in acetone, 60 °C, 30–60 min."],
    ions: ["EI: m/z 181 [C₇H₂F₅]⁺. NCI: [M−181]⁻ (anión del analito)", "EI: m/z 181 [C₇H₂F₅]⁺. NCI: [M−181]⁻ (analyte anion)"],
    note: ["Para trazas por ECD o MS en ionización química negativa. Lacrimógeno.", "For traces by ECD or negative chemical ionization MS. Lachrymator."] },
  { id: "mox", n: ["Metoxiamina (MOX)", "Methoxyamine (MOX)"], type: "GC", fam: ["Oximación", "Oximation"], d: { C: 1, H: 3, N: 1 }, g: ["carbonyl"],
    tg: ["Aldehídos y cetonas", "Aldehydes and ketones"],
    cond: ["Clorhidrato en piridina (~20 mg/mL), 30–37 °C, 90 min; después, sililación.", "Hydrochloride in pyridine (~20 mg/mL), 30–37 °C, 90 min; then silylate."],
    ions: ["[M−31]⁺ (pérdida de OCH₃)", "[M−31]⁺ (loss of OCH₃)"],
    note: ["Evita los múltiples picos de enoles y formas cíclicas de azúcares. Cada carbonilo da isómeros syn/anti (dos picos).", "Prevents multiple enol and cyclic sugar peaks. Each carbonyl gives syn/anti isomers (two peaks)."] },
  { id: "nabet4", n: "NaBEt₄", type: "GC", fam: ["Etilación de organometálicos", "Ethylation of organometallics"], d: { C: 2, H: 5, Cl: -1 }, g: [],
    tg: ["Especies de Hg, Sn y Pb (sustituye el contraión por etilo)", "Hg, Sn and Pb species (replaces the counter-ion with ethyl)"],
    cond: ["En fase acuosa a pH 4–5 (tampón acetato); extracción en hexano o isooctano, o espacio de cabeza / SPME.", "In aqueous phase at pH 4–5 (acetate buffer); extract into hexane or isooctane, or headspace / SPME."],
    ions: ["Patrón isotópico del metal (Hg, Sn, Pb)", "Isotope pattern of the metal (Hg, Sn, Pb)"],
    note: ["Escribe la fórmula con el contraión (p. ej. CH3HgCl); cada sitio sustituye un Cl por C₂H₅. Detección por GC-MS o GC-ICP-MS.", "Enter the formula with its counter-ion (e.g. CH3HgCl); each site replaces one Cl with C₂H₅. Detect by GC-MS or GC-ICP-MS."] },
  { id: "fmoc", n: "FMOC-Cl", type: "LC", fam: ["Carbamoilación (Fmoc)", "Carbamoylation (Fmoc)"], d: { C: 15, H: 10, O: 2 }, g: ["amineNH"],
    tg: ["Aminas primarias y secundarias (glifosato, AMPA, aminoácidos)", "Primary and secondary amines (glyphosate, AMPA, amino acids)"],
    cond: ["Tampón borato pH ~9, temperatura ambiente, de 30 min a toda la noche; elimina el exceso con lavado orgánico.", "Borate buffer pH ~9, room temperature, 30 min to overnight; remove the excess with an organic wash."],
    ions: ["LC-MS: [M−H]⁻ o [M+H]⁺; fragmento m/z 179 (fluorenilmetilo). FLD: ex 260 / em 315 nm", "LC-MS: [M−H]⁻ or [M+H]⁺; fragment m/z 179 (fluorenylmethyl). FLD: ex 260 / em 315 nm"],
    note: ["Hace retener en C18 a compuestos muy polares.", "Makes very polar compounds retain on C18."] },
  { id: "dansyl", n: ["Cloruro de dansilo", "Dansyl chloride"], type: "LC", fam: ["Sulfonilación (dansilo)", "Sulfonylation (dansyl)"], d: { C: 12, H: 11, N: 1, O: 2, S: 1 }, g: ["amineNH", "phenol"],
    tg: ["Aminas y fenoles (p. ej. estrógenos)", "Amines and phenols (e.g. oestrogens)"],
    cond: ["Tampón carbonato pH 9,5–10,5, ~60 °C, 10–60 min.", "Carbonate buffer pH 9.5–10.5, ~60 °C, 10–60 min."],
    ions: ["ESI(+) [M+H]⁺; fragmento m/z 171 (dimetilaminonaftaleno)", "ESI(+) [M+H]⁺; fragment m/z 171 (dimethylaminonaphthalene)"],
    note: ["Aumenta mucho la señal en ESI(+) de fenoles que ionizan mal.", "Greatly boosts ESI(+) response of poorly ionizing phenols."] },
  { id: "dnph", n: "DNPH", type: "LC", fam: ["Hidrazonas", "Hydrazones"], d: { C: 6, H: 4, N: 4, O: 3 }, g: ["carbonyl"],
    tg: ["Aldehídos y cetonas", "Aldehydes and ketones"],
    cond: ["Medio ácido; en aire, con cartuchos impregnados.", "Acidic medium; for air, with impregnated cartridges."],
    ions: ["UV 360 nm; LC-MS en APCI/ESI(−) [M−H]⁻", "UV 360 nm; LC-MS in APCI/ESI(−) [M−H]⁻"],
    note: ["Método de referencia para formaldehído y carbonilos en aire.", "Reference method for formaldehyde and carbonyls in air."] },
];
const DV = { formula: store.get("dvFormula", "C9H8O4"), name: "", reagent: store.get("dvReagent", "bstfa"), sites: Number(store.get("dvSites", "1")) || 1, adv: null };
const dvName = (r) => (Array.isArray(r.n) ? L(r.n[0], r.n[1]) : r.n);

function derivSetFormula(formula, name, adv) {
  DV.formula = formula; DV.name = name || ""; DV.adv = adv || null;
  if ($("dvFormula")) { $("dvFormula").value = formula; store.set("dvFormula", formula); }
  const r = DERIV.find((x) => x.id === DV.reagent);
  const s = dvSuggest(r);
  if (s) DV.sites = s;
  renderDeriv();
}
function dvSuggest(r) {
  if (!DV.adv || !r || !r.g.length) return 0;
  return r.g.reduce((n, k) => n + (DV.adv.g[k] || 0), 0);
}

function renderDeriv() {
  const box = $("dvBody");
  if (!box) return;
  const r = DERIV.find((x) => x.id === DV.reagent) || DERIV[0];
  let M = null, err = "";
  try { M = parseFormula($("dvFormula").value); } catch (e) { err = e.message; }
  let out = "";
  if (M) {
    const n = Math.max(0, Math.min(20, DV.sites | 0));
    const D = addCounts(M, r.d, n);
    const bad = Object.values(D).some((v) => v < 0);
    if (bad) out = `<div class="note warn">${L("Con ese número de sitios la fórmula queda negativa (¿falta el contraión?).", "With that many sites the formula goes negative (missing counter-ion?).")}</div>`;
    else {
      Object.keys(D).forEach((k) => { if (!D[k]) delete D[k]; });
      const mono = monoMass(D), shift = monoMass(D) - monoMass(M);
      const lc = r.type === "LC";
      out = `<div class="stats">
        <div class="stat"><div class="k">${L("Derivado", "Derivative")}</div><div class="v">${hillHtml(D)}</div></div>
        <div class="stat"><div class="k">${L("Masa monoisotópica", "Monoisotopic mass")}</div><div class="v">${fmtMz(mono, 4)}</div><div class="s">+${fmtMz(shift, 4)} (${n} × ${fmtMz(shift / Math.max(n, 1), 4)})</div></div>
        <div class="stat"><div class="k">${lc ? "[M+H]⁺ / [M−H]⁻" : "M⁺• (EI)"}</div><div class="v">${lc ? fmtMz(mzOf(addCounts(D, { H: 1 }), 1), 4) + " / " + fmtMz(mzOf(addCounts(D, { H: -1 }), -1), 4) : fmtMz(mzOf(D, 1), 4)}</div></div>
        <div class="stat"><div class="k">${L("Masa molar", "Molar mass")}</div><div class="v">${fmtFix(avgMass(D), 2)}</div><div class="s">${L("antes", "was")} ${fmtFix(avgMass(M), 2)}</div></div>
      </div>
      <p class="small"><b>${L("Iones diagnóstico", "Diagnostic ions")}:</b> ${esc(L(r.ions[0], r.ions[1]))}</p>
      <div class="btn-row"><button type="button" class="btn ghost" id="dvToMass">${L("Ver aductos y espectro →", "See adducts and spectrum →")}</button></div>`;
      DV.result = hill(D);
    }
  } else out = `<div class="note warn">${esc(err)}</div>`;

  const sug = dvSuggest(r);
  const g = DV.adv ? DV.adv.g : null;
  const grp = g ? `<p class="hint small">${L("Grupos en la estructura", "Groups in the structure")}: –OH ${g.alcohol}, ${L("fenol", "phenol")} ${g.phenol}, –COOH ${g.acid}, N–H ${g.amineNH} ${L("(aminas)", "(amines)")}, C=O ${g.carbonyl}, –SH ${g.thiol}.${sug ? " " + L(`Para este reactivo se propone${sug > 1 ? "n" : ""} ${sug} sitio${sug > 1 ? "s" : ""}.`, `${sug} site${sug > 1 ? "s" : ""} suggested for this reagent.`) : ""}</p>` : `<p class="hint small">${L("Si cargas el compuesto desde la ficha o el editor, se cuentan los grupos reactivos automáticamente.", "If you load the compound from the compound page or the editor, reactive groups are counted automatically.")}</p>`;

  $("dvResult").innerHTML = `${DV.name ? `<p class="small"><b>${esc(DV.name)}</b></p>` : ""}${grp}${out}`;
  if ($("dvToMass")) $("dvToMass").addEventListener("click", () => { setFormula(DV.result); location.hash = "#masas"; });

  $("dvTable").innerHTML = `<thead><tr><th>${L("Reactivo", "Reagent")}</th><th></th><th>${L("Reacciona con", "Reacts with")}</th><th>${L("Condiciones típicas", "Typical conditions")}</th><th>${L("Iones diagnóstico", "Diagnostic ions")}</th><th class="num">Δm</th></tr></thead><tbody>` +
    DERIV.map((x) => `<tr class="${x.id === DV.reagent ? "hit" : ""}"><td><b>${esc(dvName(x))}</b><div class="sub">${esc(L(x.fam[0], x.fam[1]))}</div></td><td><span class="badge">${x.type}</span></td><td>${esc(L(x.tg[0], x.tg[1]))}</td><td>${esc(L(x.cond[0], x.cond[1]))}<div class="sub">${esc(L(x.note[0], x.note[1]))}</div></td><td class="sub">${esc(L(x.ions[0], x.ions[1]))}</td><td class="num">${(() => { const dm = monoMass(x.d); return (dm >= 0 ? "+" : "−") + fmtMz(Math.abs(dm), 4); })()}</td></tr>`).join("") + `</tbody>`;
}

function initDeriv() {
  if (!$("derivatizacion")) return;
  $("dvFormula").value = DV.formula;
  $("dvReagent").innerHTML = DERIV.map((x) => `<option value="${x.id}">${esc(dvName(x))} · ${x.type}</option>`).join("");
  $("dvReagent").value = DV.reagent;
  $("dvSites").value = DV.sites;
  $("dvFormula").addEventListener("input", () => { DV.formula = $("dvFormula").value; DV.adv = null; DV.name = ""; store.set("dvFormula", DV.formula); renderDeriv(); });
  $("dvReagent").addEventListener("input", () => {
    DV.reagent = $("dvReagent").value; store.set("dvReagent", DV.reagent);
    const s = dvSuggest(DERIV.find((x) => x.id === DV.reagent)); if (s) { DV.sites = s; $("dvSites").value = s; }
    renderDeriv();
  });
  $("dvSites").addEventListener("input", () => { DV.sites = Math.max(0, parseInt($("dvSites").value, 10) || 0); store.set("dvSites", String(DV.sites)); renderDeriv(); });
  $("dvFromDraw").addEventListener("click", () => {
    if (!DRAW.formula || !ADV.res) { $("dvResult").insertAdjacentHTML("afterbegin", `<div class="note warn">${L("Primero dibuja o carga una molécula en el editor.", "First draw or load a molecule in the editor.")}</div>`); return; }
    derivSetFormula(DRAW.formula, (DRAW.name && DRAW.name.title) || "", ADV.res);
    $("dvSites").value = DV.sites;
  });
  renderDeriv();
}

/* =========================================================
   COLUMNAS
   ========================================================= */
const GC_PHASES = [
  { ph: ["100 % dimetilpolisiloxano", "100 % dimethylpolysiloxane"], usp: "G1, G2, G38", pol: 1, cols: "Agilent DB-1, HP-1, CP-Sil 5 CB · Restek Rtx-1 · Phenomenex ZB-1 · Supelco Equity-1, SPB-1 · Trajan BP1 · Thermo TR-1", use: ["Separación por punto de ebullición: hidrocarburos, disolventes, destilación simulada.", "Boiling-point separations: hydrocarbons, solvents, simulated distillation."] },
  { ph: ["5 % fenil – 95 % metilpolisiloxano", "5 % phenyl – 95 % methylpolysiloxane"], usp: "G27, G36", pol: 2, cols: "Agilent DB-5, HP-5, CP-Sil 8 CB · Restek Rtx-5 · Phenomenex ZB-5 · Supelco Equity-5, SPB-5 · Trajan BP5 · Thermo TR-5", use: ["La columna de uso general: semivolátiles, pesticidas, HAP, fármacos.", "The general-purpose column: semivolatiles, pesticides, PAHs, drugs."] },
  { ph: ["5 % fenil de bajo sangrado (versiones «ms»)", "Low-bleed 5 % phenyl (“ms” versions)"], usp: "G27 *", pol: 2, cols: "Agilent DB-5ms, HP-5ms, VF-5ms · Restek Rxi-5ms, Rxi-5Sil MS · Phenomenex ZB-5MS · Supelco SLB-5ms · Trajan BPX5 · Thermo TG-5MS", use: ["GC-MS de trazas. Algunas son de fase con arileno: selectividad muy parecida, no idéntica.", "Trace GC-MS. Some are arylene-modified: very similar, not identical, selectivity."] },
  { ph: ["6 % cianopropilfenil – 94 % dimetilpolisiloxano", "6 % cyanopropylphenyl – 94 % dimethylpolysiloxane"], usp: "G43", pol: 3, cols: "Agilent DB-624, DB-1301 · Restek Rtx-624, Rtx-1301 · Phenomenex ZB-624 · Supelco SPB-624 · Trajan BP624 · Thermo TG-624", use: ["Volátiles (espacio de cabeza, purga y trampa) y disolventes residuales.", "Volatiles (headspace, purge-and-trap) and residual solvents."] },
  { ph: ["14 % cianopropilfenil – 86 % metilpolisiloxano", "14 % cyanopropylphenyl – 86 % methylpolysiloxane"], usp: "G46", pol: 3, cols: "Agilent DB-1701 · Restek Rtx-1701 · Phenomenex ZB-1701 · Trajan BP10 · Thermo TR-1701", use: ["Pesticidas y columna de confirmación.", "Pesticides and confirmation column."] },
  { ph: ["35 % fenil – 65 % dimetilpolisiloxano", "35 % phenyl – 65 % dimethylpolysiloxane"], usp: "G42", pol: 3, cols: "Agilent DB-35, HP-35 · Restek Rtx-35 · Phenomenex ZB-35 · Supelco SPB-35 · Trajan BPX35", use: ["Confirmación de pesticidas y PCB, fármacos.", "Pesticide and PCB confirmation, drugs."] },
  { ph: ["50 % fenil – 50 % metilpolisiloxano", "50 % phenyl – 50 % methylpolysiloxane"], usp: "G3", pol: 4, cols: "Agilent DB-17 · Restek Rxi-17, Rtx-50 · Phenomenex ZB-50 · Supelco SPB-50 · Trajan BPX50", use: ["Esteroides, fármacos, confirmación.", "Steroids, drugs, confirmation."] },
  { ph: ["Trifluoropropilmetilpolisiloxano", "Trifluoropropylmethylpolysiloxane"], usp: "G6", pol: 4, cols: "Agilent DB-200 · Restek Rtx-200", use: ["Compuestos halogenados, cetonas, nitroaromáticos; selectividad distinta a las de fenilo.", "Halogenated compounds, ketones, nitroaromatics; selectivity unlike phenyl phases."] },
  { ph: ["Polietilenglicol (WAX)", "Polyethylene glycol (WAX)"], usp: "G16 (y otras)", pol: 5, cols: "Agilent DB-WAX, HP-INNOWax, CP-Wax 52 CB · Restek Rtx-Wax, Stabilwax · Phenomenex ZB-WAX · Supelco SUPELCOWAX 10 · Trajan BP20 · Thermo TR-Wax", use: ["Alcoholes, aromas, disolventes polares, FAME.", "Alcohols, flavours, polar solvents, FAMEs."] },
  { ph: ["PEG modificado con ácido nitrotereftálico (FFAP)", "Nitroterephthalic-acid-modified PEG (FFAP)"], usp: "G35, G25", pol: 5, cols: "Agilent DB-FFAP, HP-FFAP · Restek Stabilwax-DA · Phenomenex ZB-FFAP · Supelco Nukol, SPB-1000 · Trajan BP21 · Thermo TR-FFAP", use: ["Ácidos grasos libres y ácidos volátiles sin derivatizar, fenoles.", "Free fatty acids and volatile acids without derivatization, phenols."] },
  { ph: ["Biscianopropilpolisiloxano (alta polaridad)", "Biscyanopropyl polysiloxane (high polarity)"], usp: "G8 *", pol: 5, cols: "Agilent HP-88 · Restek Rt-2560 · Phenomenex ZB-88 · Supelco SP-2560", use: ["Isómeros cis/trans de FAME.", "Cis/trans FAME isomers."] },
];
const LC_PHASES = [
  { usp: "L1", ph: ["C18 (octadecilsilano)", "C18 (octadecyl silane)"], ex: "Agilent ZORBAX Eclipse Plus C18, InfinityLab Poroshell 120 EC-C18 · Waters ACQUITY BEH C18, XBridge C18, Symmetry C18 · Phenomenex Kinetex C18, Luna C18(2) · Thermo Hypersil GOLD, Accucore C18 · Restek Raptor C18", use: ["Punto de partida para casi todo en fase reversa. Las C18 no son intercambiables entre sí: cambian la carga de carbono, el end-capping y la actividad de silanoles.", "Starting point for almost everything in reversed phase. C18s are not interchangeable: carbon load, end-capping and silanol activity differ."] },
  { usp: "L1 *", ph: ["C18 compatible con 100 % agua", "C18 compatible with 100 % water"], ex: "Waters ACQUITY HSS T3, Atlantis T3 · Phenomenex Kinetex Polar C18, Luna Omega Polar C18 · Agilent InfinityLab Poroshell 120 SB-Aq", use: ["Compuestos polares que necesitan empezar el gradiente con muy poco orgánico.", "Polar compounds that need a gradient starting with very little organic."] },
  { usp: "L7", ph: ["C8 (octilsilano)", "C8 (octyl silane)"], ex: "Agilent ZORBAX Eclipse Plus C8 · Waters XBridge C8 · Phenomenex Luna C8(2)", use: ["Menos retención que C18 para compuestos muy apolares.", "Less retention than C18 for very non-polar compounds."] },
  { usp: "L11", ph: ["Fenilo / fenil-hexilo", "Phenyl / phenyl-hexyl"], ex: "Waters XSelect CSH Phenyl-Hexyl · Phenomenex Kinetex Phenyl-Hexyl · Agilent InfinityLab Poroshell 120 Phenyl-Hexyl", use: ["Selectividad π–π para aromáticos; se nota más con metanol que con acetonitrilo.", "π–π selectivity for aromatics; stronger with methanol than acetonitrile."] },
  { usp: "L43", ph: ["Pentafluorofenilo (PFP, F5)", "Pentafluorophenyl (PFP, F5)"], ex: "Phenomenex Kinetex F5 · Waters ACQUITY HSS PFP · Restek Raptor FluoroPhenyl · Agilent InfinityLab Poroshell 120 PFP", use: ["Isómeros de posición, halogenados y bases polares: la alternativa más distinta a una C18.", "Positional isomers, halogenated compounds and polar bases: the most different alternative to C18."] },
  { usp: "L10", ph: ["Ciano (CN)", "Cyano (CN)"], ex: "Agilent ZORBAX SB-CN · Phenomenex Luna CN", use: ["Retención baja en fase reversa; también en fase normal.", "Low retention in reversed phase; also usable in normal phase."] },
  { usp: "L3", ph: ["Sílice", "Silica"], ex: "Waters Atlantis HILIC Silica · Phenomenex Kinetex HILIC", use: ["Fase normal y HILIC de compuestos muy polares.", "Normal phase and HILIC of very polar compounds."] },
  { usp: "—", ph: ["HILIC amida y zwitteriónica", "Amide and zwitterionic HILIC"], ex: "Waters ACQUITY BEH Amide · Tosoh TSKgel Amide-80 · Agilent InfinityLab Poroshell 120 HILIC-Z · Merck SeQuant ZIC-HILIC", use: ["Metabolitos polares, azúcares, aminoácidos, plaguicidas polares.", "Polar metabolites, sugars, amino acids, polar pesticides."] },
  { usp: "L8", ph: ["Amino (NH₂)", "Amino (NH₂)"], ex: "Phenomenex Luna NH2", use: ["Azúcares (HILIC) y fase normal.", "Sugars (HILIC) and normal phase."] },
  { usp: "L14 / L9", ph: ["Intercambio aniónico / catiónico fuerte", "Strong anion / cation exchange"], ex: "Hamilton PRP-X100 (aniónico, especiación de As) · Dionex IonPac", use: ["Iones y especiación de metaloides (LC-ICP-MS).", "Ions and metalloid speciation (LC-ICP-MS)."] },
];

function renderColumns() {
  if (!$("columnas")) return;
  const pol = (n) => `<span class="polbar" title="${L("Polaridad", "Polarity")} ${n}/5">${"<i></i>".repeat(n)}${"<i class=\"off\"></i>".repeat(5 - n)}</span>`;
  $("coGc").innerHTML = `<thead><tr><th>${L("Fase", "Phase")}</th><th>USP</th><th>${L("Polaridad", "Polarity")}</th><th>${L("Columnas equivalentes", "Equivalent columns")}</th><th>${L("Uso típico", "Typical use")}</th></tr></thead><tbody>` +
    GC_PHASES.map((x) => `<tr><td><b>${esc(L(x.ph[0], x.ph[1]))}</b></td><td class="num">${esc(x.usp)}</td><td>${pol(x.pol)}</td><td class="cols">${esc(x.cols)}</td><td class="sub">${esc(L(x.use[0], x.use[1]))}</td></tr>`).join("") + `</tbody>`;
  $("coLc").innerHTML = `<thead><tr><th>USP</th><th>${L("Fase", "Phase")}</th><th>${L("Ejemplos", "Examples")}</th><th>${L("Cuándo usarla", "When to use it")}</th></tr></thead><tbody>` +
    LC_PHASES.map((x) => `<tr><td class="num"><b>${esc(x.usp)}</b></td><td><b>${esc(L(x.ph[0], x.ph[1]))}</b></td><td class="cols">${esc(x.ex)}</td><td class="sub">${esc(L(x.use[0], x.use[1]))}</td></tr>`).join("") + `</tbody>`;
}

/* =========================================================
   DISOLVENTES Y TAMPONES
   ========================================================= */
// [nombre ES, nombre EN, fórmula, densidad g/mL, p. eb. °C, viscosidad cP 25 °C, corte UV nm, índice de polaridad P', miscible con agua]
const SOLV = [
  ["Agua", "Water", "H2O", 0.997, 100, 0.89, 190, 10.2, "—"],
  ["Acetonitrilo", "Acetonitrile", "C2H3N", 0.786, 81.6, 0.34, 190, 5.8, true],
  ["Metanol", "Methanol", "CH4O", 0.791, 64.7, 0.54, 205, 5.1, true],
  ["Etanol", "Ethanol", "C2H6O", 0.789, 78.3, 1.07, 210, 4.3, true],
  ["Isopropanol", "Isopropanol", "C3H8O", 0.785, 82.3, 2.04, 205, 3.9, true],
  ["Tetrahidrofurano", "Tetrahydrofuran", "C4H8O", 0.889, 66, 0.46, 212, 4.0, true],
  ["Acetona", "Acetone", "C3H6O", 0.790, 56.1, 0.31, 330, 5.1, true],
  ["Dimetilsulfóxido", "Dimethyl sulfoxide", "C2H6OS", 1.100, 189, 1.99, 268, 7.2, true],
  ["Acetato de etilo", "Ethyl acetate", "C4H8O2", 0.902, 77.1, 0.43, 256, 4.4, false],
  ["Diclorometano", "Dichloromethane", "CH2Cl2", 1.326, 39.8, 0.41, 233, 3.1, false],
  ["Cloroformo", "Chloroform", "CHCl3", 1.489, 61.2, 0.54, 245, 4.1, false],
  ["Tolueno", "Toluene", "C7H8", 0.867, 110.6, 0.55, 284, 2.4, false],
  ["Hexano", "Hexane", "C6H14", 0.659, 68.7, 0.30, 195, 0.1, false],
  ["Isooctano", "Isooctane", "C8H18", 0.692, 99.2, 0.47, 215, 0.1, false],
  ["Ciclohexano", "Cyclohexane", "C6H12", 0.779, 80.7, 0.90, 200, 0.2, false],
  ["Metil terc-butil éter", "Methyl tert-butyl ether", "C5H12O", 0.740, 55.2, 0.27, 210, 2.5, false],
];
// [nombre ES, nombre EN, pKa (25 °C), corte UV aprox. nm, volátil (MS)]
const ADDITIVES = [
  ["Ácido trifluoroacético (TFA)", "Trifluoroacetic acid (TFA)", "≈ 0,5", 210, "warn"],
  ["Ácido fórmico / formiato amónico", "Formic acid / ammonium formate", "3,75", 210, "yes"],
  ["Ácido acético / acetato amónico", "Acetic acid / ammonium acetate", "4,76", 230, "yes"],
  ["Fluoruro amónico (HF)", "Ammonium fluoride (HF)", "3,17", 200, "yes"],
  ["Bicarbonato amónico", "Ammonium bicarbonate", "6,35 · 9,25 · 10,33", 200, "yes"],
  ["Amoniaco / ion amonio", "Ammonia / ammonium", "9,25", 200, "yes"],
  ["Fosfato", "Phosphate", "2,15 · 7,20 · 12,35", 195, "no"],
  ["Citrato", "Citrate", "3,13 · 4,76 · 6,40", 230, "no"],
  ["Tris", "Tris", "8,07", 205, "no"],
  ["Borato", "Borate", "9,24", 195, "no"],
];
// sistemas para la calculadora: sal (masa molar), segundo componente líquido o sólido
const BUFS = {
  formate: { pKa: 3.75, salt: ["formiato amónico", "ammonium formate", 63.06], acid: ["ácido fórmico (98 %)", "formic acid (98 %)", 46.03, 1.22, 0.98], ms: true },
  acetate: { pKa: 4.76, salt: ["acetato amónico", "ammonium acetate", 77.08], acid: ["ácido acético glacial", "glacial acetic acid", 60.05, 1.049, 1.0], ms: true },
  ammonia: { pKa: 9.25, salt: ["acetato amónico", "ammonium acetate", 77.08], base: ["amoniaco (25 % p/p)", "ammonia solution (25 % w/w)", 17.03, 0.91, 0.25], ms: true },
  phosLow: { pKa: 2.15, salt: ["KH₂PO₄", "KH₂PO₄", 136.09], acid: ["ácido fosfórico (85 %)", "phosphoric acid (85 %)", 98.0, 1.685, 0.85], ms: false },
  phosMid: { pKa: 7.20, salt: ["KH₂PO₄", "KH₂PO₄", 136.09], salt2: ["K₂HPO₄", "K₂HPO₄", 174.18], ms: false },
};

function renderSolvents() {
  if (!$("disolventes")) return;
  const yes = L("sí", "yes"), no = L("no", "no");
  $("svTable").innerHTML = `<thead><tr><th>${L("Disolvente", "Solvent")}</th><th class="num">${L("P. eb. (°C)", "B.p. (°C)")}</th><th class="num">${L("Densidad", "Density")}</th><th class="num">${L("Viscosidad (cP)", "Viscosity (cP)")}</th><th class="num">${L("Corte UV (nm)", "UV cut-off (nm)")}</th><th class="num">P′</th><th>${L("Miscible con agua", "Water-miscible")}</th></tr></thead><tbody>` +
    SOLV.map((x) => `<tr><td><b>${esc(L(x[0], x[1]))}</b></td><td class="num">${fmtFix(x[4], 1)}</td><td class="num">${fmtFix(x[3], 3)}</td><td class="num">${fmtFix(x[5], 2)}</td><td class="num">${x[6]}</td><td class="num">${fmtFix(x[7], 1)}</td><td>${x[8] === "—" ? "—" : x[8] ? yes : no}</td></tr>`).join("") + `</tbody>`;
  $("svAdd").innerHTML = `<thead><tr><th>${L("Aditivo / tampón", "Additive / buffer")}</th><th class="num">pK<sub>a</sub></th><th class="num">${L("Corte UV aprox. (nm)", "Approx. UV cut-off (nm)")}</th><th>LC-MS</th></tr></thead><tbody>` +
    ADDITIVES.map((x) => `<tr><td><b>${esc(L(x[0], x[1]))}</b></td><td class="num">${LANG === "en" ? x[2].replace(/,/g, ".") : x[2]}</td><td class="num">${x[3]}</td><td>${x[4] === "yes" ? `<span class="pill good">${L("Volátil", "Volatile")}</span>` : x[4] === "warn" ? `<span class="pill warn">${L("Suprime la señal", "Suppresses signal")}</span>` : `<span class="pill bad">${L("No volátil", "Non-volatile")}</span>`}</td></tr>`).join("") + `</tbody>`;
  if (!$("vvSolv").options.length) {
    $("vvSolv").innerHTML = SOLV.map((x, i) => `<option value="${i}">${esc(L(x[0], x[1]))}</option>`).join("");
    $("vvSolv").value = store.get("vvSolv", "1");
  } else {
    const v = $("vvSolv").value;
    $("vvSolv").innerHTML = SOLV.map((x, i) => `<option value="${i}">${esc(L(x[0], x[1]))}</option>`).join(""); $("vvSolv").value = v;
  }
  calcVapour();
  calcBuffer();
}

// Volumen de vapor de una inyección líquida en el inyector de GC (gas ideal)
function calcVapour() {
  const s = SOLV[Number($("vvSolv").value) || 0];
  const V = num("vvVol", 1), T = num("vvT", 250), Pg = num("vvP", 10), Vl = num("vvLiner", 0.9);
  const unit = $("vvPu").value;
  const Pabs = 101325 + (unit === "psi" ? Pg * 6894.76 : unit === "kPa" ? Pg * 1000 : Pg * 1e5);
  let mw; try { mw = avgMass(parseFormula(s[2])); } catch (e) { mw = 18; }
  const mol = V * 1e-3 * s[3] / mw;                     // µL → mL × g/mL / g/mol
  const vap = mol * 8.314 * (T + 273.15) / Pabs * 1e6;  // m³ → mL
  const pct = vap / Vl * 100;
  const cls = pct > 100 ? "bad" : pct > 75 ? "warn" : "good";
  $("vvOut").innerHTML = `<span class="big">${fmtFix(vap, 2)} mL</span>${L("de vapor", "of vapour")} · ${fmtFix(pct, 0)} % ${L("del liner", "of the liner")}
    <div class="note ${cls}" style="margin-top:6px">${pct > 100 ? L("El vapor no cabe en el liner: habrá retroceso (backflash), con picos fantasma, arrastre y mala repetibilidad. Inyecta menos, sube la presión (splitless pulsado) o usa un liner mayor.", "The vapour does not fit in the liner: expect backflash, with ghost peaks, carryover and poor repeatability. Inject less, raise the pressure (pulsed splitless) or use a larger liner.") : pct > 75 ? L("Al límite: conviene dejar margen (por debajo del 75 %).", "Borderline: keep some margin (below 75 %).") : L("Cabe con margen en el liner.", "Fits in the liner with margin.")}</div>`;
}

function calcBuffer() {
  const sys = $("bfSys").value, B = BUFS[sys];
  const pH = num("bfPH", 3), c = num("bfC", 10), V = num("bfV", 1000);
  const r = Math.pow(10, pH - B.pKa); // [base]/[ácido]
  const notes = [];
  let rows = "";
  const mL = (mol, d) => mol * d[2] / d[4] / d[3]; // mL de reactivo líquido
  if (sys === "formate" || sys === "acetate") {
    // sal = base conjugada a la concentración indicada; se añade el ácido para bajar el pH
    const salt = c * 1e-3 * V / 1000, acid = salt / r;
    rows = `<tr><td>${esc(L(B.salt[0], B.salt[1]))}</td><td class="num">${fmtFix(salt * B.salt[2] * 1000, 1)} mg</td></tr><tr><td>${esc(L(B.acid[0], B.acid[1]))}</td><td class="num">${fmt(mL(acid, B.acid) * 1000, 3)} µL</td></tr>`;
  } else if (sys === "ammonia") {
    const salt = c * 1e-3 * V / 1000, base = salt * r;
    rows = `<tr><td>${esc(L(B.salt[0], B.salt[1]))}</td><td class="num">${fmtFix(salt * B.salt[2] * 1000, 1)} mg</td></tr><tr><td>${esc(L(B.base[0], B.base[1]))}</td><td class="num">${fmt(mL(base, B.base) * 1000, 3)} µL</td></tr>`;
  } else if (sys === "phosLow") {
    const salt = c * 1e-3 * V / 1000, acid = salt / r;
    rows = `<tr><td>${esc(L(B.salt[0], B.salt[1]))}</td><td class="num">${fmtFix(salt * B.salt[2] * 1000, 1)} mg</td></tr><tr><td>${esc(L(B.acid[0], B.acid[1]))}</td><td class="num">${fmt(mL(acid, B.acid) * 1000, 3)} µL</td></tr>`;
  } else {
    const tot = c * 1e-3 * V / 1000, a = tot / (1 + r), b = tot - a;
    rows = `<tr><td>${esc(B.salt[0])}</td><td class="num">${fmtFix(a * B.salt[2] * 1000, 1)} mg</td></tr><tr><td>${esc(B.salt2[0])}</td><td class="num">${fmtFix(b * B.salt2[2] * 1000, 1)} mg</td></tr>`;
  }
  if (Math.abs(pH - B.pKa) > 1) notes.push(["warn", L(`El pH está a más de 1 unidad del pKa (${fmtFix(B.pKa, 2)}): la capacidad tampón será muy baja. Elige otro sistema.`, `pH is more than 1 unit from the pKa (${fmtFix(B.pKa, 2)}): buffer capacity will be very low. Choose another system.`)]);
  else notes.push(["good", L(`Dentro del intervalo útil (pKa ${fmtFix(B.pKa, 2)} ± 1).`, `Within the useful range (pKa ${fmtFix(B.pKa, 2)} ± 1).`)]);
  if (!B.ms) notes.push(["bad", L("Tampón no volátil: no lo uses con espectrometría de masas.", "Non-volatile buffer: do not use with mass spectrometry.")]);
  if (sys.startsWith("phos")) notes.push(["", L("El fosfato precipita con mucho acetonitrilo (a partir de ~70–80 % según la concentración).", "Phosphate precipitates at high acetonitrile (from ~70–80 % depending on concentration).")]);
  notes.push(["", L("Cálculo con Henderson-Hasselbalch, sin corrección de actividad. Ajusta el pH con el pH-metro en la fase acuosa, antes de añadir el orgánico.", "Henderson–Hasselbalch calculation, without activity correction. Adjust the pH with a meter in the aqueous phase, before adding organic.")]);
  $("bfOut").innerHTML = `<table class="data compact"><thead><tr><th>${L("Reactivo", "Reagent")}</th><th class="num">${L("Cantidad", "Amount")}</th></tr></thead><tbody>${rows}</tbody></table>` + notes.map(([k, t]) => `<div class="note ${k}" style="margin-top:6px">${esc(t)}</div>`).join("");
}

/* =========================================================
   NORMATIVA
   ========================================================= */
function guidelineCards() {
  const T = (es, en) => L(es, en);
  const tbl = (rows) => `<table class="data compact"><tbody>${rows.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</tbody></table>`;
  return [
    { t: "SANTE/11312/2021 v2026", s: T("Residuos de plaguicidas en alimentos y piensos (control de calidad y validación). Sustituye a la v2 desde el 1 de enero de 2026.", "Pesticide residues in food and feed (quality control and validation). Replaces v2 from 1 January 2026."),
      url: "https://food.ec.europa.eu/system/files/2023-11/pesticides_mrl_guidelines_wrkdoc_2021-11312.pdf",
      b: tbl([
        [T("Recuperación media", "Mean recovery"), "70–120 %"],
        [T("Precisión", "Precision"), T("RSD<sub>r</sub> y RSD<sub>wR</sub> ≤ 20 %", "RSD<sub>r</sub> and RSD<sub>wR</sub> ≤ 20 %")],
        [T("Validación inicial", "Initial validation"), T("≥ 5 réplicas en el LOQ y en al menos otro nivel", "≥ 5 replicates at the LOQ and at least one other level")],
        ["LOQ", T("Nivel más bajo validado que cumple los criterios", "Lowest validated level meeting the criteria")],
        [T("Calibrado", "Calibration"), T("Desviación de los patrones recalculados ≤ ±20 %", "Back-calculated deviation ≤ ±20 %")],
        [T("Tiempo de retención", "Retention time"), T("± 0,1 min", "± 0.1 min")],
        ["MS/MS", T("≥ 2 iones producto; relación de iones ±30 % (relativo)", "≥ 2 product ions; ion ratio ±30 % (relative)")],
        [T("MS de baja resolución (barrido)", "Low-resolution full-scan MS"), T("≥ 3 iones, S/N ≥ 3, relación ±30 %", "≥ 3 ions, S/N ≥ 3, ratio ±30 %")],
        ["HRMS", T("≥ 2 iones con error ≤ 5 ppm (< 1 mDa si m/z < 200)", "≥ 2 ions with error ≤ 5 ppm (< 1 mDa if m/z < 200)")],
        [T("Efecto matriz", "Matrix effect"), T("Si supera el 20 %, hay que compensarlo en el calibrado", "Above 20 %, it must be compensated in calibration")],
        [T("Blanco de reactivos", "Reagent blank"), T("≤ 30 % del nivel de notificación", "≤ 30 % of the reporting level")],
      ]) },
    { t: T("Reglamento (UE) 2021/808", "Regulation (EU) 2021/808"), s: T("Residuos de sustancias farmacológicamente activas en animales productores de alimentos (sustituye a la Decisión 2002/657/CE).", "Residues of pharmacologically active substances in food-producing animals (replaces Decision 2002/657/EC)."),
      url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02021R0808-20240820",
      b: tbl([
        [T("Tiempo de retención", "Retention time"), T("± 0,1 min (si t<sub>R</sub> < 2 min, desviación < 5 %)", "± 0.1 min (if t<sub>R</sub> < 2 min, deviation < 5 %)")],
        [T("Tiempo de retención relativo", "Relative retention time"), T("± 0,5 % en GC; ± 1 % en LC", "± 0.5 % in GC; ± 1 % in LC")],
        [T("Puntos de identificación", "Identification points"), T("≥ 4 (sustancias autorizadas) · ≥ 5 (prohibidas o no autorizadas)", "≥ 4 (authorised substances) · ≥ 5 (prohibited or unauthorised)")],
        [T("Puntos por técnica", "Points per technique"), T("Separación 1 · ion LR-MS 1 · ion producto LR-MSⁿ 1,5 · ion HRMS 1,5 · ion producto HR-MSⁿ 2,5", "Separation 1 · LR-MS ion 1 · LR-MSⁿ product ion 1.5 · HRMS ion 1.5 · HR-MSⁿ product ion 2.5")],
        [T("Ejemplo", "Example"), T("LC-MS/MS con 1 precursor y 2 transiciones = 5 puntos", "LC-MS/MS with 1 precursor and 2 transitions = 5 points")],
        [T("Relación de iones", "Ion ratio"), T("± 40 % (relativo)", "± 40 % (relative)")],
        ["HRMS", T("Error < 5 ppm (< 1 mDa si m/z < 200); resolución > 20 000 FWHM", "Error < 5 ppm (< 1 mDa if m/z < 200); resolution > 20,000 FWHM")],
        ["S/N", "≥ 3"],
        [T("Veracidad", "Trueness"), T("≤ 1 µg/kg: −50 a +20 % · 1–10 µg/kg: −30 a +20 % · ≥ 10 µg/kg: −20 a +20 %", "≤ 1 µg/kg: −50 to +20 % · 1–10 µg/kg: −30 to +20 % · ≥ 10 µg/kg: −20 to +20 %")],
        [T("Reproducibilidad (CV)", "Reproducibility (CV)"), T("< 10 µg/kg: 30 % · 10–120: 25 % · 120–1000: 22 % · > 1000: 16 %", "< 10 µg/kg: 30 % · 10–120: 25 % · 120–1000: 22 % · > 1000: 16 %")],
      ]),
      foot: T("Versión consolidada de agosto de 2024: comprueba si hay modificaciones posteriores.", "Consolidated version of August 2024: check for later amendments.") },
    { t: "ICH Q2(R2)", s: T("Validación de procedimientos analíticos (sector farmacéutico). En vigor desde el 14 de junio de 2024.", "Validation of analytical procedures (pharmaceutical). In force since 14 June 2024."),
      url: "https://www.ema.europa.eu/en/documents/scientific-guideline/ich-q2r2-guideline-validation-analytical-procedures-step-5-revision-1_en.pdf",
      b: tbl([
        [T("Características", "Characteristics"), T("Especificidad/selectividad, intervalo (respuesta y linealidad), exactitud, precisión (repetibilidad, precisión intermedia, reproducibilidad), LD/LC", "Specificity/selectivity, range (response and linearity), accuracy, precision (repeatability, intermediate precision, reproducibility), DL/QL")],
        [T("Linealidad", "Linearity"), T("Al menos 5 concentraciones repartidas por el intervalo", "At least 5 concentrations across the range")],
        [T("Exactitud", "Accuracy"), T("p. ej. 3 concentraciones × 3 réplicas en el intervalo", "e.g. 3 concentrations × 3 replicates across the range")],
        [T("Repetibilidad", "Repeatability"), T("9 determinaciones (3 × 3) o 6 al 100 % de la concentración de ensayo", "9 determinations (3 × 3) or 6 at 100 % of test concentration")],
        [T("Límite de detección", "Detection limit"), T("S/N 3:1, o LD = 3,3·σ/S", "S/N 3:1, or DL = 3.3·σ/S")],
        [T("Límite de cuantificación", "Quantitation limit"), T("S/N ≥ 10:1, o LC = 10·σ/S", "S/N ≥ 10:1, or QL = 10·σ/S")],
        [T("Intervalo: valoración", "Range: assay"), T("80–120 % del contenido declarado", "80–120 % of declared content")],
        [T("Intervalo: uniformidad", "Range: content uniformity"), "70–130 %"],
        [T("Intervalo: impurezas", "Range: impurities"), T("Del umbral de notificación al 120 % de la especificación", "Reporting threshold to 120 % of the specification")],
      ]) },
    { t: T("USP <621> (armonizado)", "USP <621> (harmonized)"), s: T("Cambios permitidos en métodos de LC sin revalidar, siempre que se cumpla la idoneidad del sistema.", "Allowed changes to LC methods without revalidation, provided system suitability is met."),
      url: "https://community.agilent.com/technical/consumables/w/wiki/21654/allowed-changes-in-usp-methods",
      b: tbl([
        [T("Tipo de fase", "Phase type"), T("Debe mantenerse la clase USP (p. ej. L1)", "The USP class must be kept (e.g. L1)")],
        ["L/d<sub>p</sub>", T("−25 % a +50 % (o N equivalente con partícula superficialmente porosa)", "−25 % to +50 % (or equivalent N with superficially porous particles)")],
        [T("Flujo", "Flow"), T("F₂ = F₁ × (d<sub>c2</sub>² · d<sub>p1</sub>) / (d<sub>c1</sub>² · d<sub>p2</sub>); isocrático: ±50 % adicional", "F₂ = F₁ × (d<sub>c2</sub>² · d<sub>p1</sub>) / (d<sub>c1</sub>² · d<sub>p2</sub>); isocratic: additional ±50 %")],
        [T("Volumen de inyección", "Injection volume"), "V₂ = V₁ × (L₂ · d<sub>c2</sub>²) / (L₁ · d<sub>c1</sub>²)"],
        [T("Tiempo de gradiente", "Gradient time"), "t<sub>G2</sub> = t<sub>G1</sub> × (F₁/F₂) × (L₂ · d<sub>c2</sub>²) / (L₁ · d<sub>c1</sub>²)"],
        [T("Temperatura de columna", "Column temperature"), T("± 10 °C (isocrático) · ± 5 °C (gradiente)", "± 10 °C (isocratic) · ± 5 °C (gradient)")],
        [T("pH de la fase acuosa", "Aqueous pH"), T("± 0,2", "± 0.2")],
        [T("Concentración de tampón", "Buffer concentration"), "± 10 %"],
        [T("Componente minoritario (isocrático)", "Minor component (isocratic)"), T("± 30 % relativo o ± 10 % absoluto, lo menor", "± 30 % relative or ± 10 % absolute, whichever is smaller")],
        [T("Longitud de onda", "Wavelength"), T("Sin cambios", "No changes")],
      ]),
      foot: T("Resumen de un fabricante; comprueba el texto oficial vigente de la USP–NF. La Ph. Eur. 2.2.46 está armonizada.", "Manufacturer's summary; check the current official USP–NF text. Ph. Eur. 2.2.46 is harmonized.") },
    { t: T("Directiva 2009/90/CE", "Directive 2009/90/EC"), s: T("Especificaciones técnicas del análisis químico para el seguimiento de las aguas (Directiva Marco del Agua).", "Technical specifications for chemical analysis in water monitoring (Water Framework Directive)."),
      url: "https://eur-lex.europa.eu/eli/dir/2009/90/oj",
      b: tbl([
        [T("Incertidumbre", "Uncertainty"), T("≤ 50 % (k = 2) a la concentración de la norma de calidad ambiental (NCA)", "≤ 50 % (k = 2) at the environmental quality standard (EQS) level")],
        [T("Límite de cuantificación", "Limit of quantification"), T("≤ 30 % de la NCA", "≤ 30 % of the EQS")],
        [T("Si ningún método lo cumple", "If no method meets this"), T("Mejores técnicas disponibles sin costes excesivos", "Best available techniques not entailing excessive costs")],
      ]) },
  ];
}
function renderGuidelines() {
  if (!$("normativa")) return;
  $("nrCards").innerHTML = guidelineCards().map((g) => `<div class="card guide-card"><h2 class="card-title">${g.t}</h2><p class="muted small">${g.s}</p>${g.b}
    ${g.foot ? `<p class="hint small">${g.foot}</p>` : ""}<p class="small"><a href="${g.url}" target="_blank" rel="noopener">${L("Texto oficial / fuente", "Official text / source")} ↗</a></p></div>`).join("");
}

/* =========================================================
   Inicio
   ========================================================= */
function initReference() {
  initDeriv();
  renderColumns();
  if ($("disolventes")) {
    ["vvSolv", "vvVol", "vvT", "vvP", "vvPu", "vvLiner"].forEach((id) => {
      const v = store.get(id, null); if (v !== null && id !== "vvSolv") $(id).value = v;
      $(id).addEventListener("input", () => { store.set(id, $(id).value); calcVapour(); });
    });
    ["bfSys", "bfPH", "bfC", "bfV"].forEach((id) => {
      const v = store.get(id, null); if (v !== null) $(id).value = v;
      $(id).addEventListener("input", () => { store.set(id, $(id).value); calcBuffer(); });
    });
  }
  renderSolvents();
  renderGuidelines();
}

["derivatizacion", "columnas", "disolventes", "normativa"].forEach((v) => VIEWS.push(v));
const _renderAll7 = renderAll;
renderAll = function () {
  _renderAll7();
  if ($("dvReagent")) { const v = $("dvReagent").value; $("dvReagent").innerHTML = DERIV.map((x) => `<option value="${x.id}">${esc(dvName(x))} · ${x.type}</option>`).join(""); $("dvReagent").value = v; renderDeriv(); }
  renderColumns(); renderSolvents(); renderGuidelines();
};
initReference();
applyStatic();
route();
