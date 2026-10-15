// Rendu de la frise et gestes à la souris.
// La vue ne détient que le geste en cours ; chaque nouveau plan part vers onChange.

import {
  addTask,
  computeSchedule,
  findTask,
  linkTasks,
  MAX_NAME_LENGTH,
  moveTask,
  pushedTasks,
  removeTask,
  renameTask,
  resizeTask,
  taskEnd,
  unlinkTasks,
} from "./schedule.js";
import { formatLong, formatShort, fromIsoDate, workdayToDate } from "./calendar.js";

const DAY_WIDTH = 30;
const ROW_HEIGHT = 46;
const HEADER_HEIGHT = 48;
const BAR_HEIGHT = 26;
const FOOTER_HEIGHT = 28;
const DAY_LETTERS = ["L", "M", "M", "J", "V"];
const SVG_NS = "http://www.w3.org/2000/svg";
const HINT =
  "Glissez une barre pour la déplacer, son bord droit pour l'étirer, son rond pour la relier à une autre tâche. " +
  "Un clic sur un lien le retire, un clic sur un nom le renomme.";
const LINK_ERRORS = {
  cycle: "Lien refusé : il créerait une boucle, le planning deviendrait impossible à calculer.",
  exists: "Ces deux tâches sont déjà reliées.",
};

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createSvgElement(tag, attributes) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function plural(count, word) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

function linkPath(x1, y1, x2, y2) {
  const bend = Math.max(14, Math.abs(x2 - x1) / 2);
  return `M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`;
}

