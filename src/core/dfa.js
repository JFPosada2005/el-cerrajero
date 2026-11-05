const SINK_BASE = '__sink';

export function validateDFA(dfa) {
  if (!dfa || typeof dfa !== 'object') {
    throw new Error('DFA must be an object');
  }
  if (!Array.isArray(dfa.states) || dfa.states.length === 0) {
    throw new Error('DFA must have at least one state');
  }
  if (!Array.isArray(dfa.alphabet) || dfa.alphabet.length === 0) {
    throw new Error('DFA must have a non-empty alphabet');
  }
  if (!dfa.states.includes(dfa.start)) {
    throw new Error(`start state "${dfa.start}" is not in states`);
  }
  if (!Array.isArray(dfa.accept)) {
    throw new Error('accept must be an array');
  }
  for (const state of dfa.accept) {
    if (!dfa.states.includes(state)) {
      throw new Error(`accept state "${state}" is not in states`);
    }
  }
  const transitions = dfa.transitions || {};
  for (const state of dfa.states) {
    const row = transitions[state];
    if (row === undefined) {
      continue;
    }
    for (const [symbol, target] of Object.entries(row)) {
      if (!dfa.alphabet.includes(symbol)) {
        throw new Error(`symbol "${symbol}" is not in the alphabet`);
      }
      if (!dfa.states.includes(target)) {
        throw new Error(`transition "${state}" --"${symbol}"--> "${target}" targets an unknown state`);
      }
    }
  }
  return true;
}

export function createDFA(spec) {
  validateDFA(spec);
  const transitions = {};
  for (const state of spec.states) {
    transitions[state] = { ...(spec.transitions?.[state] || {}) };
  }
  return {
    states: [...spec.states],
    alphabet: [...spec.alphabet],
    start: spec.start,
    accept: [...spec.accept],
    transitions,
  };
}

function uniqueName(base, states) {
  let name = base;
  while (states.includes(name)) {
    name = `_${name}`;
  }
  return name;
}

export function completeDFA(dfa, alphabet = dfa.alphabet) {
  const states = [...dfa.states];
  let sink = null;
  for (const state of states) {
    for (const symbol of alphabet) {
      if (dfa.transitions[state]?.[symbol] === undefined) {
        sink = uniqueName(SINK_BASE, states);
        states.push(sink);
        break;
      }
    }
    if (sink !== null) {
      break;
    }
  }
  const transitions = {};
  for (const state of states) {
    transitions[state] = {};
    for (const symbol of alphabet) {
      transitions[state][symbol] = dfa.transitions[state]?.[symbol] ?? sink;
    }
  }
  return {
    ...dfa,
    states,
    alphabet: [...alphabet],
    transitions,
  };
}

export function reachableDFA(dfa) {
  const reachable = new Set([dfa.start]);
  const queue = [dfa.start];
  while (queue.length > 0) {
    const state = queue.shift();
    for (const symbol of dfa.alphabet) {
      const target = dfa.transitions[state]?.[symbol];
      if (target !== undefined && !reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }
  const states = dfa.states.filter(state => reachable.has(state));
  const transitions = {};
  for (const state of states) {
    transitions[state] = {};
    for (const symbol of dfa.alphabet) {
      const target = dfa.transitions[state]?.[symbol];
      if (target !== undefined && reachable.has(target)) {
        transitions[state][symbol] = target;
      }
    }
  }
  return {
    ...dfa,
    states,
    accept: dfa.accept.filter(state => reachable.has(state)),
    transitions,
  };
}

export function simulateDFA(dfa, input) {
  let state = dfa.start;
  const trace = [state];
  for (const symbol of input) {
    if (!dfa.alphabet.includes(symbol)) {
      return { accepted: false, trace, error: `symbol "${symbol}" is not in the alphabet` };
    }
    const target = dfa.transitions[state]?.[symbol];
    if (target === undefined) {
      return { accepted: false, trace, missing: { state, symbol } };
    }
    state = target;
    trace.push(state);
  }
  return { accepted: dfa.accept.includes(state), trace };
}

export function acceptsDFA(dfa, input) {
  return simulateDFA(dfa, input).accepted;
}

export function minimizeDFA(dfa) {
  const complete = completeDFA(dfa);
  const reachable = reachableDFA(complete);
  const accepting = reachable.states.filter(state => reachable.accept.includes(state));
  const rejecting = reachable.states.filter(state => !reachable.accept.includes(state));
  let blocks = [];
  if (accepting.length > 0) {
    blocks.push(accepting);
  }
  if (rejecting.length > 0) {
    blocks.push(rejecting);
  }

  let changed = true;
  while (changed) {
    changed = false;
    const next = [];
    for (const block of blocks) {
      const groups = new Map();
      for (const state of block) {
        const signature = reachable.alphabet
          .map(symbol => {
            const target = reachable.transitions[state][symbol];
            return blocks.findIndex(candidate => candidate.includes(target));
          })
          .join('|');
        if (!groups.has(signature)) {
          groups.set(signature, []);
        }
        groups.get(signature).push(state);
      }
      if (groups.size > 1) {
        changed = true;
      }
      next.push(...groups.values());
    }
    blocks = next;
  }

  const blockOf = new Map();
  blocks.forEach((block, index) => {
    for (const state of block) {
      blockOf.set(state, index);
    }
  });
  const names = blocks.map((_, index) => `m${index}`);
  const transitions = {};
  blocks.forEach((block, index) => {
    const representative = block[0];
    transitions[names[index]] = {};
    for (const symbol of reachable.alphabet) {
      const target = reachable.transitions[representative][symbol];
      transitions[names[index]][symbol] = names[blockOf.get(target)];
    }
  });
  const accept = blocks
    .map((block, index) => (block.some(state => reachable.accept.includes(state)) ? names[index] : null))
    .filter(name => name !== null);
  return {
    states: names,
    alphabet: [...reachable.alphabet],
    start: names[blockOf.get(reachable.start)],
    accept,
    transitions,
  };
}

function pairKey([left, right]) {
  return `${left}\u0000${right}`;
}

function reconstruct(parent, key) {
  const symbols = [];
  let current = key;
  while (true) {
    const step = parent.get(current);
    if (step === null || step === undefined) {
      break;
    }
    symbols.push(step.symbol);
    current = step.from;
  }
  return symbols.reverse().join('');
}

export function areEquivalentDFA(left, right) {
  const alphabet = [...new Set([...left.alphabet, ...right.alphabet])];
  const a = completeDFA(left, alphabet);
  const b = completeDFA(right, alphabet);
  const start = [a.start, b.start];
  const queue = [start];
  const visited = new Set([pairKey(start)]);
  const parent = new Map([[pairKey(start), null]]);

  while (queue.length > 0) {
    const [p, q] = queue.shift();
    const acceptsLeft = a.accept.includes(p);
    const acceptsRight = b.accept.includes(q);
    if (acceptsLeft !== acceptsRight) {
      return { equivalent: false, counterexample: reconstruct(parent, pairKey([p, q])) };
    }
    for (const symbol of alphabet) {
      const next = [a.transitions[p][symbol], b.transitions[q][symbol]];
      const key = pairKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, { from: pairKey([p, q]), symbol });
        queue.push(next);
      }
    }
  }
  return { equivalent: true, counterexample: null };
}

export function shortestCounterexample(left, right) {
  const result = areEquivalentDFA(left, right);
  return result.equivalent ? null : result.counterexample;
}
