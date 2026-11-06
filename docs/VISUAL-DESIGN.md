# El Cerrajero — Diseño visual y de experiencia

**Decisión:** el juego va a verse como un puzzle moderno, editorial y de precisión: fondo tinta, latón cálido, ivory, teal y coral; tipografía con carácter; SVG nítido; movimiento corto y con propósito. **No** pixel art, **no** CRT/scanlines, **no** neón, **no** bevels gruesos, **no** controles por defecto del navegador, **no** emojis como iconos.

Este documento es un addendum a [`docs/DESIGN.md`](DESIGN.md): no cambia mecánicas ni reglas, cambia cómo se ve, se siente y se usa.

## Camino rápido

1. Leé los principios y la dirección visual.
2. Usá los tokens de la sección 4; no inventes colores, tamaños ni tiempos.
3. Antes de cada PR de UI, pasá el checklist de la sección 12.
4. Si tocás un componente, actualizá su especificación y adjuntá captura a 360 px y 1440 px.

## 1. Principios

- **Subway legibility** (Zach Gage): alguien que mira de reojo tiene que entender el puzzle. Primer vistazo: el objetivo y la llave activa. Segundo: el mecanismo y el camino. Tercero: bitácora, pistas y progreso.
- **Una idea por nivel**: enseñar, probar, torcer, descansar. La dificultad sube por el ladrón y las piezas, no por más texto.
- **El feedback es el profesor**: cada error muestra una llave concreta y una repetición. Nada de modales genéricos.
- **Accesibilidad desde el inicio**: contraste, foco, teclado, movimiento reducido y color que no es la única señal.
- **Movimiento con propósito**: 120–420 ms; nada de animación infinita ni parallax.

## 2. Dirección visual: “precisión noir”

**Mood:** un taller de cerrajería de alta gama, de noche. Metal, latón, terciopelo, papel ivory. Preciso, silencioso, caro. No es un arcade retro ni una interfaz de laboratorio.

**Referencias de sensación** (inspiración, no copia):
- *Mini Metro* — claridad y economía de formas.
- *Dorfromantik* — calidez y ritmo pausado.
- *Monument Valley* — geometría elegante y silencio visual.
- *Cocoon* — interfaces sleek, sin ruido.
- *Chants of Sennaar* — legibilidad de sistemas y jerarquía.
- *The Case of the Golden Idol* — composición editorial.

**Anti-referencias:** pixel art, fuentes bitmap, scanlines, glow neón, botones con bisel, sombras duras, iconos emoji, ClipArt, gradientes arcoíris, texto todo en mayúsculas, controles nativos sin estilar.

## 3. Paleta

| Token | Hex | Uso | Nota |
|---|---|---|---|
| `--bg` | `#0B0F14` | fondo base | casi negro azulado, no puro |
| `--surface` | `#141B24` | paneles | 1 nivel sobre el fondo |
| `--surface-2` | `#1B2430` | hover / tarjetas | 2 niveles |
| `--line` | `#2A3646` | bordes 1 px | separación sutil |
| `--ink` | `#F2EDE3` | texto principal | ivory cálido, no blanco puro |
| `--muted` | `#A7B0BE` | texto secundario | contraste AA sobre surface |
| `--brass` | `#D4A72C` | acción primaria / cerrojo | latón |
| `--brass-2` | `#F0CF6A` | hover / títulos | latón claro |
| `--teal` | `#38C6B8` | activo / camino válido | acento frío |
| `--coral` | `#F06A4A` | alarma / error | no usar solo color |
| `--violet` | `#A18BE0` | llave 4 / acentos | uso puntual |
| `--success` | `#7CCB6A` | éxito | con icono/texto |
| `--danger` | `#F06A4A` | error | con icono/texto |

**Llaves:** 1 = latón (`--brass`), 2 = teal (`--teal`), 3 = coral (`--coral`), 4 = violeta (`--violet`). Cada llave lleva su símbolo visible; el color nunca es la única señal.

**Contraste:** texto normal ≥ 4.5:1; texto grande y elementos no textuales ≥ 3:1. Verificar con WebAIM antes de cerrar un PR.

## 4. Tipografía

| Rol | Fuente | Uso | Pesos |
|---|---|---|---|
| Display | **Fraunces Variable** (`opsz`, `wght`) | título del juego, títulos de nivel, números grandes | 600 / 700 |
| UI | **Inter Variable** (`opsz`, `wght`) | botones, labels, bitácora, ayuda | 400 / 500 / 650 |
| Fallback | `Palatino Linotype`, `Georgia`, `Segoe UI`, `system-ui` | si la fuente no cargó | — |

