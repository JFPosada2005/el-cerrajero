# Guía de contribución — El Cerrajero

Esta guía es para el colaborador del proyecto. La idea es que puedas clonar, correr, entender la arquitectura, tomar una tarea y abrir un PR sin adivinar nada.

## 1. Antes de tocar código

Leé, en este orden:

1. [`README.md`](README.md) — qué es el juego y cómo se corre.
2. [`docs/DESIGN.md`](docs/DESIGN.md) — arquitectura, contratos de datos y diseño de cada sección.
3. [`docs/STATUS.md`](docs/STATUS.md) — dónde estamos hoy.
4. [`docs/TASKS.md`](docs/TASKS.md) — qué sigue y cuáles son los criterios de aceptación.
5. [`odd/tasks/el-cerrajero.md`](odd/tasks/el-cerrajero.md) — specs S1-S12 y bitácora de decisiones. Es la fuente de verdad del alcance.

Si algo del diseño no coincide con el código, gana el documento ODD y se actualiza el diseño. Si el diseño no cubre un caso, preguntá antes de inventar.

## 2. Setup

Requisitos:

- Node 24 o superior.
- Python 3 (solo para servir archivos estáticos).
- Git.

```bash
git clone <url-del-repo>
cd el-cerrajero
npm test
npm run serve
```

Abrir <http://localhost:8000>.

No hay `npm install`: el proyecto no tiene dependencias externas. No agregues una dependencia sin aprobación del owner.

## 3. Flujo de trabajo

- `main` es la rama estable y protegida por convención.
- Cada tarea va en una rama: `feat/<task-id>-<slug>`.
- Los commits son locales hasta que el PR esté revisado.
- El colaborador **no** hace push directo a `main`; abre un PR.
- El owner revisa, corre los tests y mergea.
- Una tarea = un PR pequeño y revisable. Si una tarea crece, se parte.

Ejemplo:

```bash
git checkout main
git pull
git checkout -b feat/t3-level-2
# implementar
npm test
git add <archivos>
git commit -m "feat(level-2): add parity level"
git push origin feat/t3-level-2
```

Abrí el PR contra `main` con:

- Qué tarea cierra (`T3`).
- Qué specs cubre (`S3`, `S4`, `S9`).
- Cómo probarlo.
- Captura o GIF si cambia la UI.
- Tests que corriste.

## 4. Estilo de código

Reglas duras del owner:

- **Cero o mínimos comentarios.** El código se explica con nombres y tests. No agregues comentarios `//` ni bloques explicativos salvo que una regla del curso lo exija.
- **Nada de código amontonado.** Una sentencia por línea, sin cadenas con `;`, sin líneas densas.
- **Sin rutas personales en salidas.** Nada de `C:\Users\...` en consola, UI, tests o docs.
- **Nombres en inglés** para código, archivos, funciones y variables.
- **UI en español** para el jugador.
- **Sin frameworks** ni build step. HTML, CSS, JS con módulos ES y SVG.
- **Sin `innerHTML` con datos del usuario.** Para datos de niveles, usá `textContent` o atributos seguros.
- **Nada de `localStorage` sin `try/catch`.**

## 5. Arquitectura que no se rompe

- `src/core/` es lógica pura: no toca DOM, no lee `localStorage`, no conoce niveles.
- `src/game/` contiene datos de niveles y reglas del juego. Puede importar `core`, no `ui`.
- `src/ui/` renderiza y captura eventos. No decide si una máquina es correcta.
- `src/main.js` orquesta el flujo; no implementa teoría.
- Los niveles son datos, no código condicional por nivel. Si `main.js` empieza a tener `if (level.id === 3)`, está mal.
- El juego nunca muestra “AFD”, “AFND”, “AP”, “MT”, “autómata”, “lenguaje”. Usa vocabulario del taller: celda, cable, engranaje, resorte, cinta.

## 6. Tests

- `npm test` corre todo con `node --test`.
- Cada motor nuevo necesita tests unitarios.
- Cada nivel necesita un test de aceptación: la máquina inicial no es equivalente, la máquina correcta sí, el ladrón encuentra el contraejemplo esperado.
- Si tocás UI, agregá un smoke test o una checklist manual reproducible en el PR.
- No mergees con tests rojos.

Comandos:

```bash
npm test
node --test tests/dfa.test.js
```

## 7. Definition of done

Una tarea está terminada cuando:

- [ ] Cumple los criterios de aceptación de `docs/TASKS.md`.
- [ ] `npm test` pasa.
- [ ] Agrega o actualiza tests.
- [ ] Actualiza `docs/TASKS.md` y `docs/STATUS.md`.
- [ ] No rompe niveles anteriores.
- [ ] No introduce vocabulario académico en la UI.
- [ ] No deja rutas personales, `console.log` de debug ni código comentado.
- [ ] El PR describe cómo probarlo.

## 8. Checklist de revisión

- ¿El autómata es la mecánica o solo la skin?
- ¿El jugador recibe un contraejemplo concreto cuando falla?
- ¿La dificultad sube por el ladrón/piezas, no por más texto?
- ¿El código está separado en core/game/ui?
- ¿Los tests cubren el caso feliz y el contraejemplo?
- ¿La UI sigue sin nombrar la teoría?

## 9. Comunicación

- Dudas de alcance: preguntá antes de implementar.
- Bug reproducido: issue con pasos, esperado, actual y evidencia.
- Bloqueo: PR en draft con la pregunta concreta.
- No inventes requisitos nuevos; el alcance está en `odd/tasks/el-cerrajero.md`.

## 10. Commits

Conventional Commits, sin atribución de IA:

```text
feat(level-2): add parity level
fix(dfa): return shortest counterexample
docs(tasks): update status after level 1
test(pda): cover empty-stack acceptance
```

Un commit = una unidad de trabajo con su test y su doc.
