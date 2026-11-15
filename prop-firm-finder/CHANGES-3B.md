# MISSION 3B — Consolidation finale du lot 1
Statut : DONNÉES RÉELLES NON VALIDÉES · démo conservée · lot 2 non commencé · site non publié · date : 2026-11-15.

## 1. Rapport des corrections
### 1. Admissibilité géographique
- Distinction évaluation / funded simulé / Live conservée (`quebec_by_stage`).
- Nouvel état **`canada_general`** (« Canada en général, province non confirmée ») remplaçant « admis » pour Apex (évaluation et PA simulé) : la déclaration officielle vise le Canada entier, le Québec n'est pas nommé. Apex Live reste « restreint » (Canada hors Ontario, Québec explicitement visé). Topstep : « À VÉRIFIER » pour les trois types.
- Le critère de résidence ajoute : « ta province ou ton État n'est pas explicitement confirmé » quand la source ne parle que du pays, et « l'accès au programme ne garantit pas l'admissibilité aux paiements ». Les fiches affichent la même mise en garde sous la liste Québec. Les notes par type de compte la répètent (Topstep : paiements refusés aux pays inéligibles ; Wise listé pour le Canada sans province).
### 2. Conditions de retrait
- Nouveau module `src/engine/withdrawals.ts` : lacunes **essentielles** (partage, minimum, conditions, plafond) et **importantes** (Safety Net, nombre maximal de retraits, effet sur le drawdown, détail du premier retrait, plafond par taille / de certains retraits).
- Affichage : avertissement sur chaque carte de résultat, bloc « Retraits » de la fiche, ligne « Retraits : informations manquantes » dans la comparaison. Texte : « Conditions de retrait incomplètes… Ne suppose pas qu'elles sont favorables. »
- Effet sur le score : avec la priorité « retraits », chaque lacune compte comme information inconnue (jamais favorable).
- **Pas de blocage systématique** : une lacune « importante » ne change pas le statut ; une lacune essentielle bloque COMPATIBLE seulement via le mécanisme existant (champs essentiels de `scoring.json`).
### 3. Traçabilité Apex
- Lecture directe du sélecteur officiel avec le navigateur intégré, le 2026-11-15 ; preuve textuelle dans `data/evidence/apex-picker-2026-11-15.json` (aucune capture d'écran conservée).
- La source `ax-picker` porte désormais `durable: false`, `consulted_at`, `parameters` (picker_balance / picker_fee / picker_type) et `evidence_file`.
- `dynamic_observations` par programme : paramètres exacts, date, preuve, `durable: false`. Prix affichés (hors code promo) : EOD Standard 25K 490 $, 50K 590 $, 100K 1 190 $, 150K 2 190 $ ; Intraday Standard 25K 167 $. **Aucun n'est un prix confirmé** (`one_time` reste non confirmé).
- Correction : la valeur « 1 190 $ pour un 50K sans frais d'activation » notée en 3A était une erreur d'attribution (1 190 $ = 100K EOD Standard). Elle n'est utilisée nulle part.
- Les paramètres des cartes (objectifs, drawdown, limite quotidienne, contrats) lus en direct confirment les valeurs de 3A pour EOD 25K/50K/100K/150K et Intraday 25K.

## 2. Résultats des tests
- `tsc --noEmit` : OK · validation des données : OK (6 programmes, 29 sources) · `npm run build` : OK · contrôle navigateur réel (mobile/tablette/bureau) : aucune erreur JS.
- **Tests : 194 / 194** (175 existants + 19 nouveaux dans `tests/mission3b.test.ts`). Deux tests de 3A ont été adaptés au nouvel état `canada_general`.

## 3. Données encore non confirmées
- **Apex** : prix d'évaluation (dynamiques ; relevés datés seulement) ; Intraday 50K/100K/150K et toutes les combinaisons « No Activation Fee » non relevées ; frais d'activation du PA sauf 25K Intraday (79 $) ; plafond du 6e retrait ; tableaux Intraday des profits quotidiens minimaux et soldes minimaux ; liste officielle complète des instruments ; suspension des métaux (aucune source officielle) ; règle d'inactivité (deux versions officielles) ; scalping, copy trading ; liste des pays restreints non encodée sauf le Canada ; province du Québec nommée explicitement (Canada seulement en général) ; paiements au Québec.
- **Topstep** : Safety Net / solde minimal après le 1er retrait ; nombre maximal de retraits par XFA ; paliers du Scaling Plan XFA ; nature simulée du XFA ; copy trading, hedging ; automatisation (seulement « technologie déloyale ») ; news (limites Tier 1 connues, règle générale non lue) ; Québec pour les trois types de comptes ; paiements au Québec ; plafonds doublés (offre à durée limitée, non modélisés).
