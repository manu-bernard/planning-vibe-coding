// Lecture validée et écriture du plan dans le stockage du navigateur.
// Seule l'application écrit ce plan : une donnée non conforme est remplacée en entier.

import { cleanName, findTask, isAcyclic, taskEnd } from "./schedule.js";

export const STORAGE_KEY = "planning-vibe-coding";
const MAX_DAYS = 2000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isWholeNumber(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function parseTask(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 20) return null;
  if (typeof raw.name !== "string") return null;
  const name = cleanName(raw.name);
  if (!name) return null;
  if (!isWholeNumber(raw.start, 0, MAX_DAYS) || !isWholeNumber(raw.duration, 1, MAX_DAYS)) return null;
  return { id: raw.id, name, start: raw.start, duration: raw.duration };
}

// Renvoie le plan conforme au modèle, ou null
export function parsePlan(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || raw.version !== 1) return null;
  if (typeof raw.startDate !== "string" || !ISO_DATE.test(raw.startDate)) return null;
  if (!Array.isArray(raw.tasks) || !Array.isArray(raw.links)) return null;

  const tasks = raw.tasks.map(parseTask);
  if (tasks.includes(null)) return null;
  const ids = new Set(tasks.map((task) => task.id));
  if (ids.size !== tasks.length) return null;

  const links = [];
  const seen = new Set();
  for (const link of raw.links) {
    if (!link || !ids.has(link.from) || !ids.has(link.to) || link.from === link.to) return null;
    const key = `${link.from}>${link.to}`;
    if (seen.has(key)) return null;
    seen.add(key);
    links.push({ from: link.from, to: link.to });
  }

  const plan = { version: 1, startDate: raw.startDate, tasks, links };
  if (!isAcyclic(plan)) return null;
  const respected = links.every(
    (link) => findTask(plan, link.to).start >= taskEnd(findTask(plan, link.from))
  );
  return respected ? plan : null;
}

// Donnée absente, illisible ou invalide : le plan de départ
export function loadPlan(storage, createFallback) {
  let text = null;
  try {
    text = storage ? storage.getItem(STORAGE_KEY) : null;
  } catch {
    text = null;
  }
  return (text && parsePlan(text)) || createFallback();
}

// Renvoie false si le navigateur refuse l'écriture (stockage plein ou bloqué)
export function savePlan(storage, plan) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(plan));
    return true;
  } catch {
    return false;
  }
}
