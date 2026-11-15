# MISSION 4B — Intégration FTMO, The5ers, FundedNext, FundingPips (publication NON effectuée)
Date des lectures : 2026-11-15. Générateur : `scripts/build-lot2b-data.py`. Preuves : `data/evidence/lot2b-2026-11-15.json`.
Total : 12 entreprises, 31 programmes (28 réels, 3 démo), 124 sources. Tests : 255/255. Build, tsc, validation, contrôle navigateur (mobile/tablette/bureau, 0 erreur JS) : OK.

## 1. Programmes intégrés (18) — tous des CFD simulés, jamais des futures
- FTMO (5) : 2-Step Standard / Swing, 1-Step Standard / Swing, Instant. Pays : « ouvert à tous sauf liste » → admissible hors liste.
- The5ers (3) : High Stakes (2 étapes), Hyper Growth (1 étape, pause quotidienne), Bootcamp (3 étapes).
- FundedNext (4) : Stellar 1-Step, 2-Step, Lite, Instant.
- FundingPips (6) : 1 Step Flex, 1 Step (nouveau modèle), 2 Step Standard, 2 Step Flex, 2 Step Pro, Zero.
Les dollars d'objectifs/limites sont calculés depuis les pourcentages officiels (indiqué dans chaque note). Les prix sont des observations datées non durables, jamais confirmés.

## 2. Contradictions conservées comme « non confirmé »
The5ers High Stakes objectif étape 1 (8 % ou 10 %) ; Bootcamp levier (1:30 / 1:10) ; FundedNext Lite jours minimum (2 ou 5) et première récompense (10 jours ouvrables ou 21 jours) ; FundingPips 1 Step Flex partage (80 % ou 85 %) et week-end Master (option Swing ou interdit) ; 2 Step Standard à la demande (90 % ou 100 %) et jours min. phase 1 ; 2 Step Flex perte maximale (12 % page objectifs vs 10 % Terms) ; FundingPips « 1 Step » (10 %/6 %) absent de la page Get Started ; FTMO 1-Step : Best Day Rule → règle de consistance au 5 octobre 2026 ; cTrader / Match-Trader FundedNext (blog ancien) ; The5ers Bosnie (Terms vs FAQ).

## 3. Registre des informations manquantes
- Non intégrés (produits distincts, non lus ou hors périmètre) : FTMO Futures, FundedNext Futures, The5ers Futures / Pro Growth / Instant Funding, FundedNext Labs / FNL:001.
- Partout : plafonds de retrait, nombre max de retraits, effet du retrait sur le drawdown, contrats/lots max, liste d'instruments par symbole (sauf FundingPips : 41 instruments décomptés, noms partiels), swaps/levier par instrument, Québec (aucune page ne le nomme ; états « à vérifier » ou « Canada général » pour FundingPips-Match-Trader seulement), comptes réels (live).
- FTMO : prix du type Swing ; tableau complet des restrictions de nouvelles Standard.
- The5ers : prix par taille (page de 374 jours), plafonds de retrait sauf 50K/100K, type exact du trailing Hyper Growth / Bootcamp.
- FundedNext : minimum de retrait (100 $ annoncé par un blog ancien, non confirmé), structure Standard / 3 jours / À la demande à détailler.
- FundingPips : montants minimaux en dollars des retraits (1 % de la taille), prix par taille, noms des métaux/indices/énergies, week-ends du Zero.

## 4. Sources officielles
Toutes les valeurs confirmées citent ≥ 1 source `official` (ftmo.com, the5ers.com + help/btw.the5ers.com, fundednext.com + help.fundednext.com, fundingpips.com + help.fundingpips.com). Liste complète : `data/sources.json` (ids ft-*, t5-*, fn-*, fp-*). Aucun site tiers.

## 5. Modifications du moteur / modèle
- `schema.ts` : `profit_target_phase2_usd` et `profit_target_phase3_usd` (variantes) ; `daily_loss_behavior` (breach | pause) en évaluation et funded.
- `Detail.tsx` : colonnes d'objectifs étapes 2 et 3, mention pause vs échec de la limite quotidienne.
- `countries.json` : 147 → 200 pays (52 ajoutés + BL) ; `platforms.json` : Match-Trader.
- Aucune modification de la logique d'évaluation (le moteur de lot 2A gère déjà CFD ≠ futures). Régénération du lot 2A : la liste d'exclusions MyFundedFutures inclut désormais les 16 pays auparavant ignorés.
- Conflits TradeDay (jours minimum, mensuel vs unique, libellés de drawdown) : toujours non confirmés (testé).

## 6. Résultats des tests
255/255 (39 nouveaux dans `tests/mission4-lot2b.test.ts`) : intégrité et sources, CFD ≠ futures dans les deux sens, programmes à 2 et 3 étapes, limites quotidiennes, pause vs échec, restrictions funded-only (FTMO Standard vs Swing, FundingPips), instruments, exclusions géographiques sur chaque variante, inconnues et contradictions, TradeDay, non-régression des 10 programmes futures.

## 7. Problèmes à régler avant publication
1. Prix : tous des observations ; décider d'un affichage « à partir de » daté.
2. Le nombre d'étapes n'est qu'une préférence de score (non bloquante) : à confirmer par l'audit.
3. Québec : aucun programme n'est confirmé ; tout reste « à vérifier ».
4. Listes de pays « non exhaustives » (The5ers, FundedNext, FundingPips) : un pays absent n'est pas déclaré admissible.
5. Pages anciennes (The5ers btw, page objectifs FundingPips 180 jours, blogs FundedNext) à relire avant publication.
6. Garde-fous futures vs CFD : les profils futures voient 18 programmes INCOMPATIBLES ; vérifier le message affiché à l'audit.
7. Règle de consistance FTMO 1-Step du 5 octobre 2026 : vérifier la date de commande des comptes.
