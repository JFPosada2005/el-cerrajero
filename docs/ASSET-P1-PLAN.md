# Plan de assets P1 — remaster

**Estado:** P1-1 vectorial, P1-2 fondos y papel ejecutados en `feat/remaster-assets-p1`. Quedan los SFX P1 y los retratos del ladrón.
**Rama:** `feat/remaster-assets-p1`, creada desde `feat/remaster-assets` (P0). Cuando el PR de P0 se mergee, rebasar sobre `feat/remaster-integration`.
**Alcance:** `assets/`, `docs/` y `CREDITS.md`. No se toca `src/`, `src/game`, `tests/`, `index.html` ni `styles.css`.
**Contrato:** [`docs/ASSET-MANIFEST.md`](ASSET-MANIFEST.md) y [`assets/manifest.json`](../assets/manifest.json).

## 1. Contexto

El P0 quedó completo: N1, fuentes, iconos, props de N2–N5 y los ocho SFX. El P1 son mejoras claras que no bloquean la jugabilidad: fondos propios de N2–N5, indicador de pisos, selectores de pila, palancas, papel compartido, boleta de depósito, SFX adicionales, retratos del ladrón y capturas nuevas.

La regla de recursos limitados sigue vigente: si un P1 no llega, el nivel usa el placeholder y no se bloquea.

## 2. Decisión de estilo

| Familia | Quién la hace | Lenguaje |
|---|---|---|
| UI vectorial (velocidad, indicador de piso, selectores, palancas) | Agente | SVG, trazo 1,5 px, paleta de `VISUAL-DESIGN.md` |
| Props fotorrealistas (fondos, papel, boleta) | Owner con Leonardo | Mismo lenguaje material que los props P0: vista frontal/ortográfica, latón/acero/papel, sin texto, sin perspectiva |
| SFX adicionales | Owner descarga; agente procesa | OGG mono 44,1 kHz, one-shots, CC0 o uso comercial |

No se mezclan: los iconos de UI no se generan con IA y los props no se dibujan a mano.

## 3. P1-1 — UI vectorial (hecho)

| Asset | Ruta | Tamaño | Estado |
|---|---|---:|---|
| `ui.speed` | `assets/shared/ui/speed.svg` | 24×24 | Hecho; Lucide adaptado, ISC |
| `n2.floorIndicator` | `assets/levels/02/floor-indicator.svg` | 160×64 | Hecho; propuesta hasta confirmar el layout de N2 |
| `n4.selectors` | `assets/levels/04/selectors.svg` | 240×64 | Hecho; propuesta hasta confirmar el layout de N4 |
| `n4.leverUp` | `assets/levels/04/lever-up.svg` | 64×64 | Hecho |
| `n4.leverDown` | `assets/levels/04/lever-down.svg` | 64×64 | Hecho |

Los tres últimos son propuestas visuales: Felipe debe confirmar que encajan con el tablero de N2/N4 antes de darlos por definitivos.

## 4. P1-2 — Fondos, papel y boleta (owner)

| Asset | Ruta final | Formato | Acción |
|---|---|---|---|
| `n2.background` | `assets/levels/02/background.webp` | 2048×1152 | Generar con Leonardo; lobby de hotel, ascensor, noche |
| `n3.backgroundDay` | `assets/levels/03/day.webp` | 2048×1152 | Museo de día |
| `n3.backgroundNight` | `assets/levels/03/night.webp` | 2048×1152 | Museo de noche |
| `n4.background` | `assets/levels/04/background.webp` | 2048×1152 | Teatro municipal, granate y latón |
| `n5.background` | `assets/levels/05/background.webp` | 2048×1152 | Banco central, bóveda |
| `paper.contract` | `assets/shared/paper/contract.webp` | 2× del tamaño mostrado | Textura de papel ivory con borde gastado |
| `paper.hint` | `assets/shared/paper/hint.webp` | 2× | Papel de nota, más oscuro |
| `paper.log` | `assets/shared/paper/log.webp` | 2× | Papel de bitácora, líneas tenues |
| `n5.depositSlip` | `assets/levels/05/deposit-slip.webp` | 2× | Boleta de depósito, papel y sello |

Reglas para los fondos: 16:9, 2048×1152, sin personajes, sin texto, sin UI, luz cálida desde arriba a la izquierda, sombras profundas, materiales nobles, espacio negativo para el tablero. Los originales van a `assets/incoming/` y el agente los recorta, convierte y acredita.

## 5. P1-3 — SFX adicionales (owner)

| Slot | Archivo | Buscar |
|---|---|---|
| `sfx.success` | `success.ogg` | `success chime`, `positive bell`, `achievement` |
| `sfx.spring` | `spring.ogg` | `spring boing`, `coil spring`, `metal spring` |
| `sfx.chip` | `chip.ogg` | `poker chip`, `token clink`, `ceramic chip` |
| `sfx.tape` | `tape.ogg` | `tape whir`, `cassette mechanism`, `reel motor` |
| `sfx.pin` | `pin.ogg` | `pin drop`, `small metal pin`, `tack` |
| `sfx.steps` | `steps.ogg` | `footsteps stone`, ` footsteps wood`, `thief steps` |

Freesound (CC0) o Pixabay (Pixabay License). El agente recorta, normaliza, convierte a OGG y registra la licencia.

## 6. Validación

- `assets/manifest.json` parsea y todos los `available` existen.
- `npm test`: 253/253.
- Sin cambios en `src/`, `src/game`, `tests/`, `index.html` ni `styles.css`.
- Presupuesto: imágenes ≤1,5 MB por nivel; fuentes ≤150 KB; audio ≤400 KB por nivel.
- `CREDITS.md` actualizado en el mismo lote.

## 7. Pendiente

- Owner: generar los cinco fondos, las tres texturas de papel y la boleta; descargar los seis SFX P1.
- Felipe: confirmar el layout de N2/N4 para el indicador de piso, los selectores y las palancas.
- Agente: procesar lo que entregue el owner, actualizar manifest/CREDITS y abrir el PR de P1 cuando el P0 esté mergeado.

## 8. Estado

### Checkpoint 2026-11-18 — P1-1

- Rama `feat/remaster-assets-p1` creada desde `feat/remaster-assets`.
- `ui.speed.svg`, `floor-indicator.svg`, `selectors.svg`, `lever-up.svg` y `lever-down.svg` creados.
- Manifest y `CREDITS.md` actualizados para los cinco.
- `npm test`: 253/253.
- Sin push todavía.
- P1-2 y P1-3 pendientes de los assets del owner.

### Checkpoint 2026-11-18 — P1-2 fondos

- Cinco fondos generados con Gemini y exportados a WebP 2048×1152.
- N2: 166.672 B · N3 día: 220.784 B · N3 noche: 132.032 B · N4: 199.118 B · N5: 206.682 B.
- Total de fondos: **925.288 B**.
- `assets/manifest.json`: 49 rutas `available`.
- `CREDITS.md` actualizado.
- Pendiente: texturas de papel, boleta de depósito y SFX P1.

### Checkpoint 2026-11-18 — P1-2 papel

- Papel base y boleta generados con Gemini.
- `contract.webp` 512×704 (37.016 B), `hint.webp` 384×328 (6.174 B), `log.webp` 384×300 (7.104 B), `deposit-slip.webp` 1024×676 (31.208 B).
- `assets/manifest.json`: 53 rutas `available`.
- `CREDITS.md` actualizado.
- Pendiente: 6 SFX P1 y retratos del ladrón.
