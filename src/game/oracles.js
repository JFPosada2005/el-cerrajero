function balancedTurns(word) {
  if (word.length === 0) {
    return false;
  }
  let depth = 0;
  for (const symbol of word) {
    if (symbol !== 'A' && symbol !== 'B') {
      return false;
    }
    if (symbol === 'A') {
      depth = depth + 1;
    }
    if (symbol === 'B') {
      depth = depth - 1;
    }
    if (depth < 0) {
      return false;
    }
  }
  return depth === 0;
}
function anbn(word) {
  if (word.length === 0) {
    return false;
  }
  let ups = 0;
  while (ups < word.length && word[ups] === 'A') {
    ups = ups + 1;
  }
  if (ups === 0) {
    return false;
  }
  let consumed = ups;
  while (consumed < word.length && word[consumed] === 'B') {
    consumed = consumed + 1;
  }
  if (consumed !== word.length) {
    return false;
  }
  return word.length - ups === ups;
}
export const ORACLES = { 'balanced-turns': balancedTurns, 'a-n-b-n': anbn };
export function oracleAccepts(id, word) {
  const oracle = ORACLES[id];
  if (oracle === undefined) {
    throw new Error(`unknown oracle "${id}"`);
  }
  return oracle(word);
}
