# RAPPORT MISSION 7 — Entonnoir intelligent (version fonctionnelle)
Statut : à tester par Morgane. Non validée définitivement. Le site publié reste inchangé. Logo et refonte visuelle : non commencés.

## 1. Ce qui a été fait
- **Questionnaire dynamique** : bandeau « N programmes possibles » recalculé après chaque réponse (ex. 28 → 10 → 1), nombre de programmes à côté de chaque option, critère qui restreint le plus nommé (avec « le rendre seulement souhaitable »). Une option à 0 reste cliquable avec un avertissement. L'étudiant n'arrive jamais à un écran vide.
- **Ordre** : marché → forme (si utile) → résidence (3ᵉ) → instruments → style → horaires → budget → étapes → drawdown → priorité.
- **Budget dynamique** : fourchettes réelles avec le nombre de programmes, « prix inconnu » à part, euros à part (sans conversion), « Prix à vérifier » partout.
- **Résultats A / B / C** avec bloc « Pourquoi ici » (respecté / non respecté / à vérifier / ajustement), C regroupé par raison, suggestions de changement de stratégie dans un bloc séparé.
- **Indispensable / souhaitable** : marché, instruments, résidence toujours indispensables ; restrictions (nuit, week-end, annonces, session asiatique, scalping) indispensables par défaut mais modifiables ; budget, étapes, drawdown, plateforme souhaitables par défaut avec une petite case « Indispensable pour moi ». Les cadenas sont dans le lien de partage.
- Nouveaux critères vérifiés par le moteur : type de drawdown et plateforme.

## 2. Tes trois corrections
1. **Budget** : prix confirmé > plafond et budget indispensable → **C**. Prix seulement observé : jamais « échec », jamais « ok » ; budget indispensable → reste en A mais compté à part sous « À confirmer (budget) », jamais dans les « possibles » ni présenté comme confirmé ; budget souhaitable → B. Prix en euros ou inconnu : jamais comparé, jamais « sous le budget ». Pour une taille de compte sans prix relevé, on utilise comme borne basse le prix observé d'une taille inférieure.
2. **Compteurs** : l'unité est le **programme** (une offre d'une entreprise), jamais la taille de compte. Chaque programme est compté une fois, dans une seule catégorie : possibles + à confirmer + alternatives + incompatibles = nombre total de programmes (28). Les alternatives sont comptées à part. Fourchettes + inconnus + euros = programmes encore possibles. L'unité est expliquée sous « Comment on compte ? ».
3. **Contraintes verrouillées** : aucune carte A ou B n'a un critère indispensable en échec (testé par propriété sur de nombreuses combinaisons). Un programme qui viole un critère indispensable apparaît seulement dans « Et si tu changeais de stratégie ? », bloc séparé, expliqué (« ne sont pas compatibles… changement de stratégie »). L'outil ne change jamais un cadenas de lui-même.
Principe d'ergonomie : une seule question de plus n'a été ajoutée à aucun moment ; les cadenas sont de petites cases discrètes qui n'apparaissent qu'après un choix précis ; on avance sans y toucher.

## 3. Tests
- **Automatisés** : 352 tests passent (12 fichiers), dont `tests/mission7.test.tsx` (38 tests : corrections 1-3, six scénarios obligatoires, huit profils, questionnaire). `npm run build` réussit.
- **Navigateur réel** (Chrome, version de production sans démos, mobile / tablette / bureau) : quatre parcours — débutant ≤ 100 $, overnight indispensable puis souhaitable, budget ≤ 50 $ indispensable, aucune combinaison possible. Résultat : aucun échec, aucune erreur JavaScript, aucun débordement horizontal, aucune démo visible, aucun programme présenté « COMPATIBLE », avertissement avant les liens présent. Script : `tests-e2e/browser-check.py`.

