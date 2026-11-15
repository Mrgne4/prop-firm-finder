import type { Dataset, Program } from '../data/schema'
import { fmtDate, fmtUsd } from './format'
import { OfficialWarning } from './OfficialWarning'

export const OBS_DISCLAIMER = "Prix à vérifier : valeur relevée sur le site officiel à la date indiquée. Ce n'est ni un prix garanti ni un prix confirmé (promotions, devise et taxes peuvent changer)."

const KIND_LABEL: Record<string, string> = { affiche: 'Prix affiché', promo: 'Avec code / rabais', a_partir_de: '« À partir de »', mensuel: 'Mensualité' }
export const fmtObs = (amount: number, currency: 'USD' | 'EUR') =>
  `${amount.toLocaleString('fr-CA', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })} ${currency === 'EUR' ? '€' : '$ US'}`

/** Plus petit prix affiché (hors codes/rabais) observé, pour la carte. */
export function lowestObserved(p: Program) {
  const list = (p.observed_prices ?? []).filter((x) => x.kind === 'affiche' || x.kind === 'a_partir_de')
  if (list.length === 0) return null
  return list.reduce((m, x) => (x.amount < m.amount ? x : m))
}

export function sourceUrl(ds: Dataset, p: Program, sourceId: string): string {
  return ds.sources.find((s) => s.id === sourceId)?.url || p.official_url || '#'
}

/** Mention courte pour la carte. */
export function ObservedPriceLine({ program }: { program: Program; ds: Dataset }) {
  const o = lowestObserved(program)
  if (!o) return <span className="muted">Aucun prix observé</span>
  return (
    <span>
      Observé : {o.kind === 'a_partir_de' ? 'dès ' : 'dès '}{fmtObs(o.amount, o.currency)} <span className="muted">({fmtDate(o.observed_on)})</span>{' '}
      <span className="badge warn small">Prix à vérifier</span>{' '}
    </span>
  )
}

/** Tableau détaillé pour la page de détail. */
export function ObservedPricesTable({ program, ds }: { program: Program; ds: Dataset }) {
  const list = program.observed_prices ?? []
  if (list.length === 0) return <p className="note warn-note" role="note">Aucun prix n'a pu être relevé sur le site officiel : prix <strong>non confirmé</strong>, consulte le site officiel.</p>
  const name = (id: string | null) => {
    const v = program.variants.find((x) => x.id === id)
    return v ? `Compte de ${fmtUsd(v.account_size_usd)}${v.option ? ` (${v.option})` : ''}` : 'Non rattaché à une taille'
  }
  return (
    <div className="panel info" role="note">
      <strong>Prix observés sur le site officiel — Prix à vérifier</strong>
      <p>{OBS_DISCLAIMER}</p>
      <OfficialWarning />
      <div className="table-wrap">
        <table className="mini">
          <thead><tr><th>Compte</th><th>Type</th><th>Montant observé</th><th>Observé le</th><th>Vérifier</th></tr></thead>
          <tbody>
            {list.map((x, i) => (
              <tr key={i}>
                <td>{x.variant_id ? name(x.variant_id) : x.label}</td>
                <td>{KIND_LABEL[x.kind]}{x.note ? <div className="muted">{x.note}</div> : null}</td>
                <td>{fmtObs(x.amount, x.currency)}</td>
                <td>{fmtDate(x.observed_on)}</td>
                <td><a href={sourceUrl(ds, program, x.source)} target="_blank" rel="noopener noreferrer">Site officiel</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
