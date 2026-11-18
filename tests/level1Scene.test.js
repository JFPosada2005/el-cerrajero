import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level1Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level1Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level1.css'), 'utf8');

// --- DOM falso mínimo (solo createElement + textContent + atributos) ---
function element(tag) {
  const listeners = new Map();
  const node = {
    tag,
    children: [],
    textContent: '',
    className: '',
    attributes: {},
    removed: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      this.children.push(...nodes);
      for (const child of nodes) {
        child.parent = this;
      }
    },
    remove() {
      this.removed = true;
      if (this.parent) {
        this.parent.children = this.parent.children.filter((child) => child !== this);
      }
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    listenerTypes() {
      return [...listeners.keys()];
    },
  };
  return node;
}

globalThis.document = {
  createElement: (tag) => element(tag),
};

const LEVEL = { contract: '01', title: 'La caja de seguridad', client: 'Banco del Llano' };

function setup(overrides = {}) {
  return createLevelScene({ level: LEVEL, puzzle: {}, phase: 'repair', ...overrides });
}

function classes(node) {
  return (node.className || '').split(' ').filter(Boolean);
}

function* walk(node) {
  yield node;
  for (const child of node.children) {
    yield* walk(child);
  }
}

function findAll(root, predicate) {
  return [...walk(root)].filter(predicate);
}

function findOne(root, predicate, label = 'un nodo') {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `se esperaba ${label}, hay ${found.length}`);
  return found[0];
}

function byClass(root, className) {
  return findAll(root, (node) => classes(node).includes(className));
}

function texts(root) {
  const out = [];
  for (const node of walk(root)) {
    if (node.textContent !== '') {
      out.push(node.textContent);
    }
    for (const name of ['aria-label', 'alt']) {
      const value = node.getAttribute(name);
      if (value !== null && value !== '') {
        out.push(value);
      }
    }
  }
  return out.join(' · ');
}

test('raíz con alcance de nivel y etiqueta de taller', () => {
  const view = setup();
  assert.equal(view.element.tag, 'section');
  assert.ok(classes(view.element).includes('level-scene'));
  assert.ok(classes(view.element).includes('level-1'));
  assert.equal(view.element.getAttribute('data-level'), '1');
  assert.match(view.element.getAttribute('aria-label'), /Banco del Llano/);
  assert.match(view.element.getAttribute('aria-label'), /mesa de trabajo/);
});

test('editorSlot reserva el área de la placa y llega vacío', () => {
  const view = setup();
  const slot = findOne(view.element, (n) => n.getAttribute('data-slot') === 'editor', 'el slot del editor');
  assert.strictEqual(view.editorSlot, slot);
  assert.equal(slot.getAttribute('role'), 'group');
  assert.match(slot.getAttribute('aria-label'), /cerradura/);
  assert.equal(slot.children.length, 0, 'el parent monta el #canvas real');
  const plate = findOne(view.element, (n) => classes(n).includes('level-plate'), 'la placa');
  assert.ok(findAll(plate, (n) => n === slot).length === 1, 'el slot vive dentro de la placa');
  assert.equal(slot.getAttribute('tabindex'), null, 'el slot no roba el foco: el foco lo tienen las celdas del editor real');
});

test('etiqueta de la placa con cliente y contrato', () => {
  const view = setup();
  const label = findOne(view.element, (n) => classes(n).includes('level-plate-label'), 'la etiqueta');
  assert.equal(label.textContent, 'Banco del Llano · Caja 01');
  const other = createLevelScene({ level: { contract: '02', client: 'Hotel Mirador' }, phase: 'repair' });
  assert.equal(
    findOne(other.element, (n) => classes(n).includes('level-plate-label'), 'la etiqueta').textContent,
    'Hotel Mirador · Caja 02',
  );
});

test('sello de fase con vocabulario de taller', () => {
  const repair = setup({ phase: 'repair' });
  assert.equal(findOne(repair.element, (n) => classes(n).includes('level-phase-seal'), 'el sello').textContent, 'En reparación');
  const build = setup({ phase: 'build' });
  assert.equal(findOne(build.element, (n) => classes(n).includes('level-phase-seal'), 'el sello').textContent, 'En construcción');
  const fallback = createLevelScene({ level: LEVEL });
  assert.equal(findOne(fallback.element, (n) => classes(n).includes('level-phase-seal'), 'el sello').textContent, 'En reparación');
});