## 4. Résultats sur plusieurs profils (28 programmes, résident du Québec)
A = possibles · B = alternatives proches · C = incompatibles. Chiffres produits par `scripts/mission7-report.ts`.
```
Catalogue : 28 programmes, 9 entreprises, 131 variantes (tailles de compte, non comptées). Sans réponse : A=28

=== 1 Débutant québécois, budget ≤ 100 $ (futures)
A=7 (dont 7 à vérifier, 4 entreprises) · à confirmer=0 · B=3 · C=18 · total=28
  A : Trading Combine (Topstep) | Builder (MyFundedFutures) | Pro (MyFundedFutures) | Test → PRO → PRO+ (Take Profit Trader) | Fast Pass fin de journée (TradeDay) | Quick Pay fin de journée (TradeDay) | Quick Pay Intraday (TradeDay)
  B : Rapid (MyFundedFutures) → budget | Apex Intraday Trail → budget | Apex EOD Trail → budget
  C par raison : markets: 18
  Goulot : Budget (+3)
  Budget (10 possibles) : Moins de 50 $=2, 50 à 100 $=3, 100 à 200 $=3, Plus de 200 $=1, Prix inconnu=1

=== 2 MNQ exclusivement
A=10 (dont 10 à vérifier, 5 entreprises) · à confirmer=0 · B=0 · C=18 · total=28
  A : Rapid (MyFundedFutures) | Apex Intraday Trail | Builder (MyFundedFutures) | Apex EOD Trail | Trading Combine (Topstep) | Pro (MyFundedFutures) | Test → PRO → PRO+ (Take Profit Trader) | Fast Pass fin de journée (TradeDay) | Quick Pay fin de journée (TradeDay) | Quick Pay Intraday (TradeDay)
  C par raison : instruments+markets: 18

=== 3 NAS100 CFD exclusivement
A=18 (dont 18 à vérifier, 4 entreprises) · à confirmer=0 · B=0 · C=10 · total=28
  A : Challenge 1-Step — type Standard (FTMO) | Challenge 1-Step — type Swing (FTMO) | High Stakes (The5ers) | Instant Account (FTMO) | Stellar Instant (FundedNext) | Challenge 2-Step — type Standard (FTMO) | Challenge 2-Step — type Swing (FTMO) | Stellar 2-Step (FundedNext) | Stellar 1-Step (FundedNext) | Stellar Lite (FundedNext) | Hyper Growth (The5ers) | Zero (FundingPips) | Bootcamp (The5ers) | 2 Step Flex (FundingPips) | 1 Step (FundingPips) | 2 Step Standard (FundingPips) | 2 Step Pro (FundingPips) | 1 Step Flex (FundingPips)
  C par raison : instruments+markets: 6, markets: 4

=== 4 Positions overnight (futures)
A=1 (dont 1 à vérifier, 1 entreprises) · à confirmer=0 · B=0 · C=27 · total=28
  A : Pro (MyFundedFutures)
  C par raison : overnight: 9, markets: 18
  Goulot : Positions overnight (+9)
  Stratégie « Positions overnight » : +9 (Rapid (MyFundedFutures), Apex Intraday Trail, Builder (MyFundedFutures), Apex EOD Trail, Trading Combine (Topstep), Test → PRO → PRO+ (Take Profit Trader), Fast Pass fin de journée (TradeDay), Quick Pay fin de journée (TradeDay), Quick Pay Intraday (TradeDay))

=== 4b Overnight souhaitable seulement
A=1 (dont 1 à vérifier, 1 entreprises) · à confirmer=0 · B=9 · C=18 · total=28
  A : Pro (MyFundedFutures)
  B : Rapid (MyFundedFutures) → overnight | Apex Intraday Trail → overnight | Builder (MyFundedFutures) → overnight | Apex EOD Trail → overnight | Trading Combine (Topstep) → overnight | Test → PRO → PRO+ (Take Profit Trader) → overnight | Fast Pass fin de journée (TradeDay) → overnight | Quick Pay fin de journée (TradeDay) → overnight | Quick Pay Intraday (TradeDay) → overnight
  C par raison : markets: 18
  Goulot : Positions overnight (+9)

=== 5 Annonces économiques (futures)
A=10 (dont 10 à vérifier, 5 entreprises) · à confirmer=0 · B=0 · C=18 · total=28
  A : Rapid (MyFundedFutures) | Apex Intraday Trail | Builder (MyFundedFutures) | Apex EOD Trail | Trading Combine (Topstep) | Pro (MyFundedFutures) | Test → PRO → PRO+ (Take Profit Trader) | Fast Pass fin de journée (TradeDay) | Quick Pay fin de journée (TradeDay) | Quick Pay Intraday (TradeDay)
  C par raison : markets: 18

=== 6 Forex, deux étapes (préférence)
A=8 (dont 8 à vérifier, 4 entreprises) · à confirmer=0 · B=10 · C=10 · total=28
  A : High Stakes (The5ers) | Challenge 2-Step — type Standard (FTMO) | Challenge 2-Step — type Swing (FTMO) | Stellar 2-Step (FundedNext) | Stellar Lite (FundedNext) | 2 Step Flex (FundingPips) | 2 Step Standard (FundingPips) | 2 Step Pro (FundingPips)
  B : Challenge 1-Step — type Standard (FTMO) → steps | Challenge 1-Step — type Swing (FTMO) → steps | Instant Account (FTMO) → steps | Stellar Instant (FundedNext) → steps | Stellar 1-Step (FundedNext) → steps | Hyper Growth (The5ers) → steps | Zero (FundingPips) → steps | Bootcamp (The5ers) → steps | 1 Step (FundingPips) → steps | 1 Step Flex (FundingPips) → steps
  C par raison : markets: 10
  Goulot : Type d'évaluation (+10)

=== 6b Forex, deux étapes INDISPENSABLE
A=8 (dont 8 à vérifier, 4 entreprises) · à confirmer=0 · B=0 · C=20 · total=28
  A : High Stakes (The5ers) | Challenge 2-Step — type Standard (FTMO) | Challenge 2-Step — type Swing (FTMO) | Stellar 2-Step (FundedNext) | Stellar Lite (FundedNext) | 2 Step Flex (FundingPips) | 2 Step Standard (FundingPips) | 2 Step Pro (FundingPips)
  C par raison : markets+steps: 10, steps: 10
  Goulot : Type d'évaluation (+10)
  Stratégie « Type d'évaluation » : +10 (Challenge 1-Step — type Standard (FTMO), Challenge 1-Step — type Swing (FTMO), Instant Account (FTMO), Stellar Instant (FundedNext), Stellar 1-Step (FundedNext), Hyper Growth (The5ers), Zero (FundingPips), Bootcamp (The5ers), 1 Step (FundingPips), 1 Step Flex (FundingPips))

=== 7 Privilégie les retraits
A=10 (dont 10 à vérifier, 5 entreprises) · à confirmer=0 · B=0 · C=18 · total=28
  A : Test → PRO → PRO+ (Take Profit Trader) | Apex Intraday Trail | Apex EOD Trail | Builder (MyFundedFutures) | Rapid (MyFundedFutures) | Trading Combine (Topstep) | Pro (MyFundedFutures) | Fast Pass fin de journée (TradeDay) | Quick Pay fin de journée (TradeDay) | Quick Pay Intraday (TradeDay)
  C par raison : markets: 18

=== 8 Sans préférence
A=10 (dont 10 à vérifier, 5 entreprises) · à confirmer=0 · B=0 · C=18 · total=28
  A : Rapid (MyFundedFutures) | Apex Intraday Trail | Builder (MyFundedFutures) | Apex EOD Trail | Trading Combine (Topstep) | Pro (MyFundedFutures) | Test → PRO → PRO+ (Take Profit Trader) | Fast Pass fin de journée (TradeDay) | Quick Pay fin de journée (TradeDay) | Quick Pay Intraday (TradeDay)
  C par raison : markets: 18

=== X Aucune combinaison : overnight + annonces + 2 étapes + ≤ 50 $ indispensables
A=0 (dont 0 à vérifier, 0 entreprises) · à confirmer=0 · B=0 · C=28 · total=28
  C par raison : markets: 8, budget+overnight+steps: 1, overnight+steps: 8, markets+steps: 10, steps: 1
  Goulot : Type d'évaluation (+1)
  Stratégie « Type d'évaluation » : +1 (Pro (MyFundedFutures))

=== Y Budget ≤ 50 $ indispensable (futures)
A=5 (dont 5 à vérifier, 2 entreprises) · à confirmer=4 · B=0 · C=19 · total=28
  A : Builder (MyFundedFutures) | Pro (MyFundedFutures) | Fast Pass fin de journée (TradeDay) | Quick Pay fin de journée (TradeDay) | Quick Pay Intraday (TradeDay) | Rapid (MyFundedFutures) [budget à confirmer] | Apex Intraday Trail [budget à confirmer] | Apex EOD Trail [budget à confirmer] | Test → PRO → PRO+ (Take Profit Trader) [budget à confirmer]
  C par raison : budget: 1, markets: 18
  Goulot : Budget (+5)
  Stratégie « Budget » : +1 (Trading Combine (Topstep))
  Budget (10 possibles) : Moins de 50 $=2, 50 à 100 $=3, 100 à 200 $=3, Plus de 200 $=1, Prix inconnu=1
```
Lecture : avec « overnight » indispensable, 1 programme reste possible et 9 sont suggérés à part ; avec « overnight » souhaitable, ces 9 deviennent des alternatives proches avec l'ajustement nommé. Aucun programme n'est « compatible » confirmé pour le Québec : l'admissibilité provinciale n'est pas confirmée (règle des missions précédentes).

## 5. Limites restantes
- Les prix sont majoritairement **observés**, pas confirmés : le budget reste très souvent « à vérifier ». Plusieurs tailles de compte n'ont aucun prix relevé.
- Les prix observés des grandes tailles de compte sont estimés par une borne basse (taille inférieure) : hypothèse « un plus grand compte ne coûte pas moins cher ».
- 117 informations essentielles manquent encore (AUDIT-DONNEES.md) : beaucoup de programmes restent « à vérifier ».
- Tous les programmes du Québec restent « à vérifier » : aucune admissibilité provinciale confirmée.
- Les suggestions de stratégie changent un critère à la fois (pas de combinaisons).
- Le critère « retraits » reste un classement, pas un critère bloquant.
- Prix en euros (FTMO) non convertis, donc jamais classés dans une fourchette en dollars.
- Aperçu des options : calculé en direct ; instantané sur 28 programmes, à surveiller si le catalogue grossit beaucoup.
- Look, logo, charte graphique : pas encore traités.
