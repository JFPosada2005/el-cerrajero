import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLevelScene } from '../src/ui/levels/level2Scene.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level2Scene.js'), 'utf8');
const css = readFileSync(join(here, '..', 'src', 'ui', 'levels', 'level2.css'), 'utf8');

// --- DOM falso mínimo (createElement + createElementNS) ---
function element(tag) {
  const node = {
    tag,
    children: [],
    textContent: '',
    className: '',
    attributes: {},
    parentNode: null,
    removed: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    append(...nodes) {
      for (const child of nodes) {
        child.parentNode = this;
        this.children.push(child);
      }
    },
    replaceChildren(...nodes) {
      for (const child of this.children) {
        child.parentNode = null;
      }
      this.children = [];
      this.append(...nodes);
    },
    remove() {
      this.removed = true;
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
        this.parentNode = null;
      }
    },
  };
  return node;
}

globalThis.document = {
  createElement: (tag) => element(tag),
  createElementNS: (_namespace, tag) => element(tag),
};

function classes(node) {
  const fromProp = (node.className || '').split(' ').filter(Boolean);
  const fromAttr = (node.attributes.class || '').split(' ').filter(Boolean);
  return [...new Set([...fromProp, ...fromAttr])];
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

function findOne(root, predicate, label) {
  const found = findAll(root, predicate);
  assert.equal(found.length, 1, `${label}: se esperaba un nodo, hay ${found.length}`);
  return found[0];
}

function byAttr(root, name, value) {
  return findAll(root, (node) => node.attributes[name] === value);
}

function setup(options = {}) {
  return createLevelScene({ phase: 'repair', ...options });
}

test('raíz de la escena con clase y data-level 2', () => {
  const scene = setup();
  assert.equal(scene.element.tag, 'section');
  assert.ok(classes(scene.element).includes('level-scene'));
  assert.equal(scene.element.getAttribute('data-level'), '2');
  assert.match(scene.element.getAttribute('aria-label') ?? '', /ascensor/i);
});

test('editorSlot reservado para el tablero real, vacío', () => {
  const scene = setup();
  assert.strictEqual(byAttr(scene.element, 'data-slot', 'editor').length, 1);
  const slot = findOne(scene.element, (n) => n.attributes['data-slot'] === 'editor', 'editorSlot');
  assert.strictEqual(scene.editorSlot, slot);
  assert.equal(slot.children.length, 0, 'el editor lo monta el parent');
  assert.match(slot.getAttribute('aria-label') ?? '', /tablero de cables/i);
});

test('statusSlot con aria-live para la marcha de la sala', () => {
  const scene = setup();
  const slot = findOne(scene.element, (n) => n.attributes['data-slot'] === 'status', 'statusSlot');
  assert.strictEqual(scene.statusSlot, slot);
  assert.equal(slot.getAttribute('aria-live'), 'polite');
});

test('la fase se lee en la placa y en la marcha', () => {
  const repair = setup({ phase: 'repair' });
  const build = setup({ phase: 'build' });
  const repairTexts = findAll(repair.element, () => true).map((n) => n.textContent);
  const buildTexts = findAll(build.element, () => true).map((n) => n.textContent);
  assert.ok(repairTexts.some((text) => text.includes('Reparación')));
  assert.ok(!repairTexts.some((text) => text.includes('Construcción')));
  assert.ok(buildTexts.some((text) => text.includes('Construcción')));
});

test('la escena no crea editor, cables, llaves ni juicio', () => {
  assert.ok(!source.includes('graphEditor'), 'sin importar el editor de grafos');
  assert.ok(!source.includes('drumEditor'), 'sin importar el editor de tambor');
  assert.ok(!source.includes('handleProbe'), 'sin lógica de probar');
  assert.ok(!source.includes('handleAssault'), 'sin lógica de ensayo');
  assert.ok(!source.includes('toMachine'), 'sin construir máquinas');
  const scene = setup();
  const tags = new Set(findAll(scene.element, () => true).map((node) => node.tag));
  assert.ok(!tags.has('canvas'), 'sin canvas propio');
  for (const banned of ['wire', 'edge', 'state', 'drum', 'tape', 'key', 'palette']) {
    assert.equal(
      findAll(scene.element, (node) => classes(node).includes(banned)).length,
      0,
      `sin nodos .${banned}`,
    );
  }
});

test('placeholders de sala sin imágenes externas y con aria', () => {
  assert.ok(!source.includes('https://'), 'sin URLs externas');
  for (const raster of ['.png', '.jpg', '.webp', 'src=', 'href=']) {
    assert.ok(!source.includes(raster), `sin raster ${raster} en el JS`);
  }
  const scene = setup();
  const gauge = findOne(scene.element, (n) => classes(n).includes('l2-gauge-svg'), 'indicador');
  assert.equal(gauge.attributes.role, 'img');
  assert.match(gauge.attributes['aria-label'] ?? '', /pisos/i);
  const props = findOne(scene.element, (n) => classes(n).includes('l2-props'), 'props');
  assert.equal(props.attributes['aria-hidden'], 'true');
  assert.ok(findAll(scene.element, (n) => classes(n).includes('l2-pinion-svg')).length >= 1);
  assert.ok(findAll(scene.element, (n) => classes(n).includes('l2-relay')).length >= 1);
  const captions = findAll(scene.element, () => true).map((n) => n.textContent);
  assert.ok(captions.some((text) => /a producir/i.test(text)), 'marca qué falta por producir');
});

test('los datos viajan por textContent, sin innerHTML', () => {
  assert.ok(!source.includes('.innerHTML'), 'sin asignar innerHTML');
  assert.ok(!source.includes('insertAdjacentHTML'), 'sin insertAdjacentHTML');
  const evil = '<img src=x onerror=alert(1)>';
  const scene = setup();
  scene.editorSlot.textContent = evil;
  assert.equal(scene.editorSlot.children.length, 0);
  assert.equal(scene.editorSlot.textContent, evil);
});

test('vocabulario de taller, sin términos académicos', () => {
  const haystack = `${source}\n${css}`.toLowerCase();
  for (const banned of ['autómata', 'automata', 'transición', 'transicion', 'lenguaje', 'estado']) {
    assert.ok(!haystack.includes(banned), `sin «${banned}» en la escena`);
  }
  assert.ok(!/\bafd\b/.test(haystack), 'sin «AFD» en la escena');
});

test('el CSS vive bajo .level-scene[data-level="2"], con foco y movimiento reducido', () => {
  assert.ok(css.includes('.level-scene[data-level="2"]'), 'alcance del nivel 2');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('44px'), 'blancos táctiles de 44 px');
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const chunks = clean.split('}');
  for (const chunk of chunks) {
    const brace = chunk.indexOf('{');
    if (brace === -1) {
      continue;
    }
    const head = chunk.slice(0, brace).trim();
    if (head.startsWith('@media')) {
      continue;
    }
    for (const part of head.split(',')) {
      selectors.push(part.trim());
    }
  }
  assert.ok(selectors.length > 0, 'hay reglas propias');
  for (const selector of selectors) {
    assert.ok(selector.includes('.level-scene'), `regla con alcance: ${selector}`);
  }
});

test('dispose suelta la escena y vacía los slots', () => {
  const scene = setup();
  const parent = element('div');
  parent.append(scene.element);
  scene.editorSlot.textContent = 'tablero del parent';
  scene.dispose();
  assert.ok(scene.element.removed, 'la escena se suelta del taller');
  assert.equal(parent.children.length, 0);
  assert.equal(scene.editorSlot.children.length, 0);
  assert.equal(scene.statusSlot.children.length, 0);
});
