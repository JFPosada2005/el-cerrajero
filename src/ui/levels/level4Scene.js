/**
 * Escena del nivel 4 — Teatro Municipal (tramoya del montacargas).
 *
 * Solo decorado: terciopelo granate, latón, columna de contrapesos
 * (fichas/base) y selectores. No crea editor, cables, llaves, juicio
 * ni lógica; el parent monta el editor real en `editorSlot` y la pila
 * real en `statusSlot`.
 *
 * Los placeholders visuales llevan `data-placeholder="a-producir"` y
 * `data-asset` con el slot de `docs/ASSET-MANIFEST.md`. Los datos del
 * nivel solo viajan por `textContent`, nunca por `innerHTML`.
 */

const ALARM_NOTE = 'Cualquier otra combinación deja la alarma encendida.';
const KEY_FALLBACK = '▲ Subir · ▼ Bajar';

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
  node.setAttribute('data-asset', asset);
  return node;
}

function keyLine(level) {
  const keys = Array.isArray(level?.keys) ? level.keys : [];
  const labels = keys
    .map((entry) => (typeof entry?.label === 'string' ? entry.label : ''))
    .filter((label) => label !== '');
  if (labels.length === 0) {
    return KEY_FALLBACK;
  }
  return labels.join(' · ');
}

/**
 * @param {object} options
 * @param {object} options.level Datos del nivel (se usan `keys` y `client` como texto).
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
  const curtainLeft = make('div', 'l4-curtain is-left');
  const curtainRight = make('div', 'l4-curtain is-right');
  const rail = make('div', 'l4-rail-top');
  backdrop.append(rail, curtainLeft, curtainRight);

  // --- Cuerpo: placa + columna ---
  const body = make('div', 'l4-body');

  const plateWrap = make('div', 'l4-plate-wrap');
  const plate = make('div', 'l4-plate');
  const kicker = make('p', 'l4-kicker', 'Tramoya del teatro');
  const serial = make('p', 'l4-serial', 'Montacargas n.º 04');
  const editorSlot = make('div', 'l4-editor-slot');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('aria-label', 'Placa del montacargas: aquí se monta el mecanismo real');
  const seal = make('span', 'l4-seal', String(phase));

  const legend = make('div', 'l4-legend');
  legend.setAttribute('aria-label', 'Cómo se lee un cable del montacargas');
  const legendTitle = make('p', 'l4-legend-title', 'Cómo se lee un cable');
  const legendKeys = make('p', 'l4-legend-keys', keyLine(level));
  const legendRead = make('p', 'l4-legend-line', 'Se lee: llave · qué hay arriba · qué hace.');
  const legendStack = make(
    'p',
    'l4-legend-line',
    'Cargar apila una ficha, soltar la saca y no tocar la deja igual.',
  );
  const legendNote = make('p', 'l4-legend-note', ALARM_NOTE);
  legend.append(legendTitle, legendKeys, legendRead, legendStack, legendNote);

  plate.append(kicker, serial, editorSlot, legend, seal);
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
    'Decorado de tramoya: fondo, fichas, base y selectores son placeholders a producir.',
  );

  element.append(backdrop, body, note);

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot, dispose };
}
