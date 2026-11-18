# El Cerrajero

Repositorio: <https://github.com/JFPosada2005/el-cerrajero> (privado).

Proyecto final de **Lenguajes de Programación** (Universidad de los Llanos). Un juego de puzles donde el jugador repara mecanismos de seguridad que, formalmente, son autómatas. El juego nunca nombra la teoría: la usa. El informe es el que la hace explícita.

## Estado actual

- **Cinco niveles jugables**, cada uno con dos fases (reparación y construcción): AFD, AFD con bucles, AFND con épsilon, autómata de pila y máquina de Turing.
- **Cuatro motores puros** en `src/core/`: `dfa.js`, `nfa.js`, `pda.js`, `tm.js`, con simulación, traza y jueces.
- **Interfaz diegética e inmersiva**: sin barra de acciones ni panel de objetivo; cada acción vive en un objeto del taller (contrato, lupa, libreta, campana, tijera, carretes, palancas, manivela). Fondo a pantalla completa, header flotante y estado como línea grabada.
- **Assets finales**: 59 de 65 slots disponibles (≈1,8 MB): fondos de los cinco niveles, props, papel abierto de los modales, boleta del N5, fuentes con licencia y 14 efectos de sonido.
- **Tests**: 506 pasando con `node --test` (35 archivos).

## Ejecutar

Requisitos: Node 24+ y Python 3 (solo para servir archivos estáticos).

```bash
npm test
npm run serve
```

Abrir <http://localhost:8000>. No hay dependencias externas ni build step: HTML, CSS, JavaScript con módulos ES y SVG.

## Cómo se juega

Cada nivel es un contrato. El **contrato** (papel sobre la mesa) cuenta la situación y la regla del cliente; la **pista** (lupa) explica cómo interactuar y, desde el N2, solo lo nuevo respecto del nivel anterior.

| Nivel | Máquina | Lo que se aprende a hacer |
| --- | --- | --- |
| 1 — La caja de seguridad | AFD | Elegir carrete, conectar origen y destino, cortar con la tijera, probar con la campana y pedir el ensayo. |
| 2 — El ascensor | AFD con bucles | Leer la paridad en el indicador de pisos y usar bucles. |
| 3 — El museo | AFND con épsilon | Bifurcador (dos caminos) y resorte (salto sin gastar llave). |
| 4 — El teatro | Autómata de pila | Elegir qué hay arriba de la pila y la acción (no tocar, cargar, soltar). |
| 5 — El banco central | Máquina de Turing | Leer la cinta, editar una púa (símbolo, movimiento, sección) y guardarla. |

## Documentación

| Documento | Para qué sirve |
| --- | --- |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Diseño técnico: módulos, contratos de datos, jueces y UI. |
| [`docs/VISUAL-DESIGN.md`](docs/VISUAL-DESIGN.md) | Sistema visual y de UX: dirección “precisión noir”, tokens, tipografía, accesibilidad y recursos. |
| [`docs/LOGIC.md`](docs/LOGIC.md) | Referencia de la lógica congelada y del contrato de remasterización. |
| [`docs/DIEGETIC-UI-PLAN.md`](docs/DIEGETIC-UI-PLAN.md) | Interfaz diegética e inmersiva: props accionables, ranuras `keysSlot`/`hudSlot`, animaciones y verificación. |
| [`docs/ASSET-MANIFEST.md`](docs/ASSET-MANIFEST.md) | Contrato de assets por slot, prioridades y reglas de reemplazo. |
| [`docs/ASSET-INTEGRATION.md`](docs/ASSET-INTEGRATION.md) | Mapa de integración de los assets finales y verificación en navegador. |
| [`docs/REMASTER-PLAN.md`](docs/REMASTER-PLAN.md) | Plan, estado y roadmap del remaster. |
| [`docs/ESTUDIO_TEORIA.md`](docs/ESTUDIO_TEORIA.md) | Estudio aplicado de la teoría del curso al juego. |
| [`docs/STATUS.md`](docs/STATUS.md) | Qué funciona, qué sigue y qué está bloqueado. |
| [`CREDITS.md`](CREDITS.md) | Fuentes, licencias y autoría de los assets. |
| [`Informe_y_entregables/`](Informe_y_entregables/) | Informe IEEE, fuente editable y PDF. |

## Estructura

```text
.
├── index.html              # entrada del juego
├── styles.css              # tema base
├── src/
│   ├── main.js             # flujo de nivel, handlers, persistencia, audio
│   ├── core/               # motores puros: dfa, nfa, pda, tm
│   ├── game/               # datos de niveles, jueces, oráculos, ladrón
│   └── ui/
│       ├── levels/         # escenas diegéticas por nivel
│       ├── graphEditor.js  # tablero de cables (AFD/AFND/AP)
│       ├── drumEditor.js   # tambor y púas (MT)
│       ├── tapePanel.js    # cinta y cabezal
│       ├── workbenchScene.*# shell inmersivo, ranuras y dock
│       ├── levelBriefs.js  # contexto y tutorial por nivel
│       ├── audio.js        # SFX por manifiesto con respaldo sintetizado
│       └── assets.js       # resolución de assets contra el manifiesto
├── assets/                 # fondos, props, fuentes, SFX y manifiesto
├── tests/                  # pruebas con node --test
├── docs/                   # diseño, lógica, plan y estado
└── package.json
```

## Principios de diseño

- **El autómata es la mecánica**, no una skin. Si el jugador viera “construí un AFD”, el juego fallaría.
- **Sin vocabulario académico en pantalla**: celdas, engranajes, resortes, cintas.
- **El ladrón es el juez**: contraejemplos concretos, sin notas ni rankings.
- **Una acción, un objeto**: la interfaz no tiene botones genéricos; cada control es un prop del taller.
- **Lógica congelada, presentación libre**: los motores y los datos de nivel no se tocan sin autorización; la capa visual se remasteriza con pruebas como red.

## Flujo de trabajo

- `main` es la rama estable.
- Cada tarea va en una rama `feat/<id>-<slug>` y se integra por PR o merge revisado.
- `npm test` debe pasar antes de abrir un PR.
- Los commits usan Conventional Commits y no llevan atribución de IA.

## Créditos

- **Juan Felipe Posada Daza** — código 160004831 — `jfposada@unillanos.edu.co`
- **Cristian Mateo Torres Villamil** — código 160004840 — `cmtorres@unillanos.edu.co`
- Docente: Diana Marcela Cardona Román
- Curso: Lenguajes de Programación, Universidad de los Llanos.
- Assets: ver [`CREDITS.md`](CREDITS.md).
