import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGraphEditor } from '../src/ui/graphEditor.js';
import { decorateGraph } from '../src/ui/graphVisuals.js';
import { level1 } from '../src/game/level1.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = readFileSync(join(root, 'src', 'ui', 'graphVisuals.js'), 'utf8');
const css = readFileSync(join(root, 'src', 'ui', 'graphVisuals.css'), 'utf8');

// --- DOM falso mínimo (solo createElementNS + atributos + hijos) ---
function element(tag) {
  const listeners = new Map();
  const node = {
    tag,
    tagName: tag,
    attributes: {},
    children: [],
    textContent: '',
    parent: null,
    removed: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    append(...nodes) {
      for (const child of nodes) {
        this.children.push(child);
        child.parent = this;
      }
    },
    appendChild(child) {
      this.append(child);
      return child;
    },
    remove() {
      this.removed = true;
      if (this.parent) {
        this.parent.children = this.parent.children.filter((child) => child !== this);
      }
    },
    replaceChildren(...nodes) {
      this.children = [...nodes];
      for (const child of nodes) {
        child.parent = this;
      }
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    listenerCount(type) {
      return (listeners.get(type) ?? []).length;
    },
  };
  return node;
}

globalThis.document = {
  createElementNS: (namespace, tag) => element(tag),
};

const repair = level1.phases.repair;
const cells = repair.cells;
const alphabet = level1.keys.map((entry) => entry.symbol);

function setup(options = {}) {
  const blueprint = { wires: structuredClone(repair.blueprint.wires) };
  const svg = element('svg');
  svg.setAttribute('id', 'canvas');
  const editor = createGraphEditor({
    svg,
    cells,
    alphabet,
    blueprint,
    onConnect: () => {},
    onCut: () => {},
  });
  return { svg, editor, blueprint };
}

function tokens(node) {
  return (node.getAttribute('class') ?? '').split(' ').filter(Boolean);
}

function directGroups(svg, token) {
  return svg.children.filter(
    (child) => (child.tagName ?? child.tag) === 'g' && tokens(child).includes(token),
  );
}

function imagesOf(group) {
  return group.children.filter((child) => (child.tagName ?? child.tag) === 'image');
}

function hrefsOf(group) {
  return imagesOf(group).map((image) => image.getAttribute('href'));
}

test('la API devuelve { dispose } y decora sin romper el render', () => {
  const { svg } = setup();
  const statesBefore = directGroups(svg, 'state').length;
  const wiresBefore = directGroups(svg, 'wire').length;
  assert.ok(statesBefore > 0 && wiresBefore > 0);
  const view = decorateGraph(svg, { level: level1, cells });
  assert.equal(typeof view.dispose, 'function');
  assert.ok(tokens(svg).includes('gv-decorated'));
  assert.equal(directGroups(svg, 'state').length, statesBefore, 'sin grupos de celda nuevos');
  assert.equal(directGroups(svg, 'wire').length, wiresBefore, 'sin grupos de cable nuevos');
  view.dispose();
});

test('N1 usa los assets finales por rol', () => {
  const { svg } = setup();
  const view = decorateGraph(svg, { level: level1, cells });
  const byLabel = new Map(directGroups(svg, 'state').map((group) => [group.getAttribute('aria-label'), group]));
  assert.deepEqual(hrefsOf(byLabel.get('Entrada')), ['assets/levels/01/props/entry.webp']);
  const lockHrefs = hrefsOf(byLabel.get('Cerrojo'));
  assert.ok(lockHrefs.includes('assets/levels/01/props/lock.webp'), 'cuerpo del cerrojo final');
  assert.ok(lockHrefs.includes('mockups/nivel-1-taller/assets/sprites/perno.svg'), 'el perno sigue en mockups: no tiene slot final');
  for (const label of ['Celda 1', 'Celda 2']) {
    assert.deepEqual(hrefsOf(byLabel.get(label)), ['assets/levels/01/props/gear.webp']);
  }
  view.dispose();
});

test('los sprites finales existen en disco y el perno sigue en el mockup', () => {
  const { svg } = setup();
  const view = decorateGraph(svg, { level: level1, cells });
  for (const group of directGroups(svg, 'state')) {
    for (const href of hrefsOf(group)) {
      assert.ok(
        href.startsWith('assets/levels/01/props/') || href.startsWith('mockups/nivel-1-taller/assets/sprites/'),
        `ruta trazable: ${href}`,
      );
      assert.ok(existsSync(join(root, href)), `el sprite existe: ${href}`);
    }
    for (const image of imagesOf(group)) {
      assert.equal(image.getAttribute('aria-hidden'), 'true', 'decorado puro, fuera del árbol accesible');
    }
  }
  view.dispose();
});

test('no toca grupos interactivos: atributos, focos y listeners intactos', () => {
  const { svg } = setup();
  const snapshot = new Map(
    directGroups(svg, 'state').map((group) => [
      group.getAttribute('aria-label'),
      {
        class: group.getAttribute('class'),
        role: group.getAttribute('role'),
        tabindex: group.getAttribute('tabindex'),
        transform: group.getAttribute('transform'),
        aria: group.getAttribute('aria-label'),
        click: group.listenerCount('click'),
        keydown: group.listenerCount('keydown'),
        children: group.children.length,
      },
    ]),
  );
  const wireSnapshot = directGroups(svg, 'wire').map((wire) => ({
    label: wire.getAttribute('aria-label'),
    tabindex: wire.getAttribute('tabindex'),
  }));
  const view = decorateGraph(svg, { level: level1, cells });
  for (const group of directGroups(svg, 'state')) {
    const before = snapshot.get(group.getAttribute('aria-label'));
    assert.equal(group.getAttribute('role'), before.role);
    assert.equal(group.getAttribute('tabindex'), before.tabindex);
    assert.equal(group.getAttribute('transform'), before.transform);
    assert.equal(group.listenerCount('click'), before.click, 'sin listeners nuevos ni robados');
    assert.equal(group.listenerCount('keydown'), before.keydown);
    assert.equal(
      group.children.length,
      before.children + imagesOf(group).length,
      'solo se agregan imágenes, nada se quita',
    );
  }
  const afterWires = directGroups(svg, 'wire').map((wire) => ({
    label: wire.getAttribute('aria-label'),
    tabindex: wire.getAttribute('tabindex'),
  }));
  assert.deepEqual(afterWires.map((wire) => wire.label), wireSnapshot.map((wire) => wire.label));
  assert.deepEqual(afterWires.map((wire) => wire.tabindex), wireSnapshot.map((wire) => wire.tabindex));
  view.dispose();
});

test('los cables toman trenza por llave sin cambiar el modelo', () => {
  const { svg, blueprint } = setup();
  const before = structuredClone(blueprint);
  const view = decorateGraph(svg, { level: level1, cells });
  const tones = directGroups(svg, 'wire').map((wire) =>
    tokens(wire).find((token) => token.startsWith('gv-key-') || token === 'gv-spring'),
  );
  assert.ok(tones.length > 0);
  for (const tone of tones) {
    assert.ok(/^gv-key-(gold|teal|coral|violet)$/.test(tone), `trenza por llave: ${tone}`);
  }
  assert.deepEqual(blueprint, before, 'el modelo de datos no cambia');
  assert.deepEqual(cells, repair.cells, 'las celdas no cambian');
  view.dispose();
});

test('la tijera tiñe cada cable con su llave: oro, teal, coral y violeta', () => {
  const svg = element('svg');
  createGraphEditor({
    svg,
    cells,
    alphabet,
    blueprint: {
      wires: [
        { from: 'q0', to: 'q1', key: '1' },
        { from: 'q0', to: 'q2', key: '2' },
        { from: 'q1', to: 'q3', key: '3' },
        { from: 'q2', to: 'q3', key: '4' },
      ],
    },
    onConnect: () => {},
    onCut: () => {},
  });
  const view = decorateGraph(svg, { level: level1, cells });
  const tones = directGroups(svg, 'wire').map((wire) =>
    tokens(wire).find((token) => token.startsWith('gv-key-')),
  );
  assert.deepEqual(tones, ['gv-key-gold', 'gv-key-teal', 'gv-key-coral', 'gv-key-violet']);
  view.dispose();
});

test('el resorte se marca como resorte, sin tono de llave', () => {
  const svg = element('svg');
  createGraphEditor({
    svg,
    cells: [
      { id: 'e', label: 'Entrada', x: 100, y: 260 },
      { id: 'w', label: 'Espera', x: 280, y: 260 },
    ],
    alphabet,
    blueprint: { wires: [{ from: 'e', to: 'w', spring: true }] },
    onConnect: () => {},
    onCut: () => {},
  });
  const view = decorateGraph(svg, { level: level1, cells });
  const wire = directGroups(svg, 'wire')[0];
  assert.ok(tokens(wire).includes('gv-spring'));
  assert.equal(tokens(wire).some((token) => token.startsWith('gv-key-')), false);
  view.dispose();
});

test('N2 usa el fallback con los assets finales del N1', () => {
  const { svg } = setup();
  const view = decorateGraph(svg, { level: { id: 2 }, cells });
  assert.ok(tokens(svg).includes('gv-level-2'));
  const byLabel = new Map(directGroups(svg, 'state').map((group) => [group.getAttribute('aria-label'), group]));
  assert.deepEqual(hrefsOf(byLabel.get('Entrada')), ['assets/levels/01/props/entry.webp']);
  for (const label of ['Cerrojo', 'Celda 1', 'Celda 2']) {
    for (const href of hrefsOf(byLabel.get(label))) {
      assert.equal(href, 'assets/levels/01/props/gear.webp');
      assert.ok(existsSync(join(root, href)));
    }
  }
  view.dispose();
});

test('dispose retira la decoración y restaura las clases', () => {
  const { svg } = setup();
  const classesBefore = svg.children.map((child) => child.getAttribute('class'));
  const view = decorateGraph(svg, { level: level1, cells });
  view.dispose();
  assert.equal(tokens(svg).includes('gv-decorated'), false);
  assert.deepEqual(
    svg.children.map((child) => child.getAttribute('class')),
    classesBefore,
  );
  assert.equal(
    svg.children.flatMap((child) => child.children).filter((child) => (child.tagName ?? child.tag) === 'image').length,
    0,
    'sin imágenes residuales',
  );
});

test('el módulo no crea lógica: sin editor, juicio, máquinas ni innerHTML', () => {
  for (const banned of ['graphEditor', 'drumEditor', 'handleProbe', 'handleAssault', 'toMachine', 'judge(', 'applyEdit', 'onConnect', 'onCut', '.innerHTML', 'createElement(']) {
    assert.ok(!source.includes(banned), `sin ${banned}: solo decora el SVG`);
  }
  assert.ok(source.includes('decorateGraph'), 'exporta decorateGraph');
  assert.ok(source.includes('MutationObserver'), 'sobrevive al re-render del editor');
});

test('css con alcance, trenzas por llave, foco, 44 px y movimiento reducido', () => {
  assert.ok(css.includes('gv-decorated'), 'todo vive bajo la clase del SVG');
  for (const line of css.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('.state') || trimmed.startsWith('.wire') || trimmed.startsWith('.edge')) {
      assert.fail(`regla sin alcance: ${trimmed}`);
    }
  }
  for (const tone of ['gold', 'teal', 'coral', 'violet']) {
    assert.ok(css.includes(`gv-key-${tone}`), `trenza ${tone}`);
  }
  assert.ok(css.includes(':focus-visible'), 'foco visible');
  assert.ok(css.includes('prefers-reduced-motion'), 'respeta movimiento reducido');
  assert.ok(css.includes('44'), 'hit area de 44 px');
  assert.ok(!css.includes('* {'), 'sin resets globales');
});
