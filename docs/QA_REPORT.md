# Rapport qualité — étape 1 : fiabilité des leçons anglaises

Date : 7 octobre 2026 · Commit de départ : `d4261ea` · Branche : `fix/fiabilite-lecons`

## Ce qui fonctionne désormais pour l'élève

- Une bonne réponse n'est plus refusée à cause d'une erreur de génération (vrai/faux, intrus).
- La bonne réponse est toujours présente parmi les choix, une seule fois, et deux choix ne se ressemblent jamais (même mot, même traduction, même image ou traduction valable de la cible, ex. « orange » fruit / couleur).
- « L'intrus » porte sur un thème clair (ex. *kitchen / wall / garden / mother*), uniquement avec des noms concrets non ambigus.
- Les phrases à trou retrouvent aussi les expressions composées (*thank you*, *good morning*…). Sans phrase compatible, un autre exercice est proposé au lieu de « ___ ? ».
- Une mauvaise réponse à un exercice à trou ne bloque plus l'écran. « Passer » affiche la bonne réponse pour tous les types.
- Un appareil sans synthèse vocale reçoit des versions écrites équivalentes des exercices d'écoute.
- Si le contenu ne se charge pas, un message clair et un bouton « Réessayer » remplacent l'attente infinie.
- « Mots appris » ne compte plus que les mots réussis du premier coup pendant la leçon, sans erreur ni passage. Une unité entière n'est plus ajoutée automatiquement.

## Vérifications exécutées

### Générateur (`node tools/test-engine.js 1000 42`)
2 000 leçons : 1 000 selon le protocole de l'audit (unité *i* modulo 12, leçon 3, profil vide, graine 42) et 1 000 couvrant les leçons 0 à 3 de toutes les unités.

| Invariant cassé | Avant | Après |
|---|---|---|
| Intrus absent des choix | 1 234 | 0 |
| Vrai/faux à clé contradictoire | 623 | 0 |
| Phrase à trou vide ou choix ambigus (écoute à trou) | 677 | 0 |
| Phrase à trou vide ou choix ambigus (trou) | 106 | 0 |
| Choix en double (autres types) | 325 | 0 |
| Anagramme sur une expression à espace | 79 | 0 |
| **Total** | **3 044** | **0** |

Résultat identique avec les graines 7 et 2026.

### Parcours réel dans Chromium (`node tools/e2e-lesson.js`)
Compte démo local, écran de 420 px :
- leçon de révision anglaise, avec une erreur volontaire sur une écoute à trou et sur un vrai/faux, puis un « Passer » : chaque bonne réponse acceptée, chaque erreur refusée, leçon terminée, aucune erreur JavaScript ;
- leçons 1 et 2 d'une nouvelle unité terminées sans refus à tort ;
- même leçon sans synthèse vocale : aucun exercice d'écoute impossible ;
- chargement du contenu en échec puis « Réessayer » : la leçon s'ouvre ;
- une leçon d'espagnol (ancien contenu) avance sans erreur.

## Limites et points restants

- Les tests prouvent la cohérence des corrections, pas la qualité linguistique du contenu : `content/en/A1.json` reste à relire par une personne compétente en anglais.
- La progression est toujours enregistrée dans le navigateur ; la force des mots (`updateStrength`) n'est pas encore raccordée et il n'y a pas d'échéances de révision : **étape 2**.
- Les anciennes valeurs « mots appris » déjà enregistrées ne sont pas recalculées ; elles seront marquées comme historique non vérifié lors de la migration (étape 2).
- Les cœurs bloquent toujours une leçon après trop d'erreurs ; ils seront retirés des nouveaux parcours (étape 4).
- Le classement utilise encore des joueurs simulés.
- Tests non exécutés : Safari / iOS et Chrome Android réels (non disponibles ici), connexion Supabase réelle.
