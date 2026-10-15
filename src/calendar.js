// Correspondance jour ouvré ↔ date réelle (lundi à vendredi), formats en français

const WORKDAYS_PER_WEEK = 5;
const SHORT_FORMAT = new Intl.DateTimeFormat("fr-CH", { day: "numeric", month: "short" });
const LONG_FORMAT = new Intl.DateTimeFormat("fr-CH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function localDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Le lundi qui suit une date (jamais la date elle-même)
export function nextMonday(date) {
  const day = localDay(date);
  day.setDate(day.getDate() + ((8 - day.getDay()) % 7 || 7));
  return day;
}

export function workdayToDate(startDate, index) {
  const day = localDay(startDate);
  const weeks = Math.floor(index / WORKDAYS_PER_WEEK);
  day.setDate(day.getDate() + weeks * 7 + (index % WORKDAYS_PER_WEEK));
  return day;
}

export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(text) {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatShort(date) {
  return SHORT_FORMAT.format(date);
}

export function formatLong(date) {
  return LONG_FORMAT.format(date);
}
