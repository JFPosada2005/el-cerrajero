import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { judge } from '../src/game/judge.js';
const alphabet = level1.keys.map((entry) => entry.symbol);
const repair = level1.phases.repair;
const build = level1.phases.build;
function decide(puzzle, wires) {
  return judge(puzzle, toMachine(alphabet, puzzle, { wires }));
}
function repairedWires() {
  let blueprint = structuredClone(repair.blueprint);
  const first = applyEdit(repair, level1.parts, blueprint, { type: 'cut-wire', from: 'q0', to: 'q3' });
  blueprint = first.blueprint;
  const second = applyEdit(repair, level1.parts, blueprint, { type: 'cut-wire', from: 'q1', to: 'q3' });
  blueprint = second.blueprint;
  const third = applyEdit(repair, level1.parts, blueprint, { type: 'connect-wire', from: 'q1', to: 'q2', tool: { kind: 'key', key: '2' } });
  return third.blueprint.wires;
}
function builtWires() {
  let blueprint = structuredClone(build.blueprint);
  for (const [from, to, key] of [['b0', 'b1', '3'], ['b1', 'b2', '1'], ['b2', 'b3', '4']]) {
    const result = applyEdit(build, level1.parts, blueprint, { type: 'connect-wire', from, to, tool: { kind: 'key', key } });
    blueprint = result.blueprint;
  }
  return blueprint.wires;
}
test('the contract names the client and the rule', () => {
  assert.equal(level1.contract, '01');
  assert.equal(typeof level1.client, 'string');
  assert.ok(level1.client.length > 0);
  assert.match(repair.goal, /1/);
});
test('the initial repair blueprint leaves an intruder key', () => {
  const verdict = decide(repair, structuredClone(repair.blueprint.wires));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'intruder');
  assert.equal(verdict.counterexample, '2');
});
test('cutting both crossed wires and adding the middle one repairs the mechanism', () => {
  const verdict = decide(repair, repairedWires());
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
test('the blank build blueprint locks out the client key', () => {
  const verdict = decide(build, structuredClone(build.blueprint.wires));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.counterexample, '314');
});
test('wiring 3-1-4 builds the client mechanism', () => {
  const verdict = decide(build, builtWires());
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
