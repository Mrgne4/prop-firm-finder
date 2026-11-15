# Ajouter ou mettre à jour un programme

Aucun code à modifier : tout est dans `/data`.

## Ajouter une entreprise
1. `data/firms.json` : ajouter `{ "id", "name", "website", "demo": false, "description" }`.
2. `data/sources.json` : ajouter chaque page officielle consultée (`"type": "official"`, URL réelle).

## Ajouter un programme
1. Copier `data/programs/_template.json` vers `data/programs/<id>.json` (le nom du fichier = l'`id`).
2. Une entreprise = plusieurs programmes si les règles diffèrent (ex. EOD et Intraday : deux fichiers).
3. Pour **chaque** valeur importante : `status`, `value`, `sources` (ids de `sources.json`), `verified_at` (AAAA-MM-JJ).
   - Information trouvée → `"status": "confirmed"`, valeur, ≥ 1 source officielle, date.
   - Introuvable → `"status": "unconfirmed"`, `"value": null` (affiché « Non confirmé »). Ne jamais deviner.
   - La notion n'existe pas (ex. pas de limite quotidienne) → `"status": "not_applicable"`, `"value": null`.
4. Une ligne par taille de compte dans `variants` (prix, objectif, drawdown… varient selon la taille).
5. Restriction `conditional` : préciser la condition dans `note`. Elle donnera « À vérifier » tant qu'elle n'est pas évaluée.
6. Promotions temporaires : seulement dans `promos` (jamais dans les prix).
7. Programme sans challenge : `evaluation.steps` = 0, et `not_applicable` pour le drawdown et les restrictions d'évaluation.

## Vérifier
```
npm run validate   # schémas + cohérence ; le build échoue si une erreur subsiste
npm test
```

## Mettre à jour une règle
Modifier la valeur **et** `verified_at` (et la source si besoin), puis `npm run validate`.
Au-delà de 60 jours (`data/scoring.json › stale_after_days`), la donnée passe en « Vérification nécessaire ».

## Réglages du moteur (`data/scoring.json`)
Pondérations, multiplicateur de priorité, barèmes de coût et de retrait, tranches de budget, seuil de fraîcheur,
et `steps_is_blocking` (le nombre d'étapes est-il bloquant ? `false` par défaut).

## Retirer les démos avant la mise en ligne réelle
Supprimer `data/programs/demo-*.json`, les entrées `demo-*` de `firms.json` et `sources.json`.
