# Planning vibe coding

Un planning Gantt dans le navigateur, qui montre le chemin critique d'un projet : les tâches dont le moindre retard repousse la date de fin.

Il est conçu pour les étudiants de la formation DPM du SAWI qui planifient leur propre projet. Il fonctionne sur ordinateur, sans compte et sans installation.

**En ligne** : https://manu-bernard.github.io/planning-vibe-coding/

Le prototype qui a servi à valider le concept reste en ligne pour comparer : https://manu-bernard.github.io/planning-vibe-coding/prototype.html

## Utiliser le planning

Au départ, le planning contient les sept étapes de la fiche de suivi d'Olivier Dommange, enchaînées sur six semaines de jours ouvrés.

- **Déplacer une tâche** : glisser sa barre. Une barre tirée avant la fin de la tâche dont elle dépend s'arrête sur cette fin.
- **Changer une durée** : tirer le bord droit de la barre. Les tâches qui en dépendent sont repoussées si besoin et signalées pendant le geste.
- **Lire le chemin critique** : les barres bleues sont critiques. Les autres ont de la marge, dessinée derrière elles.
- **Ajouter, renommer, supprimer** : bouton « Ajouter une tâche », clic sur un nom pour le modifier, × au bout de la ligne pour supprimer.
- **Relier deux tâches** : glisser le rond à droite d'une barre jusqu'à une autre barre. Un clic sur un lien le retire. Un lien qui créerait une boucle est refusé.
- **Annuler** : bouton « Annuler » ou Cmd+Z / Ctrl+Z, sur plusieurs niveaux.
- **Recommencer** : « Repartir du planning de départ » rétablit les sept étapes ; « Annuler » le rattrape.

Le planning est enregistré dans le navigateur : en revenant sur la page, on le retrouve. Il n'est enregistré nulle part ailleurs.

## Développer

Aucune dépendance ni étape de build : HTML, CSS et JavaScript natifs en modules ES.

Lancer les tests (Node 18 ou plus récent) :

```
npm test
```

Ouvrir l'application en local (les modules ES ne se chargent pas depuis le disque) :

```
python3 -m http.server 8000
```

puis http://localhost:8000.

## Documentation

- [Spécifications](docs/specifications.md) : besoin, utilisateurs, fonctionnalités retenues et coupées.
- [Architecture](docs/architecture.md) : modules, modèle de données, sécurité, conventions.
- [Décisions](docs/decisions.md) : chaque choix et sa raison.
