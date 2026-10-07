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
- `js/engine.js` — moteur anglais A1 (génération fiable des exercices)
- `js/lesson.js` — affichage, correction et fin de leçon
- `content/en/A1.json` — contenu anglais A1 (12 unités)
- `js/main.js` — routeur
- `vendor/` — Motion et Lenis en local (aucun CDN)

## Tests

    node tools/validate-content.js          # structure du contenu anglais
    node tools/test-engine.js 1000 42       # 2 000 leçons générées, invariants de correction
    node tools/e2e-lesson.js http://localhost:8000   # parcours réel (Playwright installé à part)

Rapport : `docs/QA_REPORT.md`.

## À faire ensuite

1. Progression fondée sur les tentatives et sauvegarde Supabase multiappareil.
2. Parcours CEM / Lycée / Enfants et premières missions.
3. PWA, puis application Android (Capacitor).
