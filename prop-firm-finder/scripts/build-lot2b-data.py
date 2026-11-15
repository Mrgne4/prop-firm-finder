#!/usr/bin/env python3
"""Lot 2B (Mission 4B) : FTMO, The5ers, FundedNext, FundingPips — programmes Forex / CFD (comptes SIMULÉS).
Chaque valeur « confirmed » cite une page du site OFFICIEL de l'entreprise lue le 2026-11-15 ;
tout le reste est « unconfirmed » / « not_applicable ». Aucune valeur n'est inventée.
Les montants en dollars dérivés d'un POURCENTAGE officiel sont calculés (pourcentage × taille) et signalés comme tels.
Les prix et promotions sont des OBSERVATIONS DATÉES (durable=false), jamais des prix confirmés.
Aucun de ces programmes n'est un programme futures : contract_types = cfd / spot."""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
D = '2026-11-15'
EV = 'data/evidence/lot2b-2026-11-15.json'

def conf(v, src, note=None):
    o = {'status': 'confirmed', 'value': v, 'sources': src if isinstance(src, list) else [src], 'verified_at': D}
    if note: o['note'] = note
    return o
def unc(note=None):
    o = {'status': 'unconfirmed', 'value': None, 'sources': [], 'verified_at': None}
    if note: o['note'] = note
    return o
def na(note=None):
    o = {'status': 'not_applicable', 'value': None, 'sources': [], 'verified_at': None}
    if note: o['note'] = note
    return o
def restr(ev, fu): return {'evaluation': ev, 'funded': fu}
def both(v, src, note=None): return restr(conf(v, src, note), conf(v, src, note))
UNK = lambda: {k: restr(unc(), unc()) for k in ['asian_session', 'scalping', 'copy_trading']}
def pc(p, size, src, why=''):
    return conf(round(size * p / 100), src, f"{p} % × {size:,} $ (calcul à partir du pourcentage officiel).".replace(',', ' ') + (' ' + why if why else ''))

# ------------------------------------------------------------------ pays manquants du catalogue géographique
_cp = os.path.join(ROOT, 'countries.json')
_c = set(json.load(open(_cp)))
_c |= {'BL', 'ER'}
json.dump(sorted(_c), open(_cp, 'w'), ensure_ascii=False, indent=2)
CC = _c
def codes(s):
    ok = [c for c in s.split() if c in CC]; skipped = [c for c in s.split() if c not in CC]
    return ok, skipped

# ------------------------------------------------------------------ sources
def O(i, l, u, **extra): d = {'id': i, 'label': l, 'url': u, 'type': 'official'}; d.update(extra); return d
def DYN(i, l, u, params): return O(i, l, u, durable=False, consulted_at=D, evidence_file=EV, parameters=params)
SOURCES = [
 # FTMO
 O('ft-how', "FTMO — How it works (produits, tailles)", 'https://ftmo.com/en/how-it-works/'),
 O('ft-2step', "FTMO — Challenge 2-Step (objectifs de trading)", 'https://ftmo.com/en/2-step-challenge/'),
 O('ft-1step', "FTMO — Challenge 1-Step (objectifs de trading)", 'https://ftmo.com/en/1-step-challenge/'),
 O('ft-1blog', "FTMO — blog officiel : Introducing the 1-Step FTMO Challenge (note du 5 octobre 2026)", 'https://ftmo.com/en/blog/introducing-the-1-step-ftmo-challenge/'),
 O('ft-dd', "FTMO — blog officiel : Trading and Drawdowns", 'https://ftmo.com/en/blog/drawdowns/'),
 O('ft-promo1', "FTMO — page promo 1-Step (règles par taille)", 'https://promo.ftmo.com/new-1-step-challenge/'),
 O('ft-instant', "FTMO — blog officiel : Introducing the FTMO Instant Account", 'https://ftmo.com/en/blog/introducing-the-ftmo-instant-account/'),
 O('ft-trial', "FTMO — Free Trial (tableau comparatif des objectifs 1-Step / 2-Step / Instant)", 'https://ftmo.com/en/ftmo-free-trial/'),
 O('ft-who', "FTMO — Who can join FTMO? (pays restreints CFD)", 'https://ftmo.com/en/faq/who-can-join-ftmo/'),
 O('ft-news', "FTMO — Can I trade news?", 'https://ftmo.com/en/faq/can-i-trade-news/'),
 O('ft-hold', "FTMO — Can I hold positions overnight or over the weekend?", 'https://ftmo.com/en/faq/do-i-have-to-close-my-positions-overnight-or-before-the-weekend/'),
 O('ft-swing', "FTMO — What is the Swing account type?", 'https://ftmo.com/en/faq/what-is-the-swing-account-type-and-how-does-it-work/'),
 O('ft-platforms', "FTMO — Which platforms can I use for trading?", 'https://ftmo.com/en/faq/which-platforms-can-i-use-for-trading/'),
 O('ft-instr', "FTMO — Which instruments can I trade? (version AU de la FAQ)", 'https://ftmo.com/au/faq/which-instruments-can-i-trade-and-what-strategies-am-i-allowed-to-use/'),
 O('ft-withdraw', "FTMO — How do I withdraw my profits? (version AU de la FAQ)", 'https://ftmo.com/au/faq/how-do-i-withdraw-my-profits/'),
 O('ft-scaling', "FTMO — Reward Growth and Scaling Plan", 'https://ftmo.com/en/reward-growth-and-scaling-plan/'),
 O('ft-futures-who', "FTMO — Who can join FTMO Futures? (produit futures distinct, non modélisé)", 'https://ftmo.com/en/futures/faq/who-can-join-ftmo-futures/'),
 DYN('ft-price-2', "FTMO — Challenge 2-Step : prix affichés en euros (observation datée)", 'https://ftmo.com/lp/modern-prop-trading-firm-that-you-can-trust/', {'page': 'lp/modern-prop-trading-firm', 'devise': 'EUR'}),
 DYN('ft-price-1', "FTMO — Challenge 1-Step : prix affichés en euros (observation datée)", 'https://promo.ftmo.com/new-1-step-challenge/', {'page': 'promo/new-1-step-challenge', 'devise': 'EUR'}),
 DYN('ft-price-inst', "FTMO — Instant Account : prix affichés en dollars (observation datée)", 'https://promo.ftmo.com/instant-account/us/', {'page': 'promo/instant-account/us', 'devise': 'USD'}),
 # The5ers
 O('t5-compare', "The5ers — blog officiel : comparatif des programmes (page éditoriale, contient des contradictions internes)", 'https://the5ers.com/challenge-programs-bootcamp-high-stakes-hyper-growth-explained/'),
 O('t5-high', "The5ers — page programme High Stakes", 'https://the5ers.com/high-stakes/'),
 O('t5-hs-rules', "The5ers — FAQ : règles générales du programme High Stakes", 'https://the5ers.com/faqs/what-are-the-general-rules-for-the-high-stakes-program/'),
 O('t5-hs-news', "The5ers — FAQ : nouvelles dans le programme High Stakes", 'https://the5ers.com/faqs/is-news-trading-allowed-in-the-high-stakes-program2024/'),
 O('t5-hs-pay', "The5ers — FAQ : politique de retrait High Stakes", 'https://the5ers.com/faqs/payout-policy-and-hub-credit-in-the-high-stakes-program/'),
 O('t5-hyper', "The5ers — page programme Hyper Growth", 'https://the5ers.com/hyper-growth/'),
 O('t5-boot', "The5ers — page programme Bootcamp", 'https://the5ers.com/bootcamp/'),
 O('t5-btw', "The5ers — site communautaire officiel (btw.the5ers.com) : tableaux des programmes (page ancienne)", 'https://btw.the5ers.com/community/market-structure-assignment/'),
 O('t5-consist', "The5ers — blog officiel : consistance et drawdown par programme", 'https://the5ers.com/fixed-vs-dynamic-profit-targets/'),
 O('t5-who', "The5ers — Who can join The5ers? (pays non servis)", 'https://the5ers.com/faqs/who-can-join-the5ers/'),
 O('t5-terms', "The5ers — Terms and Conditions (Forbidden Territory)", 'https://the5ers.com/terms-and-conditions/'),
 O('t5-accounts', "The5ers — centre d'aide : nombre de comptes permis", 'https://help.the5ers.com/how-many-the5ers-accounts-can-i-have/'),
 DYN('t5-price', "The5ers — tarifs affichés sur la page communautaire (observation datée, page ancienne)", 'https://btw.the5ers.com/community/market-structure-assignment/', {'page': 'btw.the5ers.com', 'age_page_jours': '374'}),
 # FundedNext
 O('fn-1', "FundedNext — Stellar 1-Step CFD (règles)", 'https://fundednext.com/cfds/stellar-1-step'),
 O('fn-2', "FundedNext — Stellar 2-Step CFD (règles)", 'https://fundednext.com/cfds/stellar-2-step'),
 O('fn-lite', "FundedNext — Stellar Lite CFD (règles)", 'https://fundednext.com/cfds/stellar-lite'),
 O('fn-inst', "FundedNext — Stellar Instant CFD (règles)", 'https://fundednext.com/cfds/stellar-instant'),
 O('fn-help1', "FundedNext — centre d'aide : Stellar 1-Step Account", 'https://help.fundednext.com/en/articles/17252927-stellar-1-step-account'),
 O('fn-blog2', "FundedNext — blog officiel : CFDs Stellar 2-Step expliqué", 'https://fundednext.com/blog/fundednext-cfds-stellar-2-step-explained'),
 O('fn-blog1', "FundedNext — blog officiel : CFDs Stellar 1-Step expliqué", 'https://fundednext.com/blog/fundednext-cfds-stellar-1-step-explained'),
 O('fn-vs', "FundedNext — blog officiel : Stellar 1-Step vs 2-Step", 'https://fundednext.com/blog/stellar-1-step-vs-2-step-challenge'),
 O('fn-hold', "FundedNext — centre d'aide : positions overnight et week-end", 'https://help.fundednext.com/en/articles/11982358-does-fundednext-allow-holding-trades-over-the-night-weekend'),
 O('fn-countries', "FundedNext — centre d'aide : pays restreints pour les CFD", 'https://help.fundednext.com/en/articles/8020080-are-any-countries-restricted-on-fundednext-cfds'),
 O('fn-terms', "FundedNext — Terms of Service (art. 5 Eligibility)", 'https://fundednext.com/terms-of-service'),
 O('fn-platforms', "FundedNext — plateformes CFD (page officielle des règles générales)", 'https://fundednext.com/general-rules/cfds/trading-platforms'),
 O('fn-platblog', "FundedNext — blog officiel : MT4, MT5, cTrader, Match-Trader (page ancienne, accès par taille)", 'https://fundednext.com/blog/how-to-trade-on-mt4-mt5-ctrader-and-match-trader'),
 O('fn-whatis', "FundedNext — blog officiel : What is FundedNext? (liste d'instruments, page ancienne)", 'https://fundednext.com/blog/what-is-fundednext'),
 O('fn-stocks', "FundedNext — blog officiel : actions CFD (20 symboles)", 'https://fundednext.com/blog/fundednext-stocks-funded-capital'),
 O('fn-uae', "FundedNext — centre d'aide : régulation (Émirats arabes unis)", 'https://help.fundednext.com/en/articles/8320393-is-fundednext-regulated-under-usa-or-canadian-jurisdiction'),
 DYN('fn-price-1', "FundedNext — Stellar 1-Step : prix affichés (observation datée)", 'https://fundednext.com/cfds/stellar-1-step', {'page': 'cfds/stellar-1-step'}),
 DYN('fn-price-2', "FundedNext — Stellar 2-Step : prix affichés (observation datée)", 'https://fundednext.com/cfds/stellar-2-step', {'page': 'cfds/stellar-2-step'}),
 DYN('fn-price-lite', "FundedNext — Stellar Lite : prix affichés (observation datée)", 'https://fundednext.com/cfds/stellar-lite', {'page': 'cfds/stellar-lite'}),
 DYN('fn-price-inst', "FundedNext — Stellar Instant : prix affichés (observation datée)", 'https://fundednext.com/cfds/stellar-instant', {'page': 'cfds/stellar-instant'}),
 # FundingPips
 O('fp-start', "FundingPips — Get Started (modèles, pays restreints, instruments)", 'https://help.fundingpips.com/hc/en-us/articles/44390730743825-Get-Started'),
 O('fp-1flex', "FundingPips — 1 Step Flex (centre d'aide)", 'https://help.fundingpips.com/hc/en-us/articles/34501697434385-1-Step-Flex'),
 O('fp-1flexsite', "FundingPips — page 1 Step Flex du site", 'https://fundingpips.com/1-step-flex'),
 O('fp-1step', "FundingPips — 1 Step Model (centre d'aide)", 'https://help.fundingpips.com/hc/en-us/articles/48982278587665-1-Step-Model'),
 O('fp-2std', "FundingPips — 2 Step Standard (centre d'aide)", 'https://help.fundingpips.com/hc/en-us/articles/34501809112081-2-Step-Standard'),
 O('fp-2pro', "FundingPips — 2 Step Pro (centre d'aide)", 'https://help.fundingpips.com/hc/en-us/articles/34502027344017-2-Step-Pro-Model'),
 O('fp-zero', "FundingPips — Zero (centre d'aide)", 'https://help.fundingpips.com/hc/en-us/articles/34502157694865-FundingPips-Zero'),
 O('fp-obj', "FundingPips — Trading Objectives (2 Step Flex ; page de 180 jours)", 'https://fundingpips.com/trading-objectives'),
 O('fp-terms', "FundingPips — Terms and Conditions (art. 8 : limites par modèle)", 'https://fundingpips.com/terms-and-conditions'),
 O('fp-platform', "FundingPips — Account Workspace (plateformes, restrictions géographiques)", 'https://help.fundingpips.com/en/articles/10527988-finding-the-right-trading-platform'),
 O('fp-legacy', "FundingPips — Legacy Rules (règles historiques ; mise à jour temporaire du 29 janvier 2026)", 'https://help.fundingpips.com/hc/en-us/articles/51307058233361-FundingPips-Legacy-Rules'),
 O('fp-review', "FundingPips — blog officiel : revue 2026 des modèles", 'https://fundingpips.com/blog/fundingpips-review-2026'),
 DYN('fp-price', "FundingPips — prix d'entrée affichés par modèle (observation datée)", 'https://fundingpips.com/blog/fundingpips-review-2026', {'page': 'blog/fundingpips-review-2026'}),
]

