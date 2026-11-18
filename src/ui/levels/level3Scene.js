// El Cerrajero — escena del nivel 3 (Museo del Llano).
//
// Aporta fondo a pantalla completa, mesa, placa, utilería y decoración.
// Cada prop accionable es un `<button type="button">` real con
// `data-action` y `aria-label`: papeles del conservador (contrato/pista/
// bitácora), lámpara de alarma (probar), interruptor de la sala de noche
// (ensayo) y tijera (cortar). La escena no decide nada: el parent engancha
// sus manejadores reales sobre esos `data-action`. No crea el editor real
// (el parent monta el #canvas en `editorSlot`), cables, llaves, juicio o
// lógica. En inmersivo el parent monta `#palette` y herramientas en
// `keysSlot` y muda su nodo de estado a `hudSlot` (con `append`: la ranura
// viaja vacía para no duplicar la línea); el `statusSlot` clásico queda
// como ranura vacía de compatibilidad.
// El resorte sigue siendo un modo del inventario, no un prop.
// Las alas de día/noche y los glifos de bifurcador y resorte usan los
// assets finales del manifiesto (`data-status="final"` con `data-asset` +
// `data-src`); la lámpara (`levels.03.lamp`, missing) sigue como
// placeholder CSS/SVG con `data-status="a producir"` (solo en atributo,
// nunca en texto visible).

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
// (`assets/...`, como consume el manifiesto).
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

