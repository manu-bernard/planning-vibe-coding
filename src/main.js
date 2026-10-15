// Point d'entrée : tient le plan courant, le transmet à la vue, l'enregistre dans l'historique
// et le sauvegarde

import { createGanttView } from "./gantt-view.js";
import { createDefaultPlan } from "./default-plan.js";
import { loadPlan, savePlan } from "./storage.js";
import { nextMonday, toIsoDate } from "./calendar.js";
import { canUndo, createHistory, push, undo } from "./history.js";

// L'accès à localStorage peut lui-même lever une erreur (site bloqué, navigation privée stricte)
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = browserStorage();
const createFreshPlan = () => createDefaultPlan(toIsoDate(nextMonday(new Date())));
const undoButton = document.getElementById("undo");
let plan = loadPlan(storage, createFreshPlan);
let history = createHistory();

const view = createGanttView(
  {
    names: document.getElementById("names"),
    timeline: document.getElementById("timeline"),
    message: document.getElementById("message"),
    endDate: document.getElementById("end-date"),
    endSummary: document.getElementById("end-summary"),
    addButton: document.getElementById("add"),
  },
  { onChange: applyPlan }
);

function show(next) {
  plan = next;
  if (!storage || !savePlan(storage, plan)) {
    view.say("Le navigateur refuse d'enregistrer : ce planning sera perdu à la fermeture de la page.");
  }
  undoButton.disabled = !canUndo(history);
  view.render(plan);
}

function applyPlan(next) {
  history = push(history, plan, next);
  show(next);
}

function undoLastChange() {
  const undone = undo(history);
  if (!undone) return;
  history = undone.history;
  view.say("Dernier geste annulé.");
  show(undone.state);
}

undoButton.addEventListener("click", undoLastChange);

// Le projet garde sa date de début ; le geste s'annule comme les autres
document.getElementById("reset").addEventListener("click", () => {
  view.say("Planning de départ rétabli. « Annuler » revient au planning d'avant.");
  applyPlan(createDefaultPlan(plan.startDate));
});

// Cmd+Z / Ctrl+Z annule, sauf dans un champ de saisie où il garde son rôle
document.addEventListener("keydown", (event) => {
  const typing = event.target instanceof HTMLInputElement;
  const isUndo = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "z";
  if (!isUndo || typing) return;
  event.preventDefault();
  undoLastChange();
});

// Enregistré dès l'ouverture : la date de début du projet reste celle de la première visite
show(plan);
