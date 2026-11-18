# Integración de assets finales — plan y contrato

**Estado:** en ejecución (2026-11-18). Rama `feat/remaster-integration` con el merge de
`origin/feat/remaster-assets-p1` (`ea4b54f`).
**Fuente de verdad:** [`assets/manifest.json`](../assets/manifest.json), [`CREDITS.md`](../CREDITS.md),
[`docs/ASSET-MANIFEST.md`](ASSET-MANIFEST.md) y [`docs/ASSET-P1-PLAN.md`](ASSET-P1-PLAN.md).
**Alcance:** capa visual (`src/ui/**`, `src/ui/levels/**`, `styles.css` si hace falta). No se toca
`src/core`, `src/game`, el flujo funcional de `src/main.js`, ni `tests` existentes fuera de la
superficie de cada unidad.

## Reglas

1. **Rutas.** En CSS dentro de `src/ui/levels/` la raíz del proyecto es `../../../`;
   en CSS dentro de `src/ui/` es `../../`. En JS los `src` de `<img>` son relativos al documento:
   `assets/...`.
2. **Trazabilidad.** Cada nodo que reemplaza un placeholder conserva `data-asset` con su slot del
   manifiesto y pasa a `data-status="final"` con `data-src` con la ruta usada. Los slots sin asset
   (ver §4) siguen `data-status="a producir"`.
3. **Fallback.** La imagen se suma al fondo CSS existente (`background-image: linear-gradient(...), url(...)`),
   nunca lo reemplaza en seco: si el archivo falta, el nivel se sigue viendo.
4. **Legibilidad.** Los fondos son 2048×1152; se usan con `background-size: cover` y una capa de
   oscurecimiento para que el tablero y el texto mantengan contraste AA.
5. **Sin lógica.** No se agregan listeners, estado ni llamadas a los motores. Los editores reales
   (`#canvas`, `#drum`, `#tape-panel`, `#stack-panel`) se visten por CSS, no se recrean.
6. **Costo.** Cada fondo pesa 130–220 KB; no se duplican archivos ni se convierten de nuevo.

## 1. Mapa por unidad

| Unidad | Archivos | Assets |
|---|---|---|
| **N1 + compartido** | `src/ui/levels/level1Scene.js`, `level1.css`, `src/ui/graphVisuals.js`, `src/ui/spoolPalette.css`, `src/ui/gameChrome.css`, sus tests | `assets/levels/01/background.webp`, `thief.webp`, `props/{contract,hint,log,bell,entry,lock,gear,spool,key-1..4}.webp`, `assets/shared/ui/*.svg` |
| **N2** | `src/ui/levels/level2Scene.js`, `level2.css`, test | `assets/levels/02/background.webp`, `pinion.webp`, `floor-indicator.svg`, `assets/shared/props/relay.webp` |
| **N3** | `src/ui/levels/level3Scene.js`, `level3.css`, test | `assets/levels/03/day.webp`, `night.webp`, `assets/shared/props/fork.svg`, `spring.svg` |
| **N4** | `src/ui/levels/level4Scene.js`, `level4.css`, test | `assets/levels/04/background.webp`, `selectors.svg`, `lever-up.svg`, `lever-down.svg`, `stack-base.webp`, `chip.webp` |
| **N5** | `src/ui/levels/level5Scene.js`, `level5.css`, test | `assets/levels/05/background.webp`, `drum.webp`, `head.webp`, `tape.svg`, `pin.svg` |

## 2. Slots que se integran

- **N1:** fondo, ladrón, contrato, pista, bitácora, campana; nodos entrada/cerradura/engranaje del
  tablero; carrete del inventario; llaves 1–4 de `gameChrome.css`.
- **N2:** fondo del lobby, indicador de piso, piñón, relé.
- **N3:** alas de día y de noche, bifurcador y resorte.
- **N4:** fondo del teatro, selectores de pila, palancas arriba/abajo, base y ficha de la pila.
- **N5:** fondo de la bóveda, cinta, cabezal, tambor y púa como cromo del editor.

## 3. Slots sin asset (siguen en placeholder)

| Slot | Falta | Qué usa mientras |
|---|---|---|
| `shared.paper.contract/hint/log` | texturas de papel P1 | el papel CSS actual de `paperModal.css` |
| `levels.03.lamp` | lámpara del museo | la lámpara CSS de `level3.css` |
| `levels.05.depositSlip` | boleta P1 | la boleta CSS de `level5.css` |
| `sfx.success/spring/chip/tape/pin/steps` | SFX P1 | el sintetizador de `src/ui/audio.js` |
| `music.n1..n5` | música P2 | silencio |
| `levels.01.bench/plate` | mesa y placa del N1 | `mockups/nivel-1-taller/assets/sprites/mesa-madera.svg`, `placa-textura.jpg`, `placa-marco.svg` |

Los tres últimos del N1 no tienen slot en el manifiesto: Mateo no reexportó mesa ni placa, y el
fondo nuevo ya trae escritorio. Se mantienen los del mockup hasta que exista reemplazo.

## 4. Audio

`src/ui/audio.js` ya resuelve los SFX por manifiesto (`sfxUrl(manifest, id)`), así que los ocho
archivos P0 se usan sin cambios de código. No se toca `audio.js` en esta integración salvo que falte
un id.

## 5. Verificación

- `node --test` completo verde.
- Cada test nuevo comprueba que la ruta existe en disco (`fs.existsSync`), no solo el string.
- Capturas a 1440×900 y 390×844: sin scroll de página en escritorio, sin scroll horizontal en móvil,
  tablero legible y `data-status` correcto en cada slot.

## 6. Bitácora

| Fecha | Unidad | Estado |
|---|---|---|
| 2026-11-18 | contrato y mapa | listo |
| 2026-11-18 | N1 + compartido | listo: fondo, ladrón, papeles, campana; nodos entrada/cerradura/engranaje; carrete y llaves 1–4 |
| 2026-11-18 | N2 | listo: fondo sin máscara (velo 0.35), indicador 150 px, piñón 72 px, relés |
| 2026-11-18 | N3 | listo: alas día/noche con foto visible; bifurcador y resorte; lámpara pendiente |
| 2026-11-18 | N4 | listo: fondo, selectores, palancas; pila real vestida por CSS; muestras pendientes |
| 2026-11-18 | N5 | listo: fondo, cinta, púa, cromo de tambor/cabezal; boleta pendiente |
| 2026-11-18 | verificación en navegador | 1440×900 sin scroll en los cinco, 390 sin scroll horizontal, 0 imágenes rotas, 0 respuestas HTTP ≥ 400 |

**Evidencia de la verificación:** `node --test` → 427 pruebas, 427 en verde. En navegador (Edge headless por CDP) los cinco niveles dan `scrollHeight 900` a 1440×900; los slots con asset real declaran `data-status="final"` y `data-src`; N3 conserva la lámpara y N5 la boleta como `a producir`.