// Tijera del conservador: dos anillas y hojas cruzadas.
function scissorsGlyph() {
  const svg = svgNode('svg', {
    viewBox: '0 0 40 40',
    class: 'museum-cut-art',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(svgNode('path', {
    d: 'M8 32 L30 10 M10 10 L28 28',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.4',
    'stroke-linecap': 'round',
  }));
  svg.append(svgNode('circle', {
    cx: '9', cy: '33', r: '4',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
  }));
  svg.append(svgNode('circle', {
    cx: '9', cy: '12', r: '4',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
  }));
  return svg;
}

// Interruptor de la sala de noche: palanca de latón sobre base.
function switchGlyph() {
  const svg = svgNode('svg', {
    viewBox: '0 0 32 40',
    class: 'museum-assault-art',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(svgNode('rect', {
    x: '6', y: '30', width: '20', height: '6', rx: '2',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
  }));
  svg.append(svgNode('line', {
    x1: '16', y1: '30', x2: '23', y2: '12',
    stroke: 'currentColor', 'stroke-width': '2.4', 'stroke-linecap': 'round',
  }));
  svg.append(svgNode('circle', {
    cx: '24', cy: '10', r: '3.4',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
  }));
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

function paperProp(name, src, asset, action, label) {
  const item = node('li', 'museum-paper-item');
  const button = node('button', 'museum-paper');
  button.type = 'button';
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  const photo = node('img', 'museum-paper-photo');
  photo.setAttribute('src', src);
  photo.setAttribute('alt', '');
  photo.setAttribute('aria-hidden', 'true');
  markFinal(photo, asset, src);
  button.append(photo);
  const name_ = node('span', 'museum-paper-name', name);
  button.append(name_);
  item.append(button);
  return item;
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

  backdrop.append(dayWing);
  backdrop.append(nightWing);

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

  const glyphs = node('div', 'museum-glyphs');

  const fork = node('div', 'museum-glyph museum-glyph--fork');
  fork.setAttribute('aria-label', 'Bifurcador');
  fork.setAttribute('title', 'Bifurcador: una misma llave puede salir dos veces de la misma casilla.');
  markFinal(fork, 'shared.prop.fork', 'assets/shared/props/fork.svg');
  const forkImg = node('img', 'museum-glyph-art');
  forkImg.setAttribute('src', 'assets/shared/props/fork.svg');
  forkImg.setAttribute('alt', '');
  forkImg.setAttribute('aria-hidden', 'true');
  fork.append(forkImg);
  fork.append(node('span', 'museum-glyph-plate', 'Bifurcador'));

  const spring = node('div', 'museum-glyph museum-glyph--spring');
  spring.setAttribute('aria-label', 'Resorte');
  spring.setAttribute('title', 'Resorte: une dos salas sin pedir llave.');
  markFinal(spring, 'shared.prop.spring', 'assets/shared/props/spring.svg');
  const springImg = node('img', 'museum-glyph-art');
  springImg.setAttribute('src', 'assets/shared/props/spring.svg');
  springImg.setAttribute('alt', '');
  springImg.setAttribute('aria-hidden', 'true');
  spring.append(springImg);
  spring.append(node('span', 'museum-glyph-plate', 'Resorte'));

  glyphs.append(fork);
  glyphs.append(spring);

  plate.append(head);
  plate.append(tags);
  plate.append(editorSlot);
  plate.append(glyphs);
  plate.append(node('span', 'museum-plate-serial', 'Placa 03 · N.º 0303'));
  plate.append(node('span', 'museum-plate-alarm', 'Alarma'));

  const rivets = node('div', 'museum-rivets');
  rivets.setAttribute('aria-hidden', 'true');
  for (const corner of ['tl', 'tr', 'bl', 'br']) {
    rivets.append(node('span', `museum-rivet museum-rivet--${corner}`));
  }
  plate.append(rivets);

// Estado de la prueba: el parent muestra aquí la marcha de la llave en
// modo clásico. En inmersivo la línea vive en `hudSlot` (último renglón
// de la banda) y este slot queda vacío y colapsado (`:empty`).
const statusSlot = node('aside', 'museum-status');
statusSlot.setAttribute('data-slot', 'status');
statusSlot.setAttribute('aria-live', 'polite');
statusSlot.setAttribute('aria-label', 'La marcha del mecanismo del museo');

  // Sala: columna flexible que contiene placa y marcha dentro del alto
  // del stage. El fondo y la mesa son decorado absoluto y no participan.
  const room = node('div', 'museum-room');
  room.append(plate);
  room.append(statusSlot);

  // Props diegéticos sobre la mesa: el parent engancha sus manejadores
  // reales sobre cada `data-action`. Sin lógica en la escena. Los papeles
  // usan los assets finales del conservador (`levels.01.*`).
  const papers = node('ul', 'museum-papers');
  papers.setAttribute('aria-label', 'Papeles del conservador sobre la mesa');
  papers.append(paperProp('Contrato', 'assets/levels/01/props/contract.webp', 'levels.01.contract', 'contract', 'Abrir el contrato'));
  papers.append(paperProp('Pista', 'assets/levels/01/props/hint.webp', 'levels.01.hint', 'hint', 'Pedir una pista'));
  papers.append(paperProp('Bitácora', 'assets/levels/01/props/log.webp', 'levels.01.log', 'log', 'Abrir la bitácora'));

  const lamps = node('div', 'museum-lamps');
  lamps.append(lampFigure('day'));

  // La lámpara de la sala de noche es la consola de alarma: probar.
  const probe = node('button', 'museum-lamp-btn');
  probe.type = 'button';
  probe.setAttribute('data-action', 'probe');
  probe.setAttribute('aria-label', 'Probar la llave en la sala');
  probe.append(lampFigure('night'));
  probe.append(node('span', 'museum-prop-name', 'Probar'));

  // El interruptor de la sala de noche: ensayo del asalto. Junto a
  // PROBAR (a su izquierda, mismo grupo) sobre el borde derecho de la placa.
  const assault = node('button', 'museum-assault');
  assault.type = 'button';
  assault.setAttribute('data-action', 'assault');
  assault.setAttribute('aria-label', 'Ensayar el asalto en la sala de noche');
  assault.append(switchGlyph());
  assault.append(node('span', 'museum-prop-name', 'Ensayo'));

  const alarmGroup = node('div', 'museum-alarm-group');
  alarmGroup.append(assault);
  alarmGroup.append(probe);
  lamps.append(alarmGroup);

  // La tijera sobre la mesa: cortar.
  const cut = node('button', 'museum-cut');
  cut.type = 'button';
  cut.setAttribute('data-action', 'cut');
  cut.setAttribute('aria-label', 'Cortar un cable con la tijera');
  cut.append(scissorsGlyph());
  cut.append(node('span', 'museum-prop-name', 'Tijera'));

  // Banda de mesa en flujo (nunca absoluta): una sola fila sin solapes
  // (papeles a la izquierda, `keysSlot` al centro-derecha, tijera a la
  // derecha) y el estado como último renglón. ENSAYO va junto a PROBAR en
  // el grupo de alarma, no en la banda. El parent monta `#palette` y
  // herramientas en `keysSlot` y muda su nodo de estado a `hudSlot` (siempre vacío en
  // la escena: el parent lo llena con `append`); la escena no decide nada.
  const keysSlot = node('div', 'museum-keys');
  keysSlot.setAttribute('data-slot', 'keys');
  keysSlot.setAttribute('role', 'group');
  keysSlot.setAttribute('aria-label', 'Carretes y herramientas del conservador');

  const hudSlot = node('aside', 'museum-hud');
  hudSlot.setAttribute('data-slot', 'hud');
  hudSlot.setAttribute('aria-live', 'polite');
  hudSlot.setAttribute('aria-label', 'La marcha de la prueba del taller en la mesa');

  const dock = node('div', 'museum-dock');
  dock.append(papers);
  dock.append(keysSlot);
  dock.append(cut);
  dock.append(hudSlot);

  element.append(backdrop);
  element.append(bench);
  element.append(room);
  element.append(dock);
  element.append(lamps);

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
