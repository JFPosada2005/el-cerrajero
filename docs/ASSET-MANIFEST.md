# El Cerrajero — Manifiesto de assets del remaster

> **Rama:** `feat/remaster-integration` · **Base visual:** `mockups/nivel-1-taller` @ `153ee7d` · **Fecha:** 2026-11-17.
>
> **Regla de recursos limitados.** Si un asset no llega, el nivel se implementa con un placeholder (SVG/CSS o el asset actual del mockup) y no se bloquea. La legibilidad y la jugabilidad mandan sobre la atmósfera. Todo lo que no exista se marca como **a producir**.

## Dirección visual acordada

La base es la versión de Mateo (`153ee7d`):

- **Fuentes:** Cinzel (títulos), Oswald (interfaz y controles) y Special Elite (contrato, pistas y bitácora), self-hosted.
- **Cables:** SVG procedurales, trenza de cuatro hebras y terminales de latón; el color identifica la llave. Sin etiquetas colgantes ni cursor propio.
- **Tablero:** escenario fijo 16:9 (1600×900) escalado; en pantallas angostas se recorre horizontalmente.
- **Probar/Ensayo:** la llave sobre una pieza solo explica; el perno se abre cuando el recorrido es válido. Un fallo de ensayo no consume el nivel.
- **Contrato:** ficha fija con el objetivo + papel para el detalle (decisión del owner).
- **Interacción táctil:** clic y clic; el arrastre queda para mouse/lápiz.

## Carpetas y nombres

```text
assets/
  fonts/                         Cinzel, Oswald, Special Elite + licencias
  shared/ui/                     iconos de sonido, cerrar, candado, velocidad
  shared/paper/                  texturas de contrato, pista y bitácora
  levels/01/                     nivel 1
  levels/02/ … levels/05/        niveles 2–5
  audio/sfx/                     efectos
  audio/music/                   loops por nivel (opcional)
  manifest.json                  mapeo final/placeholder que consume el código
```

Reglas de nombre: minúsculas, sin espacios, guiones, extensión final (`background.webp`, `thief.webp`, `cable.ogg`). Un asset no se renombra después de acordado; si cambia, se agrega una entrada nueva.

## Formatos y presupuesto

| Tipo | Formato | Tamaño | Presupuesto |
|---|---|---|---|
| Fondos | WebP (fallback PNG) | 2048×1152, 2× del tamaño mostrado | 1,5 MB por nivel |
| Props con transparencia | WebP/PNG | 2× del tamaño mostrado | incluido en el nivel |
| Iconos | SVG | 24×24, trazo 1,5 px | — |
| Fuentes | WOFF2 | — | 150 KB |
| SFX | OGG/MP3 | menos de 1–2 s | 400 KB por nivel si hay música |
| Música | OGG/MP3 | 60 s o menos, loop | 400 KB por nivel |

Audio normalizado, sin clipping. Música apagada por defecto y con control propio. Las licencias y créditos van en `CREDITS.md`; las fuentes necesitan su archivo OFL.

## Prioridades

### P0 — sin esto el nivel no se entiende

- Fuentes y licencias.
- Fondo y props principales del nivel 1 (ya existen en el mockup).
- Celda-relé, piñón de bucle, resorte, glifo de bifurcador, pila, tambor y cinta.
- Ficha de objetivo, iconos de control y estados de foco/error/alarma.
- SFX base: clic, cable, corte, engranaje, cerrojo, campana, papel y error.

### P1 — mejora clara

- Fondos propios de N2–N5.
- Indicador de pisos, selectores de pila, palancas, boleta, lámparas.
- SFX adicionales: resorte, ficha, cinta, púa, sello, pasos del ladrón.
- Retratos/objetos del ladrón por nivel.
- Capturas nuevas a 360 y 1440; `docs/SMOKE.md`.

### P2 — opcional

- Música por nivel.
- Poses nuevas del ladrón.
- Minimapa en celular.
- View Transitions.
- Pantalla de título ilustrada.
- Reemplazo del perno y la mesa por versiones pintadas.

## Slots por nivel

### Compartidos

| Slot | Placeholder actual | Final | Prioridad |
|---|---|---|---|
| `font.display` | `assets/fonts/Cinzel-Variable.woff2` | igual | P0 |
| `font.ui` | `assets/fonts/Oswald-Variable.woff2` | igual | P0 |
| `font.paper` | `assets/fonts/SpecialElite-Regular.woff2` | igual | P0 |
| `ui.sound`, `ui.close`, `ui.lock`, `ui.speed` | CSS/SVG | `assets/shared/ui/…` | P0 |
| `sfx.click`, `sfx.cable`, `sfx.cut`, `sfx.gear`, `sfx.lock`, `sfx.bell`, `sfx.paper`, `sfx.error` | Web Audio sintetizado | `assets/audio/sfx/…` | P0 |
| `sfx.success`, `sfx.spring`, `sfx.chip`, `sfx.tape`, `sfx.pin`, `sfx.steps` | silencio/placeholder | `assets/audio/sfx/…` | P1 |
| `music.n1` … `music.n5` | silencio | `assets/audio/music/n1.ogg`… | P2 |

