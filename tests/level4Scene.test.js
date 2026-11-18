import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level4Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const sceneSource = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level4Scene.js'), 'utf8');
const cssSource = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level4.css'), 'utf8');

// --- DOM falso mínimo (solo document.createElement + textContent) ---
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
    listenerTypes() {
      return [...listeners.keys()];
    },
  };
  return node;
}

globalThis.document = {
  createElement: (tag) => element(tag),
};

const LEVEL = {
  id: 4,
  contract: '04',
  title: 'El teatro',
  client: 'Teatro Municipal',
  keys: [
    { symbol: 'A', label: '▲ Subir', tone: 'gold' },
    { symbol: 'B', label: '▼ Bajar', tone: 'teal' },
  ],
};

function setup(overrides = {}) {
  return createLevelScene({ level: LEVEL, puzzle: {}, phase: 'Reparación', ...overrides });
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

function findOne(root, predicate) {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `se esperaba un nodo, hay ${found.length}`);
  return found[0];
}

test('raíz con data-level="4" y slots expuestos', () => {
  const scene = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '4');
  assert.equal(scene.element.getAttribute('aria-label'), 'Tramoya del Teatro Municipal');
  assert.strictEqual(
    findOne(scene.element, (n) => n.attributes['data-slot'] === 'editor'),
    scene.editorSlot,
  );
  assert.strictEqual(
    findOne(scene.element, (n) => n.attributes['data-slot'] === 'status'),
    scene.statusSlot,
  );
});

test('editorSlot reserva la placa y statusSlot la pila', () => {
  const scene = setup();
  assert.equal(scene.editorSlot.getAttribute('aria-label'), 'Placa del montacargas: aquí se monta el mecanismo real');
  assert.equal(scene.statusSlot.getAttribute('aria-label'), 'Pila del montacargas');
  assert.equal(scene.statusSlot.getAttribute('aria-live'), 'polite');
});

test('la escena no crea editor, cables, llaves ni lógica', () => {
  for (const banned of ['graphEditor', 'drumEditor', 'handleProbe', 'handleAssault', 'onConnect', 'onCut', '.innerHTML', 'insertAdjacentHTML', 'createElementNS']) {
    assert.ok(!sceneSource.includes(banned), `la escena no debe mencionar ${banned}`);
  }
  const scene = setup();
  const tags = new Set(findAll(scene.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('svg'), 'sin nodos svg');
  assert.ok(!tags.has('canvas'), 'sin canvas');
  assert.equal(findAll(scene.element, (n) => n.tag === 'button').length, 0, 'sin botones: no hay controles reales');
  assert.equal(findAll(scene.element, (n) => n.listenerTypes().length > 0).length, 0, 'sin listeners: decorado puro');
});

test('placeholders marcados a producir con su asset', () => {
  const scene = setup();
  const placeholders = findAll(scene.element, (n) => n.attributes['data-placeholder'] === 'a-producir');
  const assets = placeholders.map((n) => n.attributes['data-asset']);
  for (const slot of ['n4.background', 'n4.chip', 'n4.stackBase', 'n4.selectors']) {
    assert.ok(assets.includes(slot), `falta placeholder de ${slot}`);
  }
  assert.ok(assets.filter((a) => a === 'n4.chip').length >= 3, 'la columna trae fichas de muestra');
  const decor = findAll(scene.element, (n) => n.attributes['aria-hidden'] === 'true');
  assert.ok(decor.length > 0, 'el decorado visual queda fuera de lectores');
});

test('leyenda con las palancas de los datos y vocabulario de taller', () => {
  const scene = setup();
  const legend = findOne(scene.element, (n) => classes(n).includes('l4-legend'));
  assert.equal(findOne(legend, (n) => classes(n).includes('l4-legend-keys')).textContent, '▲ Subir · ▼ Bajar');
  const evil = '<img src=x onerror=alert(1)> ▲ Subir';
  const injected = setup({ level: { keys: [{ label: evil }] } });
  const keysNode = findOne(injected.element, (n) => classes(n).includes('l4-legend-keys'));
  assert.equal(keysNode.textContent, evil);
  assert.equal(keysNode.children.length, 0, 'la etiqueta con marcas no se parsea como nodos');
  const spoken = findAll(scene.element, (n) => typeof n.textContent === 'string' && n.textContent !== '' && n.children.length === 0)
    .map((n) => n.textContent)
    .join(' · ');
  for (const banned of ['autómata', 'AFD', 'AFND', 'transición', 'lenguaje']) {
    assert.ok(!spoken.includes(banned), `vocabulario de taller, sin ${banned}`);
  }
});

test('sello de fase y dispose', () => {
  const scene = setup({ phase: 'Construcción' });
  assert.equal(findOne(scene.element, (n) => classes(n).includes('l4-seal')).textContent, 'Construcción');
  scene.dispose();
  assert.equal(scene.element.removed, true);
});

test('css con alcance del nivel, foco y movimiento reducido', () => {
  for (const line of cssSource.split('\n')) {
    const brace = line.indexOf('{');
    if (brace === -1) {
      continue;
    }
    const selector = line.slice(0, brace).trim();
    if (selector === '' || selector.startsWith('@media')) {
      continue;
    }
    assert.ok(
      selector.startsWith('.level-scene[data-level="4"]'),
      `regla fuera del alcance del nivel 4: ${selector}`,
    );
  }
  assert.ok(cssSource.includes(':focus-visible'), 'foco visible para lo que monte el parent');
  assert.ok(cssSource.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
});
