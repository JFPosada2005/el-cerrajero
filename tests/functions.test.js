import test from 'node:test';
import assert from 'node:assert/strict';
import { FUNCTIONS, functionFor } from '../src/game/functions.js';
const increment = FUNCTIONS['binary-increment'];
const sum = FUNCTIONS['binary-sum'];
test('increment inputs include 0 and 63 plus the ones stress family', () => {
  const words = increment.inputs({ maxBits: 6, stress: 'ones' });
  assert.equal(words.includes('0'), true);
  assert.equal(words.includes('111111'), true);
  assert.equal(words.includes('1111111'), true);
  assert.equal(words.includes('1111111111'), true);
  assert.equal(words.length, 68);
});
test('increment inputs dedupe the stress overlap', () => {
  const words = increment.inputs({ maxBits: 6, stress: 'ones' });
  assert.equal(new Set(words).size, words.length);
});
test('increment compute adds one in binary', () => {
  assert.equal(increment.compute('0'), '1');
  assert.equal(increment.compute('1'), '10');
  assert.equal(increment.compute('111'), '1000');
});
test('increment matches tolerates leading zeros and rejects non-binary', () => {
  assert.equal(increment.matches('010', '10'), true);
  assert.equal(increment.matches('11', '10'), false);
  assert.equal(increment.matches('10+0', '100'), false);
  assert.equal(increment.matches('', '1'), false);
});
test('sum inputs hold every pair for maxBits 4 and grow with carry-chains', () => {
  const plain = sum.inputs({ maxBits: 4 });
  assert.equal(plain.length, 256);
  assert.equal(plain.includes('0+0'), true);
  assert.equal(plain.includes('1111+1111'), true);
  const stressed = sum.inputs({ maxBits: 4, stress: 'carry-chains' });
  assert.equal(stressed.includes('11111+1'), true);
  assert.equal(stressed.includes('11111+11111'), true);
  assert.equal(stressed.length, 261);
  assert.equal(new Set(stressed).size, stressed.length);
});
test('sum compute adds the two binary numbers', () => {
  assert.equal(sum.compute('0+0'), '0');
  assert.equal(sum.compute('1+1'), '10');
  assert.equal(sum.compute('101+11'), '1000');
});
test('sum matches checks binary value equality and rejects a leftover plus', () => {
  assert.equal(sum.matches('010', '10'), true);
  assert.equal(sum.matches('10', '11'), false);
  assert.equal(sum.matches('1+0', '1'), false);
  assert.equal(sum.matches('', '0'), false);
});
test('functionFor resolves both functions and throws for an unknown id', () => {
  assert.equal(functionFor('binary-increment'), increment);
  assert.equal(functionFor('binary-sum'), sum);
  assert.throws(() => functionFor('binary-triple'), /unknown function/);
});
