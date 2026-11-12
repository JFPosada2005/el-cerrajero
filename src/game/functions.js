function incrementInputs(options) {
  const words = [];
  const total = 2 ** options.maxBits;
  for (let x = 0; x < total; x = x + 1) {
    words.push(x.toString(2));
  }
  if (options.stress === 'ones') {
    for (let k = 1; k <= 10; k = k + 1) {
      words.push(((2 ** k) - 1).toString(2));
    }
  }
  return [...new Set(words)];
}
function incrementCompute(input) {
  return (parseInt(input, 2) + 1).toString(2);
}
function incrementMatches(output, expected) {
  if (/^[01]+$/.test(output) === false) {
    return false;
  }
  return parseInt(output, 2) === parseInt(expected, 2);
}
function sumInputs(options) {
  const words = [];
  const total = 2 ** options.maxBits;
  for (let x = 0; x < total; x = x + 1) {
    for (let y = 0; y < total; y = y + 1) {
      words.push(x.toString(2) + '+' + y.toString(2));
    }
  }
  if (options.stress === 'carry-chains') {
    for (let k = 1; k <= 8; k = k + 1) {
      words.push((((2 ** k) - 1).toString(2)) + '+1');
    }
    for (let k = 1; k <= 5; k = k + 1) {
      const rep = ((2 ** k) - 1).toString(2);
      words.push(rep + '+' + rep);
    }
  }
  return [...new Set(words)];
}
function sumCompute(input) {
  const parts = input.split('+');
  const total = parseInt(parts[0], 2) + parseInt(parts[1], 2);
  return total.toString(2);
}
function sumMatches(output, expected) {
  if (/^[01]+$/.test(output) === false) {
    return false;
  }
  return parseInt(output, 2) === parseInt(expected, 2);
}
export const FUNCTIONS = {
  'binary-increment': { inputs: incrementInputs, compute: incrementCompute, matches: incrementMatches },
  'binary-sum': { inputs: sumInputs, compute: sumCompute, matches: sumMatches }
};
export function functionFor(id) {
  const found = FUNCTIONS[id];
  if (found === undefined) {
    throw new Error(`unknown function "${id}"`);
  }
  return found;
}
