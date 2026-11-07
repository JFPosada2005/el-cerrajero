import { createNFA } from '../core/nfa.js';
import { EPSILON } from '../core/symbols.js';
export const level3 = {
  id: 3,
  contract: '03',
  title: 'El museo',
  client: 'Museo del Llano',
  brief: 'El museo necesita dos cerraduras en una: una para la sala de día y otra para la de noche. El ladrón probará cualquier combinación.',
  machine: 'nfa',
  workspace: 'graph',
  keys: [
    { symbol: '1', label: '1', tone: 'gold' },
    { symbol: '2', label: '2', tone: 'teal' }
  ],
  parts: ['wire', 'gear', 'fork', 'spring'],
  newPart: 'fork',
  thief: {
    trick: 'short',
    intro: 'El ladrón prueba combinaciones cortas, una por una.',
    giveUp: 'El ladrón probó todas las combinaciones y se fue con las manos vacías.',
    lines: {
      intruder: 'Marcas de ganzúa en {key}. El ladrón entró por ahí.',
      lockout: 'El cliente probó {key} en su propio museo y la puerta no abrió.',
      empty: 'El ladrón empujó la puerta sin tocar ninguna llave y se abrió.'
    }
  },
  phases: {
    repair: {
      goal: 'Abre solo si la secuencia contiene 1 · 2 · 2.',
      intro: 'La celda de espera perdió su cable de la llave 1. Volvé a conectarlo.',
      cells: [
        { id: 'e', label: 'Entrada', x: 100, y: 260, start: true },
        { id: 'w', label: 'Espera', x: 280, y: 260 },
        { id: 'd1', label: 'Día 1', x: 460, y: 150 },
        { id: 'd2', label: 'Día 2', x: 620, y: 150 },
        { id: 'lock', label: 'Cerrojo', x: 740, y: 300, accept: true }
      ],
      blueprint: {
        wires: [
          { from: 'e', to: 'w', spring: true },
          { from: 'w', to: 'd1', key: '1' },
          { from: 'w', to: 'w', key: '2' },
          { from: 'd1', to: 'd2', key: '2' },
          { from: 'd2', to: 'lock', key: '2' },
          { from: 'lock', to: 'lock', key: '1' },
          { from: 'lock', to: 'lock', key: '2' }
        ]
      },
      target: {
        kind: 'machine',
        machine: createNFA({
          states: ['e', 'w', 'd1', 'd2', 'lock'],
          alphabet: ['1', '2'],
          start: 'e',
          accept: ['lock'],
          transitions: {
            e: { [EPSILON]: ['w'] },
            w: { 1: ['w', 'd1'], 2: ['w'] },
            d1: { 2: ['d2'] },
            d2: { 2: ['lock'] },
            lock: { 1: ['lock'], 2: ['lock'] }
          }
        })
      },
      judge: { method: 'exact' },
      examples: {
        open: ['122', '1122', '1221'],
        closed: ['', '12', '22', '1211']
      },
      hints: [
        'El bifurcador abre dos caminos con la misma llave.',
        'La celda de espera tiene que poder seguir leyendo mientras uno de los caminos avanza.'
      ]
    },
    build: {
      goal: 'Abre solo si la secuencia contiene 1 · 2 · 2 o 2 · 1 · 1.',
      intro: 'El museo abrió una sala de noche. Construí el segundo camino sin romper el de día.',
      cells: [
        { id: 'e', label: 'Entrada', x: 70, y: 260, start: true },
        { id: 'dw', label: 'Día', x: 220, y: 140 },
        { id: 'd1', label: 'Día 1', x: 380, y: 80 },
        { id: 'd2', label: 'Día 2', x: 540, y: 80 },
        { id: 'nw', label: 'Noche', x: 220, y: 380 },
        { id: 'n1', label: 'Noche 1', x: 380, y: 440 },
        { id: 'n2', label: 'Noche 2', x: 540, y: 440 },
        { id: 'lock', label: 'Cerrojo', x: 720, y: 260, accept: true }
      ],
      blueprint: {
        wires: [
          { from: 'e', to: 'dw', spring: true },
          { from: 'dw', to: 'dw', key: '1' },
          { from: 'dw', to: 'd1', key: '1' },
          { from: 'dw', to: 'dw', key: '2' },
          { from: 'd1', to: 'd2', key: '2' },
          { from: 'd2', to: 'lock', key: '2' },
          { from: 'lock', to: 'lock', key: '1' },
          { from: 'lock', to: 'lock', key: '2' }
        ]
      },
      target: {
        kind: 'machine',
        machine: createNFA({
          states: ['e', 'dw', 'd1', 'd2', 'nw', 'n1', 'n2', 'lock'],
          alphabet: ['1', '2'],
          start: 'e',
          accept: ['lock'],
          transitions: {
            e: { [EPSILON]: ['dw', 'nw'] },
            dw: { 1: ['dw', 'd1'], 2: ['dw'] },
            d1: { 2: ['d2'] },
            d2: { 2: ['lock'] },
            nw: { 1: ['nw'], 2: ['nw', 'n1'] },
            n1: { 1: ['n2'] },
            n2: { 1: ['lock'] },
            lock: { 1: ['lock'], 2: ['lock'] }
          }
        })
      },
      judge: { method: 'exact' },
      examples: {
        open: ['122', '211', '1122', '2211'],
        closed: ['', '12', '21', '112', '221']
      },
      hints: [
        'El resorte de entrada tiene que abrir los dos caminos a la vez.',
        'La rama de noche se dispara con 2 y se confirma con dos 1 seguidos.'
      ]
    }
  }
};
