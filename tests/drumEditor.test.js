import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrumEditor } from '../src/ui/drumEditor.js';
const sections = [
  { id: 'seek', label: 'Buscar el final', start: true },
  { id: 'carry', label: 'Llevar' },
  { id: 'done', label: 'Listo', accept: true }
];
const symbols = ['0', '1', '_'];
const labels = { _: '' };
const rules = {
  seek: { 0: { write: '0', move: 'R', to: 'seek' } },
  carry: { 1: { write: '1', move: 'L', to: 'carry' } },
  done: {}
};
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
      if (listeners.has(type) === false) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    fire(type, event = {}) {
      for (const handler of listeners.get(type) ?? []) {
        handler(event);
      }
    }
  };
}
globalThis.document = {
  createElement: (tag) => element(tag)
};
function collect(nodes, className) {
  const found = [];
  for (const node of nodes) {
    const classes = (node.attributes.class ?? '').split(' ');
    if (classes.includes(className) === true) {
      found.push(node);
    }
    found.push(...collect(node.children, className));
  }
  return found;
}
function byLabel(nodes, label) {
  return nodes.find((node) => node.attributes['aria-label'] === label);
}
function ruleText(pin) {
  return pin.children.map((child) => child.textContent).join(' ');
}
function sectionBadges(root, title) {
  const wraps = collect(root.children, 'drum-section');
  const found = wraps.find((node) => node.children[0].children[0].textContent === title);
  const pins = collect(found.children, 'drum-pin');
  return pins.map((pin) => pin.children[0].textContent);
}
function setup(current = structuredClone(rules)) {
  const calls = [];
  const root = element('div');
  const editor = createDrumEditor({ root, sections, symbols, labels, rules: current, onEdit: (edit) => calls.push(edit) });
  return { root, editor, calls };
}
test('every section renders one pin per symbol', () => {
  const { root } = setup();
  const pins = collect(root.children, 'drum-pin');
  assert.equal(pins.length, sections.length * symbols.length);
  assert.equal(ruleText(byLabel(pins, 'Sección Llevar, símbolo 1')).includes('alarma'), false);
  assert.equal(ruleText(byLabel(pins, 'Sección Llevar, símbolo 0')).includes('alarma'), true);
});
test('clicking a pin opens the inline editor', () => {
  const { root } = setup();
  assert.equal(collect(root.children, 'pin-choice').length, 0);
  byLabel(collect(root.children, 'drum-pin'), 'Sección Llevar, símbolo 1').fire('click');
  assert.ok(collect(root.children, 'pin-choice').length > 0);
  assert.equal(collect(root.children, 'pin-editor').length, 1);
});
test('Guardar emits the pin', () => {
  const { root, calls } = setup();
  byLabel(collect(root.children, 'drum-pin'), 'Sección Llevar, símbolo 1').fire('click');
  byLabel(collect(root.children, 'pin-choice'), 'Escribe vacío').fire('click');
  byLabel(collect(root.children, 'pin-choice'), 'Guardar').fire('click');
  assert.deepEqual(calls, [{ type: 'set-pin', section: 'carry', read: '1', pin: { write: '_', move: 'L', to: 'carry' } }]);
});
test('Vaciar emits null', () => {
  const { root, calls } = setup();
  byLabel(collect(root.children, 'drum-pin'), 'Sección Llevar, símbolo 1').fire('click');
  byLabel(collect(root.children, 'pin-choice'), 'Vaciar').fire('click');
  assert.deepEqual(calls, [{ type: 'set-pin', section: 'carry', read: '1', pin: null }]);
});
test('light marks the section and the pin', () => {
  const { root, editor } = setup();
  editor.light('carry', '1');
  const litSections = collect(root.children, 'is-lit');
  assert.ok(litSections.length >= 2);
  const pins = collect(root.children, 'drum-pin');
  const litPin = byLabel(pins, 'Sección Llevar, símbolo 1');
  assert.equal(litPin.attributes.class.split(' ').includes('is-lit'), true);
  const coldPin = byLabel(pins, 'Sección Llevar, símbolo 0');
  assert.equal(coldPin.attributes.class.split(' ').includes('is-lit'), false);
  editor.clearLight();
  assert.equal(collect(root.children, 'is-lit').length, 0);
});
test('Escape closes the editor', () => {
  const { root } = setup();
  byLabel(collect(root.children, 'drum-pin'), 'Sección Llevar, símbolo 1').fire('click');
  assert.equal(collect(root.children, 'pin-editor').length, 1);
  collect(root.children, 'pin-editor')[0].fire('keydown', { key: 'Escape' });
  assert.equal(collect(root.children, 'pin-editor').length, 0);
});
test('pins follow the tape symbol order even when rules list 1 before 0', () => {
  const flipped = { seek: { 1: { write: '1', move: 'R', to: 'seek' }, 0: { write: '0', move: 'R', to: 'seek' } }, carry: {}, done: {} };
  const { root } = setup(flipped);
  assert.deepEqual(sectionBadges(root, 'Buscar el final'), ['0', '1', 'vacío']);
});
test('each pin shows its read symbol', () => {
  const { root } = setup();
  assert.deepEqual(sectionBadges(root, 'Llevar'), ['0', '1', 'vacío']);
  assert.deepEqual(sectionBadges(root, 'Listo'), ['0', '1', 'vacío']);
});
test('accept section pins are final and emit nothing', () => {
  const { root, calls } = setup();
  const pins = collect(root.children, 'drum-pin');
  const finals = pins.filter((pin) => (pin.attributes['aria-label'] ?? '').includes('(final)'));
  assert.equal(finals.length, symbols.length);
  for (const pin of finals) {
    assert.equal(pin.attributes.class.split(' ').includes('is-final'), true);
    assert.equal(ruleText(pin).includes('final'), true);
    assert.equal(ruleText(pin).includes('alarma'), false);
    assert.equal(pin.disabled, true);
    pin.fire('click');
  }
  assert.deepEqual(calls, []);
  assert.equal(collect(root.children, 'pin-editor').length, 0);
});
