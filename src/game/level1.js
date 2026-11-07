import { createDFA } from '../core/dfa.js';
export const level1 = {
  id: 1,
  contract: '01',
  title: 'La caja de seguridad',
  client: 'Banco del Llano',
  brief: 'El banco necesita una cerradura que abra solo con la secuencia 1-2-3. El ladrón probará cualquier combinación. Repará el mecanismo antes de que llegue.',
  machine: 'dfa',
  workspace: 'graph',
  keys: [
    { symbol: '1', label: '1', tone: 'gold' },
    { symbol: '2', label: '2', tone: 'teal' },
    { symbol: '3', label: '3', tone: 'coral' },
    { symbol: '4', label: '4', tone: 'violet' }
  ],
  parts: ['wire'],
  newPart: 'cell',
  thief: {
    trick: 'short',
    intro: 'El ladrón prueba combinaciones cortas, una por una.',
    giveUp: 'El ladrón probó todas las combinaciones y se fue con las manos vacías.',
    lines: {
      intruder: 'Marcas de ganzúa en {key}. El ladrón entró por ahí.',
      lockout: 'El cliente probó {key} en su propia caja y la cerradura no cedió.',
      empty: 'El ladrón empujó la puerta sin tocar ninguna llave y se abrió.'
    }
  },
  phases: {
    repair: {
      goal: 'Abre solo con la secuencia 1 · 2 · 3.',
      intro: 'El mecanismo quedó a medio armar. Falta un cable y hay dos de más.',
      cells: [
        { id: 'q0', label: 'Entrada', x: 140, y: 270, start: true },
        { id: 'q1', label: 'Celda 1', x: 340, y: 150 },
        { id: 'q2', label: 'Celda 2', x: 540, y: 270 },
        { id: 'q3', label: 'Cerrojo', x: 720, y: 150, accept: true }
      ],
      blueprint: {
        wires: [
          { from: 'q0', to: 'q1', key: '1' },
          { from: 'q0', to: 'q3', key: '2' },
          { from: 'q1', to: 'q3', key: '1' },
          { from: 'q2', to: 'q3', key: '3' }
        ]
      },
      target: {
        kind: 'machine',
        machine: createDFA({
          states: ['t0', 't1', 't2', 't3'],
          alphabet: ['1', '2', '3', '4'],
          start: 't0',
          accept: ['t3'],
          transitions: {
            t0: { 1: 't1' },
            t1: { 2: 't2' },
            t2: { 3: 't3' },
            t3: {}
          }
        })
      },
      judge: { method: 'exact' },
      examples: {
        open: ['123'],
        closed: ['12', '1234', '2', '11']
      },
      hints: [
        'Probá la llave 1-2-3 y mirá por dónde pasa.',
        'Cada celda recuerda cuántas teclas correctas van. ¿Alguna deja pasar una tecla de más?'
      ]
    },
    build: {
      goal: 'Abre solo con la secuencia 3 · 1 · 4.',
      intro: 'El banco cambió la combinación. Cableá un mecanismo nuevo.',
      cells: [
        { id: 'b0', label: 'Entrada', x: 140, y: 270, start: true },
        { id: 'b1', label: 'Celda 1', x: 340, y: 150 },
        { id: 'b2', label: 'Celda 2', x: 540, y: 270 },
        { id: 'b3', label: 'Cerrojo', x: 720, y: 150, accept: true }
      ],
      blueprint: { wires: [] },
      target: {
        kind: 'machine',
        machine: createDFA({
          states: ['t0', 't1', 't2', 't3'],
          alphabet: ['1', '2', '3', '4'],
          start: 't0',
          accept: ['t3'],
          transitions: {
            t0: { 3: 't1' },
            t1: { 1: 't2' },
            t2: { 4: 't3' },
            t3: {}
          }
        })
      },
      judge: { method: 'exact' },
      examples: {
        open: ['314'],
        closed: ['31', '3144', '3', '4']
      },
      hints: [
        'Una celda por tecla correcta.',
        'Un cable que falta manda la llave a la alarma.'
      ]
    }
  }
};
