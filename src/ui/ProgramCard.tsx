import { Link } from 'react-router-dom'
import type { Dataset, Program, RestrictionKey } from '../data/schema'
import type { Evaluation, Status, VariantCost } from '../engine/evaluate'
import { OfficialWarning } from './OfficialWarning'
import { ObservedPriceLine } from './ObservedPrices'
import { cheapestVariant, computeVariantCosts } from '../engine/evaluate'
import { MAX_COMPARE, useApp } from '../state/AppState'
import { EvidenceLine } from './Evidence'
import { Why } from './Why'
import { DRAWDOWN_LABEL, NOT_CONFIRMED, contractLabel, withdrawalBlockers, fmtDate, fmtUsd, marketLabelsOf, restrictionSummary, sv, variantName } from './format'

export const STATUS_META: Record<Status, { label: string; icon: string; cls: string; blurb: string }> = {
  COMPATIBLE: { label: 'COMPATIBLE', icon: '✓', cls: 'ok', blurb: 'Les critères obligatoires sont satisfaits selon les informations vérifiées.' },
  A_VERIFIER: { label: 'À VÉRIFIER', icon: '!', cls: 'warn', blurb: 'Une ou plusieurs informations nécessaires sont manquantes, conditionnelles ou à revérifier.' },
  INCOMPATIBLE: { label: 'INCOMPATIBLE', icon: '✕', cls: 'bad', blurb: 'Au moins une incompatibilité bloquante est confirmée.' },
  PARTIEL: { label: 'ALTERNATIVE PROCHE', icon: '◐', cls: 'partial', blurb: "Aucune contrainte indispensable n'est en échec, mais au moins une préférence n'est pas satisfaite. Ce n'est pas une compatibilité complète." },
}

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status]
  return (
    <span className={`badge ${m.cls}`}>
      <span aria-hidden="true">{m.icon}</span> {m.label}
    </span>
  )
}

const KEY_RESTRICTIONS: RestrictionKey[] = ['overnight', 'weekend', 'news']
const SHORT: Record<string, string> = { overnight: 'Overnight', weekend: 'Week-end', news: 'Annonces' }

function costText(c: VariantCost | null): string {
  if (!c || c.basePrice === null) return NOT_CONFIRMED
  const base = c.model === 'monthly' ? `Dès ${fmtUsd(c.basePrice)} / mois (premier mois)` : `Dès ${fmtUsd(c.basePrice)} (paiement unique)`
  const act = c.activation.state === 'known' && c.activation.amount > 0 ? ` + ${fmtUsd(c.activation.amount)} d'activation` : c.activation.state === 'unknown' ? " · frais d'activation non confirmés" : ''
  return base + act
}

