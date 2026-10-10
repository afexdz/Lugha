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
- `js/engine.js` — moteur anglais à banque de questions planifiée
- `js/lesson.js` — affichage, correction et fin de leçon
- `content/en/A1.json` — banque de vocabulaire A1 de base
- `content/en/course.json` — parcours anglais A1–C2 en préparation (22 unités, 1 046 activités)
- `assets/english/` — illustrations SVG originales
- `docs/ENGLISH_CONTENT_REPORT.md` — analyse des cinq livres, couverture et limites
- `js/main.js` — routeur
- `vendor/` — Motion et Lenis en local (aucun CDN)

## Tests

    node tools/validate-content.js          # structure, références et doublons du parcours anglais
    node tools/test-engine.js 1000 42       # 2 000 leçons générées, invariants de correction
    node tools/e2e-lesson.js http://localhost:8000   # parcours réel (Playwright installé à part)

Rapport : `docs/QA_REPORT.md`.

## À faire ensuite

1. Progression fondée sur les tentatives et sauvegarde Supabase multiappareil.
2. Parcours CEM / Lycée / Enfants et premières missions.
3. PWA, puis application Android (Capacitor).

## Recomposer le parcours anglais

    python3 tools/compose-english-course.py
    node tools/validate-content.js

Les activités avancées sont des propositions originales guidées par le CECRL. La banque doit être relue avant de présenter les niveaux comme des cours complets. Le générateur ne lit pas ni ne copie les PDF.
