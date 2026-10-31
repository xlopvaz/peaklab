/* PeakLab · ¿GC o LC? Asesor basado en reglas a partir de la estructura dibujada.
   Descriptores con OpenChemLib (BSD-3, cargado bajo demanda): masa, log P, TPSA, donadores/aceptores.
   Grupos funcionales detectados recorriendo el grafo molecular.
   La parte de análisis (adviseAnalyze) no toca el DOM, para poder probarla aparte. */
"use strict";

const OCL_URL = "https://cdn.jsdelivr.net/npm/openchemlib@9.25.0/dist/openchemlib.js";

/* ---------------- Análisis (sin DOM) ---------------- */
function adviseAnalyze(OCL, input) {
  const whole = input.molfiles
    ? (() => { const ms = input.molfiles.map((mf) => OCL.Molecule.fromMolfile(mf)); return ms; })()
    : [OCL.Molecule.fromSmiles(input.smiles)];
  // separar fragmentos (sales, contraiones) y quedarnos con el mayor
  let frags = [];
  for (const m of whole) frags = frags.concat(m.getFragments());
  frags.forEach((f) => f.ensureHelperArrays(OCL.Molecule.cHelperRings));
  frags.sort((a, b) => b.getAtoms() - a.getAtoms());
  const mol = frags[0];
  const counter = frags.slice(1).map((f) => f.getMolecularFormula().formula);

  const props = new OCL.MoleculeProperties(mol);
  const mf = mol.getMolecularFormula();
  const n = mol.getAtoms();
  const Z = (a) => mol.getAtomicNo(a), H = (a) => mol.getAllHydrogens(a), Q = (a) => mol.getAtomCharge(a);
  const nb = (a) => { const r = []; for (let i = 0; i < mol.getConnAtoms(a); i++) r.push([mol.getConnAtom(a, i), mol.getConnBondOrder(a, i)]); return r; };
  const arom = (a) => mol.isAromaticAtom(a);
  const dblO = (a) => nb(a).filter(([b, o]) => Z(b) === 8 && (o === 2 || Q(b) === -1)).length; // =O (o O− en formas zwitteriónicas)
  const isCarbonylC = (c) => Z(c) === 6 && nb(c).some(([b, o]) => (Z(b) === 8 || Z(b) === 16) && o === 2);
  const isSulfonylS = (s) => Z(s) === 16 && dblO(s) >= 2;

  const g = {
    acid: 0, carboxylate: 0, ester: 0, sulfonic: 0, sulfate: 0, sulfonamide: 0, phosAcid: 0,
    phenol: 0, alcohol: 0, amineBasic: 0, amineNH: 0, amideNH: 0, amineQuat: 0, aniline: 0, aromN: 0, amide: 0,
    carbamate: 0, urea: 0, sulfonylurea: 0, nOxide: 0, peroxide: 0, nitrate: 0, nitro: 0, nitrile: 0,
    F: 0, Cl: 0, Br: 0, I: 0, N: 0, P: 0, S: 0, Si: 0, cf2: 0, metal: [], charged: 0, aromRings: 0,
  };
  const METALS = { 33: "As", 80: "Hg", 50: "Sn", 82: "Pb", 34: "Se", 29: "Cu", 30: "Zn", 26: "Fe" };
  let C = 0, hetero = 0;

  for (let a = 0; a < n; a++) {
    const z = Z(a), q = Q(a), h = H(a), nbs = nb(a);
    if (z === 6) C++; else if (z !== 1) hetero++;
    if (q !== 0) g.charged++;
    if (z === 9) g.F++; else if (z === 17) g.Cl++; else if (z === 35) g.Br++; else if (z === 53) g.I++;
    else if (z === 7) g.N++; else if (z === 15) g.P++; else if (z === 16) g.S++; else if (z === 14) g.Si++;
    if (METALS[z]) g.metal.push(METALS[z]);

    if (z === 6) {
      if (nbs.filter(([b]) => Z(b) === 9).length >= 2) g.cf2++;
      if (nbs.some(([b, o]) => Z(b) === 7 && o === 3)) g.nitrile++;
      if (isCarbonylC(a) && nbs.some(([b, o]) => Z(b) === 8 && o === 2)) {
        const sO = nbs.filter(([b, o]) => Z(b) === 8 && o === 1).map(([b]) => b);
        const sN = nbs.filter(([b, o]) => Z(b) === 7 && o === 1).map(([b]) => b);
        for (const o of sO) {
          if (H(o) > 0) g.acid++;
          else if (Q(o) === -1) g.carboxylate++;
          else if (nb(o).some(([b]) => b !== a && Z(b) === 6)) g.ester++;
        }
        // urea y carbamato de cadena abierta (los de anillo, como en la cafeína, son estables)
        if (sN.length === 2 && !mol.isRingAtom(a)) g.urea++;
        if (sN.length === 1 && sO.length === 1 && !mol.isRingAtom(a)) g.carbamate++;
      }
    }
    if (z === 8) {
      if (nbs.some(([b]) => Z(b) === 8)) g.peroxide++;
      if (h > 0 && nbs.length === 1) {
        const c = nbs[0][0];
        if (Z(c) === 6 && arom(c)) g.phenol++;
        else if (Z(c) === 6 && !isCarbonylC(c)) g.alcohol++;
      }
    }
    if (z === 16 && isSulfonylS(a)) {
      const os = nbs.filter(([b, o]) => Z(b) === 8 && o === 1);
      const acidic = os.filter(([b]) => H(b) > 0 || Q(b) === -1).length;
      if (nbs.filter(([b]) => Z(b) === 8).length >= 4 && acidic) g.sulfate++;
      else if (acidic) g.sulfonic++;
      const ns = nbs.filter(([b]) => Z(b) === 7).map(([b]) => b);
      if (ns.length) {
        g.sulfonamide++;
        if (ns.some((nn) => nb(nn).some(([c]) => c !== a && isCarbonylC(c) && nb(c).some(([x]) => Z(x) === 7 && x !== nn)))) g.sulfonylurea++;
      }
    }
    if (z === 15 && nbs.some(([b, o]) => Z(b) === 8 && o === 1 && (H(b) > 0 || Q(b) === -1))) g.phosAcid++;
    if (z === 7) {
      const os = nbs.filter(([b]) => Z(b) === 8);
      if (q === 1 && os.length === 1 && os.every(([b]) => Q(b) === -1) && nbs.length >= 3 && !arom(a)) g.nOxide++;
      if (os.length >= 2) { if (nbs.some(([b]) => Z(b) === 6)) g.nitro++; else g.nitrate++; continue; }
      if (q === 1 && h === 0 && nbs.length === 4 && !os.length) { g.amineQuat++; continue; }
      if (arom(a)) { if (h === 0) g.aromN++; continue; }
      const nearCO = nbs.some(([b]) => isCarbonylC(b) || isSulfonylS(b));
      const dbl = nbs.some(([, o]) => o >= 2);
      if (nearCO) { g.amide++; if (h > 0) g.amideNH++; continue; }
      if (dbl || q !== 0) continue;
      if (nbs.some(([b]) => arom(b))) g.aniline++;
      else if (nbs.every(([b]) => Z(b) === 6 || Z(b) === 1)) { g.amineBasic++; if (h > 0) g.amineNH++; }
    }
  }
  // anillos aromáticos (para detectar HAP)
  const rs = mol.getRingSet();
  for (let r = 0; r < rs.getSize(); r++) if (rs.isAromatic(r)) g.aromRings++;

  const d = {
    formula: mf.formula, mw: mf.relativeWeight, logP: props.logP, tpsa: props.polarSurfaceArea,
    hbd: props.donorCount, hba: props.acceptorCount, heavy: n, C, hetero, counter,
  };
  const acidStrong = g.sulfonic + g.sulfate + g.phosAcid;
  const acids = g.acid + g.carboxylate + acidStrong + (g.cf2 >= 4 && g.acid ? 0 : 0);
  const bases = g.amineBasic + g.amineQuat;
  const permanent = g.amineQuat + g.sulfate + g.sulfonic + (counter.length ? 1 : 0) * (g.carboxylate || g.charged ? 1 : 0);
  const isPAH = g.aromRings >= 3 && hetero === 0;
  const isPFAS = g.cf2 >= 4;
  const thermo = [];
  if (g.carbamate) thermo.push("carbamate");
  if (g.urea) thermo.push("urea");
  if (g.sulfonylurea) thermo.push("sulfonylurea");
  if (g.nOxide) thermo.push("noxide");
  if (g.peroxide) thermo.push("peroxide");
  if (g.nitrate) thermo.push("nitrate");
  const organoMetal = g.metal.filter((m) => ["As", "Hg", "Sn", "Pb", "Se"].includes(m));

  /* ---- GC ---- */
  let gc = 3; const gcWhy = [], gcHow = [];
  if (permanent || g.amineQuat) { gc = 0; gcWhy.push("ionic"); }
  if (d.mw > 550) { gc = Math.min(gc, 0); gcWhy.push("mwHigh"); }
  else if (d.mw > 450) { gc = Math.min(gc, 2); gcWhy.push("mwMid"); }
  if (acidStrong) { gc = Math.min(gc, 1); gcWhy.push("strongAcid"); }
  if (g.acid) { gc = Math.min(gc, 2); gcWhy.push("cooh"); }
  const strongDon = g.alcohol + g.phenol + g.acid + g.amideNH + g.amineNH;
  d.strongDon = strongDon;
  if (strongDon >= 4 || d.hbd >= 5) { gc = Math.min(gc, 1); gcWhy.push("manyDonors"); }
  else if (strongDon >= 2 && d.tpsa > 35) { gc = Math.min(gc, 2); gcWhy.push("polar"); }
  if (d.tpsa > 120) { gc = Math.min(gc, 1); if (!gcWhy.includes("manyDonors")) gcWhy.push("veryPolar"); }
  else if (d.tpsa > 90) { gc = Math.min(gc, 2); if (!gcWhy.includes("polar") && !gcWhy.includes("manyDonors")) gcWhy.push("veryPolar"); }
  if (g.amineNH && d.mw < 350 && !g.acid) { gc = Math.min(gc, 2); gcWhy.push("amine"); }
  if (thermo.length) { gc = Math.min(gc, 1); gcWhy.push("thermo"); }
  const hgSnPb = organoMetal.some((m) => ["Hg", "Sn", "Pb"].includes(m));
  if (organoMetal.length) {
    gcWhy.length = 0;
    if (hgSnPb) { gc = Math.min(gc, 2); gcWhy.push("metalDeriv"); } else { gc = Math.min(gc, 1); gcWhy.push("metalAs"); }
  }
  const veryVolatile = d.heavy <= 8 && d.tpsa < 30 && !acids && !bases;
  if (gc === 3) gcWhy.push(veryVolatile ? "veryVolatile" : "volatile");
  // cómo: columna, detector, derivatización, preparación
  const deriv = [];
  if (g.acid) deriv.push("methyl");
  if (g.alcohol + g.phenol + (g.amide ? 1 : 0) + (g.acid ? 1 : 0) > 0 && (gc < 3 || g.phenol)) deriv.push("silyl");
  if (g.amineBasic && gcWhy.includes("amine")) deriv.push("acyl");
  if (g.phosAcid) deriv.push("tfaa");
  if (organoMetal.some((m) => ["Hg", "Sn", "Pb"].includes(m))) deriv.push("ethyl");
  const gcDet = [];
  if (organoMetal.length) gcDet.push("icp");
  if (g.Cl + g.Br >= 2 || g.Br || g.I) gcDet.push("ecd");
  if (g.N && !g.amide || g.P) gcDet.push("npd");
  if (g.S) gcDet.push("fpd");
  gcDet.push("ms");
  const gcCol = veryVolatile ? "thick" : (g.acid && d.mw < 200 && !deriv.length ? "wax" : "5ms");

  /* ---- LC ---- */
  let lc = 3; const lcWhy = [];
  if (veryVolatile || (d.heavy <= 10 && d.tpsa < 20 && !acids && !bases && !g.aromN && !g.amide)) { lc = 1; lcWhy.push("tooVolatile"); }
  if (d.logP > 7 && !acids && !bases) { lc = Math.min(lc, 2); lcWhy.push("veryApolar"); }
  // modo de ionización
  const ion = [];
  if (g.amineQuat) ion.push("quat");
  if (g.amineBasic) ion.push("base");
  else if (g.aromN || g.aniline || g.amide || g.urea) ion.push("weakBase");
  if (acidStrong || g.acid || g.carboxylate || isPFAS) ion.push("acid");
  else if (g.phenol) ion.push("phenol");
  if (!ion.length) ion.push(d.tpsa > 20 && (g.ester || d.hba >= 2) ? "neutralPolar" : "neutralApolar");
  if (ion.includes("neutralApolar") && lc === 3 && !isPAH) { lc = 2; lcWhy.push("poorIon"); }
  if (isPAH) lcWhy.push("pah");
  if (organoMetal.length) { lc = 3; lcWhy.length = 0; lcWhy.push("metalLC"); ion.length = 0; ion.push("icp"); }
  // columna
  let lcCol;
  if (organoMetal.length) lcCol = "metal";
  else if ((permanent || acidStrong) && d.logP < 1 || d.logP < -1.5) lcCol = "hilic";
  else if (d.logP < 1) lcCol = "aq";
  else if (d.logP > 6) lcCol = "c18strong";
  else lcCol = "c18";
  if (lc === 3 && !organoMetal.length) lcWhy.push(lcCol === "hilic" ? "polarLC" : "rp");

  /* ---- Recomendación global ---- */
  let best;
  if (organoMetal.length) best = "icp";
  else if (gc >= 3 && lc <= 1) best = "gc";
  else if (gc >= 3 && lc === 2) best = "gcBoth";
  else if (gc >= 3 && lc >= 3) best = (d.tpsa < 40 && !acids && !bases && !g.aromN && !g.amide) || isPAH ? "gcBoth" : "lcBoth";
  else if (lc >= 2) best = "lc";
  else if (gc >= 2) best = "gcDeriv";
  else best = "none";

  return { d, g, gc, gcWhy, deriv, gcDet, gcCol, veryVolatile, lc, lcWhy, ion, lcCol, best, thermo, isPAH, isPFAS, organoMetal, acids, bases };
}

