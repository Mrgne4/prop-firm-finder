# MISSION 3A — Consolidation du lot 1 (Topstep + Apex)
Statut : DONNÉES RÉELLES NON VALIDÉES · données de démonstration conservées · lot 2 non commencé · site non publié.
Date de vérification des sources : 2026-11-15.

## 1. Changements de modèle
- **Instruments** : `instruments_scope` désigne maintenant la portée de la liste OFFICIELLE (exhaustive/partial) ; `instruments` = produits de NOTRE catalogue confirmés dans cette liste ; nouveau `instruments_excluded` = produits du catalogue vérifiés ABSENTS un par un. Un instrument du catalogue absent des deux est « à vérifier », jamais interdit. Le validateur refuse une exclusion sans liste exhaustive.
- **Restrictions par contrat** : `instrument_limits` détaillé (Topstep : limites Risk Adjustments et fenêtres Tier 1).
- **Retraits** : `funded.payout_paths` (chemins Standard / Consistency), `max_payouts`, `drawdown_effect_of_payout`, et par variante `payout_caps_by_number`.
- **Québec** : `quebec_by_stage` (évaluation / funded simulé / Live), statut « restreint » ou « admis » exigeant une source officielle.
- **Correctif de données** : Apex 25K Intraday `evaluation.max_contracts` 2 → 4 (2 était la valeur du Performance Account).
- Plateforme `wealthcharts` ajoutée au catalogue ; 7 sources officielles ajoutées (29 au total).

## 2. Registre des règles confirmées (source officielle)
### Topstep
| Règle | Valeur | Source |
|---|---|---|
| Premier retrait, chemin Standard | 5 jours gagnants (≥150 $ net, non consécutifs, journée figée 16 h CT) ; profit net > 0 $ depuis le dernier retrait, **premier retrait exempté** | ts-payouts |
| Chemin Consistency | 3 jours de trading (≥1 trade), plus gros jour ≤ 40 % du profit net | ts-payouts |
| Minimum par retrait | 125 $ | ts-payouts |
| Partage | 90/10 | ts-payouts |
| Demande | jusqu'à 50 % du solde, plafonné | ts-payouts |
| Plafond Standard 50K/100K/150K | 2 000 / 3 000 / 5 000 $ | ts-payouts |
| Plafond Consistency 50K/100K/150K | 3 000 / 4 000 / 6 000 $ | ts-payouts |
| Après chaque retrait | MLL → 0 $ de façon permanente ; compteur de jours repart ; contrats réduits si palier inférieur | ts-payouts |
| Limites par produit (50K/100K/150K) | GC, CL 3/6/9 ; MGC, MCL 30/60/90 (Live : MGC 5/10/15, MCL 3/6/9) ; MBT 5/10/15 ; SI, HG, PL = 0 (hors catalogue) | ts-risk |
| Annonces Tier 1 | minis (ES, NQ, RTY, YM, GC…) : aucune ouverture pendant 10 min ; micros plafonnés | ts-risk |
| Combine : contrats max | 5 / 10 / 15 (micros ×10) | ts-combine |
| Types de contrats | futures seulement | ts-products, ts-forex |
| Frais d'activation XFA | 149 $ (Standard) | ts-pricing, ts-site |
### Apex (EOD et Intraday)
| Règle | Valeur | Source |
|---|---|---|
| Évaluation : objectif | 1 500 / 3 000 / 6 000 / 9 000 $ (25K/50K/100K/150K) | ax-home, ax-picker |
| Évaluation : drawdown | 1 000 / 2 000 / 3 000 / 4 000 $ | ax-home, ax-picker |
| Évaluation : limite quotidienne | EOD 500 / 1 000 / 1 500 / 2 000 $ ; Intraday aucune | ax-home, ax-picker |
| Évaluation : contrats | 4 / 6 / 8 / 12 (≠ PA 2 / 4 / 6 / 10) | ax-home, ax-picker |
| Évaluation : durée, consistance | 30 jours ; aucune règle de consistance | ax-home, ax-eval-fees |
| Retraits : jours | 5 jours atteignant le profit quotidien minimal (EOD 100/250/300/350 $) | ax-eod-payouts |
| Consistance retrait | 50 % | ax-eod-payouts, ax-intraday-payouts |
| Minimum / partage / maximum | 500 $ / 100 % / 6 retraits (PA fermé après le 6e) | ax-*-payouts |
| Safety Net | drawdown + 100 $ (EOD : 26 100 / 52 100 / 103 100 / 154 100 $) ; solde minimal = Safety Net + 500 $ | ax-eod-payouts |
| Plafonds par numéro (retraits 1–5) EOD 25K/50K/100K/150K | 1k×5 / 1,5k,1,5k,2k,2,5k,2,5k / 2k,2,5k,2,5k,3k,4k / 2,5k,3k,3k,3k,4k | ax-eod-payouts |
| Plafonds par numéro Intraday | 1k×5 / 1,5k,2k,2,5k,2,5k,3k / 2k,2,5k,3k,3k,4k / 2,5k,3k,3k,4k,4k | ax-intraday-payouts |
| Frais d'activation 25K Intraday | 79 $ (seul montant lu) | ax-home |
| Activation / évaluation | paiement unique, ne se renouvelle pas ; PA à activer dans les 7 jours | ax-pa-activation, ax-eval-fees |
| Plateformes | Tradovate, Rithmic, WealthCharts | ax-home |
| Types de contrats | futures seulement (CME/CBOT/NYMEX/COMEX) | ax-home |
| Canada | « Canadian traders can fully utilize our services » (Évaluation et PA simulés) ; Canada absent de la liste des pays restreints | ax-restricted |
| Live | Canada sauf Ontario non disponible | ax-live-faq |

