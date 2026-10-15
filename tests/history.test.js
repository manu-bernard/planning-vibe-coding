import { test } from "node:test";
import assert from "node:assert/strict";
import { canUndo, createHistory, MAX_HISTORY, push, undo } from "../src/history.js";

test("une pile neuve n'a rien à annuler", () => {
  const history = createHistory();
  assert.equal(canUndo(history), false);
  assert.equal(undo(history), null);
});

test("on annule dans l'ordre inverse des gestes", () => {
  let history = createHistory();
  history = push(history, { step: 0 }, { step: 1 });
  history = push(history, { step: 1 }, { step: 2 });
  const first = undo(history);
  assert.deepEqual(first.state, { step: 1 });
  const second = undo(first.history);
  assert.deepEqual(second.state, { step: 0 });
  assert.equal(canUndo(second.history), false);
});

test("un geste sans effet n'ajoute rien", () => {
  const history = push(createHistory(), { step: 0 }, { step: 0 });
  assert.equal(canUndo(history), false);
});

test("la pile est bornée : le plus ancien état sort", () => {
  let history = createHistory();
  for (let step = 0; step < MAX_HISTORY + 5; step += 1) {
    history = push(history, { step }, { step: step + 1 });
  }
  assert.equal(history.past.length, MAX_HISTORY);
  assert.deepEqual(history.past[0], { step: 5 });
});

test("empiler ne modifie pas la pile reçue", () => {
  const history = createHistory();
  push(history, { step: 0 }, { step: 1 });
  assert.equal(history.past.length, 0);
});
