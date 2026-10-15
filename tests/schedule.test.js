import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeSchedule,
  earliestStart,
  findTask,
  moveTask,
  pushedTasks,
  resizeTask,
} from "../src/schedule.js";
import { createDefaultPlan } from "../src/default-plan.js";

const START = "2026-10-19";

function starts(plan) {
  return plan.tasks.map((task) => task.start);
}

test("au départ, la fin est au jour 30 et les sept tâches sont critiques", () => {
  const schedule = computeSchedule(createDefaultPlan(START));
  assert.equal(schedule.end, 30);
  assert.ok(Object.values(schedule.critical).every(Boolean));
});

test("allonger une tâche repousse ses successeurs juste ce qu'il faut", () => {
  const plan = resizeTask(createDefaultPlan(START), "t3", 13);
  assert.deepEqual(starts(plan), [0, 3, 8, 21, 25, 27, 30]);
  assert.equal(computeSchedule(plan).end, 33);
});

test("raccourcir une tâche laisse ses successeurs en place et crée une marge", () => {
  const plan = resizeTask(createDefaultPlan(START), "t3", 7);
  assert.deepEqual(starts(plan), [0, 3, 8, 18, 22, 24, 27]);
  const schedule = computeSchedule(plan);
  assert.equal(schedule.end, 30);
  assert.equal(schedule.slack.t3, 3);
  assert.equal(schedule.critical.t3, false);
  assert.equal(schedule.critical.t2, false);
});

test("avancer une tâche laisse ses successeurs en place", () => {
  const base = resizeTask(createDefaultPlan(START), "t2", 2);
  const { plan } = moveTask(base, "t3", 5);
  assert.equal(findTask(plan, "t3").start, 5);
  assert.equal(findTask(plan, "t4").start, 18);
});

test("déplacer une tâche plus tard repousse la chaîne et le signale", () => {
  const base = createDefaultPlan(START);
  const { plan, blockerId } = moveTask(base, "t4", 20);
  assert.equal(blockerId, null);
  assert.deepEqual(starts(plan), [0, 3, 8, 20, 24, 26, 29]);
  assert.deepEqual(pushedTasks(base, plan, "t4"), ["t5", "t6", "t7"]);
});

test("une tâche tirée avant la fin de son prédécesseur s'arrête dessus et le nomme", () => {
  const { plan, blockerId } = moveTask(createDefaultPlan(START), "t4", 2);
  assert.equal(findTask(plan, "t4").start, 18);
  assert.equal(blockerId, "t3");
});

test("avec deux prédécesseurs, la tâche bute sur celui qui finit le plus tard", () => {
  const base = createDefaultPlan(START);
  base.links.push({ from: "t1", to: "t4" });
  assert.equal(earliestStart(base, "t4"), 18);
  assert.equal(moveTask(base, "t4", 0).blockerId, "t3");
});

test("un début ne descend pas sous le jour 0, une durée pas sous un jour", () => {
  const base = createDefaultPlan(START);
  assert.equal(findTask(moveTask(base, "t1", -4).plan, "t1").start, 0);
  assert.equal(moveTask(base, "t1", -4).blockerId, null);
  assert.equal(findTask(resizeTask(base, "t1", 0), "t1").duration, 1);
});

test("une tâche en parallèle a de la marge et n'est pas critique", () => {
  const base = createDefaultPlan(START);
  base.links = base.links.filter((link) => !(link.from === "t3" && link.to === "t4"));
  base.links.push({ from: "t2", to: "t4" });
  const { plan } = moveTask(base, "t4", 0);
  const schedule = computeSchedule(plan);
  assert.equal(findTask(plan, "t4").start, 8);
  assert.equal(schedule.slack.t4, 10);
  assert.equal(schedule.critical.t4, false);
  assert.equal(schedule.critical.t5, true);
});

test("la marge tient compte des successeurs qu'un retard repousserait", () => {
  const base = createDefaultPlan(START);
  base.tasks.push({ id: "t8", name: "Maquettes", start: 3, duration: 2 });
  base.tasks.push({ id: "t9", name: "Revue", start: 10, duration: 2 });
  base.links.push({ from: "t1", to: "t8" }, { from: "t8", to: "t9" });
  const schedule = computeSchedule(base);
  assert.equal(schedule.slack.t9, 18);
  assert.equal(schedule.slack.t8, 23);
});

test("un plan vide se termine au jour 0", () => {
  assert.equal(computeSchedule({ version: 1, startDate: START, tasks: [], links: [] }).end, 0);
});

test("les fonctions ne modifient jamais le plan reçu", () => {
  const base = createDefaultPlan(START);
  const copy = structuredClone(base);
  moveTask(base, "t4", 25);
  resizeTask(base, "t2", 9);
  computeSchedule(base);
  assert.deepEqual(base, copy);
});
