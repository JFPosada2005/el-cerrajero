/**
 * Contexto y tutorial por nivel para el contrato y la pista en papel.
 *
 * El panel de objetivo ya no existe: el contrato muestra la situación del
 * nivel + la regla (`puzzle.goal`) y la pista explica cómo interactuar.
 * A partir de N2, el tutorial cuenta SOLO lo nuevo respecto del nivel
 * anterior (sin repetir cómo conectar).
 *
 * Vocabulario de taller, español neutro, sin jerga académica.
 */

export const LEVEL_BRIEFS = {
  1: {
    context: 'El Banco del Llano te llamó de urgencia: cambiaron la combinación de la caja fuerte y el ladrón ya está en la puerta. Dejá la cerradura andando antes de que entre.',
    tutorial: 'Elegí un carrete (1, 2, 3 o 4) y tocá dos puntos del mecanismo para conectar el cable. La tijera corta el cable entero, la campana prueba la llave y la placa ENSAYO pide el ensayo del ladrón.',
  },
  2: {
    context: 'El ascensor del hotel quedó con las vueltas mezcladas y el ladrón ya sabe en qué piso bajar. Dejá el mecanismo marcando solo los pisos del cliente.',
    tutorial: 'Lo nuevo es el bucle: la cerradura también abre y cierra dando vueltas, y el indicador de pisos marca en qué vuelta vas. Los carretes, la tijera y la campana funcionan igual que en el banco.',
  },
  3: {
    context: 'En el museo hay sala de día y sala de noche con una sola alarma: de día entra todo el mundo, de noche nadie. El ladrón ya probó los dos turnos. Dejá cada turno abriendo solo su llave.',
    tutorial: 'Lo nuevo es el bifurcador, que abre dos caminos desde la misma celda, y el resorte, que tiende un cable sin gastar llave. Los carretes y la campana funcionan igual que antes.',
  },
  4: {
    context: 'La tramoya del teatro sube y baja el telón con contrapesos y el ladrón cuenta los pasos. Dejá la máquina obedeciendo solo el libreto del cliente.',
    tutorial: 'Lo nuevo es la pila, que guarda fichas: antes de tender cada cable elegí qué hay ARRIBA DE LA PILA (da igual, base o ficha) y la ACCIÓN (no tocar, cargar o soltar) en los selectores de la placa. La tijera y la campana funcionan igual que antes.',
  },
  5: {
    context: 'La bóveda del banco cuenta moneda con una cinta perforada y el ladrón ya copió la primera cuenta. Dejá el tambor sumando solo lo del cliente.',
    tutorial: 'Lo nuevo es la cinta bajo el cabezal: tocá una púa para elegir qué símbolo escribe, hacia dónde mueve y a qué sección sigue, y tocá Guardar para fijarla. Vaciar deja la púa en alarma. La bitácora anota cada marcha.',
  },
};
