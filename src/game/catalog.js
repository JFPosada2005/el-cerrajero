export const LEVELS = [
  { id: 1, contract: '01', title: 'La caja de seguridad', client: 'Banco del Llano', boss: false, playable: true },
  { id: 2, contract: '02', title: 'El ascensor', client: 'Hotel Mirador', boss: false, playable: false },
  { id: 3, contract: '03', title: 'El museo', client: 'Museo del Llano', boss: false, playable: false },
  { id: 4, contract: '04', title: 'El teatro', client: 'Teatro Municipal', boss: false, playable: false },
  { id: 5, contract: '05', title: 'El banco central', client: 'Banco Central', boss: true, playable: false },
];

export function levelStatus(level, progress) {
  const completed = Array.isArray(progress?.completed) ? progress.completed : [];
  if (completed.includes(level.id)) {
    return 'completed';
  }
  if (level.id === 1) {
    return 'available';
  }
  if (completed.includes(level.id - 1)) {
    return 'available';
  }
  return 'locked';
}
