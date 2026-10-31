# PeakLab

Analytical chemistry tools for GC-MS and LC-MS that run entirely in the browser: no server, no data sent anywhere. Available in English and Spanish.

**Website:** https://xlopvaz.github.io/peaklab/

## Features

- **Calibration and validation:** weighted or unweighted regression (1/x, 1/x²), R², confidence intervals for slope and intercept, LOD/LOQ, residual plot, sample concentrations with preconcentration factor and 95 % CI, matrix effect, recovery and ion ratio check (SANTE/11312/2021).
- **Masses and spectra:** monoisotopic and average mass, double bond equivalents, ESI(+), ESI(−) and EI adducts, ppm error, and isotope spectra simulated at the instrument's resolution (quadrupole, Q-TOF, Orbitrap, FT-ICR), including fine structure.
- **Molecule drawing:** ChemDraw-style editor ([Kekule.js](https://partridgejiang.github.io/Kekule.js/), MIT) with PubChem lookup in both directions: name, CAS or SMILES to structure, and drawn structure to name. The formula goes straight to the mass calculator.
- **GC or LC?:** rule-based advisor from the drawn structure (descriptors from [OpenChemLib](https://github.com/cheminfo/openchemlib-js), BSD-3): recommended technique, column, GC detector, LC ionization mode, derivatization reagents, thermolabile groups and organometallic speciation.
- **Chromatogram simulator:** HPLC (gradient elution with the linear solvent strength model, van Deemter efficiency, column pressure) and GC (temperature programs from retention indices, Golay efficiency, head pressure), with critical-pair resolution and method tips.
- **Method transfer:** HPLC → UHPLC (or any column) with scaled gradient, flow and injection volume, dwell volume compensation, pressure estimate, USP <621> L/dp check and a simulated before/after comparison; GC flow calculator (head pressure, average velocity, hold-up time, constant flow vs constant pressure, atmospheric or vacuum outlet).
- **Green metrics:** AGREEprep (Wojnowski et al., TrAC 2022) and BAGI (Manousi et al., Green Chem. 2023) calculators with editable weights, examples and downloadable pictograms (PNG/SVG).
- **Background ions:** m/z search for common contaminants (phthalates, siloxanes, column bleed, PEG, plastic additives, PFTBA…).

## Files

- `index.html`: page structure
- `style.css`: styles (light and dark theme)
- `script.js`: calibration, masses, molecule editor and background ions
- `chroma.js`: chromatogram simulator
- `transfer.js`: method transfer and GC flows
- `advisor.js`: GC or LC advisor
- `green.js`: AGREEprep and BAGI

Made by Xoel López Vázquez.