def merge(fn, items, key='id'):
    p = os.path.join(ROOT, fn); cur = json.load(open(p))
    ids = {x[key] for x in items}
    cur = [x for x in cur if x[key] not in ids] + items
    json.dump(cur, open(p, 'w'), ensure_ascii=False, indent=2)
merge('sources.json', SOURCES)
merge('firms.json', [
 {'id': 'ftmo', 'name': 'FTMO', 'website': 'https://ftmo.com', 'demo': False,
  'description': "Entreprise de CFD (Forex, indices, métaux, matières premières, actions, crypto) en compte simulé : Challenge 2-Step, 1-Step et Instant Account ; types Standard et Swing. FTMO Futures est un produit distinct, non modélisé ici."},
 {'id': 'the5ers', 'name': 'The5ers', 'website': 'https://the5ers.com', 'demo': False,
  'description': "Entreprise Forex / CFD (société israélienne) : programmes High Stakes (2 étapes), Hyper Growth (1 étape) et Bootcamp (3 étapes), mise à l'échelle jusqu'à 4 M$. The5ers Futures est un produit distinct, non modélisé ici."},
 {'id': 'fundednext', 'name': 'FundedNext', 'website': 'https://fundednext.com', 'demo': False,
  'description': "Entreprise (Émirats arabes unis) : CFD Stellar 1-Step, 2-Step, Lite et Instant. FundedNext Futures est un produit distinct, non modélisé ici."},
 {'id': 'fundingpips', 'name': 'FundingPips', 'website': 'https://fundingpips.com', 'demo': False,
  'description': "Entreprise Forex / CFD (Dubaï, fondée en 2022) : modèles 1 Step, 1 Step Flex, 2 Step Standard / Flex / Pro et Zero (sans évaluation)."}])

