#!/usr/bin/env python3
"""Génère les données RÉELLES du lot 1 (Topstep, Apex Trader Funding) : data/programs/topstep-*.json, apex-*.json,
et ajoute leurs entreprises / sources officielles. Chaque valeur « confirmed » cite une page OFFICIELLE lue ;
tout le reste est « unconfirmed » (jamais de valeur inventée). Date de vérification : 2026-11-15."""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
D = '2026-11-15'
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

# ---------------------------------------------------------------- sources officielles
H = 'https://help.topstep.com/en/articles/'
A = 'https://apextraderfunding.com/help-center/'
S = 'https://support.apextraderfunding.com/hc/en-us/articles/'
SOURCES = [
 ('ts-pricing', 'Topstep — Pricing and Payment Questions (centre d\'aide)', H+'14289835-topstep-pricing-and-payment-questions'),
 ('ts-combine', 'Topstep — Trading Combine Parameters (centre d\'aide)', H+'8284197-trading-combine-parameters'),
 ('ts-consistency', 'Topstep — Consistency at Topstep (centre d\'aide)', H+'8284208-consistency-at-topstep'),
 ('ts-xfa', 'Topstep — Express Funded Account Parameters (centre d\'aide)', H+'8284215-express-funded-account-parameters'),
 ('ts-payouts', 'Topstep — Payout Policy (centre d\'aide)', H+'8284233-topstep-payout-policy'),
 ('ts-scaling', 'Topstep — What is the Scaling Plan? (centre d\'aide)', H+'8284223-what-is-the-scaling-plan'),
 ('ts-prohibited', 'Topstep — Prohibited Trading Strategies at Topstep (centre d\'aide)', H+'10305426-prohibited-trading-strategies-at-topstep'),
 ('ts-pro', 'Topstep — What is a Pro Account? (centre d\'aide)', H+'14645398-what-is-a-pro-account'),
 ('ts-products', 'Topstep — When and What Products Can I Trade? (centre d\'aide)', H+'8284206-when-and-what-products-can-i-trade'),
 ('ts-risk', 'Topstep — Risk Adjustments: High Risk/High Volatility (centre d\'aide)', H+'13613539-risk-adjustments-high-risk-high-volatility'),
 ('ts-eligibility', 'Topstep — Am I Eligible to Trade with Topstep? (centre d\'aide)', H+'8284116-am-i-eligible-to-trade-with-topstep'),
 ('ts-site', 'Topstep — page des comptes Trading Combine (site officiel)', 'https://www.topstep.com/topstep-prop'),
 ('ts-xfa-rules', 'Topstep — Express Funded Account Rules (site officiel)', 'https://www.topstep.com/express-funded-account-rules'),
 ('ts-forex', 'Topstep — Can I trade Forex with You? (centre d\'aide)', H+'8284113-can-i-trade-forex-with-you'),
 ('ts-faq', 'Topstep — FAQ plateformes (TopstepX seule plateforme)', 'https://intercom.help/topstep-llc/en/articles/8451438-frequently-asked-questions'),
 ('ax-home', 'Apex Trader Funding — page d\'accueil et choix des comptes (site officiel)', 'https://apextraderfunding.com/'),
 ('ax-eod-pa', 'Apex — EOD Performance Accounts (centre d\'aide)', A+'eod-trailing-drawdown-accounts/eod-performance-accounts-pa/'),
 ('ax-intraday-pa', 'Apex — Intraday Trailing Drawdown Performance Accounts (centre d\'aide)', A+'intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-performance-accounts-pa/'),
 ('ax-eod-payouts', 'Apex — EOD Payouts (centre d\'aide)', A+'eod-trailing-drawdown-accounts/eod-payouts/'),
 ('ax-intraday-payouts', 'Apex — Intraday Trailing Drawdown Payouts (centre d\'aide)', A+'intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-payouts/'),
 ('ax-prohibited', 'Apex — Prohibited Activities (centre d\'aide)', A+'getting-started/prohibited-activities/'),
 ('ax-pa-compliance', 'Apex — Performance Account (PA) and Compliance (centre d\'aide)', S+'31519788944411-Performance-Account-PA-and-Compliance'),
 ('ax-times', 'Apex — Futures Trading Times (centre d\'aide)', A+'getting-started/futures-trading-times/'),
 ('ax-restricted', 'Apex — Restricted Countries (centre d\'aide)', A+'getting-started/restricted-countries/'),
 ('ax-eval-fees', 'Apex — Evaluation Plan Fees and Access Explained (centre d\'aide)', A+'billing/evaluation-plan-fees-and-access-explained/'),
 ('ax-pa-activation', 'Apex — PA Activation Process & Deadline Explained (centre d\'aide)', A+'billing/pa-activation-process-deadline-explained/'),
 ('ax-picker', 'Apex — sélecteur de comptes du site officiel (tarifs dynamiques, paramètres d\'URL picker_*)', 'https://apextraderfunding.com/?picker_balance=100k&picker_fee=nofee&picker_type=trail-eod'),
 ('ax-live-faq', 'Apex — Live Prop Trading Program FAQ (centre d\'aide)', A+'getting-started/apex-live-prop-trading-program-faq/'),
]
FIRMS = [
 {'id': 'topstep', 'name': 'Topstep', 'website': 'https://www.topstep.com', 'demo': False,
  'description': "Entreprise américaine de futures (CME). Évaluation « Trading Combine » par abonnement mensuel, puis compte financé « Express Funded Account »."},
 {'id': 'apex-trader-funding', 'name': 'Apex Trader Funding', 'website': 'https://apextraderfunding.com', 'demo': False,
  'description': "Entreprise américaine de futures (CME, CBOT, NYMEX, COMEX). Évaluations à paiement unique (version EOD ou Intraday), puis compte « Performance Account »."},
]

