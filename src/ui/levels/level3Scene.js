// El Cerrajero — escena del nivel 3 (Museo del Llano).
//
// Aporta fondo, mesa, placa, utilería y decoración. No crea el editor
// real (el parent monta el #canvas en `editorSlot`), ni cables, llaves,
// juicio o lógica. Las alas de día/noche y los glifos de bifurcador y
// resorte usan los assets finales del manifiesto (`data-status="final"`
// con `data-asset` + `data-src`); la lámpara (`levels.03.lamp`, missing)
// sigue como placeholder CSS/SVG con `data-status="a producir"`.

const SVG_NS = 'http://www.w3.org/2000/svg';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  return element;
}

function svgNode(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function markPlaceholder(element, asset) {
  element.setAttribute('data-asset', asset);
  element.setAttribute('data-status', 'a producir');
  element.setAttribute('data-todo', 'a producir');
}

// Slot integrado con asset final: conserva el slot del manifiesto y la
// ruta usada para trazabilidad. `src` va en relativo al documento
// (`assets/...`), como consume el manifiesto.
function markFinal(element, asset, src) {
  element.setAttribute('data-asset', asset);
  element.setAttribute('data-status', 'final');
  element.setAttribute('data-src', src);
}

function phaseWord(phase) {
  if (phase === 'build' || phase === 'Construcción' || phase === 'construccion') {
    return 'Construcción';
  }
  return 'Reparación';
}

function phaseId(phase) {
  if (phase === 'build' || phase === 'Construcción' || phase === 'construccion') {
    return 'build';
  }
  return 'repair';
}

// Glifo del bifurcador: derivación en "Y" de latón con bocas de contacto.
function forkGlyph() {
  const svg = svgNode('svg', {
    viewBox: '0 0 24 28',
    class: 'museum-glyph-art',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(svgNode('path', {
    d: 'M12 4 L12 14 M12 14 L5 24 M12 14 L19 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.4',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }));
  svg.append(svgNode('circle', { cx: '12', cy: '14', r: '2.2', fill: 'currentColor' }));
  for (const [cx, cy] of [['12', '4'], ['5', '24'], ['19', '24']]) {
    svg.append(svgNode('circle', {
      cx, cy, r: '2.6', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6',
    }));
  }
  return svg;
}

// Glifo del resorte: muelle en zigzag punteado con topes, sin llave.
function springGlyph() {
  const svg = svgNode('svg', {
    viewBox: '0 0 48 16',
    class: 'museum-glyph-art',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(svgNode('path', {
    d: 'M6 8 L11 2 L17 14 L23 2 L29 14 L35 2 L41 8',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-dasharray': '3 2',
  }));
  svg.append(svgNode('circle', { cx: '4', cy: '8', r: '2.2', fill: 'currentColor' }));
  svg.append(svgNode('circle', { cx: '44', cy: '8', r: '2.2', fill: 'currentColor' }));
  return svg;
}

// Lámpara de sala: campana + halo. Placeholder del asset final.
function lampFigure(variant) {
  const figure = node('div', `museum-lamp museum-lamp--${variant}`);
  const svg = svgNode('svg', {
    viewBox: '0 0 40 52',
    class: 'museum-lamp-art',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(svgNode('line', {
    x1: '20', y1: '0', x2: '20', y2: '10',
    stroke: 'currentColor', 'stroke-width': '2',
  }));
  svg.append(svgNode('path', {
    d: 'M10 26 L20 10 L30 26 Z',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linejoin': 'round',
  }));
  svg.append(svgNode('circle', {
    cx: '20', cy: '34', r: '6',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
  }));
  svg.append(svgNode('circle', {
    cx: '20', cy: '34', r: '11',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.2',
    opacity: '0.35',
  }));
  svg.append(svgNode('circle', {
    cx: '20', cy: '10', r: '1.8',
    fill: 'currentColor',
  }));
  svg.append(svgNode('line', {
    x1: '8', y1: '48', x2: '32', y2: '48',
    stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round',
  }));
  figure.append(svg);
  markPlaceholder(figure, 'levels.03.lamp');
  return figure;
}

export function createLevelScene({ level = {}, puzzle = {}, phase = 'repair' } = {}) {
  const contract = level.contract ?? '03';
  const client = level.client ?? 'Museo del Llano';
  const title = level.title ?? 'El museo';
  const word = phaseWord(phase);
  void puzzle;

  const element = node('section', 'level-scene level-scene--museum');
  element.setAttribute('data-level', '3');
  element.setAttribute('data-phase', phaseId(phase));
  element.setAttribute('aria-label', `${client} · ${title} · ${word}`);

  // Fondo: ala de día (luz cálida de claraboya, arriba) y ala de noche
  // (luz teal de luna, abajo). Las fotos van pintadas en el fondo CSS de
  // cada ala; la luz decorativa (claraboya, luna, lámparas) sigue en CSS/SVG.
  const backdrop = node('div', 'museum-backdrop');
  backdrop.setAttribute('aria-hidden', 'true');

  const dayWing = node('div', 'museum-wing museum-wing--day');
  markFinal(dayWing, 'levels.03.backgroundDay', 'assets/levels/03/day.webp');
  dayWing.append(node('span', 'museum-wing-name', 'Sala de día'));
  dayWing.append(node('span', 'museum-skylight'));

  const nightWing = node('div', 'museum-wing museum-wing--night');
  markFinal(nightWing, 'levels.03.backgroundNight', 'assets/levels/03/night.webp');
  nightWing.append(node('span', 'museum-wing-name', 'Sala de noche'));
  nightWing.append(node('span', 'museum-moon'));

  const lamps = node('div', 'museum-lamps');
  lamps.append(lampFigure('day'));
  lamps.append(lampFigure('night'));

  backdrop.append(dayWing);
  backdrop.append(nightWing);
  backdrop.append(lamps);

  // Mesa de nogal del taller.
  const bench = node('div', 'museum-bench');
  bench.setAttribute('aria-hidden', 'true');

  // Placa de la sala de seguridad: aquí se monta el editor real.
  const plate = node('div', 'museum-plate');
  markPlaceholder(plate, 'n3.plate');

  const head = node('div', 'museum-plate-head');
  head.append(node('p', 'museum-plate-kicker', `Contrato ${contract} · ${client}`));
  head.append(node('p', 'museum-plate-title', title));
  head.append(node('span', 'museum-phase', word));

  const tags = node('div', 'museum-wing-tags');
  const dayTag = node('span', 'museum-wing-tag museum-wing-tag--day', 'Sala de día');
  const nightTag = node('span', 'museum-wing-tag museum-wing-tag--night', 'Sala de noche');
  tags.append(dayTag);
  tags.append(nightTag);

  const editorSlot = node('div', 'museum-editor-slot');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('data-cells', '5-8');
  editorSlot.setAttribute('role', 'group');
  editorSlot.setAttribute(
    'aria-label',
    'Mecanismo del museo: aquí se monta el editor real de 5 a 8 casillas',
  );
  editorSlot.append(
    node('p', 'museum-editor-note', 'La placa aloja el editor real de 5 a 8 casillas.'),
  );

  const glyphs = node('div', 'museum-glyphs');

  const fork = node('div', 'museum-glyph museum-glyph--fork');
  fork.setAttribute('aria-label', 'Bifurcador');
  markFinal(fork, 'shared.prop.fork', 'assets/shared/props/fork.svg');
  const forkImg = node('img', 'museum-glyph-art');
  forkImg.setAttribute('src', 'assets/shared/props/fork.svg');
  forkImg.setAttribute('alt', '');
  forkImg.setAttribute('aria-hidden', 'true');
  fork.append(forkImg);
  fork.append(forkGlyph());
  fork.append(
    node(
      'p',
      'museum-glyph-caption',
      'Bifurcador: una misma llave puede salir dos veces de la misma casilla.',
    ),
  );

  const spring = node('div', 'museum-glyph museum-glyph--spring');
  spring.setAttribute('aria-label', 'Resorte');
  markFinal(spring, 'shared.prop.spring', 'assets/shared/props/spring.svg');
  const springImg = node('img', 'museum-glyph-art');
  springImg.setAttribute('src', 'assets/shared/props/spring.svg');
  springImg.setAttribute('alt', '');
  springImg.setAttribute('aria-hidden', 'true');
  spring.append(springImg);
  spring.append(springGlyph());
  spring.append(
    node('p', 'museum-glyph-caption', 'Resorte: une dos salas sin pedir llave.'),
  );

  glyphs.append(fork);
  glyphs.append(spring);

  plate.append(head);
  plate.append(tags);
  plate.append(editorSlot);
  plate.append(glyphs);
  plate.append(node('span', 'museum-plate-serial', 'Sala 03 · N.º 0303'));
  plate.append(node('span', 'museum-plate-alarm', 'Alarma'));

  const rivets = node('div', 'museum-rivets');
  rivets.setAttribute('aria-hidden', 'true');
  for (const corner of ['tl', 'tr', 'bl', 'br']) {
    rivets.append(node('span', `museum-rivet museum-rivet--${corner}`));
  }
  plate.append(rivets);

  // Estado de la prueba: el parent muestra aquí el paso de la llave.
  const statusSlot = node('aside', 'museum-status');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-live', 'polite');
  statusSlot.setAttribute('aria-label', 'La marcha del mecanismo del museo');
  statusSlot.append(
    node('p', 'museum-status-note', 'Aquí el taller muestra la marcha de la prueba.'),
  );

  // Sala: columna flexible que contiene placa y marcha dentro del alto
  // del stage. El fondo y la mesa son decorado absoluto y no participan.
  const room = node('div', 'museum-room');
  room.append(plate);
  room.append(statusSlot);

  element.append(backdrop);
  element.append(bench);
  element.append(room);

  let disposed = false;
  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    const parent = element.parentNode;
    if (parent && typeof parent.removeChild === 'function') {
      parent.removeChild(element);
    } else if (typeof element.remove === 'function') {
      element.remove();
    }
  }

  return { element, editorSlot, statusSlot, dispose };
}
