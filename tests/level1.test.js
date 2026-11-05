import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { buildPlayerDFA, runHeist, testKey } from '../src/game/rules.js';
import { areEquivalentDFA } from '../src/core/dfa.js';

const initial = buildPlayerDFA(level1, level1.initialTransitions);

test('the legitimate key opens the initial mechanism', () => {
  assert.equal(testKey(initial, '123').accepted, true);
});

test('the initial mechanism is not equivalent to the target', () => {
  const result = areEquivalentDFA(initial, level1.target);
  assert.equal(result.equivalent, false);
  assert.equal(result.counterexample.length, 3);
  assert.ok(['121', '223'].includes(result.counterexample));
});

test('the thief escapes through a wrong wire', () => {
  const heist = runHeist(initial, level1.target);
  assert.equal(heist.escaped, true);
  assert.ok(['121', '223'].includes(heist.counterexample));
});

test('removing both wrong wires makes the mechanism equivalent', () => {
  const transitions = structuredClone(level1.initialTransitions);
  delete transitions.q0[2];
  delete transitions.q2[1];
  const fixed = buildPlayerDFA(level1, transitions);
  const result = areEquivalentDFA(fixed, level1.target);
  assert.equal(result.equivalent, true);
  assert.equal(runHeist(fixed, level1.target).escaped, false);
});

test('the fixed mechanism rejects longer keys', () => {
  const transitions = structuredClone(level1.initialTransitions);
  delete transitions.q0[2];
  delete transitions.q2[1];
  const fixed = buildPlayerDFA(level1, transitions);
  assert.equal(testKey(fixed, '1234').accepted, false);
  assert.equal(testKey(fixed, '12').accepted, false);
  assert.equal(testKey(fixed, '223').accepted, false);
});