def merge(fn, items, key='id'):
    p = os.path.join(ROOT, fn); cur = json.load(open(p))
    ids = {x[key] for x in items}
    cur = [x for x in cur if x[key] not in ids] + items
    json.dump(cur, open(p, 'w'), ensure_ascii=False, indent=2)
EVID = json.load(open(os.path.join(ROOT, 'evidence', 'apex-picker-2026-11-15.json')))
def _src(i, l, u):
    d = {'id': i, 'label': l, 'url': u, 'type': 'official'}
    if i == 'ax-picker':
        d.update({'durable': False, 'consulted_at': EVID['consulted_at'], 'evidence_file': 'data/evidence/apex-picker-2026-11-15.json',
                  'parameters': {'picker_balance': '25k|50k|100k|150k', 'picker_fee': 'standard|nofee', 'picker_type': 'trail-eod|trail-intraday'}})
    return d
merge('sources.json', [_src(i, l, u) for i, l, u in SOURCES])
OBS_BY_TYPE = {}
for o in EVID['observations']:
    OBS_BY_TYPE.setdefault(o['parameters']['picker_type'], []).append(o)
def dyn_obs(eod):
    out = []
    for o in OBS_BY_TYPE['trail-eod' if eod else 'trail-intraday']:
        ob = o['observed']
        out.append({'label': f"Sélecteur officiel — {o['parameters']['picker_balance'].upper()} {'EOD' if eod else 'Intraday'} (option Standard)",
                    'source': 'ax-picker', 'parameters': o['parameters'], 'consulted_at': EVID['consulted_at'],
                    'evidence_file': 'data/evidence/apex-picker-2026-11-15.json', 'durable': False,
                    'observed': {'prix_affiche_usd': ob['displayed_price_usd'], 'prix_avec_code_promo_usd': ob['coupon_price_usd'], 'contrats_max': ob['max_contracts'], 'objectif_usd': ob['profit_target_usd'], 'drawdown_usd': ob['max_drawdown_usd'], 'limite_quotidienne_usd': ob['daily_loss_limit_usd']},
                    'note': "Valeur observée, NON confirmée comme prix : tarif dynamique (date, promotion, code). À relire sur le site au moment de l'achat."})
    return out
merge('firms.json', FIRMS)

def restr(ev, fu): return {'evaluation': ev, 'funded': fu}
def both(v, src, note=None): return restr(conf(v, src, note), conf(v, src, note))