test('fondo, mesa, ladrón, placa, campana y papeles con sprites del mockup', () => {
  const view = setup();
  const sources = findAll(view.element, (n) => n.tag === 'img').map((n) => n.getAttribute('src'));
  assert.ok(sources.length >= 9, `la escena trae sus props, hay ${sources.length} imágenes`);
  for (const src of sources) {
    assert.match(src, /^mockups\/nivel-1-taller\/assets\/sprites\//, `placeholder del mockup: ${src}`);
  }
  for (const sprite of ['fondo-banco.jpg', 'mesa-madera.svg', 'ladron.png', 'placa-textura.jpg', 'placa-marco.svg', 'campana-alarma.png', 'contrato.png', 'nota-pista.png', 'libreta.png']) {
    assert.ok(sources.some((src) => src.endsWith(sprite)), `falta el sprite ${sprite}`);
  }
  const thief = findOne(view.element, (n) => classes(n).includes('level-thief'), 'el ladrón');
  assert.match(thief.getAttribute('alt'), /ladrón/);
  const papers = findOne(view.element, (n) => classes(n).includes('level-papers'), 'los papeles');
  assert.equal(papers.tag, 'ul');
  assert.deepEqual(
    byClass(papers, 'level-paper-name').map((n) => n.textContent),
    ['Contrato', 'Pista', 'Bitácora'],
  );
  const bell = findOne(view.element, (n) => classes(n).includes('level-bell'), 'la campana');
  assert.equal(findOne(bell, (n) => classes(n).includes('level-bell-name'), 'el pie').textContent, 'Campana de alarma');
});

test('decorado con alt explícito y sin texto colgado', () => {
  const view = setup();
  for (const img of findAll(view.element, (n) => n.tag === 'img')) {
    assert.ok(img.getAttribute('alt') !== null, `toda imagen declara alt: ${img.getAttribute('src')}`);
  }
  for (const img of findAll(view.element, (n) => n.tag === 'img' && n.getAttribute('aria-hidden') === 'true')) {
    assert.equal(img.getAttribute('alt'), '', 'el decorado puro lleva alt vacío');
  }
});

test('la escena no crea editor, cables, llaves ni lógica', () => {
  for (const banned of ['graphEditor', 'drumEditor', 'createElementNS', 'handleProbe', 'handleAssault', 'onConnect', 'toMachine']) {
    assert.ok(!source.includes(banned), `sin ${banned}: eso lo monta el parent`);
  }
  assert.ok(!source.includes('.innerHTML'), 'datos por textContent, sin innerHTML');
  const view = setup();
  assert.equal(findAll(view.element, (n) => n.tag === 'button').length, 0, 'sin botones: no hay acciones en la escena');
  assert.equal(findAll(view.element, (n) => n.tag === 'svg' || n.tag === 'canvas').length, 0, 'sin dibujo propio');
  assert.equal(findAll(view.element, (n) => n.getAttribute('tabindex') !== null).length, 0, 'sin focos propios');
  assert.equal(findAll(view.element, (n) => n.listenerTypes().length > 0).length, 0, 'sin listeners: la escena no decide nada');
  assert.equal(view.statusSlot, null, 'el nivel 1 no usa pila: el parent usa el slot de estado del shell');
});

test('vocabulario de taller, sin jerga académica', () => {
  const view = setup();
  const copy = `${texts(view.element)} ${texts(setup({ phase: 'build' }).element)}`.toLowerCase();
  for (const word of ['afd', 'afnd', 'autómata', 'automata', 'estado', 'transición', 'transicion', 'lenguaje']) {
    assert.ok(!new RegExp(`\\b${word}\\b`).test(copy), `sin "${word}" en la escena`);
  }
  assert.ok(!/\bap\b/.test(copy), 'sin "ap" en la escena');
  assert.ok(!/\bmt\b/.test(copy), 'sin "mt" en la escena');
});

test('dispose saca la escena sin tocar el editor', () => {
  const view = setup();
  const parent = element('div');
  parent.append(view.element);
  const slot = view.editorSlot;
  view.dispose();
  assert.equal(view.element.removed, true);
  assert.equal(parent.children.length, 0);
  assert.equal(slot.children.length, 0, 'el dispose no vacía el slot: el parent desmonta el editor');
});

test('css con alcance, canvas integrado, foco y movimiento reducido', () => {
  assert.ok(css.includes('.level-scene[data-level="1"]'), 'alcance por nivel');
  assert.ok(!css.includes('.level-scene[data-level="2"]'), 'este archivo es solo del nivel 1');
  const canvasRule = css.slice(css.indexOf('.level-editor #canvas'));
  assert.ok(canvasRule.includes('background: transparent'), 'el #canvas real va sin fondo de panel');
  assert.ok(canvasRule.includes('border: 0'), 'el #canvas real va sin borde de panel');
  assert.ok(css.includes(':focus-visible'), 'foco visible para lo que monte el parent');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  const sizes = [...css.matchAll(/font-size\s*:\s*([^;]+);/g)].map((match) => match[1].trim());
  assert.ok(sizes.length > 0, 'la escena fija sus tamaños de letra');
  const tooSmall = sizes.filter((value) => {
    const px = Number.parseFloat(value);
    return value.endsWith('px') && Number.isFinite(px) && px < 12;
  });
  assert.deepEqual(tooSmall, [], 'ningún texto baja de 12 px');
});
