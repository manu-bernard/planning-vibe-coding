// Point d'entrée : tient le plan courant, le transmet à la vue et le sauvegarde

import { createGanttView } from "./gantt-view.js";
import { createDefaultPlan } from "./default-plan.js";
import { loadPlan, savePlan } from "./storage.js";
import { nextMonday, toIsoDate } from "./calendar.js";

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
let plan = loadPlan(storage, createFreshPlan);

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

function applyPlan(next) {
  plan = next;
  if (!storage || !savePlan(storage, plan)) {
    view.say("Le navigateur refuse d'enregistrer : ce planning sera perdu à la fermeture de la page.");
  }
  view.render(plan);
}

// Enregistré dès l'ouverture : la date de début du projet reste celle de la première visite
savePlan(storage, plan);
view.render(plan);
