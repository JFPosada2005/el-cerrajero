import { createDFA } from '../core/dfa.js';

export const level1 = {
  id: 1,
  contract: '01',
  title: 'La caja de seguridad',
  client: 'Banco del Llano',
  goal: 'Abre solo con la secuencia 1 · 2 · 3.',
  brief:
    'El banco necesita una cerradura que abra solo con la secuencia 1-2-3. El ladrón probará cualquier combinación. Repará el mecanismo antes de que llegue.',
  thief: {
    giveUp: 'El ladrón probó todas las combinaciones y se fue con las manos vacías.',
    lines: {
      intruder: 'Marcas de ganzúa en {key}. El ladrón entró por ahí.',
      lockout: 'El cliente probó {key} en su propia caja y la cerradura no cedió.',
    },
  },
  alphabet: ['1', '2', '3', '4'],
  states: [
    { id: 'q0', label: 'Entrada', x: 140, y: 270, start: true },
    { id: 'q1', label: 'Celda 1', x: 340, y: 150 },
    { id: 'q2', label: 'Celda 2', x: 540, y: 270 },
    { id: 'q3', label: 'Cerrojo', x: 720, y: 150, accept: true },
  ],
  initialTransitions: {
    q0: { 1: 'q1', 2: 'q3' },
    q1: { 1: 'q3' },
    q2: { 3: 'q3' },
    q3: {},
  },
  target: createDFA({
    states: ['q0', 'q1', 'q2', 'q3', 'qr'],
    alphabet: ['1', '2', '3', '4'],
    start: 'q0',
    accept: ['q3'],
    transitions: {
      q0: { 1: 'q1', 2: 'qr', 3: 'qr', 4: 'qr' },
      q1: { 1: 'qr', 2: 'q2', 3: 'qr', 4: 'qr' },
      q2: { 1: 'qr', 2: 'qr', 3: 'q3', 4: 'qr' },
      q3: { 1: 'qr', 2: 'qr', 3: 'qr', 4: 'qr' },
      qr: { 1: 'qr', 2: 'qr', 3: 'qr', 4: 'qr' },
    },
  }),
  legitimateKey: '123',
};