function rowCenter(row) {
  return HEADER_HEIGHT + row * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function placeBox(node, left, top, width, height) {
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
  if (width !== undefined) node.style.width = `${width}px`;
  if (height !== undefined) node.style.height = `${height}px`;
}

export function createGanttView(elements, { onChange }) {
  let plan = null;
  let gesture = null;
  let editingId = null;

  function nameOf(view, id) {
    const task = findTask(view, id);
    return task ? `« ${task.name} »` : "";
  }

  function say(text) {
    elements.message.textContent = text || HINT;
    elements.message.classList.toggle("hint", !text);
  }

  function describeEffect(before, after, movedId, blockerId) {
    const parts = [];
    if (blockerId) parts.push(`${nameOf(after, movedId)} bute sur la fin de ${nameOf(after, blockerId)}.`);
    const pushed = pushedTasks(before, after, movedId);
    if (pushed.length > 0) parts.push(`Repoussées : ${pushed.map((id) => nameOf(after, id)).join(", ")}.`);
    const oldEnd = computeSchedule(before).end;
    const newEnd = computeSchedule(after).end;
    if (newEnd !== oldEnd) parts.push(`La fin du projet passe de ${plural(oldEnd, "jour")} à ${plural(newEnd, "jour")}.`);
    return parts.join(" ");
  }

  function drawSummary(view, schedule) {
    if (schedule.end === 0) {
      elements.endDate.textContent = "aucune tâche";
      elements.endSummary.textContent = "";
      return;
    }
    const startDate = fromIsoDate(view.startDate);
    elements.endDate.textContent = formatLong(workdayToDate(startDate, schedule.end - 1));
    const criticalCount = view.tasks.filter((task) => schedule.critical[task.id]).length;
    const days = schedule.end > 1 ? "jours ouvrés" : "jour ouvré";
    elements.endSummary.textContent =
      `${schedule.end} ${days} · ${criticalCount} sur ${plural(view.tasks.length, "tâche")} critiques`;
  }

  function drawNames(view) {
    const head = createElement("div", "names-head");
    head.style.height = `${HEADER_HEIGHT}px`;
    head.append(createElement("span", "label", "Tâche"));
    let input = null;
    const rows = view.tasks.map((task) => {
      const row = createElement("div", "name-row");
      row.style.height = `${ROW_HEIGHT}px`;
      if (task.id === editingId) {
        input = createNameInput(task);
        row.append(input);
      } else {
        row.append(createNameButton(task));
      }
      row.append(createDeleteButton(task));
      return row;
    });
    elements.names.replaceChildren(head, ...rows);
    if (input) {
      input.focus();
      input.select();
    }
  }

  function createNameButton(task) {
    const button = createElement("button", "name", task.name);
    button.type = "button";
    button.title = "Renommer";
    button.addEventListener("click", () => {
      editingId = task.id;
      draw(plan);
    });
    return button;
  }

  function createNameInput(task) {
    const input = createElement("input", "name-input");
    input.value = task.name;
    input.maxLength = MAX_NAME_LENGTH;
    input.setAttribute("aria-label", "Nom de la tâche");
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") finishRename(task.id, input.value);
      if (event.key === "Escape") finishRename(task.id, null);
    });
    // Un champ retiré par un nouveau rendu ne valide rien
    input.addEventListener("blur", () => {
      if (input.isConnected) finishRename(task.id, input.value);
    });
    return input;
  }

  function createDeleteButton(task) {
    const button = createElement("button", "delete", "×");
    button.type = "button";
    button.title = "Supprimer";
    button.setAttribute("aria-label", `Supprimer « ${task.name} »`);
    button.addEventListener("click", () => {
      if (editingId === task.id) editingId = null;
      say(`${nameOf(plan, task.id)} supprimée.`);
      onChange(removeTask(plan, task.id));
    });
    return button;
  }

  function finishRename(id, value) {
    if (editingId !== id) return;
    editingId = null;
    const next = value === null ? plan : renameTask(plan, id, value);
    if (next === plan) draw(plan);
    else onChange(next);
  }

  function drawHeader(view, weeks) {
    const startDate = fromIsoDate(view.startDate);
    const nodes = [];
    for (let week = 0; week < weeks; week += 1) {
      const label = createElement("div", "week", formatShort(workdayToDate(startDate, week * 5)));
      placeBox(label, week * 5 * DAY_WIDTH, 8, 5 * DAY_WIDTH);
      nodes.push(label);
    }
    for (let day = 0; day < weeks * 5; day += 1) {
      const letter = createElement("div", "day", DAY_LETTERS[day % 5]);
      placeBox(letter, day * DAY_WIDTH, 30, DAY_WIDTH);
      nodes.push(letter);
    }
    return nodes;
  }

  function drawRows(view) {
    const rows = createElement("div", "rows");
    rows.style.top = `${HEADER_HEIGHT}px`;
    rows.style.height = `${view.tasks.length * ROW_HEIGHT}px`;
    rows.style.backgroundSize = `${5 * DAY_WIDTH}px 100%, ${DAY_WIDTH}px 100%`;
    view.tasks.forEach((task, index) => {
      const line = createElement("div", "row-line");
      line.style.top = `${(index + 1) * ROW_HEIGHT - 1}px`;
      rows.append(line);
    });
    return rows;
  }

  function drawLinks(view, rowOf, width, height, info) {
    const svg = createSvgElement("svg", { class: "links", width, height });
    for (const link of view.links) {
      const from = findTask(view, link.from);
      const to = findTask(view, link.to);
      const isBlocker = info.blocker && info.blocker.from === link.from && info.blocker.to === link.to;
      const path = linkPath(
        taskEnd(from) * DAY_WIDTH - 2, rowCenter(rowOf.get(from.id)),
        to.start * DAY_WIDTH + 2, rowCenter(rowOf.get(to.id))
      );
      // Tracé large et invisible pour viser le lien facilement ; il précède le lien visible
      const hit = createSvgElement("path", { class: "link-hit", d: path });
      const title = createSvgElement("title", {});
      title.textContent = `Retirer le lien ${from.name} → ${to.name}`;
      hit.append(title);
      hit.addEventListener("click", () => {
        say(`Lien retiré : ${nameOf(plan, link.to)} n'attend plus ${nameOf(plan, link.from)}.`);
        onChange(unlinkTasks(plan, link.from, link.to));
      });
      svg.append(hit, createSvgElement("path", { class: isBlocker ? "link blocker" : "link", d: path }));
    }
    if (info.linking) {
      const source = findTask(view, info.linking.fromId);
      const path = linkPath(
        taskEnd(source) * DAY_WIDTH + 10, rowCenter(rowOf.get(source.id)),
        info.linking.x, info.linking.y
      );
      svg.append(createSvgElement("path", { class: "link pending", d: path }));
    }
    return svg;
  }

  function drawSlack(task, row, slack) {
    const top = HEADER_HEIGHT + row * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
    const bar = createElement("div", "slack");
    placeBox(bar, taskEnd(task) * DAY_WIDTH, top + BAR_HEIGHT / 2 - 4, slack * DAY_WIDTH);
    const label = createElement("div", "slack-label", `marge ${slack} j`);
    placeBox(label, taskEnd(task) * DAY_WIDTH + 22, top + BAR_HEIGHT / 2 + 7);
    return [bar, label];
  }

  function drawBar(task, row, schedule, info) {
    const classes = ["bar"];
    if (schedule.critical[task.id]) classes.push("critical");
    if (info.activeId === task.id) classes.push("active");
    if (info.pushed && info.pushed.includes(task.id)) classes.push("pushed");
    if (info.targetId === task.id) classes.push("target");
    const bar = createElement("div", classes.join(" "));
    bar.dataset.id = task.id;
    bar.title = task.name;
    const top = HEADER_HEIGHT + row * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
    placeBox(bar, task.start * DAY_WIDTH + 2, top, task.duration * DAY_WIDTH - 4, BAR_HEIGHT);
    bar.append(createElement("span", "duration", `${task.duration} j`));
    const handle = createElement("div", "handle");
    handle.title = "Étirer pour changer la durée";
    const dot = createElement("div", "dot");
    dot.title = "Glisser vers une autre tâche pour les relier";
    bar.append(handle, dot);
    return bar;
  }

  function draw(view, info = {}) {
    const schedule = computeSchedule(view);
    const weeks = Math.max(6, Math.ceil((schedule.end + 6) / 5));
    const width = weeks * 5 * DAY_WIDTH + 24;
    const rowsHeight = HEADER_HEIGHT + view.tasks.length * ROW_HEIGHT;
    const rowOf = new Map(view.tasks.map((task, index) => [task.id, index]));

    drawSummary(view, schedule);
    drawNames(view);

    const nodes = [...drawHeader(view, weeks), drawRows(view)];
    if (schedule.end > 0) {
      const endLine = createElement("div", "end-line");
      endLine.style.left = `${schedule.end * DAY_WIDTH - 1}px`;
      nodes.push(endLine);
    }
    nodes.push(drawLinks(view, rowOf, width, rowsHeight, info));
    view.tasks.forEach((task, row) => {
      const slack = schedule.slack[task.id];
      if (slack > 0) nodes.push(...drawSlack(task, row, slack));
      nodes.push(drawBar(task, row, schedule, info));
    });
    if (schedule.end > 0) {
      const tag = createElement("div", "end-tag", "Fin");
      placeBox(tag, schedule.end * DAY_WIDTH + 4, rowsHeight + 6);
      nodes.push(tag);
    }
    elements.timeline.style.width = `${width}px`;
    elements.timeline.style.height = `${rowsHeight + FOOTER_HEIGHT}px`;
    elements.timeline.replaceChildren(...nodes);
  }

  function barAt(x, y) {
    const target = document.elementFromPoint(x, y);
    const bar = target ? target.closest(".bar") : null;
    return bar ? bar.dataset.id : null;
  }

  function onLinkMove(event) {
    const box = elements.timeline.getBoundingClientRect();
    const hovered = barAt(event.clientX, event.clientY);
    const targetId = hovered && hovered !== gesture.id ? hovered : null;
    draw(plan, {
      linking: { fromId: gesture.id, x: event.clientX - box.left, y: event.clientY - box.top },
      targetId,
    });
    say(targetId
      ? `Relâchez pour que ${nameOf(plan, targetId)} attende la fin de ${nameOf(plan, gesture.id)}.`
      : `Glissez jusqu'à la tâche qui doit attendre la fin de ${nameOf(plan, gesture.id)}.`);
  }

  function finishLink(fromId, event) {
    const targetId = barAt(event.clientX, event.clientY);
    if (!targetId || targetId === fromId) {
      say("");
      draw(plan);
      return;
    }
    const linked = linkTasks(plan, fromId, targetId);
    if (linked.error) {
      say(LINK_ERRORS[linked.error]);
      draw(plan);
      return;
    }
    const effect = describeEffect(plan, linked.plan, fromId, null);
    say(`Lien ajouté : ${nameOf(plan, targetId)} attend la fin de ${nameOf(plan, fromId)}. ${effect}`);
    onChange(linked.plan);
  }

  function onPointerMove(event) {
    if (gesture.kind === "link") {
      onLinkMove(event);
      return;
    }
    const days = Math.round((event.clientX - gesture.startX) / DAY_WIDTH);
    const task = findTask(gesture.base, gesture.id);
    if (gesture.kind === "move") {
      const moved = moveTask(gesture.base, gesture.id, task.start + days);
      gesture.result = moved.plan;
      gesture.blockerId = moved.blockerId;
    } else {
      gesture.result = resizeTask(gesture.base, gesture.id, task.duration + days);
    }
    draw(gesture.result, {
      activeId: gesture.id,
      pushed: pushedTasks(gesture.base, gesture.result, gesture.id),
      blocker: gesture.blockerId ? { from: gesture.blockerId, to: gesture.id } : null,
    });
    say(describeEffect(gesture.base, gesture.result, gesture.id, gesture.blockerId) || " ");
  }

  function onPointerUp(event) {
    document.removeEventListener("pointermove", onPointerMove);
    const done = gesture;
    gesture = null;
    if (done.kind === "link") {
      finishLink(done.id, event);
      return;
    }
    const changed = done.result && JSON.stringify(done.result) !== JSON.stringify(done.base);
    if (changed) {
      say(describeEffect(done.base, done.result, done.id, null));
      onChange(done.result);
    } else {
      say("");
      draw(plan);
    }
  }

  elements.timeline.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || gesture) return;
    const bar = event.target.closest(".bar");
    if (!bar) return;
    event.preventDefault();
    let kind = "move";
    if (event.target.closest(".dot")) kind = "link";
    else if (event.target.closest(".handle")) kind = "resize";
    gesture = {
      kind,
      id: bar.dataset.id,
      startX: event.clientX,
      base: plan,
      result: null,
      blockerId: null,
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp, { once: true });
  });

  elements.addButton.addEventListener("click", () => {
    const added = addTask(plan, "Nouvelle tâche");
    editingId = added.id;
    say("Tâche ajoutée : donnez-lui un nom.");
    onChange(added.plan);
  });

  function render(nextPlan) {
    plan = nextPlan;
    draw(plan);
  }

  say("");
  return { render, say };
}
