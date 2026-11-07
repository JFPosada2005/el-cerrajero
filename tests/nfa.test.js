import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateNFA,
  createNFA,
  epsilonClosure,
  moveNFA,
  runNFA,
  acceptsNFA,
  nfaToDFA,
  areEquivalentNFA,
} from '../src/core/nfa.js';
import { validateDFA, acceptsDFA } from '../src/core/dfa.js';
import { EPSILON } from '../src/core/symbols.js';

const l3nfa = createNFA({
  states: ['e', 'd', 'd1', 'd2', 'n', 'n1', 'n2', 'lock'],
  alphabet: ['1', '2'],
  start: 'e',
  accept: ['lock'],
  transitions: {
    e: { [EPSILON]: ['d', 'n'] },
    d: { 1: ['d', 'd1'], 2: ['d'] },
    d1: { 2: ['d2'] },
    d2: { 2: ['lock'] },
    n: { 1: ['n'], 2: ['n', 'n1'] },
    n1: { 1: ['n2'] },
    n2: { 1: ['lock'] },
    lock: { 1: ['lock'], 2: ['lock'] },
  },
});

const dayOnly = createNFA({
  states: ['e', 'w', 'd1', 'd2', 'lock'],
  alphabet: ['1', '2'],
  start: 'e',
  accept: ['lock'],
  transitions: {
    e: { [EPSILON]: ['w'] },
    w: { 1: ['w', 'd1'], 2: ['w'] },
    d1: { 2: ['d2'] },
    d2: { 2: ['lock'] },
    lock: { 1: ['lock'], 2: ['lock'] },
  },
});

const chain = createNFA({
  states: ['a', 'b', 'c'],
  alphabet: ['1'],
  start: 'a',
  accept: ['c'],
  transitions: {
    a: { [EPSILON]: ['b'] },
    b: { [EPSILON]: ['c'] },
    c: { 1: ['c'] },
  },
});

const cycle = createNFA({
  states: ['a', 'b'],
  alphabet: ['1'],
  start: 'a',
  accept: ['b'],
  transitions: {
    a: { [EPSILON]: ['b'] },
    b: { [EPSILON]: ['a'] },
  },
});

const fragile = createNFA({
  states: ['p', 'q'],
  alphabet: ['1', '2'],
  start: 'p',
  accept: ['q'],
  transitions: {
    p: { 1: ['q'] },
    q: {},
  },
});

test('epsilonClosure includes the input states', () => {
  assert.deepEqual(epsilonClosure(l3nfa, ['lock']), ['lock']);
});

test('epsilonClosure follows epsilon chains', () => {
  assert.deepEqual(epsilonClosure(chain, ['a']), ['a', 'b', 'c']);
});

test('epsilonClosure terminates on an epsilon cycle', () => {
  assert.deepEqual(epsilonClosure(cycle, ['a']), ['a', 'b']);
});

test('epsilonClosure returns members in states order', () => {
  assert.deepEqual(epsilonClosure(l3nfa, ['lock', 'e']), ['e', 'd', 'n', 'lock']);
});

test('moveNFA unions targets across states', () => {
  assert.deepEqual(moveNFA(l3nfa, ['d', 'n'], '2'), ['d', 'n', 'n1']);
});

test('moveNFA deduplicates and sorts in states order', () => {
  assert.deepEqual(moveNFA(l3nfa, ['lock', 'd'], '1'), ['d', 'd1', 'lock']);
});

test('runNFA accepts 122 and 211 on the L3-style NFA', () => {
  assert.deepEqual(runNFA(l3nfa, '122'), { accepted: true, outcome: 'accept', steps: 3, frames: [] });
  assert.deepEqual(runNFA(l3nfa, '211'), { accepted: true, outcome: 'accept', steps: 3, frames: [] });
  assert.equal(acceptsNFA(l3nfa, '122'), true);
  assert.equal(acceptsNFA(l3nfa, '211'), true);
});

test('runNFA rejects 12, 22 and the empty word', () => {
  assert.deepEqual(runNFA(l3nfa, '12'), { accepted: false, outcome: 'reject', steps: 2, frames: [] });
  assert.deepEqual(runNFA(l3nfa, '22'), { accepted: false, outcome: 'reject', steps: 2, frames: [] });
  assert.deepEqual(runNFA(l3nfa, ''), { accepted: false, outcome: 'reject', steps: 0, frames: [] });
  assert.equal(acceptsNFA(l3nfa, '12'), false);
  assert.equal(acceptsNFA(l3nfa, ''), false);
});

test('runNFA reports invalid-symbol for a symbol outside the alphabet', () => {
  const result = runNFA(l3nfa, '12x');
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'invalid-symbol');
  assert.equal(result.steps, 2);
});

test('runNFA reports missing when no path survives', () => {
  const first = runNFA(fragile, '2');
  assert.equal(first.accepted, false);
  assert.equal(first.outcome, 'missing');
  assert.equal(first.steps, 0);
  const later = runNFA(fragile, '12');
  assert.equal(later.accepted, false);
  assert.equal(later.outcome, 'missing');
  assert.equal(later.steps, 1);
});

