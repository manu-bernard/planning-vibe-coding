// Plan de départ : les sept étapes de la fiche d'Olivier, enchaînées

export const DEFAULT_STEPS = [
  { name: "Outils et périmètre technique", duration: 3 },
  { name: "Prototypage rapide", duration: 5 },
  { name: "Développement itératif encadré", duration: 10 },
  { name: "Tests et validation continue", duration: 4 },
  { name: "Gestion de version disciplinée", duration: 2 },
  { name: "Sécurisation et robustesse", duration: 3 },
  { name: "Documentation continue", duration: 3 },
];

// startDate : le lundi du jour ouvré 0, au format AAAA-MM-JJ
export function createDefaultPlan(startDate) {
  const tasks = [];
  const links = [];
  let start = 0;
  DEFAULT_STEPS.forEach((step, index) => {
    const id = `t${index + 1}`;
    tasks.push({ id, name: step.name, start, duration: step.duration });
    if (index > 0) links.push({ from: `t${index}`, to: id });
    start += step.duration;
  });
  return { version: 1, startDate, tasks, links };
}
