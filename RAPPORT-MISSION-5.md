# MISSION 5 — Audit final et version candidate (NON publiée)
Date : 2026-11-15. 12 entreprises (9 réelles + démos retirées en production), 28 programmes réels, 124 sources.

## 1. Corrections apportées
1. **Filtre des challenges** : `steps_is_blocking = true`. Un choix explicite (Une étape / Deux étapes / Sans challenge) exclut les programmes d'un autre type (Bootcamp, 3 étapes, est exclu par « une » et « deux »). « Peu importe » (ex-« Aucune préférence ») : aucun critère, aucune exclusion. Nombre d'étapes inconnu → « À VÉRIFIER ». Avertissement ajouté dans le questionnaire et la page Méthode.
2. **Prix** : nouveau champ `observed_prices` (montant, devise USD/€, date, source officielle, type : affiché / code / « à partir de » / mensuel), dérivé des observations existantes (`scripts/build-observed-prices.py`), validé (source officielle obligatoire). Affichage : carte (« dès X — date — Prix à vérifier — site officiel ») et page de détail (tableau par compte avec mention explicite « ni garanti ni confirmé »). Les prix The5ers dont les tailles ne sont pas nommées ne sont pas affichés (pas d'invention). Les prix confirmés restent séparés ; budget avec coût inconnu = « À VÉRIFIER ».
3. **Géographie** : trois états conservés (admissible, exclu, non confirmé). Québec : l'absence d'exclusion (ex. FTMO « ouvert à tous sauf ») ne donne plus jamais une admissibilité → « À VÉRIFIER » ; le message distingue challenge / compte funded / paiements ; `quebec_by_stage` est désormais lu par le moteur (« restreint » officiel = exclu ; « admis » officiel = confirmé ; « Canada en général » = comportement validé en 3B).
4. **Audit des règles** : le type de drawdown du compte funded FTMO 2-Step, qui était déduit, est repassé « non confirmé ». Registre automatique des lacunes : `AUDIT-DONNEES.md` (117 lacunes de champs essentiels, surtout prix de base / frais d'activation et minimums de retrait). Vérifications automatisées : limites > 0, quotidienne ≤ maximale, toute valeur confirmée citée à une source officielle, aucune valeur périmée (60 jours), conflits non résolus restés non confirmés, futures ≠ CFD.
5. **Version étudiante** : `studentView` retire programmes, entreprises et sources de démonstration au build de production (`VITE_SHOW_DEMO=true` les réaffiche pour une revue interne). Aucune bannière ni badge « DÉMO » en production.
6. **Parcours** : questionnaire de 10 questions (incluant « Sous quelle forme ? » pour futures / CFD) testé de bout en bout comme un débutant ; script `tests-e2e/browser-check.py` réécrit pour la version de production.

## 2. Résultats des tests
- Validation des données : OK (12 entreprises, 31 programmes dont 3 démo exclus en production, 124 sources).
- Tests automatisés : 279/279 (10 fichiers ; 25 nouveaux dans `tests/mission5.test.tsx`, anciens tests adaptés : filtre étapes, libellé « Peu importe », Québec des démos).
- Typecheck : OK. Build de production : OK.
- Navigateur (Chrome, mobile 390 px, tablette 820 px, bureau 1366 px) : parcours complet, aucune démo visible, « Prix à vérifier » présent, comparaison de deux programmes, aucun débordement horizontal, 0 erreur JS.

## 3. Problèmes bloquants avant publication
Aucun problème technique bloquant. Décisions/risques à valider par toi :
1. Les résultats pour un résident du Québec seront presque tous « À VÉRIFIER » (Apex et FundingPips : « Canada en général ») : c'est voulu, mais peut décevoir les étudiants.
2. Le filtre « deux étapes » exclut le Bootcamp (3 étapes) : confirme que ce comportement te convient.
3. Aucun prix n'est confirmé : les cartes affichent des observations datées du 15 novembre 2026 ; au-delà de 60 jours, relancer la collecte.
4. Le site sera public sur GitHub Pages (pas de contrôle d'accès).

## 4. Informations encore non confirmées
Voir `AUDIT-DONNEES.md` (par programme) et les rapports `CHANGES-4B.md` (registre et contradictions). En résumé : prix de base et frais d'activation partout, plafonds/nombre de retraits, contrats ou lots maximum, Québec (aucun programme confirmé), listes de pays non exhaustives, contradictions entre pages officielles (The5ers High Stakes 8 % ou 10 %, FundedNext Lite, FundingPips Flex 80/85 %, TradeDay), produits non intégrés (FTMO / FundedNext / The5ers Futures, Pro Growth, Instant Funding, Labs).