/* ---------------- Textos ---------------- */
const ADV_LEVEL = {
  gc: [["No adecuado", "Not suitable", "bad"], ["Difícil", "Difficult", "bad"], ["Posible con matices", "Possible, with caveats", "warn"], ["Adecuado", "Suitable", "good"]],
  lc: [["No adecuado", "Not suitable", "bad"], ["Poco adecuado", "Not ideal", "bad"], ["Adecuado con matices", "Suitable, with caveats", "warn"], ["Adecuado", "Suitable", "good"]],
};
function advText(r) {
  const T = (es, en) => L(es, en);
  const W = {
    ionic: T("Tiene carga permanente o es una sal: no se volatiliza.", "It carries a permanent charge or is a salt: it will not volatilize."),
    mwHigh: T(`Masa molar alta (${fmt(r.d.mw, 3)} g/mol): demasiado poco volátil para GC.`, `High molar mass (${fmt(r.d.mw, 3)} g/mol): not volatile enough for GC.`),
    mwMid: T(`Masa molar ${fmt(r.d.mw, 3)} g/mol: al límite; necesita columna y temperatura altas.`, `Molar mass ${fmt(r.d.mw, 3)} g/mol: borderline; needs a high-temperature column and oven.`),
    strongAcid: T("Grupo ácido fuerte (sulfónico, sulfato o fosfónico): no eluye sin derivatizar.", "Strong acid group (sulfonic, sulfate or phosphonic): will not elute without derivatization."),
    cooh: T("Ácido carboxílico: da picos con cola o no eluye; conviene derivatizar.", "Carboxylic acid: tails badly or does not elute; derivatization is advisable."),
    manyDonors: T(`Muchos grupos –OH o –NH (${r.d.strongDon}): muy poco volátil sin derivatizar.`, `Many –OH or –NH groups (${r.d.strongDon}): very low volatility without derivatization.`),
    polar: T(`Bastante polar (TPSA ${fmtFix(r.d.tpsa, 0)} Å², ${r.d.strongDon} grupos –OH/–NH): mejor derivatizar.`, `Fairly polar (TPSA ${fmtFix(r.d.tpsa, 0)} Å², ${r.d.strongDon} –OH/–NH groups): better derivatized.`),
    amine: T("Amina primaria o secundaria: tiende a adsorberse y dar cola; la acilación ayuda.", "Primary or secondary amine: tends to adsorb and tail; acylation helps."),
    thermo: T(`Grupo térmicamente lábil (${r.thermo.map((t) => ({ carbamate: T("carbamato", "carbamate"), urea: T("urea", "urea"), sulfonylurea: T("sulfonilurea", "sulfonylurea"), noxide: "N-óxido", peroxide: T("peróxido", "peroxide"), nitrate: T("éster nitrato", "nitrate ester") }[t])).join(", ")}): puede descomponerse en el inyector caliente.`,
      `Thermally labile group (${r.thermo.map((t) => ({ carbamate: "carbamate", urea: "urea", sulfonylurea: "sulfonylurea", noxide: "N-oxide", peroxide: "peroxide", nitrate: "nitrate ester" }[t])).join(", ")}): it may break down in the hot inlet.`),
    veryVolatile: T("Molécula pequeña y poco polar: muy volátil, ideal para GC.", "Small, low-polarity molecule: very volatile, ideal for GC."),
    volatile: T("Tamaño y polaridad compatibles con GC sin derivatizar.", "Size and polarity are compatible with GC without derivatization."),
    tooVolatile: T("Muy volátil y poco polar: se pierde al evaporar extractos y casi no ioniza en ESI.", "Very volatile and non-polar: lost when extracts are evaporated and barely ionizes in ESI."),
    veryApolar: T(`Muy apolar (log P ≈ ${fmtFix(r.d.logP, 1)}): retiene muchísimo en C18 e ioniza mal en ESI.`, `Very non-polar (log P ≈ ${fmtFix(r.d.logP, 1)}): retained very strongly on C18 and ionizes poorly in ESI.`),
    poorIon: T("Sin grupos ionizables: en ESI dará poca señal; mejor APCI o APPI.", "No ionizable groups: weak ESI signal; APCI or APPI are better."),
    pah: T("Hidrocarburo aromático policíclico: en LC se mide muy bien con detector de fluorescencia (FLD).", "Polycyclic aromatic hydrocarbon: LC with a fluorescence detector (FLD) works very well."),
    veryPolar: T(`Muy polar (TPSA ${fmtFix(r.d.tpsa, 0)} Å²): poco volátil; hace falta derivatizar.`, `Very polar (TPSA ${fmtFix(r.d.tpsa, 0)} Å²): low volatility; derivatization needed.`),
    metalDeriv: T("Organometálico: por GC solo tras etilación (NaBEt₄), con ICP-MS o MS como detector.", "Organometallic: GC only after ethylation (NaBEt₄), with ICP-MS or MS detection."),
    metalAs: T("Especie de As o Se: por GC haría falta generación de hidruros o derivatizar con tioles; no es lo habitual.", "As or Se species: GC would need hydride generation or thiol derivatization; not the usual route."),
    metalLC: T("Especiación de metales y metaloides: LC acoplada a ICP-MS es la técnica de referencia.", "Metal and metalloid speciation: LC coupled to ICP-MS is the reference technique."),
    polarLC: T("Muy polar o iónico: LC sí, pero no en fase reversa convencional.", "Very polar or ionic: LC works, but not on conventional reversed phase."),
    rp: T("Polaridad e ionización compatibles con LC en fase reversa.", "Polarity and ionization are compatible with reversed-phase LC."),
  };
  const DER = {
    methyl: T("Ácidos → ésteres metílicos (BF₃/metanol, TMSH) o silil ésteres (MSTFA, BSTFA).", "Acids → methyl esters (BF₃/methanol, TMSH) or silyl esters (MSTFA, BSTFA)."),
    silyl: T("–OH y –NH → sililación con BSTFA + 1 % TMCS o MSTFA (MTBSTFA da derivados más estables).", "–OH and –NH → silylation with BSTFA + 1 % TMCS or MSTFA (MTBSTFA gives more stable derivatives)."),
    acyl: T("Aminas → acilación con TFAA, PFPA o HFBA.", "Amines → acylation with TFAA, PFPA or HFBA."),
    tfaa: T("Ácidos fosfónicos y aminoácidos (p. ej. glifosato) → TFAA con trifluoroetanol.", "Phosphonic acids and amino acids (e.g. glyphosate) → TFAA with trifluoroethanol."),
    ethyl: T("Organometálicos de Hg, Sn o Pb → etilación con NaBEt₄.", "Hg, Sn or Pb organometallics → ethylation with NaBEt₄."),
  };
  const DET = {
    icp: T("ICP-MS (específico del elemento)", "ICP-MS (element-specific)"),
    ecd: T("ECD (muy sensible a halógenos) o MS en ionización química negativa", "ECD (very sensitive to halogens) or MS in negative chemical ionization"),
    npd: T("NPD (selectivo para N y P)", "NPD (selective for N and P)"),
    fpd: T("FPD o SCD (selectivos para S)", "FPD or SCD (selective for S)"),
    ms: T("MS con impacto electrónico (identificación con librería NIST)", "Electron ionization MS (identification against the NIST library)"),
  };
  const COL = {
    thick: T("Columna de fase gruesa para volátiles (tipo 624, 1,4–1,8 µm) con espacio de cabeza o purga y trampa", "Thick-film column for volatiles (624-type, 1.4–1.8 µm) with headspace or purge-and-trap"),
    wax: T("Columna polar tipo WAX/FFAP para ácidos libres", "Polar WAX/FFAP-type column for free acids"),
    "5ms": T("Columna de 5 % fenilo (tipo DB-5ms), 30 m × 0,25 mm × 0,25 µm", "5 % phenyl column (DB-5ms type), 30 m × 0.25 mm × 0.25 µm"),
  };
  const ION = {
    icp: T("Detección por ICP-MS, no por ESI (el elemento se mide directamente)", "ICP-MS detection rather than ESI (the element is measured directly)"),
    quat: T("ESI(+): catión permanente, se ve directamente como M⁺", "ESI(+): permanent cation, seen directly as M⁺"),
    base: T("ESI(+): amina básica, [M+H]⁺ muy intenso con fase móvil ácida (0,1 % ácido fórmico)", "ESI(+): basic amine, strong [M+H]⁺ with acidic mobile phase (0.1 % formic acid)"),
    weakBase: T("ESI(+): [M+H]⁺ (nitrógeno poco básico); vigila también [M+Na]⁺", "ESI(+): [M+H]⁺ (weakly basic nitrogen); also watch [M+Na]⁺"),
    acid: T("ESI(−): [M−H]⁻; el acetato o fluoruro amónico en la fase móvil suele dar más señal que el ácido fórmico", "ESI(−): [M−H]⁻; ammonium acetate or fluoride in the mobile phase often gives more signal than formic acid"),
    phenol: T("ESI(−): [M−H]⁻ del fenol (mejor cuanto más halogenado)", "ESI(−): phenol [M−H]⁻ (better the more halogenated it is)"),
    neutralPolar: T("ESI(+) con aductos [M+NH₄]⁺ o [M+Na]⁺ (añade formiato o acetato amónico), o APCI", "ESI(+) via [M+NH₄]⁺ or [M+Na]⁺ adducts (add ammonium formate or acetate), or APCI"),
    neutralApolar: T("APCI o APPI; ESI apenas lo ioniza", "APCI or APPI; ESI barely ionizes it"),
  };
  const LCCOL = {
    metal: T("Intercambio aniónico para As y Se; C18 con un tiol en la fase móvil (cisteína, 2-mercaptoetanol) para Hg", "Anion exchange for As and Se; C18 with a thiol in the mobile phase (cysteine, 2-mercaptoethanol) for Hg"),
    hilic: T("HILIC, intercambio iónico o modo mixto (en fase reversa apenas retiene)", "HILIC, ion exchange or mixed-mode (it is barely retained in reversed phase)"),
    aq: T("C18 compatible con 100 % agua (tipo T3/AQ) o PFP; empieza el gradiente con muy poco orgánico", "C18 that tolerates 100 % water (T3/AQ type) or PFP; start the gradient with very little organic"),
    c18: T("C18 en fase reversa, gradiente agua/metanol o acetonitrilo", "Reversed-phase C18, water/methanol or acetonitrile gradient"),
    c18strong: T("C18 o C8 con mucho orgánico (puede hacer falta isopropanol en la fase B)", "C18 or C8 with high organic content (isopropanol in phase B may be needed)"),
  };
  const BEST = {
    gc: [T("GC", "GC"), T("Es volátil y poco polar: GC-MS es la opción natural.", "It is volatile and non-polar: GC-MS is the natural choice.")],
    gcBoth: [T("GC (LC también sirve)", "GC (LC also works)"), T("Las dos técnicas funcionan; GC-MS suele ser más sencillo para compuestos poco polares sin grupos ionizables.", "Both work; GC-MS is usually simpler for non-polar compounds without ionizable groups.")],
    lcBoth: [T("LC (GC también sirve)", "LC (GC also works)"), T("Las dos funcionan; LC-MS/MS suele dar más sensibilidad para compuestos con grupos ionizables.", "Both work; LC-MS/MS usually gives better sensitivity for compounds with ionizable groups.")],
    lc: [T("LC", "LC"), T("LC-MS evita la derivatización y los problemas de volatilidad o estabilidad térmica.", "LC-MS avoids derivatization and volatility or thermal-stability problems.")],
    gcDeriv: [T("GC tras derivatizar", "GC after derivatization"), T("Ninguna es perfecta; GC con derivatización es lo más viable.", "Neither is ideal; GC with derivatization is the most workable.")],
    icp: [T("Especiación con ICP-MS", "Speciation by ICP-MS"), T(`Contiene ${r.organoMetal.join(", ")}: para especiación lo habitual es LC-ICP-MS${r.organoMetal.some((m) => ["Hg", "Sn", "Pb"].includes(m)) ? ", o GC-ICP-MS/MS tras etilación" : (r.organoMetal.includes("As") ? " con intercambio aniónico" : "")}.`, `Contains ${r.organoMetal.join(", ")}: speciation is usually done by LC-ICP-MS${r.organoMetal.some((m) => ["Hg", "Sn", "Pb"].includes(m)) ? ", or GC-ICP-MS/MS after ethylation" : (r.organoMetal.includes("As") ? " with anion exchange" : "")}.`)],
    none: [T("Ninguna directamente", "Neither directly"), T("Ni GC ni LC-ESI encajan bien sin adaptar el método; revisa las notas.", "Neither GC nor LC-ESI fits well without adapting the method; see the notes.")],
  };
  return { W, DER, DET, COL, ION, LCCOL, BEST };
}

