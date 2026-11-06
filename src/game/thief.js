export function formatLine(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in values)) {
      return match;
    }
    return String(values[name]);
  });
}

export function thiefReport(result, level) {
  if (!result.escaped) {
    return { text: level.thief.giveUp, tone: 'good' };
  }
  const line = level.thief.lines[result.reason] ?? level.thief.lines.intruder;
  const text = formatLine(line, { key: result.counterexample });
  return { text, tone: 'bad' };
}
