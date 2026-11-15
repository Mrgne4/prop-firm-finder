# Mission 2B — Corrections ciblées

## 1. Variantes de comptes
- Chaque variante (25K / 50K / 100K…) est évaluée **individuellement** (`VariantEvaluation`) : statut, critères, coût, score et couverture propres.
- Le budget d'une variante n'utilise que **ses** prix et frais d'activation (plus de « une variante au moins passe »).
- Variante recommandée = meilleur statut, puis meilleur score, puis moins chère (de ses propres frais).
- Comparateur : une colonne = un programme **et** une taille de compte (clé `programme:variante`), plusieurs tailles du même programme comparables ; lignes « Pour ton profil » (statut + raisons) par colonne.
- Fiche détail : tableau « Statut par taille de compte ». Carte : liste des tailles avec leur statut.

## 2. Admissibilité géographique
- Nouveau modèle : `eligible`, `excluded`, `unconfirmed`, `unlisted` (sort des pays non listés, `unconfirmed` par défaut).
- `resolveEligibility` : la région prime sur le pays ; région inconnue avec sort divergent → ambigu → « à vérifier ». **L'absence d'exclusion ne confirme jamais l'admissibilité.**
- Validateur : codes valides, listes disjointes, `unlisted ≠ unconfirmed` exige la phrase de la source dans `note`.
- La résidence reste non assouplissable et hors lien de partage.

## 3. Fraîcheur
- Une valeur périmée est lue comme **inconnue** : elle ne confirme ni compatibilité ni incompatibilité.
- Seules les informations **essentielles** périmées déclenchent « Vérification nécessaire » ; les secondaires périmées sont signalées sans effet sur le statut.
- Traçabilité (`Evidence`) sur chaque critère : champ, source(s), date de vérification, ancienneté, état (récent / périmé / non confirmé). Affichée sous chaque raison.
- Le seuil de 60 jours reste un indicateur de maintenance.

## 4. Couverture essentielle / secondaire
- `data/scoring.json` : liste `essential_fields` (23 motifs) ; `critical_gaps_block_compatible: true`.
- `computeCoverage` par variante : % essentiel, % secondaire, lacunes, essentielles périmées.
- Une information essentielle manquante ajoute le critère « Informations essentielles » (inconnu) → jamais COMPATIBLE, et un bandeau « ⚠ Informations critiques manquantes » apparaît (carte, comparateur, fiche), même si la couverture globale est élevée.
- Tri : statut, rang, couverture essentielle, couverture globale, nom.

## Tests, build
- 126 tests (108 existants + 18 nouveaux dans `tests/mission2b.test.ts`), tous verts ; typecheck, validation des données et build OK.
- Vérification Chrome réel à 390 / 820 / 1366 px : aucune erreur JS, aucun débordement (un débordement de `<select>` introduit puis corrigé).

## Limites restantes
- Les 23 champs essentiels sont un choix initial à valider ; ils se règlent dans `scoring.json`.
- Seule l'admissibilité est évaluée par région ; les autres règles restent au niveau programme (hors prix, variantes).
- Pas de vérification automatique des sources : les dates sont saisies à la main.
- Le seuil de 60 jours est uniforme (pas de seuil par type d'information).
- Aucune donnée réelle : 3 programmes DÉMO fictifs uniquement.
- Les liens de comparaison anciens (`?p=id` sans variante) restent acceptés : la variante recommandée est alors utilisée.
