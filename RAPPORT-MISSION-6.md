# MISSION 6 — Contrôle final avant lancement (site NON publié)
Date : 2026-11-15. Aucune fonctionnalité ajoutée ; architecture et design inchangés. Simulation : version ÉTUDIANTE (sans démos), 28 programmes réels, résidence Québec (`scripts/profiles-report.ts`).

## 1. Résultats des huit profils (Québec)
| # | Profil | Compatibles | À vérifier | Incompatibles |
|---|---|---|---|---|
| 1 | Débutant québécois, budget < 100 $ (futures) | 0 | 10 | 18 |
| 2 | MNQ exclusivement | 0 | 10 | 18 |
| 3 | NAS100 CFD exclusivement | 0 | 18 | 10 |
| 4 | Positions overnight (futures) | 0 | 1 | 27 |
| 5 | Annonces économiques (futures) | 0 | 10 | 18 |
| 6 | Challenge à deux étapes (forex/CFD) | 0 | 8 | 20 |
| 7 | Privilégie les retraits (futures) | 0 | 10 | 18 |
| 8 | Sans préférence (futures) | 0 | 10 | 18 |

Lecture et anomalies expliquées :
- **Aucun « compatible » pour un résident du Québec : voulu.** Aucune page officielle ne confirme l'admissibilité du Québec, et les champs essentiels incomplets (prix, funded, annonces…) bloquent « compatible ». Les programmes classés « à vérifier » sont les seuls réellement possibles ; ils sont triés par score.
- **1 (budget)** : seul Topstep a un prix confirmé (95 $ le premier mois pour 50 K « sans frais d'activation ») → budget ok à 100 $, exclu à 50 $. Tous les autres prix sont inconnus → budget « à vérifier », jamais « dans le budget » (testé sur futures et forex, deux budgets).
- **2 (MNQ)** : les 18 CFD sont exclus (pas de futures). Apex reste « à vérifier » : MNQ absent de la liste partielle lue, ce qui n'est pas une exclusion. TPT et TradeDay : liste d'instruments non confirmée.
- **3 (NAS100 CFD)** : les 10 programmes futures sont exclus ; FTMO, FundedNext, FundingPips, The5ers restent « à vérifier » (liste d'instruments partielle ou admissibilité non confirmée), aucun n'est exclu à tort.
- **4 (overnight)** : tous les programmes futures interdisent l'overnight, sauf MyFundedFutures Pro (non confirmé) → un seul « à vérifier ». Résultat plausible : l'étudiant doit regarder les CFD (swing FTMO).
- **5 (annonces)** : règles « sous conditions » ou inconnues → jamais « compatible » (Apex, MFFU, Topstep…).
- **6 (deux étapes)** : 8 programmes à deux étapes restent ; 1 étape, 3 étapes (Bootcamp) et sans challenge sont exclus (filtre bloquant).
- **7 (retraits)** : l'avertissement « conditions de retrait incomplètes » est présent sur chaque programme concerné.
- **8 (sans préférence)** : aucun programme futures n'est exclu hors marché.

## 2. Anomalies corrigées
1. Cartes : Topstep affichait « Forex », « Bitcoin » parmi les marchés alors que ce sont des futures sans CFD ni Forex au comptant → ajout de la ligne **« Type de contrats »** (« Contrats futures (pas de CFD) » / « CFD / marge, comptes simulés (pas de futures) »).
2. Cartes : aucune indication des règles pouvant bloquer un retrait → ligne **« Règles connues pouvant bloquer un retrait »** (consistance, délais, jours gagnants, safety net, minimum) ; sinon « Non confirmé (ne suppose pas qu'il n'y en a pas) ».
3. **Avertissement** « Vérifie les prix, les règles et ton admissibilité directement auprès de l’entreprise avant d’acheter un challenge. » affiché AVANT tout lien vers une prop firm : cartes, en-tête de détail, bloc entreprise, tableau des prix observés, liste des sources. Le lien « site officiel » de la ligne de prix des cartes a été retiré (il précédait l'avertissement).
4. Message de résidence : « Admissibilité géographique non confirmé » (accord erroné) → « information non confirmée… Vérifie sur le site officiel avant tout achat. »
5. Tests ajoutés (`tests/mission6.test.tsx`, 34) : invariants des huit profils, budget, MNQ / NAS100, overnight / annonces, deux étapes, retraits, 117 lacunes (aucun programme avec lacune essentielle n'est « compatible », tous pays et marchés), avertissement avant chaque lien (ordre du DOM).

## 3. Risques résiduels
1. Aucun prix n'est confirmé (sauf Topstep) : le comparateur ne peut pas encore classer par coût ; les prix observés datent du 2026-11-15 (à relire sous 60 jours).
2. Résultats Québec : 0 « compatible » tant que le Québec n'est pas confirmé par les firmes ; possible frustration, mais honnête.
3. Listes d'instruments partielles (FTMO, The5ers, FundingPips, Apex) : « à vérifier » plutôt que « disponible ».
4. Contradictions entre pages officielles (The5ers 8 %/10 %, FundedNext Lite, FundingPips 80/85 %, TradeDay) conservées « non confirmées ».
5. Les règles des firmes changent vite : la fraîcheur de 60 jours n'est contrôlée qu'au chargement.
6. Site public sur GitHub Pages ; la mention éducative et l'avertissement ne remplacent pas un avis professionnel.
7. Hors Québec, un pays « admis » (FTMO « ouvert à tous sauf ») n'est pas une garantie de paiement : message conservé.

## 4. Contrôles finaux
Validation JSON OK (31 programmes, 3 démo retirés en production) · 313 tests sur 11 fichiers OK · typecheck OK · build OK · navigateur (mobile 390 / tablette 820 / bureau 1366) : parcours étudiant complet, aucune démo, avertissement et « Prix à vérifier » présents, 0 débordement, 0 erreur JS.
