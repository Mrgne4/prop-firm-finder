# MISSION 7 — Conception du questionnaire « entonnoir intelligent »
Statut : CONCEPTION SEULEMENT. Aucun code modifié. Le site publié reste en place. Développement après ta validation.

## 0. Constat chiffré (moteur actuel, 28 programmes réels, résident du Québec)
| Réponses cumulées | Programmes encore possibles |
|---|---|
| Futures sur indices | 10 (tous « à vérifier ») |
| + positions overnight | **1** |
| + overnight + annonces + deux étapes | **0** |
| Forex (sans préciser la forme) | 28 (les futures offrent 6E, donc tout « matche ») |
| Forex + une étape + budget < 50 $ | 15 |

Deux causes : (1) l'étudiant ne voit l'effet de ses choix qu'à la fin ; (2) tous les critères sont traités pareil (bloquants) alors que budget, drawdown, étapes ou plateforme sont des préférences. Le choix « Forex » est aussi trop vague : il faut demander la **forme** (CFD / futures) tôt.

## 1. Nouveau parcours utilisateur
Un bandeau fixe en haut de chaque question : **« 28 → 10 → 1 programmes possibles »** (puces cliquables par étape) + « dont N à vérifier ».
1. **Marché** (futures indices, forex, métaux…) → compteur.
2. **Forme** (CFD / futures / peu importe), seulement si le marché existe sous plusieurs formes.
3. **Résidence** (pays, province) — placée tôt : une exclusion confirmée est la contrainte la moins négociable et la moins chère à calculer.
4. **Instruments précis** (facultatif) : seuls ceux disponibles chez les programmes restants, avec le nombre.
5. **Ton trading** : style, horaires, overnight, week-end, annonces. Chaque case propose le cadenas « Indispensable ».
6. **Budget dynamique** (§3).
7. **Préférences** : nombre d'étapes, drawdown, plateforme, retraits (chacune avec le cadenas).
8. **Résultats en trois catégories** (§5).
Pour chaque option de la question courante, un badge **(N)** indique combien de programmes resteraient. Une option à (0) reste cliquable, avec « ⚠ Avec ton choix *overnight*, aucun programme ». Rien n'est caché ni désactivé sur la base d'une information inconnue.
**Critère goulot** : à chaque réponse, on recalcule le nombre de programmes en retirant un critère à la fois. Si retirer *overnight* fait passer de 1 à 9, le bandeau dit « *Overnight* est ce qui restreint le plus tes choix (−9) ».

## 2. Logique de filtrage
Chaque critère a un **état** (conservé du moteur actuel : ok / inconnu / échec confirmé) et un **poids** choisi par l'étudiant :
- **Contraintes indispensables** (par défaut) : instrument réellement disponible, résidence (admissible ou à vérifier), restrictions de trading incompatibles (overnight, week-end, annonces, session asiatique, scalping). L'instrument et la résidence ne sont pas modifiables. Les restrictions sont indispensables par défaut mais l'étudiant peut les passer en « souhaitable ».
- **Préférences ajustables** : budget, drawdown, nombre d'étapes, plateforme, retraits. Chacune peut être déclarée **indispensable** (cadenas). Un critère indispensable n'est **jamais** assoupli par l'outil : le bouton « assouplir » est remplacé par « 🔒 Tu l'as déclaré indispensable ».

