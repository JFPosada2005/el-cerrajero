/**
 * Escena del nivel 4 — Teatro Municipal (tramoya del montacargas).
 *
 * Solo decorado: terciopelo granate, mesa de trabajo, placa de latón,
 * columna de contrapesos (fichas/base), selectores y palancas. No crea
 * editor, cables, llaves, juicio ni lógica; el parent monta el mecanismo
 * real (`#canvas`) en `editorSlot` y la pila real (`#stack-panel`) en
 * `statusSlot`, y conserva los botones y selectores verdaderos.
 *
 * Los slots finales llevan `data-status="final"` con `data-asset` y
 * `data-src` (`n4.background`, `n4.selectors`, `n4.levers`). Las fichas y
 * la base de muestra de la columna siguen como placeholders
 * (`data-placeholder="a-producir"`, `data-status="a producir"`); la pila
 * real que monta el parent se viste por CSS. Los datos del nivel solo
 * viajan por `textContent`, nunca como marcas parseadas.
 */

const ALARM_NOTE = 'Cualquier otra combinación deja la alarma encendida.';
const KEY_FALLBACK = '▲ Subir · ▼ Bajar';
const LEVER_FALLBACK = ['▲ Subir', '▼ Bajar'];

// Slots finales del manifiesto (docs/ASSET-MANIFEST.md §N4): fondo,
// selectores y palancas. Las fichas y la base de la columna siguen como
// muestra a producir; la pila real se viste por CSS en level4.css.
const ASSET_BACKGROUND = 'assets/levels/04/background.webp';
const ASSET_SELECTORS = 'assets/levels/04/selectors.svg';
const ASSET_LEVERS = ['assets/levels/04/lever-up.svg', 'assets/levels/04/lever-down.svg'];

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

function markPlaceholder(node, asset) {
  node.setAttribute('data-placeholder', 'a-producir');
  node.setAttribute('data-status', 'a producir');
  node.setAttribute('data-asset', asset);
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
    return [...LEVER_FALLBACK];
  }
  return labels.slice(0, 2);
}

function keyLine(level) {
  return keyLabels(level).join(' · ');
}

/**
 * @param {object} options
 * @param {object} options.level Datos del nivel (se usan `keys` como texto).
 * @param {object} options.puzzle Datos de la fase (reservado para el parent; la escena no lo dibuja).
 * @param {string} options.phase Etiqueta de fase ya traducida ('Reparación' | 'Construcción').
 */
export function createLevelScene(options = {}) {
  const { level = {}, phase = 'Reparación' } = options;

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

  // --- Luz cálida y mesa de trabajo (CSS estructural, sin asset) ---
  const light = make('div', 'l4-light');
  light.setAttribute('aria-hidden', 'true');
  const bench = make('div', 'l4-bench');
  bench.setAttribute('aria-hidden', 'true');

  // --- Cuerpo: placa + columna, dentro del rig contenido ---
  const rig = make('div', 'l4-rig');
  const body = make('div', 'l4-body');

  const plateWrap = make('div', 'l4-plate-wrap');
  const plate = make('div', 'l4-plate');
  const rivets = make('div', 'l4-rivets');
  rivets.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 4; index += 1) {
    rivets.append(make('span', 'l4-rivet'));
  }

  // Cabecera compacta: títulos + palancas en una sola fila.
  const head = make('div', 'l4-head');
  const titles = make('div', 'l4-titles');
  const kicker = make('p', 'l4-kicker', 'Tramoya del teatro');
  const serial = make('p', 'l4-serial', 'Montacargas n.º 04');
  titles.append(kicker, serial);

  // Palancas finales de las llaves (n4.levers: lever-up/lever-down según
  // la posición: subir/bajar). Láminas decorativas, sin botones ni listeners.
  // La leyenda de abajo expone los mismos nombres al lector de pantalla.
  const levers = make('div', 'l4-levers');
  levers.setAttribute('aria-hidden', 'true');
  markFinal(levers, 'n4.levers', ASSET_LEVERS.join(', '));
  keyLabels(level).forEach((label, index) => {
    const lever = make('div', 'l4-lever');
    lever.append(decorImage(ASSET_LEVERS[index % ASSET_LEVERS.length], 'l4-lever-icon'));
    lever.append(make('span', 'l4-lever-tag', label));
    levers.append(lever);
  });
  head.append(titles, levers);

  const editorSlot = make('div', 'l4-editor-slot');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('aria-label', 'Placa del montacargas: aquí se monta el mecanismo real');
  const seal = make('span', 'l4-seal', String(phase));

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

  plate.append(rivets, head, editorSlot, legend, seal);
  plateWrap.append(plate);

  const column = make('aside', 'l4-column');
  column.setAttribute('aria-label', 'Columna de contrapesos del montacargas');

  const counterweights = make('div', 'l4-counterweights');
  counterweights.setAttribute('aria-hidden', 'true');
  const cord = make('span', 'l4-cord');
  counterweights.append(cord);
  for (let index = 0; index < 3; index += 1) {
    const chip = make('span', 'l4-chip', 'ficha');
    markPlaceholder(chip, 'n4.chip');
    counterweights.append(chip);
  }
  const base = make('span', 'l4-base', 'base');
  markPlaceholder(base, 'n4.stackBase');
  counterweights.append(base);

  // Selectores finales (n4.selectors): una lámina decorativa en lugar de
  // los diales. El contenedor queda fuera de lectores y la imagen sin texto.
  const selectors = make('div', 'l4-selectors');
  selectors.setAttribute('aria-hidden', 'true');
  markFinal(selectors, 'n4.selectors', ASSET_SELECTORS);
  selectors.append(decorImage(ASSET_SELECTORS, 'l4-selectors-img'));

  const statusSlot = make('div', 'l4-status-slot');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-label', 'Pila del montacargas');
  statusSlot.setAttribute('aria-live', 'polite');

  column.append(counterweights, selectors, statusSlot);
  body.append(plateWrap, column);

  const note = make(
    'p',
    'l4-note',
    'Decorado de tramoya: fondo, selectores y palancas del teatro; fichas y base de muestra a producir.',
  );

  rig.append(body, note);

  element.append(backdrop, light, bench, rig);

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot, dispose };
}
