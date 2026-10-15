# Planning vibe coding · spécifications

## Besoin

Un chef de projet digital doit voir son planning, le manipuler et savoir ce qui fixe sa date de fin. Planning vibe coding est un planning de type Gantt dans le navigateur : chaque tâche est une barre sur une frise, et l'outil montre le chemin critique.

## Utilisateurs

Les étudiants d'Olivier Dommange, futurs chefs de projet digitaux (formation DPM du SAWI), qui planifient leur propre projet. Usage sur ordinateur, sans compte, sans installation, interface en français.

## Données de départ

Les sept étapes de la fiche de suivi d'Olivier, enchaînées, en jours ouvrés à partir du lundi qui suit la première ouverture :

| Étape | Durée |
| --- | --- |
| Outils et périmètre technique | 3 jours |
| Prototypage rapide | 5 jours |
| Développement itératif encadré | 10 jours |
| Tests et validation continue | 4 jours |
| Gestion de version disciplinée | 2 jours |
| Sécurisation et robustesse | 3 jours |
| Documentation continue | 3 jours |

Total : 30 jours ouvrés, soit six semaines. Au départ, les sept étapes sont toutes critiques.

## Fonctionnalités retenues

1. **Frise Gantt en jours ouvrés** : une ligne par tâche, une barre par tâche, une colonne par jour ouvré (lundi à vendredi) ; la date de fin du projet est affichée en permanence.
2. **Déplacer une barre** à la souris : la tâche change de date de début. Une barre tirée avant la fin de l'un de ses prédécesseurs s'arrête à cette fin.
3. **Étirer une barre** par son bord droit : la tâche change de durée (un jour au minimum).
4. **Dépendances fin-début** : une tâche commence au plus tôt à la fin de chacun de ses prédécesseurs. Quand une tâche se termine plus tard, ses successeurs sont repoussés juste ce qu'il faut. Quand elle avance ou raccourcit, ses successeurs restent en place et l'écart devient une marge. Les tâches repoussées par un geste sont signalées pendant ce geste.
5. **Chemin critique** : les tâches sans marge sont en bleu ; la marge des autres tâches est dessinée derrière leur barre.
6. **Ajouter, renommer, supprimer** une tâche.
7. **Relier deux tâches** en glissant d'une barre vers une autre ; un lien qui créerait une boucle est refusé ; un clic sur un lien le retire.
8. **Annuler** le dernier geste (bouton et Ctrl+Z / Cmd+Z), sur plusieurs niveaux.
9. **Sauvegarde** dans le navigateur : en revenant sur la page, on retrouve son planning.

Ordre de priorité si le temps manque : le cœur (1 à 5 et 9), puis la construction du planning (6 et 7), puis l'annulation (8).

## Fonctionnalités coupées

| Fonctionnalité | Raison |
| --- | --- |
| Rétablir (redo) | Le brief demande d'annuler une erreur ; rétablir double le travail sur l'historique pour peu de valeur. |
| Choisir la date de début du projet | Hors brief ; le projet démarre le lundi suivant la première ouverture. |
| Ressources et personnes assignées | Hors brief ; le besoin porte sur les dates et le chemin critique. |
| Plusieurs projets | Un étudiant suit un projet à la fois. |
| Export, impression, partage | Hors brief ; aucun compte ni serveur. |
| Zoom et changement d'échelle | Un projet étudiant tient à l'écran en jours. |
| Jours fériés | Les jours ouvrés (lundi à vendredi) suffisent pour planifier un projet de formation. |
| Liens autres que fin-début | Le lien fin-début couvre l'enchaînement d'étapes ; les autres types compliquent l'explication. |

## Scénario principal

1. L'étudiant ouvre la page : les sept étapes s'enchaînent sur six semaines, toutes en bleu (critiques).
2. Il étire « Développement itératif encadré » de trois jours : les quatre étapes suivantes reculent, la date de fin aussi.
3. Il ajoute « Maquettes », la relie après « Outils et périmètre technique » : la tâche apparaît en gris avec sa marge, elle n'est pas critique.
4. Il retire le lien entre « Développement » et « Tests », relie « Tests » après « Prototypage », puis tire « Tests » vers la gauche : la barre s'arrête à la fin du prototypage, les tests courent en parallèle du développement.
5. Il se trompe de lien et annule.
6. Il ferme la page, la rouvre : le planning est intact.