# ---------------------------------------------------------------- TOPSTEP
TS_INSTR = ['ES','MES','NQ','MNQ','RTY','M2K','YM','MYM','MBT','MET','6E','M6E','GC','MGC','CL','MCL']
sizes = [(50000, 49, 95, 3000, 2000, 1000, 5), (100000, 99, 149, 6000, 3000, 2000, 10), (150000, 199, 229, 9000, 4500, 3000, 15)]
ts_cap = {50000: (2000, 3000), 100000: (3000, 4000), 150000: (5000, 6000)}
def ts_variant(size, monthly, tgt, mll, dll, cts, opt):
    fee = 149 if opt is None else None
    return {
      'id': f"{size//1000}k-{'standard' if opt is None else 'sans-frais-activation'}",
      'account_size_usd': size, 'option': opt,
      'pricing': {
        'one_time': na("Abonnement mensuel, pas de paiement unique."),
        'monthly': conf(monthly, 'ts-pricing', "Se renouvelle chaque mois jusqu'à la réussite ou l'annulation. La voie (Standard / Sans frais d'activation) ne peut pas être changée après l'achat."),
        'activation_fee': conf(149, 'ts-pricing', "Facturés une seule fois par Express Funded Account obtenu, après la réussite.") if opt is None else na("Voie « Sans frais d'activation » : aucun frais à la réussite (mensualité plus élevée)."),
        'reset_fee': conf(monthly, 'ts-pricing', "Prix d'une réinitialisation après avoir touché la Maximum Loss Limit."),
        'conditional_fees': unc("Frais de réactivation d'un XFA fermé (Back2Funded) : 599 $ / 699 $ / 829 $ selon la taille ; non modélisés ici.")},
      'evaluation': {
        'profit_target_usd': conf(tgt, ['ts-site','ts-consistency']),
        'max_drawdown_usd': conf(mll, ['ts-site','ts-xfa-rules'], "Maximum Loss Limit : suit le solde de fin de journée (EOD) et se verrouille au solde de départ."),
        'daily_loss_limit_usd': conf(dll, 'ts-site', "Limite quotidienne OPTIONNELLE dans le Combine (choisie à l'achat) ; obligatoire seulement sur le compte Live."),
        'min_trading_days': conf(2, 'ts-combine', "« Réussir en aussi peu que deux jours » (aucun minimum explicite autre que celui qui découle de la règle des 55 %)."),
        'max_contracts': conf(cts, 'ts-combine', "Contrats standard ; micros à 10 pour 1.")},
      'funded': {
        'max_drawdown_usd': conf(mll, 'ts-xfa-rules', "Identique à celle du Combine ; après le premier retrait, la limite passe définitivement à 0 $."),
        'daily_loss_limit_usd': conf(dll, 'ts-site', "Optionnelle."),
        'max_contracts': unc("Fixé par le Scaling Plan (progressif selon le solde) : valeurs par taille non lues."),
        'max_payout_usd': conf(ts_cap[size][0], 'ts-payouts', f"Chemin Standard. Chemin Consistency : {ts_cap[size][1]} $ par retrait. Des plafonds doublés sont annoncés pour les nouveaux Combines achetés avec la limite quotidienne optionnelle, dans le cadre d'une offre à durée limitée (début le 2 juin) : non modélisés.")}}
ts_variants = []
for size, m_std, m_noact, tgt, mll, dll, cts in sizes:
    ts_variants.append(ts_variant(size, m_std, tgt, mll, dll, cts, None))
    ts_variants.append(ts_variant(size, m_noact, tgt, mll, dll, cts, "Sans frais d'activation"))

