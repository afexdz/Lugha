# Lugha Pro : offre et paiement Baridi

## Offre retenue

2 000 DA pour trois mois calendaires, un seul profil. Paiement unique, sans renouvellement automatique. Un parent peut suivre le profil de son enfant ; un adulte peut utiliser son propre profil.

Essai proposé : trois jours à partir de la première leçon, trois leçons commencées au total pour le compte, une seule langue. Quitter une leçon consomme une place ; le backend sérialise les réservations pour empêcher les accès concurrents de dépasser la limite. Le profil est lié au premier accès. Les profils existants ne sont pas supprimés, mais une fois les limites activées, seul le profil lié peut lancer des leçons.

Bénéficiaire fourni par le propriétaire : **Lugha Pro**. RIP : **00799999002038493812**. Le client effectue lui-même son virement ; le site n'effectue aucune transaction bancaire. Vérifier que le nom communiqué correspond bien au compte avant ouverture.

## Parcours préparé dans le code

- `#/abonnement` : offre, instructions Baridi, copie du RIP, référence et date du virement, déclaration et suivi.
- `#/paiements` : gestion des demandes réservée aux comptes inscrits dans la table existante `public.admins`.
- Déclaration = attente. L'accès n'est jamais débloqué sur la seule parole du client.
- L'administrateur compare le virement réellement reçu, le montant et l'expéditeur à son relevé. Une case explicite est requise avant validation.
- Validation transactionnelle : trois mois à partir de la validation ou prolongation de l'accès existant. Une demande déjà validée ne prolonge pas deux fois. Une référence/date déjà approuvée ne peut pas être validée pour un deuxième paiement.
- Référence et demandes privées, tables sous RLS sans accès direct des clients ; les fonctions vérifient le JWT et l’identité du compte. Prix fixé côté serveur et en base.

## Activation restante

Contrôle de production après installation : zéro administrateur, zéro demande dans la nouvelle table et zéro accès actif à préserver. Il faut désigner le compte du propriétaire avant ouverture. Les anciennes demandes de paiement n’ont pas été supprimées ni validées.

**Le paiement et les limites restent désactivés** (`BILLING_ENABLED=false`). Aucun transfert réel n'a été effectué et aucune demande réelle n'a été validée pendant les tests.

1. Confirmer l'e-mail du propriétaire autorisé à vérifier les virements et retrouver son UUID dans Supabase.
2. Installation de `supabase/migrations/20261011150000_lugha_billing.sql` au projet Lugha : faite. Migration appliquée et confirmée dans le projet le 11 octobre 2026.
3. Configurer dans Vercel `BILLING_ENABLED=true` après vérification. Les URL et clé publique existantes sont utilisées ; aucune clé de service n’est nécessaire. Les fonctions SQL vérifient l’utilisateur connecté et les administrateurs existants.
4. Tester dans un environnement de préproduction : quatrième leçon refusée, expiration, changement de langue/profil, réservations concurrentes, déclaration en attente, refus, validation unique et renouvellement. Les tests Node actuels simulent les appels à la base ; ils ne valident pas l'exécution SQL.
5. Activer `BILLING_ENABLED=true`, actualiser les textes « en préparation » et redéployer ensemble après vérification de la configuration.

Les leçons sont aujourd'hui livrées comme fichiers statiques. La limite bloque le parcours normal via une autorisation serveur ; elle n'empêche pas une personne technique de télécharger les ressources publiques. Pour une protection commerciale des ressources elles-mêmes, livrer la banque depuis un endpoint authentifié et ne plus publier les JSON anglais ni les banques intégrées dans `js/data.js`. Ce travail supplémentaire est requis avant de présenter l'accès comme une protection inviolable.

## Motivation sans fausses promesses

Promesses disponibles : choix entre quinze langues, anglais A1 avec 1 822 activités, jeux d'association, phrases à reconstruire, lectures, images, séries, objectifs, récompenses et suivi parental local.

Le classement est actuellement simulé et affiché comme ligue d'entraînement. Aucun classement entre vrais abonnés n'est vendu comme existant. A2–C2 sont des pilotes ; les quinze langues n'ont pas toutes une banque équivalente. Pas de certificat CECRL promis.

## Tests et appareils

Tests serveur avec appels Supabase simulés : authentification, origine, prix fixe, date, désactivation, séparation administrateur/utilisateur, refus de valider sans vérification du virement.

Aucun téléphone Android/iPhone accessible dans les surfaces de contrôle disponibles. Les tests aux dimensions mobiles utilisent un navigateur, pas un appareil physique. La validation matérielle reste à réaliser avec un appareil ou un service de tests fourni par le propriétaire.
