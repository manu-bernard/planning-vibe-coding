// Planification : fonctions pures qui prennent un plan et renvoient un nouveau plan.
// Le temps est compté en jours ouvrés entiers ; la fin d'une tâche est exclusive.

export const MAX_NAME_LENGTH = 80;

// Espaces resserrés, longueur bornée ; un nom vide reste vide
export function cleanName(name) {
  return String(name).replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export function findTask(plan, id) {
  return plan.tasks.find((task) => task.id === id);
}

export function taskEnd(task) {
  return task.start + task.duration;
}

function topoOrder(plan) {
  const indegree = new Map(plan.tasks.map((task) => [task.id, 0]));
  const successors = new Map(plan.tasks.map((task) => [task.id, []]));
  for (const link of plan.links) {
    indegree.set(link.to, indegree.get(link.to) + 1);
    successors.get(link.from).push(link.to);
  }
  const queue = plan.tasks.filter((task) => indegree.get(task.id) === 0).map((task) => task.id);
  const order = [];
  while (queue.length > 0) {
    const id = queue.shift();
    order.push(id);
    for (const next of successors.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  return order;
}

// Vrai si les liens ne forment aucune boucle ; ils doivent viser des tâches existantes
export function isAcyclic(plan) {
  return topoOrder(plan).length === plan.tasks.length;
}

// Début au plus tôt : la fin du prédécesseur le plus tardif
export function earliestStart(plan, id) {
  return plan.links
    .filter((link) => link.to === id)
    .reduce((latest, link) => Math.max(latest, taskEnd(findTask(plan, link.from))), 0);
}

// Repousse chaque tâche juste ce qu'il faut ; aucune tâche n'est avancée
function propagate(plan) {
  for (const id of topoOrder(plan)) {
    const task = findTask(plan, id);
    task.start = Math.max(task.start, earliestStart(plan, id));
  }
  return plan;
}

export function moveTask(plan, id, wantedStart) {
  const next = structuredClone(plan);
  const task = findTask(next, id);
  const minimum = earliestStart(next, id);
  let blockerId = null;
  // minimum > 0 : la tâche a au moins un prédécesseur qui la retient
  if (minimum > 0 && wantedStart < minimum) {
    const blocking = next.links.find(
      (link) => link.to === id && taskEnd(findTask(next, link.from)) === minimum
    );
    blockerId = blocking.from;
  }
  task.start = Math.max(0, wantedStart, minimum);
  return { plan: propagate(next), blockerId };
}

export function resizeTask(plan, id, wantedDuration) {
  const next = structuredClone(plan);
  findTask(next, id).duration = Math.max(1, wantedDuration);
  return propagate(next);
}

// Marge d'une tâche : le retard qu'elle peut prendre sans repousser la fin du projet,
// en tenant compte des successeurs qu'elle repousserait
export function computeSchedule(plan) {
  const end = plan.tasks.reduce((latest, task) => Math.max(latest, taskEnd(task)), 0);
  const slack = {};
  for (const id of topoOrder(plan).reverse()) {
    const task = findTask(plan, id);
    let margin = end - taskEnd(task);
    for (const link of plan.links) {
      if (link.from !== id) continue;
      const successor = findTask(plan, link.to);
      margin = Math.min(margin, successor.start - taskEnd(task) + slack[link.to]);
    }
    slack[id] = margin;
  }
  const critical = {};
  for (const task of plan.tasks) critical[task.id] = slack[task.id] === 0;
  return { end, slack, critical };
}

export const NEW_TASK_DURATION = 3;

// Identifiant libre : t suivi du plus grand numéro existant plus un
function nextTaskId(plan) {
  const numbers = plan.tasks
    .map((task) => /^t(\d+)$/.exec(task.id))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return `t${Math.max(0, ...numbers) + 1}`;
}

// Renvoie { plan, id } ; la nouvelle tâche commence au jour 0, sans lien
export function addTask(plan, name) {
  const next = structuredClone(plan);
  const id = nextTaskId(next);
  next.tasks.push({ id, name: cleanName(name) || "Nouvelle tâche", start: 0, duration: NEW_TASK_DURATION });
  return { plan: next, id };
}

// Un nom vide après nettoyage laisse le plan inchangé
export function renameTask(plan, id, name) {
  const cleaned = cleanName(name);
  if (!cleaned) return plan;
  const next = structuredClone(plan);
  findTask(next, id).name = cleaned;
  return next;
}

// Retire la tâche et ses liens ; les autres tâches restent en place
export function removeTask(plan, id) {
  const next = structuredClone(plan);
  next.tasks = next.tasks.filter((task) => task.id !== id);
  next.links = next.links.filter((link) => link.from !== id && link.to !== id);
  return next;
}

// Tâches qu'un geste a repoussées, hors la tâche manipulée
export function pushedTasks(before, after, exceptId) {
  return after.tasks
    .filter((task) => {
      const previous = findTask(before, task.id);
      return task.id !== exceptId && previous !== undefined && task.start > previous.start;
    })
    .map((task) => task.id);
}
