const stack = { base: 'Z', chip: 'X', labels: { base: 'base', chip: 'ficha' } };
const judge = { method: 'bounded', exhaustiveLength: 10, maxN: 16, random: { seed: 4, count: 200, maxLength: 24 }, limits: { maxConfigs: 20000, maxStack: 64 } };
export const level4 = {
  id: 4,
  contract: '04',
  title: 'El teatro',
  client: 'Teatro Municipal',
  brief: 'El teatro tiene un montacargas: sube y baja el mismo número de veces. El ladrón probará cualquier combinación.',
  machine: 'pda',
  workspace: 'graph',
  keys: [
    { symbol: 'A', label: '▲ Subir', tone: 'gold' },
    { symbol: 'B', label: '▼ Bajar', tone: 'teal' }
  ],
  parts: ['wire', 'gear', 'fork', 'spring', 'stack'],
  newPart: 'stack',
  stack,
  thief: {
    trick: 'short',
    intro: 'El ladrón prueba combinaciones cortas, una por una.',
    giveUp: 'El ladrón probó todas las combinaciones y se fue con las manos vacías.',
    lines: {
      intruder: 'Marcas de ganzúa en {key}. El ladrón entró por ahí.',
      lockout: 'El cliente probó {key} en su propio teatro y la puerta no abrió.',
      empty: 'El ladrón abrió la puerta sin tocar ningún botón.'
    }
  },
  phases: {
    repair: {
      goal: 'Abre solo si sube y baja la misma cantidad de veces, sin bajar de más.',
      intro: 'El resorte del cerrojo quedó con la condición “da igual”. Ajustalo para que solo abra sobre la base.',
      cells: [
        { id: 'q0', label: 'Entrada', x: 140, y: 260, start: true },
        { id: 'q1', label: 'Trabajo', x: 420, y: 260 },
        { id: 'q2', label: 'Cerrojo', x: 700, y: 260, accept: true }
      ],
      stack,
      blueprint: {
        wires: [
          { from: 'q0', to: 'q1', key: 'A', stack: { top: 'any', action: 'push' } },
          { from: 'q1', to: 'q1', key: 'A', stack: { top: 'any', action: 'push' } },
          { from: 'q1', to: 'q1', key: 'B', stack: { top: 'chip', action: 'pop' } },
          { from: 'q1', to: 'q2', spring: true, stack: { top: 'any', action: 'keep' } }
        ]
      },
      target: { kind: 'language', id: 'balanced-turns' },
      judge,
      examples: {
        open: ['AB', 'AABB'],
        closed: ['', 'A', 'B', 'AAB', 'ABB']
      },
      hints: [
        'El resorte solo debe abrir cuando la pila volvió a la base.',
        'Si bajás sin haber subido, no hay ficha que sacar.'
      ]
    },
    build: {
      goal: 'Abre solo si primero subís varias veces y después bajás exactamente la misma cantidad.',
      intro: 'El teatro cambió el montacargas. Construí el mecanismo desde cero.',
      cells: [
        { id: 'q0', label: 'Entrada', x: 140, y: 260, start: true },
        { id: 'q1', label: 'Cargando', x: 310, y: 150 },
        { id: 'q2', label: 'Soltando', x: 550, y: 150 },
        { id: 'q3', label: 'Cerrojo', x: 720, y: 340, accept: true }
      ],
      stack,
      blueprint: { wires: [] },
      target: { kind: 'language', id: 'a-n-b-n' },
      judge,
      examples: {
        open: ['AB', 'AABB', 'AAABBB'],
        closed: ['', 'A', 'B', 'AAB', 'ABB', 'BA']
      },
      hints: [
        'Primero se carga la pila; después solo se descarga.',
        'El resorte final tiene que esperar a que la pila esté en la base.'
      ]
    }
  }
};
