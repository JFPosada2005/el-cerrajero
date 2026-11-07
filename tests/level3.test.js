import test from 'node:test';
import assert from 'node:assert/strict';
import { level3 } from '../src/game/level3.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { judge } from '../src/game/judge.js';
const alphabet = level3.keys.map((entry) => entry.symbol);
const repair = level3.phases.repair;
const build = level3.phases.build;
function decide(puzzle, wires) {
  return judge(puzzle, toMachine(alphabet, puzzle, { wires }));
}
function addWire(puzzle, blueprint, from, to, tool) {
  const result = applyEdit(puzzle, level3.parts, blueprint, { type: 'connect-wire', from, to, tool });
  return result.blueprint;
}
test('the initial repair blueprint locks out the client key 1122', () => {
  const verdict = decide(repair, structuredClone(repair.blueprint.wires));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.counterexample, '1122');
});
test('adding the waiting loop on key 1 repairs the day cell', () => {
  let blueprint = structuredClone(repair.blueprint);
  blueprint = addWire(repair, blueprint, 'w', 'w', { kind: 'key', key: '1' });
  const verdict = decide(repair, blueprint.wires);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
test('the initial build blueprint locks out the night key 211', () => {
  const verdict = decide(build, structuredClone(build.blueprint.wires));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.counterexample, '211');
});
test('wiring the six night wires builds the museum mechanism', () => {
  let blueprint = structuredClone(build.blueprint);
  blueprint = addWire(build, blueprint, 'e', 'nw', { kind: 'spring' });
  blueprint = addWire(build, blueprint, 'nw', 'nw', { kind: 'key', key: '1' });
  blueprint = addWire(build, blueprint, 'nw', 'nw', { kind: 'key', key: '2' });
  blueprint = addWire(build, blueprint, 'nw', 'n1', { kind: 'key', key: '2' });
  blueprint = addWire(build, blueprint, 'n1', 'n2', { kind: 'key', key: '1' });
  blueprint = addWire(build, blueprint, 'n2', 'lock', { kind: 'key', key: '1' });
  const verdict = decide(build, blueprint.wires);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
