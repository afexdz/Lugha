# Gestion Lugha — /wbx

L’espace de gestion est accessible à `/wbx`, avec les sections `#overview`, `#payments`, `#users` et `#audit`. Il utilise la connexion Supabase existante et vérifie le rôle administrateur sur chaque appel API et chaque fonction PostgreSQL. Changer le chemin n’est pas une protection suffisante à lui seul. La route ne nécessite pas de profil apprenant configuré.

## Fonctionnalités

- Statistiques sur 7, 30 ou 90 jours : comptes créés, dernière connexion, abonnements actifs, virements Baridi validés, sessions d’accès aux leçons et langues.
- Paiements : filtres en attente/validés/refusés ; confirmation du virement réellement reçu obligatoire ; refus avec motif ; activation des trois mois via la fonction de paiement existante.
- Utilisateurs : recherche par prénom/e-mail, pagination par 20, statut de l’accès et suspension/rétablissement des leçons avec motif. Les administrateurs sont protégés contre cette suspension.
- Journal privé des validations/refus et suspensions/rétablissements.

Les revenus ne couvrent que les nouvelles déclarations Baridi. La progression locale et les leçons réussies ne sont pas confondues avec les sessions d’accès enregistrées. Quand la facturation est désactivée, les sessions d’essai ne sont pas réservées et ne sont donc pas comptabilisées. La suspension ne supprime pas un compte et ne bloque pas la connexion Supabase. Les fichiers pédagogiques statiques restent accessibles publiquement.

## Installation et état au 11 octobre 2026

Appliquer d’abord `20261011150000_lugha_billing.sql`, puis une seule fois `20261011170000_lugha_wbx.sql`. Les deux migrations ont été installées dans le projet Supabase Lugha ; les privilèges anonymes du dashboard et les privilèges clients de la fonction interne sans contrôle ont été vérifiés absents.

Le compte support demandé existe dans Supabase, mais son attribution au rôle administrateur reste en attente de confirmation explicite. Aucun mot de passe n’est intégré au code. `BILLING_ENABLED` reste désactivé jusqu’à la configuration de l’administrateur et la vérification du parcours de paiement réel.

## Validation

- `NODE_PATH=../a1-test-runtime/node_modules node tools/test-wbx-db.js` : vrai moteur PostgreSQL local (PGlite), droits utilisateur/admin, métriques, recherche, suspension/rétablissement, compte admin protégé, trace des paiements et isolation de la fonction interne.
- `node tools/test-wbx-api.js` : contrôle des jetons/roles, paramètres, acteur authentifié et suspension même en aperçu gratuit ; appels RPC simulés.
- `node tools/test-billing.js` : garde-fous du paiement.
- `NODE_PATH=../a1-test-runtime/node_modules node tools/test-a1-flow.js` : 48 leçons + 12 coffres ; tests voix supprimées et sept effets sonores conservés.
- Navigateur : interface locale avec données fictives clairement indiquées, navigation, validation bloquée sans confirmation, suspension réversible, rendu à 1280 et 320 px sans débordement de page. Ce ne sont pas des tests sur appareils physiques Android/iPhone.
