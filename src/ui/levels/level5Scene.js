/**
 * Escena del nivel 5 — Banco Central, sala de recuento.
 *
 * Un solo taller: fondo de sala, mesa y una placa con riel de cabezal que
 * enmarca el editor real. El tambor y la cinta reales los monta el parent
 * en `editorSlot`; esta escena no crea editor, púas, juicio ni lógica, y
 * no toca la protección de la sección "Listo".
 *
 * Sin maquetas de cinta ni de tambor: el riel del cabezal es solo
 * atmósfera (sin casillas ni púas) para no duplicar el mecanismo real.
 *
 * Placeholders CSS/DOM marcados "a producir" (ver `docs/ASSET-MANIFEST.md`):
 * n5.background, n5.tape, n5.head, n5.drum, n5.pin, n5.depositSlip.
 */

const PHASE_WORDS = { repair: 'Reparación', build: 'Construcción' };

function phaseWord(phase, puzzle) {
  if (phase === 'repair' || phase === 'Reparación') {
    return 'Reparación';
  }
  if (phase === 'build' || phase === 'Construcción') {
    return 'Construcción';
  }
  if (puzzle !== undefined && puzzle !== null) {
    return String(phase ?? '');
  }
  return String(phase ?? '');
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function markProducing(node, asset) {
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'a producir');
}

/**
 * @param {object} options
 * @param {object} options.level Nivel 5 (contrato, título, cliente).
 * @param {object} options.puzzle Puzzle de la fase (goal, intro, sections, examples).
 * @param {string} options.phase 'repair' | 'build' (o palabra ya traducida).
 */
export function createLevelScene(options = {}) {
  const { level = {}, puzzle = {}, phase = 'repair' } = options;
  const contract = level.contract ?? '05';
  const client = level.client ?? 'Banco Central';

  const element = make('section', 'level-scene level-scene--counting');
  element.setAttribute('data-level', '5');
  element.setAttribute('aria-label', 'Sala de recuento del Banco Central');

  const backdrop = make('div', 'counting-backdrop');
  backdrop.setAttribute('aria-hidden', 'true');
  markProducing(backdrop, 'n5.background');
  const bench = make('div', 'counting-bench');
  bench.setAttribute('aria-hidden', 'true');

  const head = make('header', 'counting-head');
  const kicker = make('p', 'counting-kicker', `Contrato ${contract} · ${client}`);
  const title = make('h2', 'counting-title', 'Sala de recuento');
  const phaseBadge = make('p', 'counting-phase', PHASE_WORDS[phase] ?? phaseWord(phase, puzzle));
  const plate = make('p', 'counting-plate', 'Caja 05 · N.º 0501');
  head.append(kicker, title, phaseBadge, plate);

  const body = make('div', 'counting-body');

  const benchPlate = make('div', 'counting-bench-plate');
  markProducing(benchPlate, 'n5.tape, n5.head, n5.drum, n5.pin');
  const rail = make('div', 'plate-rail');
  rail.setAttribute('aria-hidden', 'true');
  rail.append(make('span', 'plate-rail-notch'));
  const plateCaption = make(
    'p',
    'plate-caption',
    'El tambor y la cinta del taller trabajan sobre esta placa.',
  );

  const editorSlot = make('div', 'counting-editor');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('aria-label', 'Tambor y cinta del taller');

  benchPlate.append(rail, plateCaption, editorSlot);

  const side = make('div', 'counting-side');

  const slip = make('aside', 'counting-slip');
  slip.setAttribute('aria-label', 'Boleta de depósito');
  markProducing(slip, 'n5.depositSlip');
  slip.append(make('p', 'slip-kicker', 'Boleta de depósito'));
  slip.append(make('p', 'slip-client', client));
  if (puzzle.goal !== undefined) {
    slip.append(make('p', 'slip-rule', String(puzzle.goal)));
  }
  const runs = puzzle.examples?.runs;
  if (Array.isArray(runs) && runs.length > 0) {
    const sample = runs[0];
    slip.append(make('p', 'slip-sample', `La cinta ${sample.input} debe dejar ${sample.output}.`));
  }
  slip.append(make('p', 'slip-note', 'Si el contador marca otra cuenta, la alarma queda encendida.'));

  const statusSlot = make('div', 'counting-status');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-label', 'Contador del mecanismo');

  side.append(slip, statusSlot);
  body.append(benchPlate, side);

  element.append(backdrop, bench, head, body);

  function setPhase(next) {
    phaseBadge.textContent = PHASE_WORDS[next] ?? String(next);
  }

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot, setPhase, dispose };
}