**Escala:** 12 / 14 / 16 / 18 / 22 / 28 / 40 / 64 px. Base 16 px. Line-height 1.2 para display y 1.5 para body. Letter-spacing: `-0.02em` en display grande, `0.08em` en labels mayúsculas.

**Carga:** self-hosted WOFF2, subset Latin, `font-display: swap`, preload solo de Inter. Presupuesto total < 250 KB. Nada de Google Fonts en runtime (privacidad y dependencia externa). Si el presupuesto aprieta, Fraunces estático 600 para el título e Inter variable para todo lo demás.

## 5. Espaciado, radios y sombras

- Espaciado: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. Todo múltiplo de 4.
- Radios: 8 px (controles), 12 px (paneles), 16 px (modales), 999 px (llaves).
- Bordes: 1 px `--line`; el foco usa 2 px `--teal` con offset 2.
- Sombras: `0 1px 0 rgba(255,255,255,0.04) inset` para superficies; `0 24px 60px rgba(0,0,0,0.45)` solo para modales. Nada de sombras duras.
- Textura: un ruido SVG muy sutil (`feTurbulence`, opacidad 0.03) sobre el fondo; estático, nunca animado y nunca sobre el texto.

## 6. Layout y jerarquía

**Desktop (≥ 1100 px):** barra superior de 64 px; grid `280px | 1fr | 320px`; gutter 24 px; máximo 1500 px. El taller es el héroe; los paneles laterales son secundarios.

**Mobile (< 1100 px):** una columna; taller primero; acciones en barra inferior sticky; bitácora colapsable; targets ≥ 44×44 px. Sin scroll horizontal a 360 px.

**Tres lecturas:**
1. **Objetivo:** la ficha del contrato, el cerrojo, la llave activa y el botón primario.
2. **Mecanismo:** celdas, cables, camino iluminado.
3. **Meta:** bitácora, pistas, progreso.

**Jerarquía de acciones:** un solo botón primario por pantalla (latón). “Probar” es secundario; “Asalto” es primario. “Volver” es ghost. Nunca dos botones compitiendo con el mismo peso.

## 7. Componentes

| Componente | Especificación |
|---|---|
| Botón primario | 44 px mínimo, radio 10, gradiente latón, texto `#17130A`, hover +1 px, press `scale(0.98)`. |
| Botón secundario | superficie 2, borde `--line`, hover borde latón. |
| Botón ghost | texto muted, hover ink; sin fondo. |
| Panel | superficie, borde 1 px, radio 16, padding 24; highlight interno de 1 px. |
| Contrato | tarjeta ivory (fondo `--ink`, texto `#17130A`), radio 12, padding 16; número en latón oscuro `#7A5A12`, cliente y regla en Fraunces; nota en `#5A5348`. Persistente durante el nivel: nunca se colapsa ni se oculta. |
| Celda (nodo) | 88 px, fill `#111821`, borde 2.5 px latón; aceptar = doble anillo; inicio = bandera; hover glow; activo teal; error coral con shake de 120 ms. |
| Cable | 2.5 px muted; **un cable por llave, dibujado en paralelo**; label con el símbolo y halo `--bg`; hover coral y cursor pointer; **clic corta el cable**; foco teal 3.6 px; camino activo teal; resorte = dashed; bifurcador = rombo; engranaje = engranaje pequeño. |
| Paleta de llaves | 48 px, símbolo visible, anillo activo teal, tooltip con nombre. |
| Pila | fichas 56×32, base 64×20, push/pop 220 ms, label “base”/“ficha”. |
| Cinta | celdas 40×40, números tabulares, cabezal triángulo, slide 180 ms. |
| Tambor | anillos por sección, pines por símbolo; popover con escribir/mover/siguiente; foco atrapado. |
| Bitácora | timeline con punto de color + icono; `aria-live="polite"`; autoscroll. |
| Modal | 480 px máx, superficie, borde latón, backdrop 4 px blur, scale/fade 180 ms, Esc cierra. |
| Toast | top-right, 4 s, icono + texto, no bloquea. |
| Progreso | 5 medallones en el mapa; completado = latón; bloqueado = línea; sin XP. |

**Estados obligatorios:** default, hover, active, focus-visible, disabled, loading, success, error, empty. Si falta uno, el componente no está terminado.

**Editor:** conectar es clic en origen → clic en destino; **cortar es clic directo sobre el cable**. No hay drag. Si se agrega drag, debe existir una alternativa de un solo puntero (WCAG 2.2 *Dragging Movements*).

## 8. Movimiento

