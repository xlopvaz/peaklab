# PeakLab

Free tools for GC and LC laboratories that run entirely in the browser. Available in English and Spanish.

**Website:** https://xlopvaz.github.io/peaklab/

## Features

### Compound
- **Compound data:** PubChem lookup by name, CAS, SMILES or InChIKey: identity, experimental properties with their source (boiling point, vapour pressure, solubility, log Kow, pKa, Henry's law constant, stability), logD versus pH at common mobile-phase pH values, Kovats retention indices (NIST), collision cross sections, GHS hazards, links to NIST WebBook and EPA CompTox, and the GC/LC advisor.

### Tools

- **Calibration and validation:** weighted or unweighted regression (1/x, 1/x²), R², confidence intervals for slope and intercept, LOD/LOQ, residual plot, sample concentrations with preconcentration factor and 95 % CI, matrix effect, recovery and ion ratio check (SANTE/11312/2021).
- **Masses and spectra:** monoisotopic and average mass, double bond equivalents, ESI(+), ESI(−) and EI adducts, ppm error, and isotope spectra simulated at the instrument's resolution (quadrupole, Q-TOF, Orbitrap, FT-ICR), including fine structure.
- **Molecule drawing:** ChemDraw-style editor ([Kekule.js](https://partridgejiang.github.io/Kekule.js/), MIT) with PubChem lookup in both directions: name, CAS or SMILES to structure, and drawn structure to name. The formula goes straight to the mass calculator.
- **GC or LC?:** rule-based advisor from the drawn structure (descriptors from [OpenChemLib](https://github.com/cheminfo/openchemlib-js), BSD-3): recommended technique, column, GC detector, LC ionization mode, derivatization reagents, thermolabile groups and organometallic speciation.
- **Chromatogram simulator:** HPLC (gradient elution with the linear solvent strength model, van Deemter efficiency, column pressure) and GC (temperature programs from retention indices, Golay efficiency, head pressure), with critical-pair resolution and method tips.
- **Method transfer:** HPLC → UHPLC (or any column) with scaled gradient, flow and injection volume, dwell volume compensation, pressure estimate, USP <621> L/dp check and a simulated before/after comparison; GC flow calculator (head pressure, average velocity, hold-up time, constant flow vs constant pressure, atmospheric or vacuum outlet).
- **Green metrics:** AGREEprep (Wojnowski et al., TrAC 2022) and BAGI (Manousi et al., Green Chem. 2023) calculators with editable weights, examples and downloadable pictograms (PNG/SVG).
- **Injection sequence:** blanks, system suitability, calibration (optionally bracketing), CCV and QC blocks every N samples, vial positions (numbered, 96-well or 54-vial racks), run time and CSV export.
- **Troubleshooting:** LC, GC and MS symptoms with a discriminating question that ranks the likely causes, how to check them and how to fix them.
- **Background ions:** m/z search for common contaminants (phthalates, siloxanes, column bleed, PEG, plastic additives, PFTBA…).

## Reference

- **Derivatization:** silylation, methylation, acylation, PFBBr, MOX, NaBEt₄, FMOC-Cl, dansyl chloride and DNPH, with conditions, diagnostic ions and a derivative mass calculator.
- **Columns:** equivalent GC phases across manufacturers with USP G codes; USP L codes for LC with example columns.
- **Solvents and buffers:** solvent properties, GC inlet vapour volume versus liner volume, LC additives and a buffer calculator.

## Files

- `index.html`: page structure
- `style.css`: styles (light and dark theme)
- `script.js`: calibration, masses, molecule editor and background ions
- `chroma.js`: chromatogram simulator
- `transfer.js`: method transfer and GC flows
- `advisor.js`: GC or LC advisor
- `green.js`: AGREEprep and BAGI
- `compound.js`: compound data page (PubChem)
- `troubleshoot.js`: troubleshooting guide
- `reference.js`: derivatization, columns, solvents and buffers
- `sequence.js`: injection sequence builder

Made by Xoel López Vázquez.
