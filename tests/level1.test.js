import test from 'node:test';
import assert from 'node:assert/strict';
import { level1 } from '../src/game/level1.js';
import { buildPlayerDFA, runHeist, testKey } from '../src/game/rules.js';
import { areEquivalentDFA } from '../src/core/dfa.js';

const initial = buildPlayerDFA(level1, level1.initialTransitions);

function cut(transitions, source, target) {
  for (const symbol of Object.keys(transitions[source] ?? {})) {
    if (transitions[source][symbol] === target) {
      delete transitions[source][symbol];
    }
  }
}

function repaired() {
  const transitions = structuredClone(level1.initialTransitions);
  cut(transitions, 'q0', 'q3');
  cut(transitions, 'q1', 'q3');
  transitions.q1[2] = 'q2';
  return buildPlayerDFA(level1, transitions);
}

test('the contract names the client and the rule', () => {
  assert.equal(level1.contract, '01');
  assert.equal(typeof level1.client, 'string');
  assert.ok(level1.client.length > 0);
  assert.match(level1.goal, /1/);
});

test('the first crossed wire opens the vault with a single key', () => {
  assert.equal(testKey(initial, '123').accepted, false);
  const heist = runHeist(initial, level1.target);
  assert.equal(heist.escaped, true);
  assert.equal(heist.reason, 'intruder');
  assert.equal(heist.counterexample, '2');
});

test('the second crossed wire opens the vault with two keys', () => {
  const transitions = structuredClone(level1.initialTransitions);
  cut(transitions, 'q0', 'q3');
  const heist = runHeist(buildPlayerDFA(level1, transitions), level1.target);
  assert.equal(heist.escaped, true);
  assert.equal(heist.reason, 'intruder');
  assert.equal(heist.counterexample, '11');
});

test('without the crossed wires the client is locked out', () => {
  const transitions = structuredClone(level1.initialTransitions);
  cut(transitions, 'q0', 'q3');
  cut(transitions, 'q1', 'q3');
  const heist = runHeist(buildPlayerDFA(level1, transitions), level1.target);
  assert.equal(heist.escaped, true);
  assert.equal(heist.reason, 'lockout');
  assert.equal(heist.counterexample, '123');
});

test('adding the missing wire makes the mechanism equivalent', () => {
  const fixed = repaired();
  assert.equal(areEquivalentDFA(fixed, level1.target).equivalent, true);
  assert.equal(runHeist(fixed, level1.target).escaped, false);
});

test('the repaired mechanism opens with the client key', () => {
  assert.equal(testKey(repaired(), '123').accepted, true);
});

test('the repaired mechanism rejects longer and wrong keys', () => {
  const fixed = repaired();
  assert.equal(testKey(fixed, '1234').accepted, false);
  assert.equal(testKey(fixed, '12').accepted, false);
  assert.equal(testKey(fixed, '223').accepted, false);
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
