# Planning vibe coding · décisions

| Décision | Raison |
| --- | --- |
| HTML, CSS et JavaScript natifs, sans dépendance ni build | Rien à installer, le code se lit tel qu'il tourne, l'hébergement GitHub Pages suffit. |
| Données dans `localStorage` | Le brief exclut les comptes ; le planning doit survivre à la fermeture de la page. |
| Logique pure dans `src/schedule.js`, testée avec `node --test` | La propagation et le chemin critique sont le cœur du produit : on les teste sans navigateur. |
| Liens fin-début uniquement | C'est le lien des étapes enchaînées du brief ; il suffit à expliquer le chemin critique. |
| Lien qui créerait une boucle : refusé | Une boucle rend le planning impossible à calculer. |
| Vermillon réservé au chemin critique | La couleur porte un seul sens : « ce retard repousse la fin ». |
| Rétablir (redo) coupé | Le brief demande d'annuler une erreur ; rétablir n'apporte presque rien à la démo. |
