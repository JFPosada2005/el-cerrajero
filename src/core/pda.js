import { EPSILON } from './symbols.js';
import { DEFAULT_LIMITS } from './limits.js';

function nodeKey(node) {
  return `${node.state}\0${node.consumed}\0${node.stack}`;
}

function toFrame(node) {
  return { consumed: node.consumed, state: node.state, stack: node.stack, rule: node.rule };
}

function buildFrames(node) {
  const path = [];
  let current = node;
  while (current !== null) {
    path.push(current);
    current = current.parent;
  }
  path.reverse();
  return path.map(toFrame);
}

function fireRule(word, node, rule) {
  if (rule.from !== node.state) {
    return null;
  }
  if (node.stack.length === 0) {
    return null;
  }
  if (node.stack[0] !== rule.pop) {
    return null;
  }
  if (rule.read !== EPSILON && word[node.consumed] !== rule.read) {
    return null;
  }
  const consumed = rule.read === EPSILON ? node.consumed : node.consumed + 1;
  const stack = rule.push + node.stack.slice(1);
  return { state: rule.to, consumed, stack, rule, parent: node, depth: node.depth + 1 };
}

function isBetter(node, best) {
  if (node.consumed !== best.consumed) {
    return node.consumed > best.consumed;
  }
  return node.depth < best.depth;
}

export function validatePDA(pda) {
  if (!pda || typeof pda !== 'object' || Array.isArray(pda)) {
    throw new Error('PDA must be an object');
  }
  if (!Array.isArray(pda.states) || pda.states.length === 0) {
    throw new Error('PDA must have at least one state');
  }
  if (!Array.isArray(pda.alphabet) || pda.alphabet.length === 0) {
    throw new Error('PDA must have a non-empty alphabet');
  }
  if (!Array.isArray(pda.stackAlphabet) || pda.stackAlphabet.length === 0) {
    throw new Error('PDA must have a non-empty stack alphabet');
  }
  if (!pda.stackAlphabet.includes(pda.stackStart)) {
    throw new Error(`stack start "${pda.stackStart}" is not in the stack alphabet`);
  }
  if (!pda.states.includes(pda.start)) {
    throw new Error(`start state "${pda.start}" is not in states`);
  }
  if (!Array.isArray(pda.accept)) {
    throw new Error('accept must be an array');
  }
  for (const state of pda.accept) {
    if (!pda.states.includes(state)) {
      throw new Error(`accept state "${state}" is not in states`);
    }
  }
  if (!Array.isArray(pda.transitions)) {
    throw new Error('transitions must be an array');
  }
  for (const rule of pda.transitions) {
    if (!pda.states.includes(rule.from)) {
      throw new Error(`transition from "${rule.from}" is not in states`);
    }
    if (!pda.states.includes(rule.to)) {
      throw new Error(`transition to "${rule.to}" is not in states`);
    }
    if (rule.read !== EPSILON && !pda.alphabet.includes(rule.read)) {
      throw new Error(`read symbol "${rule.read}" is not in the alphabet`);
    }
    if (!pda.stackAlphabet.includes(rule.pop)) {
      throw new Error(`pop symbol "${rule.pop}" is not in the stack alphabet`);
    }
    if (typeof rule.push !== 'string') {
      throw new Error('push must be a string');
    }
    for (const symbol of rule.push) {
      if (!pda.stackAlphabet.includes(symbol)) {
        throw new Error(`push symbol "${symbol}" is not in the stack alphabet`);
      }
    }
  }
  return true;
}

export function createPDA(spec) {
  validatePDA(spec);
  return {
    type: 'pda',
    states: [...spec.states],
    alphabet: [...spec.alphabet],
    stackAlphabet: [...spec.stackAlphabet],
    stackStart: spec.stackStart,
    start: spec.start,
    accept: [...spec.accept],
    transitions: spec.transitions.map((rule) => ({ ...rule })),
  };
}

export function runPDA(pda, word, options = {}) {
  const maxConfigs = options.maxConfigs ?? DEFAULT_LIMITS.maxConfigs;
  const maxStack = options.maxStack ?? DEFAULT_LIMITS.maxStack;
  const record = options.record === true;
  for (const symbol of word) {
    if (!pda.alphabet.includes(symbol)) {
      return { accepted: false, outcome: 'invalid-symbol', steps: 0, frames: [], truncated: false };
    }
  }
  const start = { state: pda.start, consumed: 0, stack: pda.stackStart, rule: null, parent: null, depth: 0 };
  let truncated = pda.stackStart.length > maxStack;
  let best = start;
  if (start.consumed === word.length && pda.accept.includes(start.state)) {
    return { accepted: true, outcome: 'accept', steps: 0, frames: record ? [toFrame(start)] : [], truncated };
  }
  const queue = [start];
  const visited = new Set([nodeKey(start)]);
  let explored = 0;
  while (queue.length > 0) {
    const current = queue.shift();
    explored = explored + 1;
    if (explored > maxConfigs) {
      return { accepted: false, outcome: 'limit', steps: best.depth, frames: record ? buildFrames(best) : [], truncated };
    }
    for (const rule of pda.transitions) {
      const child = fireRule(word, current, rule);
      if (child === null) {
        continue;
      }
      if (child.stack.length > maxStack) {
        truncated = true;
        continue;
      }
      const key = nodeKey(child);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      if (isBetter(child, best)) {
        best = child;
      }
      if (child.consumed === word.length && pda.accept.includes(child.state)) {
        return { accepted: true, outcome: 'accept', steps: child.depth, frames: record ? buildFrames(child) : [], truncated };
      }
      queue.push(child);
    }
  }
  if (truncated) {
    return { accepted: false, outcome: 'limit', steps: best.depth, frames: record ? buildFrames(best) : [], truncated };
  }
  return { accepted: false, outcome: 'reject', steps: best.depth, frames: record ? buildFrames(best) : [], truncated: false };
}

export function acceptsPDA(pda, word) {
  return runPDA(pda, word).accepted;
}