| Evento | Duración | Easing | Qué se mueve |
|---|---|---|---|
| Hover / press | 120 ms | ease-out | elevación 1 px / scale 0.98 |
| Modal / toast | 180 ms | ease-out | opacity + scale 0.98→1 |
| Nodo activo | 260 ms | ease-out | stroke + glow |
| Cable | 360 ms | ease-out | `stroke-dashoffset` |
| Éxito | 420 ms | ease-out | pulso de latón/teal |
| Pila push/pop | 220 ms | leve overshoot | ficha |
| Cinta | 180 ms | ease-out | translate del cabezal |

**Reglas:** animar solo `transform` y `opacity` (o `stroke-dashoffset` en SVG); nada de `width/height/top/left`. Respetar `prefers-reduced-motion: reduce`: duración 0, sin loops. Nada de parallax, flashing ni animación de fondo infinita.

**Transiciones de pantalla:** la View Transitions API se usa solo como mejora progresiva; si el navegador no la soporta, el cambio es instantáneo o con CSS/WAAPI. También respeta reduced motion.

## 9. Accesibilidad

- WCAG 2.2 AA: texto 4.5:1; texto grande y elementos no textuales 3:1.
- Color + forma/texto: las llaves tienen símbolo; éxito/error tienen icono y texto.
- Targets ≥ 44×44 px; teclado completo; `:focus-visible` siempre visible; Esc cierra modales.
- SVG: `role="button"`, `tabindex="0"`, `aria-label` por celda; la bitácora con `aria-live="polite"`.
- **Reflow 320 px:** el shell (controles, texto, navegación) debe reflowar a 320 CSS px sin scroll horizontal. El taller SVG puede conservar layout 2D solo donde el diagrama lo exija; WCAG contempla la excepción de juegos/diagramas.
- **Foco no obscurecido:** la barra sticky de acciones no puede tapar el control enfocado. Verificar con teclado, no solo con mouse.
- **Drag alternativo:** el editor usa clic origen → destino, no drag. Si se agrega drag, ofrecer una alternativa de un solo puntero.
- `prefers-reduced-motion` y `prefers-contrast: more`; sin flashing; sonido apagado por defecto si se agrega.
- Probar con axe DevTools y WebAIM; no confiar solo en el ojo.

## 10. Performance

- Sin requests externos: fuentes self-hosted, iconos inline, sin CDN.
- Solo SVG y CSS; nada de imágenes raster.
- Presupuesto: fuentes < 250 KB, JS < 50 KB, CSS < 20 KB; primera pintura local < 1 s.
- Animar con `transform/opacity`; `requestAnimationFrame` para drag; `will-change` solo mientras dura la animación.
- Lighthouse local: Performance ≥ 90, Accessibility ≥ 95.

## 11. Librerías y recursos

| Necesidad | Decisión | Por qué |
|---|---|---|
| Animación UI | **CSS + Web Animations API** (0 KB) | Alcanza para hover, modales, cables, fichas y cinta. |
| Timeline compleja | **Motion mini** (3.12 kB minimum bundle, comparación oficial nov 2026) si hace falta | La opción más chica; vendorizada, sin build. |
| SVG morphing / timelines ricas | **Anime.js v4** (~24.5 KB agregados según el sitio; base de compresión no declarada; MIT; v4.4.1 abr 2026) | Solo si aparece una necesidad real; no por defecto. |
| Animación de scroll / secuencias largas | **GSAP** (27.29 kB minimum bundle; closed-source/Webflow-owned; licencia separada) | Overkill para este juego; no. |
| Tipografías | **Fraunces + Inter Variable**, self-hosted (OFL) | Carácter editorial + legibilidad de UI; sin Google Fonts en runtime. El tamaño depende del subset/axes: medir. |
| Iconos | **Lucide** inline SVG (ISC; v1.68.0 al momento de la investigación) | 1.5 px de stroke, consistentes, sin icon font. |
| Gráficos del informe | Skill **archify** | Diagramas de autómatas y arquitectura para el informe, no para el juego. |
| Documentación | Skill **cognitive-doc-design** | Estructura de guías y onboarding. |
| Diseño / contraste | Figma, Realtime Colors, Coolors, WebAIM, axe, Lighthouse | 0 bytes en el bundle; solo mockups, paleta, contraste y auditoría. |
| Referencias | Mobbin, Game UI Database, Dribbble | Patrones de UI de juegos, no copias. Dribbble es mood, no evidencia de UX. |

**Regla de dependencias:** si una librería no ahorra más de lo que pesa, no entra. El proyecto sigue sin framework y sin build step. Nada de CDN en runtime: si una librería se usa, se vendoriza localmente con su licencia.

## 12. Checklist “no retro / no hecho con los pies”

