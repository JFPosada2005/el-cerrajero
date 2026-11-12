const incrementJudge = { method: 'bounded', inputs: { maxBits: 6, stress: 'ones' }, limits: { maxSteps: 5000 } };
const sumJudge = { method: 'bounded', inputs: { maxBits: 4, stress: 'carry-chains' }, limits: { maxSteps: 5000 } };
export const level5 = {
  id: 5,
  contract: '05',
  title: 'El banco central',
  client: 'Banco Central',
  brief: 'El banco central guarda la cuenta en una cinta. El ladrón intentará depositar de más.',
  machine: 'tm',
  workspace: 'drum',
  keys: [],
  parts: ['drum'],
  newPart: 'drum',
  thief: {
    trick: 'master',
    intro: 'El ladrón prueba depósitos cada vez más largos.',
    giveUp: 'El ladrón probó todas las combinaciones y se fue con las manos vacías.',
    lines: {
      intruder: 'El ladrón abrió la caja con {key}.',
      lockout: 'Con {key} ni el cliente pudo abrir.',
      empty: 'El ladrón abrió sin tocar la cinta.',
      jam: 'Con {key} el mecanismo se trabó y el contador no terminó.',
      alarm: 'Con {key} el mecanismo se detuvo en la alarma.',
      'wrong-output': 'El ladrón depositó {key} y el contador marcó {actual} en vez de {expected}.'
    }
  },
  phases: {
    repair: {
      goal: 'Abre solo si el contador suma 1 al número de la cinta.',
      intro: 'El tambor de control quedó con una púa mal escrita: al llegar al 1, el contador marca 11 en vez de 10.',
      sections: [
        { id: 'seek', label: 'Buscar el final', start: true },
        { id: 'carry', label: 'Llevar' },
        { id: 'done', label: 'Listo', accept: true }
      ],
      tape: { symbols: ['0', '1', '_'], blank: '_', labels: { _: '' } },
      blueprint: {
        rules: {
          seek: { 0: { write: '0', move: 'R', to: 'seek' }, 1: { write: '1', move: 'R', to: 'seek' }, _: { write: '_', move: 'L', to: 'carry' } },
          carry: { 1: { write: '1', move: 'L', to: 'carry' }, 0: { write: '1', move: 'R', to: 'done' }, _: { write: '1', move: 'R', to: 'done' } },
          done: {}
        }
      },
      target: { kind: 'function', id: 'binary-increment' },
      judge: incrementJudge,
      examples: { runs: [{ input: '1', output: '10' }, { input: '11', output: '100' }] },
      hints: ['La púa de la sección Llevar escribe un 1 donde debería escribir un 0.', 'Probá con la cinta 1: el contador debe mostrar 10.']
    },
    build: {
      goal: 'Abre solo si el contador suma los dos números separados por el signo +.',
      intro: 'El banco cambió el encargo: sumá los dos números. El contador de +1 ya está puesto; agregá la resta y la limpieza.',
      sections: [
        { id: 'seek', label: 'Buscar el final', start: true },
        { id: 'dec', label: 'Restar' },
        { id: 'toPlus', label: 'Volver al signo' },
        { id: 'carry', label: 'Llevar' },
        { id: 'clean', label: 'Limpiar' },
        { id: 'done', label: 'Listo', accept: true }
      ],
      tape: { symbols: ['0', '1', '+', '_'], blank: '_', labels: { _: '' } },
      blueprint: {
        rules: {
          seek: { 0: { write: '0', move: 'R', to: 'seek' }, 1: { write: '1', move: 'R', to: 'seek' }, _: { write: '_', move: 'L', to: 'carry' } },
          dec: {},
          toPlus: {},
          carry: { 1: { write: '0', move: 'L', to: 'carry' }, 0: { write: '1', move: 'R', to: 'done' }, _: { write: '1', move: 'R', to: 'done' } },
          clean: {},
          done: {}
        }
      },
      target: { kind: 'function', id: 'binary-sum' },
      judge: sumJudge,
      examples: { runs: [{ input: '101+11', output: '1000' }, { input: '1+1', output: '10' }] },
      hints: ['La sección Restar baja el segundo número; Volver al signo te devuelve al +.', 'La sección Limpiar borra el + y el segundo número; el resultado queda en el primero.']
    }
  }
};
