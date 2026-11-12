import test from 'node:test';
import assert from 'node:assert/strict';
import { runTM } from '../src/core/tm.js';
import { level5 } from '../src/game/level5.js';
import { toMachine } from '../src/game/machines.js';
import { judge } from '../src/game/judge.js';
const repair = level5.phases.repair;
const build = level5.phases.build;
const keys = level5.keys.map((entry) => entry.symbol);
function decide(puzzle, blueprint) {
  return judge(puzzle, toMachine(keys, puzzle, blueprint, level5.machine));
}
test('the initial repair drum fails on 1 with wrong-output 11 instead of 10', () => {
  const machine = toMachine(keys, repair, structuredClone(repair.blueprint), level5.machine);
  const run = runTM(machine, '1', { maxSteps: repair.judge.limits.maxSteps });
  assert.equal(run.output, '11');
  const verdict = judge(repair, machine);
  assert.equal(verdict.correct, false);
  assert.equal(verdict.counterexample, '1');
  assert.equal(verdict.reason, 'wrong-output');
  assert.equal(verdict.expected, '10');
  assert.equal(verdict.actual, '11');
  assert.equal(verdict.method, 'bounded');
});
test('fixing the carry pin to write 0 repairs the counter', () => {
  const blueprint = structuredClone(repair.blueprint);
  blueprint.rules.carry['1'].write = '0';
  const verdict = decide(repair, blueprint);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
  assert.equal(verdict.method, 'bounded');
});
test('the initial build drum raises the alarm on 0+0', () => {
  const verdict = decide(build, structuredClone(build.blueprint));
  assert.equal(verdict.correct, false);
  assert.equal(verdict.counterexample, '0+0');
  assert.equal(verdict.reason, 'alarm');
});
test('the reference adder passes every pair with wide coverage', () => {
  const blueprint = {
    rules: {
      seek: { 0: { write: '0', move: 'R', to: 'seek' }, 1: { write: '1', move: 'R', to: 'seek' }, '+': { write: '+', move: 'R', to: 'seek' }, _: { write: '_', move: 'L', to: 'dec' } },
      dec: { 0: { write: '1', move: 'L', to: 'dec' }, 1: { write: '0', move: 'L', to: 'toPlus' }, '+': { write: '_', move: 'R', to: 'clean' } },
      toPlus: { 0: { write: '0', move: 'L', to: 'toPlus' }, 1: { write: '1', move: 'L', to: 'toPlus' }, '+': { write: '+', move: 'L', to: 'carry' } },
      carry: { 1: { write: '0', move: 'L', to: 'carry' }, 0: { write: '1', move: 'R', to: 'seek' }, _: { write: '1', move: 'R', to: 'seek' } },
      clean: { 0: { write: '_', move: 'R', to: 'clean' }, 1: { write: '_', move: 'R', to: 'clean' }, _: { write: '_', move: 'R', to: 'done' } },
      done: {}
    }
  };
  const verdict = decide(build, blueprint);
  assert.equal(verdict.correct, true);
  assert.equal(verdict.counterexample, null);
  assert.equal(verdict.reason, null);
  assert.equal(verdict.coverage.tested >= 256, true);
});
