// Escena visual del nivel 1 — Banco del Llano.
//
// Solo decorado: fondo, mesa, placa, ladrón, papeles y campana. No crea
// editor, cables, llaves, juicio ni lógica; el parent monta el `#canvas`
// real dentro de `editorSlot` y conserva probar, ensayo, máquinas,
// jueces, datos y callbacks.
//
// Los sprites son placeholders del mockup
// (`mockups/nivel-1-taller/assets/sprites/*`); no se copia ningún asset.
// Si un sprite falta, el navegador muestra el marco igual: la escena no
// se bloquea. Ver `docs/ASSET-MANIFEST.md` para los slots finales.

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

function paperFigure(src, name) {
  const item = document.createElement('li');
  item.className = 'level-paper-item';
  const figure = document.createElement('figure');
  figure.className = 'level-paper';
  figure.append(image(`${SPRITES}/${src}`, { alt: '' }));
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

  const backdrop = image(`${SPRITES}/fondo-banco.jpg`, { alt: '' });
  backdrop.className = 'level-backdrop';
  element.append(backdrop);

  const light = document.createElement('div');
  light.className = 'level-light';
  light.setAttribute('aria-hidden', 'true');
  element.append(light);

  const bench = image(`${SPRITES}/mesa-madera.svg`, { alt: '' });
  bench.className = 'level-bench';
  element.append(bench);

  const thief = image(`${SPRITES}/ladron.png`, {
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
  papers.append(paperFigure('contrato.png', 'Contrato'));
  papers.append(paperFigure('nota-pista.png', 'Pista'));
  papers.append(paperFigure('libreta.png', 'Bitácora'));
  element.append(papers);

  const bell = document.createElement('figure');
  bell.className = 'level-bell';
  bell.append(image(`${SPRITES}/campana-alarma.png`, { alt: '' }));
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
