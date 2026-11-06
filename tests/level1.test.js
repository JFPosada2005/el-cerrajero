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

test('the level carries the client contract shown during play', () => {
  assert.equal(level1.contract, '01');
  assert.equal(typeof level1.client, 'string');
  assert.ok(level1.client.length > 0);
  assert.match(level1.goal, /1/);
});

test('an escape through a wrong wire is reported as an intrusion', () => {
  const heist = runHeist(initial, level1.target);
  assert.equal(heist.reason, 'intruder');
});

test('a mechanism that cannot open its own lock reports a lockout', () => {
  const transitions = structuredClone(level1.initialTransitions);
  delete transitions.q2[3];
  delete transitions.q2[1];
  const broken = buildPlayerDFA(level1, transitions);
  const heist = runHeist(broken, level1.target);
  assert.equal(heist.escaped, true);
  assert.equal(heist.reason, 'lockout');
  assert.equal(heist.counterexample, '123');
});

test('the in-game copy avoids academic vocabulary', () => {
  const banned = /autómata|automata|afnd|afd|transición|estado|lenguaje|formal/i;
  const copy = [
    level1.title,
    level1.client,
    level1.brief,
    level1.goal,
    level1.thief.giveUp,
    ...Object.values(level1.thief.lines),
    ...level1.states.map(state => state.label),
  ];
  for (const text of copy) {
    assert.doesNotMatch(text, banned);
  }
});
