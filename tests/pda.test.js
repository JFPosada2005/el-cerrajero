import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePDA, createPDA, runPDA, acceptsPDA } from '../src/core/pda.js';
import { EPSILON } from '../src/core/symbols.js';

const example = createPDA({
  states: ['q0', 'q1', 'q2', 'q3'],
  alphabet: ['A', 'B'],
  stackAlphabet: ['Z', 'X'],
  stackStart: 'Z',
  start: 'q0',
  accept: ['q3'],
  transitions: [
    { from: 'q0', read: 'A', pop: 'Z', push: 'XZ', to: 'q1' },
    { from: 'q1', read: 'A', pop: 'X', push: 'XX', to: 'q1' },
    { from: 'q1', read: 'B', pop: 'X', push: '', to: 'q2' },
    { from: 'q2', read: 'B', pop: 'X', push: '', to: 'q2' },
    { from: 'q2', read: EPSILON, pop: 'Z', push: 'Z', to: 'q3' },
  ],
});

test('the example PDA accepts AB, AABB and AAABBB', () => {
  for (const word of ['AB', 'AABB', 'AAABBB']) {
    assert.equal(acceptsPDA(example, word), true, `word ${word}`);
    assert.equal(runPDA(example, word).outcome, 'accept', `word ${word}`);
  }
});

test('the example PDA rejects the empty word, A, B, AAB and ABB', () => {
  for (const word of ['', 'A', 'B', 'AAB', 'ABB']) {
    assert.equal(acceptsPDA(example, word), false, `word ${word}`);
    const result = runPDA(example, word);
    assert.equal(result.accepted, false, `word ${word}`);
    assert.equal(result.outcome, 'reject', `word ${word}`);
  }
});

test('runPDA reports invalid-symbol for AC', () => {
  const result = runPDA(example, 'AC');
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'invalid-symbol');
});

test('runPDA returns the full accept shape for AB', () => {
  assert.deepEqual(runPDA(example, 'AB'), { accepted: true, outcome: 'accept', steps: 3, frames: [], truncated: false });
});

test('recorded frames run from the start config to the accepting config', () => {
  const result = runPDA(example, 'AABB', { record: true });
  assert.equal(result.outcome, 'accept');
  assert.deepEqual(result.frames[0], { consumed: 0, state: 'q0', stack: 'Z', rule: null });
  const last = result.frames[result.frames.length - 1];
  assert.equal(last.consumed, 4);
  assert.equal(last.state, 'q3');
  assert.equal(last.stack, 'Z');
  assert.equal(result.steps, result.frames.length - 1);
});

test('the example uses an epsilon move after the input ends', () => {
  const result = runPDA(example, 'AB', { record: true });
  assert.equal(result.steps, 3);
  const last = result.frames[result.frames.length - 1];
  assert.equal(last.rule.read, EPSILON);
  assert.equal(last.state, 'q3');
});

test('frames are empty without record', () => {
  assert.deepEqual(runPDA(example, 'AABB').frames, []);
  assert.deepEqual(runPDA(example, 'AABB', {}).frames, []);
});

test('a small maxStack produces limit with truncated true', () => {
  const result = runPDA(example, 'AABB', { maxStack: 1 });
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'limit');
  assert.equal(result.truncated, true);
});

test('an epsilon push loop hits the stack bound with limit', () => {
  const looper = createPDA({
    states: ['l0'],
    alphabet: ['a'],
    stackAlphabet: ['Z', 'X'],
    stackStart: 'Z',
    start: 'l0',
    accept: [],
    transitions: [
      { from: 'l0', read: EPSILON, pop: 'Z', push: 'XZ', to: 'l0' },
      { from: 'l0', read: EPSILON, pop: 'X', push: 'XX', to: 'l0' },
    ],
  });
  const result = runPDA(looper, '', { maxStack: 4 });
  assert.equal(result.outcome, 'limit');
  assert.equal(result.truncated, true);
});

test('a small maxConfigs produces limit', () => {
  const result = runPDA(example, 'AAABBB', { maxConfigs: 2 });
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'limit');
});

test('nondeterminism finds the accepting branch', () => {
  const fork = createPDA({
    states: ['s0', 's1', 's2'],
    alphabet: ['a'],
    stackAlphabet: ['Z'],
    stackStart: 'Z',
    start: 's0',
    accept: ['s2'],
    transitions: [
      { from: 's0', read: 'a', pop: 'Z', push: '', to: 's1' },
      { from: 's0', read: 'a', pop: 'Z', push: 'Z', to: 's2' },
    ],
  });
  assert.equal(acceptsPDA(fork, 'a'), true);
  assert.equal(runPDA(fork, 'a').outcome, 'accept');
});

test('an empty stack fires nothing', () => {
  const emptier = createPDA({
    states: ['e0', 'e1'],
    alphabet: ['a'],
    stackAlphabet: ['Z'],
    stackStart: 'Z',
    start: 'e0',
    accept: ['e1'],
    transitions: [
      { from: 'e0', read: 'a', pop: 'Z', push: '', to: 'e1' },
    ],
  });
  assert.equal(acceptsPDA(emptier, 'a'), true);
  const result = runPDA(emptier, 'aa');
  assert.equal(result.accepted, false);
  assert.equal(result.outcome, 'reject');
  assert.equal(result.steps, 1);
});

test('a rejected run records the path that read the most input', () => {
  const result = runPDA(example, 'AAB', { record: true });
  assert.equal(result.outcome, 'reject');
  assert.equal(result.steps, 3);
  const last = result.frames[result.frames.length - 1];
  assert.equal(last.consumed, 3);
  assert.equal(last.state, 'q2');
});

test('validatePDA accepts a valid machine', () => {
  assert.equal(validatePDA(example), true);
});

test('validatePDA rejects an unknown state', () => {
  const broken = structuredClone(example);
  broken.transitions[0].from = 'nope';
  assert.throws(() => validatePDA(broken), /not in states/);
});

test('validatePDA rejects an unknown read symbol', () => {
  const broken = structuredClone(example);
  broken.transitions[0].read = 'C';
  assert.throws(() => validatePDA(broken), /alphabet/);
});

test('validatePDA rejects an unknown pop symbol', () => {
  const broken = structuredClone(example);
  broken.transitions[0].pop = 'Q';
  assert.throws(() => validatePDA(broken), /stack/);
});

test('validatePDA rejects an unknown push symbol', () => {
  const broken = structuredClone(example);
  broken.transitions[0].push = 'XQ';
  assert.throws(() => validatePDA(broken), /stack/);
});

test('validatePDA rejects a bad start state', () => {
  const broken = structuredClone(example);
  broken.start = 'nope';
  assert.throws(() => validatePDA(broken), /start/);
});

test('createPDA returns a deep copy with type pda', () => {
  const spec = {
    states: ['q0', 'q1'],
    alphabet: ['a'],
    stackAlphabet: ['Z'],
    stackStart: 'Z',
    start: 'q0',
    accept: ['q1'],
    transitions: [{ from: 'q0', read: 'a', pop: 'Z', push: 'Z', to: 'q1' }],
  };
  const pda = createPDA(spec);
  assert.equal(pda.type, 'pda');
  assert.deepEqual(pda.states, ['q0', 'q1']);
  assert.notEqual(pda.states, spec.states);
  assert.notEqual(pda.transitions, spec.transitions);
  assert.notEqual(pda.transitions[0], spec.transitions[0]);
  spec.transitions[0].to = 'q0';
  spec.states.push('q2');
  assert.equal(pda.transitions[0].to, 'q1');
  assert.deepEqual(pda.states, ['q0', 'q1']);
});
