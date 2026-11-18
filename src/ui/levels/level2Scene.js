/**
 * Escena del nivel 2 — Hotel Mirador, sala de máquinas del ascensor.
 *
 * Solo decorado interactivo a pantalla completa: fondo de níquel y latón,
 * mesa de nogal, luz cálida, indicador de pisos, placa con relés y piñón,
 * palanca de llamada, papeles y tijera sobre la mesa. Cada prop accionable
 * es un `<button type="button">` real con `data-action` y `aria-label`;
 * la escena no decide nada: el parent engancha sus manejadores reales
 * sobre esos `data-action`. No crea editor, cables, llaves, juicio ni
 * lógica: el parent monta el tablero de cables real en `editorSlot`, la
 * paleta de carretes y las herramientas en `keysSlot` y la línea de
 * marcha en `hudSlot` (el shell inmersivo ya no dibuja rack ni línea).
 *
 * La banda de mesa ordena papeles a la izquierda, `keysSlot` al
 * centro-derecha y `hudSlot` como último renglón; la placa no supera el
 * 65 % del ancho para no tapar la banda.
 *
 * Finales de `assets/manifest.json`: `levels.02.background`,
 * `levels.02.floorIndicator`, `levels.02.pinion`, `shared.prop.relay`
 * y `levels.01.contract|hint|log` (papeles de la mesa).
 * Cada slot final lleva `data-asset` con su slot del manifiesto,
 * `data-status="final"` y `data-src` con la ruta usada. La palanca y
 * la tijera no tienen asset final (P1 pendiente): se dibujan con CSS
 * marfil/latón y llevan `data-status="placeholder"`, sin texto visible.
 * Vocabulario de taller en los textos visibles: sin términos académicos.
 */

const PHASE_WORDS = { repair: 'Reparación', build: 'Construcción' };

const DEFAULTS = {
  contract: '02',
  title: 'El ascensor',
  client: 'Hotel Mirador',
};

function shield(value, fallback) {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function phaseWord(phase) {
  if (phase === 'build' || phase === 'Construcción') {
    return PHASE_WORDS.build;
  }
  return PHASE_WORDS.repair;
}

function el(tag, className, text) {
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
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'final');
  node.setAttribute('data-src', src);
  return node;
}

function markPlaceholder(node) {
  node.setAttribute('data-status', 'placeholder');
  return node;
}

function propButton(action, label, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  return button;
}

/**
 * Indicador de pisos. Es el control de prueba: tocarlo hace la prueba.
 * Vive en la banda de mesa y en escritorio ancho se ancla al borde de
 * la placa, junto al mecanismo. El recorrido real lo muestra el
 * tablero del parent.
 */
function buildProbe() {
  const button = propButton('probe', 'Probar la llave en el indicador de pisos', 'l2-probe');
  const figure = el('figure', 'l2-gauge');
  figure.setAttribute('aria-hidden', 'true');
  markFinal(figure, 'levels.02.floorIndicator', 'assets/levels/02/floor-indicator.svg');
  const img = el('img', 'l2-gauge-img');
  img.setAttribute('src', 'assets/levels/02/floor-indicator.svg');
  img.setAttribute('alt', '');
  img.setAttribute('draggable', 'false');
  const caption = el('figcaption', 'l2-gauge-caption', 'Pisos');
  figure.append(img, caption);
  button.append(figure);
  const name = el('span', 'l2-prop-name', 'Probar');
  button.append(name);
  return button;
}

/**
 * Palanca de llamada del ascensor. Es el control de ensayo: tirar de ella
 * pide el ensayo (o lanza el asalto, según la fase).
 */
function buildLever(phase) {
  const assault = phaseWord(phase) === PHASE_WORDS.build;
  const button = propButton(
    'assault',
    assault ? 'Lanzar el asalto' : 'Pedir el ensayo',
    'l2-lever',
  );
  const visual = el('span', 'l2-lever-visual');
  visual.setAttribute('aria-hidden', 'true');
  markPlaceholder(visual);
  const track = el('span', 'l2-lever-track');
  track.setAttribute('aria-hidden', 'true');
  const knob = el('span', 'l2-lever-knob');
  knob.setAttribute('aria-hidden', 'true');
  visual.append(track, knob);
  const name = el('span', 'l2-prop-name', assault ? 'Asalto' : 'Ensayo');
  button.append(visual, name);
  return button;
}

/**
 * Papel sobre la mesa con su asset final (`assets/levels/01/props/*`,
 * slots `levels.01.contract|hint|log` del manifiesto). El rótulo va
 * debajo de la imagen, como antes.
 */
function buildPaper(action, label, name, src, asset) {
  const item = el('li', 'l2-paper-item');
  const button = propButton(action, label, `l2-paper l2-paper--${action}`);
  const img = el('img', 'l2-paper-img');
  img.setAttribute('src', src);
  img.setAttribute('alt', '');
  img.setAttribute('draggable', 'false');
  markFinal(img, asset, src);
  const paperName = el('span', 'l2-prop-name', name);
  button.append(img, paperName);
  item.append(button);
  return item;
}

/**
 * Tijera sobre la mesa dibujada con CSS (sin asset final). `is-active`
 * marca el modo corte, como en el N1.
 */