TOPSTEP = {
 'id': 'topstep-trading-combine', 'firm_id': 'topstep', 'name': 'Trading Combine (Topstep)', 'demo': False,
 'official_url': 'https://www.topstep.com/topstep-prop',
 'summary': "Évaluation en une étape par abonnement mensuel (sans limite de temps), avec une seule règle de perte (Maximum Loss Limit de fin de journée) et un objectif de consistance de 55 %. Réussite → compte Express Funded Account (retraits à 90/10). Day trading seulement : positions fermées à 15 h 10 (heure du Centre), pas de Forex ni de CFD.",
 'instruments': conf(TS_INSTR, 'ts-products', "Liste officielle « Permitted Products » (tous les produits CME Group permis). Parmi le catalogue de l'outil : indices (ES, MES, NQ, MNQ, RTY, M2K, YM, MYM), crypto à terme (MBT, MET), devises à terme (6E, M6E), métaux (GC, MGC), pétrole (CL, MCL)."),
 'instruments_scope': 'exhaustive',
 'instruments_excluded': conf([], 'ts-products', "Tous les futures de notre catalogue figurent dans la liste officielle ; la liste officielle contient d'autres produits CME (ex. métaux SI, HG, PL, énergies, taux) hors de notre catalogue : leur absence du comparateur ne signifie pas qu'ils sont interdits. Les CFD, le comptant et les perpétuels du catalogue sont écartés par le type de contrat (futures seulement)."),
 'contract_types': conf(['futures'], ['ts-products','ts-forex'], "« No Forex » : uniquement des contrats à terme CME Group (aucun CFD, aucun marché au comptant)."),
 'instrument_limits': conf([
   {'instrument': 'GC', 'state': 'limited', 'note': "Risk Adjustments : 3 / 6 / 9 contrats (comptes 50K / 100K / 150K) dans le Combine, le XFA et le Live ; limite temporaire tant que la volatilité est élevée. Le Scaling Plan du XFA peut imposer moins."},
   {'instrument': 'MGC', 'state': 'limited', 'note': "Risk Adjustments : 30 / 60 / 90 micros dans le Combine et le XFA ; 5 / 10 / 15 micros sur le compte Live. Limite temporaire."},
   {'instrument': 'CL', 'state': 'limited', 'note': "Risk Adjustments : 3 / 6 / 9 contrats (50K / 100K / 150K), Combine, XFA et Live. Limite temporaire."},
   {'instrument': 'MCL', 'state': 'limited', 'note': "Risk Adjustments : 30 / 60 / 90 micros dans le Combine et le XFA ; 3 / 6 / 9 sur le Live. Limite temporaire."},
   {'instrument': 'MBT', 'state': 'limited', 'note': "Risk Adjustments : 5 / 10 / 15 contrats (Combine, XFA). Limite temporaire."},
   {'instrument': 'ES', 'state': 'limited', 'note': "Annonces Tier 1 (CPI, FOMC, NFP, PPI) : aucune nouvelle ouverture pendant la fenêtre de 10 minutes."},
   {'instrument': 'NQ', 'state': 'limited', 'note': "Annonces Tier 1 (CPI, FOMC, NFP, PPI) : aucune nouvelle ouverture pendant la fenêtre de 10 minutes."},
   {'instrument': 'RTY', 'state': 'limited', 'note': "Annonces Tier 1 : aucune nouvelle ouverture pendant la fenêtre de 10 minutes."},
   {'instrument': 'YM', 'state': 'limited', 'note': "Annonces Tier 1 : aucune nouvelle ouverture pendant la fenêtre de 10 minutes."},
   {'instrument': 'MES', 'state': 'limited', 'note': "Annonces Tier 1 : nouvelles ouvertures plafonnées (1 / 3 / 6 / 9 / 15 contrats selon la taille 25K à 250K)."},
   {'instrument': 'MNQ', 'state': 'limited', 'note': "Annonces Tier 1 : nouvelles ouvertures plafonnées (1 / 3 / 6 / 9 / 15 contrats selon la taille 25K à 250K)."},
   {'instrument': 'M2K', 'state': 'limited', 'note': "Annonces Tier 1 : nouvelles ouvertures plafonnées selon la taille du compte."},
   {'instrument': 'MYM', 'state': 'limited', 'note': "Annonces Tier 1 : nouvelles ouvertures plafonnées selon la taille du compte."}],
   'ts-risk', "Page « Risk Adjustments » lue le 2026-11-15 : limites temporaires, propres à chaque produit, annoncées par courriel / tableau de bord. SI, HG et PL (hors catalogue) sont à 0 dans tous les comptes. Les valeurs peuvent changer sans préavis : relire la page avant de trader."),
 'platforms': conf(['proprietary'], 'ts-faq', "TopstepX est la seule plateforme disponible depuis le 7 juillet 2025."),
 'evaluation': {
   'steps': conf(1, 'ts-combine'),
   'drawdown_type': conf('eod_trailing', ['ts-combine','ts-xfa-rules']),
   'time_limit_days': na("Aucune limite de temps : abonnement mensuel renouvelé jusqu'à la réussite ou l'annulation."),
   'description': conf("Atteindre l'objectif de profit sans toucher la Maximum Loss Limit (qui suit le solde de fin de journée), en gardant le meilleur jour sous 55 % de l'objectif. Abonnement mensuel.", 'ts-combine'),
   'consistency_rule': conf({'exists': True, 'detail': "Le meilleur jour ne doit pas dépasser 55 % de l'objectif de profit (règle stricte, sans marge) ; sinon l'objectif augmente."}, 'ts-consistency')},
 'funded': {
   'account_nature': unc("Page officielle : « les profits sont réels » ; la nature simulée du XFA n'est pas énoncée clairement dans les pages lues."),
   'drawdown_type': conf('eod_trailing', 'ts-xfa-rules'),
   'profit_split_pct': conf(90, 'ts-payouts', "90/10 pour les comptes ouverts depuis le 12 janvier 2026 ; les anciens comptes ont un régime transitoire (100 % des premiers 10 000 $) selon des sources tierces."),
   'min_withdrawal_usd': conf(125, 'ts-payouts'),
   'payout_cap': conf({'has_cap': True, 'amount_usd': 5000}, ['ts-payouts','ts-xfa','ts-xfa-rules'], "5 000 $ = plafond du chemin Standard pour le compte 150K (6 000 $ en Consistency) : ce sont les maxima des tailles ; les plafonds par taille sont aux comptes (50K : 2 000 / 3 000 $ ; 100K : 3 000 / 4 000 $ ; 150K : 5 000 / 6 000 $). Les « 5 000 $ / 6 000 $ » des pages XFA ne contredisent donc pas la politique de paiement. Compte Live : aucun plafond."),
   'safety_net': unc("Aucun « Safety Net » nommé dans la politique de paiement lue ; aucune formule de solde minimal après le premier retrait n'y figure non plus. Effet connu : la Maximum Loss Limit passe à 0 $ après chaque retrait (voir « effet sur le drawdown »)."),
   'payout_paths': conf([
     {'id': 'standard', 'label': 'Standard', 'min_days': 5, 'min_day_profit_usd': 150, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': 50,
      'note': "5 jours gagnants (≥ 150 $ de P&L net, non consécutifs ; journée figée à 16 h CT) ; profit net > 0 $ depuis le dernier retrait (le premier retrait en est exempt) ; demande jusqu'à 50 % du solde, plafonnée par taille : 2 000 / 3 000 / 5 000 $."},
     {'id': 'consistency', 'label': 'Consistency', 'min_days': 3, 'min_day_profit_usd': None, 'consistency_max_day_pct': 40, 'request_limit_pct_of_balance': 50,
      'note': "3 jours de trading avec au moins 1 trade ; le plus gros jour ≤ 40 % du profit net total ; jusqu'à 50 % du solde, plafonné par taille : 3 000 / 4 000 / 6 000 $."}], 'ts-payouts', "Le chemin se choisit à l'activation du XFA. Après chaque retrait, le décompte des jours gagnants / de consistance repart."),
   'max_payouts': unc("Le nombre maximal de retraits par XFA n'est pas énoncé dans la politique de paiement lue (jusqu'à 5 XFA simultanés ; l'appel au compte Live relève de l'équipe de risque)."),
   'drawdown_effect_of_payout': conf("Après chaque retrait XFA, la Maximum Loss Limit passe définitivement à 0 $ ; si le retrait ramène le solde à un palier inférieur du Scaling Plan, le nombre maximal de contrats diminue.", ['ts-payouts']),
   'withdrawal_conditions': conf("Deux chemins au choix à l'activation du XFA : Standard (5 jours gagnants de 150 $ ou plus, non consécutifs ; profit net > 0 $ depuis le dernier retrait) ou Consistency (3 jours de trading, meilleur jour ≤ 40 % du profit). Jusqu'à 50 % du solde, plafonné par taille ; minimum 125 $ ; retraits pendant les heures CME ; jusqu'à 5 XFA simultanés.", ['ts-payouts','ts-xfa'])},
 'restrictions': {
   'news': restr(unc("Page « Economic Releases » non lue en détail ; des limites de lots s'appliquent pendant les annonces Tier 1 sur certains produits."), unc()),
   'overnight': both('forbidden', ['ts-products'], "Toutes les positions doivent être fermées à 15 h 10 (heure du Centre) chaque jour de semaine. Reprise à 17 h."),
   'weekend': both('forbidden', ['ts-products'], "« Pas de swing trading » : aucune position conservée jusqu'au lendemain ni pendant la fin de semaine."),
   'asian_session': restr(unc("La journée de trading court de 17 h à 15 h 10 (CT) ; règle propre à la session asiatique non lue."), unc()),
   'scalping': restr(unc(), unc()),
   'automated': restr(unc("Une FAQ « Can I use automated trading strategies? » existe sur la page Trading Combine Parameters ; la réponse n'a pas pu être lue."), unc()),
   'copy_trading': restr(unc(), unc())},
 'eligibility': unc("Page officielle d'éligibilité (ts-eligibility, lue le 2026-11-15) : admissibilité fondée sur la citoyenneté ET la résidence ; liste de pays inéligibles et liste de pays admis au XFA mais sans compte Live. Le Canada ne figure dans aucune des deux listes, mais la page ne déclare pas expressément les Canadiens admissibles (sa FAQ « Je suis Canadien » explique seulement la structure de sous-compte) et ne mentionne pas le Québec : l'absence d'exclusion n'est pas une confirmation."),
 'quebec_by_stage': [
   {'stage': 'evaluation', 'state': 'a_verifier', 'note': "Le Canada n'est pas dans la liste des pays inéligibles ; le Québec n'est pas mentionné. Aucune phrase officielle ne confirme l'admissibilité des résidents du Québec au Trading Combine. L'accès ne garantit pas l'admissibilité aux paiements.", 'sources': ['ts-eligibility']},
   {'stage': 'funded_sim', 'state': 'a_verifier', 'note': "Express Funded Account (simulé) : le Canada n'est pas dans la liste « XFA seulement » ni dans les pays inéligibles ; le Québec n'est pas mentionné. Non confirmé. Les paiements sont refusés aux citoyens ou résidents de pays inéligibles ; la politique de paiement liste Wise (1–3 jours ouvrables) comme méthode pour le Canada, sans préciser les provinces : l'accès au XFA ne garantit pas le versement au Québec.", 'sources': ['ts-eligibility', 'ts-payouts']},
   {'stage': 'live', 'state': 'a_verifier', 'note': "Compte Live : des pays sont limités au XFA à cause du courtier ; le Canada n'est pas dans cette liste, mais le Québec n'est pas mentionné. Non confirmé.", 'sources': ['ts-eligibility']}],
 'variants': ts_variants,
 'promos': [],
 'watch_points': conf([
   "Day trading seulement : positions fermées à 15 h 10 (CT) chaque jour ; aucun Forex ni CFD (futures CME uniquement).",
   "TopstepX est la seule plateforme.",
   "Le compte Live (après le XFA) n'est offert que dans certains pays ; le XFA est ouvert à davantage de pays.",
   "Les produits « Topstep Labs » (défis à paiement unique, drawdown statique, etc.) ne sont pas modélisés dans cette base.",
   "Les sources officielles consultées ne mentionnent pas le Québec : statut « À VÉRIFIER » par type de compte."], ['ts-products','ts-eligibility']),
}
json.dump(TOPSTEP, open(os.path.join(ROOT, 'programs', 'topstep-trading-combine.json'), 'w'), ensure_ascii=False, indent=2)

