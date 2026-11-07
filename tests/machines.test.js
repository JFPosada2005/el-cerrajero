import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/legacy-level.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { areEquivalentDFA } from '../src/core/dfa.js';

const cells = level1.states;
const alphabet = level1.alphabet;

function initialBlueprint() {
  return { wires: [{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q3', key: '2' }, { from: 'q1', to: 'q3', key: '1' }, { from: 'q2', to: 'q3', key: '3' }] };
}

function repairedBlueprint() {
  const cutQ0 = applyEdit({}, ['wire'], initialBlueprint(), { type: 'cut-wire', from: 'q0', to: 'q3' });
  const cutQ1 = applyEdit({}, ['wire'], cutQ0.blueprint, { type: 'cut-wire', from: 'q1', to: 'q3' });
  const added = applyEdit({}, ['wire'], cutQ1.blueprint, { type: 'connect-wire', from: 'q1', to: 'q2', tool: { kind: 'key', key: '2' } });
  return added.blueprint;
}

test('a repaired level-1 blueprint produces a DFA equivalent to the L1 target', () => {
  const machine = toMachine(alphabet, { cells }, repairedBlueprint());
  assert.equal(areEquivalentDFA(machine, level1.target).equivalent, true);
});

test('the alphabet order is preserved', () => {
  const machine = toMachine(alphabet, { cells }, repairedBlueprint());
  assert.deepEqual(machine.alphabet, ['1', '2', '3', '4']);
  const shuffled = toMachine(['4', '3', '2', '1'], { cells }, repairedBlueprint());
  assert.deepEqual(shuffled.alphabet, ['4', '3', '2', '1']);
});

test('spring wires are ignored', () => {
  const plain = toMachine(alphabet, { cells }, { wires: [{ from: 'q0', to: 'q1', key: '1' }] });
  const withSpring = toMachine(alphabet, { cells }, { wires: [{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q2', spring: true }] });
  assert.deepEqual(withSpring.transitions, plain.transitions);
});

test('duplicate (from, key) wires throw', () => {
  const blueprint = { wires: [{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q2', key: '1' }] };
  assert.throws(() => toMachine(alphabet, { cells }, blueprint), Error);
});

test('missing start throws', () => {
  const cells = [{ id: 'q0' }, { id: 'q1', accept: true }];
  assert.throws(() => toMachine(alphabet, { cells }, { wires: [] }), Error);
});
