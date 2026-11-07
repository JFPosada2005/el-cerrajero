import { EPSILON } from './symbols.js';
import { createDFA, areEquivalentDFA } from './dfa.js';

function rawTargets(nfa, state, symbol) {
  const transitions = nfa.transitions || {};
  const row = transitions[state];
  if (row === undefined) {
    return [];
  }
  const value = row[symbol];
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return [...value];
  }
  return [value];
}

function subsetName(members) {
  return `{${members.join(',')}}`;
}

export function validateNFA(nfa) {
  if (!nfa || typeof nfa !== 'object') {
    throw new Error('NFA must be an object');
  }
  if (!Array.isArray(nfa.states) || nfa.states.length === 0) {
    throw new Error('NFA must have at least one state');
  }
  if (!Array.isArray(nfa.alphabet) || nfa.alphabet.length === 0) {
    throw new Error('NFA must have a non-empty alphabet');
  }
  if (!nfa.states.includes(nfa.start)) {
    throw new Error(`start state "${nfa.start}" is not in states`);
  }
  if (!Array.isArray(nfa.accept)) {
    throw new Error('accept must be an array');
  }
  for (const state of nfa.accept) {
    if (!nfa.states.includes(state)) {
      throw new Error(`accept state "${state}" is not in states`);
    }
  }
  const transitions = nfa.transitions || {};
  for (const source of Object.keys(transitions)) {
    if (!nfa.states.includes(source)) {
      throw new Error(`transition row "${source}" is not in states`);
    }
  }
  for (const state of nfa.states) {
    const row = transitions[state];
    if (row === undefined) {
      continue;
    }
    for (const symbol of Object.keys(row)) {
      if (symbol !== EPSILON && !nfa.alphabet.includes(symbol)) {
        throw new Error(`symbol "${symbol}" is not in the alphabet`);
      }
      const targets = row[symbol];
      if (!Array.isArray(targets)) {
        throw new Error(`transition "${state}" --"${symbol}"--> must list target states`);
      }
      for (const target of targets) {
        if (!nfa.states.includes(target)) {
          throw new Error(`transition "${state}" --"${symbol}"--> "${target}" targets an unknown state`);
        }
      }
    }
  }
  return true;
}

export function createNFA(spec) {
  validateNFA(spec);
  const order = new Map(spec.states.map((state, index) => [state, index]));
  const transitions = {};
  for (const state of spec.states) {
    const row = spec.transitions?.[state] || {};
    const clean = {};
    for (const symbol of Object.keys(row)) {
      const deduped = [...new Set(row[symbol])];
      deduped.sort((left, right) => order.get(left) - order.get(right));
      if (deduped.length > 0) {
        clean[symbol] = deduped;
      }
    }
    transitions[state] = clean;
  }
  return {
    type: 'nfa',
    states: [...spec.states],
    alphabet: [...spec.alphabet],
    start: spec.start,
    accept: [...spec.accept],
    transitions,
  };
}

export function epsilonClosure(nfa, states) {
  const seen = new Set(states);
  const stack = [...states];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const target of rawTargets(nfa, current, EPSILON)) {
      if (!seen.has(target)) {
        seen.add(target);
        stack.push(target);
      }
    }
  }
  return nfa.states.filter(state => seen.has(state));
}

export function moveNFA(nfa, states, symbol) {
  const found = new Set();
  for (const state of states) {
    for (const target of rawTargets(nfa, state, symbol)) {
      found.add(target);
    }
  }
  return nfa.states.filter(state => found.has(state));
}

export function runNFA(nfa, word, options = {}) {
  let active = epsilonClosure(nfa, [nfa.start]);
  let frames = [];
  if (options.record === true) {
    frames.push({ consumed: 0, active: [...active], symbol: null });
  }
  let index = 0;
  for (const symbol of word) {
    if (!nfa.alphabet.includes(symbol)) {
      return { accepted: false, outcome: 'invalid-symbol', steps: index, frames };
    }
    const next = epsilonClosure(nfa, moveNFA(nfa, active, symbol));
    if (next.length === 0) {
      return { accepted: false, outcome: 'missing', steps: index, frames };
    }
    active = next;
    index = index + 1;
    if (options.record === true) {
      frames.push({ consumed: index, active: [...active], symbol });
    }
  }
  const accepted = active.some(state => nfa.accept.includes(state));
  let outcome = 'reject';
  if (accepted) {
    outcome = 'accept';
  }
  return { accepted, outcome, steps: index, frames };
}

export function acceptsNFA(nfa, word) {
  return runNFA(nfa, word).accepted;
}

export function nfaToDFA(nfa, alphabet = nfa.alphabet) {
  const startSet = epsilonClosure(nfa, [nfa.start]);
  const startName = subsetName(startSet);
  const subsets = new Map([[startName, startSet]]);
  const queue = [startSet];
  const transitions = {};
  while (queue.length > 0) {
    const current = queue.shift();
    const currentName = subsetName(current);
    transitions[currentName] = {};
    for (const symbol of alphabet) {
      const next = epsilonClosure(nfa, moveNFA(nfa, current, symbol));
      if (next.length === 0) {
        continue;
      }
      const nextName = subsetName(next);
      transitions[currentName][symbol] = nextName;
      if (!subsets.has(nextName)) {
        subsets.set(nextName, next);
        queue.push(next);
      }
    }
  }
  const states = [...subsets.keys()];
  const accept = states.filter(name => subsets.get(name).some(state => nfa.accept.includes(state)));
  return createDFA({ states, alphabet: [...alphabet], start: startName, accept, transitions });
}

export function areEquivalentNFA(left, right) {
  const a = nfaToDFA(left, left.alphabet);
  const b = nfaToDFA(right, left.alphabet);
  return areEquivalentDFA(a, b);
}
