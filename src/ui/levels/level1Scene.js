// Escena visual del nivel 1 — Banco del Llano.
//
// Solo decorado: fondo, mesa, placa, ladrón, papeles y campana. No crea
// editor, cables, llaves, juicio ni lógica; el parent monta el `#canvas`
// real dentro de `editorSlot` y conserva probar, ensayo, máquinas,
// jueces, datos y callbacks.
//
// Fondo, ladrón, papeles y campana son assets finales
// (`assets/levels/01/*`, slots `n1.*` del manifiesto) y llevan
// `data-asset` + `data-status="final"` + `data-src`. La mesa
// (`mesa-madera.svg`) y la placa (`placa-textura.jpg`, `placa-marco.svg`)
// siguen en `mockups/` porque no tienen slot final (ver
// `docs/ASSET-INTEGRATION.md` §3). Si un asset falta, el navegador
// muestra el marco igual: la escena no se bloquea.

const SPRITES = 'mockups/nivel-1-taller/assets/sprites';

const DEFAULTS = {
  contract: '01',
  title: 'La caja de seguridad',
  client: 'Banco del Llano',
};

function shield(value, fallback) {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function image(src, { alt = '', hidden = true } = {}) {
  const node = document.createElement('img');
  node.setAttribute('src', src);
  node.setAttribute('alt', alt);
  node.setAttribute('draggable', 'false');
  if (hidden) {
    node.setAttribute('aria-hidden', 'true');
  }
  return node;
}

function caption(text, className) {
  const node = document.createElement('p');
  node.className = className;
  node.textContent = text;
  return node;
}

function finalImage(src, asset, { alt = '', hidden = true } = {}) {
  const node = image(src, { alt, hidden });
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'final');
  node.setAttribute('data-src', src);
  return node;
}

function paperFigure(src, name, asset) {
  const item = document.createElement('li');
  item.className = 'level-paper-item';
  const figure = document.createElement('figure');
  figure.className = 'level-paper';
  figure.append(finalImage(src, asset, { alt: '' }));
  const name_ = document.createElement('figcaption');
  name_.className = 'level-paper-name';
  name_.textContent = name;
  figure.append(name_);
  item.append(figure);
  return item;
}

export function createLevelScene({ level = {}, puzzle = {}, phase = 'repair' } = {}) {
  void puzzle;
  const contract = shield(level.contract, DEFAULTS.contract);
  const title = shield(level.title, DEFAULTS.title);
  const client = shield(level.client, DEFAULTS.client);
  const seal = phase === 'build' ? 'En construcción' : 'En reparación';

  const element = document.createElement('section');
  element.className = 'level-scene level-1';
  element.setAttribute('data-level', '1');
  element.setAttribute('aria-label', `${client}: mesa de trabajo. ${title}.`);

  const backdrop = finalImage('assets/levels/01/background.webp', 'n1.background', { alt: '' });
  backdrop.className = 'level-backdrop';
  element.append(backdrop);

  const light = document.createElement('div');
  light.className = 'level-light';
  light.setAttribute('aria-hidden', 'true');
  element.append(light);

  const bench = image(`${SPRITES}/mesa-madera.svg`, { alt: '' });
  bench.className = 'level-bench';
  element.append(bench);

  const thief = finalImage('assets/levels/01/thief.webp', 'n1.thief', {
    alt: 'El ladrón observa desde la penumbra',
    hidden: false,
  });
  thief.className = 'level-thief';
  element.append(thief);

  const plate = document.createElement('div');
  plate.className = 'level-plate';

  const texture = image(`${SPRITES}/placa-textura.jpg`, { alt: '' });
  texture.className = 'level-plate-texture';
  plate.append(texture);

  const frame = image(`${SPRITES}/placa-marco.svg`, { alt: '' });
  frame.className = 'level-plate-frame';
  plate.append(frame);

  plate.append(caption(`${client} · Caja ${contract}`, 'level-plate-label'));
  plate.append(caption('N.º 0147', 'level-plate-serial'));

  const editorSlot = document.createElement('div');
  editorSlot.className = 'level-editor';
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('role', 'group');
  editorSlot.setAttribute('aria-label', 'Mecanismo de la cerradura');
  plate.append(editorSlot);

  plate.append(caption('Alarma', 'level-alarm-label'));
  plate.append(caption(seal, 'level-phase-seal'));

  element.append(plate);

  const papers = document.createElement('ul');
  papers.className = 'level-papers';
  papers.setAttribute('aria-label', 'Papeles sobre la mesa');
  papers.append(paperFigure('assets/levels/01/props/contract.webp', 'Contrato', 'n1.contract'));
  papers.append(paperFigure('assets/levels/01/props/hint.webp', 'Pista', 'n1.hint'));
  papers.append(paperFigure('assets/levels/01/props/log.webp', 'Bitácora', 'n1.log'));
  element.append(papers);

  const bell = document.createElement('figure');
  bell.className = 'level-bell';
  bell.append(finalImage('assets/levels/01/props/bell.webp', 'n1.bell', { alt: '' }));
  const bellName = document.createElement('figcaption');
  bellName.className = 'level-bell-name';
  bellName.textContent = 'Campana de alarma';
  bell.append(bellName);
  element.append(bell);

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot: null, dispose };
}
