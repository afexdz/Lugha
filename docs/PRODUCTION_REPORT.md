# Lugha — passage en production (7 octobre 2026)

Branche `prod/lancement`. Tests : `node tools/test-engine.js`, `node tools/e2e-lesson.js`, `node tools/e2e-prod.js` (85/85), `node tools/perf.js`.
Les tests navigateur utilisent `tools/fake-supabase.js`, qui reproduit les règles SQL. Les règles du vrai serveur ont été vérifiées séparément, par des requêtes SQL annulées en fin de test.

## Problèmes corrigés

| # | Problème | Cause | Correction | Vérification |
|---|---|---|---|---|
| 1 | Un client pouvait se donner des XP, des gemmes ou des étapes | Politique RLS « for all » sur `profils` / `cours` | Droits par colonne. XP, gemmes, série et étapes ne sont calculés que par `terminer_lecon` et `acheter` | SQL : modification directe refusée. e2e G : `permission denied` |
| 2 | XP comptés deux fois (double clic, rechargement, réseau coupé) | XP ajoutés côté navigateur | Chaque fin de leçon porte un identifiant unique, verrouillé côté serveur. File locale hors ligne | e2e F, G et hors ligne : une seule leçon enregistrée |
| 3 | Classement factice (bots, « Version locale ») | `leagueList` générait de faux joueurs | `classement_semaine` : vrais élèves, XP serveur, égalité départagée par l'heure | e2e A : l'élève apparaît avec ses XP serveur dès la 1re leçon |
| 4 | Bouton « démo » et faux compte | Outil de test resté en production | Supprimés (UI, `openDemo`, données ligues et bots) | e2e « Démo » |
| 5 | Exercices d'écoute de mauvaise qualité (voix du navigateur) | Le générateur produisait `listen`, `soundImage`, `dictation`, `listeningCloze` | Retirés de la génération et du code d'affichage. Plus de lecture automatique. Bouton 🔊 facultatif, message « Audio indisponible » en cas d'échec | test-engine : 0 exercice d'écoute. e2e D |
| 6 | Rôle faux après inscription | Le formulaire envoyait `learner`, le trigger attendait `apprenant`. Les comptes Google n'avaient pas de rôle | Trigger corrigé. Étape « Qui va utiliser Lugha ? » à la 1re connexion Google | e2e A |
| 7 | Données d'un compte visibles après déconnexion | Copie locale conservée | Déconnexion : envoi des leçons en attente, puis effacement local complet | e2e C : pages privées → connexion |
| 8 | « Gratuit » affiché partout, aucun plan payant | Texte du lancement | Essai 7 jours, puis 2 000 DA — 3 mois. Paiement BaridiMob par reçu, validé par un admin. `mon_acces` est la source de vérité | e2e E |
| 9 | Second clic d'un double clic dans l'écran de fin, qui ouvrait « Voyage » | Le clic tombait sur l'écran suivant | Écrans de fin protégés contre le double clic | e2e A (double clic) |
| 10 | Débordement horizontal sur mobile | Badge d'essai trop large, animation d'entrée des exercices | Badge compact sous 520 px, `overflow-x: clip` sur la leçon | e2e H à 360 px |
| 11 | Contenu des leçons téléchargé même sur l'accueil | Chargement au démarrage | Chargé seulement pour un compte connecté | perf.js |
| 12 | Requêtes du compte en double à la connexion | Formulaire et événement d'auth chargeaient tous deux le compte | Un seul chargement en cours par compte | — |
| 13 | TRUNCATE accordé aux clients | Droits par défaut | Révoqué. Suppression de `comptes` hors RPC révoquée | SQL |

## Performance (Chromium, 4G lente simulée, processeur ×4, serveur local sans compression)

- Accueil à froid : DOM prêt en environ 1,0 s, 17 requêtes.
- Ouverture d'une leçon : environ 0,15 s.
- Ajouts :
  - `preconnect` vers Supabase ;
  - préchargement de la police principale ;
  - cache long pour les polices (1 an) et les bibliothèques (7 jours) ;
  - revalidation pour le code de l'app.

## Reste à faire avant le lancement

1. Coordonnées BaridiMob (RIP, titulaire) : à mettre dans `PAY` (`js/app.js`).
2. Compte administrateur : à ajouter dans `public.admins`.
3. Suppression de compte : exécuter `supabase/migrations/20261007b_suppression_compte.sql` dans l'éditeur SQL.
4. Activer la protection contre les mots de passe divulgués (Supabase → Auth).
5. Tester la connexion Google réelle sur ordinateur et sur téléphone.
