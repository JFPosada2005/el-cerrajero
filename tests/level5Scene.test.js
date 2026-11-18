import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level5Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level5Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level5.css'), 'utf8');

function element(tag) {
  const listeners = new Map();
  const node = {
    tag,
    children: [],
    textContent: '',
    className: '',
    removed: false,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = [...nodes];
    },
    remove() {
      this.removed = true;
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
  };
  return node;
}

globalThis.document = {
  createElement: (tag) => element(tag),
};

const level = { id: 5, contract: '05', title: 'El banco central', client: 'Banco Central' };
const puzzle = {
  goal: 'Abre solo si el contador suma 1 al número de la cinta.',
  intro: 'El tambor de control quedó con una púa mal escrita.',
  sections: [
    { id: 'seek', label: 'Buscar el final', start: true },
    { id: 'carry', label: 'Llevar' },
    { id: 'done', label: 'Listo', accept: true },
  ],
  examples: { runs: [{ input: '1', output: '10' }] },
};

function setup(overrides = {}) {
  return createLevelScene({ level, puzzle, phase: 'repair', ...overrides });
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

function classes(node) {
  return (node.className || '').split(' ').filter(Boolean);
}

function textOf(root) {
  return findAll(root, () => true)
    .map((node) => node.textContent)
    .join(' ');
}

test('raíz con data-level 5 y marco de sala de recuento', () => {
  const scene = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '5');
  assert.equal(scene.element.getAttribute('aria-label'), 'Sala de recuento del Banco Central');
});

test('editorSlot vacío para el tambor y la cinta reales', () => {
  const scene = setup();
  assert.strictEqual(scene.editorSlot.getAttribute('data-slot'), 'editor');
  assert.equal(scene.editorSlot.getAttribute('aria-label'), 'Tambor y cinta del taller');
  assert.equal(scene.editorSlot.children.length, 0);
  assert.ok(findAll(scene.element, (node) => node === scene.editorSlot).length === 1);
});

test('statusSlot para el contador del mecanismo', () => {
  const scene = setup();
  assert.strictEqual(scene.statusSlot.getAttribute('data-slot'), 'status');
  assert.equal(scene.statusSlot.getAttribute('aria-label'), 'Contador del mecanismo');
  assert.ok(findAll(scene.element, (node) => node === scene.statusSlot).length === 1);
});

test('la escena no crea el editor real', () => {
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('tapePanel'), 'sin importar el panel de cinta');
  assert.ok(!source.includes('handleProbe'), 'sin lógica de probar');
  assert.ok(!source.includes('handleAssault'), 'sin lógica de ensayo');
  assert.ok(!source.includes('toMachine'), 'sin construir máquinas');
  assert.ok(!source.includes('.innerHTML'), 'sin innerHTML');
  const scene = setup();
  for (const banned of ['drum-pin', 'drum-section', 'pin-editor', 'tape-cell', 'tape-marker']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(banned)).length,
      0,
      `sin nodos .${banned}`,
    );
  }
});

test('un solo taller: sin cinta ni tambor decorativos duplicados', () => {
  const scene = setup();
  for (const mock of ['tape-mock', 'tape-mock-cell', 'tape-mock-hole', 'tape-mock-head', 'drum-mock', 'drum-mock-ring', 'drum-mock-pin']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(mock)).length,
      0,
      `sin nodos .${mock}`,
    );
  }
  for (const frame of ['counting-tape-frame', 'counting-drum-frame', 'counting-cabinet']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(frame)).length,
      0,
      `sin marco duplicado .${frame}`,
    );
  }
});