Catégorie d'un programme (calculée sur ses variantes ; la meilleure variante l'emporte) :
- **C. Incompatible** : au moins un échec **confirmé** sur une contrainte indispensable (dont toute exclusion géographique confirmée). Une information inconnue n'envoie **jamais** en C.
- **A. Correspondance potentielle** : aucun échec confirmé sur un indispensable ni sur une préférence ; les inconnus sont listés « à vérifier ».
- **B. Alternative proche** : aucun échec confirmé sur un indispensable, mais ≥ 1 préférence en échec confirmé (ou prix observé hors budget). Le ou les ajustements sont nommés. Triées par nombre d'ajustements (au plus 2 affichées d'emblée, le reste dans « voir plus »).
Règles qui ne changent pas : jamais « admissible » sans confirmation ; règle Québec de la Mission 5 conservée (absence d'exclusion ≠ admissibilité) ; un programme avec lacune essentielle n'est jamais « compatible » mais reste en A comme « potentiel ».
Le « filtre étapes bloquant » de la Mission 5 est remplacé : par défaut une préférence, bloquante seulement si l'étudiant active le cadenas (même effet visible, choix explicite).

## 3. Budget dynamique
Affiché à partir des programmes encore possibles (A + B après les réponses précédentes).
- **Prix de référence d'un programme** (un seul par programme, jamais répété par variante) : (1) coût de départ confirmé ; (2) à défaut, plus bas prix observé « affiché » ou « à partir de », **hors code promo** ; (3) sinon inconnu.
- **Fourchettes** : seules celles qui contiennent ≥ 1 programme sont affichées, avec le nombre et les noms repliables, plus la ligne **« Prix inconnu (N) »**. Les prix en euros (FTMO) forment un groupe séparé, sans conversion.
- Chaque ligne porte la mention « indicatif, relevé le 15 novembre 2026 — Prix à vérifier ». Une phrase rappelle que les grands comptes coûtent plus cher.
- **Effet du choix** : prix confirmé > budget → échec confirmé de préférence (B). Prix observé > budget → B « au-dessus d'après le prix observé, à vérifier » (jamais échec confirmé). Prix observé ≤ budget → « dans le budget d'après un prix observé, à vérifier » (n'est jamais compté comme confirmé). Prix inconnu → à vérifier, **jamais** « sous le budget ».
- Options : fourchettes réelles, « Aucun budget défini », « Je ne sais pas » (affiche seulement l'éventail).

Exemple réel (futures, Québec, 10 programmes, chacun compté une fois) :
| Fourchette | Prog. | Détail |
|---|---|---|
| < 50 $ | 2 | TradeDay Quick Pay Intraday 39 $, Quick Pay EOD 49 $ (facturation unique ou mensuelle non tranchée) |
| 50–100 $ | 2 | Topstep 95 $ (confirmé, premier mois ; 198 $ avec frais d'activation), TradeDay Full Pay 99 $ |
| 100–200 $ | 3 | MFFU Rapid « dès 125 $ », MFFU Builder 125 $, Apex Intraday 167 $ |
| > 200 $ | 1 | Apex EOD 490 $ (49 $ avec code promo, non compté) |
| Inconnu | 2 | Take Profit Trader, MFFU Pro |

## 4. Résultats alternatifs (si A est vide)
Bandeau : « Aucun programme ne remplit tous tes critères. Voici les alternatives les plus proches », suivi de la suggestion calculée : « Si tu assouplis *overnight*, 9 programmes deviennent possibles. » Chaque carte de B contient quatre blocs :
- ✓ **Critères respectés** ; ✕ **Critères non respectés** (confirmés) ; ? **Informations non confirmées** ; → **Ajustement nécessaire**, avec un bouton qui l'applique (désactivé et expliqué s'il touche un critère indispensable).
Mock-up (profil overnight, Topstep) :
> **Topstep — Alternative proche**  ✓ Futures sur indices · ✓ Budget 95 $ (confirmé) · ? Admissibilité du Québec non confirmée · ✕ Positions overnight interdites (confirmé) · → *Renoncer à garder des positions la nuit.* Si « overnight » est indispensable, ce programme passe en **Incompatible**.

## 5. Page de résultats : trois catégories
- **A. Correspondances potentielles** (ouvert) — « Pourquoi ici : respecte tes contraintes connues ; reste à vérifier : … ».
- **B. Alternatives proches** (ouvert si A vide, sinon replié) — « Pourquoi ici : 1 ajustement : … ».
- **C. Incompatibles** (replié) — regroupés par raison : « 18 écartés : ne proposent pas de futures », « 9 écartés : overnight interdit (indispensable) ». Les exclusions géographiques confirmées sont nommées.
Chaque carte garde l'avertissement avant les liens et « Prix à vérifier ». Le lien « Copier mes critères » inclut les cadenas.

## 6. Modifications nécessaires au moteur
- `engine/answers.ts` : ajouter `required: CriterionKey[]` (cadenas) ; l'ancien « assouplir » devient `softened` posé uniquement par l'étudiant.
- `engine/evaluate.ts` : nouvelle fonction `classify()` → `{category: A|B|C, met[], missed[], unknown[], adjustments[]}` ; le statut actuel est conservé pour compatibilité. Fin de `steps_is_blocking`.
- Nouveau `engine/funnel.ts` : compte après chaque réponse, aperçu par option (look-ahead), critère goulot (retrait d'un critère à la fois), suggestion d'ajustement. 28 programmes × quelques dizaines d'options : instantané.
- Nouveau `engine/budget.ts` : prix de référence, fourchettes, groupe « inconnu », groupe euros.
- `quiz/steps.ts`, `pages/Quiz.tsx` : nouvel ordre, bandeau compteur, badges (N), cadenas. `pages/Results.tsx`, `ui/ProgramCard.tsx` : trois catégories et bloc « Pourquoi ». `engine/share.ts` : encoder les cadenas.
- Données : aucune nouvelle donnée ni changement de schéma (les prix observés et états existent déjà).
- Tests : reprise des 8 profils de la Mission 6 + scénarios (aucun programme ne satisfait tout ; budget qui élimine tout ; plusieurs prix inconnus ; une seule contrainte bloque ; préférence assouplie ; indispensable jamais assouplie), jeux de données synthétiques pour les cas extrêmes, puis parcours navigateur.

## 7. Exemples concrets de résultats attendus (données réelles)
1. **NQ + overnight (Québec)** : A = 1 (MFFU Pro, overnight non confirmé) ; C = 27 dont 9 futures « overnight interdit » (indispensable) ; si overnight passe en « souhaitable » : B = 9 futures avec l'ajustement « renoncer à overnight ». Suggestion : « En CFD (ex. FTMO Swing), l'overnight est permis : change la forme du marché pour voir ».
2. **Débutant, budget < 50 $, futures** : A = TradeDay QP (39 $, 49 $, prix observés, à vérifier) + programmes à prix inconnu ; Topstep (95 $ confirmé) passe en B « budget ». Aucun prix inconnu n'est compté sous le budget.
3. **Forex + 2 étapes indispensable** : A = 8 programmes à 2 étapes ; C = les autres, avec « une étape / trois étapes / sans challenge ». Si 2 étapes est seulement une préférence : les 1-Step passent en B avec « accepter une étape ».
4. **Aucune combinaison possible** : le bandeau affiche « 0 programme » dès l'étape fautive, nomme le goulot et propose l'ajustement ; l'étudiant n'arrive jamais à un écran vide.

## 8. Décisions à valider avant de coder
1. Restrictions (overnight, annonces…) indispensables **par défaut**, mais passables en « souhaitable » : d'accord ?
2. Prix observé au-dessus du budget → catégorie B (jamais C), car non confirmé : d'accord ?
3. Euros affichés séparément, sans conversion : d'accord ?
4. Question « forme » (CFD / futures) ajoutée tôt, résidence en 3ᵉ position : d'accord ?
5. Étapes redevient une préférence (cadenas pour la rendre bloquante), ce qui remplace la règle de la Mission 5 : d'accord ?

## 9. Look et logo
Je ne démarre pas le design sans ton logo : envoie-moi le fichier (SVG de préférence, sinon PNG haute résolution), tes couleurs ou une référence de ton ambiance, et si tu veux garder les polices actuelles. Je ne crée pas de logo à ta place. Le design suivra la validation de la logique ci-dessus, pour éviter de refaire l'interface deux fois.