function buildScissors() {
  const button = propButton('cut', 'Cortar un cable', 'l2-scissors');
  const visual = el('span', 'l2-scissors-visual');
  visual.setAttribute('aria-hidden', 'true');
  markPlaceholder(visual);
  const bladeUp = el('span', 'l2-scissors-blade l2-scissors-blade--up');
  bladeUp.setAttribute('aria-hidden', 'true');
  const bladeDown = el('span', 'l2-scissors-blade l2-scissors-blade--down');
  bladeDown.setAttribute('aria-hidden', 'true');
  const ringUp = el('span', 'l2-scissors-ring l2-scissors-ring--up');
  ringUp.setAttribute('aria-hidden', 'true');
  const ringDown = el('span', 'l2-scissors-ring l2-scissors-ring--down');
  ringDown.setAttribute('aria-hidden', 'true');
  visual.append(bladeUp, bladeDown, ringUp, ringDown);
  const name = el('span', 'l2-prop-name', 'Tijera');
  button.append(visual, name);
  return button;
}

/**
 * Lámpara de relé sobre la placa. Adorno con su visor: la marcha real la
 * muestra el tablero del parent.
 */
function buildRelay(name) {
  const relay = el('div', 'l2-relay');
  markFinal(relay, 'shared.prop.relay', 'assets/shared/props/relay.webp');
  const img = el('img', 'l2-relay-img');
  img.setAttribute('src', 'assets/shared/props/relay.webp');
  img.setAttribute('alt', '');
  img.setAttribute('draggable', 'false');
  const visor = el('div', 'l2-relay-visor');
  const tag = el('span', 'l2-relay-tag', name);
  relay.append(img, visor, tag);
  return relay;
}

/**
 * Piñón de bucle decorativo. El piñón real del juego lo dibuja el tablero;
 * este solo viste la placa.
 */
function buildPinion() {
  const pinion = el('div', 'l2-pinion');
  pinion.setAttribute('aria-hidden', 'true');
  markFinal(pinion, 'levels.02.pinion', 'assets/levels/02/pinion.webp');
  const img = el('img', 'l2-pinion-img');
  img.setAttribute('src', 'assets/levels/02/pinion.webp');
  img.setAttribute('alt', '');
  img.setAttribute('draggable', 'false');
  pinion.append(img);
  return pinion;
}

/**
 * @param {object} options
 * @param {object} [options.level] Datos del nivel (contrato, título, cliente).
 * @param {object} [options.puzzle] Datos de la fase (no se usan para lógica).
 * @param {string} [options.phase] 'repair' | 'build' (etiqueta del taller).
 */
export function createLevelScene(options = {}) {
  const { level = {}, puzzle = {}, phase = 'repair' } = options;
  void puzzle;
  const contract = shield(level.contract, DEFAULTS.contract);
  const title = shield(level.title, DEFAULTS.title);
  const client = shield(level.client, DEFAULTS.client);
  const word = phaseWord(phase);

  const element = el('section', 'level-scene l2-scene');
  element.setAttribute('data-level', '2');
  element.setAttribute('aria-label', `${client}: sala de máquinas. ${title}.`);

  const background = el('div', 'l2-background');
  background.setAttribute('aria-hidden', 'true');
  markFinal(background, 'levels.02.background', 'assets/levels/02/background.webp');

  const light = el('div', 'l2-light');
  light.setAttribute('aria-hidden', 'true');

  const bench = el('div', 'l2-bench');
  bench.setAttribute('aria-hidden', 'true');

  element.append(background, light, bench);

  const plate = el('div', 'l2-plate');
  plate.append(el('p', 'l2-plate-label', `${client} · Sala ${contract}`));
  plate.append(el('p', 'l2-plate-serial', 'N.º 0201'));
  const seal = el('p', 'l2-plate-seal', `En ${word.toLowerCase()}`);
  seal.setAttribute('aria-label', `Sello de fase: ${word}`);
  plate.append(seal);

  const editorSlot = el('div', 'l2-editor-slot');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('role', 'group');
  editorSlot.setAttribute('aria-label', 'Mecanismo del ascensor: el tablero de cables se monta aquí');
  plate.append(editorSlot);

  const props = el('div', 'l2-props');
  props.setAttribute('aria-hidden', 'true');
  props.append(buildRelay('Cerrada'), buildRelay('Abierta'));
  plate.append(props, buildPinion());

  const statusSlot = null;

  const keysSlot = el('div', 'l2-keys');
  keysSlot.setAttribute('data-slot', 'keys');
  keysSlot.setAttribute('role', 'group');
  keysSlot.setAttribute('aria-label', 'Carretes del taller: la paleta y las herramientas se montan aquí');

  const hudSlot = el('div', 'l2-hud');
  hudSlot.setAttribute('data-slot', 'hud');
  hudSlot.setAttribute('aria-live', 'polite');
  hudSlot.setAttribute('aria-label', 'Marcha de la sala');

  element.append(plate);

  const papers = el('ul', 'l2-papers');
  papers.setAttribute('aria-label', 'Papeles sobre la mesa');
  papers.append(buildPaper('contract', 'Abrir contrato', 'Contrato', 'assets/levels/01/props/contract.webp', 'levels.01.contract'));
  papers.append(buildPaper('hint', 'Pedir una pista', 'Pista', 'assets/levels/01/props/hint.webp', 'levels.01.hint'));
  papers.append(buildPaper('log', 'Abrir la bitácora', 'Bitácora', 'assets/levels/01/props/log.webp', 'levels.01.log'));

  const band = el('div', 'l2-band');
  band.setAttribute('aria-label', 'Mesa de trabajo');
  band.append(papers, buildProbe(), keysSlot, buildScissors(), buildLever(phase));
  element.append(band, hudSlot);

  function dispose() {
    element.remove();
  }

  return {
    element,
    editorSlot,
    keysSlot,
    hudSlot,
    statusSlot,
    actions: ['contract', 'hint', 'log', 'probe', 'assault', 'cut'],
    dispose,
  };
}