### Nivel 1 — Banco del Llano

| Slot | Placeholder actual | Final | Prioridad |
|---|---|---|---|
| `n1.background` | `mockups/nivel-1-taller/assets/sprites/fondo-banco.jpg` | `assets/levels/01/background.webp` | P0 |
| `n1.thief` | `ladron.png` | `assets/levels/01/thief.webp` | P0 |
| `n1.contract`, `n1.hint`, `n1.log` | `contrato.png`, `nota-pista.png`, `libreta.png` | `assets/levels/01/props/…` | P0 |
| `n1.entry`, `n1.lock`, `n1.spool`, `n1.gear`, `n1.bell`, `n1.scissors` | PNG actuales | `assets/levels/01/props/…` | P0 |
| `n1.keys.1…4` | `llave-1…4.png` | `assets/levels/01/props/llave-1…4.webp` | P0 |
| `n1.plate.texture`, `n1.plate.frame` | JPG + SVG | `assets/levels/01/props/placa…` | P1 |
| `n1.bolt`, `n1.bench` | SVG | SVG o WebP | P2 |

### Nivel 2 — Hotel Mirador

| Slot | Placeholder | Final | Prioridad |
|---|---|---|---|
| `n2.background` | CSS oscuro | `assets/levels/02/background.webp` | P1 |
| `n2.relay` | celda-relé compartida | `assets/shared/props/relay.webp` | P0 |
| `n2.pinion` | SVG/CSS | `assets/levels/02/pinion.webp` | P0 |
| `n2.floorIndicator` | SVG | `assets/levels/02/floor-indicator.svg` | P1 |
| `n2.bell` | campana compartida | `assets/shared/props/bell.webp` | P1 |

### Nivel 3 — Museo del Llano

| Slot | Placeholder | Final | Prioridad |
|---|---|---|---|
| `n3.background.day`, `n3.background.night` | CSS con luz | `assets/levels/03/day.webp`, `night.webp` | P1 |
| `n3.fork` | glifo SVG “Y” | `assets/shared/props/fork.svg` | P0 |
| `n3.spring` | SVG/CSS | `assets/shared/props/spring.svg` | P0 |
| `n3.lamp` | SVG/CSS | `assets/levels/03/lamp.svg` | P2 |

### Nivel 4 — Teatro Municipal

| Slot | Placeholder | Final | Prioridad |
|---|---|---|---|
| `n4.background` | CSS granate | `assets/levels/04/background.webp` | P1 |
| `n4.stackBase`, `n4.chip` | SVG/CSS | `assets/levels/04/stack-base.webp`, `chip.webp` | P0 |
| `n4.selectors` | SVG | `assets/levels/04/selectors.svg` | P1 |
| `n4.levers` | variantes de llave | `assets/levels/04/lever-up.svg`, `lever-down.svg` | P1 |

### Nivel 5 — Banco Central

| Slot | Placeholder | Final | Prioridad |
|---|---|---|---|
| `n5.background` | `fondo-banco.jpg` teñido | `assets/levels/05/background.webp` | P1 |
| `n5.tape`, `n5.head` | SVG/CSS | `assets/levels/05/tape.svg`, `head.webp` | P0 |
| `n5.drum`, `n5.pin` | SVG/CSS | `assets/levels/05/drum.webp`, `pin.svg` | P0 |
| `n5.depositSlip` | papel CSS | `assets/levels/05/deposit-slip.webp` | P1 |

## Entrega con Mateo

1. Mateo trabaja en `feat/remaster-assets` o directamente en `assets/`; no toca `src/`, `src/game`, `tests/`, `index.html` ni `styles.css` del juego.
2. Cada entrega actualiza `assets/manifest.json`: `status: "available"`, ruta final y licencia.
3. Nosotros probamos el asset en el slot; si no encaja, se mantiene el placeholder y se devuelve una nota concreta.
4. Un asset faltante nunca bloquea una fase: el código siempre tiene fallback.
5. `CREDITS.md` y las licencias se actualizan en la misma entrega.

## Definición de terminado por asset

- Existe en la ruta final y el manifest lo marca `available`.
- Carga sin 404 y sin deformarse en 320/360/768/1440.
- Peso dentro del presupuesto.
- Licencia y crédito registrados.
- Si reemplaza un placeholder, la pantalla se ve igual o mejor; no cambia la lógica.
