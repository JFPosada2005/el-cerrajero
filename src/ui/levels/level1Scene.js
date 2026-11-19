// Escena visual del nivel 1 — Banco del Llano.
//
// Fondo a pantalla completa, placa-máquina al centro y mesa con ranuras:
// `editorSlot` (mecanismo real), `keysSlot` (carretes y herramientas que el
// parent mueve desde el inventario) y `hudSlot` (línea de estado que el
// parent mueve desde el shell). Cada prop accionable es un `<button
// type="button">` real con `data-action` y `aria-label`; la escena no decide
// nada: el parent engancha sus manejadores reales sobre esos `data-action`.
// El ladrón es decorado (sin acción); el ensayo vive en su propia placa de
// latón. No crea editor, cables, llaves, juicio ni lógica; el parent monta
// el `#canvas` real dentro de `editorSlot`.
//
// Fondo, ladrón, papeles, campana y tijera son assets finales
// (`assets/levels/01/*`, slots `n1.*` del manifiesto —la tijera declara su
// ruta `levels.01.scissors`) y llevan `data-asset` + `data-status="final"` +
// `data-src`. La mesa (`mesa-madera.svg`) y la placa (`placa-textura.jpg`,
// `placa-marco.svg`) siguen en `mockups/` porque no tienen slot final (ver
// `docs/ASSET-INTEGRATION.md` §3). Si un asset falta, el navegador muestra
// el marco igual: la escena no se bloquea.

import { createScissorsProp } from '../scissorsProp.js';

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

function paperProp(src, name, asset, action, label) {
  const item = document.createElement('li');
  item.className = 'level-paper-item';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'level-paper';
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  button.append(finalImage(src, asset, { alt: '' }));
  const name_ = document.createElement('span');
  name_.className = 'level-paper-name';
  name_.textContent = name;
  button.append(name_);
  item.append(button);
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
    alt: '',
    hidden: true,
  });
  thief.className = 'level-thief';
  thief.setAttribute('aria-hidden', 'true');
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
  papers.append(paperProp('assets/levels/01/props/contract.webp', 'Contrato', 'n1.contract', 'contract', 'Abrir contrato'));
  papers.append(paperProp('assets/levels/01/props/hint.webp', 'Pista', 'n1.hint', 'hint', 'Pedir una pista'));
  papers.append(paperProp('assets/levels/01/props/log.webp', 'Bitácora', 'n1.log', 'log', 'Abrir la bitácora'));
  element.append(papers);

  const bell = document.createElement('button');
  bell.type = 'button';
  bell.className = 'level-bell';
  bell.setAttribute('data-action', 'probe');
  bell.setAttribute('aria-label', 'Probar la llave en la cerradura');
  bell.append(finalImage('assets/levels/01/props/bell.webp', 'n1.bell', { alt: '' }));
  const bellName = document.createElement('span');
  bellName.className = 'level-bell-name';
  bellName.textContent = 'Campana de alarma';
  bell.append(bellName);
  element.append(bell);

  const scissors = createScissorsProp({
    className: 'level-scissors',
    nameClass: 'level-scissors-name',
  });
  element.append(scissors);

  const trial = document.createElement('button');
  trial.type = 'button';
  trial.className = 'level-trial';
  trial.setAttribute('data-action', 'assault');
  trial.setAttribute('aria-label', phase === 'build' ? 'Ejecutar el asalto' : 'Ejecutar el ensayo');
  const trialName = document.createElement('span');
  trialName.className = 'level-trial-name';
  trialName.textContent = phase === 'build' ? 'Asalto' : 'Ensayo';
  trial.append(trialName);
  element.append(trial);

  const keysSlot = document.createElement('div');
  keysSlot.className = 'level-keys';
  keysSlot.setAttribute('data-slot', 'keys');
  keysSlot.setAttribute('role', 'group');
  keysSlot.setAttribute('aria-label', 'Carretes y herramientas');
  element.append(keysSlot);

  const hudSlot = document.createElement('div');
  hudSlot.className = 'level-hud';
  hudSlot.setAttribute('data-slot', 'hud');
  hudSlot.setAttribute('aria-label', 'Marcha del mecanismo');
  element.append(hudSlot);

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot: null, keysSlot, hudSlot, actions: ['contract', 'hint', 'log', 'probe', 'assault', 'cut'], dispose };
}
