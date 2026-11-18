/**
 * Escena del nivel 2 — Hotel Mirador, sala de máquinas del ascensor.
 *
 * Solo construye el marco art déco (fondo de níquel y latón, mesa de
 * nogal, luz cálida, indicador de pisos, placa con relés y piñón de
 * bucle como adornos). No crea editor, cables, llaves, juicio ni
 * lógica: el parent monta el tablero de cables real en `editorSlot`
 * y la señal de fase en `statusSlot`.
 *
 * Los dibujos son placeholders en CSS/SVG; los finales están a producir
 * según `docs/ASSET-MANIFEST.md` (n2.*). Cada placeholder lleva
 * `data-asset` con su slot del manifiesto y `data-status="a producir"`.
 * Vocabulario de taller en los textos visibles: sin términos académicos.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

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

function makeSvg(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, String(value));
  }
  return node;
}

function markPending(node, asset) {
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'a producir');
  return node;
}

/**
 * Indicador de pisos semicircular. Adorno de la sala: la aguja no se mueve
 * con el juego; el recorrido real lo muestra el tablero del parent.
 */
function buildGauge() {
  const figure = make('figure', 'l2-gauge');
  markPending(figure, 'n2.floorIndicator');
  const svg = makeSvg('svg', {
    class: 'l2-gauge-svg',
    viewBox: '0 0 200 118',
    role: 'img',
    'aria-label': 'Indicador de pisos (adorno del taller)',
  });
  svg.append(makeSvg('path', {
    class: 'l2-gauge-arc',
    d: 'M 18 104 A 82 82 0 0 1 182 104',
    fill: 'none',
  }));
  for (const [x, label] of [[18, 'Baja'], [100, '1'], [182, '2']]) {
    const tick = makeSvg('line', {
      class: 'l2-gauge-tick',
      x1: x,
      y1: 104,
      x2: x,
      y2: 92,
    });
    svg.append(tick);
    const caption = makeSvg('text', {
      class: 'l2-gauge-label',
      x,
      y: 84,
      'text-anchor': 'middle',
    });
    caption.textContent = label;
    svg.append(caption);
  }
  const needle = makeSvg('line', {
    class: 'l2-gauge-needle',
    x1: 100,
    y1: 104,
    x2: 100,
    y2: 40,
  });
  svg.append(needle);
  const hub = makeSvg('circle', { class: 'l2-gauge-hub', cx: 100, cy: 104, r: 7 });
  svg.append(hub);
  const caption = make('figcaption', 'l2-gauge-caption', 'Pisos');
  figure.append(svg, caption);
  return figure;
}

/**
 * Piñón de bucle decorativo. El piñón real del juego lo dibuja el tablero;
 * este solo viste la placa.
 */
function buildPinion() {
  const svg = makeSvg('svg', {
    class: 'l2-pinion-svg',
    viewBox: '0 0 96 96',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  for (let index = 0; index < 8; index += 1) {
    const tooth = makeSvg('rect', {
      class: 'l2-pinion-tooth',
      x: 43,
      y: 4,
      width: 10,
      height: 16,
      rx: 2,
      transform: `rotate(${index * 45} 48 48)`,
    });
    svg.append(tooth);
  }
  svg.append(makeSvg('circle', { class: 'l2-pinion-body', cx: 48, cy: 48, r: 32 }));
  svg.append(makeSvg('circle', { class: 'l2-pinion-hub', cx: 48, cy: 48, r: 10 }));
  return svg;
}

function buildRelay(name) {
  const relay = make('div', 'l2-relay');
  markPending(relay, 'n2.relay');
  const visor = make('div', 'l2-relay-visor');
  const tag = make('span', 'l2-relay-tag', name);
  relay.append(visor, tag);
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
  markPending(background, 'n2.background');

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
  markPending(pinion, 'n2.pinion');
  pinion.setAttribute('aria-hidden', 'true');
  pinion.append(buildPinion());

  const caption = make(
    'p',
    'l2-caption',
    'Fondo, indicador y piñón en dibujo provisorio — a producir.',
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
