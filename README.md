# El Cerrajero

Repositorio: <https://github.com/JFPosada2005/el-cerrajero> (privado).

Proyecto final de **Lenguajes de Programación** (Universidad de los Llanos). Un juego de puzzles donde el jugador diseña mecanismos de bóvedas que, formalmente, son autómatas. El juego nunca nombra la teoría: la usa. El informe es el que la hace explícita.

## Estado actual

- **Nivel 1 jugable**: reparar una cerradura AFD, probar la llave legítima y resistir el asalto del ladrón.
- **Niveles 2-5**: diseñados, pendientes de implementación.
- **Motor AFD**: completo y probado (simulación, minimización, equivalencia, contraejemplo más corto).
- **Tests**: 17 pasando con `node --test`.

## Ejecutar

Requisitos: Node 24+ y Python 3 (solo para servir archivos estáticos).

```bash
npm test
npm run serve
```

Abrir <http://localhost:8000>.

No hay dependencias externas ni build step. El juego es HTML, CSS, JavaScript con módulos ES y SVG.

## Cómo se juega el nivel 1

1. El cliente pide una cerradura que abra **solo** con la secuencia `1-2-3`.
2. En el taller, elegí una llave, tocá la celda de origen y después la de destino. Si el cable ya existe, se corta.
3. Probá la llave legítima.
4. Iniciá el asalto. El ladrón busca la cadena más corta que abre la bóveda cuando no debería.
5. Repará los cables incorrectos y volvé a llamar al ladrón.

## Documentación

| Documento | Para qué sirve |
| --- | --- |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Diseño técnico sección por sección: módulos, contratos de datos, jueces, UI y orden de implementación. |
| [`docs/VISUAL-DESIGN.md`](docs/VISUAL-DESIGN.md) | Sistema visual y de UX: dirección “precisión noir”, tokens, tipografía, movimiento, accesibilidad y recursos. |
| [`docs/TASKS.md`](docs/TASKS.md) | Tablero de tareas con estado, dueño, archivos, criterios de aceptación y dependencias. |
| [`docs/STATUS.md`](docs/STATUS.md) | Qué funciona, qué está en progreso, qué sigue y qué está bloqueado. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup, ramas, commits, tests, PRs y estilo de código. |
| [`skills/el-cerrajero-visual-design/SKILL.md`](skills/el-cerrajero-visual-design/SKILL.md) | Skill de agente con las reglas visuales que debe cargar cualquiera que toque la UI. |
| [Issues del repo](https://github.com/JFPosada2005/el-cerrajero/issues) | Tareas accionables en GitHub, una por tarea T3-T8. |
| [`odd/tasks/el-cerrajero.md`](odd/tasks/el-cerrajero.md) | Documento ODD: specs, tareas y bitácora de decisiones. Es la fuente de verdad del alcance. |

## Estructura

```text
.
├── index.html              # entrada del juego
├── styles.css              # tema visual
├── src/
│   ├── main.js             # shell, flujo de nivel, persistencia
│   ├── core/
│   │   └── dfa.js          # motor AFD puro
│   ├── game/
│   │   ├── level1.js       # datos del nivel 1
│   │   └── rules.js        # construcción del autómata del jugador, juez, asalto
│   └── ui/
│       └── graphEditor.js  # editor SVG del taller
├── tests/                  # pruebas con node --test
├── docs/                   # diseño, tareas, estado
├── odd/tasks/              # documento ODD
└── package.json
```

## Mapa teoría → juego

| Nivel | Máquina | Mecánica del juego | Concepto formal |
| --- | --- | --- | --- |
| 1 | AFD | Recordar en qué paso va la secuencia `1-2-3` | Estados, transiciones, lenguaje finito |
| 2 | AFD | Bucle para paridad / patrones de longitud arbitraria | Lenguaje regular infinito, auto-transición |
| 3 | AFND + λ | Bifurcador y resorte: dos caminos a la vez, salto sin consumir tecla | No determinismo, clausura épsilon |
| 4 | AP | Pila para `A^n B^n`: n aperturas y n cierres | Pila, lenguaje libre de contexto |
| 5 | MT | Cinta y cabezal: sumar / comparar símbolos | Cinta, cómputo, tesis de Church-Turing |

## Principios de diseño

- **El autómata es la mecánica**, no una skin. Si el jugador viera "construí un AFD", el juego fallaría.
- **Sin vocabulario académico en pantalla**: celdas, engranajes, resortes, cintas.
- **El ladrón es el juez**: no hay notas ni rankings; hay contraejemplos concretos.
- **Cinco niveles, no cinco actos**: cada nivel es un caso de estudio del informe.
- **Código sin comentarios innecesarios**, una sentencia por línea, sin rutas personales en las salidas.

## Flujo de trabajo

- `main` es la rama estable.
- Cada tarea va en una rama `feat/<id>-<slug>` y se integra por PR.
- `npm test` debe pasar antes de abrir un PR.
- No se hace push a `main` sin revisión del owner.
- Los commits usan Conventional Commits y no llevan atribución de IA.

## Créditos

- Autor: Juan Posada — código 160004831.
- Colaborador: MateoTorres1543.
- Curso: Lenguajes de Programación, Universidad de los Llanos.
- Rúbrica: informe + sustentación. El juego es la evidencia; el informe es la tesis.
