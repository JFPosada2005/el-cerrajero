import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { level3 } from '../src/game/level3.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { areEquivalentDFA } from '../src/core/dfa.js';
import { EPSILON } from '../src/core/symbols.js';
const repair = level1.phases.repair;
const cells = repair.cells;
const alphabet = level1.keys.map((entry) => entry.symbol);
function initialBlueprint() {
  return structuredClone(repair.blueprint);
}
function repairedBlueprint() {
  const cutQ0 = applyEdit(repair, level1.parts, initialBlueprint(), { type: 'cut-wire', from: 'q0', to: 'q3' });
  const cutQ1 = applyEdit(repair, level1.parts, cutQ0.blueprint, { type: 'cut-wire', from: 'q1', to: 'q3' });
  const added = applyEdit(repair, level1.parts, cutQ1.blueprint, { type: 'connect-wire', from: 'q1', to: 'q2', tool: { kind: 'key', key: '2' } });
  return added.blueprint;
}
test('a repaired level-1 blueprint produces a DFA equivalent to the L1 target', () => {
  const machine = toMachine(alphabet, { cells }, repairedBlueprint());
  assert.equal(areEquivalentDFA(machine, repair.target.machine).equivalent, true);
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
  const bare = [{ id: 'q0' }, { id: 'q1', accept: true }];
  assert.throws(() => toMachine(alphabet, { cells: bare }, { wires: [] }), Error);
});
test('an NFA puzzle builds springs as epsilon and forks as branch targets', () => {
  const puzzle = level3.phases.repair;
  const keys = level3.keys.map((entry) => entry.symbol);
  const wires = [{ from: 'e', to: 'w', spring: true }, { from: 'w', to: 'd1', key: '1' }, { from: 'w', to: 'w', key: '1' }, { from: 'w', to: 'w', key: '2' }];
  const machine = toMachine(keys, puzzle, { wires });
  assert.equal(machine.type, 'nfa');
  assert.deepEqual(machine.transitions.e[EPSILON], ['w']);
  assert.deepEqual(machine.transitions.w['1'], ['w', 'd1']);
  assert.deepEqual(machine.transitions.w['2'], ['w']);
});
test('an NFA puzzle throws for a wire from an unknown cell', () => {
  const puzzle = level3.phases.repair;
  const keys = level3.keys.map((entry) => entry.symbol);
  assert.throws(() => toMachine(keys, puzzle, { wires: [{ from: 'qx', to: 'w', key: '1' }] }), /unknown cell/);
});
test('a PDA puzzle expands any and maps push pop keep with a spring epsilon rule', () => {
  const puzzle = { cells: [{ id: 'q0', start: true }, { id: 'q1', accept: true }], stack: { base: 'Z', chip: 'X' }, target: { kind: 'language', id: 'a-n-b-n' } };
  const wires = [{ from: 'q0', to: 'q0', key: 'A', stack: { top: 'any', action: 'push' } }, { from: 'q0', to: 'q1', key: 'B', stack: { top: 'chip', action: 'pop' } }, { from: 'q0', to: 'q1', spring: true, stack: { top: 'base', action: 'keep' } }];
  const machine = toMachine(['A', 'B'], puzzle, { wires }, 'pda');
  assert.equal(machine.type, 'pda');
  assert.deepEqual(machine.stackAlphabet, ['Z', 'X']);
  assert.equal(machine.stackStart, 'Z');
  assert.deepEqual(machine.transitions.filter((rule) => rule.read === 'A'), [{ from: 'q0', read: 'A', pop: 'Z', push: 'XZ', to: 'q0' }, { from: 'q0', read: 'A', pop: 'X', push: 'XX', to: 'q0' }]);
  assert.deepEqual(machine.transitions.filter((rule) => rule.read === 'B'), [{ from: 'q0', read: 'B', pop: 'X', push: '', to: 'q1' }]);
  assert.deepEqual(machine.transitions.filter((rule) => rule.read === EPSILON), [{ from: 'q0', read: EPSILON, pop: 'Z', push: 'Z', to: 'q1' }]);
});
test('a PDA puzzle without a stack throws', () => {
  const puzzle = { cells: [{ id: 'q0', start: true }, { id: 'q1', accept: true }], target: { kind: 'language', id: 'a-n-b-n' } };
  assert.throws(() => toMachine(['A', 'B'], puzzle, { wires: [] }, 'pda'), /stack/);
});
