import test from 'node:test';
import assert from 'node:assert/strict';
import { level2 } from '../src/game/level2.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { judge } from '../src/game/judge.js';
const alphabet = level2.keys.map((entry) => entry.symbol);
const repair = level2.phases.repair;
const build = level2.phases.build;
function decide(puzzle, wires) {
  return judge(puzzle, toMachine(alphabet, puzzle, { wires }));
}
function connectAll(puzzle, parts, pairs) {
  let blueprint = { wires: [] };
  for (const [from, to, key] of pairs) {
    const result = applyEdit(puzzle, parts, blueprint, { type: 'connect-wire', from, to, tool: { kind: 'key', key } });
    blueprint = result.blueprint;
  }
  return blueprint.wires;
}
test('the initial repair blueprint locks out the client key', () => {
  const verdict = decide(repair, structuredClone(repair.blueprint.wires));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.counterexample, '12');
});
test('connecting the missing loop repairs the elevator', () => {
  let blueprint = structuredClone(repair.blueprint);
  const result = applyEdit(repair, level2.parts, blueprint, { type: 'connect-wire', from: 'o', to: 'o', tool: { kind: 'key', key: '2' } });
  blueprint = result.blueprint;
  const verdict = decide(repair, blueprint.wires);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
test('the blank build blueprint is not correct', () => {
  const verdict = decide(build, structuredClone(build.blueprint.wires));
  assert.equal(verdict.correct, false);
});
test('wiring the ends-with-2-1 mechanism builds the client mechanism', () => {
  const wires = connectAll(build, level2.parts, [['s0', 's0', '1'], ['s0', 's1', '2'], ['s1', 's2', '1'], ['s1', 's1', '2'], ['s2', 's0', '1'], ['s2', 's1', '2']]);
  const verdict = decide(build, wires);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
