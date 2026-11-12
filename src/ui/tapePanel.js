export function createTapePanel({ root, blankLabel = '' }) {
  function show({ window, head, sectionLabel }) {
    root.replaceChildren();
    const label = document.createElement('p');
    label.setAttribute('class', 'tape-section');
    label.textContent = `Cinta · ${sectionLabel}`;
    root.append(label);
    const tape = document.createElement('div');
    tape.setAttribute('class', 'tape');
    const cells = document.createElement('div');
    cells.setAttribute('class', 'tape-cells');
    cells.setAttribute('role', 'list');
    cells.setAttribute('aria-label', 'Cinta');
    const hot = head - window.start;
    for (let offset = 0; offset < window.symbols.length; offset = offset + 1) {
      const symbol = window.symbols[offset];
      const shown = symbol === '_' ? blankLabel : symbol;
      const cell = document.createElement('div');
      cell.setAttribute('role', 'listitem');
      if (offset === hot) {
        cell.setAttribute('class', 'tape-cell is-head');
        cell.setAttribute('aria-current', 'step');
      } else {
        cell.setAttribute('class', 'tape-cell');
      }
      if (shown === '') {
        cell.setAttribute('aria-label', 'casilla vacía');
      } else {
        cell.setAttribute('aria-label', `casilla ${shown}`);
      }
      cell.textContent = shown;
      if (offset === hot) {
        const marker = document.createElement('span');
        marker.setAttribute('class', 'tape-marker');
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = '▲';
        cell.append(marker);
      }
      cells.append(cell);
    }
    tape.append(cells);
    root.append(tape);
  }
  return { show };
}
