# MISSION 4 — LOT 2A : Take Profit Trader, MyFundedFutures, TradeDay
Statut : **MISSION 4 — LOT 2A TERMINÉ (en attente d'audit) — DONNÉES RÉELLES NON VALIDÉES.** Lot 2B non commencé. Site non publié. Démos conservées.
Date de consultation : 2026-11-15. Tests : 216 réussis (194 + 22 nouveaux) ; validate, tsc, build et contrôle navigateur réel OK.

## 1. Programmes intégrés (7)
| Entreprise | Programmes | Variantes |
|---|---|---|
| Take Profit Trader | `take-profit-trader-test` (Test → PRO → PRO+) | 25K, 50K, 75K, 100K, 150K |
| MyFundedFutures | `myfundedfutures-rapid`, `-pro`, `-builder` | Rapid 25/50/100/150K ; Pro 50/100/150K ; Builder 25K + 50K (MLL 2 000 $ ou « Add-On » 1 500 $) |
| TradeDay | `tradeday-qp-intraday`, `tradeday-qp-eod`, `tradeday-fp-eod` | Quick Pay Intraday et fin de journée, Fast Pass fin de journée (25/50/100/150K) |

Non intégrés, faute de page officielle lue : MFFU **Rapid EOD** (vu seulement sur un article de blog) ; Builder 100K/150K ; Fast Pass Intraday (étiquetage contradictoire sur l'accueil) ; PRO+ de TPT et Live de MFFU/TradeDay (non modélisés comme programmes).

## 2. Règles vérifiées (sources officielles du site de l'entreprise)
**MyFundedFutures** : liste officielle des instruments lue en entier (les 16 futures du catalogue y figurent ; MGC limité à 3/5/10/15 micros, MBT traité comme mini, SI/HG/PL/NG/QG suspendus temporairement) ; cibles et drawdowns EOD de Rapid et Pro par taille ; Rapid funded en drawdown intraday (verrou à +100 $), buffers 1 100/2 100/3 100/4 600 $, 90/10, minimum 500 $, retrait toutes les 24 h ; Pro : retrait à 14 jours, minimum 1 000 $, 80/20, passage Live après 3 retraits ; Builder 50K : 5 retraits max, 2 000 $ par cycle, 80/20, news libres ; politique de news Tier 1 (2 min avant/après, interdit en Rapid et Pro Sim Funded seulement) ; liste officielle des pays restreints.
**Take Profit Trader** : trois stades (test EOD, PRO intraday, PRO+ EOD pour les nouveaux comptes) ; consistance 50 % en évaluation seulement ; 3 jours minimum ; retraits dès le jour 1, 80 % au-dessus d'un buffer égal au drawdown, aucun plafond ni minimum de jours, frais de 50 $ sous 250 $ ; news interdites en PRO/PRO+ (1 minute avant/après) ; fermeture automatique à 16 h 55 ET ; copy trading jusqu'à 5 comptes PRO ; futures CME/CBOT/NYMEX/COMEX seulement.
**TradeDay 2.0** : objectifs, drawdowns, limites de contrats et consistance par taille ; Quick Pay (30 %, retrait dès le jour 1, sans buffer, 250 $ minimum, 50/50 sous 4 000 $ puis 80/20, 90/10 en Live) ; Fast Pass (45 %, 5 jours profitables, plafonds 750 à 2 250 $ par cycle) ; day trading, fermeture 10 min avant la fin de session ; robots interdits ; CME Group seulement ; plateformes Tradovate et Rithmic.

## 3. Sources officielles
31 nouvelles sources (`data/sources.json`, ids `tp-*`, `mf-*`, `td-*`), toutes de type « official » (sites des entreprises). Les pages éditoriales/comparatives de TPT (blog) sont signalées dans leur libellé comme de fiabilité moindre.

## 4. Informations NON confirmées (principales)
- **Prix, promotions, frais de réinitialisation : aucun prix confirmé.** Observations datées (`durable: false`) dans `dynamic_observations` + `data/evidence/lot2a-2026-11-15.json`.
- **TPT** : liste des produits par symbole et pages de pays inaccessibles (centre d'aide `takeprofittrader.crunch.help` : 404 ; `help.takeprofittrader.com` : 404). Objectifs = 6 % × taille (calcul d'un pourcentage annoncé) ; drawdown connu seulement pour le 50K (2 000 $) ; contrats seulement 50K (6) et 150K (15). Ces montants viennent de pages éditoriales du site, pas d'une page de règles par taille.
- **MFFU** : contrats Rapid contradictoires sur la page (deux jeux de valeurs) ; plafond Pro de 100 000 $ ambigu (par cycle ou total) ; Rapid : plafond par retrait, nombre de retraits et passage au Live non indiqués ; Pro : overnight/week-end non lus ; Builder 25K : règles de retrait non lues (valeurs de l'article 50K) ; prix de la plupart des tailles ; **MyFundedFutures n'a pas de page nommant le Canada ou le Québec**.
- **TradeDay** : liste des produits par symbole non lue ; pays non nommés ; **minimum de jours : conflit entre les pages produit (5 ou 3 jours) et les Terms du 11 août 2026 (7 jours)** → non confirmé ; **modèle de facturation contradictoire** (« one-time » sur l'accueil, « per month » sur Make It Take It, « No Subscription Required ») → prix non confirmés ; drawdown funded des comptes « fin de journée » étiqueté de façon contradictoire (retenu : intraday pour Quick Pay).
- **Québec** : à vérifier pour tous les stades des 7 programmes. Pour MFFU, le Canada est absent de la liste restreinte mais aucune phrase ne le déclare admissible ; le programme de points MyFundedClub exclut l'Ontario et le Québec (programme promotionnel, non extrapolé à l'évaluation). 16 pays de la liste MFFU n'existent pas dans `countries.json` et ne sont pas encodés (BS, BW, KH, EC, GI, GY, JM, JO, KZ, KG, ME, NR, PA, QA, TW, TM) ; France métropolitaine hors Corse et Crimée non encodées.
- Restrictions news/overnight/asiatique/scalping/automatisation/copy trading : confirmées seulement lorsqu'une page officielle les énonce ; sinon « à vérifier ».

## 5. Adaptations du moteur
1. `checkMarkets` : si la liste de symboles n'est pas confirmée mais que le **type de contrat l'est** (« futures seulement »), un marché sans forme permise (ex. CFD) est désormais **indisponible** (avant : « à vérifier »). Cela sépare futures et CFD sans exiger une liste complète d'instruments. Programmes déjà intégrés inchangés.
2. Aucune modification de schéma. Modélisation : un programme par structure de drawdown (TradeDay), une `option` de variante pour deux versions de MLL (Builder 50K), dépôts de preuve pour les prix.
3. Nouveau script `scripts/build-lot2a-data.py` ; test mis à jour : `tests/mission3-lot1.test.ts` (ne compte plus que les programmes du lot 1).

## 6. Tests
`tests/mission4-lot2a.test.ts` (22 tests) : sources officielles, prix jamais confirmés, futures ≠ CFD, liste exhaustive MFFU, drawdown eval/funded par stade, news par stade, variantes MLL du Builder, conflits (contrats Rapid, plafond Pro, 7 jours TradeDay), Québec jamais « admis », divulgation des retraits, non-régression. Total : 216 réussis.
