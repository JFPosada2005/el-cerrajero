import test from 'node:test';
import assert from 'node:assert/strict';
import { shortlexCompare, enumerateWords, seededRandom, randomWords } from '../src/core/order.js';

test('enumerateWords counts 2047 words up to length 10 over two symbols', () => {
  assert.equal(enumerateWords(['0', '1'], 10).length, 2047);
});

test('enumerateWords lists words in shortlex order', () => {
  assert.deepEqual(enumerateWords(['a', 'b'], 2), ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb']);
});

test('shortlexCompare sorts shorter first then by alphabet order', () => {
  const compare = shortlexCompare(['0', '1']);
  const input = ['1', '0', '11', '01', '10', '00', ''];
  assert.deepEqual([...input].sort(compare), ['', '0', '1', '00', '01', '10', '11']);
});

test('seededRandom produces the same sequence for the same seed', () => {
  const first = seededRandom(42);
  const second = seededRandom(42);
  const a = [first(), first(), first(), first(), first()];
  const b = [second(), second(), second(), second(), second()];
  assert.deepEqual(a, b);
  for (const value of a) {
    assert.ok(value >= 0 && value < 1);
  }
});

test('randomWords is deterministic and respects the length bound', () => {
  const first = randomWords(['0', '1'], { seed: 7, count: 5, maxLength: 3 });
  const second = randomWords(['0', '1'], { seed: 7, count: 5, maxLength: 3 });
  assert.deepEqual(first, second);
  assert.equal(first.length, 5);
  for (const word of first) {
    assert.ok(word.length <= 3);
    for (const symbol of word) {
      assert.ok(['0', '1'].includes(symbol));
    }
  }
});
