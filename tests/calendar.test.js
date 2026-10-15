import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatLong,
  formatShort,
  fromIsoDate,
  nextMonday,
  toIsoDate,
  workdayToDate,
} from "../src/calendar.js";

test("le lundi suivant un jeudi est le lundi d'après", () => {
  assert.equal(toIsoDate(nextMonday(new Date(2026, 9, 15))), "2026-10-19");
});

test("le lundi suivant un lundi est le lundi de la semaine d'après", () => {
  assert.equal(toIsoDate(nextMonday(new Date(2026, 9, 19))), "2026-10-26");
});

test("le lundi suivant un dimanche est le lendemain", () => {
  assert.equal(toIsoDate(nextMonday(new Date(2026, 9, 18))), "2026-10-19");
});

test("les jours ouvrés sautent les week-ends", () => {
  const monday = fromIsoDate("2026-10-19");
  assert.equal(toIsoDate(workdayToDate(monday, 0)), "2026-10-19");
  assert.equal(toIsoDate(workdayToDate(monday, 4)), "2026-10-23");
  assert.equal(toIsoDate(workdayToDate(monday, 5)), "2026-10-26");
});

test("le jour ouvré 29 du planning de départ tombe le vendredi 27 novembre 2026", () => {
  assert.equal(toIsoDate(workdayToDate(fromIsoDate("2026-10-19"), 29)), "2026-11-27");
});

test("une date passe en texte et revient à l'identique", () => {
  assert.equal(toIsoDate(fromIsoDate("2026-03-09")), "2026-03-09");
});

test("les dates s'affichent en français", () => {
  const date = fromIsoDate("2026-11-27");
  assert.match(formatLong(date), /vendredi.*27 novembre 2026/);
  assert.match(formatShort(date), /27 nov/);
});
