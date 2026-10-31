/* PeakLab · Diagnóstico de problemas en GC, LC y MS.
   Cada síntoma tiene una pregunta que separa las causas físicas de las químicas (o del sistema frente a la
   columna); las causas que encajan con la respuesta se muestran primero. Texto: [español, inglés]. */
"use strict";

Object.assign(EN, {
  "tr.h1": "Troubleshooting",
  "tr.intro": "Pick the technique and the symptom, answer the question and you get the most likely causes first, with how to check each one and how to fix it.",
});

// c: causa, k: cómo comprobarlo, f: solución, t: etiquetas que la hacen más probable
const TS = [
  /* ============================ LC ============================ */
  { id: "lc-tail", tech: "lc", s: ["Picos con cola", "Peak tailing"],
    q: ["¿Qué picos tienen cola?", "Which peaks tail?"],
    o: [["all", "Todos", "All of them"], ["some", "Solo algunos (bases, quelantes, polares)", "Only some (bases, chelators, polar)"], ["early", "Sobre todo los primeros", "Mostly the early ones"]],
    c: [
      { t: ["all"], c: ["Hueco o canal en la cabeza de la columna, o frita de entrada parcialmente obstruida", "Void or channel at the column inlet, or partially blocked inlet frit"], k: ["Cambia la columna por otra nueva del mismo tipo: si la cola desaparece, era la columna.", "Swap in a new column of the same type: if the tailing goes away, it was the column."], f: ["Invierte el flujo y lava a caudal bajo si el fabricante lo permite; si no, sustituye la columna. Pon un filtro en línea o una precolumna.", "Back-flush at low flow if the manufacturer allows it; otherwise replace the column. Fit an in-line filter or guard column."] },
      { t: ["all"], c: ["Volumen muerto en las conexiones (tubo que no llega al fondo del puerto, férula mal colocada)", "Dead volume at fittings (tubing not bottomed out, ferrule set at the wrong depth)"], k: ["Revisa las conexiones de entrada y salida de la columna; es típico tras cambiar de columna o de marca de conectores.", "Check the column inlet and outlet fittings; typical after changing column or fitting brand."], f: ["Rehaz la conexión empujando el tubo hasta el fondo; usa conectores ajustables o de la misma marca que la columna, y tubos cortos y estrechos.", "Remake the connection with the tubing fully bottomed; use adjustable fittings or ones matching the column, and short, narrow tubing."] },
      { t: ["some"], c: ["Interacción secundaria de compuestos básicos con silanoles residuales", "Secondary interaction of basic compounds with residual silanols"], k: ["Las aminas tienen cola y los neutros no; empeora a pH 4–7.", "Amines tail while neutrals don't; it worsens at pH 4–7."], f: ["Baja el pH (≤ 3) con tampón de 10–20 mM, usa una columna con buen recubrimiento (end-capping), de superficie cargada o híbrida, o trabaja a pH alto con una columna que lo aguante.", "Lower the pH (≤ 3) with a 10–20 mM buffer, use a well end-capped, charged-surface or hybrid column, or work at high pH on a column rated for it."] },
      { t: ["some"], c: ["pH de la fase móvil cerca del pKa del analito", "Mobile-phase pH close to the analyte pKa"], k: ["Mira el pKa en la ficha del compuesto: si está a menos de 1,5 unidades del pH, coexisten dos formas.", "Check the pKa on the compound page: within 1.5 units of the pH, two forms coexist."], f: ["Ajusta el pH al menos 1,5–2 unidades lejos del pKa y tampona de verdad (no solo con ácido).", "Move the pH at least 1.5–2 units away from the pKa and buffer it properly (not just with acid)."] },
      { t: ["some"], c: ["Analitos que se unen a metales (fosfatos, catecoles, tetraciclinas, ácidos fosfónicos) en contacto con acero", "Metal-binding analytes (phosphates, catechols, tetracyclines, phosphonic acids) touching steel"], k: ["Solo tienen cola esos compuestos y mejora tras varias inyecciones (los sitios se saturan).", "Only those compounds tail and it improves after several injections (sites saturate)."], f: ["Usa hardware biocompatible o con superficie inerte, pasiva el sistema o añade un quelante a la fase móvil (p. ej. ácido medrónico en concentraciones µM).", "Use bio-inert or surface-treated hardware, passivate the system, or add a chelator to the mobile phase (e.g. µM medronic acid)."] },
      { t: ["some", "all"], c: ["Sobrecarga de masa", "Mass overload"], k: ["Inyecta la mitad: si la cola baja y el tiempo de retención aumenta un poco, es sobrecarga.", "Inject half as much: if tailing drops and retention increases slightly, it's overload."], f: ["Diluye o inyecta menos; las bases se sobrecargan con facilidad con fases móviles de baja fuerza iónica.", "Dilute or inject less; bases overload easily at low ionic strength."] },
      { t: ["early"], c: ["Disolvente de la muestra más fuerte que la fase móvil inicial", "Sample solvent stronger than the initial mobile phase"], k: ["Afecta a los primeros picos y empeora al aumentar el volumen de inyección.", "It affects early peaks and worsens with larger injection volumes."], f: ["Disuelve la muestra en la fase móvil inicial, reduce el volumen o diluye con agua.", "Dissolve the sample in the initial mobile phase, inject less, or dilute with water."] },
      { t: ["all", "some"], c: ["Columna contaminada o envejecida", "Contaminated or aged column"], k: ["La cola ha ido apareciendo poco a poco y sube la presión.", "Tailing has crept in gradually and pressure has risen."], f: ["Lava con disolvente fuerte (p. ej. 95 % orgánico, luego isopropanol) y cambia la precolumna.", "Wash with strong solvent (e.g. 95 % organic, then isopropanol) and replace the guard."] },
    ] },
  { id: "lc-front", tech: "lc", s: ["Picos con frente (fronting)", "Peak fronting"],
    q: ["¿Empeora al inyectar más cantidad?", "Does it get worse when you inject more?"],
    o: [["yes", "Sí", "Yes"], ["no", "No", "No"]],
    c: [
      { t: ["yes"], c: ["Sobrecarga de la columna (concentración o volumen)", "Column overload (concentration or volume)"], k: ["El frente desaparece al diluir 5–10 veces.", "Fronting disappears after a 5–10× dilution."], f: ["Diluye, inyecta menos o usa una columna de mayor diámetro.", "Dilute, inject less, or use a wider column."] },
      { t: ["no", "yes"], c: ["Disolvente de muestra más fuerte que la fase móvil", "Sample solvent stronger than the mobile phase"], k: ["Prueba la misma muestra disuelta en fase móvil.", "Try the same sample dissolved in mobile phase."], f: ["Iguala el disolvente de la muestra a la fase móvil inicial.", "Match the sample solvent to the initial mobile phase."] },
      { t: ["no"], c: ["Lecho de la columna hundido (por pH alto, temperatura o golpes de presión)", "Collapsed column bed (from high pH, temperature or pressure shocks)"], k: ["Todos los picos presentan frente o forma doble en una columna usada.", "All peaks front or look doubled on a used column."], f: ["Sustituye la columna y evita cambios bruscos de presión y pH fuera de rango.", "Replace the column and avoid pressure shocks and out-of-range pH."] },
      { t: ["no"], c: ["Colapso de fase (dewetting) con fase muy acuosa en C18 convencional", "Phase collapse (dewetting) with highly aqueous mobile phase on conventional C18"], k: ["Pasa tras trabajar con más de ~95 % de agua y parar el flujo; los tiempos bajan de golpe.", "Happens after > ~95 % water and a flow stop; retention suddenly drops."], f: ["Lava con orgánico alto para rehumectar; usa una C18 compatible con 100 % agua.", "Flush with high organic to re-wet; use a C18 rated for 100 % water."] },
      { t: ["no"], c: ["Fase móvil más fría que la columna", "Mobile phase colder than the column"], k: ["Ocurre con columna termostatizada a 40–60 °C sin precalentador.", "Seen with columns at 40–60 °C without a pre-heater."], f: ["Usa un precalentador del eluyente.", "Use an eluent pre-heater."] },
    ] },
  { id: "lc-split", tech: "lc", s: ["Picos partidos o dobles", "Split or double peaks"],
    q: ["¿Les pasa a todos los picos?", "Does it affect every peak?"],
    o: [["all", "A todos", "All peaks"], ["one", "Solo a uno o a pocos", "One or a few"]],
    c: [
      { t: ["all"], c: ["Frita de entrada parcialmente obstruida o hueco en la cabeza de la columna", "Partly blocked inlet frit or void at the column head"], k: ["¿Pasa también con una columna nueva? Si no, es la columna.", "Does it happen with a new column too? If not, it's the column."], f: ["Invierte y lava si está permitido; filtra las muestras (0,2 µm) y usa filtro en línea.", "Back-flush if allowed; filter samples (0.2 µm) and use an in-line filter."] },
      { t: ["all"], c: ["Problema del inyector (junta del rotor gastada, aguja o bucle parcialmente obstruidos)", "Injector problem (worn rotor seal, partly blocked needle or loop)"], k: ["El área es poco repetible y aparece arrastre.", "Areas are poorly repeatable and there is carryover."], f: ["Revisa o cambia la junta del rotor y la aguja.", "Inspect or replace the rotor seal and needle."] },
      { t: ["one", "all"], c: ["Disolvente de muestra fuerte o volumen de inyección grande", "Strong sample solvent or large injection volume"], k: ["Afecta sobre todo a los picos tempranos.", "Mostly affects early peaks."], f: ["Diluye en fase móvil inicial o reduce el volumen.", "Dilute in initial mobile phase or reduce the volume."] },
      { t: ["one"], c: ["Dos compuestos coeluyendo (isómeros, impureza)", "Two co-eluting compounds (isomers, impurity)"], k: ["En MS, compara espectros al principio y al final del pico; en DAD, mira la pureza espectral.", "In MS, compare spectra at the front and tail of the peak; with DAD, check spectral purity."], f: ["Cambia la selectividad: otro disolvente orgánico, otra fase (fenilo, PFP), pH o temperatura.", "Change selectivity: another organic solvent, phase (phenyl, PFP), pH or temperature."] },
      { t: ["one"], c: ["pH cerca del pKa (dos formas que se interconvierten lentamente)", "pH near the pKa (two slowly interconverting forms)"], k: ["El perfil cambia mucho con pequeños cambios de pH.", "The shape changes a lot with small pH changes."], f: ["Tampona y aleja el pH del pKa.", "Buffer and move the pH away from the pKa."] },
    ] },
  { id: "lc-rt", tech: "lc", s: ["Los tiempos de retención se mueven", "Retention times shift"],
    q: ["¿Cómo se mueven?", "How do they move?"],
    o: [["drift", "Deriva continua en un sentido", "Steady drift one way"], ["jump", "Salto de golpe", "Sudden jump"], ["random", "Varían al azar", "Random scatter"]],
    c: [
      { t: ["drift"], c: ["Columna sin equilibrar entre inyecciones", "Column not equilibrated between injections"], k: ["Las primeras inyecciones de la secuencia se desplazan más.", "The first injections of a sequence shift the most."], f: ["Equilibra al menos 10 volúmenes de columna (bastante más en HILIC y con pares iónicos).", "Equilibrate at least 10 column volumes (much more for HILIC and ion pairing)."] },
      { t: ["drift"], c: ["La fase móvil cambia con el tiempo (evaporación del orgánico o del modificador volátil, CO₂ que cambia el pH)", "Mobile phase changing over time (evaporating organic or volatile modifier, CO₂ shifting pH)"], k: ["Los tiempos aumentan a lo largo del día con la misma botella.", "Retention increases over the day with the same bottle."], f: ["Prepara fase móvil fresca, tapa las botellas y no rellenes encima de la vieja.", "Prepare fresh mobile phase, cap bottles and don't top up old solvent."] },
      { t: ["drift"], c: ["Temperatura de la columna no controlada", "Column temperature not controlled"], k: ["Coincide con cambios de temperatura del laboratorio.", "Matches changes in lab temperature."], f: ["Termostatiza la columna (p. ej. 30–40 °C).", "Thermostat the column (e.g. 30–40 °C)."] },
      { t: ["drift"], c: ["Envejecimiento de la columna (pérdida de fase, contaminación)", "Column ageing (phase loss, contamination)"], k: ["Pasa a lo largo de semanas y no se recupera.", "Happens over weeks and does not recover."], f: ["Lava o sustituye; registra la columna en cada secuencia.", "Wash or replace; log the column used in each sequence."] },
      { t: ["jump"], c: ["Fase móvil nueva preparada de otra forma (pH, concentración de tampón, % de orgánico)", "New mobile phase prepared differently (pH, buffer concentration, % organic)"], k: ["El salto coincide con una botella nueva.", "The jump coincides with a new bottle."], f: ["Prepara por pesada, mide el pH antes de añadir el orgánico y documenta el procedimiento.", "Prepare by weight, measure pH before adding organic and document the procedure."] },
      { t: ["jump"], c: ["Otro equipo u otra columna (volumen de retardo distinto)", "Different instrument or column (different dwell volume)"], k: ["Los picos tempranos de un gradiente se mueven más que los tardíos.", "Early gradient peaks move more than late ones."], f: ["Compensa el volumen de retardo (ver Transferencia de métodos).", "Compensate the dwell volume (see Method transfer)."] },
      { t: ["random"], c: ["Burbujas o válvulas antirretorno defectuosas en la bomba", "Air bubbles or faulty check valves in the pump"], k: ["La presión oscila de forma periódica.", "Pressure ripples periodically."], f: ["Desgasifica, purga la bomba y limpia o cambia las válvulas antirretorno.", "Degas, purge the pump and clean or replace check valves."] },
      { t: ["random"], c: ["Fuga en el sistema", "Leak in the system"], k: ["Busca restos de sal o humedad en las conexiones; el flujo real no coincide con el programado.", "Look for salt deposits or moisture at fittings; actual flow doesn't match the set flow."], f: ["Localiza y aprieta o cambia la conexión.", "Find and tighten or replace the fitting."] },
      { t: ["random"], c: ["Mezcla del gradiente poco precisa (válvula de proporción en baja presión)", "Imprecise gradient mixing (low-pressure proportioning valve)"], k: ["Con la fase móvil premezclada el problema desaparece.", "With premixed mobile phase the problem goes away."], f: ["Revisa la válvula de proporción o usa un mezclador mayor.", "Check the proportioning valve or use a larger mixer."] },
    ] },
  { id: "lc-ghost", tech: "lc", s: ["Picos fantasma (aparecen en los blancos)", "Ghost peaks (show up in blanks)"],
    q: ["¿Salen también en un gradiente en blanco sin inyectar nada?", "Do they appear in a blank gradient with no injection?"],
    o: [["yes", "Sí", "Yes"], ["no", "No, solo al inyectar", "No, only when injecting"]],
    c: [
      { t: ["yes"], c: ["Contaminación en el agua o en la fase móvil, que se acumula en cabeza de columna durante el equilibrado", "Contaminated water or mobile phase, concentrated on the column head during equilibration"], k: ["Los picos crecen si alargas el tiempo de equilibrado.", "Peaks grow when you lengthen equilibration."], f: ["Usa disolventes y aditivos de grado LC-MS, agua recién purificada y botellas que no se laven con detergente.", "Use LC-MS-grade solvents and additives, freshly purified water and bottles not washed with detergent."] },
      { t: ["yes"], c: ["Contaminación del sistema (filtros de botella, mezclador, tubos)", "System contamination (bottle filters, mixer, tubing)"], k: ["Persiste tras cambiar los disolventes.", "Persists after changing solvents."], f: ["Cambia los filtros de entrada y lava el sistema con isopropanol y agua.", "Replace inlet filters and flush the system with isopropanol and water."] },
      { t: ["no"], c: ["Arrastre desde la inyección anterior (aguja, válvula, bucle)", "Carryover from the previous injection (needle, valve, loop)"], k: ["El pico baja en blancos consecutivos tras un patrón alto.", "The peak shrinks in consecutive blanks after a high standard."], f: ["Usa un lavado de aguja más fuerte (con orgánico y ácido o base), añade blancos tras los patrones altos y revisa la junta del rotor.", "Use a stronger needle wash (organic with acid or base), add blanks after high standards and check the rotor seal."] },
      { t: ["no"], c: ["Contaminación de viales, tapones o disolvente de dilución", "Contaminated vials, caps or dilution solvent"], k: ["Inyecta el disolvente desde otro vial y otro lote.", "Inject the solvent from another vial and lot."], f: ["Cambia de lote de viales o septos (los de silicona sueltan siloxanos).", "Change vial or septum lot (silicone septa release siloxanes)."] },
      { t: ["no", "yes"], c: ["Compuestos muy retenidos de inyecciones anteriores que salen en el análisis siguiente", "Strongly retained compounds from earlier injections eluting in the next run"], k: ["Son picos anchos y aparecen a tiempos poco reproducibles.", "Peaks are broad and appear at irreproducible times."], f: ["Alarga el lavado final con orgánico alto.", "Lengthen the high-organic wash at the end."] },
    ] },
  { id: "lc-pressHigh", tech: "lc", s: ["Presión demasiado alta", "Pressure too high"],
    q: ["¿Sigue alta con la columna desconectada?", "Is it still high with the column disconnected?"],
    o: [["sys", "Sí", "Yes"], ["col", "No, solo con la columna", "No, only with the column"]],
    c: [
      { t: ["col"], c: ["Frita de entrada o precolumna obstruidas por partículas o muestra precipitada", "Inlet frit or guard blocked by particles or precipitated sample"], k: ["Quita la precolumna: si baja, era ella.", "Remove the guard: if pressure drops, that was it."], f: ["Cambia la precolumna, filtra o centrifuga las muestras y, si se puede, invierte el flujo de la columna.", "Replace the guard, filter or centrifuge samples and back-flush the column if allowed."] },
      { t: ["col"], c: ["Precipitación del tampón al subir el orgánico (fosfato por encima de ~70–80 % de acetonitrilo)", "Buffer precipitation at high organic (phosphate above ~70–80 % acetonitrile)"], k: ["La presión sube al final del gradiente.", "Pressure rises at the end of the gradient."], f: ["Lava con agua templada sin tampón y limita el % de orgánico o la concentración de tampón.", "Flush with warm buffer-free water and limit % organic or buffer concentration."] },
      { t: ["col"], c: ["Viscosidad mayor de lo esperado (mezclas metanol-agua cerca del 40–50 %, temperatura baja)", "Higher viscosity than expected (methanol–water mixes around 40–50 %, low temperature)"], k: ["La presión es máxima a mitad del gradiente y vuelve a bajar.", "Pressure peaks mid-gradient and comes back down."], f: ["Es normal: sube la temperatura o cambia a acetonitrilo.", "It's normal: raise the temperature or switch to acetonitrile."] },
      { t: ["sys"], c: ["Obstrucción en filtro en línea, tubos, inyector o mezclador", "Blockage in in-line filter, tubing, injector or mixer"], k: ["Desconecta tramo a tramo desde el detector hacia la bomba hasta que la presión baje.", "Disconnect section by section from the detector back to the pump until pressure drops."], f: ["Cambia la pieza obstruida.", "Replace the blocked part."] },
    ] },
  { id: "lc-pressLow", tech: "lc", s: ["Presión baja u oscilante", "Low or fluctuating pressure"],
    q: ["¿Las oscilaciones son regulares (al ritmo de la bomba)?", "Are the fluctuations regular (in time with the pump)?"],
    o: [["yes", "Sí", "Yes"], ["no", "No / la presión es baja sin más", "No / pressure is just low"]],
    c: [
      { t: ["yes"], c: ["Burbuja en el cabezal o válvula antirretorno sucia", "Air in a pump head or dirty check valve"], k: ["Se nota en un canal concreto.", "It is tied to one channel."], f: ["Purga, desgasifica y limpia con ultrasonidos o cambia la válvula.", "Purge, degas and sonicate or replace the check valve."] },
      { t: ["yes"], c: ["Juntas de pistón gastadas", "Worn piston seals"], k: ["Restos de fase móvil detrás del cabezal.", "Mobile phase residue behind the pump head."], f: ["Cambia las juntas; usa lavado de juntas con tampones.", "Replace the seals; use seal wash with buffers."] },
      { t: ["no"], c: ["Fuga", "Leak"], k: ["Busca humedad o cristales de sal en conexiones, inyector y celda.", "Look for moisture or salt crystals at fittings, injector and cell."], f: ["Aprieta o cambia la conexión.", "Tighten or replace the fitting."] },
      { t: ["no"], c: ["Botella vacía o filtro de entrada obstruido", "Empty bottle or blocked inlet filter"], k: ["El canal deja de dar flujo.", "The channel stops delivering."], f: ["Rellena y cambia el filtro.", "Refill and replace the filter."] },
    ] },
  { id: "lc-baseline", tech: "lc", s: ["Línea base ruidosa o con deriva (UV)", "Noisy or drifting baseline (UV)"],
    q: ["¿Qué ves?", "What do you see?"],
    o: [["drift", "Deriva durante el gradiente", "Drift during the gradient"], ["noise", "Ruido", "Noise"]],
    c: [
      { t: ["drift"], c: ["A y B absorben distinto a esa longitud de onda (TFA, fórmico o acetato a < 230 nm)", "A and B absorb differently at that wavelength (TFA, formic or acetate below 230 nm)"], k: ["La deriva reproduce la forma del gradiente.", "The drift follows the gradient profile."], f: ["Pon el mismo aditivo en A y B (ajustando la concentración) o sube la longitud de onda.", "Put the same additive in A and B (adjusting concentration) or raise the wavelength."] },
      { t: ["drift"], c: ["Contaminación acumulada que sale con el gradiente", "Accumulated contamination eluting with the gradient"], k: ["Aparecen jorobas anchas en los blancos.", "Broad humps appear in blanks."], f: ["Lava la columna y usa disolventes más limpios.", "Wash the column and use cleaner solvents."] },
      { t: ["noise"], c: ["Burbujas en la celda del detector", "Air bubbles in the flow cell"], k: ["Picos agudos aleatorios.", "Random sharp spikes."], f: ["Desgasifica y pon un restrictor de contrapresión a la salida del detector.", "Degas and fit a back-pressure restrictor after the detector."] },
      { t: ["noise"], c: ["Lámpara agotada", "Lamp near end of life"], k: ["La energía de la lámpara es baja o lleva muchas horas.", "Lamp energy is low or hours are high."], f: ["Cambia la lámpara.", "Replace the lamp."] },
      { t: ["noise"], c: ["Celda sucia", "Dirty flow cell"], k: ["El ruido baja tras lavar.", "Noise drops after flushing."], f: ["Lava con agua, isopropanol y, si el fabricante lo permite, ácido nítrico diluido.", "Flush with water, isopropanol and, if allowed, dilute nitric acid."] },
      { t: ["noise", "drift"], c: ["Mezcla insuficiente del gradiente", "Insufficient gradient mixing"], k: ["Ruido periódico con la frecuencia de la bomba.", "Periodic noise at pump frequency."], f: ["Instala un mezclador de mayor volumen.", "Install a larger-volume mixer."] },
    ] },
  { id: "lc-broad", tech: "lc", s: ["Picos anchos / poca eficiencia", "Broad peaks / low efficiency"],
    q: ["¿Todos los picos o sobre todo los primeros?", "All peaks, or mostly the early ones?"],
    o: [["all", "Todos", "All"], ["early", "Los primeros", "The early ones"]],
    c: [
      { t: ["all"], c: ["Volumen extracolumna excesivo (tubos largos o anchos, celda grande)", "Excessive extra-column volume (long or wide tubing, large cell)"], k: ["Pesa mucho más con columnas de 2,1 mm y UHPLC.", "Matters far more with 2.1 mm and UHPLC columns."], f: ["Acorta y estrecha los tubos (0,075–0,12 mm) y usa una celda adecuada.", "Shorten and narrow the tubing (0.075–0.12 mm) and use a suitable cell."] },
      { t: ["all"], c: ["Velocidad de adquisición del detector demasiado baja", "Detector data rate too low"], k: ["Menos de 15–20 puntos por pico.", "Fewer than 15–20 points per peak."], f: ["Sube la frecuencia de adquisición y baja la constante de tiempo; en MS/MS revisa los tiempos de permanencia (dwell).", "Raise the data rate and lower the time constant; in MS/MS check dwell times."] },
      { t: ["all"], c: ["Columna deteriorada", "Deteriorated column"], k: ["Mide los platos con un test estándar y compáralos con el certificado.", "Measure plates with a test mix and compare with the certificate."], f: ["Sustituye la columna.", "Replace the column."] },
      { t: ["early"], c: ["Disolvente de inyección fuerte o volumen grande", "Strong injection solvent or large volume"], k: ["Mejora al inyectar en fase móvil.", "Improves when injecting in mobile phase."], f: ["Disolvente más débil, menos volumen o diluir con agua.", "Weaker solvent, smaller volume, or dilute with water."] },
      { t: ["all"], c: ["Caudal o temperatura lejos del óptimo", "Flow or temperature far from the optimum"], k: ["Compara con la curva de van Deemter de la columna.", "Compare with the column's van Deemter curve."], f: ["Ajusta el flujo; subir la temperatura reduce la viscosidad y mejora la transferencia de masa.", "Adjust the flow; higher temperature lowers viscosity and improves mass transfer."] },
    ] },
  { id: "lc-sens", tech: "lc", s: ["Picos más pequeños / pérdida de sensibilidad", "Smaller peaks / loss of sensitivity"],
    q: ["¿Les pasa a los patrones o solo a las muestras?", "Does it affect standards, or only samples?"],
    o: [["samples", "Solo a las muestras", "Only samples"], ["all", "También a los patrones", "Standards too"]],
    c: [
      { t: ["samples"], c: ["Efecto matriz (supresión de la ionización en ESI)", "Matrix effect (ESI ion suppression)"], k: ["Compara un extracto fortificado tras la extracción con un patrón en disolvente.", "Compare a post-extraction spiked extract with a solvent standard."], f: ["Diluye, mejora la limpieza, separa el analito de la zona de supresión y usa patrón interno marcado.", "Dilute, improve clean-up, move the analyte away from the suppression zone and use a labelled internal standard."] },
      { t: ["samples"], c: ["Pérdidas en la preparación (adsorción en vidrio o plástico, degradación, evaporación a sequedad)", "Losses during preparation (adsorption to glass or plastic, degradation, evaporation to dryness)"], k: ["Calcula la recuperación con una muestra fortificada antes de extraer.", "Calculate recovery with a sample spiked before extraction."], f: ["Cambia el tipo de vial, no evapores a sequedad y protege de la luz o el calor.", "Change vial type, avoid evaporating to dryness and protect from light or heat."] },
      { t: ["all"], c: ["Patrones degradados", "Degraded standards"], k: ["Prepara un patrón nuevo desde otra solución madre.", "Prepare a fresh standard from another stock."], f: ["Revisa la estabilidad y las condiciones de almacenamiento.", "Review stability and storage conditions."] },
      { t: ["all"], c: ["Problema de inyección (aguja, aire en la jeringa, volumen)", "Injection problem (needle, air in syringe, volume)"], k: ["Las áreas varían mucho entre réplicas.", "Areas vary a lot between replicates."], f: ["Revisa el inyector automático y el nivel en el vial.", "Check the autosampler and the vial fill level."] },
      { t: ["all"], c: ["Detector: lámpara UV, fuente de MS sucia o ajuste (tune) desfasado", "Detector: UV lamp, dirty MS source or out-of-date tune"], k: ["Revisa el informe de ajuste o la energía de la lámpara.", "Check the tune report or lamp energy."], f: ["Limpia la fuente, recalibra o cambia la lámpara.", "Clean the source, recalibrate or replace the lamp."] },
    ] },

  /* ============================ GC ============================ */
  { id: "gc-tail", tech: "gc", s: ["Picos con cola", "Peak tailing"],
    q: ["¿Qué picos tienen cola?", "Which peaks tail?"],
    o: [["all", "Todos, también los hidrocarburos", "All, hydrocarbons too"], ["active", "Solo los polares o activos (ácidos, aminas, alcoholes)", "Only polar or active ones (acids, amines, alcohols)"], ["solvent", "Sobre todo el del disolvente", "Mostly the solvent peak"]],
    c: [
      { t: ["all"], c: ["Columna mal cortada o mal instalada (profundidad incorrecta en inyector o detector)", "Poorly cut or poorly installed column (wrong depth at inlet or detector)"], k: ["Mira el corte con lupa: debe ser recto y limpio.", "Inspect the cut with a magnifier: it must be square and clean."], f: ["Vuelve a cortar con una piedra o cortador de cerámica e instala a la profundidad que indica el fabricante del equipo.", "Recut with a ceramic wafer or cutter and install at the depth specified by the instrument maker."] },
      { t: ["all"], c: ["Volumen muerto en el liner o la férula", "Dead volume at the liner or ferrule"], k: ["Pasa tras el mantenimiento del inyector.", "Started after inlet maintenance."], f: ["Revisa el liner, la férula y la junta del inyector.", "Check the liner, ferrule and inlet seal."] },
      { t: ["active"], c: ["Sitios activos en el liner (sucio, lana de vidrio) o en el inicio de la columna", "Active sites in the liner (dirty, glass wool) or at the front of the column"], k: ["Empeora con el número de inyecciones de muestras sucias.", "Worsens with the number of dirty-sample injections."], f: ["Cambia el liner por uno desactivado, sustituye el sello dorado y corta 10–30 cm del inicio de la columna.", "Replace with a deactivated liner, change the gold seal and trim 10–30 cm from the front of the column."] },
      { t: ["active"], c: ["Analito demasiado polar para la columna o sin derivatizar", "Analyte too polar for the column, or not derivatized"], k: ["La cola existe incluso con columna y liner nuevos.", "Tails even with a new column and liner."], f: ["Derivatiza (ver Derivatización) o usa una fase más polar.", "Derivatize (see Derivatization) or use a more polar phase."] },
      { t: ["active"], c: ["Residuo no volátil de la matriz acumulado", "Accumulated non-volatile matrix residue"], k: ["Mejora tras cambiar el liner.", "Improves after changing the liner."], f: ["Mejora la limpieza del extracto y usa una precolumna (retention gap).", "Improve extract clean-up and use a guard column (retention gap)."] },
      { t: ["solvent"], c: ["Tiempo de purga en splitless mal ajustado o temperatura inicial del horno demasiado alta", "Wrong splitless purge time or initial oven temperature too high"], k: ["El disolvente arrastra una cola larga que tapa los primeros picos.", "The solvent leaves a long tail that hides early peaks."], f: ["Ajusta la purga (0,5–1 min) y empieza el horno 10–20 °C por debajo del punto de ebullición del disolvente.", "Adjust the purge (0.5–1 min) and start the oven 10–20 °C below the solvent boiling point."] },
    ] },
  { id: "gc-front", tech: "gc", s: ["Picos con frente (fronting)", "Peak fronting"],
    q: ["¿Empeora al inyectar más cantidad?", "Does it get worse when you inject more?"],
    o: [["yes", "Sí", "Yes"], ["no", "No", "No"]],
    c: [
      { t: ["yes"], c: ["Sobrecarga de la columna", "Column overload"], k: ["Desaparece al diluir o al aumentar el split.", "Disappears on dilution or with a higher split ratio."], f: ["Diluye, sube el split o usa una columna de más diámetro o más espesor de fase.", "Dilute, increase the split, or use a wider or thicker-film column."] },
      { t: ["no"], c: ["Incompatibilidad de polaridad entre disolvente, analito y fase", "Polarity mismatch between solvent, analyte and phase"], k: ["Ocurre con disolventes polares (metanol) en columnas apolares en splitless.", "Seen with polar solvents (methanol) on non-polar columns in splitless."], f: ["Cambia el disolvente o pon una precolumna desactivada (retention gap).", "Change solvent or add a deactivated retention gap."] },
    ] },
  { id: "gc-split", tech: "gc", s: ["Picos partidos o dobles", "Split or double peaks"],
    q: ["¿Inyectas en splitless?", "Are you injecting splitless?"],
    o: [["yes", "Sí", "Yes"], ["no", "No (split)", "No (split)"]],
    c: [
      { t: ["yes"], c: ["El disolvente no moja la fase estacionaria (efecto disolvente mal aprovechado)", "Solvent does not wet the stationary phase (poor solvent effect)"], k: ["Le pasa a los picos tempranos, cerca del disolvente.", "Affects early peaks near the solvent."], f: ["Usa un disolvente compatible con la fase o una precolumna desactivada.", "Use a phase-compatible solvent or a deactivated retention gap."] },
      { t: ["yes"], c: ["Temperatura inicial demasiado alta para el enfoque por disolvente", "Initial temperature too high for solvent focusing"], k: ["Mejora al bajar la temperatura inicial.", "Improves with a lower initial temperature."], f: ["Empieza al menos 20 °C por debajo del punto de ebullición del disolvente.", "Start at least 20 °C below the solvent boiling point."] },
      { t: ["yes", "no"], c: ["Mezcla de disolventes o inyección manual lenta", "Mixed solvents or slow manual injection"], k: ["Es poco reproducible.", "It is poorly reproducible."], f: ["Usa un solo disolvente e inyección automática rápida.", "Use a single solvent and fast autosampler injection."] },
      { t: ["no", "yes"], c: ["Columna mal cortada o mal instalada", "Badly cut or badly installed column"], k: ["Afecta a todos los picos.", "Affects all peaks."], f: ["Vuelve a cortar e instalar.", "Recut and reinstall."] },
    ] },
  { id: "gc-ghost", tech: "gc", s: ["Picos fantasma o arrastre", "Ghost peaks or carryover"],
    q: ["¿Salen también en una carrera sin inyección?", "Do they appear in a run with no injection?"],
    o: [["yes", "Sí", "Yes"], ["no", "No, solo al inyectar", "No, only when injecting"]],
    c: [
      { t: ["yes"], c: ["Sangrado del septo (siloxanos: m/z 73, 207, 281, 355 como picos discretos)", "Septum bleed (siloxanes: m/z 73, 207, 281, 355 as discrete peaks)"], k: ["Busca esas masas en Iones de fondo.", "Look up those masses in Background ions."], f: ["Usa septos de bajo sangrado, cámbialos con frecuencia y activa la purga del septo.", "Use low-bleed septa, change them often and keep the septum purge on."] },
      { t: ["yes"], c: ["Gas portador o trampas contaminados, o suciedad en la línea de split", "Contaminated carrier gas or traps, or dirt in the split line"], k: ["Aparecen más tras dejar el horno frío mucho tiempo.", "Larger after the oven sat cold for a long time."], f: ["Cambia las trampas y el filtro de la línea de split, y hornea el inyector.", "Replace traps and the split-line filter, and bake the inlet."] },
      { t: ["no"], c: ["Arrastre desde la jeringa", "Carryover from the syringe"], k: ["El pico baja en blancos consecutivos.", "The peak shrinks in consecutive blanks."], f: ["Más lavados, con dos disolventes de distinta polaridad.", "More washes, with two solvents of different polarity."] },
      { t: ["no"], c: ["Retroceso (backflash): el vapor de la muestra no cabe en el liner", "Backflash: the sample vapour does not fit in the liner"], k: ["Calcula el volumen de vapor en Disolventes y tampones.", "Calculate the vapour volume in Solvents and buffers."], f: ["Inyecta menos, usa un liner mayor o splitless pulsado.", "Inject less, use a larger liner or pulsed splitless."] },
      { t: ["no", "yes"], c: ["Compuestos pesados de inyecciones anteriores", "Heavy compounds from previous injections"], k: ["Picos anchos a tiempos variables.", "Broad peaks at variable times."], f: ["Alarga la meseta final, hornea la columna o usa backflush.", "Lengthen the final hold, bake the column or use backflush."] },
    ] },
  { id: "gc-rt", tech: "gc", s: ["Los tiempos de retención se mueven", "Retention times shift"],
    q: ["¿Se mueven todos los picos por igual?", "Do all peaks move together?"],
    o: [["all", "Sí, todos", "Yes, all"], ["some", "No, solo algunos", "No, only some"]],
    c: [
      { t: ["all"], c: ["Cambio del flujo o la presión del gas (fuga, control electrónico)", "Change in carrier flow or pressure (leak, electronic control)"], k: ["Busca fugas con un detector electrónico de fugas; en GC-MS mira m/z 28 y 32.", "Check for leaks with an electronic leak detector; in GC-MS watch m/z 28 and 32."], f: ["Cambia septo y férulas y corrige la fuga.", "Replace the septum and ferrules and fix the leak."] },
      { t: ["all"], c: ["Columna recortada sin actualizar su longitud en el software", "Column trimmed without updating its length in the software"], k: ["Los picos salen antes tras el mantenimiento.", "Peaks elute earlier after maintenance."], f: ["Actualiza la longitud o usa bloqueo de tiempos de retención (RTL).", "Update the length or use retention time locking (RTL)."] },
      { t: ["all"], c: ["Programa de temperatura distinto o calibración del horno", "Different temperature program or oven calibration"], k: ["Compara el método cargado con el validado.", "Compare the loaded method with the validated one."], f: ["Corrige el método o calibra el horno.", "Fix the method or calibrate the oven."] },
      { t: ["some"], c: ["Degradación de la columna o sitios activos que afectan a compuestos concretos", "Column degradation or active sites affecting specific compounds"], k: ["Se mueven y además tienen cola.", "They move and also tail."], f: ["Mantenimiento del inyector y corte de columna.", "Inlet maintenance and column trim."] },
      { t: ["some"], c: ["Sobrecarga de los compuestos mayoritarios", "Overload of major components"], k: ["El máximo del pico se desplaza al aumentar la concentración.", "The apex moves with concentration."], f: ["Diluye o sube el split.", "Dilute or increase the split."] },
    ] },
  { id: "gc-bleed", tech: "gc", s: ["Línea base que sube / sangrado", "Rising baseline / bleed"],
    q: ["¿Cómo sube?", "How does it rise?"],
    o: [["smooth", "Suave con la temperatura", "Smoothly with temperature"], ["humps", "Con jorobas o picos anchos", "With humps or broad peaks"]],
    c: [
      { t: ["smooth"], c: ["Sangrado normal cerca del límite de temperatura de la columna", "Normal bleed near the column temperature limit"], k: ["En MS aparecen m/z 207 y 281.", "In MS you see m/z 207 and 281."], f: ["Trabaja 20–30 °C por debajo del límite y usa columnas de bajo sangrado (ms).", "Stay 20–30 °C below the limit and use low-bleed (ms) columns."] },
      { t: ["smooth"], c: ["Oxígeno en el gas portador que degrada la fase", "Oxygen in the carrier gas degrading the phase"], k: ["El sangrado aumenta de forma rápida en días.", "Bleed increases quickly over days."], f: ["Revisa fugas y cambia la trampa de oxígeno.", "Check for leaks and replace the oxygen trap."] },
      { t: ["smooth"], c: ["Columna nueva sin acondicionar", "New column not conditioned"], k: ["Pasa en las primeras carreras.", "Seen in the first runs."], f: ["Acondiciona según el fabricante.", "Condition as per the manufacturer."] },
      { t: ["humps"], c: ["Contaminación que eluye (matriz, septo, liner)", "Eluting contamination (matrix, septum, liner)"], k: ["Las jorobas cambian de una carrera a otra.", "Humps change from run to run."], f: ["Hornea la columna, corta el inicio y limpia el inyector.", "Bake the column, trim the front and clean the inlet."] },
    ] },
  { id: "gc-resp", tech: "gc", s: ["Pérdida de respuesta", "Loss of response"],
    q: ["¿Afecta a todos los compuestos o a los lábiles y activos?", "Does it affect all compounds, or labile and active ones?"],
    o: [["all", "A todos", "All"], ["labile", "A los lábiles o activos", "Labile or active ones"]],
    c: [
      { t: ["all"], c: ["Fuga en el septo o en el inyector", "Leak at the septum or inlet"], k: ["Comprueba la presión y haz una prueba de fugas.", "Check pressure and run a leak test."], f: ["Cambia el septo y revisa la tuerca del inyector.", "Replace the septum and check the inlet nut."] },
      { t: ["all"], c: ["Jeringa obstruida o doblada", "Blocked or bent syringe"], k: ["Mira si aspira líquido correctamente.", "Check that it draws liquid properly."], f: ["Cambia la jeringa.", "Replace the syringe."] },
      { t: ["all"], c: ["Split o purga mal configurados", "Split or purge set incorrectly"], k: ["Revisa el método frente al validado.", "Compare the method with the validated one."], f: ["Corrige el método.", "Fix the method."] },
      { t: ["all"], c: ["Detector: llama del FID apagada o flujos de gases; fuente de MS sucia", "Detector: FID flame out or gas flows; dirty MS source"], k: ["Revisa el informe de ajuste (tune) del MS.", "Check the MS tune report."], f: ["Ajusta los gases o limpia la fuente.", "Adjust gases or clean the source."] },
      { t: ["labile"], c: ["Liner activo que adsorbe o degrada", "Active liner adsorbing or degrading analytes"], k: ["Comprueba la degradación de endrina y 4,4′-DDT con un patrón de control.", "Check endrin and 4,4′-DDT breakdown with a check standard."], f: ["Liner desactivado nuevo y corte de columna.", "New deactivated liner and column trim."] },
      { t: ["labile"], c: ["Temperatura del inyector demasiado alta", "Inlet temperature too high"], k: ["Mejora al bajar 20–30 °C.", "Improves 20–30 °C lower."], f: ["Baja la temperatura o usa inyección PTV o en columna en frío.", "Lower it, or use PTV or cold on-column injection."] },
    ] },
  { id: "gc-repro", tech: "gc", s: ["Áreas poco repetibles", "Poorly repeatable areas"],
    q: ["¿Qué tipo de inyección usas?", "What injection mode?"],
    o: [["splitless", "Splitless", "Splitless"], ["split", "Split", "Split"]],
    c: [
      { t: ["splitless", "split"], c: ["Inyección manual o burbujas en la jeringa", "Manual injection or air in the syringe"], k: ["Mira la jeringa durante la toma.", "Watch the syringe while it draws."], f: ["Inyector automático y lavados previos con la muestra.", "Autosampler and pre-washes with sample."] },
      { t: ["splitless"], c: ["Retroceso del vapor (backflash)", "Backflash"], k: ["Calcula el volumen de vapor.", "Calculate the vapour volume."], f: ["Menos volumen, liner mayor o splitless pulsado.", "Less volume, larger liner, or pulsed splitless."] },
      { t: ["splitless", "split"], c: ["Septo con fuga", "Leaking septum"], k: ["Empeora a lo largo de la secuencia.", "Worsens over the sequence."], f: ["Cambia el septo cada 100–200 inyecciones.", "Replace the septum every 100–200 injections."] },
      { t: ["split", "splitless"], c: ["Discriminación de los compuestos pesados en la aguja", "Discrimination of heavy compounds in the needle"], k: ["Los compuestos de alto punto de ebullición varían más.", "High boilers vary more."], f: ["Inyección rápida, aguja caliente y liner con lana desactivada.", "Fast injection, hot needle and a liner with deactivated wool."] },
    ] },

  /* ============================ MS ============================ */
  { id: "ms-bg", tech: "ms", s: ["Fondo alto o ruido químico", "High background or chemical noise"],
    q: ["¿En qué equipo?", "On which instrument?"],
    o: [["lc", "LC-MS", "LC-MS"], ["gc", "GC-MS", "GC-MS"]],
    c: [
      { t: ["lc"], c: ["Disolventes, aditivos o plásticos contaminados (ftalatos, PEG, siloxanos)", "Contaminated solvents, additives or plastics (phthalates, PEG, siloxanes)"], k: ["Identifica las masas en Iones de fondo.", "Identify the masses in Background ions."], f: ["Disolventes de grado LC-MS, evita detergentes y plásticos innecesarios.", "LC-MS-grade solvents, avoid detergents and unnecessary plastics."] },
      { t: ["lc"], c: ["Fuente o cono sucios", "Dirty source or cone"], k: ["La señal del patrón baja con el tiempo y el fondo sube.", "Standard signal drops over time while background rises."], f: ["Limpia la fuente y usa la válvula de desvío para el principio y el final del gradiente.", "Clean the source and divert the start and end of the gradient to waste."] },
      { t: ["gc"], c: ["Fuga de aire: m/z 18, 28 y 32 (si 28/32 ≈ 4, es aire)", "Air leak: m/z 18, 28 and 32 (28/32 ≈ 4 means air)"], k: ["Pulveriza argón en las conexiones y vigila m/z 40.", "Spray argon at fittings and watch m/z 40."], f: ["Aprieta o cambia férulas y la tuerca de la interfaz.", "Tighten or replace ferrules and the interface nut."] },
      { t: ["gc"], c: ["Sangrado de columna (m/z 207, 281) o de septo (73, 207, 281, 355 como picos)", "Column bleed (m/z 207, 281) or septum bleed (73, 207, 281, 355 as peaks)"], k: ["Si es continuo y sube con la temperatura, es la columna.", "If continuous and rising with temperature, it's the column."], f: ["Ver «Línea base que sube» en GC.", "See “Rising baseline” under GC."] },
    ] },
  { id: "ms-sens", tech: "ms", s: ["Poca señal o señal inestable (ESI)", "Low or unstable signal (ESI)"],
    q: ["¿La señal es inestable (el spray fluctúa)?", "Is the signal unstable (spray fluctuating)?"],
    o: [["yes", "Sí", "Yes"], ["no", "No, es estable pero baja", "No, it's stable but low"]],
    c: [
      { t: ["yes"], c: ["Spray inestable: capilar parcialmente obstruido o mal posicionado, poco gas, mucha agua con flujos bajos", "Unstable spray: partly blocked or badly positioned capillary, low gas, high water at low flow"], k: ["Infunde un patrón y mira la estabilidad de la señal.", "Infuse a standard and watch signal stability."], f: ["Limpia o cambia el capilar, ajusta posición y gases, o añade algo de orgánico post-columna.", "Clean or replace the capillary, adjust position and gases, or add some post-column organic."] },
      { t: ["no"], c: ["Supresión iónica por tampones no volátiles, TFA o matriz", "Ion suppression from non-volatile buffers, TFA or matrix"], k: ["Mejora al cambiar a fórmico o formiato amónico.", "Improves after switching to formic acid or ammonium formate."], f: ["Evita fosfatos y TFA, diluye la muestra y desvía las sales del principio a desecho.", "Avoid phosphate and TFA, dilute the sample and divert early salts to waste."] },
      { t: ["no"], c: ["Parámetros de fuente no ajustados al flujo real", "Source parameters not matched to the actual flow"], k: ["Se ajustó con infusión a flujo bajo y se trabaja a 0,4 mL/min o más.", "Tuned by infusion at low flow, run at 0.4 mL/min or more."], f: ["Optimiza temperatura y gases con el flujo del método (infusión en T).", "Optimise temperature and gases at method flow (tee infusion)."] },
      { t: ["no"], c: ["El analito forma otro aducto ([M+Na]⁺ en vez de [M+H]⁺)", "The analyte forms another adduct ([M+Na]⁺ instead of [M+H]⁺)"], k: ["Busca los aductos en Masas y espectros.", "Look up the adducts in Masses and spectra."], f: ["Añade formiato o acetato amónico, o cuantifica con el aducto dominante.", "Add ammonium formate or acetate, or quantify on the dominant adduct."] },
      { t: ["no", "yes"], c: ["Óptica sucia o calibración de masas desfasada", "Dirty ion optics or out-of-date mass calibration"], k: ["Revisa el último informe de calibración.", "Check the last calibration report."], f: ["Limpia y recalibra.", "Clean and recalibrate."] },
    ] },
  { id: "ms-mass", tech: "ms", s: ["Masa exacta desviada (HRMS)", "Mass accuracy drift (HRMS)"],
    q: ["¿La desviación es igual en todo el rango o depende de la intensidad?", "Is the error constant across the range, or intensity-dependent?"],
    o: [["const", "Igual en todo el rango", "Constant"], ["int", "Depende de la intensidad", "Depends on intensity"]],
    c: [
      { t: ["const"], c: ["Calibración antigua o cambio de temperatura del laboratorio", "Old calibration or lab temperature change"], k: ["El error es sistemático en todos los iones.", "The error is systematic for every ion."], f: ["Recalibra y usa masa de referencia (lock mass) durante el análisis.", "Recalibrate and use a lock mass during the run."] },
      { t: ["int"], c: ["Demasiados iones en la trampa (carga espacial) o detector saturado", "Too many ions in the trap (space charge) or detector saturation"], k: ["Los picos intensos se desvían más.", "Intense peaks deviate more."], f: ["Baja el objetivo de llenado (AGC), el tiempo de inyección o diluye.", "Lower the AGC target or injection time, or dilute."] },
      { t: ["int"], c: ["Interferencia isobárica sin resolver", "Unresolved isobaric interference"], k: ["Solo pasa en muestras, no en patrones.", "Only in samples, not standards."], f: ["Sube la resolución o mejora la separación cromatográfica.", "Increase resolution or improve the chromatographic separation."] },
    ] },
];

