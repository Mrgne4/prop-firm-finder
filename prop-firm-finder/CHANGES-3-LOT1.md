# Mission 3 — Lot 1 (Topstep, Apex Trader Funding) — vérifié le 2026-11-15

Données fictives conservées (3 démos). Site non publié. Les 7 autres entreprises ne sont pas commencées.

## 1. Programmes identifiés
| Programme (fichier) | Tailles | Variantes |
|---|---|---|
| Trading Combine (Topstep) — `topstep-trading-combine` | 50K, 100K, 150K | 6 : chaque taille en « Standard » (activation 149 $) et « Sans frais d'activation » |
| Apex EOD Trail — `apex-eod-trail` | 25K, 50K, 100K, 150K | 4 |
| Apex Intraday Trail — `apex-intraday-trail` | 25K, 50K, 100K, 150K | 4 |

Hors modèle (volontairement) : produits « Topstep Labs » (défis à paiement unique), réactivation Back2Funded, comptes Live (Topstep et Apex), anciens comptes « Legacy » d'Apex, et l'option Apex « No Activation Fee » (prix non lus).

## 2. Règles vérifiées (source officielle lue)
**Topstep** : abonnement mensuel 49/99/199 $ (Standard) ou 95/149/229 $ (sans activation) ; activation 149 $ ; reset = prix du mois ; objectif 3 000/6 000/9 000 $ ; Maximum Loss Limit EOD 2 000/3 000/4 500 $ ; limite quotidienne optionnelle 1 000/2 000/3 000 $ ; contrats 5/10/15 (micros 10 pour 1) ; consistance 55 % (règle stricte) ; XFA : 90/10, minimum 125 $, deux chemins (Standard : 5 jours ≥150 $, plafond 5 000 $ ; Consistency : 3 jours, 40 %, plafond 6 000 $), MLL à 0 $ après le 1er retrait ; futures CME seulement (liste exhaustive), aucun Forex ; positions fermées à 15 h 10 CT ; TopstepX seule plateforme.
**Apex** : évaluation une étape, 30 jours, pas de consistance en évaluation, paiement unique ; PA simulé, 100 % des retraits, minimum 500 $, 6 retraits maximum, consistance 50 % aux retraits, safety net = drawdown + 100 $ ; drawdown PA 1 000/2 000/3 000/4 000 $ ; contrats PA 2/4/6/10 ; futures CME/COMEX/NYMEX/CBOT seulement ; fermer avant 16 h 59 ET ; automatisation et couverture interdites ; news : stratégie normale permise, pari bilatéral interdit.

## 3. Sources officielles
22 sources de type « official » dans `data/sources.json` (centres d'aide et sites de Topstep et d'Apex). Aucune valeur « confirmed » ne s'appuie sur un comparateur (test automatique).

## 4. Informations NON confirmées (jamais inventées)
- **Apex** : prix d'évaluation, frais d'activation (sauf 79 $ du 25K Intraday), objectifs de profit, drawdown/limite quotidienne d'évaluation, plafonds par retrait, plateformes. Les sites tiers se contredisent (ex. activation EOD 50K : 99/129/139 $).
- **Apex, instruments** : seuls RTY et 6E sont lus officiellement (liste « partielle ») ; NQ, ES, etc. = « à vérifier ». Suspension de l'or/métaux : affirmée par des tiers seulement.
- **Québec / pays** : aucune liste officielle complète lue pour les deux entreprises → éligibilité « non confirmée » → jamais COMPATIBLE pour un résident du Québec. Signal à vérifier : la FAQ officielle du programme Live d'Apex cite « Canada (toutes provinces sauf l'Ontario) » parmi les pays non disponibles.
- **Topstep** : nature simulée du XFA, règle des annonces (news), automatisation, scalping, session asiatique, contrats du Scaling Plan XFA, plafonds par taille.
- **Conflit résolu** : Topstep 150K = 199 $/mois (page officielle) ; consistance Combine = 55 % (page officielle).

## 5. Modifications du modèle de données
- Instruments : champ `underlying` (sous-jacent) et nouveaux contrats RTY, M2K, 6E, M6E, EURUSD (au comptant). Même sous-jacent, formes distinctes (NQ futures ≠ NAS100 CFD).
- Programme : `instruments_scope` (exhaustive/partial), `contract_types` (ex. futures seulement), `instrument_limits` (limité / à vérifier / suspendu).
- Variante : `option` (voie d'achat, ex. « Sans frais d'activation »), `funded.max_payout_usd` ; évaluation : `time_limit_days`.
- Moteur : critère facultatif et assouplissable « Instruments précis » (disponible / non disponible / à vérifier, par instrument), liste partielle → « à vérifier » plutôt qu'« incompatible » ; étape facultative dans le questionnaire ; champ `i` dans le lien de partage ; tableau instrument par instrument sur la fiche.
- Validateur : variantes en double (taille + option), limites sur instruments inconnus ou absents de la liste. Pays supplémentaires dans `countries.json`.

## 6. Tests
155 → 156 tests (126 avant), dont 30 nouveaux dans `tests/mission3-lot1.test.ts` : sources officielles, absence de valeurs inventées, 6 variantes Topstep, instruments un par un (NQ, MNQ, ES, MES, GC, MGC, CL, MCL, BTC/MBT, ETH/MET, EUR/USD, NAS100 CFD, 6E), exhaustif vs partiel, Québec, partage, validateur, fiche détail. Contrôle en vrai navigateur (mobile/tablette/bureau) : aucun débordement ni erreur JS.

## Régénérer les données
`node scripts/generate-demo-data.mjs 2026-11-15` puis `python3 scripts/build-lot1-data.py` (le premier conserve les données réelles).
