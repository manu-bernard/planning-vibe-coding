import { test } from "node:test";
import assert from "node:assert/strict";
import { createDefaultPlan, DEFAULT_STEPS } from "../src/default-plan.js";

test("le plan de départ contient les sept étapes enchaînées", () => {
  const plan = createDefaultPlan("2026-10-19");
  assert.equal(plan.version, 1);
  assert.equal(plan.startDate, "2026-10-19");
  assert.deepEqual(plan.tasks.map((task) => task.name), DEFAULT_STEPS.map((step) => step.name));
  assert.deepEqual(plan.tasks.map((task) => task.start), [0, 3, 8, 18, 22, 24, 27]);
  assert.equal(plan.links.length, 6);
  plan.links.forEach((link, index) => {
    assert.deepEqual(link, { from: `t${index + 1}`, to: `t${index + 2}` });
  });
});

test("le plan de départ est identique à chaque appel et indépendant du précédent", () => {
  const first = createDefaultPlan("2026-10-19");
  first.tasks[0].duration = 9;
  first.links.pop();
  const second = createDefaultPlan("2026-10-19");
  assert.equal(second.tasks[0].duration, 3);
  assert.equal(second.links.length, 6);
  assert.deepEqual(second, createDefaultPlan("2026-10-19"));
});