const TR = { tech: store.get("trTech", "lc"), id: null, ans: {} };

function renderTrouble() {
  const box = $("trBody");
  if (!box) return;
  const list = TS.filter((x) => x.tech === TR.tech);
  if (!TR.id || !list.some((x) => x.id === TR.id)) TR.id = list[0].id;
  document.querySelectorAll("#trTech button").forEach((b) => b.classList.toggle("on", b.dataset.t === TR.tech));
  const P = TS.find((x) => x.id === TR.id);
  const ans = TR.ans[P.id];
  const scored = P.c.map((c, i) => ({ ...c, i, hit: ans ? c.t.includes(ans) : true }));
  const shown = ans ? scored.filter((c) => c.hit).concat(scored.filter((c) => !c.hit)) : scored;
  box.innerHTML = `
    <div class="tr-layout">
      <div class="tr-list">${list.map((x) => `<button type="button" class="tr-item${x.id === TR.id ? " on" : ""}" data-id="${x.id}">${esc(L(x.s[0], x.s[1]))}</button>`).join("")}</div>
      <div class="tr-main card">
        <h2 class="card-title">${esc(L(P.s[0], P.s[1]))}</h2>
        <p class="tr-q">${esc(L(P.q[0], P.q[1]))}</p>
        <div class="seg tr-ans">${P.o.map(([k, es, en]) => `<button type="button" data-a="${k}" class="${ans === k ? "on" : ""}">${esc(L(es, en))}</button>`).join("")}</div>
        <ol class="tr-causes">${shown.map((c) => `<li class="${ans && !c.hit ? "dim" : ""}">
          <div class="tr-c">${ans && c.hit ? `<span class="pill good">${L("Probable", "Likely")}</span> ` : ""}${esc(L(c.c[0], c.c[1]))}</div>
          <div class="tr-k"><b>${L("Cómo comprobarlo", "How to check")}:</b> ${esc(L(c.k[0], c.k[1]))}</div>
          <div class="tr-f"><b>${L("Solución", "Fix")}:</b> ${esc(L(c.f[0], c.f[1]))}</div></li>`).join("")}</ol>
        ${ans ? `<p class="hint small">${L("Las causas atenuadas son menos probables con tu respuesta, pero no descartables.", "Dimmed causes are less likely given your answer, but not ruled out.")}</p>` : `<p class="hint small">${L("Responde a la pregunta para ordenar las causas.", "Answer the question to rank the causes.")}</p>`}
      </div>
    </div>`;
  box.querySelectorAll(".tr-item").forEach((b) => b.addEventListener("click", () => { TR.id = b.dataset.id; renderTrouble(); }));
  box.querySelectorAll(".tr-ans button").forEach((b) => b.addEventListener("click", () => { TR.ans[P.id] = TR.ans[P.id] === b.dataset.a ? undefined : b.dataset.a; renderTrouble(); }));
}

function initTrouble() {
  if (!$("problemas")) return;
  $("trTech").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-t]"); if (!b) return;
    TR.tech = b.dataset.t; store.set("trTech", TR.tech); TR.id = null; renderTrouble();
  });
  renderTrouble();
}

VIEWS.splice(VIEWS.indexOf("fondo") + 1, 0, "problemas");
const _renderAll6 = renderAll;
renderAll = function () { _renderAll6(); renderTrouble(); };
initTrouble();
applyStatic();
route();