/* ---------------- Interfaz ---------------- */
let ADV = { ocl: null, loading: null, key: null, res: null, err: null };
function loadOCL() {
  if (ADV.ocl) return Promise.resolve(ADV.ocl);
  if (!ADV.loading) ADV.loading = import(OCL_URL).then((m) => { ADV.ocl = m.default && m.default.Molecule ? m.default : m; return ADV.ocl; });
  return ADV.loading;
}

function adviseUpdate() {
  const box = $("advBody");
  if (!box) return;
  if (DRAW.state !== "ready" || !DRAW.formula) { ADV.key = null; ADV.res = null; renderAdvisor(); return; }
  let mfs = [];
  try { mfs = currentMols().map((m) => Kekule.IO.saveFormatData(m, "mol")); } catch (e) { mfs = []; }
  const key = mfs.join("|");
  if (key === ADV.key) return;
  ADV.key = key;
  loadOCL().then((OCL) => {
    if (ADV.key !== key) return;
    try { ADV.res = adviseAnalyze(OCL, { molfiles: mfs }); ADV.err = null; }
    catch (e) { ADV.res = null; ADV.err = String(e.message || e); }
    renderAdvisor();
  }).catch(() => { ADV.err = "load"; renderAdvisor(); });
  renderAdvisor(true);
}