# ---------------------------------------------------------------- APEX
AX_SIZES = [(25000, 1000, 2), (50000, 2000, 4), (100000, 3000, 6), (150000, 4000, 10)]
AX_TARGET = {25000: 1500, 50000: 3000, 100000: 6000, 150000: 9000}
AX_DLL_EOD = {25000: 500, 50000: 1000, 100000: 1500, 150000: 2000}
AX_EVAL_CTS = {25000: 4, 50000: 6, 100000: 8, 150000: 12}
AX_CAPS = {
  'eod': {25000: [1000,1000,1000,1000,1000,None], 50000: [1500,1500,2000,2500,2500,None], 100000: [2000,2500,2500,3000,4000,None], 150000: [2500,3000,3000,3000,4000,None]},
  'intraday': {25000: [1000,1000,1000,1000,1000,None], 50000: [1500,2000,2500,2500,3000,None], 100000: [2000,2500,3000,3000,4000,None], 150000: [2500,3000,3000,4000,4000,None]}}
AX_MINDAY_EOD = {25000: 100, 50000: 250, 100000: 300, 150000: 350}
def _obs_price(kind, size):
    for o in OBS_BY_TYPE['trail-eod' if kind == 'eod' else 'trail-intraday']:
        if o['parameters']['picker_balance'] == f"{size//1000}k":
            return f"{o['observed']['displayed_price_usd']} $ (prix affiché), {o['observed']['coupon_price_usd']} $ avec un code promo"
    return None
