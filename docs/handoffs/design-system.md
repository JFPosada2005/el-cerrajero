# Handoff — design-system (capa visual del workbench)

- **Estado:** completed.
- **Rama:** `feat/remaster-integration` (HEAD `53339d3` al iniciar; sin commits desde este turno).
- **Alcance:** solo `styles.css` (sección aditiva final) + este handoff. Sin tocar `src/`, `index.html`, `tests/`, `mockups/` ni otros documentos.

## Archivos tocados

- `styles.css`: bloque aditivo `REMATER · workbench` (líneas ~1299–1725). No se editó ninguna regla existente.
- `docs/handoffs/design-system.md`: este archivo (nuevo).

## Clases cubiertas (contrato `docs/REMASTER-INTERFACES.md` § "Estructura y clases")

`.workbench`, `.workbench-header`, `.workbench-brand`, `.workbench-heading`,
`.workbench-contract`, `.workbench-title`, `.workbench-phase`, `.workbench-back`,
`.workbench-sound`, `.workbench-layout`, `.workbench-objective`, `.objective-kicker`,
`.objective-rule`, `.objective-intro`, `.objective-note`, `.objective-open`,
`.workbench-stage`, `.workbench-status`, `.workbench-inventory`, `.workbench-log`,
`.log-title`, `.log-list`, `.log-entry` + `[data-tone="neutral|good|bad"]`,
`.workbench-actions` con `button`, `.is-primary`, `:hover`, `:active`,
`:focus-visible` y `:disabled`. Sin cubrir: nada; todas las clases del contrato
tienen estilo.

## Decisiones

- **Aditiva y aislada:** todo vive bajo `.workbench*` / `.objective-*` / `.log-*`;
  verificado con grep que ninguno de esos selectores existía antes, así que no hay
  pisadas. Los únicos nombres compartidos con lo existente (`.is-primary`,
  `button`) van siempre calificados (`.workbench-actions button.is-primary`).
- **Tokens:** no se tocó `:root` ni ninguna regla existente. Los materiales nuevos
  (papel `#f2ede3/#e6d9c2`, latón oscuro `#7a5a12`, nota `#5a5348`) viven como
  `--wb-*` con alcance `.workbench`; el resto reutiliza los tokens del juego
  (`--brass`, `--teal`, `--success`, `--danger`, `--panel`, radios, duraciones).
- **Luz/materiales del mockup sin imágenes:** fondo cálido con luz radial
  arriba-izquierda y velo teal a la derecha; objetivo como tarjeta papel ivory
  con borde `#c9b78e`; escenario con retícula latón tenue y viñeta interior.
  Sin bevels gruesos ni neón (regla "no retro" de `VISUAL-DESIGN.md` §12).
- **Tipografía:** Cinzel (marca, título, kickers de papel por herencia),
  Oswald (UI, fase, acciones, estado), Special Elite (regla/intro/nota del
  objetivo y entradas de bitácora). Mínimo 12 px en toda la capa (verificado por
  script); botones de acciones a 15 px; targets de 44 px en todos los botones.
- **Tono de bitácora con doble señal:** color de borde + marcador textual
  (`◦` / `✓` / `!`), el color nunca es la única señal.
- **Layout:** base una columna (320/360, acciones a ancho completo ≤360 px);
  ≥768 px dos columnas (objetivo + escenario, bitácora a ancho completo);
  ≥1100 px tres columnas `280px | 1fr | 320px` (mismo corte que `.layout`
  existente); retoque ≥1440 px. `.workbench` usa `overflow-x: clip` y los hijos
  del grid `min-width: 0`: la página no desplaza en horizontal y el escenario
  desplaza internamente (`.workbench-stage { overflow: auto }`).
- **Botones:** secundario por defecto en `.workbench-actions`; `.is-primary` con
  gradiente latón (el parent decide cuál es primario, hoy Ensayo). Atrás/sonido
  como ghost; sonido con estado `aria-pressed="true"` en teal.
- **`prefers-reduced-motion`:** bloque explícito que deja transiciones y
  animaciones del workbench en valores instantáneos (además de la regla global
  ya existente).

## Tamaño de CSS

`styles.css` final: **32 442 bytes (~31,7 KB)** — base previa 21 784 bytes +
capa nueva ~10,7 KB. Dentro del presupuesto de 40 KB del plan (§4 "A decidir"):
quedan ~8 KB para las capas de componentes/escenario que integren el parent.

## Tests y validación

- `node --test`: **253/253 pass** (antes y después del cambio).
- Grep de colisiones pre/post: ningún selector nuevo existía; sin duplicados.
- Script de escala tipográfica sobre el bloque nuevo (líneas 1299+): ningún
  `font-size` bajo 12 px.
- Preview en `$env:TEMP` (markup del contrato + CSS a 1440/390): **no realizada**.
  La regla de seguridad de escritura del worker solo permite escribir dentro de
  la superficie autorizada (`styles.css`, este handoff), y la preview pedía un
  archivo fuera del repo; al ser opcional ("si podés") se sustituyó por las
  verificaciones estructurales de arriba. El parent puede generarla en un paso.
- `git status --short`: solo los preexistentes `?? docs/ESTUDIO_TEORIA.md` y
  `?? docs/REMASTER-INTERFACES.md`; ningún scratch ni caché añadido.

## Riesgos y supuestos

- Los slots (`stage`, `status`, `inventory`, `log`) los monta el parent con
  `workbenchView.js`; esta capa solo da la cáscara. Alturas mínimas del
  escenario (320/420/480/540 px) asumen el editor real dentro con scroll propio.
- `.log-list` limita a 240–560 px con scroll interno; si el parent quiere tira +
  libreta lateral (N7/M18 del plan), eso es integración, no CSS.
- No se midió contraste WebAIM instrumental; los pares (tinta sobre papel,
  `#17130a` sobre latón, `muted` sobre `panel`) heredan los ya aceptados del
  juego y del mockup.

## Qué debe integrar el parent

1. `src/ui/workbenchView.js` con el markup exacto del contrato.
2. Montar editor/estado/inventario en los slots y cablear `onBack`, `onProbe`,
   `onAssault`, `onOpenDoc`, `onToggleSound`.
3. Preview visual a 1440/390 y checklist `VISUAL-DESIGN.md` §12 + `docs/SMOKE.md`.
4. Seam check contra la superficie (`styles.css` + este handoff) y commit.
