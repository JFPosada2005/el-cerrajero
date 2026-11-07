import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { level3 } from '../src/game/level3.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { judge } from '../src/game/judge.js';
const repair = level1.phases.repair;
const alphabet = level1.keys.map((entry) => entry.symbol);
const cells = repair.cells;
function puzzle() {
  return repair;
}
function machineFor(wires) {
  return toMachine(alphabet, { cells }, { wires });
}
test('an equivalent machine returns correct true with exact method', () => {
  const player = machineFor([{ from: 'q0', to: 'q1', key: '1' }, { from: 'q1', to: 'q2', key: '2' }, { from: 'q2', to: 'q3', key: '3' }]);
  const verdict = judge(puzzle(), player);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
  assert.equal(verdict.expected, null);
  assert.equal(verdict.actual, null);
  assert.equal(verdict.method, 'exact');
  assert.equal(verdict.coverage, null);
});
test('a machine that accepts a key the target rejects returns intruder', () => {
  const player = machineFor([{ from: 'q0', to: 'q1', key: '1' }, { from: 'q0', to: 'q3', key: '2' }, { from: 'q1', to: 'q3', key: '1' }, { from: 'q2', to: 'q3', key: '3' }]);
  const verdict = judge(puzzle(), player);
  assert.equal(verdict.correct, false);
  assert.equal(verdict.counterexample, '2');
  assert.equal(verdict.reason, 'intruder');
  assert.equal(verdict.expected, false);
  assert.equal(verdict.actual, true);
  assert.equal(verdict.method, 'exact');
  assert.equal(verdict.coverage, null);
});
test('a machine that rejects the client key returns lockout', () => {
  const verdict = judge(puzzle(), machineFor([]));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.counterexample, '123');
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.expected, true);
  assert.equal(verdict.actual, false);
  assert.equal(verdict.method, 'exact');
  assert.equal(verdict.coverage, null);
});
test('an unsupported target kind throws', () => {
  const other = { cells, target: { kind: 'language', id: 'a-n-b-n' } };
  assert.throws(() => judge(other, machineFor([])), /judge: unsupported target kind: language/);
});
test('a wrong NFA against an NFA target fails with a concrete counterexample', () => {
  const puzzle = level3.phases.repair;
  const keys = level3.keys.map((entry) => entry.symbol);
  const player = toMachine(keys, puzzle, structuredClone(puzzle.blueprint));
  const verdict = judge(puzzle, player);
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.counterexample, '1122');
  assert.equal(verdict.expected, true);
  assert.equal(verdict.actual, false);
  assert.equal(verdict.method, 'exact');
  assert.equal(verdict.coverage, null);
});
test('the repaired NFA passes the exact judge', () => {
  const puzzle = level3.phases.repair;
  const keys = level3.keys.map((entry) => entry.symbol);
  let blueprint = structuredClone(puzzle.blueprint);
  const added = applyEdit(puzzle, level3.parts, blueprint, { type: 'connect-wire', from: 'w', to: 'w', tool: { kind: 'key', key: '1' } });
  blueprint = added.blueprint;
  const verdict = judge(puzzle, toMachine(keys, puzzle, blueprint));
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
  assert.equal(verdict.method, 'exact');
  assert.equal(verdict.coverage, null);
});
