/**
 * Escena del nivel 4 — Teatro Municipal (tramoya del montacargas).
 *
 * Solo decorado interactivo: terciopelo granate, mesa de trabajo, placa de
 * latón y props accionables. Cada prop es un `<button type="button">` real
 * con `data-action` y `aria-label`; la escena no decide nada: el parent
 * engancha sus manejadores reales sobre esos `data-action` (contrato, pista,
 * bitácora, probar, ensayo, cortar). No crea editor, cables, llaves, juicio
 * ni lógica; el parent monta el mecanismo real (`#canvas`) en `editorSlot` y
 * la pila real (`#stack-panel`) en `statusSlot`.
 *
 * Los slots finales del manifiesto llevan `data-status="final"` con
 * `data-asset` y `data-src` (`n4.background`, `n4.selectors`, `n4.levers`).
 * Los papeles usan los assets finales del taller
 * (`levels.01.contract|hint|log`: imagen + rótulo) y la columna decorativa
 * con fichas de muestra se eliminó: solo queda la pila real del parent.
 * La banda de mesa expone `keysSlot` (`data-slot="keys": carretes y
 * herramientas del parent) y `hudSlot` (`data-slot="hud"`: línea de estado
 * del parent); la escena no los llena.
 * Los selectores de la pila son diegéticos: dos grupos con rótulo visible
 * y tres posiciones cada uno (`data-stack-top="any|base|chip"`,
 * `data-stack-action="keep|push|pop"`) sobre la placa `n4.selectors`; el parent engancha `data-stack-*` en
 * `main.js` y la escena no decide nada.
 * En inmersivo el encabezado interno se retira (el título ya vive en el
 * header del shell). Los datos del nivel solo viajan por `textContent`,
 * nunca como marcas parseadas.
 */

import { createScissorsProp } from '../scissorsProp.js';

const ALARM_NOTE = 'Cualquier otra combinación deja la alarma encendida.';
const FALLBACK_KEYS = ['▲ Subir', '▼ Bajar'];

const ASSET_BACKGROUND = 'assets/levels/04/background.webp';
const ASSET_SELECTORS = 'assets/levels/04/selectors.svg';
const ASSET_LEVER_UP = 'assets/levels/04/lever-up.svg';
const ASSET_LEVER_DOWN = 'assets/levels/04/lever-down.svg';

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function markFinal(node, asset, src) {
  node.setAttribute('data-status', 'final');
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-src', src);
  return node;
}

function decorImage(src, className) {
  const node = make('img', className);
  node.setAttribute('src', src);
  node.setAttribute('alt', '');
  node.setAttribute('draggable', 'false');
  return node;
}

function keyLabels(level) {
  const keys = Array.isArray(level?.keys) ? level.keys : [];
  const labels = keys
    .map((entry) => (typeof entry?.label === 'string' ? entry.label : ''))
    .filter((label) => label !== '');
  if (labels.length === 0) {
    return [...FALLBACK_KEYS];
  }
  return labels.slice(0, 2);
}

function keyLine(level) {
  return keyLabels(level).join(' · ');
}

// La fase llega traducida desde el parent (`phaseWord()`), pero también se
// aceptan los códigos `repair`/`build`: el sello siempre habla español.
function phaseLabel(phase) {
  if (phase === 'build' || phase === 'Construcción') {
    return 'Construcción';
  }
  return 'Reparación';
}

function propButton(action, label, className) {
  const button = make('button', className);
  button.type = 'button';
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  return button;
}

/**
 * @param {object} options
 * @param {object} options.level Datos del nivel (se usan `keys` como texto).
 * @param {object} options.puzzle Datos de la fase (reservado para el parent; la escena no lo dibuja).
 * @param {string} options.phase Etiqueta de fase ('Reparación' | 'Construcción', o 'repair' | 'build').
 */