export function ProgramCard({ program, evaluation, ds }: { program: Program; evaluation?: Evaluation; ds: Dataset }) {
  const { ctx, favorites, toggleFavorite, compare, toggleCompare, isCompared } = useApp()
  const firm = ds.firms.find((f) => f.id === program.firm_id)
  const costs = evaluation?.variantCosts ?? computeVariantCosts(program, ctx)
  // Avec une évaluation : la variante RECOMMANDÉE (ses propres frais et règles) ; sans : la moins chère connue.
  const cheap = evaluation ? evaluation.recommended : cheapestVariant(costs)
  const ref = program.variants.find((v) => v.id === (evaluation?.recommendedVariantId ?? cheap?.variantId)) ?? [...program.variants].sort((a, b) => a.account_size_usd - b.account_size_usd)[0]
  const sizes = program.variants.map((v) => v.account_size_usd).sort((a, b) => a - b)
  const inCompare = isCompared(program.id)
  const isFav = favorites.includes(program.id)
  const num = (s: Parameters<typeof sv<number>>[0]) => sv(s, fmtUsd, { now: ctx.now, staleDays: ctx.scoring.stale_after_days })
  const dd = (s: Parameters<typeof sv<string>>[0]) => sv(s, (x) => DRAWDOWN_LABEL[x] ?? x, { na: 'Sans objet', now: ctx.now, staleDays: ctx.scoring.stale_after_days })

  const lastVerified = evaluation?.lastVerified ?? null
  const cov = evaluation?.coverage

  return (
    <article className={`card${evaluation ? ` st-${STATUS_META[evaluation.status].cls}` : ''}`} data-testid={`card-${program.id}`}>
      <header className="card-head">
        <div>
          <p className="card-firm">{firm?.name ?? program.firm_id}</p>
          <h3 className="card-title">{program.name}</h3>
          {program.demo && <span className="badge demo">DÉMO — programme fictif, pas une offre réelle</span>}
        </div>
        <div className="card-head-right">
          {evaluation && <StatusBadge status={evaluation.status} />}
          {evaluation?.needsReview && <span className="badge warn small">Vérification nécessaire</span>}
          <button type="button" className={`icon-btn${isFav ? ' on' : ''}`} aria-pressed={isFav} aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => toggleFavorite(program.id)}>
            {isFav ? '★' : '☆'}
          </button>
        </div>
      </header>

      {evaluation?.withdrawal.summary && <p className="note warn-note" role="note" data-testid="withdrawal-gap">⚠ {evaluation.withdrawal.summary}</p>}

      <dl className="facts">
        <div>
          <dt>Marchés disponibles</dt>
          <dd>{program.instruments.status === 'confirmed' ? marketLabelsOf(program, ds).join(', ') : NOT_CONFIRMED}</dd>
        </div>
        <div>
          <dt>Type de contrats</dt>
          <dd>{contractLabel(program)}</dd>
        </div>
        <div>
          <dt>Taille du compte</dt>
          <dd>{sizes.length === 1 ? fmtUsd(sizes[0]) : `${fmtUsd(sizes[0])} à ${fmtUsd(sizes[sizes.length - 1])}`}</dd>
        </div>
        <div>
          <dt>Type de drawdown</dt>
          <dd>
            {program.evaluation.drawdown_type.status !== 'not_applicable' && <>Évaluation : {dd(program.evaluation.drawdown_type)}<br /></>}
            Compte funded : {dd(program.funded.drawdown_type)}
          </dd>
        </div>
        <div>
          <dt>Objectif de profit</dt>
          <dd>
            {num(ref.evaluation.profit_target_usd)} <span className="muted">(compte de {variantName(ref)})</span>
          </dd>
        </div>
        <div>
          <dt>Coût</dt>
          <dd>
            {costText(cheap)}
            <div className="obs-line"><ObservedPriceLine program={program} ds={ds} /></div>
          </dd>
        </div>
        <div>
          <dt>Règles connues pouvant bloquer un retrait</dt>
          <dd>
            {withdrawalBlockers(program).length === 0 ? (
              <>{NOT_CONFIRMED} <span className="muted">(aucune règle confirmée : ne suppose pas qu’il n’y en a pas)</span></>
            ) : (
              <ul className="plain">{withdrawalBlockers(program).map((x) => <li key={x}>{x}</li>)}</ul>
            )}
          </dd>
        </div>
        <div>
          <dt>Principales restrictions</dt>
          <dd className="chips">
            {KEY_RESTRICTIONS.map((k) => {
              const r = restrictionSummary(program, k)
              const text = r.evaluation === r.funded ? r.evaluation : `Éval. ${r.evaluation.split(' — ')[0]} / Funded ${r.funded.split(' — ')[0]}`
              return (
                <span key={k} className="chip">
                  {SHORT[k]} : {text}
                </span>
              )
            })}
          </dd>
        </div>
      </dl>

      {evaluation && (
        <>
          <Why evaluation={evaluation} />
          {evaluation.variants.length > 1 && (
            <div className="variants" aria-label="Statut par taille de compte">
              <p className="variants-title">Par taille de compte (chaque taille avec ses propres frais) :</p>
              <ul className="variant-list">
                {evaluation.variants.map((v) => (
                  <li key={v.variantId} className={v.variantId === evaluation.recommendedVariantId ? 'rec' : ''}>
                    <span>{v.cost.label}</span>
                    <span className={`badge small ${STATUS_META[v.status].cls}`}>{STATUS_META[v.status].icon} {STATUS_META[v.status].label}</span>
                    <span className="muted">{v.cost.lowerBound === null ? NOT_CONFIRMED : `dès ${fmtUsd(v.cost.lowerBound)}`}</span>
                    {v.variantId === evaluation.recommendedVariantId && <span className="muted">· évaluée ci-dessous</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <details className="reasons-details">
          <summary>Voir le détail de chaque critère</summary>
          <ul className="reasons" aria-label="Raisons du statut">
            {evaluation.criteria.map((c) => (
              <li key={`${c.key}`} className={`r-${c.state}${c.relaxed ? ' relaxed' : ''}`}>
                <span className="r-icon" aria-hidden="true">{c.state === 'ok' ? '✓' : c.state === 'fail' ? '✕' : '!'}</span>
                <span>
                  <strong>{c.label}.</strong> {c.message}
                  {c.relaxed && <em> (préférence non satisfaite)</em>}
                  {c.evidence.length > 0 && (
                    <>
                      <br />
                      <EvidenceLine evidence={c.evidence} ds={ds} />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          </details>
          {evaluation.status !== 'INCOMPATIBLE' && (
            <div className="score">
              <p className="score-line">
                <strong>Correspondance : {evaluation.score.match === null ? 'non évaluée' : `${Math.round(evaluation.score.match)} %`}</strong>
                {' — '}
                <strong>Informations essentielles : {Math.round(cov!.essential.pct)} %</strong>
                {' · '}
                <span>secondaires : {Math.round(cov!.secondary.pct)} %</span>
              </p>
              {cov!.essential.problems.length > 0 && (
                <p className="gap" role="alert">
                  ⚠ Informations critiques {cov!.gaps.length > 0 ? 'manquantes' : 'à revérifier'} ({cov!.essential.problems.length}) : {cov!.essential.problems.slice(0, 3).map((x) => x.label).join(', ')}
                  {cov!.essential.problems.length > 3 ? '…' : ''}
                </p>
              )}
              {evaluation.secondaryStale > 0 && <p className="muted">{evaluation.secondaryStale} information(s) secondaire(s) à revérifier (sans effet sur le statut).</p>}
              <details>
                <summary>Voir le détail du calcul</summary>
                {evaluation.score.parts.length === 0 ? (
                  <p>Tu n'as exprimé aucune préférence de classement : aucun score de correspondance n'est calculé.</p>
                ) : (
                  <table className="mini">
                    <thead>
                      <tr><th>Critère</th><th>Poids</th><th>Info connue</th><th>Adéquation</th></tr>
                    </thead>
                    <tbody>
                      {evaluation.score.parts.map((p) => (
                        <tr key={p.key}>
                          <td>{p.label}<br /><span className="muted">{p.detail}</span></td>
                          <td>{p.weight}</td>
                          <td>{Math.round(p.knownRatio * 100)} %</td>
                          <td>{p.score === null ? 'Non évalué' : `${Math.round(p.score * 100)} %`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="muted">
                  Le score mesure uniquement la correspondance avec tes préférences. Un critère inconnu rapporte 0 point au classement. Ce n'est ni une probabilité de réussite, ni un avis sur la fiabilité financière de l'entreprise.
                </p>
              </details>
            </div>
          )}
        </>
      )}

      <p className="verified">
        Dernière vérification : <strong>{fmtDate(lastVerified ?? latestOf(program))}</strong>
      </p>

      {program.official_url && <OfficialWarning />}
      <footer className="card-actions">
        <Link className="btn primary" to={`/programme/${program.id}`}>
          Voir les détails
        </Link>
        <button type="button" className={`btn ${inCompare ? 'selected' : 'ghost'}`} aria-pressed={inCompare} disabled={!inCompare && compare.length >= MAX_COMPARE} onClick={() => toggleCompare(program.id, ref.id)}>
          {inCompare ? '✓ Dans la comparaison' : 'Comparer'}
        </button>
        {program.official_url ? (
          <a className="btn ghost" href={program.official_url} target="_blank" rel="noopener noreferrer">
            Site officiel ↗
          </a>
        ) : (
          <span className="btn ghost disabled" aria-disabled="true" title="Programme de démonstration : pas de site officiel">
            Site officiel : aucun (démo)
          </span>
        )}
      </footer>
    </article>
  )
}

function latestOf(p: Program): string | null {
  const dates: string[] = []
  const walk = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>
      if (typeof r.verified_at === 'string') dates.push(r.verified_at)
      Object.values(r).forEach(walk)
    }
  }
  walk(p)
  return dates.sort().at(-1) ?? null
}
