export function shortlexCompare(alphabet) {
  return (a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    for (let i = 0; i < a.length; i++) {
      const order = alphabet.indexOf(a[i]) - alphabet.indexOf(b[i]);
      if (order !== 0) {
        return order;
      }
    }
    return 0;
  };
}
export function enumerateWords(alphabet, maxLength) {
  const words = [''];
  let level = [''];
  for (let length = 1; length <= maxLength; length++) {
    const next = [];
    for (const word of level) {
      for (const symbol of alphabet) {
        next.push(word + symbol);
      }
    }
    for (const word of next) {
      words.push(word);
    }
    level = next;
  }
  return words;
}
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value = value ^ (value + Math.imul(value ^ (value >>> 7), value | 61));
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function randomWords(alphabet, { seed, count, minLength = 0, maxLength }) {
  const random = seededRandom(seed);
  const words = [];
  for (let i = 0; i < count; i++) {
    const length = minLength + Math.floor(random() * (maxLength - minLength + 1));
    let word = '';
    for (let j = 0; j < length; j++) {
      word = word + alphabet[Math.floor(random() * alphabet.length)];
    }
    words.push(word);
  }
  return words;
}
