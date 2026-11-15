#!/usr/bin/env python3
"""Lot 2A (Mission 4) : Take Profit Trader, MyFundedFutures, TradeDay.
Chaque valeur « confirmed » cite une page du site OFFICIEL de l'entreprise lue le 2026-11-15 ;
tout le reste est « unconfirmed » / « not_applicable ». Aucune valeur n'est inventée.
Les prix et promotions sont des OBSERVATIONS DATÉES (durable=false), jamais des prix confirmés."""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
D = '2026-11-15'
EV = 'data/evidence/lot2a-2026-11-15.json'

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

# ------------------------------------------------------------------ sources
SOURCES = [
 # Take Profit Trader (pages du site officiel ; le centre d'aide n'a pas pu être lu : voir rapport)
 ('tp-site', "Take Profit Trader — page d'accueil (produits permis, bourses)", 'https://takeprofittrader.com/', {}),
 ('tp-faq', "Take Profit Trader — FAQ officielle (étapes, règles PRO / PRO+)", 'https://try.takeprofittrader.com/TPT-FAQs-nf30r2-0526', {}),
 ('tp-lp', "Take Profit Trader — page « Trade Futures » (règles test / PRO, 5 comptes)", 'https://try.takeprofittrader.com/futures-traders-tab1-0725', {}),
 ('tp-news', "Take Profit Trader — blog officiel : How to Trade News in Futures (restrictions de nouvelles)", 'https://takeprofittrader.com/blog/how-to-trade-news', {}),
 ('tp-5pm', "Take Profit Trader — blog officiel : règle de 17 h (fermeture automatique 16 h 55 ET)", 'https://takeprofittrader.com/blog/the-prop-firm-5-pm-rule-explained-what-changed-at-take-profit-trader', {}),
 ('tp-vs-topstep', "Take Profit Trader — blog officiel : comparatif (paramètres du programme, page éditoriale à fiabilité moindre)", 'https://takeprofittrader.com/blog/take-profit-trader-vs-topstep', {}),
 ('tp-vs-apex', "Take Profit Trader — blog officiel : comparatif (buffer PRO, frais de retrait, page éditoriale à fiabilité moindre)", 'https://takeprofittrader.com/blog/take-profit-trader-vs-apex-trader-funding', {}),
 ('tp-contracts', "Take Profit Trader — blog officiel : contrats maximaux par taille (page éditoriale datée)", 'https://takeprofittrader.com/blog/what-is-a-funded-trading-account', {}),
 ('tp-promo', "Take Profit Trader — tarifs et code promo (observation datée, page éditoriale)", 'https://takeprofittrader.com/blog/take-profit-trader-vs-topstep',
  {'durable': False, 'consulted_at': D, 'evidence_file': EV, 'parameters': {'code_promo': 'NOFEE40'}}),
 # MyFundedFutures
 ('mf-rapid', "MyFundedFutures — plan Rapid (site officiel)", 'https://myfundedfutures.com/plans/rapid', {}),
 ('mf-pro', "MyFundedFutures — plan Pro (site officiel)", 'https://myfundedfutures.com/plans/pro', {}),
 ('mf-builder50', "MyFundedFutures — Builder Plan 50K (centre d'aide)", 'https://help.myfundedfutures.com/en/articles/14290805-builder-plan-50k-a-comprehensive-guide', {}),
 ('mf-builder25', "MyFundedFutures — Builder Plan 25K (centre d'aide)", 'https://help.myfundedfutures.com/en/articles/17036130-builder-plan-25k-a-comprehensive-look', {}),
 ('mf-news', "MyFundedFutures — News Trading Policy (centre d'aide)", 'https://help.myfundedfutures.com/en/articles/8230009-news-trading-policy', {}),
 ('mf-instruments', "MyFundedFutures — Futures Instrument List (centre d'aide, daté du 24 août 2026)", 'https://help.myfundedfutures.com/en/articles/9735811-futures-instrument-list', {}),
 ('mf-countries', "MyFundedFutures — Restricted Countries Policy (centre d'aide)", 'https://help.myfundedfutures.com/en/articles/8229993-restricted-countries-policy', {}),
 ('mf-terms', "MyFundedFutures — Terms and Conditions (art. 24 Geographical Restrictions)", 'https://myfundedfutures.com/terms', {}),
 ('mf-club', "MyFundedFutures — MyFundedClub (programme de points ; exclut l'Ontario et le Québec)", 'https://myfundedfutures.com/myfundedclub', {}),
 ('mf-platforms', "MyFundedFutures — Overview of Supported Platforms (centre d'aide)", 'https://help.myfundedfutures.com/en/articles/8528335-overview-of-supported-platforms-at-mffu', {}),
 ('mf-platform-blog', "MyFundedFutures — blog officiel : plateformes et produits permis", 'https://myfundedfutures.com/blog/trading-platform-to-use-funded-futures-account', {}),
 ('mf-live-faq', "MyFundedFutures — FAQ des comptes Live (centre d'aide)", 'https://help.myfundedfutures.com/en/articles/12109396-comprehensive-faq-live-accounts-at-myfunded-futures', {}),
 ('mf-price-rapid', "MyFundedFutures — plan Rapid : prix affichés (observation datée)", 'https://myfundedfutures.com/plans/rapid',
  {'durable': False, 'consulted_at': D, 'evidence_file': EV, 'parameters': {'page': 'plans/rapid', 'code_promo_affiche': 'CLUB'}}),
 ('mf-price-builder', "MyFundedFutures — Builder 50K : prix affichés (observation datée)", 'https://help.myfundedfutures.com/en/articles/14290805-builder-plan-50k-a-comprehensive-guide',
  {'durable': False, 'consulted_at': D, 'evidence_file': EV, 'parameters': {'page': 'builder-plan-50k'}}),
 # TradeDay
 ('td-home', "TradeDay 2.0 — page d'accueil : comptes Quick Pay / Fast Pass (site officiel)", 'https://www.tradeday.com/', {}),
 ('td-terms', "TradeDay — Terms & Conditions (mis à jour le 11 août 2026)", 'https://www.tradeday.com/terms-and-conditions', {}),
 ('td-products', "TradeDay — produits permis (bourses CME, CBOT, NYMEX, COMEX ; aucun CFD)", 'https://www.tradeday.com/es/weekly-update', {}),
 ('td-blog20', "TradeDay — blog officiel : TradeDay 2.0", 'https://www.tradeday.com/blog-posts/tradeday-2-0---the-next-evolution-of-prop-trading', {}),
 ('td-price-home', "TradeDay — page d'accueil : prix affichés (observation datée)", 'https://www.tradeday.com/',
  {'durable': False, 'consulted_at': D, 'evidence_file': EV, 'parameters': {'page': 'accueil', 'codes_affiches': 'TDNEW / SALE60'}}),
 ('td-price-mit', "TradeDay — page Make It Take It : prix affichés « par mois » (observation datée)", 'https://www.tradeday.com/make-it-take-it',
  {'durable': False, 'consulted_at': D, 'evidence_file': EV, 'parameters': {'page': 'make-it-take-it'}}),
]
srcs = []
for i, l, u, extra in SOURCES:
    d = {'id': i, 'label': l, 'url': u, 'type': 'official'}; d.update(extra); srcs.append(d)

def merge(fn, items, key='id'):
    p = os.path.join(ROOT, fn); cur = json.load(open(p))
    ids = {x[key] for x in items}
    cur = [x for x in cur if x[key] not in ids] + items
    json.dump(cur, open(p, 'w'), ensure_ascii=False, indent=2)
