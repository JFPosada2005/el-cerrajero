import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { createGraphEditor } from '../src/ui/graphEditor.js';
const repair = level1.phases.repair;
const cells = repair.cells;
const alphabet = level1.keys.map((entry) => entry.symbol);
function element(tag) {
  const listeners = new Map();
  return {
    tag,
    attributes: {},
    children: [],
    textContent: '',
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = [...nodes];
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    fire(type, event = {}) {
      for (const handler of listeners.get(type) ?? []) {
        handler(event);
      }
    },
  };
}
globalThis.document = {
  createElementNS: (namespace, tag) => element(tag),
};
function collect(nodes, className) {
  const found = [];
  for (const node of nodes) {
    const classes = (node.attributes.class ?? '').split(' ');
    if (classes.includes(className)) {
      found.push(node);
    }
    found.push(...collect(node.children, className));
  }
  return found;
}
function byLabel(nodes, label) {
  return nodes.find((node) => node.attributes['aria-label'] === label);
}
function setup(wires) {
  const blueprint = { wires: wires ?? structuredClone(repair.blueprint.wires) };
  const calls = { connect: [], cut: [] };
  const svg = element('svg');
  const editor = createGraphEditor({
    svg,
    cells,
    alphabet,
    blueprint,
    onConnect: (...args) => calls.connect.push(args),
    onCut: (...args) => calls.cut.push(args),
  });
  return { svg, editor, calls, blueprint };
}
function multiKeyWires() {
  return [{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q1', key: '2' }, { from: 'q2', to: 'q3', key: '3' }];
}
test('clicking two cells connects them with the active key', () => {
  const { svg, calls } = setup();
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 1').fire('click');
  assert.deepEqual(calls.connect, [['q0', 'q1', { kind: 'key', key: '1' }]]);
});
test('the active key reaches the editor', () => {
  const { svg, editor, calls } = setup();
  editor.setSelectedKey('2');
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 2').fire('click');
  assert.deepEqual(calls.connect, [['q0', 'q2', { kind: 'key', key: '2' }]]);
});
test('wires are inert until the scissors tool is active', () => {
  const { svg, calls } = setup();
  const wire = collect(svg.children, 'wire')[0];
  assert.equal(wire.attributes.tabindex, undefined);
  wire.fire('click');
  assert.deepEqual(calls.cut, []);
});
test('the scissors tool turns every cable into a cut target', () => {
  const { svg, editor, calls } = setup();
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  assert.ok(wires.length > 0);
  assert.equal(wires[0].attributes.tabindex, '0');
  wires[0].fire('click');
  assert.deepEqual(calls.cut, [['q0', 'q1']]);
});
test('the scissors cut the whole cable with one call', () => {
  const { svg, editor, calls } = setup(multiKeyWires());
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  const target = wires.find((wire) => wire.attributes['aria-label'] === 'Cortar cable 1,2: Entrada a Celda 1');
  target.fire('click');
  assert.deepEqual(calls.cut, [['q0', 'q1']]);
});
test('Enter cuts a cable in scissors mode', () => {
  const { svg, editor, calls } = setup();
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  wires[0].fire('keydown', { key: 'Enter', preventDefault() {} });
  assert.deepEqual(calls.cut, [['q0', 'q1']]);
});
test('Space cuts a cable in scissors mode', () => {
  const { svg, editor, calls } = setup();
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  wires[0].fire('keydown', { key: ' ', preventDefault() {} });
  assert.deepEqual(calls.cut, [['q0', 'q1']]);
});
test('clicking a cell in scissors mode does not connect', () => {
  const { svg, editor, calls } = setup();
  editor.setCutting();
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 1').fire('click');
  assert.deepEqual(calls.connect, []);
});
test('Escape cancels a pending cell', () => {
  const { svg, calls } = setup();
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  svg.fire('keydown', { key: 'Escape' });
  byLabel(collect(svg.children, 'state'), 'Celda 1').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 2').fire('click');
  assert.deepEqual(calls.connect, [['q1', 'q2', { kind: 'key', key: '1' }]]);
});
test('a cable with several keys is drawn once with all its labels', () => {
  const { svg } = setup(multiKeyWires());
  const labels = collect(svg.children, 'edge-label').map((node) => node.textContent);
  assert.ok(labels.includes('1,2'));
  assert.equal(collect(svg.children, 'wire').length, 2);
});
test('the cut label names every key on the cable', () => {
  const { svg, editor } = setup(multiKeyWires());
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  const target = wires.find((wire) => wire.attributes['aria-label'] === 'Cortar cable 1,2: Entrada a Celda 1');
  assert.ok(target);
});
test('setBlueprint replaces the cables and re-renders', () => {
  const { svg, editor } = setup();
  assert.equal(collect(svg.children, 'wire').length, 4);
  editor.setBlueprint({ wires: [] });
  assert.equal(collect(svg.children, 'wire').length, 0);
  editor.setBlueprint({ wires: multiKeyWires() });
  assert.equal(collect(svg.children, 'wire').length, 2);
});
test('a spring is drawn dashed with no label', () => {
  const springCells = [{ id: 'e', label: 'Entrada', x: 100, y: 260 }, { id: 'w', label: 'Espera', x: 280, y: 260 }];
  const svg = element('svg');
  createGraphEditor({ svg, cells: springCells, alphabet, blueprint: { wires: [{ from: 'e', to: 'w', spring: true }] }, onConnect: () => {}, onCut: () => {} });
  const edges = collect(svg.children, 'edge');
  assert.equal(edges.length, 1);
  assert.ok(edges[0].attributes.class.split(' ').includes('edge'));
  assert.ok(edges[0].attributes.class.split(' ').includes('is-spring'));
  assert.equal(collect(svg.children, 'edge-label').length, 0);
});
test('the spring tool connects with a spring payload', () => {
  const { svg, editor, calls } = setup();
  editor.setSpring();
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 1').fire('click');
  assert.deepEqual(calls.connect, [['q0', 'q1', { kind: 'spring' }]]);
});
test('the cut label names a spring as a resorte', () => {
  const svg = element('svg');
  const editor = createGraphEditor({ svg, cells, alphabet, blueprint: { wires: [{ from: 'q0', to: 'q1', spring: true }] }, onConnect: () => {}, onCut: () => {} });
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  assert.equal(wires.length, 1);
  assert.equal(wires[0].attributes['aria-label'], 'Cortar resorte: Entrada a Celda 1');
});
const pdaStack = { base: 'Z', chip: 'X', labels: { base: 'base', chip: 'ficha' } };
const pdaCells = [{ id: 'q0', label: 'Entrada', x: 100, y: 260 }, { id: 'q1', label: 'Celda 1', x: 300, y: 260 }];
function setupStack(wires) {
  const svg = element('svg');
  createGraphEditor({ svg, cells: pdaCells, alphabet: ['A', 'B'], blueprint: { wires }, stack: pdaStack, onConnect: () => {}, onCut: () => {} });
  return svg;
}
test('a key wire with a stack condition shows the key, top and action', () => {
  const svg = setupStack([{ from: 'q0', to: 'q1', key: 'A', stack: { top: 'base', action: 'push' } }]);
  const labels = collect(svg.children, 'edge-label').map((node) => node.textContent);
  assert.deepEqual(labels, ['A · base · +ficha']);
});
test('a spring with a stack condition shows the top and action', () => {
  const svg = setupStack([{ from: 'q0', to: 'q1', spring: true, stack: { top: 'base', action: 'keep' } }]);
  const labels = collect(svg.children, 'edge-label').map((node) => node.textContent);
  assert.deepEqual(labels, ['base · =']);
});
test('wires with different stack conditions render separate labels', () => {
  const svg = setupStack([{ from: 'q0', to: 'q1', key: 'A', stack: { top: 'any', action: 'push' } }, { from: 'q0', to: 'q1', key: 'A', stack: { top: 'chip', action: 'pop' } }]);
  const labels = collect(svg.children, 'edge-label').map((node) => node.textContent);
  assert.deepEqual(labels, ['A · da igual · +ficha', 'A · ficha · -ficha']);
});