## 3. Registre des informations manquantes (restent « non confirmé »)
- **Topstep** : Safety Net / solde minimal après 1er retrait (non énoncé) ; nombre maximal de retraits par XFA ; contrats du Scaling Plan XFA par palier ; règles news/scalping/automatisation/copy trading (la page « Prohibited » ne traite pas copy trading ni hedging ; automatisation couverte seulement par « technologie déloyale ») ; nature simulée du XFA ; Québec (3 types de comptes).
- **Apex** : prix d'évaluation (tarif dynamique) ; frais d'activation sauf 25K Intraday ; plafond du 6e retrait ; tableau des profits quotidiens minimaux et des soldes minimaux Intraday ; liste officielle complète des instruments ; suspension des métaux (aucune page officielle) ; frais de reset (« N/A » vu pour 25K Intraday seulement) ; scalping, copy trading ; liste des pays restreints non encodée (seul le Canada est encodé).
- **Limite documentée (prix Apex)** : le sélecteur officiel dépend de paramètres d'URL (`picker_balance`, `picker_fee`, `picker_type`) et de codes promo (prix barré / prix avec code, ex. 167 $ → 16,70 $ vu pour un 25K Intraday). Aucun prix de référence stable : aucun prix n'est confirmé, aucun site tiers n'est utilisé.
- Les comptes « Legacy » d'Apex (avant le 1er mars 2026) et les produits Topstep Labs ne sont pas modélisés (anciennes règles non utilisées).

## 4. Conflits entre sources
1. **Topstep plafonds** : « 5 000 $ / 6 000 $ » (pages XFA/Pro/blog) vs tableau 2 000–5 000 / 3 000–6 000 (politique de paiement) → **réconciliés** : 5 000/6 000 sont les maxima de la taille 150K. Plafonds doublés avec limite quotidienne optionnelle : offre limitée dans le temps, non modélisée.
2. **Apex inactivité** : deux extraits officiels divergents (2 jours à 50 $ en 30 jours vs 1 jour à 150 $ en 150 jours) → non modélisé.
3. **Apex métaux** : suspension affirmée seulement par des tiers → non confirmée.
4. **Apex frais d'activation** : sites tiers contradictoires et pages « Legacy » obsolètes (125–300 $) → ignorés.
5. **Apex pays** : trois versions de la liste (aide, support, ancienne FAQ « /learn » avec Thaïlande, Indonésie, Curaçao) → seule la page officielle « Restricted Countries » est citée ; Canada absent des trois.
6. **Apex Live vs évaluation (Québec)** : Live exclut le Canada sauf l'Ontario, alors que l'évaluation/PA simulés sont ouverts aux Canadiens → traité séparément, sans extrapolation.
7. **Topstep éligibilité** : la FAQ « Je suis Canadien » n'énonce pas expressément l'admissibilité ; Québec non mentionné → « À VÉRIFIER ».
8. **Lecture des pages** : plusieurs pages officielles ont été lues par extraction automatique (WebFetch/WebSearch) ; les pages d'évaluation Apex par taille n'ont pas d'URL stable conservée (cartes du site, sélecteur dynamique) : citées via `ax-home`/`ax-picker`.

## 5. Sources officielles exactes (ajoutées ou utilisées)
Topstep : help.topstep.com/en/articles/ 8284233-topstep-payout-policy · 13613539-risk-adjustments-high-risk-high-volatility · 8284223-what-is-the-scaling-plan · 10305426-prohibited-trading-strategies-at-topstep · 8284116-am-i-eligible-to-trade-with-topstep · 8284215-express-funded-account-parameters · 8284197-trading-combine-parameters · 14645398-what-is-a-pro-account · topstep.com/topstep-prop · topstep.com/express-funded-account-rules.
Apex : apextraderfunding.com/help-center/ eod-trailing-drawdown-accounts/eod-payouts/ · intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-payouts/ · getting-started/restricted-countries/ · getting-started/apex-live-prop-trading-program-faq/ · billing/evaluation-plan-fees-and-access-explained/ · billing/pa-activation-process-deadline-explained/ · apextraderfunding.com/ (+ `?picker_balance=…&picker_fee=…&picker_type=…`).

## 6. Contrôles et résultats
- Validation des données : OK (5 entreprises, 6 programmes dont 3 réels, 29 sources).
- `tsc --noEmit` : OK. **Tests : 175 / 175** (156 existants + 19 nouveaux dans `tests/mission3a.test.ts`).
- `npm run build` : OK. Contrôle navigateur réel (mobile/tablette/bureau) : aucune erreur JS.
- Vérifié : sources associées (chaque valeur confirmée réelle cite une source officielle) ; inconnues conservées ; évaluation et funded séparés (contrats 4/6/8/12 vs 2/4/6/10) ; chemins Standard/Consistency non mélangés ; Québec par type de compte.
