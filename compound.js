/* PeakLab · Ficha de compuesto
   Datos de PubChem (PUG REST y PUG View, con CORS): identidad, propiedades calculadas, propiedades
   experimentales con su fuente, pKa → logD frente al pH, índices de retención de Kovats (NIST),
   secciones transversales de colisión, clasificación GHS y técnica recomendada (asesor GC/LC). */
"use strict";

Object.assign(EN, {
  "cp.h1": "Compound data",
  "cp.intro": "What you want to know about an analyte before preparing the sample or choosing the method: experimental physicochemical properties, pKa and logD versus pH, GC retention indices, hazards and recommended technique. Data from PubChem, with the original source.",
  "cp.q": "Compound", "cp.qHint": "English name, CAS number, SMILES or InChIKey", "cp.search": "Search", "cp.fromDraw": "Use the drawn structure",
  "dr.toCompound": "Compound data →",
});

const PUG_REST = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/";
const PUGV = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/";
const CP = { data: null, busy: false, logd: null };

/* ---------------- Acceso a PubChem ---------------- */
async function pcJSON(url, opts, tries = 2) {
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(url, { ...(opts || {}), signal: ctl.signal });
      clearTimeout(tm);
      if (r.status === 404) return null;
      if (r.status === 503 && i < tries - 1) { await new Promise((ok) => setTimeout(ok, 800)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      clearTimeout(tm);
      if (i === tries - 1) throw e;
    }
  }
  return null;
}
const firstCid = (j) => (j && j.IdentifierList && j.IdentifierList.CID && j.IdentifierList.CID[0]) || 0;
const looksSmiles = (q) => !/\s/.test(q) && (/[=#()\[\]@\\\/]/.test(q) || /[a-z]\d|\d[a-z]/.test(q) && /^[A-Za-z0-9+\-]+$/.test(q) && /[cnos]/.test(q));

async function cpResolve(q) {
  q = q.trim();
  const mCid = q.match(/^(?:cid\s*)?(\d{1,10})$/i);
  if (mCid && !/^\d{2,7}-\d{2}-\d$/.test(q)) return Number(mCid[1]);
  if (/^[A-Z]{14}-[A-Z]{10}-[A-Z]$/.test(q)) return firstCid(await pcJSON(PUG_REST + "compound/inchikey/" + q + "/cids/JSON"));
  const bySmiles = async () => firstCid(await pcJSON(PUG_REST + "compound/smiles/cids/JSON", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "smiles=" + encodeURIComponent(q) }));
  const byName = async () => firstCid(await pcJSON(PUG_REST + "compound/name/" + encodeURIComponent(q) + "/cids/JSON"));
  if (looksSmiles(q)) { let c = 0; try { c = await bySmiles(); } catch (e) { /* probar como nombre */ } return c || byName(); }
  let c = 0; try { c = await byName(); } catch (e) { /* probar como SMILES */ }
  if (c) return c;
  try { return await bySmiles(); } catch (e) { return 0; }
}

async function cpProps(cid) {
  const base = "Title,IUPACName,MolecularFormula,MolecularWeight,MonoisotopicMass,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,Charge,InChIKey";
  let j = null;
  try { j = await pcJSON(PUG_REST + `compound/cid/${cid}/property/${base},SMILES,ConnectivitySMILES/JSON`); } catch (e) { j = null; }
  if (!j) j = await pcJSON(PUG_REST + `compound/cid/${cid}/property/${base},IsomericSMILES,CanonicalSMILES/JSON`);
  const p = j && j.PropertyTable && j.PropertyTable.Properties[0];
  if (!p) return null;
  p.smiles = p.SMILES || p.IsomericSMILES || p.ConnectivitySMILES || p.CanonicalSMILES || "";
  return p;
}

// Recorre un registro de PUG View y devuelve, por encabezado, la lista de valores con su fuente
function pvCollect(json) {
  const out = {};
  if (!json || !json.Record) return out;
  const refs = {};
  (json.Record.Reference || []).forEach((r) => { refs[r.ReferenceNumber] = r.SourceName; });
  const walk = (secs) => (secs || []).forEach((sec) => {
    if (sec.Information) {
      const list = out[sec.TOCHeading] || (out[sec.TOCHeading] = []);
      sec.Information.forEach((inf) => {
        const v = inf.Value || {};
        let text = "", nums = null, markup = [];
        if (v.StringWithMarkup) {
          text = v.StringWithMarkup.map((x) => x.String).filter(Boolean).join("; ");
          v.StringWithMarkup.forEach((x) => (x.Markup || []).forEach((m) => { if (m.Extra) markup.push(m.Extra); }));
        }
        if (v.Number) { nums = v.Number.slice(); text = text || v.Number.join(", ") + (v.Unit ? " " + v.Unit : ""); }
        list.push({ name: inf.Name || "", text, nums, markup, lines: v.StringWithMarkup ? v.StringWithMarkup.map((x) => x.String) : [], src: refs[inf.ReferenceNumber] || "", ref: inf.ReferenceNumber });
      });
    }
    walk(sec.Section);
  });
  walk(json.Record.Section);
  return out;
}

async function cpLoad(q, label) {
  if (CP.busy) return;
  CP.busy = true;
  $("cpBtn").disabled = true;
  cpMsg(L("Buscando en PubChem…", "Searching PubChem…"));
  try {
    const cid = await cpResolve(q);
    if (!cid) { cpMsg(L(`No se ha encontrado «${label || q}» en PubChem.`, `“${label || q}” was not found in PubChem.`), true); return; }
    cpMsg(L(`Cargando datos (CID ${cid})…`, `Loading data (CID ${cid})…`));
    const [props, syn, exp, ghs] = await Promise.all([
      cpProps(cid),
      pcJSON(PUG_REST + `compound/cid/${cid}/synonyms/JSON`).catch(() => null),
      pcJSON(PUGV + `${cid}/JSON?heading=Experimental+Properties`).catch(() => null),
      pcJSON(PUGV + `${cid}/JSON?heading=GHS+Classification`).catch(() => null),
    ]);
    if (!props) { cpMsg(L("PubChem no ha devuelto propiedades para este compuesto.", "PubChem returned no properties for this compound."), true); return; }
    const syns = (syn && syn.InformationList && syn.InformationList.Information[0].Synonym) || [];
    CP.data = {
      cid, props,
      cas: syns.find((x) => /^\d{2,7}-\d{2}-\d$/.test(x)) || "",
      dtxsid: syns.find((x) => /^DTXSID\d+$/.test(x)) || "",
      exp: pvCollect(exp), ghs: pvCollect(ghs),
    };
    CP.logd = null;
    store.set("cpQuery", q);
    cpMsg("");
    renderCompound();
    cpAdvisor();
  } catch (e) {
    cpMsg(L("No se ha podido consultar PubChem. Comprueba tu conexión e inténtalo de nuevo.", "Could not reach PubChem. Check your connection and try again."), true);
  } finally {
    CP.busy = false;
    $("cpBtn").disabled = false;
  }
}
function cpMsg(t, err) { const el = $("cpMsg"); el.textContent = t; el.classList.toggle("err", !!err); }

/* ---------------- pKa y logD ---------------- */
function pkaCandidates(exp) {
  const out = [];
  (exp["Dissociation Constants"] || []).forEach((it) => {
    const txt = (it.name ? it.name + " " : "") + it.text;
    let nums = [];
    const numericOnly = /^[\s\d.,;\-−]+$/.test(it.text);
    const tagged = [...txt.matchAll(/pK[ab]?(?:\s*\d(?=\s*[=:≈~(]))?\s*(?:\([^)]*\))?\s*[=:≈~]?\s*(-?\d+(?:\.\d+)?)/gi)].map((m) => Number(m[1]));
    if (numericOnly) nums = (it.text.replace(/−/g, "-").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    else if (tagged.length) nums = tagged;
    if (it.nums) nums = nums.concat(it.nums);
    const kind = /pKb/i.test(txt) ? "pkb" : /pKaH|conjugate acid|basic|base/i.test(txt) ? "base" : /acid/i.test(txt) ? "acid" : "";
    nums.filter((v) => v > -3 && v < 16).forEach((v) => {
      const val = kind === "pkb" ? +(14 - v).toFixed(2) : v;
      if (!out.some((o) => Math.abs(o.v - val) < 0.005)) out.push({ v: val, src: it.src, kind: kind === "pkb" ? "base" : kind, raw: it.text.slice(0, 120) });
    });
  });
  return out;
}
function expLogP(exp) {
  for (const it of exp.LogP || []) {
    const m = (it.text || "").match(/(?:log\s*K?ow|log\s*P)?\s*[=:]?\s*(-?\d+(?:\.\d+)?)/i);
    if (it.nums && it.nums.length) return { v: it.nums[0], src: it.src };
    if (m) { const v = Number(m[1]); if (v > -8 && v < 12) return { v, src: it.src }; }
  }
  return null;
}
// Propuesta inicial de grupos ionizables combinando los pKa de PubChem con los grupos de la estructura
function guessGroups(cands, adv) {
  const ok = cands.filter((c) => c.v >= -1 && c.v <= 13).sort((a, b) => a.v - b.v);
  if (!ok.length) return [];
  const g = adv ? adv.g : null;
  const acidSites = g ? g.acid + g.carboxylate + g.sulfonic + g.sulfate + g.phosAcid + g.phenol : 0;
  const baseSites = g ? g.amineBasic + g.aromN + g.aniline : 0;
  const groups = [];
  ok.forEach((c) => {
    if (c.kind && !groups.some((g) => g.type === c.kind && Math.abs(g.pKa - c.v) < 0.6)) groups.push({ type: c.kind, pKa: c.v });
  });
  if (!groups.length) {
    if (acidSites && !baseSites) groups.push({ type: "acid", pKa: ok[0].v });
    else if (baseSites && !acidSites) groups.push({ type: "base", pKa: ok[ok.length - 1].v });
    else if (acidSites && baseSites && ok.length >= 2) { groups.push({ type: "acid", pKa: ok[0].v }); groups.push({ type: "base", pKa: ok[ok.length - 1].v }); }
    else if (!adv) groups.push({ type: ok[0].v < 7 ? "acid" : "base", pKa: ok[0].v });
  }
  return groups.slice(0, 3);
}
function fracNeutral(pH, groups) {
  return groups.reduce((f, gr) => {
    if (!Number.isFinite(gr.pKa)) return f;
    return f * (gr.type === "acid" ? 1 / (1 + Math.pow(10, pH - gr.pKa)) : 1 / (1 + Math.pow(10, gr.pKa - pH)));
  }, 1);
}
const PH_POINTS = [
  [2.0, ["0,1 % TFA", "0.1 % TFA"]],
  [2.7, ["0,1 % ácido fórmico", "0.1 % formic acid"]],
  [3.8, ["formiato amónico / fórmico", "ammonium formate / formic"]],
  [4.8, ["acetato amónico / acético", "ammonium acetate / acetic"]],
  [6.8, ["acetato amónico sin ajustar", "unadjusted ammonium acetate"]],
  [9.2, ["bicarbonato amónico / amoniaco", "ammonium bicarbonate / ammonia"]],
  [10.5, ["amoniaco (columna híbrida)", "ammonia (hybrid column)"]],
];

/* ---------------- Render ---------------- */
function cpRow(label, items, max = 3) {
  if (!items || !items.length) return `<tr><th>${label}</th><td class="sub">—</td></tr>`;
  const first = items.slice(0, max).map((it) => `<div class="pv">${esc(trunc(it.name && !/^\s*$/.test(it.name) && !/value/i.test(it.name) ? it.name + ": " + it.text : it.text, 220))}<span class="src">${esc(it.src)}</span></div>`).join("");
  const more = items.length > max ? `<details><summary>${L(`${items.length - max} valores más`, `${items.length - max} more values`)}</summary>${items.slice(max).map((it) => `<div class="pv">${esc(trunc(it.text, 220))}<span class="src">${esc(it.src)}</span></div>`).join("")}</details>` : "";
  return `<tr><th>${label}</th><td>${first}${more}</td></tr>`;
}
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const median = (a) => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const GHS_MAP = {
  "Exploding Bomb": ["GHS01", "Explosivo", "Explosive"], "Flammable": ["GHS02", "Inflamable", "Flammable"], "Oxidizer": ["GHS03", "Comburente", "Oxidizer"],
  "Compressed Gas": ["GHS04", "Gas a presión", "Compressed gas"], "Corrosive": ["GHS05", "Corrosivo", "Corrosive"], "Acute Toxic": ["GHS06", "Toxicidad aguda", "Acute toxicity"],
  "Irritant": ["GHS07", "Irritante / nocivo", "Irritant / harmful"], "Health Hazard": ["GHS08", "Peligro para la salud", "Health hazard"], "Environmental Hazard": ["GHS09", "Peligro para el medio ambiente", "Environmental hazard"],
};

function renderCompound() {
  const out = $("cpOut");
  if (!out) return;
  const D = CP.data;
  if (!D) { out.innerHTML = ""; return; }
  const p = D.props, e = D.exp;
  const title = p.Title || p.IUPACName || "CID " + D.cid;

  // fórmula sin carga para los cálculos de masa
  let formula = (p.MolecularFormula || "").replace(/[+-]\d*$/, "");
  const charge = Number(p.Charge) || 0;
  let M = null; try { M = parseFormula(formula); } catch (err) { M = null; }

  const links = [`<a href="https://pubchem.ncbi.nlm.nih.gov/compound/${D.cid}" target="_blank" rel="noopener">PubChem CID ${D.cid}</a>`];
  if (D.cas) links.push(`<a href="https://webbook.nist.gov/cgi/cbook.cgi?ID=${encodeURIComponent(D.cas)}&Units=SI" target="_blank" rel="noopener">NIST WebBook</a>`);
  if (D.dtxsid) links.push(`<a href="https://comptox.epa.gov/dashboard/chemical/details/${D.dtxsid}" target="_blank" rel="noopener">EPA CompTox</a>`);

  // ---- Identidad
  let h = `<div class="card cp-head"><div class="cp-head-grid">
    <figure class="cp-struct"><div id="cpStruct" class="cp-struct-img" role="img" aria-label="${esc(L("Estructura de ", "Structure of ") + title)}"></div>
      <figcaption><button type="button" class="link-btn" id="cpSvg">${L("Descargar SVG", "Download SVG")}</button></figcaption></figure>
    <div class="cp-head-info">
    <div class="cp-title"><h2>${esc(title)}</h2><div class="cp-links">${links.join(" · ")}</div></div>
    ${p.IUPACName && p.IUPACName.toLowerCase() !== title.toLowerCase() ? `<p class="muted small cp-iupac">IUPAC: ${esc(p.IUPACName)}</p>` : ""}
    <div class="stats cp-id">
      <div class="stat"><div class="k">${L("Fórmula", "Formula")}</div><div class="v">${M ? hillHtml(M) : esc(p.MolecularFormula || "—")}${charge ? `<sup>${charge > 0 ? "+" : "−"}</sup>` : ""}</div></div>
      <div class="stat"><div class="k">CAS</div><div class="v">${esc(D.cas || "—")}</div></div>
      <div class="stat"><div class="k">${L("Masa molar", "Molar mass")}</div><div class="v">${fmtFix(Number(p.MolecularWeight), 2)}</div><div class="s">g/mol</div></div>
      <div class="stat"><div class="k">${L("Masa monoisotópica", "Monoisotopic mass")}</div><div class="v">${fmtMz(Number(p.MonoisotopicMass), 4)}</div></div>
      <div class="stat"><div class="k">XLogP3</div><div class="v">${p.XLogP !== undefined ? fmtFix(Number(p.XLogP), 1) : "—"}</div><div class="s">${L("calculado", "computed")}</div></div>
      <div class="stat"><div class="k">TPSA</div><div class="v">${p.TPSA !== undefined ? fmtFix(Number(p.TPSA), 0) + " Å²" : "—"}</div><div class="s">${L("donadores/aceptores", "donors/acceptors")} ${p.HBondDonorCount ?? "—"}/${p.HBondAcceptorCount ?? "—"}</div></div>
    </div>
    <div class="cp-ids"><div><span class="k">InChIKey</span> <code>${esc(p.InChIKey || "—")}</code></div><div><span class="k">SMILES</span> <code class="wrap">${esc(p.smiles || "—")}</code></div></div>
    <div class="btn-row">
      <button type="button" class="btn ghost" id="cpToDraw">${L("Abrir en el editor", "Open in the editor")}</button>
      <button type="button" class="btn ghost" id="cpToMass"${M ? "" : " disabled"}>${L("Aductos y espectro →", "Adducts and spectrum →")}</button>
      <button type="button" class="btn ghost" id="cpToDeriv"${M ? "" : " disabled"}>${L("Derivatizar →", "Derivatize →")}</button>
    </div>
  </div></div></div>`;

  // ---- Propiedades experimentales
  const xp = expLogP(e);
  h += `<div class="grid-2 cp-grid">
    <div class="card"><h2 class="card-title">${L("Propiedades experimentales", "Experimental properties")}</h2>
      <p class="hint small" style="margin-top:0">${L("Valores tal como los recoge PubChem, con su fuente. Pueden venir en unidades distintas.", "Values as compiled by PubChem, with their source. Units may vary.")}</p>
      <div class="table-wrap"><table class="data cp-props">
        ${cpRow(L("Punto de ebullición", "Boiling point"), e["Boiling Point"])}
        ${cpRow(L("Punto de fusión", "Melting point"), e["Melting Point"], 2)}
        ${cpRow(L("Presión de vapor", "Vapour pressure"), e["Vapor Pressure"], 2)}
        ${cpRow(L("Solubilidad", "Solubility"), e["Solubility"], 3)}
        ${cpRow("log K<sub>ow</sub>", e["LogP"], 2)}
        ${cpRow("pK<sub>a</sub>", e["Dissociation Constants"], 3)}
        ${cpRow(L("Constante de Henry", "Henry's law constant"), e["Henry's Law Constant"], 2)}
        ${cpRow(L("Estabilidad", "Stability"), (e["Stability/Shelf Life"] || []).concat(e["Decomposition"] || []), 2)}
      </table></div>
    </div>
    <div class="card"><h2 class="card-title">${L("Ionización y logD frente al pH", "Ionization and logD versus pH")}</h2>
      <div id="cpLogd"></div>
    </div>
  </div>`;

  // ---- GC: índices de retención; MS: aductos y CCS; peligros
  const ri = e["Kovats Retention Index"] || [];
  const riRows = ["Semi-standard non-polar", "Standard non-polar", "Standard polar"].map((k) => {
    const vals = ri.filter((x) => x.name === k).flatMap((x) => x.nums || []);
    return { k, vals };
  }).filter((r) => r.vals.length);
  const riLab = { "Semi-standard non-polar": L("Semiestándar apolar (tipo 5 % fenilo)", "Semi-standard non-polar (5 % phenyl type)"), "Standard non-polar": L("Estándar apolar (100 % dimetil)", "Standard non-polar (100 % dimethyl)"), "Standard polar": L("Polar (PEG / WAX)", "Polar (PEG / WAX)") };
  const riHtml = riRows.length
    ? `<table class="data compact"><thead><tr><th>${L("Fase", "Phase")}</th><th class="num">${L("Mediana", "Median")}</th><th class="num">${L("Intervalo", "Range")}</th><th class="num">n</th></tr></thead><tbody>${riRows.map((r) => `<tr><td>${riLab[r.k]}</td><td class="num">${Math.round(median(r.vals))}</td><td class="num">${Math.round(Math.min(...r.vals))}–${Math.round(Math.max(...r.vals))}</td><td class="num">${r.vals.length}</td></tr>`).join("")}</tbody></table>
       <p class="hint small">${L("Fuente: NIST Mass Spectrometry Data Center, vía PubChem. Sirve para comprobar identificaciones en GC-MS junto con el espectro.", "Source: NIST Mass Spectrometry Data Center, via PubChem. Useful to confirm GC-MS identifications together with the spectrum.")}</p>
       <button type="button" class="btn ghost" id="cpToGc">${L("Añadir al simulador de GC →", "Add to the GC simulator →")}</button>`
    : `<p class="muted">${L("PubChem no tiene índices de retención para este compuesto.", "PubChem has no retention indices for this compound.")}</p>`;

  let msHtml = "";
  if (M) {
    const ions = ["[M+H]⁺", "[M+NH₄]⁺", "[M+Na]⁺", "[M−H]⁻", "M⁺• (EI)"].map((lab) => {
      const ad = ADDUCTS.find((a) => adLab(a) === lab || a.lab === lab); if (!ad) return null;
      const c = ionCounts(M, ad); return c ? [lab, mzOf(c, ad.z)] : null;
    }).filter(Boolean);
    msHtml = charge
      ? `<p class="muted">${L(`Especie con carga ${charge > 0 ? "positiva" : "negativa"} permanente: m/z ${fmtMz(mzOf(M, charge), 4)} directamente.`, `Permanently ${charge > 0 ? "positive" : "negative"} species: m/z ${fmtMz(mzOf(M, charge), 4)} directly.`)}</p>`
      : `<table class="data compact"><tbody>${ions.map(([lab, mz]) => `<tr><td>${lab}</td><td class="num">${fmtMz(mz, 4)}</td></tr>`).join("")}</tbody></table>`;
  }
  const ccs = e["Collision Cross Section"] || [];
  if (ccs.length) {
    msHtml += `<h3 class="cp-sub">${L("Sección transversal de colisión (CCS)", "Collision cross section (CCS)")}</h3><div class="cp-ccs">${ccs.slice(0, 6).map((it) => `<div class="pv">${esc(trunc(it.text, 120))}<span class="src">${esc(it.src)}</span></div>`).join("")}</div>`;
  }

  // GHS: el primer bloque de clasificación (normalmente ECHA C&L o el notificado más completo)
  const gh = D.ghs;
  let ghsHtml = `<p class="muted">${L("Sin clasificación GHS en PubChem.", "No GHS classification in PubChem.")}</p>`;
  if (gh && gh["GHS Classification"] && gh["GHS Classification"].length) {
    const all = gh["GHS Classification"];
    const ref = all[0].ref;
    const block = all.filter((x) => x.ref === ref);
    const picto = [...new Set(block.filter((x) => /pictogram/i.test(x.name)).flatMap((x) => x.markup))];
    const signal = (block.find((x) => /^signal/i.test(x.name)) || {}).text || "";
    const hst = (block.find((x) => /hazard statements/i.test(x.name)) || {}).lines || [];
    ghsHtml = `<div class="ghs-row">${picto.map((pn) => { const m = GHS_MAP[pn]; return m ? `<span class="ghs" title="${esc(L(m[1], m[2]))}"><span class="dia"><b>${m[0].slice(3)}</b></span><span class="lab">${esc(L(m[1], m[2]))}</span></span>` : ""; }).join("")}</div>
      ${signal ? `<p><b>${L("Palabra de advertencia", "Signal word")}:</b> ${esc(signal)}</p>` : ""}
      ${hst.length ? `<ul class="hlist">${hst.slice(0, 10).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <p class="hint small">${L("Fuente", "Source")}: ${esc(block[0].src)}. ${L("Consulta siempre la ficha de datos de seguridad del proveedor.", "Always check the supplier's safety data sheet.")}</p>`;
  }

  h += `<div class="grid-3 cp-grid">
    <div class="card"><h2 class="card-title">${L("GC: índices de retención", "GC: retention indices")}</h2>${riHtml}</div>
    <div class="card"><h2 class="card-title">${L("Espectrometría de masas", "Mass spectrometry")}</h2>${msHtml || "—"}</div>
    <div class="card"><h2 class="card-title">${L("Peligros (GHS)", "Hazards (GHS)")}</h2>${ghsHtml}</div>
  </div>
  <div class="card cp-adv"><h2 class="card-title">${L("¿GC o LC?", "GC or LC?")}</h2><div id="cpAdv"><p class="muted">${L("Analizando la estructura…", "Analysing the structure…")}</p></div></div>`;

  out.innerHTML = h;

  // acciones
  $("cpToDraw").addEventListener("click", () => cpOpenInDraw());
  if (M) {
    $("cpToMass").addEventListener("click", () => { setFormula(formula); location.hash = "#masas"; });
    $("cpToDeriv").addEventListener("click", () => { if (window.derivSetFormula) derivSetFormula(formula, title, CP.adv); location.hash = "#derivatizacion"; });
  }
  if ($("cpToGc")) $("cpToGc").addEventListener("click", () => {
    const r = riRows[0];
    const line = `${title.replace(/;/g, ",")}; ${Math.round(median(r.vals))}`;
    const ta = $("gcCmp");
    ta.value = ta.value.replace(/\s+$/, "") + "\n" + line;
    store.set("gcCmp", ta.value);
    CH.mode = "gc"; store.set("chMode", "gc");
    location.hash = "#cromatografia";
    renderChroma();
  });
  if (CP.adv) advRenderInto($("cpAdv"), CP.adv, () => title);
  renderLogd();
  cpStructure();
}

// Estructura 2D: OpenChemLib (vectorial, sin red); si falla, la imagen de PubChem
async function cpStructure() {
  const D = CP.data, box = $("cpStruct");
  if (!D || !box) return;
  const fallback = () => {
    box.innerHTML = `<img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${D.cid}/PNG?image_size=400x300" alt="">`;
    $("cpSvg").hidden = true;
  };
  if (!D.props.smiles) { fallback(); return; }
  try {
    if (!CP.svg || CP.svgCid !== D.cid) {
      const OCL = await loadOCL();
      const mol = OCL.Molecule.fromSmiles(D.props.smiles);
      mol.inventCoordinates();
      let svg = mol.toSVG(400, 300, "cpmol" + D.cid, { suppressChiralText: true, autoCrop: true, autoCropMargin: 14, strokeWidth: 1.4 });
      CP.svg = svg; CP.svgCid = D.cid;
    }
    if (CP.data !== D || !$("cpStruct")) return;
    // quitar el tamaño fijo para que escale con su contenedor
    $("cpStruct").innerHTML = CP.svg.replace(/\swidth="[^"]*"/, "").replace(/\sheight="[^"]*"/, "");
    $("cpSvg").hidden = false;
    $("cpSvg").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([CP.svg], { type: "image/svg+xml" }));
      a.download = (D.props.Title || "CID" + D.cid).replace(/[^\w\-]+/g, "_") + ".svg";
      document.body.appendChild(a); a.click(); a.remove();
    };
  } catch (e) { fallback(); }
}

function renderLogd() {
  const box = $("cpLogd");
  if (!box || !CP.data) return;
  const e = CP.data.exp, p = CP.data.props;
  if (!CP.logd) {
    const xp = expLogP(e);
    const cands = pkaCandidates(e);
    CP.logd = {
      logP: xp ? xp.v : Number(p.XLogP), logPsrc: xp ? xp.src : "XLogP3",
      groups: guessGroups(cands, CP.adv), cands, auto: true,
    };
  }
  const S = CP.logd;
  const groupsHtml = S.groups.map((g, i) => `<div class="field-row pk-row" data-i="${i}">
      <select class="pk-type"><option value="acid"${g.type === "acid" ? " selected" : ""}>${L("Ácido", "Acid")}</option><option value="base"${g.type === "base" ? " selected" : ""}>${L("Base (pKa del ácido conjugado)", "Base (pKa of conjugate acid)")}</option></select>
      <input class="pk-val" type="text" inputmode="decimal" value="${Number.isFinite(g.pKa) ? g.pKa : ""}" placeholder="pKa">
      <button type="button" class="btn ghost pk-del" aria-label="${L("Quitar", "Remove")}">×</button></div>`).join("");
  const candHtml = S.cands.length ? `<p class="hint small">${L("pKa en PubChem", "pKa in PubChem")}: ${S.cands.map((c) => `<button type="button" class="chip pk-cand" data-v="${c.v}" title="${esc(c.raw + " · " + c.src)}">${fmtFix(c.v, 2)}</button>`).join(" ")}</p>` : `<p class="hint small">${L("PubChem no da pKa experimentales para este compuesto; si tiene grupos ionizables, añádelos a mano.", "PubChem gives no experimental pKa for this compound; if it has ionizable groups, add them by hand.")}</p>`;

  box.innerHTML = `
    <div class="field-row wrap"><label class="field grow"><span>log P <span class="hint">(${esc(S.logPsrc)})</span></span><input id="ldLogP" type="text" inputmode="decimal" value="${Number.isFinite(S.logP) ? S.logP : ""}"></label></div>
    <div class="pk-list">${groupsHtml}</div>
    <div class="btn-row" style="margin-bottom:6px"><button type="button" class="btn ghost small-btn" id="ldAdd">${L("+ Añadir pKa", "+ Add pKa")}</button></div>
    ${candHtml}
    ${S.auto && S.groups.length ? `<p class="hint small">${L("Asignación automática a partir de PubChem y de la estructura: revísala.", "Automatic assignment from PubChem and the structure: please check it.")}</p>` : ""}
    <div id="ldChart" class="chart"></div>
    <div class="table-wrap"><table class="data compact" id="ldTable"></table></div>`;

  const upd = () => drawLogd();
  box.querySelector("#ldLogP").addEventListener("input", (ev) => { S.logP = parseNum(ev.target.value); S.auto = false; upd(); });
  box.querySelectorAll(".pk-row").forEach((row) => {
    const i = Number(row.dataset.i);
    row.querySelector(".pk-type").addEventListener("input", (ev) => { S.groups[i].type = ev.target.value; S.auto = false; upd(); });
    row.querySelector(".pk-val").addEventListener("input", (ev) => { S.groups[i].pKa = parseNum(ev.target.value); S.auto = false; upd(); });
    row.querySelector(".pk-del").addEventListener("click", () => { S.groups.splice(i, 1); S.auto = false; renderLogd(); });
  });
  box.querySelector("#ldAdd").addEventListener("click", () => { if (S.groups.length < 4) { S.groups.push({ type: "acid", pKa: NaN }); S.auto = false; renderLogd(); } });
  box.querySelectorAll(".pk-cand").forEach((b) => b.addEventListener("click", () => {
    const v = Number(b.dataset.v);
    const empty = S.groups.find((g) => !Number.isFinite(g.pKa));
    if (empty) empty.pKa = v; else if (S.groups.length < 4) S.groups.push({ type: v < 7 ? "acid" : "base", pKa: v });
    S.auto = false; renderLogd();
  }));
  drawLogd();
}

function drawLogd() {
  const S = CP.logd; if (!S) return;
  const groups = S.groups.filter((g) => Number.isFinite(g.pKa));
  const logP = S.logP;
  const el = $("ldChart");
  if (!Number.isFinite(logP)) { el.innerHTML = ""; $("ldTable").innerHTML = ""; return; }
  const ld = (pH) => logP + Math.log10(Math.max(fracNeutral(pH, groups), 1e-12));
  const W = 520, H = 260, m = { l: 46, r: 12, t: 12, b: 40 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const ys = []; for (let x = 0; x <= 14; x += 0.1) ys.push(ld(x));
  const yMin = Math.max(Math.min(...ys), logP - 8), yMax = logP + 0.5;
  const yt = niceTicks(yMin, yMax, 5);
  const X = (v) => m.l + v / 14 * pw, Y = (v) => m.t + ph - (Math.max(v, yt.lo) - yt.lo) / (yt.hi - yt.lo) * ph;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="logD vs pH">`;
  for (const v of yt.ticks) s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${tickLabel(v, yt.step)}</text>`;
  for (let v = 0; v <= 14; v += 2) s += `<text class="tick" x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${v}</text>`;
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"/>`;
  for (const [pH] of PH_POINTS) s += `<line x1="${X(pH)}" x2="${X(pH)}" y1="${m.t}" y2="${m.t + ph}" style="stroke:var(--line-2);stroke-dasharray:3 3"/>`;
  s += `<path class="fit" d="${ys.map((v, i) => (i ? "L" : "M") + X(i * 0.1).toFixed(1) + " " + Y(v).toFixed(1)).join("")}"/>`;
  s += `<text class="lab" x="${m.l + pw / 2}" y="${H - 4}" text-anchor="middle">pH</text><text class="lab" transform="translate(12 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">log D</text></svg>`;
  el.innerHTML = s;
  const chargeAt = (pH) => {
    let q = 0; groups.forEach((g) => { q += g.type === "acid" ? -1 / (1 + Math.pow(10, g.pKa - pH)) : 1 / (1 + Math.pow(10, pH - g.pKa)); });
    return q;
  };
  $("ldTable").innerHTML = `<thead><tr><th class="num">pH</th><th>${L("Fase móvil típica", "Typical mobile phase")}</th><th class="num">${L("% neutro", "% neutral")}</th><th class="num">${L("Carga media", "Mean charge")}</th><th class="num">log D</th></tr></thead><tbody>` +
    PH_POINTS.map(([pH, lab]) => { const f = fracNeutral(pH, groups), q = chargeAt(pH); return `<tr><td class="num">${fmtFix(pH, 1)}</td><td>${esc(L(lab[0], lab[1]))}</td><td class="num">${f >= 0.995 ? "100" : fmtFix(f * 100, f < 0.1 ? 2 : 0)}</td><td class="num">${Math.abs(q) < 0.005 ? "0" : (q > 0 ? "+" : "−") + fmtFix(Math.abs(q), 2)}</td><td class="num">${fmtFix(ld(pH), 1)}</td></tr>`; }).join("") +
    `</tbody><caption class="sub" style="caption-side:bottom;text-align:left;padding-top:8px">${L("Cuanto mayor es log D, más retiene en fase reversa y en SPE apolar (C18, HLB). Para retener, trabaja donde la forma neutra domina; para ESI(+) interesa la forma protonada y para ESI(−) la desprotonada. Modelo de grupos independientes, pKa en agua a 25 °C.", "The higher log D, the stronger the retention in reversed phase and non-polar SPE (C18, HLB). For retention, work where the neutral form dominates; ESI(+) favours the protonated form and ESI(−) the deprotonated one. Independent-group model, aqueous pKa at 25 °C.")}</caption>`;
}

async function cpAdvisor() {
  const D = CP.data; if (!D || !D.props.smiles) return;
  try {
    const OCL = await loadOCL();
    CP.adv = adviseAnalyze(OCL, { smiles: D.props.smiles });
    if ($("cpAdv")) advRenderInto($("cpAdv"), CP.adv, () => D.props.Title || D.props.IUPACName);
    if (CP.logd && CP.logd.auto) { CP.logd = null; renderLogd(); }
  } catch (e) {
    if ($("cpAdv")) $("cpAdv").innerHTML = `<p class="muted">${L("No se ha podido analizar la estructura.", "Could not analyse the structure.")}</p>`;
  }
}

async function cpOpenInDraw() {
  const D = CP.data; if (!D) return;
  location.hash = "#dibujar";
  const wait = () => new Promise((ok) => { const iv = setInterval(() => { if (DRAW.state === "ready") { clearInterval(iv); ok(); } }, 100); });
  await wait();
  try {
    const OCL = await loadOCL();
    const mol = OCL.Molecule.fromSmiles(D.props.smiles);
    mol.inventCoordinates();
    DRAW.composer.setChemObj(Kekule.IO.loadFormatData(mol.toMolfile(), "mol"));
    readStructure(true);
  } catch (e) { /* nada */ }
}

/* ---------------- Inicio ---------------- */
function initCompound() {
  if (!$("compuesto")) return;
  $("cpForm").addEventListener("submit", (ev) => { ev.preventDefault(); const q = $("cpQuery").value.trim(); if (q) cpLoad(q); });
  const fromDraw = () => {
    if (!DRAW.formula) { location.hash = "#compuesto"; cpMsg(L("Primero dibuja o carga una molécula en el editor.", "First draw or load a molecule in the editor."), true); return; }
    location.hash = "#compuesto";
    if (DRAW.name && DRAW.name.state === "ok" && DRAW.name.cid) { $("cpQuery").value = DRAW.name.title || "CID " + DRAW.name.cid; cpLoad("CID " + DRAW.name.cid, DRAW.name.title); }
    else { $("cpQuery").value = DRAW.smi; cpLoad(DRAW.smi); }
  };
  $("cpFromDraw").addEventListener("click", fromDraw);
  if ($("drToCompound")) $("drToCompound").addEventListener("click", fromDraw);
  const last = store.get("cpQuery", "");
  if (last) $("cpQuery").value = last;
  window.addEventListener("hashchange", () => {
    if (location.hash === "#compuesto" && !CP.data && !CP.busy && $("cpQuery").value.trim()) cpLoad($("cpQuery").value.trim());
  });
  if (location.hash === "#compuesto" && last) cpLoad(last);
}

// el botón de la pestaña Dibujar se activa o desactiva con los demás
const _renderDrawPanel = renderDrawPanel;
renderDrawPanel = function (err) { _renderDrawPanel(err); if ($("drToCompound")) $("drToCompound").disabled = !DRAW.formula; };

VIEWS.splice(VIEWS.indexOf("dibujar"), 0, "compuesto");
const _renderAll5 = renderAll;
renderAll = function () { _renderAll5(); if (CP.data) { renderCompound(); } };
initCompound();
applyStatic();
route();
