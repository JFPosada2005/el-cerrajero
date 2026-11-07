import test from 'node:test';
import assert from 'node:assert/strict';
import { level4 } from '../src/game/level4.js';
import { applyEdit } from '../src/game/blueprint.js';
import { toMachine } from '../src/game/machines.js';
import { judge } from '../src/game/judge.js';
const keys = level4.keys.map((entry) => entry.symbol);
const repair = level4.phases.repair;
const build = level4.phases.build;
function decide(puzzle, blueprint) {
  return judge(puzzle, toMachine(keys, puzzle, blueprint, level4.machine));
}
function addWire(puzzle, blueprint, from, to, tool) {
  const result = applyEdit(puzzle, level4.parts, blueprint, { type: 'connect-wire', from, to, tool });
  return result.blueprint;
}
test('the initial repair blueprint lets the thief in with A', () => {
  const verdict = decide(repair, structuredClone(repair.blueprint));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'intruder');
  assert.equal(verdict.counterexample, 'A');
});
test('setting the spring to base repairs the lever', () => {
  let blueprint = structuredClone(repair.blueprint);
  const cut = applyEdit(repair, level4.parts, blueprint, { type: 'cut-wire', from: 'q1', to: 'q2' });
  assert.equal(cut.effect, 'removed');
  blueprint = addWire(repair, cut.blueprint, 'q1', 'q2', { kind: 'spring', stack: { top: 'base', action: 'keep' } });
  const verdict = decide(repair, blueprint);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
test('the blank build blueprint locks out the client key AB', () => {
  const verdict = decide(build, structuredClone(build.blueprint));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.reason, 'lockout');
  assert.equal(verdict.counterexample, 'AB');
});
test('wiring the five stack wires builds the A-n-B-n mechanism', () => {
  let blueprint = structuredClone(build.blueprint);
  blueprint = addWire(build, blueprint, 'q0', 'q1', { kind: 'key', key: 'A', stack: { top: 'any', action: 'push' } });
  blueprint = addWire(build, blueprint, 'q1', 'q1', { kind: 'key', key: 'A', stack: { top: 'any', action: 'push' } });
  blueprint = addWire(build, blueprint, 'q1', 'q2', { kind: 'key', key: 'B', stack: { top: 'chip', action: 'pop' } });
  blueprint = addWire(build, blueprint, 'q2', 'q2', { kind: 'key', key: 'B', stack: { top: 'chip', action: 'pop' } });
  blueprint = addWire(build, blueprint, 'q2', 'q3', { kind: 'spring', stack: { top: 'base', action: 'keep' } });
  const verdict = decide(build, blueprint);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
});
test('the theater thief judges with the bounded method and wide coverage', () => {
  let blueprint = structuredClone(build.blueprint);
  blueprint = addWire(build, blueprint, 'q0', 'q1', { kind: 'key', key: 'A', stack: { top: 'any', action: 'push' } });
  blueprint = addWire(build, blueprint, 'q1', 'q1', { kind: 'key', key: 'A', stack: { top: 'any', action: 'push' } });
  blueprint = addWire(build, blueprint, 'q1', 'q2', { kind: 'key', key: 'B', stack: { top: 'chip', action: 'pop' } });
  blueprint = addWire(build, blueprint, 'q2', 'q2', { kind: 'key', key: 'B', stack: { top: 'chip', action: 'pop' } });
  blueprint = addWire(build, blueprint, 'q2', 'q3', { kind: 'spring', stack: { top: 'base', action: 'keep' } });
  const verdict = decide(build, blueprint);
  assert.equal(verdict.method, 'bounded');
  assert.equal(verdict.coverage.tested >= 2000, true);
});
