#!/usr/bin/env python3
"""Mission 5 : dérive `observed_prices` (observations de prix structurées) des `dynamic_observations` existantes.
Aucun prix n'est inventé : seules les valeurs déjà relevées sur une page officielle sont reprises ; ce qui ne se rattache pas
sûrement à une taille de compte reste « sans variante » ou n'est pas affiché (The5ers : tailles non nommées)."""
import json, glob, re, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
for f in sorted(glob.glob(ROOT + '/programs/*.json')):
    p = json.load(open(f))
    if p.get('demo'): continue
    vids = {v['id'] for v in p['variants']}
    out = []
    def add(o, vid, label, amount, cur, kind, note=None):
        if vid is not None and vid not in vids: vid = None
        out.append({'variant_id': vid, 'label': label, 'amount': amount, 'currency': cur, 'kind': kind, 'observed_on': o['consulted_at'], 'source': o['source'], 'note': note})
    for o in p.get('dynamic_observations') or []:
        ob = o['observed']
        if p['id'].startswith('apex'):
            vid = o['parameters'].get('picker_balance')
            add(o, vid, o['label'], ob['prix_affiche_usd'], 'USD', 'affiche')
            if ob.get('prix_avec_code_promo_usd') is not None: add(o, vid, o['label'] + ' — avec code promo', ob['prix_avec_code_promo_usd'], 'USD', 'promo', "Code promotionnel : jamais inclus dans le coût de départ.")
            continue
        for k, v in ob.items():
            m = re.fullmatch(r'prix_(\d+k)_(usd|eur)', k)
            if m: add(o, m.group(1), o['label'], v, m.group(2).upper(), 'affiche'); continue
            m = re.fullmatch(r'(\d+k)_prix_affiche_usd', k)
            if m: add(o, m.group(1), o['label'], v, 'USD', 'affiche', o.get('note') and "Facturation unique ou mensuelle non tranchée par la source."); continue
            if k == 'prix_affiche_usd' and p['id'].startswith('myfundedfutures'): add(o, None, o['label'] + " (non rattaché à une taille)", v, 'USD', 'affiche'); continue
            if k == 'a_partir_de_usd': add(o, None, o['label'] + " — « à partir de »", v, 'USD', 'a_partir_de'); continue
            if re.fullmatch(r'prix_entree(_1step_flex)?_usd', k): add(o, None, "Prix d'entrée annoncé (taille la plus petite, non précisée)", v, 'USD', 'a_partir_de'); continue
            m = re.fullmatch(r'mll_(defaut|add_on)_(liste|30pct|40pct)_usd', k)
            if m:
                vid = '50k-mll-defaut' if m.group(1) == 'defaut' else '50k-mll-add-on'
                kind = 'affiche' if m.group(2) == 'liste' else 'promo'
                lab = o['label'] + {'liste': ' — prix de liste', '30pct': ' — rabais 30 %', '40pct': ' — rabais 40 %'}[m.group(2)]
                add(o, vid, lab, v, 'USD', kind, None if kind == 'affiche' else "Rabais à nombre d'utilisations limité : jamais inclus dans le coût de départ."); continue
            if k in ('mensualite_usd_min', 'mensualite_usd_max'):
                add(o, None, o['label'] + (' — plus bas observé' if k.endswith('min') else ' — plus haut observé'), v, 'USD', 'mensuel', "Mensualité promotionnelle avec code ; varie selon la taille du compte (non rattachée ici)."); continue
    if out: p['observed_prices'] = out
    elif 'observed_prices' in p: del p['observed_prices']
    json.dump(p, open(f, 'w'), ensure_ascii=False, indent=2)
    print(p['id'], len(out))
