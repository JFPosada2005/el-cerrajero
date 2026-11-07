import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, levelStatus } from '../src/game/catalog.js';

test('the catalog holds five contracts in order', () => {
  assert.equal(LEVELS.length, 5);
  assert.deepEqual(LEVELS.map((level) => level.contract), ['01', '02', '03', '04', '05']);
});

test('the strip renders contracts left to right in order', () => {
  assert.deepEqual(LEVELS.map((level) => level.id), [1, 2, 3, 4, 5]);
});

test('only the fifth contract is the final boss', () => {
  const bosses = LEVELS.filter((level) => level.boss);
  assert.equal(bosses.length, 1);
  assert.equal(bosses[0].id, 5);
});

test('the first four contracts are playable', () => {
  const playable = LEVELS.filter((level) => level.playable);
  assert.deepEqual(playable.map((level) => level.id), [1, 2, 3, 4]);
});

test('the first contract is available on a fresh map', () => {
  assert.equal(levelStatus(LEVELS[0], { completed: [] }), 'available');
});

test('the second contract stays locked on a fresh map', () => {
  assert.equal(levelStatus(LEVELS[1], { completed: [] }), 'locked');
});

test('finishing a contract opens the next one', () => {
  assert.equal(levelStatus(LEVELS[1], { completed: [1] }), 'available');
});

test('a finished contract reads as completed', () => {
  assert.equal(levelStatus(LEVELS[0], { completed: [1] }), 'completed');
});

test('later contracts stay locked until their neighbor opens', () => {
  assert.equal(levelStatus(LEVELS[2], { completed: [1] }), 'locked');
});

test('a chain of finishes opens the third contract', () => {
  assert.equal(levelStatus(LEVELS[2], { completed: [1, 2] }), 'available');
});

test('missing progress still opens the first contract', () => {
  assert.equal(levelStatus(LEVELS[0], null), 'available');
});

test('missing progress locks the fourth contract', () => {
  assert.equal(levelStatus(LEVELS[3], undefined), 'locked');
});
