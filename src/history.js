// Pile d'annulation : les états passés, du plus ancien au plus récent

export const MAX_HISTORY = 100;

export function createHistory() {
  return { past: [] };
}

// Empile l'état précédent s'il diffère du nouveau ; au-delà de la borne, le plus ancien sort
export function push(history, previous, next) {
  if (JSON.stringify(previous) === JSON.stringify(next)) return history;
  return { past: [...history.past, previous].slice(-MAX_HISTORY) };
}

export function canUndo(history) {
  return history.past.length > 0;
}

// Renvoie { state, history } ou null s'il n'y a rien à annuler
export function undo(history) {
  if (!canUndo(history)) return null;
  return { state: history.past.at(-1), history: { past: history.past.slice(0, -1) } };
}