def ax_programs():
    out = []
    for kind in ('eod', 'intraday'):
        eod = kind == 'eod'
        pa = 'ax-eod-pa' if eod else 'ax-intraday-pa'
        pay = 'ax-eod-payouts' if eod else 'ax-intraday-payouts'
        variants = []
        for size, dd, pa_cts in AX_SIZES:
            variants.append({
              'id': f"{size//1000}k", 'account_size_usd': size, 'option': None,
              'pricing': {
                'one_time': unc((f"Prix affiché observé le {EVID['consulted_at']} sur le sélecteur officiel : {_obs_price(kind, size)} (non confirmé, voir « observations dynamiques »). " if _obs_price(kind, size) else "Prix non relevé pour cette combinaison. ") + "Tarif DYNAMIQUE : le sélecteur du site officiel dépend de paramètres d'URL (taille, option « sans frais d'activation », type) et de codes promo (prix barré / prix avec code, ex. 167 $ barré → 16,70 $ observé pour un 25K Intraday). Aucun prix de référence stable : à lire au moment de l'achat. Les sites tiers ne sont pas utilisés."),
                'monthly': na("Paiement unique, sans abonnement (« ONE-TIME Fee. No Rebill »)."),
                'activation_fee': conf(79, 'ax-home', "Frais affichés pour le compte 25K Intraday Trail (page officielle). Montants des autres tailles non lus.") if (not eod and size == 25000) else unc("Frais d'activation du Performance Account (7 jours après la réussite) : montants non lus sur une page officielle ; des sites tiers se contredisent."),
                'reset_fee': unc("La page officielle indique « Reset Fee N/A » pour le 25K Intraday : l'évaluation expire après 30 jours sans réinitialisation ; autres tailles non lues."),
                'conditional_fees': unc()},
              'evaluation': {
                'profit_target_usd': conf(AX_TARGET[size], ['ax-home','ax-picker'], "Objectif de profit du compte d'évaluation (cartes de comptes du site officiel)."),
                'max_drawdown_usd': conf(dd, ['ax-home','ax-picker'], "Drawdown maximal de l'ÉVALUATION (cartes de comptes du site officiel) ; identique à celui du compte funded pour cette taille."),
                'daily_loss_limit_usd': conf(AX_DLL_EOD[size], ['ax-home','ax-picker'], "Limite quotidienne de l'évaluation EOD.") if eod else na("Aucune limite quotidienne en évaluation Intraday."),
                'min_trading_days': conf(1, 'ax-home', "« ONE DAY TO PASS » : minimum d'un jour de trading (carte 25K Intraday : « Min. Days To Pass 1 »)."),
                'max_contracts': conf(AX_EVAL_CTS[size], ['ax-home','ax-picker'], "Contrats maximum de l'ÉVALUATION (mini ; micros ×10). Ne pas confondre avec le Performance Account (2 / 4 / 6 / 10).")},
              'funded': {
                'max_drawdown_usd': conf(dd, pa, "Drawdown maximal du Performance Account (EOD)." if eod else "Drawdown maximal en temps réel ; la limite cesse de monter quand elle atteint le solde de départ + 100 $."),
                'daily_loss_limit_usd': unc("Une limite quotidienne par paliers (« tier based ») existe sur le PA ; montants non lus."),
                'max_contracts': conf(pa_cts, pa, "Nombre maximal de contrats de départ (paliers de montée en charge ensuite)."),
                'max_payout_usd': unc("Le plafond varie selon le numéro du retrait (voir « plafonds par numéro ») ; le plafond du 6e retrait n'a pas été lu."),
                'payout_caps_by_number': conf(AX_CAPS[kind][size], pay, "Plafonds des retraits 1 à 5 lus sur la page officielle ; le 6e retrait est « non lu » (null). Maximum de 6 retraits.")}})
        out.append({
          'id': f"apex-{kind}-trail", 'firm_id': 'apex-trader-funding',
          'name': 'Apex EOD Trail' if eod else 'Apex Intraday Trail', 'demo': False,
          'official_url': 'https://apextraderfunding.com/',
          'summary': ("Évaluation à paiement unique dont le drawdown est calculé à la fermeture (EOD) ; limite quotidienne de perte. " if eod else "Évaluation à paiement unique dont le drawdown suit le solde en temps réel (Intraday) ; pas de limite quotidienne en évaluation. ")
                     + "Aucune règle de consistance en évaluation (30 jours pour réussir). Compte Performance Account avec 100 % des retraits approuvés, 6 retraits maximum. Futures seulement ; positions fermées avant 16 h 59 (heure de l'Est) ; automatisation interdite.",
          'instruments': conf(['RTY', '6E'], 'ax-times', "Seuls les produits lus sur la page officielle des heures de trading sont confirmés (extrait : RTY et devises à terme dont 6E). La page est plus longue que l'extrait obtenu ; les autres contrats sont « à vérifier »."),
          'instruments_scope': 'partial',
          'instruments_excluded': unc("Liste officielle des produits non lue en entier : aucun instrument ne peut être déclaré « absent » ; seuls les types de contrats exclus (CFD, comptant, perpétuels) sont écartés."),
          'contract_types': conf(['futures'], 'ax-home', "Page officielle : seuls des futures des bourses CME, COMEX, NYMEX et CBOT sont permis ; devises au comptant, CFD, actions, options et cryptomonnaies ne le sont pas."),
          'instrument_limits': unc("Une source tierce affirme que l'or, l'argent et le cuivre (GC, MGC, SI, HG…) sont suspendus depuis mars 2026 sans date de retour ; aucune page officielle consultée ne le confirme : à vérifier avant d'acheter pour trader l'or."),
          'platforms': conf(['tradovate', 'rithmic', 'wealthcharts'], 'ax-home', "Choix de plateforme affiché sur les cartes de comptes du site officiel (Tradovate, Rithmic, WealthCharts). Le prix peut différer selon la plateforme."),
          'evaluation': {
            'steps': conf(1, 'ax-home', "« ONE DAY TO PASS » : évaluation en une étape."),
            'drawdown_type': conf('eod_trailing' if eod else 'intraday_trailing', pa, "Le type de drawdown de l'évaluation se prolonge sur le Performance Account."),
            'time_limit_days': conf(30, 'ax-home', "« Eval Active for 30 Days »."),
            'description': conf("Atteindre l'objectif de profit sans toucher le drawdown maximal. Aucune règle de consistance en évaluation. L'évaluation est active 30 jours ; le Performance Account doit être activé dans les 7 jours suivant la réussite.", 'ax-home'),
            'consistency_rule': conf({'exists': False, 'detail': None}, 'ax-home', "« NO Eval consistency rules » (en revanche une règle de consistance de 50 % s'applique aux retraits du PA).")},
          'funded': {
            'account_nature': conf('simulated', pa, "Le Performance Account est un compte « Simulated Funded »."),
            'drawdown_type': conf('eod_trailing' if eod else 'intraday_trailing', pa),
            'profit_split_pct': conf(100, pay, "100 % des retraits approuvés (régime Apex 4.0, produits achetés depuis le 1er mars 2026)."),
            'min_withdrawal_usd': conf(500, pay),
            'payout_cap': conf({'has_cap': True, 'amount_usd': None}, pay, "Plafond par retrait selon la taille ET le numéro du retrait (de 1 000 $ à 4 000 $ ; voir les comptes) ; 6 retraits maximum par Performance Account."),
            'max_payouts': conf(6, pay, "Après le 6e retrait, le Performance Account est fermé ; un nouveau PA exige une nouvelle évaluation."),
            'drawdown_effect_of_payout': conf("Aucune réduction du drawdown décrite par retrait ; le « Safety Net » (drawdown + 100 $ au-dessus du solde de départ) doit être respecté pendant toute la vie du compte et le solde minimal pour demander un retrait en tient compte.", pay),
            'payout_paths': conf([{'id': 'standard', 'label': 'Retrait Apex (un seul chemin)', 'min_days': 5, 'min_day_profit_usd': None, 'consistency_max_day_pct': 50, 'request_limit_pct_of_balance': None,
              'note': "5 jours de trading atteignant le profit quotidien minimal de la taille (EOD : 100 $ / 250 $ / 300 $ / 350 $ pour 25K / 50K / 100K / 150K ; Intraday : tableau non lu), non consécutifs ; règle de consistance 50 % ; minimum 500 $ par demande ; jusqu'à une demande par semaine."}], pay, "Valeurs par taille : voir la page officielle des retraits."),
            'safety_net': conf({'exists': True, 'detail': "Safety Net = drawdown de la taille + 100 $ (EOD : 26 100 $ / 52 100 $ / 103 100 $ / 154 100 $ pour 25K / 50K / 100K / 150K). Solde minimal pour demander un retrait = Safety Net + 500 $ (minimum de retrait)."}, pay) if eod else conf({'exists': True, 'detail': "Safety Net = drawdown de la taille + 100 $ ; le tableau des soldes minimaux de l'Intraday n'a pas été lu en entier."}, pay),
            'withdrawal_conditions': conf("Retraits jusqu'à une fois par semaine : au moins 5 jours de trading atteignant le profit quotidien minimal de la taille du compte, solde au-dessus du seuil de demande, règle de consistance de 50 % (aucun jour gagnant ne peut représenter 50 % ou plus du profit depuis le dernier retrait), 6 retraits maximum puis le compte est fermé.", pay)},
          'restrictions': {
            'news': restr(conf('conditional', 'ax-prohibited', "Le trading pendant les nouvelles est permis pour ta stratégie habituelle ; les stratégies qui « chassent le marché » ou placent des ordres des deux côtés pour parier sur l'annonce sont interdites."), conf('conditional', 'ax-prohibited', "Même règle qu'en évaluation.")),
            'overnight': both('forbidden', ['ax-times','ax-prohibited'], "Toutes les positions doivent être fermées et les ordres annulés avant 16 h 59 (heure de l'Est)."),
            'weekend': both('forbidden', ['ax-times','ax-prohibited'], "Aucune position conservée après la fermeture."),
            'asian_session': both('allowed', 'ax-times', "Trading de 18 h (ET) à 16 h 59 le lendemain : la session asiatique est incluse."),
            'scalping': restr(unc(), unc()),
            'automated': both('forbidden', ['ax-pa-compliance','ax-prohibited'], "L'automatisation (robots, algorithmes, trading « set and forget ») est interdite sur tous les types de comptes ; fermeture du compte et perte des fonds en cas de violation."),
            'copy_trading': restr(unc(), unc())},
          'eligibility': conf({'eligible': ['CA'], 'excluded': [], 'unconfirmed': [], 'unlisted': 'unconfirmed'}, 'ax-restricted', "Page officielle « Restricted Countries » : « Canadian traders can fully utilize our services » ; les comptes Évaluation et Performance Account sont simulés. Le Canada ne figure pas dans la liste des pays restreints. La liste des pays restreints n'est pas encodée ici (autres pays : non confirmés). Les programmes Live (courtier partenaire) sont un autre produit : ils excluent le Canada sauf l'Ontario."),
          'quebec_by_stage': [
            {'stage': 'evaluation', 'state': 'canada_general', 'note': "Déclaration officielle GÉNÉRALE pour le Canada (« Canadian traders can fully utilize our services ») : la province du Québec n'est pas explicitement confirmée. L'accès au programme ne garantit pas l'admissibilité aux paiements (politique de paiement, vérification d'identité et pays de paiement non confirmés pour le Québec).", 'sources': ['ax-restricted']},
            {'stage': 'funded_sim', 'state': 'canada_general', 'note': "Performance Account (simulé) : même déclaration générale pour le Canada ; la province du Québec n'est pas explicitement confirmée. L'accès au compte ne garantit pas l'admissibilité aux paiements : les conditions de versement au Québec ne sont pas confirmées.", 'sources': ['ax-restricted']},
            {'stage': 'live', 'state': 'restreint', 'note': "Le programme Apex Live liste « Canada (all provinces and territories except Ontario) » parmi les pays non disponibles : le Québec est donc restreint pour le Live. Ne s'applique pas à l'évaluation ni au PA simulé. Le Québec est explicitement visé (Canada hors Ontario).", 'sources': ['ax-live-faq']}],
          'dynamic_observations': dyn_obs(eod),
          'variants': variants, 'promos': [],
          'watch_points': conf([
            "Futures seulement (CME, COMEX, NYMEX, CBOT) : pas de CFD, de devises au comptant, d'actions ni de cryptos au comptant.",
            "Positions fermées avant 16 h 59 (heure de l'Est) ; aucune automatisation (robots).",
            "Des sources tierces signalent une suspension des métaux (or, argent, cuivre) depuis mars 2026 : non confirmée officiellement.",
            "Les prix et frais d'activation changent souvent (régime Apex 4.0 depuis le 1er mars 2026) : à vérifier sur le site avant l'achat.",
            "Programme Live d'Apex : le Canada (sauf l'Ontario) n'est pas disponible ; l'évaluation et le PA simulé sont ouverts aux Canadiens selon la page officielle."], ['ax-times','ax-live-faq'])})
    return out
for p in ax_programs():
    json.dump(p, open(os.path.join(ROOT, 'programs', p['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
print('ok')