merge('sources.json', srcs)
merge('firms.json', [
 {'id': 'take-profit-trader', 'name': 'Take Profit Trader', 'website': 'https://takeprofittrader.com', 'demo': False,
  'description': "Entreprise américaine de futures (CME, CBOT, NYMEX, COMEX). Évaluation (« test ») par abonnement mensuel, puis compte PRO simulé (retraits dès le jour 1) et invitation possible vers PRO+ (marché réel)."},
 {'id': 'myfundedfutures', 'name': 'MyFundedFutures', 'website': 'https://myfundedfutures.com', 'demo': False,
  'description': "Entreprise de futures (CME Group). Plusieurs plans vendus (Rapid, Pro, Builder), évaluation à paiement unique, compte « Sim Funded » puis passage possible au Live selon le plan."},
 {'id': 'tradeday', 'name': 'TradeDay', 'website': 'https://www.tradeday.com', 'demo': False,
  'description': "Entreprise américaine de futures (CME Group), fondée en 2020. TradeDay 2.0 (août 2026) : comptes Quick Pay et Fast Pass, drawdown Intraday ou fin de journée."}])

# ------------------------------------------------------------------ preuves des observations dynamiques
evidence = {
 'consulted_at': D,
 'note': "Observations de prix et de promotions lues sur les pages officielles le 2026-11-15. Ce sont des valeurs DYNAMIQUES (promotion, code, date) : jamais confirmées comme prix. Extraits paraphrasés.",
 'observations': [
  {'firm': 'take-profit-trader', 'source': 'tp-promo', 'observed': "Page comparative du site : mensualité de 90 $ à 216 $ par mois pour les tailles 25K à 150K avec le code NOFEE40 ; frais d'activation 0 $ avec ce code ; réinitialisation PRO d'environ 649 $ (50K).", 'excerpt_policy': 'paraphrase'},
  {'firm': 'myfundedfutures', 'source': 'mf-price-rapid', 'observed': "Plan Rapid : « Starting at $125 » et « $209 » étiquetés « Based on current promotions » ; non rattachés à une taille ; bandeau « Save 40 % With Code CLUB ».", 'excerpt_policy': 'paraphrase'},
  {'firm': 'myfundedfutures', 'source': 'mf-price-builder', 'observed': "Builder 50K : MLL par défaut 153 $ au tarif de liste, 107 $ avec 30 % de rabais, 92 $ avec 40 % (2 utilisations) ; MLL « Add-On » 125 $ / 87 $ / 75 $.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'tradeday', 'source': 'td-price-home', 'observed': "Accueil : prix barrés / affichés en paiement unique (« one-time fee ») : Quick Pay Intraday 25K 99→39 $, 50K 124→49 $, 100K 248→99 $, 150K 398→159 $ ; Quick Pay EOD 25K 124→49 $, 50K 174→69 $, 100K 298→119 $ ; Fast Pass EOD 25K ?, 50K 248→99 $, 100K 498→199 $, 150K 725→290 $. Codes TDNEW / SALE60.", 'excerpt_policy': 'paraphrase'},
  {'firm': 'tradeday', 'source': 'td-price-mit', 'observed': "Page Make It Take It : mêmes prix mais étiquetés « per month » avec la mention « No Subscription Required » ; la page ne dit pas clairement mensuel ou unique (contradiction interne). Réinitialisations de 45 $ à 180 $ selon le plan.", 'excerpt_policy': 'paraphrase'}]}
json.dump(evidence, open(os.path.join(ROOT, 'evidence', 'lot2a-2026-11-15.json'), 'w'), ensure_ascii=False, indent=2)
def obs(label, source, params, observed, note):
    return {'label': label, 'source': source, 'parameters': params, 'consulted_at': D, 'evidence_file': EV, 'durable': False, 'observed': observed,
            'note': note + " Valeur observée, NON confirmée comme prix : tarif dynamique (promotion, code, date)."}

FUT = ['futures']
def write(p): json.dump(p, open(os.path.join(ROOT, 'programs', p['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
def qc(eval_s, sim_s, live_s):
    return [{'stage': 'evaluation', 'state': 'a_verifier', 'note': eval_s[0], 'sources': eval_s[1]},
            {'stage': 'funded_sim', 'state': 'a_verifier', 'note': sim_s[0], 'sources': sim_s[1]},
            {'stage': 'live', 'state': 'a_verifier', 'note': live_s[0], 'sources': live_s[1]}]

# =================================================================== TAKE PROFIT TRADER
TP_SIZES = [25000, 50000, 75000, 100000, 150000]
def tp_variant(size):
    k = size // 1000
    first = size == 50000
    return {
      'id': f'{k}k', 'account_size_usd': size, 'option': None,
      'pricing': {
        'one_time': na("Abonnement mensuel pendant l'évaluation (la facturation s'arrête à la réussite)."),
        'monthly': unc("Tarif DYNAMIQUE : le site affiche des mensualités promotionnelles (voir « observations dynamiques ») ; aucun prix durable confirmé."),
        'activation_fee': unc("« 0 $ avec le code NOFEE40 » selon une page éditoriale ; le tarif sans code n'est pas confirmé sur une page officielle lue."),
        'reset_fee': unc("Réinitialisation de l'évaluation non lue ; la réinitialisation PRO (environ 649 $ pour 50K) est une observation promotionnelle."),
        'conditional_fees': conf([{'label': 'Frais de retrait inférieur à 250 $', 'amount_usd': 50, 'condition': "Un retrait de moins de 250 $ entraîne des frais de 50 $."}], 'tp-vs-apex', "Page éditoriale officielle ; frais conditionnels, non additionnés au coût certain.")},
      'evaluation': {
        'profit_target_usd': conf(round(size * 0.06), 'tp-vs-topstep', "Objectif annoncé : 6 % du compte (calcul : 6 % × taille). Montant en dollars non lu sur une page de règles par taille.") ,
        'max_drawdown_usd': conf(2000, ['tp-vs-topstep', 'tp-contracts'], "Drawdown de fin de journée (EOD) de 2 000 $ sur le compte 50K, selon les pages éditoriales du site.") if first else unc("Drawdown de cette taille non lu (seul le 50K : 2 000 $)."),
        'daily_loss_limit_usd': na("Aucune limite quotidienne à aucun stade (Test, PRO, PRO+)."),
        'min_trading_days': conf(3, ['tp-lp', 'tp-vs-topstep'], "3 jours de trading minimum (FAQ officielle et comparatif récents). Un ancien article parle de cinq jours : non retenu."),
        'max_contracts': conf(6, 'tp-contracts', "Contrats maximum du test 50K (page éditoriale datée ; mini ; micros ×10).") if first else (conf(15, 'tp-contracts', "Contrats maximum du test 150K (page éditoriale datée).") if size == 150000 else unc("Contrats maximum de cette taille non lus."))},
      'funded': {
        'max_drawdown_usd': conf(2000, ['tp-vs-topstep', 'tp-vs-apex'], "Drawdown PRO d'environ 2 000 $ (50K), intraday ; buffer de retrait égal au drawdown.") if first else unc("Drawdown PRO de cette taille non lu."),
        'daily_loss_limit_usd': na("Aucune limite quotidienne."),
        'max_contracts': unc("« Maximum contract allotment per account size » : valeur par taille du compte PRO non lue."),
        'max_payout_usd': na("Aucun maximum par retrait (« no maximum withdrawal amount »).")}}

TPT = {
 'id': 'take-profit-trader-test', 'firm_id': 'take-profit-trader', 'name': 'Test → PRO → PRO+ (Take Profit Trader)', 'demo': False,
 'official_url': 'https://takeprofittrader.com/',
 'summary': "Évaluation en une étape par abonnement mensuel (sans limite de temps), drawdown de fin de journée et consistance de 50 % en évaluation seulement. Après réussite : compte PRO simulé (drawdown intraday, retraits dès le jour 1 à 80 % au-dessus d'un buffer), puis invitation possible vers PRO+ (marché réel, 90 %). Futures CME seulement ; pas de nouvelles majeures en PRO / PRO+.",
 'instruments': unc("La page officielle indique les bourses permises (CME, COMEX, NYMEX, CBOT) mais renvoie à une liste de produits par symbole qui n'a pas pu être lue (centre d'aide inaccessible lors de la consultation) : aucun instrument n'est confirmé."),
 'instruments_scope': 'partial',
 'instruments_excluded': unc("Liste par symbole non lue : aucun instrument ne peut être déclaré absent."),
 'contract_types': conf(FUT, ['tp-site', 'tp-faq'], "Futures listés sur CME, COMEX, NYMEX et CBOT seulement ; actions, options, forex, cryptomonnaies et CFD ne sont ni supportés ni facilités."),
 'instrument_limits': unc("Restrictions de nouvelles propres à certains produits (pétrole brut, obligations) mentionnées sur une page éditoriale ; limites par produit non lues."),
 'platforms': conf(['tradingview', 'ninjatrader', 'tradovate', 'rithmic'], 'tp-vs-topstep', "TradingView, NinjaTrader, Tradovate et plus de 15 plateformes via les flux CQG et Rithmic (page éditoriale officielle) ; liste complète non lue."),
 'evaluation': {
   'steps': conf(1, 'tp-vs-topstep', "« Single-step evaluation »."),
   'drawdown_type': conf('eod_trailing', ['tp-lp', 'tp-vs-topstep'], "Drawdown de fin de journée dans le test (se verrouille au solde de départ)."),
   'time_limit_days': na("Aucune limite de temps : abonnement mensuel jusqu'à la réussite."),
   'description': conf("Atteindre l'objectif de profit (6 % du compte) en au moins 3 jours de trading, sans toucher le drawdown de fin de journée, en gardant le meilleur jour sous 50 % du profit net.", ['tp-lp', 'tp-vs-topstep']),
   'consistency_rule': conf({'exists': True, 'detail': "Le meilleur jour doit rester sous 50 % du profit net ; règle valable en évaluation seulement (aucune consistance en PRO / PRO+)."}, ['tp-vs-topstep', 'tp-lp'])},
 'funded': {
   'account_nature': conf('simulated', ['tp-faq', 'tp-vs-topstep'], "PRO : environnement simulé, retraits réels. PRO+ : marché réel (sur invitation) — non modélisé séparément ici."),
   'drawdown_type': conf('intraday_trailing', ['tp-faq', 'tp-vs-topstep'], "PRO : drawdown intraday. PRO+ : drawdown de fin de journée pour les nouveaux comptes depuis le 30 juin (selon la FAQ)."),
   'profit_split_pct': conf(80, ['tp-vs-topstep', 'tp-vs-apex'], "80 % en PRO sur les profits au-dessus du buffer ; 90 % en PRO+ sans buffer."),
   'min_withdrawal_usd': conf(0, 'tp-vs-topstep', "Aucun minimum ; des frais de 50 $ s'appliquent aux retraits de moins de 250 $."),
   'payout_cap': conf({'has_cap': False, 'amount_usd': None}, ['tp-faq', 'tp-vs-apex'], "Aucun maximum par retrait ni plafond mensuel."),
   'max_payouts': na("Aucune limite du nombre de retraits (« no lifetime payout count »)."),
   'drawdown_effect_of_payout': conf("Retirer sous le buffer verse 50 % et ferme le compte PRO ; au-dessus du buffer, 80 % du profit est versé (selon une page éditoriale officielle).", 'tp-vs-apex'),
   'payout_paths': conf([{'id': 'pro-daily', 'label': 'PRO : retrait dès le jour 1 et quotidien', 'min_days': 0, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None,
      'note': "Aucun minimum de jours, aucune consistance, aucun plafond ; seul le buffer (égal au drawdown, 2 000 $ pour le 50K) doit être dépassé. Traitement annoncé en quelques secondes."}], ['tp-faq', 'tp-vs-apex']),
   'safety_net': conf({'exists': True, 'detail': "Buffer PRO égal au drawdown de la taille (2 000 $ sur 50K) ; aucun buffer en PRO+."}, 'tp-vs-apex'),
   'withdrawal_conditions': conf("Retrait possible dès le jour 1 puis chaque jour, sur les profits au-dessus du buffer ; 80 % au partage en PRO ; aucun minimum de jours, aucune consistance, aucun maximum ; frais de 50 $ sous 250 $ ; jusqu'à 5 comptes PRO / PRO+ simultanés.", ['tp-faq', 'tp-lp', 'tp-vs-apex'])},
 'restrictions': {
   'news': restr(conf('allowed', 'tp-news', "Aucune restriction de nouvelles pendant l'évaluation."),
                 conf('conditional', 'tp-news', "PRO et PRO+ : aucune position ni ordre ouvert une minute avant, pendant et une minute après les événements interdits (FOMC, NFP, CPI, événements propres au pétrole et aux obligations) ; calendrier officiel dans le tableau de bord. En PRO, la violation fait échouer le compte.")),
   'overnight': both('forbidden', ['tp-lp', 'tp-5pm'], "Positions fermées avant 17 h (ET). Depuis une mise à jour, la position est fermée automatiquement à 16 h 55 ET sans échec du compte ; exceptions : produits fermant plus tôt et jours fériés (liquidation)."),
   'weekend': both('forbidden', ['tp-lp', 'tp-5pm'], "Aucune position conservée après la fermeture quotidienne : pas de position de fin de semaine."),
   'asian_session': restr(unc(), unc()),
   'scalping': restr(unc(), unc()),
   'automated': restr(unc(), unc()),
   'copy_trading': restr(unc("En évaluation, plusieurs comptes sont permis ; copy trading non énoncé."), conf('allowed', ['tp-faq'], "Copy trading permis jusqu'à 5 comptes PRO (ou PRO+)."))},
 'eligibility': unc("Page officielle de pays admissibles non trouvée (centre d'aide inaccessible lors de la consultation) : aucune liste de pays confirmée."),
 'quebec_by_stage': qc(
   ("Aucune page officielle d'admissibilité par pays n'a pu être lue pour Take Profit Trader : le Québec n'est pas confirmé. L'accès ne garantit pas l'admissibilité aux paiements.", ['tp-site']),
   ("Compte PRO (simulé) : admissibilité du Québec non confirmée ; aucune liste de pays lue. L'accès au compte ne garantit pas l'admissibilité aux paiements.", ['tp-site']),
   ("PRO+ (marché réel, sur invitation, routé via Tradovate) : conditions géographiques non lues ; le Québec n'est pas confirmé.", ['tp-faq'])),
 'dynamic_observations': [obs("Mensualités promotionnelles 25K–150K (code NOFEE40)", 'tp-promo', {'code_promo': 'NOFEE40'}, {'mensualite_usd_min': 90, 'mensualite_usd_max': 216, 'activation_usd_avec_code': 0, 'reset_pro_50k_usd_approx': 649}, "Page comparative du site officiel.")],
 'variants': [tp_variant(s) for s in TP_SIZES],
 'promos': [],
 'watch_points': conf([
   "Drawdown : fin de journée en évaluation, INTRADAY en PRO, fin de journée en PRO+ (nouveaux comptes depuis le 30 juin).",
   "Pas de nouvelles majeures (FOMC, NFP, CPI…) en PRO et PRO+ : positions et ordres à fermer 1 minute avant et après.",
   "Les montants par taille (objectifs, drawdowns, contrats) viennent de pages éditoriales du site ; la liste des produits par symbole et les pages de pays n'ont pas pu être lues : à vérifier avant l'achat.",
   "Les tarifs mensuels changent selon les codes : voir « observations dynamiques », aucun prix durable confirmé.",
   "Le Québec n'est pas confirmé ; l'accès ne garantit pas l'admissibilité aux paiements."], ['tp-news', 'tp-faq'])}
write(TPT)

# =================================================================== MYFUNDEDFUTURES
MF_INSTR = ['NQ','MNQ','ES','MES','YM','MYM','RTY','M2K','6E','M6E','GC','MGC','CL','MCL','MBT','MET']
MF_LIMITS = conf([
  {'instrument': 'MGC', 'state': 'limited', 'note': "Limite de micros sur les métaux (depuis le 17 avril) : 3 / 5 / 10 / 15 micros pour les comptes 25K / 50K / 100K / 150K. Restriction annoncée comme temporaire."},
  {'instrument': 'MBT', 'state': 'limited', 'note': "Traité comme un contrat mini en raison de la volatilité : avec 3 minis maximum, 3 MBT maximum. Temporaire."},
  {'instrument': 'MET', 'state': 'limited', 'note': "Micro Ethereum : aucune limite propre énoncée sur la page ; limites générales du plan."}], 'mf-instruments',
  "Page lue le 2026-11-15 (datée du 24 août 2026). Restrictions TEMPORAIRES depuis le 7 février sur l'argent (SI), le cuivre (HG), le platine (PL), le gaz naturel (NG) et le E-mini gaz naturel (QG), hors catalogue de l'outil. Horaires MFFU : 18 h à 16 h 10 (heure de l'Est). Relire la page avant de trader.")

def mf_common(pid, name, summary, url):
    return {
     'id': pid, 'firm_id': 'myfundedfutures', 'name': name, 'demo': False, 'official_url': url, 'summary': summary,
     'instruments': conf(MF_INSTR, 'mf-instruments', "Liste officielle complète (CME, COMEX, CBOT, NYMEX) : les 16 futures du catalogue de l'outil y figurent."),
     'instruments_scope': 'exhaustive',
     'instruments_excluded': conf([], 'mf-instruments', "Tous les futures du catalogue figurent dans la liste officielle. Les CFD, le comptant et les perpétuels du catalogue sont écartés par le type de contrat."),
     'contract_types': conf(FUT, 'mf-platform-blog', "Contrats à terme standardisés des bourses américaines réglementées (CME Group) seulement ; actions, options sur actions, cryptomonnaies au comptant, CFD et OTC interdits."),
     'instrument_limits': MF_LIMITS,
     'platforms': conf(['ninjatrader', 'tradovate', 'tradingview'], ['mf-platforms', 'mf-platform-blog'], "NinjaTrader, Tradovate (et TradingView via Tradovate) ; Quantower, Volumetrica, ATAS et autres également supportées mais hors catalogue de l'outil."),
     'eligibility': conf({'eligible': [], 'excluded': MF_EXCLUDED, 'unconfirmed': [], 'unlisted': 'unconfirmed'}, ['mf-countries'],
        "Liste officielle des pays non acceptés (France métropolitaine hors Corse et îles, Crimée et d'autres entrées non codées ne sont pas reprises). Le Canada ne figure PAS dans la liste, mais aucune phrase ne déclare expressément les Canadiens admissibles : les pays absents restent « non confirmés »."),
     'quebec_by_stage': qc(
        ("Le Canada ne figure pas dans la liste officielle des pays restreints et aucune règle ne mentionne le Québec ; aucune déclaration expresse d'admissibilité. Distinct : le programme de points MyFundedClub exclut l'Ontario et le Québec (programme promotionnel, ne s'applique pas à l'évaluation). L'accès ne garantit pas l'admissibilité aux paiements.", ['mf-countries', 'mf-club']),
        ("Sim Funded : les « participants restreints » n'ont accès qu'aux comptes simulés avec paiements limités (Terms, art. 24) ; le Québec n'est pas mentionné : non confirmé. Les paiements exigent KYC/AML.", ['mf-terms', 'mf-countries']),
        ("Live (compte réel chez un partenaire) : conditions géographiques non lues ; le Québec n'est pas confirmé.", ['mf-live-faq']))}

# pays de la liste officielle (codes ISO présents dans le catalogue de l'outil)
_names = "AF AL DZ AO BS BB BY BA BW BF BG MM BI KH CM CF CN CG CD CI HR CU EC ET GH GI GY HT HK IS ID IR IQ JM JO KZ KE XK KG LA LB LR LY MK MY ML MT MU MN ME MA MZ NA NR NI NG KP PK PA PG PH QA RO RU RW SN RS SI SO ZA SS LK SD SY TW TZ TT TN TR TM UG UA AE UZ VE VN YE ZW".split()
_cc = set(json.load(open(os.path.join(ROOT, 'countries.json'))))
MF_EXCLUDED = [c for c in _names if c in _cc]
MF_SKIPPED = [c for c in _names if c not in _cc]

MF_NEWS_FUNDED = "Rapid et Pro Sim Funded : interdit d'avoir des positions ou ordres (limites comprises) 2 minutes avant et après les annonces Tier 1 (FOMC, procès-verbal FOMC, rapport sur l'emploi, CPI ; EIA pour l'énergie ; rapports agricoles)."

def mf_rapid():
    RS = [(25000, 1500, 1000, 1100), (50000, 3000, 2000, 2100), (100000, 6000, 3000, 3100), (150000, 9000, 4500, 4600)]
    variants = []
    for size, tgt, dd, buf in RS:
        variants.append({'id': f'{size//1000}k', 'account_size_usd': size, 'option': None,
          'pricing': {'one_time': unc("Prix « à partir de 125 $ » et « 209 $ » affichés sans lien avec une taille (« Based on current promotions ») : voir observations dynamiques."),
                      'monthly': na("Paiement unique."), 'activation_fee': conf(0, 'mf-rapid', "Frais d'activation de 0 $ à toutes les tailles."),
                      'reset_fee': unc("Une évaluation échouée peut être réinitialisée contre des frais dont le montant n'est pas indiqué ; un compte Sim Funded ne peut pas être réinitialisé."),
                      'conditional_fees': unc()},
          'evaluation': {'profit_target_usd': conf(tgt, 'mf-rapid'), 'max_drawdown_usd': conf(dd, 'mf-rapid', "Perte maximale de fin de journée (EOD)."),
                         'daily_loss_limit_usd': na("Aucune limite quotidienne."), 'min_trading_days': conf(2, 'mf-rapid'),
                         'max_contracts': unc("La page affiche deux jeux de contrats contradictoires (5/50 vs 3/30 pour le 50K) sans préciser lequel s'applique à l'évaluation.")},
          'funded': {'max_drawdown_usd': conf(dd, 'mf-rapid', f"Drawdown trailing intraday ; se verrouille à +100 $ au-dessus du solde de départ après le premier paiement. Buffer requis : {buf} $."),
                     'daily_loss_limit_usd': na("Aucune limite quotidienne."),
                     'max_contracts': unc("Deux jeux de contrats contradictoires sur la page officielle (ex. 50K : 5 minis / 50 micros ou 3 minis / 30 micros) : non tranché."),
                     'max_payout_usd': unc("Plafond par retrait non indiqué pour le plan Rapid.")}})
    return {**mf_common('myfundedfutures-rapid', 'Rapid (MyFundedFutures)',
      "Évaluation à paiement unique (drawdown de fin de journée, consistance de 50 % en évaluation seulement), puis Sim Funded à drawdown INTRADAY avec retraits quotidiens à 90/10 au-dessus d'un buffer. Day trading seulement ; pas de nouvelles Tier 1 en Sim Funded.", 'https://myfundedfutures.com/plans/rapid'),
     'evaluation': {'steps': conf(1, 'mf-rapid'), 'drawdown_type': conf('eod_trailing', 'mf-rapid', "La page affiche aussi « Intraday Trailing » pour la même ligne ; le Sim Funded est intraday (voir ci-dessous)."),
        'time_limit_days': unc("Aucune limite de temps énoncée sur la page lue."),
        'description': conf("Atteindre l'objectif sur au moins 2 jours de trading sans toucher la perte maximale de fin de journée, avec une consistance de 50 % en évaluation seulement.", 'mf-rapid'),
        'consistency_rule': conf({'exists': True, 'detail': "50 % en évaluation seulement ; aucune consistance en Sim Funded."}, 'mf-rapid')},
     'funded': {'account_nature': conf('simulated', 'mf-pro', "« All MFFU accounts operate in a simulated environment » (note de la page Pro)."),
        'drawdown_type': conf('intraday_trailing', 'mf-rapid', "Se verrouille à +100 $ après le premier paiement."),
        'profit_split_pct': conf(90, 'mf-rapid'), 'min_withdrawal_usd': conf(500, 'mf-rapid'),
        'payout_cap': unc("« Payout caps: not stated for Rapid »."), 'max_payouts': unc("Nombre maximal de retraits non indiqué pour le Rapid."),
        'drawdown_effect_of_payout': conf("Après le premier paiement approuvé, le plancher de perte maximale se verrouille à +100 $ au-dessus du solde de départ et cesse de monter.", 'mf-rapid'),
        'payout_paths': conf([{'id': 'rapid-daily', 'label': 'Sim Funded : retrait quotidien', 'min_days': None, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None,
           'note': "Demande possible toutes les 24 h si le solde dépasse le buffer (1 100 / 2 100 / 3 100 / 4 600 $) ; minimum 500 $ ; aucune consistance."}], 'mf-rapid'),
        'safety_net': conf({'exists': True, 'detail': "Buffer requis avant le premier retrait : 1 100 $ / 2 100 $ / 3 100 $ / 4 600 $ pour 25K / 50K / 100K / 150K."}, 'mf-rapid'),
        'withdrawal_conditions': conf("Sim Funded : demande toutes les 24 h au-dessus du buffer, minimum 500 $, partage 90/10, aucune consistance ni limite quotidienne ; plafond par retrait et passage au Live non précisés pour le Rapid ; comptes simultanés : 5 (25K/50K) ou 3 (100K/150K).", 'mf-rapid')},
     'restrictions': {
        'news': restr(conf('allowed', ['mf-news', 'mf-rapid'], "Toutes les évaluations : nouvelles Tier 1 permises (les stratégies de type straddle restent interdites)."), conf('conditional', ['mf-news', 'mf-rapid'], MF_NEWS_FUNDED)),
        'overnight': both('forbidden', 'mf-rapid', "« Rapid is intended for intraday futures trading » : toutes les positions doivent être fermées avant la fermeture de la session ; tenir une position overnight brise le compte."),
        'weekend': both('forbidden', 'mf-rapid', "Aucune position conservée après la fermeture de la session quotidienne."),
        'asian_session': restr(unc("Horaires MFFU : 18 h à 16 h 10 (Est) ; règle propre à la session asiatique non lue."), unc()),
        'scalping': restr(unc(), unc()), 'automated': restr(unc(), unc()), 'copy_trading': restr(unc(), unc())},
     'dynamic_observations': [obs("Prix affichés du plan Rapid", 'mf-price-rapid', {'page': 'plans/rapid'}, {'a_partir_de_usd': 125, 'prix_affiche_usd': 209, 'code_promo': 'CLUB (40 %)'}, "Prix non rattachés à une taille.")],
     'variants': variants, 'promos': [],
     'watch_points': conf(["Drawdown de fin de journée en évaluation mais INTRADAY en Sim Funded.", MF_NEWS_FUNDED,
        "Hedging interdit sur la même sous-jacente (ex. ES et MES opposés) ; stratégies de type straddle autour des nouvelles interdites.",
        "La page du plan affiche des informations contradictoires (type de drawdown, deux jeux de contrats) : contrats non confirmés.",
        "Prix : observations promotionnelles seulement."], ['mf-rapid', 'mf-news'])}

def mf_pro():
    PS = [(50000, 3000, 2000, 2100, 3), (100000, 6000, 3000, 3100, 6), (150000, 9000, 4500, 4600, 9)]
    variants = []
    for size, tgt, dd, buf, cts in PS:
        variants.append({'id': f'{size//1000}k', 'account_size_usd': size, 'option': None,
          'pricing': {'one_time': unc("Prix non affiché par taille sur la page lue."), 'monthly': na("Paiement unique."),
                      'activation_fee': conf(0, 'mf-pro', "Frais d'activation de 0 $."), 'reset_fee': unc(), 'conditional_fees': unc()},
          'evaluation': {'profit_target_usd': conf(tgt, 'mf-pro'), 'max_drawdown_usd': conf(dd, 'mf-pro', "Perte maximale de fin de journée (EOD)."),
                         'daily_loss_limit_usd': na("Aucune limite quotidienne."), 'min_trading_days': conf(2, 'mf-pro'),
                         'max_contracts': conf(cts, 'mf-pro', f"{cts} minis / {cts*10} micros.")},
          'funded': {'max_drawdown_usd': conf(dd, 'mf-pro', f"EOD trailing ; verrouillé à +100 $ après le premier paiement. Buffer : {buf} $."),
                     'daily_loss_limit_usd': na("Aucune limite quotidienne."),
                     'max_contracts': unc("La table du Sim Funded affiche « 3 / 3, 6 / 6, 9 / 9 » (mini / micro), incohérent avec l'évaluation (3/30…) : non tranché."),
                     'max_payout_usd': unc("« Max payout 100 000 $ » : la page parle tantôt d'un plafond PAR cycle, tantôt d'un total par utilisateur ; non tranché.")}})
    return {**mf_common('myfundedfutures-pro', 'Pro (MyFundedFutures)',
      "Évaluation à paiement unique (EOD, consistance 50 % en évaluation seulement), Sim Funded EOD sans limite quotidienne ni consistance, retraits tous les 14 jours (min. 1 000 $, 80/20) et passage au Live après 3 paiements consécutifs. Pas de nouvelles Tier 1 en Sim Funded.", 'https://myfundedfutures.com/plans/pro'),
     'evaluation': {'steps': conf(1, 'mf-pro'), 'drawdown_type': conf('eod_trailing', 'mf-pro'), 'time_limit_days': unc("Aucune limite de temps énoncée sur la page lue."),
        'description': conf("Atteindre l'objectif sur au moins 2 jours de trading sans toucher la perte maximale de fin de journée ; consistance de 50 % en évaluation seulement.", 'mf-pro'),
        'consistency_rule': conf({'exists': True, 'detail': "Aucun jour ne peut dépasser 50 % du profit d'évaluation ; aucune règle de consistance en Sim Funded (mais une « Consistent Trading Policy » surveille les comportements anormaux)."}, 'mf-pro')},
     'funded': {'account_nature': conf('simulated', 'mf-pro', "« All MFFU accounts operate in a simulated environment »."),
        'drawdown_type': conf('eod_trailing', 'mf-pro', "Verrouillé à +100 $ après le premier paiement approuvé."),
        'profit_split_pct': conf(80, 'mf-pro'), 'min_withdrawal_usd': conf(1000, 'mf-pro'),
        'payout_cap': conf({'has_cap': True, 'amount_usd': 100000}, 'mf-pro', "Plafond de 100 000 $ : la page parle d'un plafond « par cycle » et d'un total « par utilisateur » : interprétation non tranchée."),
        'max_payouts': unc("Aucun nombre maximal de retraits sim énoncé (passage au Live après 3 retraits consécutifs)."),
        'drawdown_effect_of_payout': conf("Après le premier paiement approuvé, la perte maximale se verrouille définitivement à +100 $ au-dessus du solde de départ ; avant, elle continue de monter à chaque nouveau sommet de fin de journée.", 'mf-pro'),
        'payout_paths': conf([{'id': 'pro-14', 'label': 'Sim Funded : cycle de 14 jours', 'min_days': 14, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None,
           'note': "Retraits possibles 14 jours après le premier trade, buffer dépassé (2 100 / 3 100 / 4 600 $), minimum 1 000 $, aucune consistance ; au moins un trade tous les 7 jours calendaires."}], 'mf-pro'),
        'safety_net': conf({'exists': True, 'detail': "Buffer requis : 2 100 $ / 3 100 $ / 4 600 $ pour 50K / 100K / 150K."}, 'mf-pro'),
        'withdrawal_conditions': conf("Retrait 14 jours après le premier trade, buffer dépassé, minimum 1 000 $, partage 80/20 ; jusqu'à 100 000 $ (cycle ou total, non tranché) ; après 3 paiements consécutifs, examen pour le Live (Blue Row Capital, partage 80/20, jusqu'à 5 000 $ de profit sim en réserve).", 'mf-pro')},
     'restrictions': {
        'news': restr(conf('allowed', ['mf-pro', 'mf-news'], "Évaluation : nouvelles Tier 1 permises."), conf('conditional', ['mf-pro', 'mf-news'], MF_NEWS_FUNDED)),
        'overnight': restr(unc("Page Pro non explicite ; Rapid et Builder interdisent la position overnight : non extrapolé."), unc()),
        'weekend': restr(unc("Page Pro non explicite : non extrapolé."), unc()),
        'asian_session': restr(unc(), unc()), 'scalping': restr(unc(), unc()), 'automated': restr(unc(), unc()), 'copy_trading': restr(unc(), unc())},
     'dynamic_observations': [],
     'variants': variants, 'promos': [],
     'watch_points': conf(["Retraits sur un cycle de 14 jours avec un minimum de 1 000 $ : moins fréquents que Rapid.", MF_NEWS_FUNDED,
        "Une « Consistent Trading Policy » surveille les comportements (contrats au maximum à chaque trade, retournements, fréquence élevée).",
        "Plafond de 100 000 $ : portée (par cycle ou totale) non tranchée par la page ; passage au Live après 3 retraits consécutifs.",
        "Prix des tailles non affichés sur la page lue."], ['mf-pro', 'mf-news'])}

def mf_builder():
    def v(vid, size, opt, tgt, dd, dll, cts, funded_ok, buf, price_obs):
        return {'id': vid, 'account_size_usd': size, 'option': opt,
          'pricing': {'one_time': unc("Tarif DYNAMIQUE (rabais de 30 % / 40 % en nombre d'utilisations limité) : voir observations dynamiques." if size == 50000 else "Prix du Builder 25K non lu."),
                      'monthly': na("Paiement unique."), 'activation_fee': conf(0, 'mf-builder50', "Frais d'activation de 0 $ (article Builder 50K).") if size == 50000 else unc("Réponse à « activation fee » non lue pour le 25K."),
                      'reset_fee': unc("Aucun prix ni condition de réinitialisation indiqués dans l'article lu."), 'conditional_fees': unc()},
          'evaluation': {'profit_target_usd': conf(tgt, 'mf-builder50' if size == 50000 else 'mf-builder25'),
                         'max_drawdown_usd': conf(dd, 'mf-builder50' if size == 50000 else 'mf-builder25', "Perte maximale EOD (MLL) ; se verrouille à +100 $ au-dessus du solde de départ."),
                         'daily_loss_limit_usd': conf(dll, 'mf-builder50' if size == 50000 else 'mf-builder25', "Limite quotidienne « SOFT » : pause jusqu'à la prochaine session, pas un échec du compte."),
                         'min_trading_days': conf(1, 'mf-builder50' if size == 50000 else 'mf-builder25'),
                         'max_contracts': conf(cts, 'mf-builder50' if size == 50000 else 'mf-builder25', f"{cts} minis / {cts*10} micros.")},
          'funded': {'max_drawdown_usd': conf(dd, 'mf-builder50' if size == 50000 else 'mf-builder25', "EOD trailing ; le solde de départ du compte Sim Funded est 0 $."),
                     'daily_loss_limit_usd': conf(dll, 'mf-builder50' if size == 50000 else 'mf-builder25', "Limite « soft » (pause, pas un échec)."),
                     'max_contracts': conf(cts, 'mf-builder50' if size == 50000 else 'mf-builder25'),
                     'max_payout_usd': conf(2000, 'mf-builder50', "Maximum par cycle de retrait (article Builder 50K).") if size == 50000 else unc("Plafond du Builder 25K non lu.")}}
    variants = [v('25k', 25000, None, 1500, 1000, 600, 2, False, None, False),
                v('50k-mll-defaut', 50000, 'MLL par défaut (2 000 $)', 3000, 2000, 1000, 4, True, 2100, True),
                v('50k-mll-add-on', 50000, 'MLL « Add-On » (1 500 $)', 3000, 1500, 1000, 4, True, 1600, True)]
    return {**mf_common('myfundedfutures-builder', 'Builder (MyFundedFutures)',
      "Évaluation à paiement unique d'un jour minimum, sans consistance, avec une limite quotidienne « soft » (pause) ; Sim Funded à 80/20 : 5 retraits maximum puis passage au Live (compte réel, 1 maximum). Nouvelles permises ; aucune position overnight.", 'https://help.myfundedfutures.com/en/articles/14290805-builder-plan-50k-a-comprehensive-guide'),
     'evaluation': {'steps': conf(1, 'mf-builder50'), 'drawdown_type': conf('eod_trailing', ['mf-builder50', 'mf-builder25']), 'time_limit_days': unc("Aucune limite de temps énoncée dans les articles lus."),
        'description': conf("Atteindre l'objectif de profit avec au moins 1 jour de trading sans toucher la perte maximale EOD ; aucune règle de consistance ; limite quotidienne « soft ».", 'mf-builder50'),
        'consistency_rule': conf({'exists': False, 'detail': None}, 'mf-builder50', "Aucune consistance en évaluation ; une règle de 50 % s'applique aux retraits Sim Funded.")},
     'funded': {'account_nature': conf('simulated', 'mf-pro', "« All MFFU accounts operate in a simulated environment » ; le Live est un compte réel."),
        'drawdown_type': conf('eod_trailing', 'mf-builder50'), 'profit_split_pct': conf(80, 'mf-builder50', "Lu sur l'article Builder 50K ; non confirmé pour le 25K."),
        'min_withdrawal_usd': conf(500, 'mf-builder50', "Lu sur l'article Builder 50K ; non confirmé pour le 25K."),
        'payout_cap': conf({'has_cap': True, 'amount_usd': 2000}, 'mf-builder50', "Maximum 2 000 $ par cycle (article 50K)."),
        'max_payouts': conf(5, 'mf-builder50', "5 retraits sim maximum ; Live possible après le 5e retrait approuvé."),
        'drawdown_effect_of_payout': unc("Effet d'un retrait sur la perte maximale non précisé dans l'article lu (Live : verrouillage à 0 $ de MLL)."),
        'payout_paths': conf([{'id': 'builder', 'label': 'Sim Funded : cycles de 2 jours qualifiants', 'min_days': 2, 'min_day_profit_usd': None, 'consistency_max_day_pct': 50, 'request_limit_pct_of_balance': None,
           'note': "2 jours qualifiants par cycle ; buffer à dépasser (2 100 $ / 1 600 $ selon la version MLL), 500 $ de profit net net au-dessus du buffer pour le premier retrait puis 500 $ depuis le précédent ; meilleur jour ≤ 50 % du profit du cycle ; premier retrait 48 h après le premier trade."}], 'mf-builder50', "Lu sur l'article Builder 50K."),
        'safety_net': conf({'exists': True, 'detail': "Buffer à dépasser avant le premier retrait : 2 100 $ (MLL par défaut) / 1 600 $ (Add-On) sur le 50K."}, 'mf-builder50'),
        'withdrawal_conditions': conf("Sim Funded (50K) : 2 jours qualifiants par cycle, buffer dépassé, 500 $ de profit net au-dessus du buffer au premier retrait puis 500 $ depuis le dernier, minimum 500 $, maximum 2 000 $ par cycle, consistance 50 % du meilleur jour, 5 retraits maximum, 80/20 ; Live après le 5e retrait (80/20, minimum 250 $, 1 compte maximum). Valeurs du 25K non lues.", 'mf-builder50')},
     'restrictions': {
        'news': both('allowed', ['mf-builder50', 'mf-news'], "Trading de nouvelles non restreint en évaluation et en Sim Funded (les stratégies de type straddle restent interdites)."),
        'overnight': both('forbidden', ['mf-builder50'], "Toutes les positions doivent être fermées avant la fin de la session ; fermeture automatique par la plateforme."),
        'weekend': both('forbidden', ['mf-builder50'], "Aucune position conservée après la fermeture de session."),
        'asian_session': restr(unc(), unc()), 'scalping': restr(unc(), unc()), 'automated': restr(unc(), unc()), 'copy_trading': restr(unc(), unc())},
     'dynamic_observations': [obs("Prix affichés du Builder 50K", 'mf-price-builder', {'page': 'builder-plan-50k'}, {'mll_defaut_liste_usd': 153, 'mll_defaut_30pct_usd': 107, 'mll_defaut_40pct_usd': 92, 'mll_add_on_liste_usd': 125, 'mll_add_on_30pct_usd': 87, 'mll_add_on_40pct_usd': 75}, "Rabais 30 % / 40 % à nombre d'utilisations limité (2).")],
     'variants': variants, 'promos': [],
     'watch_points': conf(["Seules les tailles 25K et 50K du Builder ont été lues ; d'autres tailles éventuelles ne sont pas modélisées.",
        "Limite quotidienne « soft » : pause jusqu'à la prochaine session, ce n'est pas un échec du compte.",
        "Retraits maximum 5 en Sim Funded ; compte inactif fermé après 7 jours calendaires sans trade.",
        "Les règles de retrait détaillées proviennent de l'article 50K ; non confirmées pour le 25K.",
        "Prix : observations promotionnelles seulement."], ['mf-builder50', 'mf-builder25'])}
for p in (mf_rapid(), mf_pro(), mf_builder()): write(p)

# =================================================================== TRADEDAY
TD_TARGET = {25000: 1500, 50000: 3000, 100000: 6000, 150000: 9000}
TD_DD = {25000: 1000, 50000: 2000, 100000: 3000, 150000: 4500}
TD_CTS = {25000: 2, 50000: 5, 100000: 10, 150000: 15}
FP_MINDAY = {25000: 100, 50000: 150, 100000: 200, 150000: 250}
FP_CAP = {25000: 750, 50000: 1500, 100000: 1875, 150000: 2250}
TD_PRICES = {
 'qp-intraday': {25000: (99, 39), 50000: (124, 49), 100000: (248, 99), 150000: (398, 159)},
 'qp-eod': {25000: (124, 49), 50000: (174, 69), 100000: (298, 119)},
 'fp-eod': {50000: (248, 99), 100000: (498, 199), 150000: (725, 290)}}
CONFLICT_DAYS = "Conflit de sources : les pages produit annoncent 5 jours (Quick Pay) / 3 jours (Fast Pass) de trading minimum, mais les Terms & Conditions (mis à jour le 11 août 2026) parlent d'une période minimale de 7 jours : non tranché."
def td_program(pid, kind, eval_dd, funded_dd, sizes):
    qp = kind == 'qp'
    label = ('Quick Pay' if qp else 'Fast Pass') + (' Intraday' if eval_dd == 'intraday_trailing' else ' fin de journée')
    variants = []
    for size in sizes:
        k = size // 1000
        price = TD_PRICES[pid.split('tradeday-')[1]].get(size)
        variants.append({'id': f'{k}k', 'account_size_usd': size, 'option': None,
          'pricing': {'one_time': unc(f"Prix observé : {price[1]} $ au lieu de {price[0]} $ (affichage promotionnel « one-time fee » sur l'accueil) ; la page Make It Take It affiche les mêmes montants « par mois » : modèle de facturation non tranché, voir observations dynamiques." if price else "Prix non relevé pour cette combinaison."),
                      'monthly': unc("Contradiction interne : « No Subscription Required » mais prix étiquetés « per month » sur une page : non tranché."),
                      'activation_fee': conf(0, 'td-home', "« No activation fee »."), 'reset_fee': unc("Montants de réinitialisation affichés seulement sur la page contradictoire Make It Take It."), 'conditional_fees': unc()},
          'evaluation': {'profit_target_usd': conf(TD_TARGET[size], 'td-home'), 'max_drawdown_usd': conf(TD_DD[size], 'td-home', "Max drawdown trailing, calculé " + ("en intraday." if eval_dd == 'intraday_trailing' else "en fin de journée.")),
                         'daily_loss_limit_usd': unc("Aucune limite quotidienne mentionnée ; absence non confirmée."), 'min_trading_days': unc(CONFLICT_DAYS),
                         'max_contracts': conf(TD_CTS[size], 'td-home', f"{TD_CTS[size]} contrats (micros plafonnés à 50 hors 25K : 20).")},
          'funded': {'max_drawdown_usd': conf(TD_DD[size], 'td-home', "Drawdown trailing " + ("calculé en intraday." if funded_dd == 'intraday_trailing' else "calculé en fin de journée (EOD).")),
                     'daily_loss_limit_usd': unc(), 'max_contracts': conf(TD_CTS[size], 'td-home', "Limite de position identique à l'évaluation."),
                     'max_payout_usd': unc("Aucun plafond par retrait affiché pour le Quick Pay.") if qp else conf(FP_CAP[size], 'td-home', "« Max Payout Request Per Cycle ».")}})
    funded = {'account_nature': conf('simulated', ['td-home', 'td-terms'], "« Funded Sim » ; le Funded Live est régi par un accord séparé."),
        'drawdown_type': conf(funded_dd, 'td-home')}
    if qp:
        funded.update({
          'profit_split_pct': conf(50, 'td-home', "50/50 sous 4 000 $ de profit net, 80/20 au-delà, 90/10 en Funded Live : valeur initiale retenue (la plus basse)."),
          'min_withdrawal_usd': conf(250, 'td-home'), 'payout_cap': unc("Aucun plafond par retrait affiché pour le Quick Pay."),
          'max_payouts': unc(), 'drawdown_effect_of_payout': unc("Effet d'un retrait sur le drawdown non indiqué."),
          'payout_paths': conf([{'id': 'quick-pay', 'label': 'Quick Pay : retrait dès le jour 1', 'min_days': 1, 'min_day_profit_usd': None, 'consistency_max_day_pct': None, 'request_limit_pct_of_balance': None,
             'note': "Aucun buffer, aucune consistance, aucun jalon ; minimum de 250 $ par demande ; traitement habituel sous 24 h."}], 'td-home'),
          'safety_net': conf({'exists': False, 'detail': "Aucun buffer à dépasser avant un retrait (« No Payout Buffer »)."}, 'td-home'),
          'withdrawal_conditions': conf("Retrait possible dès le jour 1 sur tout solde positif (aucun buffer), minimum 250 $ ; partage 50/50 sous 4 000 $ de profit net puis 80/20, 90/10 en Funded Live ; aucune consistance ni jalon en Sim Funded.", 'td-home')})
    else:
        funded.update({
          'profit_split_pct': conf(80, 'td-home', "80/20 en Funded Sim, 90/10 en Funded Live."),
          'min_withdrawal_usd': conf(250, 'td-home'), 'payout_cap': conf({'has_cap': True, 'amount_usd': None}, 'td-home', "Maximum par demande et par cycle selon la taille : 750 / 1 500 / 1 875 / 2 250 $."),
          'max_payouts': unc(), 'drawdown_effect_of_payout': unc("Effet d'un retrait sur le drawdown non indiqué."),
          'payout_paths': conf([{'id': 'fast-pass', 'label': 'Fast Pass : cycle structuré', 'min_days': 5, 'min_day_profit_usd': None, 'consistency_max_day_pct': 45, 'request_limit_pct_of_balance': None,
             'note': "5 jours profitables (100 / 150 / 200 / 250 $ selon 25K / 50K / 100K / 150K), consistance 45 %, minimum 250 $, maximum par cycle 750 / 1 500 / 1 875 / 2 250 $."}], 'td-home'),
          'safety_net': unc("Aucun buffer mentionné pour le Fast Pass dans les extraits lus."),
          'withdrawal_conditions': conf("Fast Pass : 5 jours minimum et 5 jours profitables (100 $ à 250 $ selon la taille), consistance 45 %, minimum 250 $, maximum par cycle selon la taille (750 à 2 250 $), 80/20 en Funded Sim et 90/10 en Funded Live.", 'td-home')})
    return {
     'id': pid, 'firm_id': 'tradeday', 'name': f'{label} (TradeDay)', 'demo': False, 'official_url': 'https://www.tradeday.com/',
     'summary': ("Quick Pay : évaluation de 5 jours avec consistance de 30 %, puis compte Funded Sim avec retrait dès le jour 1 sans buffer. " if qp else "Fast Pass : évaluation courte (3 jours annoncés) avec consistance de 45 %, puis retraits structurés par cycle. ")
                + "Day trading seulement : positions fermées au moins 10 minutes avant la fin de session ; futures CME Group seulement.",
     'instruments': unc("« Permitted products listed on our website » : la liste par symbole n'a pas pu être lue (seules les bourses CME, CBOT, NYMEX, COMEX sont confirmées)."),
     'instruments_scope': 'partial', 'instruments_excluded': unc("Liste par symbole non lue : aucun instrument ne peut être déclaré absent."),
     'contract_types': conf(FUT, ['td-terms', 'td-products'], "Produits futures CME Group seulement ; actions, options, devises, cryptomonnaies et CFD non permis."),
     'instrument_limits': unc(),
     'platforms': conf(['tradovate', 'rithmic'], 'td-home', "Tradovate et Rithmic (choix à l'achat ; Rithmic ajouté en 2026)."),
     'evaluation': {'steps': conf(1, 'td-home'), 'drawdown_type': conf(eval_dd, 'td-home', "Drawdown trailing, calculé " + ("en intraday." if eval_dd == 'intraday_trailing' else "en fin de journée.")),
        'time_limit_days': unc("Aucune limite de temps mentionnée."),
        'description': conf("Atteindre l'objectif de profit sans dépasser le drawdown maximal ni la limite de contrats, avec une consistance de " + ("30 %." if qp else "45 %."), 'td-home'),
        'consistency_rule': conf({'exists': True, 'detail': "Consistance de " + ("30 %" if qp else "45 %") + " en évaluation" + ("." if qp else " et pour les retraits Fast Pass.")}, 'td-home')},
     'funded': funded,
     'restrictions': {
        'news': restr(unc("Aucune règle de nouvelles énoncée ; les Terms interdisent d'encadrer (bracketing) une publication de données pour exploiter l'absence de glissement."), unc()),
        'overnight': both('forbidden', 'td-terms', "Day trading seulement : toutes les positions doivent être fermées au moins 10 minutes avant la fin de n'importe quelle session."),
        'weekend': both('forbidden', 'td-terms', "Day trading seulement : aucune position conservée."),
        'asian_session': restr(unc(), unc()), 'scalping': restr(unc("Les Terms interdisent les stratégies produisant plus de 200 trades par jour."), unc()),
        'automated': both('forbidden', 'td-terms', "Robots tiers et systèmes de trading automatisés (ATS) interdits."), 'copy_trading': restr(unc(), unc())},
     'eligibility': unc("Les Terms ne nomment aucun pays : l'utilisateur doit vérifier lui-même la légalité dans sa juridiction ; TradeDay peut limiter la disponibilité par région."),
     'quebec_by_stage': qc(
        ("Les Terms & Conditions ne nomment aucun pays et ne mentionnent pas le Québec : non confirmé. L'accès ne garantit pas l'admissibilité aux paiements.", ['td-terms']),
        ("Funded Sim : aucune règle géographique nommée ; le Québec n'est pas confirmé. Les paiements peuvent être perdus en cas de conduite interdite ; l'accès ne garantit pas l'admissibilité aux paiements.", ['td-terms']),
        ("Funded Live (accord séparé non lu) : conditions géographiques inconnues ; le Québec n'est pas confirmé.", ['td-terms'])),
     'dynamic_observations': [obs(f"Prix affichés {label}", 'td-price-home', {'page': 'accueil'}, {k2: v2 for s in sizes if s in TD_PRICES[pid.split('tradeday-')[1]] for k2, v2 in ((f'{s//1000}k_prix_barre_usd', TD_PRICES[pid.split('tradeday-')[1]][s][0]), (f'{s//1000}k_prix_affiche_usd', TD_PRICES[pid.split('tradeday-')[1]][s][1]))}, "La page Make It Take It étiquette ces prix « par mois » : facturation unique ou mensuelle non tranchée."),],
     'variants': variants, 'promos': [],
     'watch_points': conf([CONFLICT_DAYS, "Modèle de facturation contradictoire (unique vs mensuel) : prix non confirmés.",
        "Les pages TradeDay se contredisent aussi sur le drawdown funded des comptes « fin de journée » (étiquette « Intraday Funded Drawdown » vs « calculated EOD ») : valeur retenue intraday pour le Quick Pay.",
        "Positions fermées au moins 10 minutes avant la fin de session ; robots interdits ; plus de 200 trades par jour interdits.",
        "Liste des produits par symbole et pays admissibles non lus ; le Québec n'est pas confirmé."], ['td-terms', 'td-home'])}
for p in (td_program('tradeday-qp-intraday', 'qp', 'intraday_trailing', 'intraday_trailing', [25000, 50000, 100000, 150000]),
          td_program('tradeday-qp-eod', 'qp', 'eod_trailing', 'intraday_trailing', [25000, 50000, 100000, 150000]),
          td_program('tradeday-fp-eod', 'fp', 'eod_trailing', 'eod_trailing', [25000, 50000, 100000, 150000])):
    write(p)
print('ok', 'pays MFFU non encodés:', MF_SKIPPED)
