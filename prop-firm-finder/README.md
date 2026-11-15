# Prop Firm Finder — prototype (Mission 2)

Comparateur éducatif et indépendant de programmes de prop firms. Application statique (Vite + React + TypeScript),
données en JSON, aucun backend, hébergeable gratuitement sur GitHub Pages.

> **Statut : prototype non validé.** Les trois programmes présents sont **fictifs** (« DÉMO »). Aucune donnée réelle n'a été saisie.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires + tests d'interface
npm run validate   # validation des données JSON
npm run build      # validate + typecheck + build dans /dist
npm run preview    # prévisualiser /dist
```
Node 20 ou plus.

## Structure

```
data/                 données (le seul endroit à modifier pour mettre à jour les règles)
  firms.json programs/*.json sources.json instruments.json markets.json platforms.json
  glossary.json countries.json scoring.json
src/data/             schémas (zod), validation croisée, chargement
src/engine/           moteur de compatibilité : indépendant de l'interface
src/quiz/ pages/ ui/  questionnaire, pages, composants
tests/                moteur, données, interface
scripts/              validation CLI, génération des démos
docs/                 guide « ajouter un programme »
```

## Moteur (résumé)

- Logique à trois valeurs par critère : `ok`, `échec`, `inconnu`. Une donnée « Non confirmé » ou ancienne est **inconnue**, jamais favorable.
- Statuts : `COMPATIBLE` (tout confirmé, récent) · `À VÉRIFIER` (inconnu, conditionnel ou ancien) · `INCOMPATIBLE` (échec confirmé).
  `PARTIELLEMENT COMPATIBLE` n'apparaît que si l'étudiant assouplit volontairement un critère (la résidence n'est jamais assouplissable).
- Bloquants : marchés (tous ceux choisis), résidence, overnight, week-end, annonces, session asiatique, scalping, budget.
  Évaluation et compte funded sont vérifiés **séparément** ; `conditional` n'est jamais `allowed`.
- Budget : premier paiement (évaluation ou 1er mois) + frais d'activation obligatoires confirmés. Resets, frais conditionnels et promotions exclus.
- Score : « Correspondance » (critères évaluables) et « Informations essentielles » affichées séparément ; le classement utilise
  Σ poids × info connue × adéquation / Σ poids (un inconnu rapporte 0). Pondérations dans `data/scoring.json`.
- Lien de partage : critères uniquement, **jamais la résidence**.

## Publier gratuitement sur GitHub Pages

1. Crée un compte GitHub (gratuit) puis un dépôt **public** (ex. `prop-firm-finder`).
2. Envoie-y tout le contenu de ce dossier (sans `node_modules` ni `dist`) :
   ```bash
   git init && git add . && git commit -m "Prototype"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/prop-firm-finder.git
   git push -u origin main
   ```
   (ou « Add file › Upload files » sur le site GitHub).
3. Dépôt › **Settings › Pages › Build and deployment › Source : « GitHub Actions »**.
4. L'onglet **Actions** exécute `Déploiement GitHub Pages` (tests, validation, build, publication). Quelques minutes.
5. Le site est disponible à `https://TON-COMPTE.github.io/prop-firm-finder/`. Colle ce lien dans Discord.

Chaque modification d'un JSON sur `main` redéploie le site ; si les données sont invalides, le déploiement est bloqué.
**Le site est public** : toute personne qui a l'adresse peut l'ouvrir (GitHub Pages n'a pas de contrôle d'accès privé).

## Vérification en vrai navigateur
`tests-e2e/browser-check.py` (Playwright + Chrome) parcourt le questionnaire, les résultats, le comparateur et une fiche en 390, 820 et 1366 px.
