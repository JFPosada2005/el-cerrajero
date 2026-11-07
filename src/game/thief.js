export function formatLine(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if ((name in values) === false) {
      return match;
    }
    return String(values[name]);
  });
}
export function thiefReport(verdict, level) {
  if (verdict.correct === true) {
    return { text: level.thief.giveUp, tone: 'good' };
  }
  const line = level.thief.lines[verdict.reason] ?? level.thief.lines.intruder;
  const text = formatLine(line, { key: verdict.counterexample });
  return { text, tone: 'bad' };
}
