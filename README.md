# PeakLab

Herramientas de química analítica para GC-MS y LC-MS que funcionan en el navegador, sin servidor y sin enviar datos. En español e inglés.

**Web:** https://xlopvaz.github.io/peaklab/

## Qué incluye

- **Calibrado y validación:** recta con o sin ponderación (1/x, 1/x²), R², IC de pendiente y ordenada, LOD/LOQ, residuales, concentración de muestras con preconcentración y su IC al 95 %, efecto matriz, recuperación y relación de iones (SANTE/11312/2021).
- **Masas y espectros:** masa monoisotópica y media, DBE, aductos de ESI(+), ESI(−) y EI, error en ppm y espectro isotópico simulado a la resolución del equipo (cuadrupolo, Q-TOF, Orbitrap, FT-ICR), con estructura fina.
- **Dibujar moléculas:** editor estilo ChemDraw ([Kekule.js](https://partridgejiang.github.io/Kekule.js/), MIT) con búsqueda en PubChem por nombre, CAS o SMILES; la fórmula pasa directamente a la calculadora de masas.
- **Iones de fondo:** buscador por m/z de contaminantes habituales (ftalatos, siloxanos, sangrado de columna, PEG, aditivos de plásticos, PFTBA…).

## Estructura

- `index.html`: estructura de la página
- `style.css`: estilos (tema claro y oscuro)
- `script.js`: todos los cálculos, sin dependencias

Hecho por Xoel López Vázquez.
