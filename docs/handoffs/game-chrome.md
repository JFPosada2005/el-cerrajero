# Handoff — Unidad B: llavero y botones (`gameChrome.css`)

> Rama `feat/remaster-integration` · Contrato: `docs/REMASTER-VISUALS-CONTRACT.md` (unidad B).
> Estado: **listo para integrar** · No commitea (el parent decide).

## Estado

Acabado visual del llavero y los botones del taller, CSS-only, sin tocar lógica,
datos, jueces, `main.js` ni ningún archivo congelado. Solo 3 archivos nuevos:

- `src/ui/gameChrome.css` — el acabado (alcance estricto `.wb-scene`).
- `tests/gameChrome.test.js` — 10 tests estáticos (`node --test`, en verde).
- `docs/handoffs/game-chrome.md` — este documento.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/ui/gameChrome.css` | Nuevo. Llavero, herramientas y placas de acción. |
| `tests/gameChrome.test.js` | Nuevo. Tests estáticos del CSS. |
| `docs/handoffs/game-chrome.md` | Nuevo. Este handoff. |

Nada más se tocó: `styles.css`, `src/ui/workbenchScene.css`, `main.js`,
`index.html`, tests existentes, `mockups/` y git quedan intactos.

## API / integración

Sin JS ni API: es una hoja de estilo que se suma a la escena del taller.

```html
<link rel="stylesheet" href="src/ui/gameChrome.css">
```

Cargarla **después** de `src/ui/workbenchScene.css` (sobreescribe sus `.wb-btn`
base con las placas del mockup). Reutiliza sus variables `--wb-*` con valores de
respaldo, por si el orden de carga cambia alguna vez.

Mapeo con el DOM real que monta `main.js` + `workbenchScene.js`:

| Elemento real | Regla | Acabado |
|---|---|---|
| `#palette .key.key-N` / `[data-key="N"]` | una regla por llave 1–4 | `llave-N.png` del mockup + banda inferior (1 latón, 2 teal, 3 coral, 4 violeta, según `VISUAL-DESIGN` §3); número visible como texto del botón, `aria-label` intacto |
| `#palette::before` | riel de latón | barra dorada de la que "cuelgan" las llaves (leve giro alternado como el mockup) |
| `.tools > #scissors` / `#spring-tool` | medallones | píldora bronce con el SVG inline existente + etiqueta ("Cortar"/"Resorte"); activa coral (tijera) / teal (resorte) |
| `.wb-actions .wb-btn[data-action="probe"]` y resto | placas de bronce | bisel, remaches laterales, hover/pressed/focus/disabled como el mockup |
| `.wb-actions .wb-btn-primary` / `[data-action="assault"]` | placa dorada | única primaria por pantalla (Ensayo/Asalto) |
| `.stack-tools .tool` | — | **no se toca** a propósito: son fichas de texto ("Da igual", "Cargar"…), no medallones |

Estados cubiertos: default, hover, active (pressed), focus-visible (teal, 2 px,
offset 3 px), disabled (`:disabled` y `[aria-disabled="true"]`), `.is-active`.
Targets ≥ 44 px en llaves, herramientas y botones. `prefers-reduced-motion`
anula transiciones y transformaciones.

## Decisiones

- El número de la llave se conserva como texto del botón (legible sobre el
  sprite con sombra) en vez de ocultarlo: el color nunca es la única señal y el
  `aria-label` ("Llave N") no se pierde.
- Las herramientas mantienen su SVG inline + texto visible; solo se les da
  marco de medallón coherente con el llavero (el mockup las muestra como iconos
  con tooltip, pero el juego real usa etiqueta textual y no se quita).
- `text-transform: uppercase` + `letter-spacing` en las placas es solo
  presentación CSS: los textos reales ("Probar", "Ensayo"…​) no cambian.
- Rutas de imagen relativas al CSS:
  `../../mockups/nivel-1-taller/assets/sprites/llave-N.png` (solo PNG; los SVG
  homónimos del mockup no se usan porque el acabado pide las imágenes raster).

## Tests

`node --test tests/gameChrome.test.js` → 10/10 en verde. Verifican sin navegador:

- alcance: todo selector empieza con `.wb-scene`; sin `body`/`html`/`:root`/`*`;
- cada `url()` apunta a `mockups/nivel-1-taller/assets/` y el archivo existe;
- `llave-1…4.png` referenciadas con regla por llave (`[data-key]` y `.key-N`);
- targets ≥ 44 px en llaves, herramientas y botones;
- placas con remaches `::before`/`::after` y estados hover/active/focus/disabled;
- `prefers-reduced-motion` con `transition: none` y `transform: none`;
- el texto de la llave no se oculta (sin `text-indent` negativo, `font-size: 0`
  ni `color: transparent`).

## Supuestos

- El parent monta llaves como `button.key.key-{símbolo}` con `data-key` y texto
  del símbolo (verificado en `main.js` → `renderPalette`); por eso cada llave
  tiene doble selector (`[data-key="N"]` y `.key-N`).
- Niveles con más de 4 llaves heredan la base sin sprite (banda transparente);
  hoy todos los niveles usan 1–4.
- `gameChrome.css` carga después de `workbenchScene.css`.

## Riesgos

- Los PNG `llave-N.png` son verticales (~164 KB cada uno); si el parent quiere
  presupuesto < 20 KB de CSS+activos, habría que reexportarlos o usar los SVG.
  No se hizo: el contrato pide las imágenes del mockup.
- El giro colgante usa `nth-child(4n+…)`; si un nivel muestra menos de 4 llaves,
  el patrón de giro cambia pero sigue siendo válido.
- Sin verificación visual en navegador en esta unidad: el parent la hace en
  N1–N4 a 1440/390 (paso 3 de la integración del contrato).

## Integración (pasos del parent)

1. Agregar el `<link>` a `gameChrome.css` después de `workbenchScene.css`.
2. Verificar N1–N4 en 1440/390 y correr `node --test`.
3. No cambia reglas, datos, jueces ni callbacks: si algo visual tapa un control,
   se ajusta aquí, nunca en `main.js`.
