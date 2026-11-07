import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/legacy-level.js';
import { createGraphEditor } from '../src/ui/graphEditor.js';

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
  return nodes.find(node => node.attributes['aria-label'] === label);
}

function setup(editTransitions) {
  const transitions = structuredClone(level1.initialTransitions);
  if (editTransitions) {
    editTransitions(transitions);
  }
  const calls = { connect: [], cut: [] };
  const svg = element('svg');
  const editor = createGraphEditor({
    svg,
    level: level1,
    transitions,
    onConnect: (...args) => calls.connect.push(args),
    onCut: (...args) => calls.cut.push(args),
  });
  return { svg, editor, calls, transitions };
}

test('clicking two cells connects them with the active key', () => {
  const { svg, calls } = setup();
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 1').fire('click');
  assert.deepEqual(calls.connect, [['q0', 'q1', '1']]);
});

test('the active key reaches the editor', () => {
  const { svg, editor, calls } = setup();
  editor.setSelectedKey('2');
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 2').fire('click');
  assert.deepEqual(calls.connect, [['q0', 'q2', '2']]);
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
  assert.equal(calls.cut.length, 1);
});

test('Enter cuts a cable in scissors mode', () => {
  const { svg, editor, calls } = setup();
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  wires[0].fire('keydown', { key: 'Enter', preventDefault() {} });
  assert.equal(calls.cut.length, 1);
});

test('clicking a cell in scissors mode does not connect', () => {
  const { svg, editor, calls } = setup();
  editor.setCutting();
  byLabel(collect(svg.children, 'state'), 'Entrada').fire('click');
  byLabel(collect(svg.children, 'state'), 'Celda 1').fire('click');
  assert.deepEqual(calls.connect, []);
});

test('a cable with several keys is drawn once with all its labels', () => {
  const { svg } = setup(transitions => {
    transitions.q0[2] = 'q1';
  });
  const labels = collect(svg.children, 'edge-label').map(node => node.textContent);
  assert.ok(labels.includes('1,2'));
  assert.equal(collect(svg.children, 'wire').length, 3);
});

test('the cut label names every key on the cable', () => {
  const { svg, editor } = setup(transitions => {
    transitions.q0[2] = 'q1';
  });
  editor.setCutting();
  const wires = collect(svg.children, 'wire');
  const target = wires.find(wire => wire.attributes['aria-label'] === 'Cortar cable 1,2: Entrada a Celda 1');
  assert.ok(target);
});
