import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPlan, parsePlan, savePlan, STORAGE_KEY } from "../src/storage.js";
import { createDefaultPlan } from "../src/default-plan.js";

const START = "2026-10-19";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    data,
  };
}

function withChange(change) {
  const plan = createDefaultPlan(START);
  change(plan);
  return JSON.stringify(plan);
}

const fallback = () => createDefaultPlan("2030-01-07");

test("un plan enregistré est relu à l'identique", () => {
  const storage = memoryStorage();
  const plan = createDefaultPlan(START);
  plan.tasks[3].start = 20;
  plan.tasks[4].start = 24;
  plan.tasks[5].start = 26;
  plan.tasks[6].start = 29;
  assert.equal(savePlan(storage, plan), true);
  assert.deepEqual(loadPlan(storage, fallback), plan);
});

test("sans sauvegarde, on charge le plan de départ", () => {
  assert.deepEqual(loadPlan(memoryStorage(), fallback), fallback());
});

test("un stockage inaccessible donne le plan de départ", () => {
  const blocked = {
    getItem() {
      throw new Error("SecurityError");
    },
  };
  assert.deepEqual(loadPlan(blocked, fallback), fallback());
  assert.deepEqual(loadPlan(null, fallback), fallback());
});

test("une écriture refusée renvoie false", () => {
  const full = {
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  assert.equal(savePlan(full, createDefaultPlan(START)), false);
});

test("un texte illisible donne le plan de départ", () => {
  const storage = memoryStorage({ [STORAGE_KEY]: "{pas du json" });
  assert.deepEqual(loadPlan(storage, fallback), fallback());
});

const invalidCases = {
  "version inconnue": (plan) => { plan.version = 2; },
  "date mal formée": (plan) => { plan.startDate = "19.10.2026"; },
  "tâches absentes": (plan) => { delete plan.tasks; },
  "durée nulle": (plan) => { plan.tasks[0].duration = 0; },
  "début négatif": (plan) => { plan.tasks[0].start = -1; },
  "début non entier": (plan) => { plan.tasks[0].start = 1.5; },
  "nom vide": (plan) => { plan.tasks[0].name = "   "; },
  "identifiant en double": (plan) => { plan.tasks[1].id = "t1"; },
  "lien vers une tâche absente": (plan) => { plan.links.push({ from: "t7", to: "t99" }); },
  "lien vers soi-même": (plan) => { plan.links.push({ from: "t2", to: "t2" }); },
  "lien en double": (plan) => { plan.links.push({ from: "t1", to: "t2" }); },
  "boucle": (plan) => { plan.links.push({ from: "t7", to: "t1" }); },
  "lien non respecté": (plan) => { plan.tasks[3].start = 2; },
};

for (const [label, change] of Object.entries(invalidCases)) {
  test(`plan refusé : ${label}`, () => {
    assert.equal(parsePlan(withChange(change)), null);
  });
}

test("les noms sont nettoyés et limités à 80 caractères", () => {
  const plan = parsePlan(withChange((p) => { p.tasks[0].name = `  Outils   ${"x".repeat(100)} `; }));
  assert.equal(plan.tasks[0].name.length, 80);
  assert.ok(plan.tasks[0].name.startsWith("Outils x"));
});

test("les champs inconnus sont écartés", () => {
  const plan = parsePlan(withChange((p) => {
    p.extra = "ignoré";
    p.tasks[0].color = "red";
    p.links[0].note = "ignoré";
  }));
  assert.deepEqual(plan, createDefaultPlan(START));
});