function renderAdvisor(loading) {
  const box = $("advBody");
  if (!box) return;
  if (!DRAW.formula) { box.innerHTML = `<p class="muted">${L("Dibuja o carga una molécula y aquí verás si conviene GC o LC, con qué columna, detector o modo de ionización.", "Draw or load a molecule to see whether GC or LC suits it, and with which column, detector or ionization mode.")}</p>`; return; }
  if (ADV.err === "load") { box.innerHTML = `<p class="muted">${L("No se ha podido cargar el módulo de descriptores. Comprueba tu conexión.", "Could not load the descriptor module. Check your connection.")}</p>`; return; }
  if (!ADV.res) { box.innerHTML = `<p class="muted">${loading ? L("Analizando la estructura…", "Analysing the structure…") : esc(ADV.err || "")}</p>`; return; }
  const r = ADV.res, t = advText(r), d = r.d;
  const lv = (k, v) => { const [es, en, c] = ADV_LEVEL[k][v]; return `<span class="pill ${c}">${L(es, en)}</span>`; };
  const li = (arr) => arr.map((x) => `<li>${x}</li>`).join("");

  const gcHow = [];
  if (r.gc > 0) {
    gcHow.push(`<b>${L("Columna", "Column")}:</b> ${t.COL[r.gcCol]}`);
    gcHow.push(`<b>${L("Detector", "Detector")}:</b> ${r.gcDet.map((k) => t.DET[k]).join("; ")}`);
    if (r.deriv.length) gcHow.push(`<b>${r.gc === 3 ? L("Derivatización (opcional, mejora los picos)", "Derivatization (optional, improves peaks)") : L("Derivatización", "Derivatization")}:</b> ${r.deriv.map((k) => t.DER[k]).join(" ")}`);
    if (r.veryVolatile) gcHow.push(`<b>${L("Muestra", "Sample")}:</b> ${L("espacio de cabeza, SPME o purga y trampa en vez de extracción con disolvente", "headspace, SPME or purge-and-trap rather than solvent extraction")}`);
  }
  const lcHow = [];
  if (r.lc > 0) {
    lcHow.push(`<b>${L("Columna", "Column")}:</b> ${t.LCCOL[r.lcCol]}`);
    lcHow.push(`<b>${L("Ionización", "Ionization")}:</b> ${r.ion.map((k) => t.ION[k]).join("; ")}`);
    if (r.isPFAS) lcHow.push(`<b>PFAS:</b> ${L("usa columna retardadora y evita piezas de PTFE para no medir el fondo del equipo", "use a delay column and avoid PTFE parts so you don't measure the instrument background")}`);
  }
  const counter = d.counter.length ? `<div class="note">${L(`Se analiza el fragmento principal; se han ignorado: ${d.counter.join(", ")}.`, `The main fragment is analysed; ignored: ${d.counter.join(", ")}.`)}</div>` : "";

  box.innerHTML = `
    <div class="adv-best"><span class="k">${L("Recomendación", "Recommendation")}</span><span class="v">${esc(t.BEST[r.best][0])}</span><span class="s">${esc(t.BEST[r.best][1])}</span></div>
    <div class="stats adv-desc">
      <div class="stat"><div class="k">${L("Masa molar", "Molar mass")}</div><div class="v">${fmtFix(d.mw, 1)}</div></div>
      <div class="stat"><div class="k">log P (${L("est.", "est.")})</div><div class="v">${fmtFix(d.logP, 1)}</div></div>
      <div class="stat"><div class="k">TPSA</div><div class="v">${fmtFix(d.tpsa, 0)} Å²</div></div>
      <div class="stat"><div class="k">${L("Donadores / aceptores de H", "H-bond donors / acceptors")}</div><div class="v">${d.hbd} / ${d.hba}</div></div>
    </div>
    ${counter}
    <div class="grid-2 adv-cols">
      <div class="adv-col"><h3>GC ${lv("gc", r.gc)}</h3><ul>${li(r.gcWhy.map((k) => esc(t.W[k])))}</ul>${gcHow.length ? `<ul class="how">${li(gcHow)}</ul>` : ""}</div>
      <div class="adv-col"><h3>LC ${lv("lc", r.lc)}</h3><ul>${li(r.lcWhy.map((k) => esc(t.W[k])))}</ul>${lcHow.length ? `<ul class="how">${li(lcHow)}</ul>` : ""}
        <button type="button" class="btn ghost" id="advToLc">${L("Añadir al simulador de HPLC →", "Add to the HPLC simulator →")}</button></div>
    </div>
    <p class="hint small">${L("Reglas generales a partir de la estructura (log P y TPSA calculados con OpenChemLib). No tienen en cuenta la matriz ni los límites que necesites: tómalo como punto de partida.", "General rules based on the structure (log P and TPSA computed with OpenChemLib). They do not consider your matrix or required limits: treat this as a starting point.")}</p>`;
  $("advToLc").addEventListener("click", () => {
    const name = (DRAW.name && DRAW.name.state === "ok" && DRAW.name.title) || d.formula;
    const line = `${name.replace(/;/g, ",")}; ${d.logP.toFixed(2)}; ${d.mw.toFixed(0)}`;
    const ta = $("lcCmp");
    ta.value = ta.value.replace(/\s+$/, "") + "\n" + line;
    store.set("lcCmp", ta.value);
    CH.mode = "lc"; store.set("chMode", "lc");
    location.hash = "#cromatografia";
    renderChroma();
  });
}

// Engancharse a la lectura de la estructura del editor
const _readStructure = readStructure;
readStructure = function (force) { _readStructure(force); adviseUpdate(); };
const _renderAll3 = renderAll;
renderAll = function () { _renderAll3(); renderAdvisor(); };
renderAdvisor();