test('la placa enmarca el editor real y conserva los marcadores de producción', () => {
  const scene = setup();
  const plate = findAll(scene.element, (node) => classes(node).includes('counting-bench-plate'))[0];
  assert.ok(plate, 'hay una sola placa de taller');
  assert.ok(findAll(plate, (node) => node === scene.editorSlot).length === 1, 'el editor real vive dentro de la placa');
  for (const slot of ['n5.tape', 'n5.head', 'n5.drum', 'n5.pin']) {
    assert.ok(String(plate.getAttribute('data-asset')).includes(slot), `la placa cubre ${slot}`);
  }
  const rail = findAll(scene.element, (node) => classes(node).includes('plate-rail'))[0];
  assert.ok(rail, 'el riel del cabezal es atmósfera');
  assert.equal(rail.getAttribute('aria-hidden'), 'true', 'el riel queda fuera del lector');
  assert.equal(
    findAll(rail, (node) => ['tape-mock-cell', 'drum-mock-pin', 'drum-pin', 'tape-cell'].some((banned) => classes(node).includes(banned))).length,
    0,
    'el riel no trae casillas ni púas',
  );
});

test('placeholders marcados a producir', () => {
  const scene = setup();
  const marked = findAll(scene.element, (node) => node.getAttribute('data-status') === 'a producir');
  assert.ok(marked.length >= 3, 'fondo, cinta/cabezal, tambor y boleta marcados');
  const assets = marked.map((node) => node.getAttribute('data-asset')).join(' ');
  for (const slot of ['n5.background', 'n5.tape', 'n5.head', 'n5.drum', 'n5.pin', 'n5.depositSlip']) {
    assert.ok(assets.includes(slot), `placeholder ${slot}`);
  }
  assert.ok(textOf(scene.element).includes('a producir') === false, 'el aviso vive en atributos, no en texto visible');
});

test('decoración fuera del lector y vocabulario de taller', () => {
  const scene = setup();
  const hidden = findAll(scene.element, (node) => node.getAttribute('aria-hidden') === 'true');
  assert.ok(hidden.length >= 2, 'fondo y maquetas decorativas ocultas al lector');
  const banned = ['autómata', 'estado', 'transición', 'lenguaje', 'AFD', 'AFND'];
  const haystack = `${source} ${textOf(scene.element)}`;
  for (const word of banned) {
    assert.ok(!haystack.includes(word), `sin "${word}" en la escena`);
  }
  assert.ok(!source.includes('createElementNS'), 'placeholders con CSS/DOM, sin SVG propio');
});

test('setPhase y dispose', () => {
  const scene = setup();
  const phase = findAll(scene.element, (node) => classes(node).includes('counting-phase'))[0];
  assert.equal(phase.textContent, 'Reparación');
  scene.setPhase('build');
  assert.equal(phase.textContent, 'Construcción');
  scene.dispose();
  assert.equal(scene.element.removed, true);
});

test('la boleta muestra los datos por textContent, sin parsear marcas', () => {
  const evil = '<img src=x onerror=alert(1)> & <b>negrita</b>';
  const scene = createLevelScene({
    level,
    puzzle: { ...puzzle, goal: evil },
    phase: 'repair',
  });
  const texts = findAll(scene.element, (node) => node.textContent === evil);
  assert.ok(texts.length >= 1, 'la regla conserva el texto literal');
  for (const node of texts) {
    assert.equal(node.children.length, 0, 'el texto con marcas no se parsea como nodos');
  }
});

test('css con alcance, 44px, foco y movimiento reducido, sin imágenes externas', () => {
  assert.ok(css.includes('.level-scene[data-level="5"]'), 'alcance a la escena del nivel 5');
  assert.ok(css.includes('min-height: 44px'), 'toques de 44 px');
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(!css.includes('url('), 'placeholders CSS, sin imágenes externas');
});

test('css integra el editor real en la placa y limita el alto al marco', () => {
  for (const selector of ['#tape-panel', '#drum', '.drum-section', '.drum-pin', '.tape-cell']) {
    assert.ok(css.includes(selector), `la placa integra ${selector}`);
  }
  assert.ok(css.includes('.counting-editor'), 'el editor real tiene marco propio');
  assert.ok(css.includes('overflow'), 'el desborde queda contenido');
  assert.ok(css.includes('max-height: 100%'), 'la escena no supera el marco del taller');
});
