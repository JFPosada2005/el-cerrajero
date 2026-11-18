/**
 * Escena del nivel 4 — Teatro Municipal (tramoya del montacargas).
 *
 * Solo decorado: terciopelo granate, mesa de trabajo, placa de latón,
 * columna de contrapesos (fichas/base), selectores y palancas. No crea
 * editor, cables, llaves, juicio ni lógica; el parent monta el mecanismo
 * real (`#canvas`) en `editorSlot` y la pila real (`#stack-panel`) en
 * `statusSlot`, y conserva los botones y selectores verdaderos.
 *
 * Los placeholders visuales llevan `data-placeholder="a-producir"`,
 * `data-status="a producir"` y `data-asset` con el slot de
 * `docs/ASSET-MANIFEST.md`. Los datos del nivel solo viajan por
 * `textContent`, nunca como marcas parseadas.
 */

const ALARM_NOTE = 'Cualquier otra combinación deja la alarma encendida.';
const KEY_FALLBACK = '▲ Subir · ▼ Bajar';
const LEVER_FALLBACK = ['▲ Subir', '▼ Bajar'];

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

  // --- Fondo: terciopelo granate (placeholder a producir) ---
  const backdrop = make('div', 'l4-backdrop');
  backdrop.setAttribute('aria-hidden', 'true');
  markPlaceholder(backdrop, 'n4.background');
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

  // Palancas decorativas de las llaves (placeholder a producir: n4.levers).
  // La leyenda de abajo expone los mismos nombres al lector de pantalla.
  const levers = make('div', 'l4-levers');
  levers.setAttribute('aria-hidden', 'true');
  markPlaceholder(levers, 'n4.levers');
  for (const label of keyLabels(level)) {
    const lever = make('div', 'l4-lever');
    lever.append(make('span', 'l4-lever-handle'));
    lever.append(make('span', 'l4-lever-tag', label));
    levers.append(lever);
  }
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

  const selectors = make('div', 'l4-selectors');
  selectors.setAttribute('role', 'img');
  selectors.setAttribute(
    'aria-label',
    'Selectores de la pila (placeholder a producir): si arriba hay y acción',
  );
  markPlaceholder(selectors, 'n4.selectors');
  for (const [title, optionsText] of [
    ['Si arriba hay', 'Da igual · Base · Ficha'],
    ['Acción', 'No tocar · Cargar · Soltar'],
  ]) {
    const dial = make('div', 'l4-dial');
    dial.setAttribute('aria-hidden', 'true');
    const dialTitle = make('span', 'l4-dial-title', title);
    const dialFace = make('span', 'l4-dial-face');
    const needle = make('span', 'l4-dial-needle');
    dialFace.append(needle);
    const dialOptions = make('span', 'l4-dial-options', optionsText);
    dial.append(dialTitle, dialFace, dialOptions);
    selectors.append(dial);
  }

  const statusSlot = make('div', 'l4-status-slot');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-label', 'Pila del montacargas');
  statusSlot.setAttribute('aria-live', 'polite');

  column.append(counterweights, selectors, statusSlot);
  body.append(plateWrap, column);

  const note = make(
    'p',
    'l4-note',
    'Decorado de tramoya: fondo, fichas, base, selectores y palancas son placeholders a producir.',
  );

  rig.append(body, note);

  element.append(backdrop, light, bench, rig);

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot, dispose };
}