- [ ] No hay pixel art, CRT, scanlines, neón, bevels ni sombras duras.
- [ ] No hay controles nativos sin estilar, emojis como iconos ni ClipArt.
- [ ] Todo está en la grilla de 4/8 px; nada desalineado; sin overflow.
- [ ] Funciona a 320 px (reflow/zoom), 360 px, 768 px y 1440 px; el shell sin scroll horizontal; el taller puede conservar 2D solo donde el diagrama lo exija.
- [ ] Jerarquía tipográfica clara; máximo 3 pesos por pantalla; body no va en mayúsculas.
- [ ] Contraste AA; el color no es la única señal.
- [ ] Cada componente tiene hover, focus, active, disabled, loading, success, error y empty.
- [ ] `prefers-reduced-motion` respetado; sin animación infinita.
- [ ] Teclado completo; foco visible; el foco no queda tapado por la barra sticky; Esc cierra modales.
- [ ] Si hay drag, existe una alternativa de un solo puntero.
- [ ] Captura/GIF en el PR; checklist de `docs/SMOKE.md` pasado.
- [ ] Playtest con 5 personas: “¿qué hago primero?” en los primeros 10 segundos.

## 13. Plan de implementación

1. **V0 — Fundación:** tokens en `styles.css`, fuentes self-hosted, botones/paneles, foco y reduced motion.
2. **V1 — Taller:** celdas, cables, labels, paleta, bitácora, modal, responsive.
3. **V2 — Movimiento:** cable, nodo, ficha, cinta, éxito; nada gratuito.
4. **V3 — Auditoría:** contraste, axe, Lighthouse, 360 px, playtest y capturas.

Archivos: `styles.css`, `index.html` (preload), `src/ui/*`, `assets/fonts/`, `docs/SMOKE.md`.

## 14. Playtest

Preguntas (sin ayudar):
- ¿Qué creés que tenés que hacer en los primeros 10 segundos?
- ¿Qué hace el ladrón?
- ¿Qué significa la luz teal?
- ¿Se sintió como estudiar? (1–5)
- ¿Qué tan claro fue el objetivo? (1–5)
- ¿Qué te molestó visualmente?

## Referencias

- Supersonic, *UX/UI best practices*: <https://supersonic.com/learn/blog/ux-ui-best-practices/>
- RTWare, *Puzzle app UI design*: <https://rtware.net/design-ux/puzzle-app-ui-design/>
- Zach Gage case study (subway legibility / three reads): <https://mgmarlow.com/words/2023-01-15-case-study-zach-gage/>
- Motion vs GSAP vs Anime.js (2026): <https://prismetic-group.medium.com/gsap-vs-motion-vs-anime-js-what-to-pick-in-2026-309bde45c2ca>
- Motion docs, *GSAP vs Motion*: <https://motion.dev/docs/gsap-vs-motion>
- Variable fonts 2026: <https://www.creativeswall.com/best-variable-fonts-for-web-design/>
- Web font optimization: <https://webperfclinic.com/article/web-font-optimization-complete-guide-faster-loading-zero-layout-shift>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
- Xbox Accessibility Guideline 102 (contrast): <https://docs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-102-contrast>
- Game Accessibility Guidelines: <https://gameaccessibilityguidelines.com/full-list/>
- Google Playables design best practices: <https://developers.google.com/youtube/gaming/playables/certification/best_practices_design>

### WCAG 2.2 y navegador

- W3C, *Reflow*: <https://www.w3.org/WAI/WCAG22/Understanding/reflow>
- W3C, *Focus Not Obscured*: <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum>
- W3C, *Dragging Movements*: <https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements>
- W3C, *Use of Color*: <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color>
- MDN, *View Transition API*: <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API>
- MDN, *prefers-reduced-motion*: <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion>
- MDN, *feTurbulence*: <https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence>
- web.dev, *Optimize webfont loading*: <https://web.dev/articles/optimize-webfont-loading>

### Referencias de UI

- Mobbin, *NYT Word Puzzle input*: <https://mobbin.com/explore/screens/b2a9c84d-b962-45f0-b76d-589b3a560a3e>
- Mobbin, *NYT Puzzle completion*: <https://mobbin.com/explore/screens/7232dc3d-9917-4d64-b34c-c052b2c7703c>
- Mobbin, *The New Yorker web game in progress*: <https://mobbin.com/explore/screens/01f12678-2b8f-480d-b692-314cba3a6c83>
- Game UI Database, *Mini Metro*: <https://www.gameuidatabase.com/gameData.php?id=704>
- *Monument Valley Panoramic Edition* case study: <https://cedrepradier.com/work/monument-valley-panoramic-edition>
- Dribbble, *1010! puzzle concept* (mood only): <https://dribbble.com/shots/23736352-1010-Block-Puzzle-Game-App-Ui-Design>
