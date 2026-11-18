/**
 * Escena del nivel 5 — Banco Central, sala de recuento.
 *
 * Escena inmersiva y diegética: ocupa toda la ventana, sin panel de
 * objetivo ni barra de acciones. La placa del mecanismo es el centro
 * sobre la mesa y los controles son props accionables (botones reales
 * con `data-action`) que el parent engancha con sus handlers de siempre:
 * papeles sobre la mesa (contrato/pista/bitácora), manivela del tambor
 * (probar) y volante de la bóveda (ensayo). La boleta de depósito
 * concentra la lectura: ahí se ven el contador y la fase, sin franja
 * aparte. El shell, en modo inmersivo, mueve su línea a `hudSlot` y
 * reserva `keysSlot` para sus herramientas (N5 no usa carretes: la
 * ranura queda vacía y oculta, pero existe para el contrato).
 *
 * El tambor y la cinta reales los monta el parent en `editorSlot`; esta
 * escena no crea editor, púas, juicio ni lógica, y no toca la protección
 * de la sección "Listo".
 *
 * La atmósfera trae luz cálida, remaches y rótulo de caja en la placa,
 * más un riel de cabezal con cinta perforada decorativa (orificios sin
 * casillas ni símbolos) que marca el lugar del mecanismo real sin
 * duplicarlo.
 *
 * Placeholders CSS/DOM (ver `docs/ASSET-MANIFEST.md`):
 * fondo, cinta, cabezal, tambor y púa en `final`; la boleta usa el asset
 * final `levels.05.depositSlip` como fondo del papel.
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

function markFinal(node, asset, src) {
  node.setAttribute('data-asset', asset);
  node.setAttribute('data-status', 'final');
  node.setAttribute('data-src', src);
}

/**
 * Un prop accionable: un botón real sin caja de botón moderna. El parent
 * engancha su handler sobre `data-action`; la escena no decide nada.
 */
function propButton(className, action, label, visualClass, name, nameClass) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  const visual = make('span', visualClass);
  visual.setAttribute('aria-hidden', 'true');
  const caption = make('span', nameClass, name);
  caption.setAttribute('aria-hidden', 'true');
  button.append(visual, caption);
  return button;
}

/**
 * Un papel sobre la mesa con su asset final: la imagen nombra el slot
 * del manifiesto y el rótulo va debajo. El nombre accesible lo da el
 * aria-label del botón, así el alt queda vacío.
 */
function paperProp(src, asset, action, label, name) {
  const item = make('li', 'counting-paper-item');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'counting-paper';
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  const image = document.createElement('img');
  image.setAttribute('src', src);
  image.setAttribute('alt', '');
  image.setAttribute('data-asset', asset);
  image.setAttribute('data-status', 'final');
  image.setAttribute('data-src', src);
  button.append(image, make('span', 'counting-paper-name', name));
  item.append(button);
  return item;
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
    make('span', 'plate-label', 'Caja 05'),
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

  const stateLine = make('p', 'plate-state', `Caja ${contract} · ${STAMP_WORDS[phase] ?? PHASE_WORDS[phase] ?? phaseWord(phase, puzzle)}`);

  benchPlate.append(rivets, plateTop, rail, plateCaption, editorSlot, stateLine);

  const papers = make('ul', 'counting-papers');
  papers.setAttribute('aria-label', 'Papeles sobre la mesa');
  papers.append(
    paperProp('assets/levels/01/props/contract.webp', 'levels.01.contract', 'contract', 'Abrir el contrato', 'Contrato'),
    paperProp('assets/levels/01/props/hint.webp', 'levels.01.hint', 'hint', 'Pedir una pista', 'Pista'),
    paperProp('assets/levels/01/props/log.webp', 'levels.01.log', 'log', 'Abrir la bitácora', 'Bitácora'),
  );

  const crank = propButton(
    'counting-crank',
    'probe',
    'Probar la cinta en el tambor',
    'crank-arm',
    'Manivela',
    'crank-name',
  );
  const wheel = propButton(
    'counting-wheel',
    'assault',
    'Pedir el ensayo de la bóveda',
    'wheel-ring',
    'Volante',
    'wheel-name',
  );

  const slip = make('aside', 'counting-slip');
  slip.setAttribute('aria-label', 'Boleta de depósito');
  markFinal(slip, 'levels.05.depositSlip', 'assets/levels/05/deposit-slip.webp');
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
  const statusSlot = make('div', 'counting-status');
  statusSlot.setAttribute('data-slot', 'status');
  statusSlot.setAttribute('aria-label', 'Contador del mecanismo');
  slip.append(statusSlot);
  slip.append(stamp);
  slip.append(make('p', 'slip-foot', 'Caja 05 · N.º 0501'));
  slip.append(seal);

  const keysSlot = make('div', 'counting-keys');
  keysSlot.setAttribute('data-slot', 'keys');
  keysSlot.setAttribute('aria-label', 'Herramientas del taller');
  keysSlot.setAttribute('hidden', '');

  const hudSlot = make('div', 'counting-hud');
  hudSlot.setAttribute('data-slot', 'hud');
  hudSlot.setAttribute('aria-label', 'Lectura del mecanismo');

  element.append(backdrop, light, bench, benchPlate, papers, crank, wheel, slip, keysSlot, hudSlot);

  function setPhase(next) {
    const word = STAMP_WORDS[next] ?? PHASE_WORDS[next] ?? String(next);
    stateLine.textContent = `Caja ${contract} · ${word}`;
    stamp.textContent = word;
  }

  function dispose() {
    element.remove();
  }

  return {
    element,
    editorSlot,
    statusSlot,
    keysSlot,
    hudSlot,
    actions: ['contract', 'hint', 'log', 'probe', 'assault'],
    setPhase,
    dispose,
  };
}