export function createLevelScene(options = {}) {
  const { level = {}, phase = 'Reparación' } = options;
  const seal = phaseLabel(phase);
  const assaultName = seal === 'Construcción' ? 'Asalto' : 'Ensayo';
  const assaultLabel = seal === 'Construcción' ? 'Lanzar el asalto' : 'Ejecutar el ensayo';

  const element = make('section', 'level-scene level-4');
  element.setAttribute('data-level', '4');
  element.setAttribute('aria-label', 'Tramoya del Teatro Municipal');

  // --- Fondo final (n4.background): la foto vive en el CSS, con el
  // terciopelo como fallback; el nodo solo traza el slot. ---
  const backdrop = make('div', 'l4-backdrop');
  backdrop.setAttribute('aria-hidden', 'true');
  markFinal(backdrop, 'n4.background', ASSET_BACKGROUND);
  const rail = make('div', 'l4-rail-top');
  const curtainLeft = make('div', 'l4-curtain is-left');
  const curtainRight = make('div', 'l4-curtain is-right');
  backdrop.append(rail, curtainLeft, curtainRight);

  // --- Luz cálida, mesa de trabajo y polvo de escenario (estructural) ---
  const light = make('div', 'l4-light');
  light.setAttribute('aria-hidden', 'true');
  const bench = make('div', 'l4-bench');
  bench.setAttribute('aria-hidden', 'true');
  const dust = make('div', 'l4-dust');
  dust.setAttribute('aria-hidden', 'true');

  // --- Cuerpo: placa + tramoya lateral, dentro del rig contenido ---
  const rig = make('div', 'l4-rig');
  const body = make('div', 'l4-body');

  const plateWrap = make('div', 'l4-plate-wrap');
  const plate = make('div', 'l4-plate');
  const rivets = make('div', 'l4-rivets');
  rivets.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 4; index += 1) {
    rivets.append(make('span', 'l4-rivet'));
  }

  const head = make('div', 'l4-head');
  const titles = make('div', 'l4-titles');
  const kicker = make('p', 'l4-kicker', 'Tramoya del teatro');
  const serial = make('p', 'l4-serial', 'Montacargas n.º 04');
  titles.append(kicker, serial);
  head.append(titles);

  const editorSlot = make('div', 'l4-editor-slot');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('aria-label', 'Placa del montacargas: aquí se monta el mecanismo real');

  // Leyenda compacta: título + una línea con las palancas. El texto completo
  // vive en el dock (stackHelp del parent) y en el `title` de la ficha.
  const legend = make('div', 'l4-legend');
  legend.setAttribute('aria-label', 'Cómo se lee un cable del montacargas');
  legend.setAttribute(
    'title',
    `Se lee: llave · qué hay arriba · qué hace. Cargar apila una ficha, soltar la saca y no tocar la deja igual. ${ALARM_NOTE}`,
  );
  const legendTitle = make('p', 'l4-legend-title', 'Cómo se lee un cable');
  const legendKeys = make('p', 'l4-legend-keys', keyLine(level));
  legend.append(legendTitle, legendKeys);

  // Estado sin franja: línea grabada sobre la placa, 14 px y contraste AA.
  const state = make('p', 'l4-seal', seal);

  plate.append(rivets, head, editorSlot, legend, state);
  plateWrap.append(plate);

  const column = make('aside', 'l4-column');
  column.setAttribute('aria-label', 'Tramoya lateral del montacargas');

  // Cuerda de prueba: se tira para probar la llave (diegético de `probe`).
  const probe = propButton('probe', 'Probar la llave', 'l4-probe');
  probe.append(make('span', 'l4-probe-cord'));
  probe.append(make('span', 'l4-probe-grip'));
  probe.append(make('span', 'l4-probe-tag', 'Probar'));

  // Palanca grande del escenario: el ensayo/asalto (diegético de `assault`).
  // Usa las dos láminas finales (n4.levers): en reposo se ve la palanca
  // arriba; al pasar el foco o activarla se ve abajo. Sin JS.
  const assault = propButton('assault', assaultLabel, 'l4-assault');
  markFinal(assault, 'n4.levers', `${ASSET_LEVER_UP}, ${ASSET_LEVER_DOWN}`);
  assault.append(decorImage(ASSET_LEVER_UP, 'l4-assault-up'));
  assault.append(decorImage(ASSET_LEVER_DOWN, 'l4-assault-down'));
  assault.append(make('span', 'l4-assault-tag', assaultName));

  // PROBAR y ENSAYO lado a lado: misma botonera, sin scroll en la columna.
  const leverRow = make('div', 'l4-lever-row');
  leverRow.append(probe, assault);

  // Selectores finales (n4.selectors): la placa con las seis posiciones de
  // la pila. Viven en la columna, debajo de la botonera PROBAR/ENSAYO, con
  // los dos grupos lado a lado para que entren sin scroll.
  // para que se vean sin scroll interno. Dos grupos diegéticos con rótulo
  // (arriba + acción); el parent engancha `data-stack-top` /
  // `data-stack-action` en main.js y re-sincroniza `is-active` y
  // `aria-pressed`. El default (`any`/`keep`, el estado inicial del taller)
  // ya sale marcado. Sin listeners.
  const selectors = make('div', 'l4-selectors');
  markFinal(selectors, 'n4.selectors', ASSET_SELECTORS);
  const dialPlate = make('div', 'l4-dial-plate');
  dialPlate.setAttribute('aria-hidden', 'true');
  selectors.append(dialPlate);
  const dialGroupsWrap = make('div', 'l4-dial-groups');
  const dialGroups = [
    ['Arriba de la pila', 'stack-top', 'any', [
      ['any', 'Arriba: da igual', 'Da igual'],
      ['base', 'Arriba: base', 'Base'],
      ['chip', 'Arriba: ficha', 'Ficha'],
    ]],
    ['Acción de la pila', 'stack-action', 'keep', [
      ['keep', 'Acción: no tocar', 'No tocar'],
      ['push', 'Acción: cargar', 'Cargar'],
      ['pop', 'Acción: soltar', 'Soltar'],
    ]],
  ];
  for (const [groupLabel, attr, selected, positions] of dialGroups) {
    const group = make('div', 'l4-dial-group');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', groupLabel);
    group.append(make('p', 'l4-dial-title', groupLabel));
    const row = make('div', 'l4-dial-row');
    for (const [value, label, name] of positions) {
      const dial = make('button', 'l4-dial');
      dial.type = 'button';
      dial.setAttribute(`data-${attr}`, value);
      dial.setAttribute('aria-label', label);
      const isDefault = value === selected;
      if (isDefault) {
        dial.className += ' is-active';
      }
      dial.setAttribute('aria-pressed', String(isDefault));
      dial.append(make('span', 'l4-dial-light'));
      dial.append(make('span', 'l4-dial-name', name));
      row.append(dial);
    }
    group.append(row);
    dialGroupsWrap.append(group);
  }
  selectors.append(dialGroupsWrap);

  const statusSlot = make('div', 'l4-status-slot');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-label', 'Pila del montacargas');
  statusSlot.setAttribute('aria-live', 'polite');

  column.append(leverRow, selectors, statusSlot);
  body.append(plateWrap, column);
  rig.append(body);

  // --- Banda de mesa: papeles y tijera a la izquierda, diales de la pila
  // en fila, carretes y herramientas del parent al centro-derecha
  // (`keysSlot`) y línea de estado del parent como último renglón
  // (`hudSlot`). Todo en flujo normal: nada se superpone ni se corta.
  const dock = make('div', 'l4-dock');
  const dockRow = make('div', 'l4-dock-row');

  // --- Papeles sobre la mesa: contrato, pista y bitácora con los assets
  // finales del taller (`levels.01.*`). Botones reales sin caja; el parent
  // engancha `openWorkshopDoc`. (El modal abierto sigue con papel CSS del parent.)
  const papers = make('ul', 'l4-papers');
  papers.setAttribute('aria-label', 'Papeles sobre la mesa');
  const paperDefs = [
    ['contract', 'Abrir contrato', 'Contrato', 'assets/levels/01/props/contract.webp', 'levels.01.contract'],
    ['hint', 'Pedir una pista', 'Pista', 'assets/levels/01/props/hint.webp', 'levels.01.hint'],
    ['log', 'Abrir la bitácora', 'Bitácora', 'assets/levels/01/props/log.webp', 'levels.01.log'],
  ];
  for (const [action, label, name, src, asset] of paperDefs) {
    const item = make('li', 'l4-paper-item');
    const paper = propButton(action, label, 'l4-paper');
    paper.append(markFinal(decorImage(src, 'l4-paper-sheet'), asset, src));
    paper.append(make('span', 'l4-paper-name', name));
    item.append(paper);
    papers.append(item);
  }

  // --- Tijera sobre la mesa (diegético de `cut`): el mismo prop
  // compartido del N1. `is-active` y `aria-pressed` los pone
  // `toggleScissors` del parent; acá solo se apoya el prop.
  const cut = createScissorsProp({
    className: 'l4-cut',
    nameClass: 'l4-cut-name',
  });

  const keysSlot = make('div', 'l4-keys-slot');
  keysSlot.setAttribute('data-slot', 'keys');
  keysSlot.setAttribute('aria-label', 'Carretes y herramientas');

  const hudSlot = make('div', 'l4-hud-slot');
  hudSlot.setAttribute('data-slot', 'hud');
  hudSlot.setAttribute('aria-label', 'Estado del taller');
  hudSlot.setAttribute('aria-live', 'polite');

  // Los diales viven en la columna, debajo de la botonera (donde se ven
  // bien); la banda queda con papeles, carretes centrados y tijera al lado.
  dockRow.append(papers, keysSlot, cut);
  dock.append(dockRow, hudSlot);

  element.append(backdrop, light, bench, dust, rig, dock);

  function dispose() {
    element.remove();
  }

  return {
    element,
    editorSlot,
    statusSlot,
    keysSlot,
    hudSlot,
    actions: ['contract', 'hint', 'log', 'probe', 'assault', 'cut'],
    dispose,
  };
}
