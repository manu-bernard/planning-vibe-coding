# Planning vibe coding · décisions

| Décision | Raison |
| --- | --- |
| HTML, CSS et JavaScript natifs, sans dépendance ni build | Rien à installer, le code se lit tel qu'il tourne, l'hébergement GitHub Pages suffit. |
| Données dans `localStorage` | Le brief exclut les comptes ; le planning doit survivre à la fermeture de la page. |
| Logique pure dans `src/schedule.js`, testée avec `node --test` | La propagation et le chemin critique sont le cœur du produit : on les teste sans navigateur. |
| Temps compté en jours ouvrés entiers (index 0, 1, 2…), week-ends absents de la frise | Choix de l'équipe : un chef de projet compte en jours de travail ; les calculs restent des additions d'entiers, la conversion en dates est isolée dans `calendar.js`. |
| Une barre tirée avant la fin d'un prédécesseur s'arrête à cette fin | Choix de l'équipe : le lien est toujours respecté, aucun état incohérent à corriger. |
| Une tâche qui avance ou raccourcit laisse ses successeurs en place | Choix de l'équipe : le placement fait à la main est respecté ; l'écart devient une marge visible ; seuls les retards se propagent. |
| Planning de départ : les sept étapes enchaînées | Choix de l'équipe, fidèle au brief ; le chemin critique se révèle dès qu'une tâche passe en parallèle. |
| Priorité : ajouter, renommer, supprimer et relier avant annuler | Choix de l'équipe : sans eux, on ne fait que déplacer les sept étapes. |
| Plan sauvegardé invalide : remplacé en entier par le plan de départ, sans réparation partielle | Seule l'application écrit ce plan ; une donnée incohérente vient d'une manipulation extérieure, et une réparation partielle produirait un planning trompeur. |
| Plan enregistré dès la première ouverture | La date de début du projet reste celle de la première visite, même en revenant une autre semaine. |
| La vue ne détient que le geste en cours ; le plan appartient à `main.js` | Un seul endroit change le plan, ce qui rend la sauvegarde et l'annulation simples à brancher. |
| Bouton « Repartir du planning de départ », sans confirmation | Utile en cours pour recommencer un exercice ; « Annuler » le rattrape, une confirmation serait une étape de trop. |
| Liens fin-début uniquement | C'est le lien des étapes enchaînées du brief ; il suffit à expliquer le chemin critique. |
| Lien qui créerait une boucle : refusé | Une boucle rend le planning impossible à calculer. |
| Bleu réservé au chemin critique | Choix de l'équipe ; la couleur porte un seul sens : « ce retard repousse la fin ». |
| Rétablir (redo) coupé | Le brief demande d'annuler une erreur ; rétablir n'apporte presque rien à la démo. |
