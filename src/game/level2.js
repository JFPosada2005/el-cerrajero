import { createDFA } from '../core/dfa.js';
export const level2 = {
  id: 2,
  contract: '02',
  title: 'El ascensor',
  client: 'Hotel Mirador',
  brief: 'El ascensor del hotel solo debe abrir en el piso correcto. El ladrón probará combinaciones.',
  machine: 'dfa',
  workspace: 'graph',
  keys: [
    { symbol: '1', label: '1', tone: 'gold' },
    { symbol: '2', label: '2', tone: 'teal' }
  ],
  parts: ['wire', 'gear'],
  newPart: 'gear',
  thief: {
    trick: 'short',
    intro: 'El ladrón prueba combinaciones cortas, una por una.',
    giveUp: 'El ladrón probó todas las combinaciones y se fue con las manos vacías.',
    lines: {
      intruder: 'Marcas de ganzúa en {key}. El ladrón subió por ahí.',
      lockout: 'El cliente probó {key} en su propio ascensor y la puerta no abrió.',
      empty: 'El ladrón abrió la puerta sin tocar ningún botón.'
    }
  },
  phases: {
    repair: {
      goal: 'Abre solo si la llave 1 se usó una cantidad impar de veces.',
      intro: 'La celda Abierta perdió su cable de la llave 2. Volvé a conectarlo.',
      cells: [
        { id: 'c', label: 'Cerrada', x: 220, y: 270, start: true },
        { id: 'o', label: 'Abierta', x: 560, y: 270, accept: true }
      ],
      blueprint: {
        wires: [
          { from: 'c', to: 'o', key: '1' },
          { from: 'o', to: 'c', key: '1' },
          { from: 'c', to: 'c', key: '2' }
        ]
      },
      target: {
        kind: 'machine',
        machine: createDFA({
          states: ['c', 'o'],
          alphabet: ['1', '2'],
          start: 'c',
          accept: ['o'],
          transitions: {
            c: { 1: 'o', 2: 'c' },
            o: { 1: 'c', 2: 'o' }
          }
        })
      },
      judge: { method: 'exact' },
      examples: {
        open: ['1', '122', '12'],
        closed: ['', '2', '11']
      },
      hints: [
        'Probá la secuencia 1 y mirá dónde queda la celda Abierta.',
        'La celda Abierta tiene que seguir escuchando la llave 2.'
      ]
    },
    build: {
      goal: 'Abre solo si la secuencia termina en 2 · 1.',
      intro: 'El hotel cambió el código. Construí el mecanismo desde cero.',
      cells: [
        { id: 's0', label: 'Espera', x: 140, y: 270, start: true },
        { id: 's1', label: 'Atenta', x: 390, y: 150 },
        { id: 's2', label: 'Cerrojo', x: 660, y: 270, accept: true }
      ],
      blueprint: { wires: [] },
      target: {
        kind: 'machine',
        machine: createDFA({
          states: ['s0', 's1', 's2'],
          alphabet: ['1', '2'],
          start: 's0',
          accept: ['s2'],
          transitions: {
            s0: { 1: 's0', 2: 's1' },
            s1: { 1: 's2', 2: 's1' },
            s2: { 1: 's0', 2: 's1' }
          }
        })
      },
      judge: { method: 'exact' },
      examples: {
        open: ['21', '221', '1221'],
        closed: ['2', '1', '12', '211']
      },
      hints: [
        'Pensá qué dos llaves tienen que ser las últimas.',
        'Si llega otra llave después, el mecanismo tiene que volver a esperar.'
      ]
    }
  }
};