# ------------------------------------------------------------------ preuves des observations dynamiques
evidence = {'consulted_at': D,
 'note': "Observations de prix, de devises et de promotions lues sur les pages officielles le 2026-11-15 : valeurs DYNAMIQUES, jamais confirmées comme prix. Extraits paraphrasés.",
 'observations': [
  {'firm': 'ftmo', 'source': 'ft-price-2', 'observed': "2-Step (devise : EUR) : 10K 89 €, 25K 250 €, 50K 345 €, 100K 540 € (439 € barré), 200K 1 080 € ; frais remboursés à 100 % au premier retrait.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'ftmo', 'source': 'ft-price-1', 'observed': "1-Step (devise : EUR, frais non remboursables) : 10K 79 €, 25K 199 €, 50K 319 €, 100K 499 €, 200K 999 €.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'ftmo', 'source': 'ft-price-inst', 'observed': "Instant Account (devise : USD, frais non remboursables) : 5K 189 $, 10K 379 $, 25K 849 $, 50K 1 699 $, 100K 3 399 $.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'the5ers', 'source': 't5-price', 'observed': "Page communautaire ancienne (374 jours) : High Stakes 39 $, 78 $, 165 $, 329 $, 545 $ (tailles non nommées sur l'extrait ; 545 $ pour 100K selon la FAQ) ; Bootcamp 95 $ et 225 $ pour l'étape 1 (20K / 100K) puis 205 $ / 350 $ à la réussite.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'fundednext', 'source': 'fn-price-1', 'observed': "Stellar 1-Step : 6K 65,99 $, 15K 129,99 $, 25K 219,99 $, 50K 329,99 $, 100K 569,99 $, 200K 1 099,99 $ (la page affiche aussi « à partir de 44,99 $ » : promotions).", 'excerpt_policy': 'paraphrase'},
  {'firm': 'fundednext', 'source': 'fn-price-2', 'observed': "Stellar 2-Step : 6K 59,99 $, 15K 119,99 $, 25K 199,99 $, 50K 299,99 $, 100K 549,99 $, 200K 1 099,99 $ (prix barré 59,99 / 34,99 $ pour le 6K).", 'excerpt_policy': 'paraphrase'},
  {'firm': 'fundednext', 'source': 'fn-price-lite', 'observed': "Stellar Lite : 5K 32,99 $, 10K 59,99 $, 25K 139,99 $, 50K 229,99 $, 100K 399,99 $, 200K 798,99 $ (29,99 $ affiché pour le 5K).", 'excerpt_policy': 'paraphrase'},
  {'firm': 'fundednext', 'source': 'fn-price-inst', 'observed': "Stellar Instant : 2K 59,99 $, 5K 149,99 $, 10K 299,99 $, 20K 599,99 $.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'fundingpips', 'source': 'fp-price', 'observed': "Prix d'entrée selon la revue du site : 1-Step Flex dès 66 $, Zero dès 60 $ (50K : 244 $ sur la page Zero), 2-Step Standard dès 34 $, 2-Step Flex dès 32 $, 2-Step Pro dès 29 $. Une ancienne page indique 499 $ pour Zero 100K.", 'excerpt_policy': 'paraphrase'}]}
json.dump(evidence, open(os.path.join(ROOT, 'evidence', 'lot2b-2026-11-15.json'), 'w'), ensure_ascii=False, indent=2)
def obs(label, source, params, observed, note):
    return {'label': label, 'source': source, 'parameters': params, 'consulted_at': D, 'evidence_file': EV, 'durable': False, 'observed': observed,
            'note': note + " Valeur observée, NON confirmée comme prix : tarif dynamique (promotion, devise, date)."}
def write(p):
    if p['evaluation']['steps']['value'] == 0:
        for k in p['restrictions']: p['restrictions'][k]['evaluation'] = na("Programme sans challenge : aucune évaluation.")
    json.dump(p, open(os.path.join(ROOT, 'programs', p['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
def qc(ev, sim, live):
    return [{'stage': 'evaluation', 'state': ev[0], 'note': ev[1], 'sources': ev[2]},
            {'stage': 'funded_sim', 'state': sim[0], 'note': sim[1], 'sources': sim[2]},
            {'stage': 'live', 'state': live[0], 'note': live[1], 'sources': live[2]}]
AV = 'a_verifier'
NOLIVE = (AV, "Aucun compte réel (« live ») décrit pour ce programme : les comptes sont simulés ; non confirmé pour le Québec.", [])
CFD = ['cfd', 'spot']
def PR(note, one_time=True, reset=None, act=None):
    return {'one_time': unc(note) if one_time else na("Pas de frais d'évaluation unique."), 'monthly': na("Paiement unique."),
            'activation_fee': act or unc("Frais d'activation non lus."), 'reset_fee': reset or unc("Frais de réinitialisation non lus."), 'conditional_fees': unc()}
def eligibility(excl, unc_list, unlisted, src, note, elig=None):
    return conf({'eligible': elig or [], 'excluded': excl, 'unconfirmed': unc_list, 'unlisted': unlisted}, src, note)

# =================================================================== FTMO
FT_SIZES2 = [10000, 25000, 50000, 100000, 200000]
FT_SIZES_INST = [5000, 10000, 25000, 50000, 100000]
FT_EX, FT_SK = codes("AF AI AQ AG BY BZ BT BV BI CV CF TD KM CG CK CU DJ DM GQ ER SZ FJ GA GM GD GN GW VA ID IQ KZ KI XK KG LS LR MW ML MH MR FM NR NE NU PG RU BL KN LC VC WS SM ST SC SL SB SO SS SD SR TJ TL TK TO TM TV UZ VU VE EH IR SY MM KP")
FT_ELIG = eligibility(FT_EX, [], 'eligible', ['ft-who'],
    "« Apart from the exceptions listed below, FTMO CFDs is available to clients globally » : les pays absents de la liste sont donc admis pour les CFD. Non codés : l'Ukraine (régions Crimée, Sébastopol, Donetsk, Kherson, Louhansk, Zaporijjia seulement), les moins de 18 ans, les personnes sous sanctions. Les restrictions de FTMO Futures sont plus étendues et ne s'appliquent pas à ce programme CFD. L'accès au programme ne garantit pas l'admissibilité aux paiements.")
FT_QC = qc((AV, "FTMO déclare servir les clients du monde entier hors liste ; le Canada n'est pas dans la liste CFD. Aucune règle ne mentionne le Québec. Statut laissé « à vérifier » pour le Québec : aucune page ne tranche expressément.", ['ft-who']),
           (AV, "Compte FTMO simulé : paiements soumis à la vérification d'identité ; admissibilité du Québec aux paiements non confirmée.", ['ft-who']), NOLIVE)
FT_NEWS_STD = "Standard : à partir du compte FTMO (pas pendant le Challenge / la Vérification), restrictions sur des annonces macroéconomiques choisies et les instruments concernés (ex. paires avec le CAD lors d'annonces canadiennes) ; le tableau complet n'a pas été reproduit ici. Swing : aucune restriction."

def ft_restr(swing):
    if swing:
        return {'news': both('allowed', ['ft-news', 'ft-swing'], "Type Swing : aucune restriction de nouvelles (pratiques interdites toujours exclues)."),
                'overnight': both('allowed', ['ft-hold', 'ft-swing'], "Type Swing : aucune restriction pour garder des positions overnight."),
                'weekend': both('allowed', ['ft-hold', 'ft-swing'], "Type Swing : positions de fin de semaine permises ; effet de levier réduit de 1:100 à 1:30."),
                'automated': both('allowed', ['ft-instr'], "Trading algorithmique et EA non limités tant que les pratiques interdites sont évitées."), **UNK()}
    return {'news': restr(conf('allowed', 'ft-news', "Aucune restriction de nouvelles pendant le Challenge et la Vérification."), conf('conditional', 'ft-news', FT_NEWS_STD)),
            'overnight': restr(conf('allowed', 'ft-hold', "Aucune restriction pendant le Challenge / la Vérification."), conf('conditional', 'ft-hold', "FTMO Account Standard : toutes les positions doivent être fermées avant une pause de marché de plus de 2 heures (donc surtout les positions d'actions overnight et de fin de semaine).")),
            'weekend': restr(conf('allowed', 'ft-hold', "Aucune restriction pendant le Challenge / la Vérification."), conf('forbidden', 'ft-hold', "FTMO Account Standard : positions à fermer avant la pause du week-end (violation = résiliation possible du compte).")),
            'automated': both('allowed', ['ft-instr'], "Trading algorithmique et EA non limités tant que les pratiques interdites sont évitées."), **UNK()}

def ft_variant(kind, size):
    k = f"{size//1000}k"; s = ['ft-2step'] if kind == '2' else ['ft-1step', 'ft-promo1'] if kind == '1' else ['ft-instant', 'ft-trial']
    mdl = 5 if kind == '2' else 3
    ev = {'profit_target_usd': pc(10, size, s), 'max_drawdown_usd': pc(10, size, s, "Perte maximale fixe depuis le solde initial (2-Step)." if kind == '2' else "Perte maximale de fin de journée (trailing, basée sur le solde)."),
          'daily_loss_limit_usd': pc(mdl, size, s, "Calculée sur l'équité, remise à zéro à minuit CE(S)T."),
          'min_trading_days': conf(4, 'ft-2step', "4 jours de trading minimum par phase.") if kind == '2' else na("Aucun jour minimum en 1-Step."),
          'max_contracts': unc("Aucun nombre maximal de contrats énoncé (volume maximal par ordre de 50 lots sur le forex selon MetaTrader).")}
    if kind == '2': ev['profit_target_phase2_usd'] = pc(5, size, s, "Phase 2 (Vérification) : 5 %.")
    if kind == 'I':
        ev = {'profit_target_usd': na("Aucun objectif de profit : compte financé direct."), 'max_drawdown_usd': na("Aucune évaluation."), 'daily_loss_limit_usd': na("Aucune évaluation."), 'min_trading_days': na("Aucune évaluation."), 'max_contracts': unc()}
    fu = {'max_drawdown_usd': pc(10, size, s, {'2': "Perte maximale fixe (statique).", '1': "Trailing de fin de journée, basée sur le solde.", 'I': "Trailing intraday, basée sur le solde."}[kind]),
          'daily_loss_limit_usd': pc(mdl if kind != 'I' else 3, size, s), 'max_contracts': unc(), 'max_payout_usd': unc("Aucun plafond de retrait énoncé dans les pages lues.")}
    return {'id': k, 'account_size_usd': size, 'option': None, 'pricing': PR("Tarif DYNAMIQUE (devise EUR / USD selon la page, promotions) : voir observations dynamiques."), 'evaluation': ev, 'funded': fu}

def ft_program(kind, swing):
    pid = {'2': 'ftmo-2step', '1': 'ftmo-1step', 'I': 'ftmo-instant'}[kind] + ('-swing' if swing else '-standard' if kind != 'I' else '')
    title = {'2': 'Challenge 2-Step', '1': 'Challenge 1-Step', 'I': 'Instant Account'}[kind] + (' — type Swing' if swing else ' — type Standard' if kind != 'I' else '')
    sizes = FT_SIZES_INST if kind == 'I' else FT_SIZES2
    src = {'2': ['ft-2step', 'ft-dd'], '1': ['ft-1step', 'ft-1blog'], 'I': ['ft-instant', 'ft-trial']}[kind]
    if kind == '2':
        ev = {'steps': conf(2, src), 'drawdown_type': conf('static', ['ft-trial', 'ft-dd'], "Perte maximale de 10 % fixe depuis le solde initial."),
              'time_limit_days': na("Période de trading illimitée."),
              'description': conf("Phase 1 : objectif de 10 % ; Phase 2 (Vérification) : 5 % ; mêmes limites (perte quotidienne 5 %, perte maximale 10 %) ; 4 jours de trading minimum par phase.", src),
              'consistency_rule': conf({'exists': False, 'detail': None}, src, "Aucune règle de consistance au Challenge 2-Step."),
              'daily_loss_behavior': conf('breach', ['ft-dd'], "Un dépassement est une violation de la règle (échec du Challenge / du compte).")}
        fu = {'account_nature': conf('simulated', 'ft-how', "Compte FTMO simulé (capital fictif)."), 'drawdown_type': unc("Type de drawdown du compte FTMO (après le Challenge) non énoncé explicitement : le type du Challenge (statique, 10 %) n'est pas extrapolé au compte funded."),
              'profit_split_pct': conf(80, 'ft-withdraw', "80 % ; 90 % si le plan de croissance (Scaling Plan) est atteint."),
              'min_withdrawal_usd': conf(0, 'ft-withdraw', "Aucun profit minimal exigé, seulement de quoi couvrir les frais de transaction."),
              'payout_cap': unc("Aucun plafond de retrait énoncé."), 'max_payouts': unc(),
              'drawdown_effect_of_payout': unc("Effet d'un retrait sur la perte maximale non lu."),
              'payout_paths': conf([{'id': 'ftmo-reward', 'label': 'Demande de récompense', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None,
                  'note': "Première demande possible 14 jours après le premier jour de trading, compte positif, aucune position ouverte ; traitement en 1 à 2 jours ouvrables ; frais du Challenge remboursés à 100 % au premier retrait."}], 'ft-withdraw'),
              'safety_net': conf({'exists': False, 'detail': None}, 'ft-withdraw', "Aucun buffer mentionné."),
              'daily_loss_behavior': conf('breach', ['ft-dd']),
              'withdrawal_conditions': conf("Récompense sur demande dès 14 jours après le premier jour de trading, compte en profit sans position ouverte ; 80 % (90 % avec le Scaling Plan) ; frais du Challenge remboursés à 100 % avec le premier retrait.", ['ft-withdraw', 'ft-2step'])}
    elif kind == '1':
        ev = {'steps': conf(1, src), 'drawdown_type': conf('eod_trailing', ['ft-1blog', 'ft-trial'], "Perte maximale de 10 % de fin de journée (trailing, basée sur le solde, mise à jour à 23 h 59 min 59 s CE(S)T)."),
              'time_limit_days': na("Période de trading illimitée."),
              'description': conf("Une seule étape : 10 % de profit, perte quotidienne 3 %, perte maximale 10 % de fin de journée, règle de consistance de 50 %, aucun jour minimum.", src),
              'consistency_rule': conf({'exists': True, 'detail': "50 % : « Best Day Rule » (meilleur jour ≤ 50 % du profit des jours positifs) pour les commandes avant le 5 octobre 2026 ; depuis le 5 octobre 2026 la règle de consistance remplace la Best Day Rule (meilleur jour ≤ 50 % du profit total, jours perdants inclus) pour les nouvelles commandes."}, ['ft-1blog', 'ft-1step']),
              'daily_loss_behavior': conf('breach', ['ft-dd'])}
        fu = {'account_nature': conf('simulated', 'ft-how', "Compte FTMO simulé."), 'drawdown_type': conf('eod_trailing', ['ft-1blog', 'ft-trial']),
              'profit_split_pct': conf(90, ['ft-1step', 'ft-withdraw'], "90 % dès la première récompense."),
              'min_withdrawal_usd': conf(0, 'ft-withdraw', "Aucun profit minimal exigé, seulement de quoi couvrir les frais de transaction."),
              'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': unc(),
              'payout_paths': conf([{'id': 'ftmo-reward-1', 'label': 'Demande de récompense', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': 50, 'request_limit_pct_of_balance': None,
                  'note': "Première demande 14 jours après le premier jour de trading ; la règle de consistance de 50 % doit aussi être respectée pour retirer une récompense."}], ['ft-withdraw', 'ft-promo1']),
              'safety_net': conf({'exists': False, 'detail': None}, 'ft-withdraw', "Aucun buffer mentionné."),
              'daily_loss_behavior': conf('breach', ['ft-dd']),
              'withdrawal_conditions': conf("Récompense de 90 % sur demande dès 14 jours après le premier jour de trading ; consistance de 50 % exigée pour retirer ; frais non remboursables.", ['ft-withdraw', 'ft-promo1'])}
    else:
        ev = {'steps': conf(0, src, "Compte financé direct, sans Challenge."), 'drawdown_type': na("Aucune évaluation."), 'time_limit_days': na("Aucune évaluation."),
              'description': conf("Aucune évaluation : le compte FTMO s'active à l'achat ; règles plus strictes que le Challenge (perte quotidienne 3 %, perte maximale 10 % intraday trailing, consistance 30 %).", src),
              'consistency_rule': na("Voir le compte funded : consistance de 30 % sur le compte Instant."),
              'daily_loss_behavior': na("Aucune évaluation.")}
        fu = {'account_nature': conf('simulated', 'ft-how', "Compte FTMO simulé."), 'drawdown_type': conf('intraday_trailing', ['ft-instant', 'ft-trial'], "10 % trailing intraday, basé sur le solde."),
              'profit_split_pct': conf(90, ['ft-instant'], "90 % dès le premier paiement."), 'min_withdrawal_usd': unc(),
              'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': unc(),
              'payout_paths': conf([{'id': 'ftmo-instant', 'label': 'Demande de récompense', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': 30, 'request_limit_pct_of_balance': None,
                  'note': "Première demande 14 jours après le premier trade ; consistance de 30 % ; un seul compte Instant à la fois ; hors plan de croissance."}], ['ft-instant', 'ft-promo1']),
              'safety_net': unc(), 'daily_loss_behavior': conf('breach', ['ft-instant']),
              'withdrawal_conditions': conf("Première demande 14 jours après le premier trade ; 90 % ; consistance de 30 % ; non éligible au Scaling Plan ni au Premium Programme.", ['ft-instant'])}
    wp = ["Restrictions Standard (fermeture avant une pause de marché de plus de 2 heures, nouvelles) : elles s'appliquent seulement sur le compte FTMO, pas pendant le Challenge.",
          "Les conditions du type Swing (levier réduit à 1:30) ne s'appliquent pas à l'achat Standard : on ne peut pas passer de Standard à Swing après l'achat.",
          "Prix : observations datées en euros ou en dollars ; aucun prix confirmé.",
          "Le dollar des objectifs est calculé à partir de pourcentages officiels (10 % / 5 % / 3 % / 5 %).",
          "Les produits FTMO Futures (restrictions de pays plus étendues) ne sont pas modélisés ici."]
    if kind == '1': wp.insert(0, "Règle de 50 % : Best Day Rule pour les commandes avant le 5 octobre 2026, règle de consistance (profit total) ensuite.")
    return {'id': pid, 'firm_id': 'ftmo', 'name': f"{title} (FTMO)", 'demo': False, 'official_url': {'2': 'https://ftmo.com/en/2-step-challenge/', '1': 'https://ftmo.com/en/1-step-challenge/', 'I': 'https://ftmo.com/en/instant-account/'}[kind],
      'summary': {'2': "Deux phases (10 % puis 5 %), perte quotidienne 5 % et perte maximale 10 % fixe, sans limite de temps, frais remboursés au premier retrait ; partage 80 % (jusqu'à 90 %). CFD simulés, pas des futures.",
                  '1': "Une seule étape (10 %), perte quotidienne 3 %, perte maximale 10 % de fin de journée, consistance de 50 %, partage 90 %. CFD simulés, pas des futures.",
                  'I': "Compte financé direct (5 000 $ à 100 000 $), perte quotidienne 3 %, perte maximale 10 % intraday, consistance 30 %, partage 90 %. CFD simulés, pas des futures."}[kind]
                 + (" Type Swing : positions overnight / fin de semaine et nouvelles sans restriction, levier réduit à 1:30." if swing else ''),
      'instruments': conf(['FOREX'], 'ft-instr', "Forex confirmé ; la page cite aussi indices, matières premières, actions et crypto mais sans liste par symbole : non confirmés individuellement."),
      'instruments_scope': 'partial', 'instruments_excluded': unc("Liste par symbole non lue."),
      'contract_types': conf(CFD, ['ft-how', 'ft-instr'], "CFD (simulés) sur Forex, indices, matières premières, actions et crypto ; aucun futures dans ces programmes."),
      'instrument_limits': unc("Limites par instrument non lues."),
      'platforms': conf(['metatrader4', 'metatrader5', 'ctrader', 'tradingview'], 'ft-platforms'),
      'evaluation': ev, 'funded': fu, 'restrictions': ft_restr(swing), 'eligibility': FT_ELIG, 'quebec_by_stage': FT_QC,
      'dynamic_observations': [obs({'2': 'Prix 2-Step affichés', '1': 'Prix 1-Step affichés', 'I': 'Prix Instant affichés'}[kind], {'2': 'ft-price-2', '1': 'ft-price-1', 'I': 'ft-price-inst'}[kind], {'devise': 'USD' if kind == 'I' else 'EUR'},
          ({'prix_10k_eur': 89, 'prix_25k_eur': 250, 'prix_50k_eur': 345, 'prix_100k_eur': 540, 'prix_200k_eur': 1080} if kind == '2' else {'prix_10k_eur': 79, 'prix_25k_eur': 199, 'prix_50k_eur': 319, 'prix_100k_eur': 499, 'prix_200k_eur': 999} if kind == '1' else {'prix_5k_usd': 189, 'prix_10k_usd': 379, 'prix_25k_usd': 849, 'prix_50k_usd': 1699, 'prix_100k_usd': 3399}),
          "Devise : euros pour les Challenges, dollars pour l'Instant. Prix du type Swing non lus.")],
      'variants': [ft_variant(kind, s) for s in sizes], 'promos': [], 'watch_points': conf(wp, src)}
for kind in ['2', '1']:
    for sw in [False, True]: write(ft_program(kind, sw))
write(ft_program('I', False))

# =================================================================== THE5ERS
T5_EX, T5_SK = codes("AF BY BI CF CU CG CD ER GN GW IQ IR IL LA LB LR LY MM KP PS PG RU SS SD SO SY VU VE YE")
T5_ELIG = eligibility(T5_EX, ['BA'], 'unconfirmed', ['t5-who', 't5-terms'],
    "Liste « including but not limited to » (non exhaustive) : un pays absent n'est donc PAS déclaré admissible. La Bosnie-Herzégovine figure dans les Terms mais pas dans la FAQ plus récente : contradiction, laissée « non confirmée ». Non codés : la Crimée, Donetsk, Kherson, Louhansk, Zaporijjia. L'accès au programme ne garantit pas l'admissibilité aux paiements (identification exigée avant le premier retrait).")
T5_QC = qc((AV, "Aucune page officielle ne mentionne le Québec ni ne déclare le Canada admissible ; un blog officiel évoque des résidents du Canada comme bénéficiaires potentiels sans valeur de règle. À vérifier.", ['t5-who']),
           (AV, "Compte financé simulé : admissibilité du Québec aux paiements non confirmée.", ['t5-who']), NOLIVE)
T5_COMMON = dict(firm_id='the5ers', demo=False,
    instruments=conf(['FOREX'], ['t5-high', 't5-hyper'], "Forex confirmé ; métaux, indices, pétrole et crypto cités sans liste par symbole : non confirmés individuellement."),
    instruments_scope='partial', instruments_excluded=unc("Liste par symbole non lue."),
    contract_types=conf(CFD, ['t5-high', 't5-hyper'], "Forex, métaux, indices, pétrole, crypto (High Stakes) ; aucun futures dans ces programmes (The5ers Futures est un produit distinct)."),
    instrument_limits=unc("Limites par instrument non lues (les indices ont des frais de swap élevés en fin de semaine)."),
    platforms=conf(['metatrader5'], ['t5-high', 't5-hyper'], "MetaTrader 5 (compte « hedge » : bureau, web, mobile)."),
    eligibility=T5_ELIG, quebec_by_stage=T5_QC)
HS_SIZES = [5000, 10000, 25000, 50000, 100000]
def hs_variant(size):
    k = f"{size//1000}k"; s = ['t5-hs-rules', 't5-compare', 't5-high']
    fu = {'max_drawdown_usd': pc(10, size, s), 'daily_loss_limit_usd': pc(5, size, s), 'max_contracts': unc(),
          'max_payout_usd': conf(3000, 't5-hs-rules', "Plafond de 3 000 $ par retrait (50K).") if size == 50000 else conf(4000, 't5-hs-rules', "Plafond de 4 000 $ par retrait (100K).") if size == 100000 else unc("Plafond de cette taille non lu (seulement 50K et 100K).")}
    return {'id': k, 'account_size_usd': size, 'option': None, 'pricing': PR("Tarif DYNAMIQUE : la page communautaire ancienne affiche 39 à 545 $ (voir observations) ; aucune correspondance sûre par taille."),
      'evaluation': {'profit_target_usd': unc("Objectif de l'étape 1 : 8 % (tableau comparatif, FAQ éditoriale) ou 10 % (texte de la même page de blog) : CONTRADICTION, non confirmé."),
                     'profit_target_phase2_usd': pc(5, size, s, "Étape 2 : 5 % (cohérent entre les pages)."),
                     'max_drawdown_usd': pc(10, size, s, "Perte maximale fixe de 10 % depuis le solde initial."), 'daily_loss_limit_usd': pc(5, size, s, "Dépassement : le compte est résilié."),
                     'min_trading_days': conf(3, ['t5-compare', 't5-high'], "3 jours profitables minimum par étape (jour ≥ 0,5 % du solde initial)."), 'max_contracts': unc()}, 'funded': fu}
write({**T5_COMMON, 'id': 'the5ers-high-stakes', 'name': 'High Stakes (The5ers)', 'official_url': 'https://the5ers.com/high-stakes/',
 'summary': "Deux étapes (8 % ou 10 % selon la page, puis 5 %), perte quotidienne 5 % qui résilie le compte et perte maximale 10 % fixe, 3 jours profitables par étape ; partage de 80 % dès le financement ; nouvelles : aucun ordre 2 minutes avant et après les annonces à fort impact. CFD simulés, pas des futures.",
 'evaluation': {'steps': conf(2, ['t5-compare', 't5-hs-rules']), 'drawdown_type': conf('static', 't5-consist', "10 % fixe depuis le solde initial."), 'time_limit_days': na("Durée illimitée ; un compte inactif plus de 30 jours expire."),
   'description': conf("Deux étapes sans limite de temps, perte quotidienne 5 % (résiliation), perte maximale 10 %, 3 jours profitables par étape ; objectif de l'étape 1 contradictoire (8 % ou 10 %), étape 2 : 5 %.", ['t5-compare', 't5-hs-rules']),
   'consistency_rule': conf({'exists': False, 'detail': None}, 't5-consist', "Aucune règle de pourcentage en évaluation ; 50 % seulement une fois le compte financé."),
   'daily_loss_behavior': conf('breach', ['t5-compare'], "La limite quotidienne de 5 % termine immédiatement le compte.")},
 'funded': {'account_nature': conf('simulated', 't5-compare', "Compte financé simulé (retraits réels)."), 'drawdown_type': conf('static', 't5-consist', "10 % fixe depuis le solde initial."),
   'profit_split_pct': conf(80, ['t5-compare', 't5-high'], "80 % dès le financement, jusqu'à 100 % avec la mise à l'échelle."), 'min_withdrawal_usd': conf(150, 't5-hs-pay', "Minimum de retrait de 150 $, après partage."),
   'payout_cap': conf({'has_cap': True, 'amount_usd': None}, ['t5-hs-rules'], "Plafond par retrait : 3 000 $ (50K), 4 000 $ (100K) ; autres tailles non lues."), 'max_payouts': unc(),
   'drawdown_effect_of_payout': conf("Garder le profit dans le compte augmente le seuil de perte maximale ; l'inverse n'est pas énoncé.", 't5-hs-pay'),
   'payout_paths': conf([{'id': 'hs-biweekly', 'label': 'Retrait toutes les 2 semaines', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': 50, 'request_limit_pct_of_balance': None,
       'note': "Retrait bi-hebdomadaire une fois financé ; profit minimal pour retirer : 300 $ (50K) / 500 $ (100K) ; consistance de 50 % seulement en compte financé ; 70 % des frais remboursés au premier retrait (profit ≥ 150 $, compte actif ≥ 14 jours)."}], ['t5-hs-pay', 't5-consist']),
   'safety_net': conf({'exists': False, 'detail': None}, 't5-hs-pay', "Aucun buffer mentionné."), 'daily_loss_behavior': conf('breach', ['t5-compare']),
   'withdrawal_conditions': conf("Aucun retrait pendant les deux étapes ; une fois financé : retrait toutes les 2 semaines, minimum 150 $ après partage, plafond par retrait selon la taille, retrait crypto limité à 1 500 $ par transaction ; consistance 50 % en compte financé.", ['t5-hs-pay', 't5-consist'])},
 'restrictions': {'news': both('conditional', ['t5-hs-news', 't5-hs-rules'], "Aucun ordre (marché ou en attente) 2 minutes avant et après les annonces à fort impact de la devise ou de l'indice concerné ; garder une position ouverte pendant l'annonce est permis. Un trade ouvert dans la fenêtre est une violation « douce » : le profit est retiré."),
   'overnight': both('allowed', ['t5-high', 't5-compare'], "Positions overnight permises."), 'weekend': both('allowed', ['t5-high', 't5-compare'], "Positions de fin de semaine permises ; les indices ont des frais de swap élevés."),
   'automated': both('conditional', ['t5-compare'], "EA permis, mais pas d'arbitrage de latence, de scalping de ticks ni de scalping de rollover."), **UNK()},
 'dynamic_observations': [obs("Frais affichés sur la page communautaire ancienne", 't5-price', {'page': 'btw.the5ers.com'}, {'prix_usd_1': 39, 'prix_usd_2': 78, 'prix_usd_3': 165, 'prix_usd_4': 329, 'prix_usd_5': 545}, "Tailles non nommées dans l'extrait ; page de 374 jours.")],
 'variants': [hs_variant(s) for s in HS_SIZES], 'promos': [],
 'watch_points': conf(["CONTRADICTION : l'objectif de l'étape 1 est de 8 % (tableau, autres articles) ou 10 % (texte du comparatif) : non confirmé.",
    "La limite quotidienne de 5 % termine le compte : ce n'est pas une simple pause.", "Aucun ordre 2 minutes avant/après les annonces à fort impact ; le profit d'un trade ouvert dans la fenêtre est retiré.",
    "Consistance de 50 % seulement une fois financé ; les tailles 2 500 $ et les comptes « Classic / New » ne sont pas modélisés.", "Prix : observation ancienne seulement."], ['t5-compare', 't5-hs-news'])})

HG_SIZES = [5000, 10000, 20000]
def hg_variant(size):
    k = f"{size//1000}k"; s = ['t5-hyper', 't5-compare']
    return {'id': k, 'account_size_usd': size, 'option': None, 'pricing': PR("Tarif non lu par taille (observation ancienne seulement)."),
      'evaluation': {'profit_target_usd': pc(10, size, s), 'max_drawdown_usd': pc(6, size, s, "Seuil de sortie (« stop-out ») de 6 %."), 'daily_loss_limit_usd': pc(3, size, s, "Pause de la journée, pas un échec."),
                     'min_trading_days': na("Aucun nombre minimal de jours ou de trades pour l'étape 1."), 'max_contracts': unc()},
      'funded': {'max_drawdown_usd': pc(6, size, s), 'daily_loss_limit_usd': pc(3, size, s, "Pause de la journée."), 'max_contracts': unc(), 'max_payout_usd': unc("Plafond non lu.")}}
write({**T5_COMMON, 'id': 'the5ers-hyper-growth', 'name': 'Hyper Growth (The5ers)', 'official_url': 'https://the5ers.com/hyper-growth/',
 'instruments': conf(['FOREX'], 't5-hyper', "Forex confirmé ; métaux, indices, crypto, actions cités sans liste par symbole."),
 'summary': "Une seule étape (10 %), seuil de sortie de 6 % (trailing avec profit retenu), limite quotidienne de 3 % qui ne fait que suspendre la journée ; partage de 50 % à l'origine (jusqu'à 100 %) ; nouvelles et fins de semaine permises ; capital limité à 40 000 $ en évaluation. CFD simulés, pas des futures.",
 'evaluation': {'steps': conf(1, ['t5-hyper', 't5-compare']), 'drawdown_type': unc("Le drawdown est « trailing avec profit retenu » (blog officiel) : on ne sait pas s'il suit l'équité en continu ou la fin de journée ; non classé."),
   'time_limit_days': na("Durée illimitée ; un compte inactif plus de 30 jours expire."),
   'description': conf("Une étape : 10 % de profit, seuil de sortie de 6 %, pause quotidienne de 3 % ; l'étape 1 est réussie dès que l'objectif est atteint ; aucun minimum de jours.", ['t5-hyper', 't5-compare']),
   'consistency_rule': conf({'exists': False, 'detail': None}, 't5-consist', "Aucune règle de consistance en pourcentage publiée."),
   'daily_loss_behavior': conf('pause', ['t5-compare', 't5-hyper'], "La pause de 3 % suspend la journée ; le compte revient à la séance suivante.")},
 'funded': {'account_nature': conf('simulated', 't5-compare'), 'drawdown_type': unc("Voir l'évaluation : type de trailing non précisé."),
   'profit_split_pct': conf(50, ['t5-compare', 't5-hyper'], "50 % au départ, 75 % au premier palier puis jusqu'à 100 %."), 'min_withdrawal_usd': conf(150, 't5-compare', "Minimum de 150 $ selon un comparatif éditorial."),
   'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': conf("Le retrait n'est pas déduit de la progression vers le prochain palier de mise à l'échelle.", 't5-hyper'),
   'payout_paths': conf([{'id': 'hg-biweekly', 'label': 'Retrait toutes les 2 semaines', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None,
       'note': "Retrait bi-hebdomadaire ; doublement du compte à chaque palier de 10 % ; limite d'évaluation 40 000 $ cumulés."}], ['t5-compare', 't5-hyper']),
   'safety_net': unc(), 'daily_loss_behavior': conf('pause', ['t5-compare']),
   'withdrawal_conditions': conf("Retrait bi-hebdomadaire sur les profits ; partage de 50 % au départ ; doublement du compte à chaque palier de 10 % jusqu'à 4 M$.", ['t5-compare', 't5-hyper'])},
 'restrictions': {'news': both('allowed', ['t5-compare', 't5-hyper'], "Nouvelles permises, sauf les stratégies « bracket » autour des événements à fort impact."),
   'overnight': both('allowed', ['t5-hyper'], "Positions overnight permises."), 'weekend': both('allowed', ['t5-hyper'], "Positions de fin de semaine permises ; les indices ont un swap élevé."),
   'automated': both('conditional', ['t5-compare'], "EA permis, mais pas d'arbitrage de latence ni de scalping de ticks."), **UNK()},
 'dynamic_observations': [], 'variants': [hg_variant(s) for s in HG_SIZES], 'promos': [],
 'watch_points': conf(["Seuil de sortie de 6 % « trailing avec profit retenu » : type exact non précisé (équité ou fin de journée).", "La limite quotidienne de 3 % suspend seulement la journée.",
    "Les programmes Pro Growth et Instant Funding sont cités par un blog seulement (tailles et prix non lus) : non modélisés.", "Prix des tailles non lus.",
    "Capital cumulé en évaluation limité à 40 000 $."], ['t5-compare', 't5-hyper'])})

BC = [('20k', 20000, [5000, 10000, 15000]), ('100k', 100000, [25000, 50000, 75000]), ('250k', 250000, [100000, 150000, 200000])]
def bc_variant(vid, size, steps):
    s = ['t5-btw', 't5-boot']
    return {'id': vid, 'account_size_usd': size, 'option': None, 'pricing': PR("Frais d'étape 1 puis frais de financement : observations anciennes seulement."),
      'evaluation': {'profit_target_usd': pc(6, steps[0], s, f"Étape 1 : compte de {steps[0]} $."), 'profit_target_phase2_usd': pc(6, steps[1], s, f"Étape 2 : compte de {steps[1]} $."), 'profit_target_phase3_usd': pc(6, steps[2], s, f"Étape 3 : compte de {steps[2]} $."),
                     'max_drawdown_usd': pc(5, steps[0], s, f"Étape 1 : 5 % de {steps[0]} $ (la perte maximale suit le solde de chaque étape)."), 'daily_loss_limit_usd': na("Aucune limite quotidienne pendant l'évaluation."),
                     'min_trading_days': na("Aucun minimum de jours en évaluation."), 'max_contracts': unc()},
      'funded': {'max_drawdown_usd': pc(4, size, s, "4 % une fois financé."), 'daily_loss_limit_usd': pc(3, size, s, "Pause quotidienne de 3 % une fois financé."), 'max_contracts': unc(), 'max_payout_usd': unc()}}
write({**T5_COMMON, 'id': 'the5ers-bootcamp', 'name': 'Bootcamp (The5ers)', 'official_url': 'https://the5ers.com/bootcamp/',
 'summary': "Trois étapes de 6 % (soldes croissants), perte maximale de 5 % par étape puis 4 % une fois financé ; pause quotidienne de 3 % seulement une fois financé ; stop-loss obligatoire sur chaque position ; partage de 50 % au départ. CFD simulés, pas des futures.",
 'evaluation': {'steps': conf(3, ['t5-compare', 't5-btw']), 'drawdown_type': unc("Drawdown « trailing avec profit retenu » selon un blog officiel : type exact non précisé."), 'time_limit_days': na("Durée illimitée."),
   'description': conf("Trois étapes successives (6 % chacune) sur des soldes croissants, perte maximale de 5 % par étape, stop-loss obligatoire ; une fois financé : objectif de 5 % pour la mise à l'échelle, perte maximale de 4 %, pause quotidienne de 3 %.", ['t5-compare', 't5-btw']),
   'consistency_rule': conf({'exists': False, 'detail': None}, 't5-consist', "Aucune règle de consistance en pourcentage publiée."), 'daily_loss_behavior': na("Aucune limite quotidienne pendant l'évaluation.")},
 'funded': {'account_nature': conf('simulated', 't5-compare'), 'drawdown_type': unc("Type de trailing non précisé."), 'profit_split_pct': conf(50, ['t5-compare', 't5-boot'], "50 % au départ, 75 % au premier palier, jusqu'à 100 %."),
   'daily_loss_behavior': conf('pause', ['t5-compare'], "Pause quotidienne de 3 % seulement une fois financé."), 'min_withdrawal_usd': unc(), 'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': unc(),
   'payout_paths': conf([{'id': 'bc-biweekly', 'label': 'Retrait toutes les 2 semaines', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None, 'note': "Retrait bi-hebdomadaire une fois financé ; mise à l'échelle à chaque palier de 5 %."}], 't5-compare'),
   'safety_net': unc(), 'withdrawal_conditions': conf("Une fois financé : retrait bi-hebdomadaire ; partage de 50 % puis 75 % au premier palier et jusqu'à 100 %.", ['t5-compare'])},
 'restrictions': {'news': both('allowed', ['t5-compare'], "Nouvelles permises, sauf les stratégies « bracket » autour des événements à fort impact."), 'overnight': both('allowed', ['t5-compare']), 'weekend': both('allowed', ['t5-compare']),
   'automated': both('conditional', ['t5-compare'], "EA permis, mais pas d'arbitrage de latence ni de scalping de ticks ; copie entre comptes propres interdite au Bootcamp."), **UNK()},
 'dynamic_observations': [], 'variants': [bc_variant(*b) for b in BC], 'promos': [],
 'watch_points': conf(["CONTRADICTION : le levier est 1:30 (blog récent) ou 1:10 (page communautaire ancienne) : non modélisé.", "Les objectifs en dollars suivent le solde de chaque étape (soldes de 5 000 $ à 200 000 $) : voir le détail par étape.",
    "Pause quotidienne de 3 % et perte maximale de 4 % seulement une fois financé.", "Stop-loss obligatoire sur chaque position.", "Prix non confirmés (page communautaire ancienne)."], ['t5-compare', 't5-btw'])})

# =================================================================== FUNDEDNEXT
FN_EX, FN_SK = codes("BD MM BY KP SY GD TD MY BZ AG CV TV VN BV BI CK ER KM LK FJ IR RU")
FN_ELIG = eligibility(FN_EX, [], 'unconfirmed', ['fn-countries', 'fn-terms'],
    "Liste officielle « as of now » (CFD) : Bangladesh, Myanmar, Biélorussie, Corée du Nord, Syrie, Grenade, Tchad, Malaisie, Belize, Antigua-et-Barbuda, Cap-Vert, Tuvalu, Vietnam, île Bouvet, Burundi, îles Cook, Érythrée, Comores, Sri Lanka, Fidji ; les Terms ajoutent l'Iran et la Russie (« including countries on the FATF high-risk and EU/UN sanctions lists » : liste non précisée), donc un pays absent n'est PAS déclaré admissible. Les restrictions de FundedNext Futures sont différentes (Canada hors Ontario cité pour l'accès live futures) et ne s'appliquent pas à ces CFD. L'accès au programme ne garantit pas l'admissibilité aux paiements.")
FN_QC = qc((AV, "Aucune page officielle CFD ne mentionne le Québec ni ne déclare le Canada admissible ; l'entreprise est régie par les Émirats arabes unis. Les restrictions de FundedNext Futures (Canada sauf Ontario) ne s'appliquent pas aux CFD et ne sont pas extrapolées.", ['fn-countries', 'fn-uae']),
           (AV, "Compte financé simulé : admissibilité du Québec aux paiements non confirmée.", ['fn-terms']), NOLIVE)
FN_COMMON = dict(firm_id='fundednext', demo=False,
    instruments=conf(['FOREX', 'EURUSD', 'XAUUSD', 'XAGUSD', 'US30', 'NAS100', 'BTCUSD_CFD', 'ETHUSD_CFD', 'STOCK_CFD'], ['fn-whatis', 'fn-stocks'],
        "Forex (EURUSD…), or / argent, indices (US30, NDX100 = Nasdaq 100), crypto (BTCUSD, ETHUSD) selon un blog officiel ancien (465 jours) ; 20 actions CFD selon le blog actions récent. Liste complète par symbole non lue."),
    instruments_scope='partial', instruments_excluded=unc("Liste par symbole non lue."),
    contract_types=conf(CFD, ['fn-whatis', 'fn-stocks'], "CFD : Forex, matières premières, indices, crypto, actions ; aucun futures dans ces programmes (FundedNext Futures est un produit distinct)."),
    instrument_limits=unc("Limites par instrument non lues (levier : Forex 1:30, indices 1:10, matières 1:15, crypto 1:1, actions 1:2)."),
    platforms=conf(['metatrader4', 'metatrader5', 'ctrader', 'matchtrader'], ['fn-platforms', 'fn-platblog'],
        "MT4 et MT5 pour tous les comptes ; cTrader et Match-Trader jusqu'à 50K seulement (blog ancien) ; clients américains : Match-Trader seulement ; cTrader / Match-Trader : frais de 25 $ ; plateforme verrouillée au premier trade. Stellar Instant : MT4 / MT5 seulement."),
    eligibility=FN_ELIG, quebec_by_stage=FN_QC)
def fn_variant(size, tgt1, tgt2, dd, dll, mind, price_note):
    s = ['fn-1'];
    ev = {'profit_target_usd': pc(tgt1, size, s), 'max_drawdown_usd': pc(dd, size, s, "Statique depuis le solde initial."), 'daily_loss_limit_usd': pc(dll, size, s, "Depuis le solde initial ; remise à zéro à 00:00 heure du serveur ; inclut flottant, swaps et commissions."),
          'min_trading_days': conf(mind, s) if mind else na("Aucun minimum."), 'max_contracts': unc()}
    if tgt2: ev['profit_target_phase2_usd'] = pc(tgt2, size, s, "Phase 2.")
    return {'id': f"{size//1000}k", 'account_size_usd': size, 'option': None, 'pricing': PR(price_note),
            'evaluation': ev, 'funded': {'max_drawdown_usd': pc(dd, size, s), 'daily_loss_limit_usd': pc(dll, size, s), 'max_contracts': unc(), 'max_payout_usd': unc()}}
def fn_program(pid, name, url, src, sizes, tgt1, tgt2, dd, dll, mind, steps, summary, desc, funded, restrictions, obs_src, obs_vals, wp, price_note, ddtype='static'):
    ev = {'steps': conf(steps, src), 'drawdown_type': conf(ddtype, src, "Calculé depuis le solde initial (statique), ne suit pas le profit." if ddtype == 'static' else "Calculé depuis l'équité maximale atteinte."), 'time_limit_days': na("Aucune limite de temps (politique d'inactivité de 60 jours)."),
          'description': conf(desc, src), 'consistency_rule': conf({'exists': False, 'detail': None}, src, "Aucune règle de consistance sur les comptes CFD (« Consistency N/A »). Une règle « Quick Strike » (< 30 %) figure dans le centre d'aide du 1-Step."),
          'daily_loss_behavior': conf('breach', ['fn-vs', 'fn-scale'] if False else src, "Un dépassement est une violation : le compte est considéré violé.") if dll else na("Aucune limite quotidienne.")}
    return {**FN_COMMON, 'id': pid, 'name': name, 'official_url': url, 'summary': summary, 'evaluation': ev, 'funded': funded, 'restrictions': restrictions,
            'dynamic_observations': [obs(f"Prix affichés {name}", obs_src, {'page': url.split('.com/')[1]}, obs_vals, "Pages du site officiel ; promotions affichées.")],
            'variants': [fn_variant(s, tgt1, tgt2, dd, dll, mind, price_note) if dll else None for s in sizes], 'promos': [], 'watch_points': conf(wp, src)}
FN_RESTR = {'news': both('allowed', ['fn-1', 'fn-2'], "Nouvelles permises (la page indique que 40 % du profit réalisé pendant les nouvelles est pris en compte pour la récompense : règle non détaillée)."),
            'overnight': both('allowed', ['fn-hold'], "Positions overnight permises ; les swaps s'ajoutent à la perte quotidienne."), 'weekend': both('allowed', ['fn-hold', 'fn-1'], "Positions de fin de semaine permises en Challenge et sur le compte financé."),
            'automated': restr(conf('allowed', 'fn-2', "EA et indicateurs permis (FAQ du 2-Step)."), unc()), **UNK()}
def FNF(split, first, cycle, refund, extra=''):
    return {'account_nature': conf('simulated', 'fn-1', "Compte FundedNext simulé."), 'drawdown_type': conf('static', 'fn-1', "Statique depuis le solde initial."), 'profit_split_pct': split, 'min_withdrawal_usd': unc("Minimum annoncé à 100 $ par un blog ancien ; non confirmé."),
            'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': unc(),
            'payout_paths': conf([{'id': 'fn-reward', 'label': 'Récompense', 'min_days': None, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None, 'note': first}], 'fn-1'),
            'safety_net': conf({'exists': False, 'detail': None}, 'fn-1', "Aucun buffer mentionné."), 'daily_loss_behavior': conf('breach', ['fn-1']),
            'withdrawal_conditions': conf(first + ' ' + cycle + ' ' + refund + extra, ['fn-1', 'fn-2', 'fn-lite'])}
FN_SZ = [6000, 15000, 25000, 50000, 100000, 200000]
write(fn_program('fundednext-stellar-1step', 'Stellar 1-Step (FundedNext)', 'https://fundednext.com/cfds/stellar-1-step', ['fn-1', 'fn-help1', 'fn-blog1'], FN_SZ, 10, None, 6, 3, 2, 1,
  "Une seule étape (10 %), perte quotidienne 3 % et perte maximale 6 % statique, 2 jours minimum ; récompenses toutes les 5 jours ouvrables (partage 80 %, jusqu'à 95 % avec l'option). CFD simulés, pas des futures.",
  "Une phase : 10 % de profit, perte quotidienne 3 %, perte maximale 6 % statique, 2 jours de trading distincts minimum ; sans limite de temps.",
  FNF(conf(80, ['fn-1', 'fn-vs'], "80 % ; jusqu'à 95 % avec l'option (FAQ). La page de règles annonce « jusqu'à 95 % »."), "Premier retrait possible 5 jours ouvrables après le début.", "Récompenses suivantes tous les 5 jours ouvrables.", "Frais remboursés avec la 3e récompense ; 15 % de l'objectif du Challenge versés au premier palier de mise à l'échelle."),
  FN_RESTR, 'fn-price-1', {'prix_6k_usd': 65.99, 'prix_15k_usd': 129.99, 'prix_25k_usd': 219.99, 'prix_50k_usd': 329.99, 'prix_100k_usd': 569.99, 'prix_200k_usd': 1099.99},
  ["CONTRADICTION : la page affiche « à partir de 44,99 $ » et des prix de 65,99 $ à 1 099,99 $ pour le même programme : promotions, non confirmés.", "Perte quotidienne de 3 % calculée depuis le solde initial, pas depuis le solde de la journée.", "Les profits de nouvelles ne comptent qu'à 40 % pour la récompense selon la page : règle non détaillée.", "Cible de 15 % des profits de Challenge versée seulement au premier palier de mise à l'échelle."], "Tarif DYNAMIQUE : voir observations dynamiques."))
write(fn_program('fundednext-stellar-2step', 'Stellar 2-Step (FundedNext)', 'https://fundednext.com/cfds/stellar-2-step', ['fn-2', 'fn-blog2', 'fn-vs'], FN_SZ, 8, 5, 10, 5, 5, 2,
  "Deux phases (8 % puis 5 %), perte quotidienne 5 % et perte maximale 10 % statique, 5 jours minimum par phase ; première récompense à 21 jours puis toutes les 2 semaines (partage 80 %). CFD simulés, pas des futures.",
  "Deux phases sans limite de temps : 8 % puis 5 % (la cible de la phase 2 repart du solde initial), 5 jours de trading minimum par phase, perte quotidienne 5 % et perte maximale 10 % statiques.",
  FNF(conf(80, ['fn-2', 'fn-vs'], "80 % ; la page indique « jusqu'à 95 % » avec des options."), "Première récompense 21 jours après le début.", "Récompenses suivantes toutes les 2 semaines.", "Frais remboursés avec la 1re récompense ; 15 % de l'objectif du Challenge versés au premier palier de mise à l'échelle."),
  FN_RESTR, 'fn-price-2', {'prix_6k_usd': 59.99, 'prix_15k_usd': 119.99, 'prix_25k_usd': 199.99, 'prix_50k_usd': 299.99, 'prix_100k_usd': 549.99, 'prix_200k_usd': 1099.99},
  ["Perte quotidienne de 5 % depuis le solde initial (pas depuis l'équité du jour) ; le profit du jour étend la marge de ce jour seulement.", "5 jours de trading minimum dans chaque phase.", "Récompenses selon trois structures (Standard 80 %, 3 jours 60 %, À la demande 90 %) : structure choisie à l'achat, non modifiable ensuite.", "Prix : observations affichées avec promotions."], "Tarif DYNAMIQUE : voir observations dynamiques."))
LITE = fn_program('fundednext-stellar-lite', 'Stellar Lite (FundedNext)', 'https://fundednext.com/cfds/stellar-lite', ['fn-lite', 'fn-vs'], [5000, 10000, 25000, 50000, 100000, 200000], 8, 4, 8, 4, None, 2,
  "Deux phases à objectifs réduits (8 % puis 4 %), perte quotidienne 4 % et perte maximale 8 % statique ; première récompense à 10 jours ouvrables, frais remboursés à la 3e récompense. CFD simulés, pas des futures.",
  "Deux phases : 8 % puis 4 %, perte quotidienne 4 % et perte maximale 8 % statiques, sans limite de temps.",
  FNF(conf(80, ['fn-lite'], "80 % (page de règles) ; la page promotionnelle indique « jusqu'à 95 % »."), "Première récompense après 10 jours ouvrables (tableau comparatif) ; la FAQ de la même page annonce 21 jours : CONTRADICTION.", "Récompenses suivantes tous les 10 jours ouvrables (tableau).", "Frais remboursés avec la 3e récompense."),
  FN_RESTR, 'fn-price-lite', {'prix_5k_usd': 32.99, 'prix_10k_usd': 59.99, 'prix_25k_usd': 139.99, 'prix_50k_usd': 229.99, 'prix_100k_usd': 399.99, 'prix_200k_usd': 798.99},
  ["CONTRADICTION sur la même page : jours minimum = 2 (tableau) ou 5 par phase (FAQ) ; première récompense = 10 jours ouvrables (tableau) ou 21 jours (FAQ) : non confirmés.", "Frais remboursés à la 3e récompense (plus tard qu'au 2-Step).", "Prix : observations affichées avec promotions."], "Tarif DYNAMIQUE : voir observations dynamiques.")
for v in LITE['variants']:
    v['evaluation']['min_trading_days'] = unc("Contradiction : 2 jours (tableau) ou 5 jours par phase (FAQ de la même page).")
LITE['evaluation']['description'] = conf("Deux phases : 8 % puis 4 %, perte quotidienne 4 % et perte maximale 8 % statiques, sans limite de temps ; nombre de jours minimum contradictoire (2 ou 5).", ['fn-lite'])
write(LITE)
def inst_variant(size):
    s = ['fn-inst']
    return {'id': f"{size//1000}k", 'account_size_usd': size, 'option': None, 'pricing': PR("Tarif DYNAMIQUE : voir observations dynamiques."),
      'evaluation': {'profit_target_usd': na("Aucun objectif."), 'max_drawdown_usd': na("Aucune évaluation."), 'daily_loss_limit_usd': na("Aucune évaluation."), 'min_trading_days': na("Aucune évaluation."), 'max_contracts': unc()},
      'funded': {'max_drawdown_usd': pc(6, size, s, "Trailing depuis l'équité maximale."), 'daily_loss_limit_usd': na("Aucune limite quotidienne."), 'max_contracts': unc(), 'max_payout_usd': unc()}}
write({**FN_COMMON, 'id': 'fundednext-stellar-instant', 'name': 'Stellar Instant (FundedNext)', 'official_url': 'https://fundednext.com/cfds/stellar-instant',
 'platforms': conf(['metatrader4', 'metatrader5'], ['fn-inst', 'fn-platblog'], "MT4 et MT5 seulement (cTrader et Match-Trader non offerts sur Stellar Instant selon le blog ancien)."),
 'summary': "Compte financé direct (2 000 $ à 20 000 $), sans limite quotidienne, seule une perte maximale de 6 % trailing ; partage de 70 % puis 80 % ; retrait à la demande à 5 % de croissance ou toutes les 2 semaines. CFD simulés, pas des futures.",
 'evaluation': {'steps': conf(0, ['fn-inst'], "Aucun Challenge."), 'drawdown_type': na("Aucune évaluation."), 'time_limit_days': na("Aucune évaluation."), 'description': conf("Aucune évaluation : compte financé à l'achat, sans objectif ni jours minimum ; perte maximale de 6 % trailing depuis l'équité maximale.", ['fn-inst']),
   'consistency_rule': na("Aucune évaluation."), 'daily_loss_behavior': na("Aucune limite quotidienne.")},
 'funded': {'account_nature': conf('simulated', 'fn-inst'), 'drawdown_type': conf('intraday_trailing', 'fn-inst', "Perte maximale de 6 % trailing, calculée depuis l'équité maximale (suivi basé sur l'équité)."),
   'profit_split_pct': conf(70, 'fn-inst', "70 % dès le jour 1, 80 % à partir du palier 3."), 'min_withdrawal_usd': unc(), 'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': unc(),
   'payout_paths': conf([{'id': 'fn-instant', 'label': 'À la demande ou toutes les 2 semaines', 'min_days': None, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None, 'note': "À la demande dès 5 % de croissance, ou toutes les 2 semaines avec au moins 1 % de croissance."}], 'fn-inst'),
   'safety_net': unc(), 'daily_loss_behavior': na("Aucune limite quotidienne."), 'withdrawal_conditions': conf("À la demande dès 5 % de croissance ou toutes les 2 semaines à ≥ 1 % ; aucun remboursement des frais ; aucune récompense de Challenge.", ['fn-inst'])},
 'restrictions': {**FN_RESTR, 'news': both('allowed', ['fn-inst'], "Nouvelles permises : 40 % du profit est compté pendant les nouvelles."), 'weekend': both('allowed', ['fn-inst'], "Positions de fin de semaine permises sur le compte financé.")},
 'dynamic_observations': [obs("Prix affichés Stellar Instant", 'fn-price-inst', {'page': 'cfds/stellar-instant'}, {'prix_2k_usd': 59.99, 'prix_5k_usd': 149.99, 'prix_10k_usd': 299.99, 'prix_20k_usd': 599.99}, "Page officielle.")],
 'variants': [inst_variant(s) for s in [2000, 5000, 10000, 20000]], 'promos': [],
 'watch_points': conf(["Aucune limite quotidienne mais perte maximale de 6 % trailing : un seul mauvais jour peut vider la marge.", "Levier réduit : indices et matières 1:10, crypto 1:1.", "Aucune récompense de Challenge ni remboursement des frais.", "Prix : observations affichées."], ['fn-inst'])})

# =================================================================== FUNDINGPIPS
FP_EX, FP_SK = codes("IR VN AE")
FP_ELIG = eligibility(FP_EX, [], 'unconfirmed', ['fp-start'],
    "Pays refusés : Iran, Vietnam, Émirats arabes unis ; « services are not offered to residents of certain jurisdictions, including countries on the FATF and EU/UN sanctions lists » : liste non précisée, donc un pays absent n'est PAS déclaré admissible (hors Canada, voir ci-dessous). Le Canada est déclaré admissible comme pays d'accès à la plateforme Match-Trader (« US and Canada residents can use Match-Trader »). L'accès au programme ne garantit pas l'admissibilité aux paiements.", elig=['CA'])
FP_QC = qc(('canada_general', "L'aide officielle indique que les résidents du Canada peuvent utiliser Match-Trader ; aucune règle ne mentionne le Québec expressément : le Canada est admis en général, le Québec n'est pas confirmé séparément.", ['fp-platform']),
           (AV, "Admissibilité du Québec aux paiements du compte Master non confirmée.", ['fp-start']), NOLIVE)
FP_COMMON = dict(firm_id='fundingpips', demo=False,
    instruments=conf(['FOREX', 'EURUSD', 'BTCUSD_CFD', 'ETHUSD_CFD'], 'fp-start', "41 instruments : 7 majeures Forex (EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD), 21 croisements, 2 métaux, 9 indices et énergies, 2 cryptos (BTCUSD, ETHUSD). Les noms des métaux, indices et énergies ne sont pas listés sur la page lue."),
    instruments_scope='partial', instruments_excluded=unc("Les noms des métaux, des indices et des énergies n'ont pas été lus : aucun produit ne peut être déclaré absent."),
    contract_types=conf(CFD, 'fp-start', "Forex, métaux, indices, énergies, crypto en CFD simulés ; aucun futures."),
    instrument_limits=conf([{'instrument': 'BTCUSD_CFD', 'state': 'limited', 'note': "Crypto : 1 lot maximum par clic ; levier 1:2 (Standard), commission 0,04 %."}, {'instrument': 'ETHUSD_CFD', 'state': 'limited', 'note': "Crypto : 1 lot maximum par clic ; levier 1:2 (Standard), commission 0,04 %."}], 'fp-zero', "Page Zero ; limite générale de 20 lots par clic."),
    platforms=conf(['metatrader5', 'ctrader', 'matchtrader'], 'fp-platform', "MT5 (États-Unis non pris en charge), cTrader, Match-Trader (résidents des États-Unis et du Canada)."),
    eligibility=FP_ELIG, quebec_by_stage=FP_QC)
FP_NEWS = "Master : restrictions de nouvelles propres au modèle (fenêtre de 5 à 10 minutes ; les profits des trades ouverts moins de 5 heures avant l'annonce ne comptent pas)."
def fp_variant(vid, size, ev, fu, pnote):
    return {'id': vid, 'account_size_usd': size, 'option': None, 'pricing': PR(pnote), 'evaluation': ev, 'funded': fu}
def fp_program(pid, name, url, src, sizes, summary, evaluation, funded, restrictions, ev_fn, fu_fn, watch, obs_vals, pnote="Tarif DYNAMIQUE : voir observations dynamiques."):
    return {**FP_COMMON, 'id': pid, 'name': name, 'official_url': url, 'summary': summary, 'evaluation': evaluation, 'funded': funded, 'restrictions': restrictions,
            'dynamic_observations': [obs(f"Prix d'entrée {name}", 'fp-price', {'page': 'blog/fundingpips-review-2026'}, obs_vals, "Prix d'entrée seulement ; par taille non lus.")],
            'variants': [fp_variant(f"{s//1000}k", s, ev_fn(s), fu_fn(s), pnote) for s in sizes], 'promos': [], 'watch_points': conf(watch, src)}
def fp_funded_common(split, minw, cycle_note, paths, wc, drawdown='static', ddn=None):
    return {'account_nature': conf('simulated', 'fp-start', "Capital simulé : « We provide the simulated capital »."), 'drawdown_type': (conf(drawdown, ddn[0], ddn[1]) if ddn else unc()),
            'profit_split_pct': split, 'min_withdrawal_usd': minw, 'payout_cap': unc(), 'max_payouts': unc(), 'drawdown_effect_of_payout': unc(),
            'payout_paths': conf(paths, wc[1]), 'safety_net': unc(), 'daily_loss_behavior': conf('breach', wc[1]), 'withdrawal_conditions': conf(wc[0], wc[1])}
FP_MIN1 = conf(None, 'fp-1step') if False else unc("Montant minimal : 1 % de la taille du compte Master (en dollars, selon la taille) ; non converti.")
def p(pid, label, days, cons, note): return {'id': pid, 'label': label, 'min_days': days, 'min_day_profit_usd': None, 'consistency_max_day_pct': cons, 'request_limit_pct_of_balance': None, 'note': note}
FP_RS = lambda news, weekend: {'news': restr(conf('allowed', ['fp-obj', 'fp-1step'], "Aucune restriction de nouvelles ni de week-end pendant l'évaluation."), conf('conditional', ['fp-obj', 'fp-1step'], news)),
    'overnight': restr(conf('allowed', ['fp-obj', 'fp-2pro'], "Positions overnight permises en évaluation."), unc("Master : option « Swing » requise selon certaines pages ; non tranché.")),
    'weekend': restr(conf('allowed', ['fp-obj', 'fp-1step'], "Positions de fin de semaine permises en évaluation."), weekend),
    'automated': restr(unc(), unc()), **UNK()}

# --- 1 Step Flex
def f1_ev(s): return {'profit_target_usd': pc(12, s, ['fp-1flex', 'fp-1flexsite']), 'max_drawdown_usd': pc(12, s, ['fp-1flex'], "Statique depuis la taille de départ."),
    'daily_loss_limit_usd': unc("2 % ou 3 % selon la configuration achetée (de la plus haute valeur entre solde et équité du matin) : configuration par prix non lue."), 'min_trading_days': na("Aucun jour minimum."), 'max_contracts': unc()}
def f1_fu(s): return {'max_drawdown_usd': pc(12, s, ['fp-1flex']), 'daily_loss_limit_usd': unc("2 % ou 3 % selon la configuration."), 'max_contracts': unc(), 'max_payout_usd': unc()}
write(fp_program('fundingpips-1step-flex', '1 Step Flex (FundingPips)', 'https://fundingpips.com/1-step-flex', ['fp-1flex', 'fp-1flexsite', 'fp-terms'], [5000, 10000, 25000, 50000, 100000],
  "Une seule étape (12 %), perte maximale de 12 % statique, perte quotidienne de 2 % ou 3 %, sans jour minimum ni consistance en évaluation ; récompenses toutes les 2 semaines (80 %) ou à la demande (100 %). CFD simulés, pas des futures.",
  {'steps': conf(1, ['fp-1flex', 'fp-1flexsite']), 'drawdown_type': conf('static', 'fp-1flex', "12 % sous la taille de départ ; ne bouge pas."), 'time_limit_days': na("Aucun délai ; un compte sans trade clôturé en 30 jours est violé."),
   'description': conf("Une phase : 12 % de profit, perte maximale 12 % statique, perte quotidienne 2 % ou 3 %, aucun jour minimum, aucune consistance en évaluation.", ['fp-1flex', 'fp-1flexsite']),
   'consistency_rule': conf({'exists': False, 'detail': "Aucune consistance en évaluation ; score de 35 % seulement pour les retraits « À la demande » du compte Master."}, ['fp-1flex']), 'daily_loss_behavior': conf('breach', ['fp-1flex'])},
  fp_funded_common(unc("80 % toutes les 2 semaines (page d'aide, page du site) ou 85 % (blog et page historique) : CONTRADICTION."), FP_MIN1, '', [p('fp-1flex-biweekly', 'Toutes les 2 semaines (80 %)', 14, None, "Demande tous les 14 jours calendaires après le premier trade du Master ; minimum 1 % de la taille."),
      p('fp-1flex-ondemand', 'À la demande (100 %)', None, 35, "Score de consistance 35 %, au moins 7 jours profitables (≥ 0,5 %), système d'avertissements (1 % de la taille).")],
      ("Retraits : cycle de 14 jours à 80 % (ou 85 % selon d'autres pages) ou à la demande à 100 % avec consistance 35 % et 7 jours profitables ; minimum de 1 % de la taille ; système d'avertissements (4e = fermeture).", ['fp-1flex', 'fp-1flexsite']), 'static', (['fp-1flex'], "Statique à 12 % de la taille de départ.")),
  FP_RS("Master : aucune position ni ordre 5 minutes avant/après les annonces à fort impact ; les profits de nouvelles sont retirés (profils exacts selon la configuration).", unc("CONTRADICTION : permis avec l'option Swing (page du centre d'aide) ou temporairement interdit depuis le 29 janvier 2026 (page historique) : non confirmé.")),
  f1_ev, f1_fu,
  ["CONTRADICTION : le partage est de 80 % ou 85 % selon la page ; les fins de semaine du Master sont soit permises avec l'option Swing, soit temporairement interdites.", "Un compte sans trade clôturé pendant 30 jours est violé.", "Le « 1 Step Model » (10 %, perte maximale 6 %) est un programme distinct : voir son fichier.", "Prix : observations d'entrée seulement."],
  {'prix_entree_1step_flex_usd': 66}))
# --- 1 Step (nouveau modèle)
def f1n_ev(s): return {'profit_target_usd': pc(10, s, ['fp-1step']), 'max_drawdown_usd': pc(6, s, ['fp-1step'], "Statique depuis la taille de départ."), 'daily_loss_limit_usd': pc(3, s, ['fp-1step'], "De la plus haute valeur entre solde et équité du matin ; remise à zéro à 00:00 heure de la plateforme (UTC+3)."),
    'min_trading_days': conf(3, ['fp-1step']), 'max_contracts': unc()}
def f1n_fu(s): return {'max_drawdown_usd': pc(6, s, ['fp-1step']), 'daily_loss_limit_usd': pc(3, s, ['fp-1step']), 'max_contracts': unc(), 'max_payout_usd': unc()}
write(fp_program('fundingpips-1step', '1 Step (FundingPips)', 'https://help.fundingpips.com/hc/en-us/articles/48982278587665-1-Step-Model', ['fp-1step', 'fp-terms'], [5000, 10000, 25000, 50000, 100000],
  "Une seule étape (10 %), perte maximale 6 % statique, perte quotidienne 3 %, 3 jours minimum ; quatre cycles de récompense (60 % hebdomadaire, 80 % toutes les 2 semaines, 100 % mensuel, 90 % à la demande) ; week-ends temporairement interdits sur le Master. CFD simulés, pas des futures.",
  {'steps': conf(1, ['fp-1step']), 'drawdown_type': conf('static', 'fp-1step', "6 % sous la taille de départ."), 'time_limit_days': na("Aucun délai ; inactivité de 30 jours = violation."),
   'description': conf("Une phase : 10 % de profit, 3 jours minimum, perte maximale 6 %, perte quotidienne 3 %. Politique de concentration des profits : si un trade représente plus de 60 % de l'objectif (comptes ≥ 25 000 $ créés depuis le 27 juin 2026), le Master exige 4 jours profitables avant chaque retrait.", ['fp-1step']),
   'consistency_rule': conf({'exists': False, 'detail': "Aucune consistance en évaluation ; score de 35 % seulement pour le cycle « À la demande » du Master."}, ['fp-1step']), 'daily_loss_behavior': conf('breach', ['fp-1step'])},
  fp_funded_common(unc("Partage selon le cycle choisi : 60 % hebdomadaire, 80 % toutes les 2 semaines, 100 % mensuel, 90 % à la demande : aucun pourcentage unique."), FP_MIN1, '',
     [p('fp-1-weekly', 'Hebdomadaire (60 %)', 7, None, "7 jours après le premier trade du Master."), p('fp-1-biweekly', 'Toutes les 2 semaines (80 %)', 14, None, "14 jours calendaires."), p('fp-1-monthly', 'Mensuel (100 %)', 30, None, "30 jours calendaires."),
      p('fp-1-ondemand', 'À la demande (90 %)', None, 35, "Score de consistance 35 % et au moins 2 % de profit.")],
     ("Quatre cycles : hebdomadaire 60 %, 2 semaines 80 %, mensuel 100 %, à la demande 90 % (35 % consistance, minimum 2 %) ; minimum de 1 % de la taille du Master.", ['fp-1step']), 'static', (['fp-1step'], "6 % statique.")),
  {**FP_RS("Master : nouvelles permises avec une fenêtre de 10 minutes ; les profits des trades ouverts moins de 5 heures avant l'annonce ne comptent pas.", conf('forbidden', 'fp-1step', "Interdit temporairement et jusqu'à nouvel ordre sur les comptes Master 1 Step : les trades ouverts sont fermés par le système (ce n'est pas une violation).")),
   'overnight': restr(conf('allowed', 'fp-1step', "Aucune restriction en évaluation."), unc("Positions overnight du Master non précisées séparément."))},
  f1n_ev, f1n_fu,
  ["CONTRADICTION : ce modèle (10 % / 6 %) n'est pas listé sur la page Get Started, qui cite 1 Step Flex, 2 Step Standard / Flex / Pro et Zero ; sa disponibilité actuelle n'est pas confirmée.", "Week-ends temporairement interdits sur le Master (changement « jusqu'à nouvel ordre »).", "Risque par idée de trade (limite par trade : 3 % sous 50K, 2 % dès 50K) ne s'applique qu'au Master.", "Prix non lus."],
  {'prix_entree': 'non lu'}))
# --- 2 Step Standard
def f2_ev(s): return {'profit_target_usd': pc(8, s, ['fp-2std']), 'profit_target_phase2_usd': pc(5, s, ['fp-2std']), 'max_drawdown_usd': pc(10, s, ['fp-2std'], "Statique."),
    'daily_loss_limit_usd': pc(5, s, ['fp-2std', 'fp-terms'], "5 % par défaut ; 3 % avec l'option « perte quotidienne 3 % »."),
    'min_trading_days': unc("Phase 2 : 3 jours (aucun avec l'option 3 %) ; la phase 1 n'est pas énoncée sur la page principale (3 jours sur la page « Legacy Rules ») : non tranché."), 'max_contracts': unc()}
def f2_fu(s): return {'max_drawdown_usd': pc(10, s, ['fp-2std']), 'daily_loss_limit_usd': pc(5, s, ['fp-2std', 'fp-terms']), 'max_contracts': unc(), 'max_payout_usd': unc()}
write(fp_program('fundingpips-2step-standard', '2 Step Standard (FundingPips)', 'https://help.fundingpips.com/hc/en-us/articles/34501809112081-2-Step-Standard', ['fp-2std', 'fp-terms'], [5000, 10000, 25000, 50000, 100000],
  "Deux phases (8 % puis 5 %), perte maximale 10 % statique, perte quotidienne 5 % (ou 3 % avec option), levier Forex 1:100 ; récompenses hebdomadaire 60 %, 2 semaines 80 % ou à la demande ; frais remboursés à la 4e récompense. CFD simulés, pas des futures.",
  {'steps': conf(2, ['fp-2std']), 'drawdown_type': conf('static', 'fp-2std', "10 % sous la taille de départ."), 'time_limit_days': na("Aucun délai ; inactivité de 30 jours = violation."),
   'description': conf("Deux phases : 8 % puis 5 % ; perte maximale 10 % statique ; perte quotidienne 5 % (3 % avec option) ; l'objectif de 10 % n'est plus offert depuis le 24 juillet 2026.", ['fp-2std']),
   'consistency_rule': conf({'exists': False, 'detail': "Aucune consistance en évaluation ; score de 35 % seulement pour le cycle « À la demande » du Master."}, ['fp-2std']), 'daily_loss_behavior': conf('breach', ['fp-2std'])},
  fp_funded_common(unc("Partage selon le cycle : 60 % hebdomadaire, 80 % toutes les 2 semaines, à la demande 90 % (blog) ou 100 % (page d'aide) : CONTRADICTION."), FP_MIN1, '',
     [p('fp-s-weekly', 'Hebdomadaire (60 %)', 7, None, "7 jours après le premier trade du Master."), p('fp-s-biweekly', 'Toutes les 2 semaines (80 %)', 14, None, "14 jours calendaires."), p('fp-s-ondemand', 'À la demande', None, 35, "Score de consistance 35 %, 7 jours profitables, avertissements ; 90 % ou 100 % selon la source.")],
     ("Cycles : hebdomadaire 60 %, 2 semaines 80 %, à la demande 90 ou 100 % (35 % consistance, 7 jours profitables) ; frais remboursés à la 4e récompense du Master Standard.", ['fp-2std']), 'static', (['fp-2std'], "10 % statique.")),
  FP_RS("Master : restrictions de nouvelles (profits retirés pour les trades ouverts moins de 5 heures avant l'annonce).", conf('conditional', ['fp-2std', 'fp-obj'], "Master : positions de week-end permises avec l'option Swing (levier réduit 1:30) ; non permises sans.")),
  f2_ev, f2_fu,
  ["CONTRADICTION : à la demande 90 % (blog) ou 100 % (page d'aide) ; minimum de jours de la phase 1 non tranché.", "L'objectif de 10 % de la phase 1 n'est plus offert depuis le 24 juillet 2026.", "Sans l'option Swing, les week-ends du Master ne sont pas permis.", "Prix d'entrée seulement."],
  {'prix_entree_usd': 34}))
# --- 2 Step Flex
def f2f_ev(s): return {'profit_target_usd': pc(10, s, ['fp-obj']), 'profit_target_phase2_usd': pc(8, s, ['fp-obj']), 'max_drawdown_usd': pc(12, s, ['fp-obj']), 'daily_loss_limit_usd': pc(4, s, ['fp-obj', 'fp-terms']),
    'min_trading_days': conf(1, ['fp-obj'], "1 jour par phase."), 'max_contracts': unc()}
def f2f_fu(s): return {'max_drawdown_usd': pc(12, s, ['fp-obj']), 'daily_loss_limit_usd': pc(4, s, ['fp-obj']), 'max_contracts': unc(), 'max_payout_usd': unc()}
write(fp_program('fundingpips-2step-flex', '2 Step Flex (FundingPips)', 'https://fundingpips.com/trading-objectives', ['fp-obj', 'fp-terms', 'fp-review'], [5000, 10000, 25000, 50000, 100000],
  "Deux phases (10 % puis 8 %), perte maximale 12 % et perte quotidienne 4 %, 1 jour minimum par phase ; partage de 85 % ou 95 % choisi à l'achat, cycle de 2 semaines. CFD simulés, pas des futures.",
  {'steps': conf(2, ['fp-obj']), 'drawdown_type': conf('static', ['fp-obj', 'fp-review'], "12 % de perte maximale statique (« highest max static loss » selon la revue du site)."), 'time_limit_days': na("Période illimitée ; inactivité de 30 jours = violation."),
   'description': conf("Deux phases : 10 % puis 8 %, perte maximale 12 %, perte quotidienne 4 %, 1 jour minimum ; page de 180 jours : à reconfirmer.", ['fp-obj']),
   'consistency_rule': conf({'exists': False, 'detail': None}, ['fp-obj'], "Aucune consistance en évaluation ; cycles de récompense : minimum de 1 % et 3 jours profitables."), 'daily_loss_behavior': conf('breach', ['fp-obj'])},
  fp_funded_common(unc("85 % ou 95 % choisis à l'achat, cycle de 2 semaines : aucun pourcentage unique."), FP_MIN1, '', [p('fp-f-ondemand', 'À la demande (100 %)', None, 35, "Minimum 1 % de profit, 3 jours profitables, consistance 35 %, 7 jours de 0,5 % pour le cycle à la demande selon la page.")],
     ("Récompense minimale de 1 % de la taille ; 3 jours profitables minimum ; à la demande à 100 % avec consistance 35 % et 7 jours de 0,5 % ; 85 % ou 95 % au cycle de 2 semaines.", ['fp-obj', 'fp-review']), 'static', (['fp-obj'], "12 % statique.")),
  FP_RS("Master : interdit d'ouvrir ou de fermer une position 5 minutes avant/après les annonces à fort impact sur les devises concernées ; les profits de nouvelles sont retirés.", conf('conditional', ['fp-obj'], "Master : l'option Swing (+10 %) est requise pour garder des positions overnight ou de fin de semaine (page de 180 jours ; une mise à jour temporaire de 2026 interdit les week-ends sur certains modèles) : à reconfirmer.")),
  f2f_ev, f2f_fu,
  ["CONTRADICTION : les Terms indiquent une perte maximale de 10 % pour tous les modèles 2 Step alors que la page des objectifs donne 12 % pour 2 Step Flex : valeurs de la page des objectifs retenues, à reconfirmer.", "Page des objectifs de 180 jours (non récente).", "Option Swing (+10 %) requise pour les positions overnight / week-end du Master.", "Prix d'entrée seulement."],
  {'prix_entree_usd': 32}))
# --- 2 Step Pro
def f2p_ev(s): return {'profit_target_usd': pc(6, s, ['fp-2pro']), 'profit_target_phase2_usd': pc(6, s, ['fp-2pro']), 'max_drawdown_usd': pc(6, s, ['fp-2pro'], "Statique depuis la taille de départ."), 'daily_loss_limit_usd': pc(3, s, ['fp-2pro', 'fp-terms']),
    'min_trading_days': conf(0, ['fp-2pro'], "Aucun jour minimum pour les nouveaux comptes achetés depuis le 26 août 2026 (1 jour pour les comptes existants).") , 'max_contracts': unc()}
def f2p_fu(s): return {'max_drawdown_usd': pc(6, s, ['fp-2pro']), 'daily_loss_limit_usd': pc(3, s, ['fp-2pro']), 'max_contracts': unc(), 'max_payout_usd': unc()}
write(fp_program('fundingpips-2step-pro', '2 Step Pro (FundingPips)', 'https://help.fundingpips.com/hc/en-us/articles/34502027344017-2-Step-Pro-Model', ['fp-2pro', 'fp-terms', 'fp-legacy'], [5000, 10000, 25000, 50000, 100000, 200000],
  "Deux phases de 6 % chacune, perte maximale 6 % et perte quotidienne 3 %, aucun jour minimum pour les nouveaux comptes ; récompense hebdomadaire 80 % ou à la demande 100 % (consistance 35 %, 7 jours profitables). CFD simulés, pas des futures.",
  {'steps': conf(2, ['fp-2pro']), 'drawdown_type': conf('static', 'fp-2pro', "6 % sous la taille de départ."), 'time_limit_days': na("Aucun délai."),
   'description': conf("Deux phases de 6 % ; perte maximale 6 % ; perte quotidienne 3 % ; aucun jour minimum pour les nouveaux comptes.", ['fp-2pro']),
   'consistency_rule': conf({'exists': False, 'detail': "Aucune consistance en évaluation ; 35 % seulement pour le cycle « À la demande » du Master."}, ['fp-2pro']), 'daily_loss_behavior': conf('breach', ['fp-2pro'])},
  fp_funded_common(unc("80 % hebdomadaire ou 100 % à la demande : aucun pourcentage unique."), FP_MIN1, '', [p('fp-p-weekly', 'Hebdomadaire (80 %)', 7, None, "7 jours calendaires après le premier trade du Master."), p('fp-p-ondemand', 'À la demande (100 %)', None, 35, "Consistance 35 %, 7 jours profitables (≥ 0,5 %), avertissements.")],
     ("Récompense hebdomadaire à 80 % ou à la demande à 100 % (consistance 35 %, 7 jours profitables) ; minimum de 1 % ; avertissements (4e = fermeture).", ['fp-2pro']), 'static', (['fp-2pro'], "6 % statique.")),
  {**FP_RS("Master : trades ouverts moins de 5 heures avant l'annonce : profits retirés s'ils sont fermés dans la fenêtre restreinte.", conf('conditional', ['fp-2pro'], "Positions overnight et week-end : toujours permises en évaluation ; permises sur le Master avec l'option Swing.")),
   'news': restr(unc("Page principale non explicite pour l'évaluation."), conf('conditional', ['fp-2pro'], "Trades ouverts moins de 5 heures avant l'annonce : profits retirés s'ils sont fermés dans la fenêtre restreinte."))},
  f2p_ev, f2p_fu,
  ["Objectifs de 6 % : plus bas de la gamme, mais perte maximale de 6 % seulement.", "Les comptes achetés avant le 26 août 2026 gardent un jour minimum.", "Option Swing requise pour les positions overnight / week-end du Master.", "Prix d'entrée seulement."],
  {'prix_entree_usd': 29}))
# --- Zero
def z_ev(s): return {'profit_target_usd': na("Aucun objectif."), 'max_drawdown_usd': na("Aucune évaluation."), 'daily_loss_limit_usd': na("Aucune évaluation."), 'min_trading_days': na("Aucune évaluation."), 'max_contracts': unc()}
def z_fu(s): return {'max_drawdown_usd': pc(5, s, ['fp-zero'], "Trailing : plancher à 5 % sous le sommet d'équité, se verrouille à la taille de départ quand l'équité atteint +5 %."), 'daily_loss_limit_usd': pc(3, s, ['fp-zero', 'fp-terms']), 'max_contracts': conf(20, ['fp-zero'], "20 lots maximum par clic (1 lot pour la crypto)."), 'max_payout_usd': na("Aucun plafond de récompense (« No Reward Caps »).")}
write(fp_program('fundingpips-zero', 'Zero (FundingPips)', 'https://fundingpips.com/zero', ['fp-zero', 'fp-terms', 'fp-review'], [5000, 10000, 25000, 50000, 100000, 200000],
  "Compte Master dès le jour 1, sans évaluation : perte maximale de 5 % trailing qui se verrouille à +5 %, perte quotidienne 3 %, consistance 15 % ; partage de 95 % toutes les 2 semaines ; risque ouvert maximal de 1 %. CFD simulés, pas des futures.",
  {'steps': conf(0, ['fp-zero']), 'drawdown_type': na("Aucune évaluation."), 'time_limit_days': na("Aucune évaluation."), 'description': conf("Aucune évaluation : compte Master dès l'achat ; 7 jours à profit net ≥ 0,25 % par période de 30 jours pour rester éligible aux récompenses.", ['fp-zero']),
   'consistency_rule': na("Voir le compte funded (consistance de 15 %)."), 'daily_loss_behavior': na("Aucune évaluation.")},
  {**fp_funded_common(conf(95, ['fp-zero'], "95 % toutes les 2 semaines."), unc("Minimum de 1 % de la taille du compte (en dollars, selon la taille)."), '', [p('fp-z-biweekly', 'Toutes les 2 semaines (95 %)', 14, 15, "Demande tous les 14 jours calendaires après le premier trade ; consistance 15 % (soft : bloque la demande) ; 7 jours à ≥ 0,25 % par 30 jours.")],
     ("Récompense de 95 % toutes les 2 semaines ; consistance de 15 % (le plus gros jour ≤ 15 % du profit cumulé) ; minimum de 1 % ; pas de plafond de récompense ; une page ancienne annonce 7 jours avant le premier retrait : non tranché.", ['fp-zero']), 'intraday_trailing', (['fp-zero'], "Trailing de 5 % sur l'équité maximale, verrouillé à la taille de départ à +5 %.")),
   'safety_net': conf({'exists': False, 'detail': None}, 'fp-zero', "Aucun buffer mentionné.")},
  {**FP_RS("Restrictions de nouvelles sur le compte (détail de la fenêtre non lu).", unc("Week-ends : non précisés sur la page actuelle ; la page « Legacy Rules » exige la fermeture avant la clôture du vendredi : à reconfirmer.")),
   'news': restr(na("Aucune évaluation."), conf('conditional', ['fp-zero'], "Restrictions de nouvelles propres au compte Zero (détail de la fenêtre non lu).")),
   'overnight': restr(na("Aucune évaluation."), unc()), 'weekend': restr(na("Aucune évaluation."), unc("Page actuelle silencieuse ; page historique : fermeture obligatoire avant la clôture du vendredi.")),
   'copy_trading': restr(na("Aucune évaluation."), conf('allowed', ['fp-review'], "Copy trading permis (blog officiel)."))},
  z_ev, z_fu,
  ["Perte maximale de 5 % trailing sur l'équité (plancher mobile), se verrouille quand l'équité atteint +5 %.", "Risque ouvert maximal : la perte flottante combinée ne peut pas dépasser 1 % de la taille à aucun moment.", "Perte maximale par « idée de trade » (3 % sous 50K, 2 % dès 50K).", "Consistance de 15 % : bloque les récompenses sans fermer le compte.", "Prix d'entrée seulement ; contradiction ancienne : 499 $ pour 100K."],
  {'prix_entree_usd': 60}))
print('OK; pays non codés ignorés :', {'FTMO': FT_SK, 'The5ers': T5_SK, 'FundedNext': FN_SK, 'FundingPips': FP_SK})
