import { DEFAULT_LIMITS } from './limits.js';

function readCell(tape, blank, head) {
  const found = tape.get(head);
  return found === undefined ? blank : found;
}

function windowSymbols(tape, blank, head) {
  const symbols = [];
  for (let index = head - 3; index <= head + 3; index = index + 1) {
    symbols.push(readCell(tape, blank, index));
  }
  return symbols;
}

function pushFrame(frames, record, maxFrames, step, state, head, read, rule, tape, blank, terminal = false) {
  if (record !== true) {
    return;
  }
  const shown = rule === null ? null : { ...rule };
  const window = { start: head - 3, symbols: windowSymbols(tape, blank, head) };
  const frame = { step, state, head, read, rule: shown, window };
  if (frames.length < maxFrames) {
    frames.push(frame);
    return;
  }
  if (terminal === true && maxFrames > 0) {
    frames[maxFrames - 1] = frame;
  }
}

function tapeOutput(tape, blank) {
  if (tape.size === 0) {
    return '';
  }
  const cells = [...tape.keys()];
  let low = cells[0];
  let high = cells[0];
  for (const cell of cells) {
    if (cell < low) {
      low = cell;
    }
    if (cell > high) {
      high = cell;
    }
  }
  let output = '';
  for (let index = low; index <= high; index = index + 1) {
    output = output + readCell(tape, blank, index);
  }
  return output;
}

export function validateTM(tm) {
  if (!tm || typeof tm !== 'object' || Array.isArray(tm)) {
    throw new Error('TM must be an object');
  }
  if (!Array.isArray(tm.states) || tm.states.length === 0) {
    throw new Error('TM must have at least one state');
  }
  if (!Array.isArray(tm.inputAlphabet) || tm.inputAlphabet.length === 0) {
    throw new Error('TM must have a non-empty input alphabet');
  }
  if (!Array.isArray(tm.tapeAlphabet) || tm.tapeAlphabet.length === 0) {
    throw new Error('TM must have a non-empty tape alphabet');
  }
  if (!tm.tapeAlphabet.includes(tm.blank)) {
    throw new Error('TM blank must be in the tape alphabet');
  }
  if (tm.inputAlphabet.includes(tm.blank)) {
    throw new Error('TM blank must not be in the input alphabet');
  }
  for (const symbol of tm.inputAlphabet) {
    if (!tm.tapeAlphabet.includes(symbol)) {
      throw new Error(`input symbol "${symbol}" is not in the tape alphabet`);
    }
  }
  if (!tm.states.includes(tm.start)) {
    throw new Error(`start state "${tm.start}" is not in states`);
  }
  if (!Array.isArray(tm.accept)) {
    throw new Error('accept must be an array');
  }
  for (const state of tm.accept) {
    if (!tm.states.includes(state)) {
      throw new Error(`accept state "${state}" is not in states`);
    }
  }
  if (!tm.transitions || typeof tm.transitions !== 'object' || Array.isArray(tm.transitions)) {
    throw new Error('transitions must be an object');
  }
  for (const source of Object.keys(tm.transitions)) {
    if (!tm.states.includes(source)) {
      throw new Error(`transition row "${source}" is not in states`);
    }
  }
  for (const state of tm.accept) {
    const row = tm.transitions[state];
    if (row !== undefined && Object.keys(row).length > 0) {
      throw new Error(`accept state "${state}" must have no rules`);
    }
  }
  for (const [source, row] of Object.entries(tm.transitions)) {
    for (const [read, rule] of Object.entries(row)) {
      if (!tm.tapeAlphabet.includes(read)) {
        throw new Error(`read symbol "${read}" is not in the tape alphabet`);
      }
      if (!rule || typeof rule !== 'object') {
        throw new Error(`rule "${source}" on "${read}" must be an object`);
      }
      if (rule.write === undefined || rule.move === undefined || rule.to === undefined) {
        throw new Error(`rule "${source}" on "${read}" needs write, move and to`);
      }
      if (!tm.tapeAlphabet.includes(rule.write)) {
        throw new Error(`write symbol "${rule.write}" is not in the tape alphabet`);
      }
      if (rule.move !== 'L' && rule.move !== 'R') {
        throw new Error(`move "${rule.move}" must be L or R`);
      }
      if (!tm.states.includes(rule.to)) {
        throw new Error(`transition to "${rule.to}" is not in states`);
      }
    }
  }
  return true;
}

export function createTM(spec) {
  validateTM(spec);
  const transitions = {};
  for (const [source, row] of Object.entries(spec.transitions)) {
    transitions[source] = {};
    for (const [read, rule] of Object.entries(row)) {
      transitions[source][read] = { ...rule };
    }
  }
  return {
    type: 'tm',
    states: [...spec.states],
    inputAlphabet: [...spec.inputAlphabet],
    tapeAlphabet: [...spec.tapeAlphabet],
    blank: spec.blank,
    start: spec.start,
    accept: [...spec.accept],
    transitions
  };
}

export function runTM(tm, input, options = {}) {
  const maxSteps = options.maxSteps ?? DEFAULT_LIMITS.maxSteps;
  const maxFrames = options.maxFrames ?? DEFAULT_LIMITS.maxFrames;
  const record = options.record === true;
  for (const symbol of input) {
    if (!tm.inputAlphabet.includes(symbol)) {
      return { accepted: false, outcome: 'invalid-symbol', steps: 0, frames: [], output: '' };
    }
  }
  const tape = new Map();
  for (let index = 0; index < input.length; index = index + 1) {
    tape.set(index, input[index]);
  }
  let state = tm.start;
  let head = 0;
  let steps = 0;
  const frames = [];
  while (true) {
    if (tm.accept.includes(state)) {
      pushFrame(frames, record, maxFrames, steps, state, head, readCell(tape, tm.blank, head), null, tape, tm.blank, true);
      return { accepted: true, outcome: 'accept', steps, frames, output: tapeOutput(tape, tm.blank) };
    }
    const read = readCell(tape, tm.blank, head);
    const row = tm.transitions[state];
    const rule = row === undefined ? undefined : row[read];
    if (rule === undefined) {
      pushFrame(frames, record, maxFrames, steps, state, head, read, null, tape, tm.blank, true);
      return { accepted: false, outcome: 'alarm', steps, frames, output: tapeOutput(tape, tm.blank) };
    }
    if (steps === maxSteps) {
      pushFrame(frames, record, maxFrames, steps, state, head, read, rule, tape, tm.blank, true);
      return { accepted: false, outcome: 'limit', steps, frames, output: tapeOutput(tape, tm.blank) };
    }
    pushFrame(frames, record, maxFrames, steps, state, head, read, rule, tape, tm.blank);
    if (rule.write === tm.blank) {
      tape.delete(head);
    }
    if (rule.write !== tm.blank) {
      tape.set(head, rule.write);
    }
    if (rule.move === 'L') {
      head = head - 1;
    }
    if (rule.move !== 'L') {
      head = head + 1;
    }
    state = rule.to;
    steps = steps + 1;
  }
}

export function acceptsTM(tm, input) {
  return runTM(tm, input).accepted;
}
