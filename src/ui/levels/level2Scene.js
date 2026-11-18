/**
 * Escena del nivel 2 — Hotel Mirador, sala de máquinas del ascensor.
 *
 * Solo construye el marco art déco (fondo de níquel y latón, mesa de
 * nogal, luz cálida, indicador de pisos, placa con relés y piñón de
 * bucle como adornos). No crea editor, cables, llaves, juicio ni
 * lógica: el parent monta el tablero de cables real en `editorSlot`
 * y la señal de fase en `statusSlot`.
 *
 * Los dibujos provisorios quedaron atrás: fondo, indicador de pisos,
 * piñón y relés usan los finales de `assets/manifest.json`
 * (`levels.02.background`, `levels.02.floorIndicator`, `levels.02.pinion`,
 * `shared.prop.relay`). Cada slot final lleva `data-asset` con su slot
 * del manifiesto, `data-status="final"` y `data-src` con la ruta usada.
 * No quedan slots pendientes en la escena.
 * Vocabulario de taller en los textos visibles: sin términos académicos.
 */

const PHASE_WORDS = { repair: 'Reparación', build: 'Construcción' };

function markFinal(node, asset, src) {
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'final');
  node.setAttribute('data-src', src);
  return node;
}

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

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
    node.setAttribute('class', className);
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/**
 * Indicador de pisos. Adorno de la sala: no se mueve con el juego;
 * el recorrido real lo muestra el tablero del parent.
 */
function buildGauge() {
  const figure = make('figure', 'l2-gauge');
  figure.setAttribute('aria-label', 'Indicador de pisos (adorno del taller)');
  markFinal(figure, 'levels.02.floorIndicator', 'assets/levels/02/floor-indicator.svg');
  const img = make('img', 'l2-gauge-img');
  img.setAttribute('src', 'assets/levels/02/floor-indicator.svg');
  img.setAttribute('alt', '');
  const caption = make('figcaption', 'l2-gauge-caption', 'Pisos');
  figure.append(img, caption);
  return figure;
}

/**
 * Piñón de bucle decorativo. El piñón real del juego lo dibuja el tablero;
 * este solo viste la placa.
 */
function buildPinion() {
  const img = make('img', 'l2-pinion-img');
  img.setAttribute('src', 'assets/levels/02/pinion.webp');
  img.setAttribute('alt', '');
  img.setAttribute('aria-hidden', 'true');
  return img;
}

function buildRelay(name) {
  const relay = make('div', 'l2-relay');
  markFinal(relay, 'shared.prop.relay', 'assets/shared/props/relay.webp');
  const img = make('img', 'l2-relay-img');
  img.setAttribute('src', 'assets/shared/props/relay.webp');
  img.setAttribute('alt', '');
  const visor = make('div', 'l2-relay-visor');
  const tag = make('span', 'l2-relay-tag', name);
  relay.append(img, visor, tag);
  return relay;
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

  const element = make('section', 'level-scene l2-scene');
  element.setAttribute('data-level', '2');
  element.setAttribute('aria-label', `${client}: sala de máquinas. ${title}.`);

  const background = make('div', 'l2-background');
  background.setAttribute('aria-hidden', 'true');
  markFinal(background, 'levels.02.background', 'assets/levels/02/background.webp');

  const light = make('div', 'l2-light');
  light.setAttribute('aria-hidden', 'true');

  const bench = make('div', 'l2-bench');
  bench.setAttribute('aria-hidden', 'true');

  const room = make('div', 'l2-room');

  const top = make('div', 'l2-top');
  const gauge = buildGauge();
  const heading = make('div', 'l2-heading');
  const kicker = make('p', 'l2-kicker', `Contrato ${contract} · ${client}`);
  const titleNode = make('h2', 'l2-title', 'La sala de máquinas');
  const phaseBadge = make('p', 'l2-phase', word);
  heading.append(kicker, titleNode, phaseBadge);
  top.append(gauge, heading);

  const plate = make('div', 'l2-plate');
  const plateLabel = make('p', 'l2-plate-label', `${client} · Sala ${contract}`);
  const plateSerial = make('p', 'l2-plate-serial', 'N.º 0201');
  const seal = make('p', 'l2-plate-seal', `En ${word.toLowerCase()}`);
  seal.setAttribute('aria-label', `Sello de fase: ${word}`);
  const editorSlot = make('div', 'l2-editor-slot');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('aria-label', 'Mecanismo: el tablero de cables se monta aquí');

  const props = make('div', 'l2-props');
  props.setAttribute('aria-hidden', 'true');
  props.append(buildRelay('Cerrada'), buildRelay('Abierta'));
  const pinion = make('div', 'l2-pinion');
  markFinal(pinion, 'levels.02.pinion', 'assets/levels/02/pinion.webp');
  pinion.setAttribute('aria-hidden', 'true');
  pinion.append(buildPinion());

  const caption = make(
    'p',
    'l2-caption',
    'Fondo, indicador, piñón y relés finales de la sala.',
  );
  plate.append(plateLabel, plateSerial, seal, editorSlot, pinion, caption);

  const statusSlot = make('div', 'l2-status');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-live', 'polite');
  statusSlot.setAttribute('aria-label', 'Marcha de la sala');
  const statusText = make('p', 'l2-status-text', `Fase: ${word}`);
  statusSlot.append(statusText, props);

  room.append(top, plate, statusSlot);
  element.append(background, light, bench, room);

  function dispose() {
    if (typeof element.remove === 'function') {
      element.remove();
    } else if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    editorSlot.replaceChildren();
    statusSlot.replaceChildren();
  }

  return { element, editorSlot, statusSlot, dispose };
}
