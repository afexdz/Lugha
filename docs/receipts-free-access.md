# Reçus Baridi et accès gratuit — 13 octobre 2026

Offre : 2 000 DA pour trois mois calendaires, un profil. Le client effectue le virement à l’extérieur de Lugha puis envoie une photo JPG/PNG/WebP ou un PDF (5 Mo maximum), avec référence et date. Le formulaire vérifie le type réel du fichier avant l’envoi. Le serveur exige un objet privé existant dans le dossier Supabase du compte authentifié.

Le bucket `lugha-receipts` est privé. L’utilisateur et les administrateurs autorisés peuvent consulter son reçu. Les politiques restrictives protègent ce bucket même si d’autres buckets utilisent des politiques plus larges. Les clients ne peuvent pas modifier ni supprimer les fichiers après l’envoi ; une demande refusée permet un nouvel envoi. Limites : cinq fichiers par jour et trois déclarations par jour. Les liens de consultation administrateur expirent après cinq minutes.

Dans `/wbx#payments`, Examiner → Afficher le reçu montre l’image ou un lien PDF. L’administrateur compare le justificatif au virement réellement reçu, puis valide ou refuse avec un motif. La validation active trois mois ; une double validation du même paiement n’ajoute pas trois mois supplémentaires. Un reçu envoyé ou refusé n’active aucun abonnement.

L’accès gratuit n’expire pas après trois jours : il couvre les indices de leçon 0, 1 et 2 dans une seule langue et pour un profil. Ces leçons sont rejouables. Leçon 3 et suivantes nécessitent un abonnement actif. Les anciens compteurs d’essai ne bloquent plus ces trois leçons. La suspension reste appliquée. Les banques pédagogiques statiques restent publiques : ces limites contrôlent le parcours normal de l’application, pas la redistribution des fichiers publics.

Installation : appliquer les migrations billing et WBX précédentes, puis `20261013190000_receipts_free_lessons.sql` et `20261013200000_receipt_response.sql`. `BILLING_ENABLED` est activé par défaut après cette installation ; définir `false` désactive explicitement le parcours en maintenance.

Validation : PostgreSQL local (PGlite) pour les politiques de stockage, preuve obligatoire, confidentialité entre comptes, validation/refus, double validation, accès gratuit sans échéance, restrictions de langue/profil/leçon et anciens points d’entrée révoqués. Formulaire testé en DOM simulé, avec upload/API simulés. Tests API et navigation admin conservés ; les 48 leçons A1 passent la non-régression. Aucun faux virement ni fausse souscription n’est enregistré dans la base de production pour les tests.
