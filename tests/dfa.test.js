import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDFA,
  validateDFA,
  simulateDFA,
  acceptsDFA,
  completeDFA,
  reachableDFA,
  minimizeDFA,
  areEquivalentDFA,
  shortestCounterexample,
} from '../src/core/dfa.js';

const exact123 = createDFA({
  states: ['q0', 'q1', 'q2', 'q3', 'qr'],
  alphabet: ['1', '2', '3', '4'],
  start: 'q0',
  accept: ['q3'],
  transitions: {
    q0: { 1: 'q1', 2: 'qr', 3: 'qr', 4: 'qr' },
    q1: { 1: 'qr', 2: 'q2', 3: 'qr', 4: 'qr' },
    q2: { 1: 'qr', 2: 'qr', 3: 'q3', 4: 'qr' },
    q3: { 1: 'qr', 2: 'qr', 3: 'qr', 4: 'qr' },
    qr: { 1: 'qr', 2: 'qr', 3: 'qr', 4: 'qr' },
  },
});

const redundantEndsWith1 = createDFA({
  states: ['q0', 'q1', 'q2', 'q3'],
  alphabet: ['0', '1'],
  start: 'q0',
  accept: ['q1', 'q3'],
  transitions: {
    q0: { 0: 'q2', 1: 'q1' },
    q1: { 0: 'q2', 1: 'q1' },
    q2: { 0: 'q2', 1: 'q3' },
    q3: { 0: 'q2', 1: 'q1' },
  },
});

const simpleEndsWith1 = createDFA({
  states: ['s0', 's1'],
  alphabet: ['0', '1'],
  start: 's0',
  accept: ['s1'],
  transitions: {
    s0: { 0: 's0', 1: 's1' },
    s1: { 0: 's0', 1: 's1' },
  },
});

const simpleEndsWith0 = createDFA({
  states: ['t0', 't1'],
  alphabet: ['0', '1'],
  start: 't0',
  accept: ['t1'],
  transitions: {
    t0: { 0: 't1', 1: 't0' },
    t1: { 0: 't1', 1: 't0' },
  },
});

const contains01 = createDFA({
  states: ['c0', 'c1', 'c2'],
  alphabet: ['0', '1'],
  start: 'c0',
  accept: ['c2'],
  transitions: {
    c0: { 0: 'c1', 1: 'c0' },
    c1: { 0: 'c1', 1: 'c2' },
    c2: { 0: 'c2', 1: 'c2' },
  },
});

const contains10 = createDFA({
  states: ['d0', 'd1', 'd2'],
  alphabet: ['0', '1'],
  start: 'd0',
  accept: ['d2'],
  transitions: {
    d0: { 0: 'd0', 1: 'd1' },
    d1: { 0: 'd2', 1: 'd1' },
    d2: { 0: 'd2', 1: 'd2' },
  },
});

const incomplete = createDFA({
  states: ['a', 'b'],
  alphabet: ['0', '1'],
  start: 'a',
  accept: ['b'],
  transitions: {
    a: { 0: 'b' },
    b: { 0: 'b' },
  },
});

test('validateDFA accepts a valid machine', () => {
  assert.equal(validateDFA(exact123), true);
});

test('validateDFA rejects an unknown start state', () => {
  assert.throws(
    () =>
      createDFA({
        states: ['q0'],
        alphabet: ['1'],
        start: 'q9',
        accept: [],
        transitions: { q0: { 1: 'q0' } },
      }),
    /start state/,
  );
});

test('validateDFA rejects a transition to an unknown state', () => {
  assert.throws(
    () =>
      createDFA({
        states: ['q0'],
        alphabet: ['1'],
        start: 'q0',
        accept: [],
        transitions: { q0: { 1: 'q9' } },
      }),
    /unknown state/,
  );
});

test('accepts exactly the sequence 123', () => {
  assert.equal(acceptsDFA(exact123, '123'), true);
  assert.equal(acceptsDFA(exact123, '12'), false);
  assert.equal(acceptsDFA(exact123, '1234'), false);
  assert.equal(acceptsDFA(exact123, '132'), false);
  assert.equal(acceptsDFA(exact123, ''), false);
  assert.equal(acceptsDFA(exact123, '4'), false);
});

test('simulateDFA returns the state trace', () => {
  assert.deepEqual(simulateDFA(exact123, '123').trace, ['q0', 'q1', 'q2', 'q3']);
});

test('simulateDFA treats a missing transition as rejection', () => {
  const result = simulateDFA(incomplete, '1');
  assert.equal(result.accepted, false);
  assert.deepEqual(result.missing, { state: 'a', symbol: '1' });
});

test('completeDFA adds a rejecting sink for missing transitions', () => {
  const complete = completeDFA(incomplete);
  assert.equal(complete.states.length, 3);
  const sink = complete.states.find(state => !incomplete.states.includes(state));
  assert.equal(complete.transitions[sink][0], sink);
  assert.equal(complete.transitions[sink][1], sink);
  assert.equal(complete.transitions.a[1], sink);
  assert.equal(complete.accept.includes(sink), false);
});

test('reachableDFA removes unreachable states', () => {
  const dfa = createDFA({
    states: ['a', 'b', 'c'],
    alphabet: ['0'],
    start: 'a',
    accept: ['b'],
    transitions: {
      a: { 0: 'b' },
      b: { 0: 'b' },
      c: { 0: 'c' },
    },
  });
  const reachable = reachableDFA(dfa);
  assert.deepEqual([...reachable.states].sort(), ['a', 'b']);
});

test('minimizeDFA merges equivalent states', () => {
  const minimized = minimizeDFA(redundantEndsWith1);
  assert.equal(minimized.states.length, 2);
  assert.equal(acceptsDFA(minimized, '1'), true);
  assert.equal(acceptsDFA(minimized, '01'), true);
  assert.equal(acceptsDFA(minimized, '10'), false);
  assert.equal(acceptsDFA(minimized, ''), false);
});

test('areEquivalentDFA recognizes the same language with redundant states', () => {
  const result = areEquivalentDFA(redundantEndsWith1, simpleEndsWith1);
  assert.equal(result.equivalent, true);
  assert.equal(result.counterexample, null);
});

test('areEquivalentDFA returns a shortest counterexample', () => {
  const result = areEquivalentDFA(simpleEndsWith1, simpleEndsWith0);
  assert.equal(result.equivalent, false);
  assert.equal(result.counterexample.length, 1);
  assert.ok(['0', '1'].includes(result.counterexample));
});

test('shortestCounterexample finds the shortest difference', () => {
  const counterexample = shortestCounterexample(contains01, contains10);
  assert.equal(counterexample.length, 2);
  assert.ok(['01', '10'].includes(counterexample));
});
