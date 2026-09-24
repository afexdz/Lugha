# Lugha

Apprendre 15 langues en jouant. Application web, sans build, sans framework.

## Lancer en local

    python3 -m http.server 8000

Puis ouvrir http://localhost:8000

## Structure

- `index.html` — page unique, routage par hash (#/apprendre, #/lecon/3...)
- `css/app.css` — design system complet (clair + sombre)
- `css/fonts.css` — polices locales (Bricolage Grotesque, Nunito)
- `js/data.js` — les 15 langues, mots, phrases, unités, ligues
- `js/core.js` — état local, cœurs, séries, quêtes, succès, sons, animations
- `js/home.js` — vitrine animée
- `js/auth.js` — connexion, inscription, parcours de bienvenue
- `js/app.js` — apprendre, classement, boutique, profil, parents, réglages
- `js/lesson.js` — moteur de leçon (8 types d'exercices)
- `js/main.js` — routeur
- `vendor/` — Motion et Lenis en local (aucun CDN)

## À faire ensuite

Brancher Supabase : comptes, profils, progression, classement réel.