test('runNFA records one frame per consumed symbol plus the initial one', () => {
  const result = runNFA(l3nfa, '12', { record: true });
  assert.equal(result.frames.length, 3);
  assert.deepEqual(result.frames[0], { consumed: 0, active: ['e', 'd', 'n'], symbol: null });
  assert.equal(result.frames[1].consumed, 1);
  assert.equal(result.frames[1].symbol, '1');
  assert.deepEqual(result.frames[1].active, ['d', 'd1', 'n']);
  assert.deepEqual(result.frames[2], { consumed: 2, active: ['d', 'd2', 'n', 'n1'], symbol: '2' });
});

test('runNFA returns no frames without record', () => {
  assert.deepEqual(runNFA(l3nfa, '122').frames, []);
  assert.deepEqual(runNFA(l3nfa, '122', {}).frames, []);
});

test('nfaToDFA names the start subset in states order', () => {
  const dfa = nfaToDFA(l3nfa);
  assert.equal(dfa.start, '{e,d,n}');
  assert.equal(validateDFA(dfa), true);
});

test('nfaToDFA agrees with the NFA on every word up to length 5', () => {
  const dfa = nfaToDFA(l3nfa);
  const words = [''];
  for (const word of words) {
    for (const symbol of ['1', '2']) {
      if (word.length < 5) {
        words.push(word + symbol);
      }
    }
  }
  for (const word of words) {
    assert.equal(acceptsDFA(dfa, word), acceptsNFA(l3nfa, word), `word ${word}`);
  }
});

test('nfaToDFA never creates the empty subset', () => {
  const dfa = nfaToDFA(fragile);
  assert.equal(dfa.states.includes('{}'), false);
  assert.equal(acceptsDFA(dfa, '1'), true);
  assert.equal(acceptsDFA(dfa, '2'), false);
});

test('nfaToDFA keeps the given alphabet order', () => {
  const dfa = nfaToDFA(l3nfa, ['2', '1']);
  assert.deepEqual(dfa.alphabet, ['2', '1']);
  assert.equal(acceptsDFA(dfa, '122'), true);
  assert.equal(acceptsDFA(dfa, '12'), false);
});

test('areEquivalentNFA holds for an NFA and its own nfaToDFA', () => {
  const result = areEquivalentNFA(l3nfa, nfaToDFA(l3nfa));
  assert.equal(result.equivalent, true);
  assert.equal(result.counterexample, null);
});

test('areEquivalentNFA rejects the L3 target versus the day-only NFA', () => {
  const result = areEquivalentNFA(l3nfa, dayOnly);
  assert.equal(result.equivalent, false);
  assert.equal(result.counterexample, '211');
  assert.notEqual(acceptsNFA(l3nfa, '211'), acceptsNFA(dayOnly, '211'));
});

test('createNFA deduplicates and sorts targets in states order', () => {
  const nfa = createNFA({
    states: ['q0', 'q1'],
    alphabet: ['a'],
    start: 'q0',
    accept: ['q1'],
    transitions: {
      q0: { a: ['q1', 'q0', 'q1'] },
    },
  });
  assert.deepEqual(nfa.transitions.q0.a, ['q0', 'q1']);
});

test('createNFA removes empty lists and fills every row', () => {
  const nfa = createNFA({
    states: ['q0', 'q1'],
    alphabet: ['a'],
    start: 'q0',
    accept: ['q1'],
    transitions: {
      q0: { a: [] },
    },
  });
  assert.deepEqual(nfa.transitions.q0, {});
  assert.deepEqual(nfa.transitions.q1, {});
});

test('createNFA sets type nfa and copies states and alphabet', () => {
  const spec = {
    states: ['q0', 'q1'],
    alphabet: ['a'],
    start: 'q0',
    accept: ['q1'],
    transitions: {},
  };
  const nfa = createNFA(spec);
  assert.equal(nfa.type, 'nfa');
  assert.deepEqual(nfa.states, ['q0', 'q1']);
  assert.deepEqual(nfa.alphabet, ['a']);
  assert.notEqual(nfa.states, spec.states);
  assert.notEqual(nfa.alphabet, spec.alphabet);
});

test('validateNFA accepts a valid machine', () => {
  assert.equal(validateNFA(l3nfa), true);
});

test('validateNFA rejects an unknown start state', () => {
  assert.throws(() => validateNFA({ ...structuredClone(l3nfa), start: 'nope' }), /start/);
});

test('validateNFA rejects an unknown target state', () => {
  const broken = structuredClone(l3nfa);
  broken.transitions.d['1'] = ['nope'];
  assert.throws(() => validateNFA(broken), /unknown state/);
});

test('validateNFA rejects a transition row for an unknown state', () => {
  const broken = structuredClone(l3nfa);
  broken.transitions.nope = { 1: ['e'] };
  assert.throws(() => validateNFA(broken), /not in states/);
});

test('validateNFA rejects a symbol outside the alphabet', () => {
  const broken = structuredClone(l3nfa);
  broken.transitions.d['9'] = ['d'];
  assert.throws(() => validateNFA(broken), /alphabet/);
});
