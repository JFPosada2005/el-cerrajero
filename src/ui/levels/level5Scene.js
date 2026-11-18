/**
 * Escena del nivel 5 — Banco Central, sala de recuento.
 *
 * Un solo taller: fondo de sala, mesa y una placa con riel de cabezal que
 * enmarca el editor real. El tambor y la cinta reales los monta el parent
 * en `editorSlot`; esta escena no crea editor, púas, juicio ni lógica, y
 * no toca la protección de la sección "Listo".
 *
 * La atmósfera trae luz cálida, remaches y rótulo de caja en la placa, más
 * un riel de cabezal con cinta perforada decorativa (orificios sin casillas
 * ni símbolos) que marca el lugar del mecanismo real sin duplicarlo.
 *
 * Placeholders CSS/DOM (ver `docs/ASSET-MANIFEST.md`):
 * fondo, cinta, cabezal, tambor y púa en `final`; la boleta sigue
 * `a producir` hasta que llegue `n5.depositSlip`.
 */

const PHASE_WORDS = { repair: 'Reparación', build: 'Construcción' };
const STAMP_WORDS = { repair: 'En reparación', build: 'En construcción' };

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

function markFinal(node, asset, src) {
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'final');
  node.setAttribute('data-src', src);
}

/**
 * @param {object} options
 * @param {object} options.level Nivel 5 (contrato, título, cliente).
 * @param {object} options.puzzle Puzzle de la fase (goal, intro, examples).
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
  markFinal(backdrop, 'n5.background', 'assets/levels/05/background.webp');
  const light = make('div', 'counting-light');
  light.setAttribute('aria-hidden', 'true');
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
  markFinal(
    benchPlate,
    'n5.tape, n5.head, n5.drum, n5.pin',
    'assets/levels/05/tape.svg, assets/levels/05/head.webp, assets/levels/05/drum.webp, assets/levels/05/pin.svg',
  );
  const rivets = make('div', 'plate-rivets');
  rivets.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 4; index += 1) {
    rivets.append(make('span', 'plate-rivet'));
  }
  const plateTop = make('div', 'plate-top');
  plateTop.setAttribute('aria-hidden', 'true');
  plateTop.append(
    make('span', 'plate-label', 'Banco Central · Caja 05'),
    make('span', 'plate-serial', 'N.º 0501'),
  );
  const rail = make('div', 'plate-rail');
  rail.setAttribute('aria-hidden', 'true');
  const holesLeft = make('div', 'rail-holes');
  const holesRight = make('div', 'rail-holes');
  for (let index = 0; index < 7; index += 1) {
    holesLeft.append(make('span', 'rail-hole'));
    holesRight.append(make('span', 'rail-hole'));
  }
  const notch = make('span', 'plate-rail-notch');
  rail.append(holesLeft, notch, holesRight);
  const plateCaption = make(
    'p',
    'plate-caption',
    'La cinta corre y el tambor lleva la cuenta de la caja 05.',
  );

  const editorSlot = make('div', 'counting-editor');
  editorSlot.setAttribute('data-slot', 'editor');
  editorSlot.setAttribute('aria-label', 'Tambor y cinta del taller');

  benchPlate.append(rivets, plateTop, rail, plateCaption, editorSlot);

  const side = make('div', 'counting-side');

  const slip = make('aside', 'counting-slip');
  slip.setAttribute('aria-label', 'Boleta de depósito');
  markProducing(slip, 'n5.depositSlip');
  const seal = make('span', 'slip-seal');
  seal.setAttribute('aria-hidden', 'true');
  const stamp = make('span', 'slip-stamp', STAMP_WORDS[phase] ?? phaseWord(phase, puzzle));
  stamp.setAttribute('aria-hidden', 'true');
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
  slip.append(stamp);
  slip.append(make('p', 'slip-foot', 'Caja 05 · N.º 0501'));
  slip.append(seal);

  const statusSlot = make('div', 'counting-status');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-label', 'Contador del mecanismo');

  side.append(slip, statusSlot);
  body.append(benchPlate, side);

  element.append(backdrop, light, bench, head, body);

  function setPhase(next) {
    phaseBadge.textContent = PHASE_WORDS[next] ?? String(next);
    stamp.textContent = STAMP_WORDS[next] ?? PHASE_WORDS[next] ?? String(next);
  }

  function dispose() {
    element.remove();
  }

  return { element, editorSlot, statusSlot, setPhase, dispose };
}
