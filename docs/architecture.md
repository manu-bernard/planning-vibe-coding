# Planning vibe coding · architecture

## Principes

- HTML, CSS et JavaScript natifs en modules ES ; aucune dépendance, aucune étape de build.
- La logique métier vit dans `src/` en fonctions pures, testables avec `node --test` sans navigateur. L'affichage est séparé de la logique.
- Données dans le navigateur (`localStorage`) ; aucun serveur, aucun compte.
- Hébergement : GitHub Pages, branche `main`, racine du dépôt.

## Arborescence

```
index.html            application structurée
prototype.html        prototype autonome, un seul fichier, gardé en ligne pour comparer
styles.css            styles de l'application
package.json          type module et script de test, sans dépendance
src/
  schedule.js         planification : gestes sur le plan, propagation, chemin critique
  calendar.js         correspondance jour ouvré ↔ date, formats en français
  history.js          pile d'annulation
  storage.js          lecture validée et écriture du plan dans localStorage
  default-plan.js     plan de départ : les sept étapes de la fiche
  gantt-view.js       rendu de la frise et gestes à la souris
  main.js             point d'entrée : relie l'état, la vue, l'historique et la sauvegarde
tests/
  schedule.test.js
  calendar.test.js
  history.test.js
  storage.test.js
  default-plan.test.js
docs/
  specifications.md
  architecture.md
  decisions.md
```

## Modules

| Module | Rôle | Dépend de |
| --- | --- | --- |
| `schedule.js` | Fonctions pures qui prennent un plan et renvoient un nouveau plan : `resizeTask`, `addTask`, `renameTask`, `removeTask`, `linkTasks`, `unlinkTasks`. `moveTask` renvoie `{ plan, blockerId }`, où `blockerId` nomme le prédécesseur sur lequel la tâche a buté. `computeSchedule` calcule la fin du projet, la marge de chaque tâche et le chemin critique ; `pushedTasks` liste les tâches qu'un geste a repoussées ; `isAcyclic` vérifie qu'aucun lien ne forme de boucle ; `cleanName` resserre les espaces et limite un nom à 80 caractères. | — |
| `calendar.js` | `workdayToDate` convertit un index de jour ouvré en date réelle (lundi à vendredi) ; `nextMonday` donne le lundi qui suit une date ; `toIsoDate` et `fromIsoDate` passent d'une date au texte `AAAA-MM-JJ` ; `formatShort` et `formatLong` formatent en français. | — |
| `history.js` | Pile d'états passés : empiler, annuler, savoir si l'on peut annuler. | — |
| `storage.js` | `parsePlan` valide un texte (version, date, entiers, noms, identifiants uniques, liens vers des tâches existantes, sans doublon ni boucle, liens respectés) et ne garde que les champs connus. `loadPlan(storage, createFallback)` lit le plan ; donnée absente, illisible ou invalide : plan de départ. `savePlan` l'écrit et renvoie `false` si le navigateur refuse. | `schedule.js` |
| `default-plan.js` | `createDefaultPlan(startDate)` construit le plan de départ à partir du lundi du jour ouvré 0. | — |
| `gantt-view.js` | `createGanttView(elements, { onChange })` renvoie `{ render, say }` ; `elements` regroupe la frise, la colonne des noms, la date de fin, son résumé, la ligne de message et le bouton d'ajout. Dessine les lignes, les barres, la marge, les liens et la date de fin ; gère l'ajout, le renommage en place, la suppression par ligne, la liaison en glissant depuis le rond d'une barre et le retrait d'un lien d'un clic ; traduit les gestes de souris en appels de `schedule.js`. Pendant un geste, elle affiche le plan provisoire et signale les tâches repoussées et le lien qui bloque ; à la fin du geste, elle transmet le nouveau plan à `onChange`. | `schedule.js`, `calendar.js` |
| `main.js` | Tient le plan courant, reçoit chaque nouveau plan de la vue et le sauvegarde ; prévient si le navigateur refuse d'enregistrer. | tous |

## Modèle de données

```js
{
  version: 1,
  startDate: "2026-10-19",          // lundi du jour ouvré 0
  tasks: [
    { id: "t1", name: "Outils et périmètre technique", start: 0, duration: 3 }
  ],
  links: [
    { from: "t1", to: "t2" }        // fin-début : t2 commence au plus tôt à la fin de t1
  ]
}
```

- `start` : index du jour ouvré de début, entier ≥ 0. `duration` : nombre de jours ouvrés, entier ≥ 1. La fin d'une tâche est `start + duration` (exclusive).
- Invariant : pour chaque lien, `to.start ≥ from.start + from.duration`. Chaque fonction de `schedule.js` rétablit l'invariant en repoussant les successeurs.
- Le graphe des liens est sans cycle ; `linkTasks` refuse un lien qui en créerait un.
- `computeSchedule` renvoie, sans modifier le plan : `end` (fin du projet), et pour chaque tâche `slack` (marge en jours) et `critical` (marge nulle).

## Rendu

- Une colonne par jour ouvré, une ligne par tâche ; en-tête par semaine avec la date du lundi.
- Couleurs : le bleu `#2B5FD9` code une seule chose, le chemin critique ; les autres barres sont en encre `#211C17` atténuée ; la marge est un trait clair derrière la barre.
- Liens : gris, épais, pointillé animé dans le sens du flux, sans flèche.
- Aucun élément ne pivote ni ne se déplace au survol ; le survol ne change que la couleur.

## Conventions de nommage

- Fichiers en minuscules avec tirets.
- Code (variables, fonctions) en anglais, en `camelCase` ; constantes en `UPPER_SNAKE_CASE`.
- Interface, documentation, issues et PR en français.
- Commits : `feat:`, `fix:`, `docs:`, `test:` ou `refactor:`, puis une description courte en français.
- Branches : `issue-<numéro>-<mot-clé>`.
