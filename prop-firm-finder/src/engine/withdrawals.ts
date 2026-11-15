import type { Program, Variant } from '../data/schema'

/**
 * DIVULGATION DES CONDITIONS DE RETRAIT
 * Un programme dont les conditions de retrait sont incomplètes ne doit pas paraître plus favorable qu'il ne l'est.
 *  - « essential » : sans elle, on ne sait pas ce qu'on peut retirer (partage, minimum, conditions, plafond).
 *  - « important » : change la valeur réelle des retraits (Safety Net, nombre maximal, effet sur le drawdown, plafond par taille).
 * Ces lacunes sont TOUJOURS affichées ; elles ne bloquent PAS le statut (le blocage reste réservé aux informations
 * essentielles de data/scoring.json).
 */
export type WithdrawalGap = { key: string; label: string; tier: 'essential' | 'important' }

export type WithdrawalDisclosure = {
  gaps: WithdrawalGap[]
  essential: WithdrawalGap[]
  important: WithdrawalGap[]
  complete: boolean
  /** Phrase prête à afficher, ou null si tout est connu. */
  summary: string | null
}

const missing = (sv: { status: string } | undefined) => sv !== undefined && sv.status === 'unconfirmed'

export function withdrawalDisclosure(p: Program, v?: Variant): WithdrawalDisclosure {
  const gaps: WithdrawalGap[] = []
  const f = p.funded
  const add = (key: string, label: string, tier: WithdrawalGap['tier']) => gaps.push({ key, label, tier })
  if (missing(f.profit_split_pct)) add('profit_split_pct', 'Partage des profits', 'essential')
  if (missing(f.min_withdrawal_usd)) add('min_withdrawal_usd', 'Montant minimal de retrait', 'essential')
  if (missing(f.withdrawal_conditions)) add('withdrawal_conditions', 'Conditions de retrait', 'essential')
  if (missing(f.payout_cap)) add('payout_cap', 'Plafond de retrait', 'essential')
  if (missing(f.safety_net)) add('safety_net', 'Safety Net / solde minimal après retrait', 'important')
  if (f.max_payouts && missing(f.max_payouts)) add('max_payouts', 'Nombre maximal de retraits', 'important')
  if (f.drawdown_effect_of_payout && missing(f.drawdown_effect_of_payout)) add('drawdown_effect_of_payout', "Effet d'un retrait sur le drawdown", 'important')
  if (f.payout_paths && missing(f.payout_paths)) add('payout_paths', 'Conditions détaillées du premier retrait', 'important')
  if (v) {
    const caps = v.funded.payout_caps_by_number
    const byNumberKnown = caps?.status === 'confirmed' && caps.value !== null
    if (v.funded.max_payout_usd.status === 'unconfirmed' && !byNumberKnown) add('max_payout_usd', 'Plafond par retrait pour cette taille', 'important')
    else if (byNumberKnown && (caps!.value as (number | null)[]).some((x) => x === null)) add('payout_caps_partial', "Plafond de certains retraits (ex. le dernier) non lu", 'important')
  }
  const essential = gaps.filter((g) => g.tier === 'essential')
  const important = gaps.filter((g) => g.tier === 'important')
  const list = (xs: WithdrawalGap[]) => xs.map((x) => x.label.toLowerCase()).join(', ')
  const summary =
    gaps.length === 0
      ? null
      : `Conditions de retrait incomplètes${essential.length ? ` — essentiel manquant : ${list(essential)}` : ''}${important.length ? `${essential.length ? ' ;' : ' —'} à compléter : ${list(important)}` : ''}. Ne suppose pas qu'elles sont favorables.`
  return { gaps, essential, important, complete: gaps.length === 0, summary }
}
