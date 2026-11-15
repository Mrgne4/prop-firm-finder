import { Link, useParams } from 'react-router-dom'
import { collectSourced } from '../data/sourced'
import { RESTRICTION_KEYS } from '../data/schema'
import { evaluateProgram, instrumentTable } from '../engine/evaluate'
import { useApp } from '../state/AppState'
import { withdrawalDisclosure } from '../engine/withdrawals'
import { OfficialWarning } from '../ui/OfficialWarning'
import { ObservedPricesTable } from '../ui/ObservedPrices'
import { eligibilityText, CONTRACT_LABEL, DRAWDOWN_LABEL, RESTRICTION_NAME, fmtDate, fmtUsd, restrictionSummary, stepsText, sv, variantName } from '../ui/format'
import { GlossaryBody, Info } from '../ui/Glossary'
import { EvidenceLine } from '../ui/Evidence'
import { StatusBadge } from '../ui/ProgramCard'
import { formatters } from '../ui/rows'

export default function Detail() {
  const { id } = useParams()
  const { dataset, ctx, answers, favorites, toggleFavorite, compare, toggleCompare, isCompared } = useApp()
  const p = dataset.programs.find((x) => x.id === id)
  if (!p) {
    return (
      <div className="page narrow">
        <h1>Programme introuvable</h1>
        <Link className="btn primary" to="/explorer">Explorer les prop firms</Link>
      </div>
    )
  }
  const firm = dataset.firms.find((f) => f.id === p.firm_id)
  const F = formatters(ctx)
  const o = { now: ctx.now, staleDays: ctx.scoring.stale_after_days }
  const ev = answers.markets.length > 0 ? evaluateProgram(p, answers, ctx) : null
  const wd = ev?.withdrawal ?? withdrawalDisclosure(p, p.variants[0])
  const variants = [...p.variants].sort((a, b) => a.account_size_usd - b.account_size_usd)

  const found = collectSourced(p)
  const sourceIds = new Set<string>([...found.flatMap((x) => x.sv.sources), ...p.promos.map((x) => x.source)])
  const sources = dataset.sources.filter((s) => sourceIds.has(s.id))
  const dates = found.map((x) => x.sv.verified_at).filter((d): d is string => !!d).sort()
  const staleCount = ev?.staleCount ?? 0
  const platformName = (x: string) => dataset.platforms.find((pl) => pl.id === x)?.label ?? x
  const insByMarket = dataset.markets
    .map((m) => ({
      m,
      items: (p.instruments.value ?? []).map((i) => dataset.instruments.find((x) => x.id === i)).filter((i) => i && i.market === m.id),
    }))
    .filter((x) => x.items.length > 0)

  const inCompare = isCompared(p.id)
  const multi = p.evaluation.steps.status === 'confirmed' && (p.evaluation.steps.value ?? 0) >= 2
  const steps3 = p.evaluation.steps.status === 'confirmed' && (p.evaluation.steps.value ?? 0) >= 3
  const ddIds = [...new Set([p.evaluation.drawdown_type.value, p.funded.drawdown_type.value].filter((x): x is NonNullable<typeof x> => !!x))]
  const ddGloss = { static: 'static_drawdown', eod_trailing: 'eod_trailing', intraday_trailing: 'intraday_trailing' } as const

  return (
    <div className="page detail">
      <p className="crumbs"><Link to="/explorer">← Explorer</Link></p>
      <header className="detail-head">
        <div>
          <p className="card-firm">{firm?.name}</p>
          <h1>{p.name}</h1>
          {p.demo && <span className="badge demo">DÉMO — programme fictif, pas une offre réelle</span>}
        </div>
        <div className="detail-actions">
          {p.official_url && <OfficialWarning />}
          <button className={`btn ${favorites.includes(p.id) ? 'selected' : 'ghost'}`} aria-pressed={favorites.includes(p.id)} onClick={() => toggleFavorite(p.id)}>
            {favorites.includes(p.id) ? '★ Favori' : '☆ Ajouter aux favoris'}
          </button>
          <button className={`btn ${inCompare ? 'selected' : 'ghost'}`} aria-pressed={inCompare} disabled={!inCompare && compare.length >= 3} onClick={() => toggleCompare(p.id, ev?.recommendedVariantId ?? variants[0].id)}>
            {inCompare ? '✓ Dans la comparaison' : 'Comparer'}
          </button>
          {p.official_url ? (
            <a className="btn primary" href={p.official_url} target="_blank" rel="noopener noreferrer">Site officiel ↗</a>
          ) : (
            <span className="btn ghost disabled" aria-disabled="true">Pas de site officiel (démo)</span>
          )}
        </div>
      </header>

      {ev && (
        <section className="panel" aria-label="Pour ton profil">
          <h2>Pour ton profil <StatusBadge status={ev.status} /></h2>
          <ul className="reasons">
            {ev.criteria.map((c) => (
              <li key={c.key} className={`r-${c.state}`}>
                <span className="r-icon" aria-hidden="true">{c.state === 'ok' ? '✓' : c.state === 'fail' ? '✕' : '!'}</span>
                <span><strong>{c.label}.</strong> {c.message}{c.evidence.length > 0 && <><br /><EvidenceLine evidence={c.evidence} ds={dataset} /></>}</span>
              </li>
            ))}
          </ul>
          {ev.variants.length > 1 && (
            <>
              <h3>Statut par taille de compte</h3>
              <div className="table-wrap">
              <table className="mini" aria-label="Statut par taille de compte">
                <thead>
                  <tr><th scope="col">Compte</th><th scope="col">Statut</th><th scope="col">Coût de départ</th><th scope="col">Informations essentielles</th></tr>
                </thead>
                <tbody>
                  {ev.variants.map((v) => (
                    <tr key={v.variantId}>
                      <th scope="row">{fmtUsd(v.accountSizeUsd)}{v.variantId === ev.recommendedVariantId ? ' (évaluée ci-dessus)' : ''}</th>
                      <td><StatusBadge status={v.status} /></td>
                      <td>{v.cost.lowerBound === null ? 'Non confirmé' : fmtUsd(v.cost.lowerBound)}</td>
                      <td>{Math.round(v.coverage.essential.pct)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
          <h3>Fiabilité des informations</h3>
          <p>
            Essentielles : <strong>{Math.round(ev.coverage.essential.pct)} %</strong> · secondaires : {Math.round(ev.coverage.secondary.pct)} %
          </p>
          {ev.coverage.essential.problems.length > 0 && (
            <p className="gap" role="alert">⚠ Informations critiques {ev.coverage.gaps.length > 0 ? 'manquantes' : 'à revérifier'} : {ev.coverage.essential.problems.map((x) => x.label).join(', ')}</p>
          )}
        </section>
      )}

      <Block n={1} title="Présentation de l’entreprise">
        <p>{firm?.description}</p>
        {firm?.website && <OfficialWarning />}
        {firm?.website && <p><a href={firm.website} target="_blank" rel="noopener noreferrer">{firm.website}</a></p>}
      </Block>

      <Block n={2} title="Description du programme">
        <p>{p.summary}</p>
      </Block>

      <Block n={3} title="Instruments disponibles" info={['cfd_vs_futures']}>
        {p.instruments.status !== 'confirmed' ? (
          <p>Non confirmé.</p>
        ) : (
          insByMarket.map(({ m, items }) => (
            <p key={m.id}>
              <strong>{m.label}</strong> :{' '}
              {items.map((i) => `${i!.label} [${CONTRACT_LABEL[i!.contract]}]`).join(', ')}
            </p>
          ))
        )}
        <p>
          {p.instruments_scope === 'exhaustive'
            ? "La liste officielle a été lue en entier, mais elle peut contenir des produits hors de notre catalogue. Seuls les instruments explicitement vérifiés absents sont « non disponibles » ; les autres absents sont « à vérifier »."
            : "Seul un extrait de la liste officielle a été lu : un instrument absent est « à vérifier », pas « interdit »."}
        </p>
        {p.contract_types.status === 'confirmed' && p.contract_types.value && (
          <p><strong>Types de contrats acceptés :</strong> {p.contract_types.value.map((c) => CONTRACT_LABEL[c]).join(', ')}</p>
        )}
        {p.instrument_limits.note && <p className="note">{p.instrument_limits.note}</p>}
        <details>
          <summary>Vérifier instrument par instrument</summary>
          <div className="table-wrap">
            <table className="mini" aria-label="Disponibilité par instrument">
              <thead><tr><th>Instrument</th><th>Type de contrat</th><th>État</th><th>Détail</th></tr></thead>
              <tbody>
                {instrumentTable(p, ctx).map((c) => (
                  <tr key={c.id}>
                    <td>{c.label}</td>
                    <td>{CONTRACT_LABEL[c.contract as keyof typeof CONTRACT_LABEL] ?? c.contract}</td>
                    <td>{c.state === 'available' ? '✅ Disponible' : c.state === 'unavailable' ? '❌ Non disponible' : '❓ À vérifier'}</td>
                    <td>{c.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <p><strong>Plateformes :</strong> {F.list(p.platforms, platformName)}</p>
      </Block>

      <Block n={4} title="Fonctionnement du challenge">
        <p><strong>Format :</strong> {sv(p.evaluation.steps, stepsText, o)}</p>
        <p>{F.text(p.evaluation.description)}</p>
        <p>
          <strong>Règle de consistance :</strong>{' '}
          {sv(p.evaluation.consistency_rule, (x) => (x.exists ? x.detail ?? 'Oui' : 'Aucune'), o)} <Info ids={['consistency_rule']} label="Expliquer la consistance" />
        </p>
        {p.evaluation.daily_loss_behavior && (
          <p><strong>Si la limite quotidienne est atteinte :</strong> {sv(p.evaluation.daily_loss_behavior, (x) => (x === 'pause' ? 'arrêt de la journée seulement (le compte continue)' : 'échec du compte'), o)}</p>
        )}
        <h3>Règles de l’évaluation, par taille de compte</h3>
        <div className="table-wrap">
          <table className="mini">
            <thead>
              <tr><th>Compte</th><th>Objectif de profit{multi ? ' (étape 1)' : ''}</th>{multi && <th>Objectif étape 2</th>}{steps3 && <th>Objectif étape 3</th>}<th>Drawdown max.</th><th>Limite quotidienne</th><th>Jours min.</th><th>Contrats max.</th></tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>{variantName(v)}</td>
                  <td>{F.usd(v.evaluation.profit_target_usd)}</td>
                  {multi && <td>{v.evaluation.profit_target_phase2_usd ? F.usd(v.evaluation.profit_target_phase2_usd) : 'Non confirmé'}</td>}
                  {steps3 && <td>{v.evaluation.profit_target_phase3_usd ? F.usd(v.evaluation.profit_target_phase3_usd) : 'Non confirmé'}</td>}
                  <td>{F.usd(v.evaluation.max_drawdown_usd)}</td>
                  <td>{F.usd(v.evaluation.daily_loss_limit_usd, 'Aucune')}</td>
                  <td>{F.num(v.evaluation.min_trading_days, 'Aucun')}</td>
                  <td>{F.num(v.evaluation.max_contracts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block n={5} title="Explication du drawdown">
        <p>
          <strong>Évaluation :</strong> {F.dd(p.evaluation.drawdown_type)} · <strong>Compte funded :</strong> {F.dd(p.funded.drawdown_type)}
        </p>
        {ddIds.length === 0 ? <p>Type de drawdown non confirmé.</p> : ddIds.map((d) => { const g = dataset.glossary.find((x) => x.id === ddGloss[d]); return g ? <GlossaryBody key={d} g={g} /> : null })}
        {ddIds.length > 0 && <p className="muted">{ddIds.map((d) => DRAWDOWN_LABEL[d]).join(' / ')} : vérifie toujours la formulation exacte des règles sur le site officiel.</p>}
      </Block>

      <Block n={6} title="Restrictions de trading">
        <p className="muted">Chaque règle est indiquée séparément pour l’évaluation et pour le compte funded.</p>
        <div className="table-wrap">
          <table className="mini">
            <thead><tr><th>Règle</th><th>Évaluation</th><th>Compte funded</th></tr></thead>
            <tbody>
              {RESTRICTION_KEYS.map((k) => {
                const r = restrictionSummary(p, k)
                return (
                  <tr key={k}><td>{RESTRICTION_NAME[k]}</td><td>{r.evaluation}</td><td>{r.funded}</td></tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Restrictions géographiques :</strong>{' '}
          {sv(p.eligibility, eligibilityText, o)}
        </p>
        {p.quebec_by_stage && p.quebec_by_stage.length > 0 && (
          <div>
            <p><strong>Québec, par type de compte :</strong></p>
            <ul>
              {p.quebec_by_stage.map((q) => (
                <li key={q.stage}>
                  {{ evaluation: 'Évaluation', funded_sim: 'Compte funded simulé', live: 'Compte Live' }[q.stage]} :{' '}
                  <strong>{{ a_verifier: 'À VÉRIFIER', canada_general: 'Canada en général (province non confirmée)', restreint: 'Restreint (source officielle)', admis: 'Admis (source officielle)' }[q.state]}</strong> — {q.note}
                </li>
              ))}
            </ul>
            <p className="note">L'accès à un programme ne garantit jamais l'admissibilité aux paiements : celle-ci dépend de la politique de paiement (pays, vérification d'identité, méthode de versement).</p>
          </div>
        )}
      </Block>

      <Block n={7} title="Conditions du compte funded" info={['safety_net']}>
        <p><strong>Nature du compte :</strong> {sv(p.funded.account_nature, (x) => (x === 'simulated' ? 'Compte simulé' : 'Compte réel'), o)}</p>
        <p><strong>Type de drawdown :</strong> {F.dd(p.funded.drawdown_type)}</p>
        <div className="table-wrap">
          <table className="mini">
            <thead><tr><th>Compte</th><th>Drawdown max.</th><th>Limite quotidienne</th><th>Contrats max.</th></tr></thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>{variantName(v)}</td>
                  <td>{F.usd(v.funded.max_drawdown_usd)}</td>
                  <td>{F.usd(v.funded.daily_loss_limit_usd, 'Aucune')}</td>
                  <td>{F.num(v.funded.max_contracts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><strong>Safety Net :</strong> {sv(p.funded.safety_net, (x) => (x.exists ? x.detail ?? 'Oui' : 'Aucun'), o)}</p>
      </Block>

      <Block n={8} title="Retraits" info={['profit_split']}>
        {wd.summary && <p className="note warn-note" role="note"><strong>⚠ {wd.summary}</strong></p>}
        <p><strong>Conditions :</strong> {F.text(p.funded.withdrawal_conditions)}</p>
        <p><strong>Partage des profits :</strong> {F.pct(p.funded.profit_split_pct)}</p>
        <p><strong>Montant minimal de retrait :</strong> {F.usd(p.funded.min_withdrawal_usd, 'Aucun minimum')}</p>
        {p.funded.payout_paths && (
          <p>
            <strong>Chemins de retrait :</strong>{' '}
            {sv(p.funded.payout_paths, (xs) => xs.map((x) => `${x.label} — ${x.note}`).join(' | '), o)}
          </p>
        )}
        {p.funded.max_payouts && <p><strong>Nombre maximal de retraits :</strong> {sv(p.funded.max_payouts, (n) => String(n), o)}</p>}
        {p.funded.drawdown_effect_of_payout && <p><strong>Effet d'un retrait sur le drawdown :</strong> {F.text(p.funded.drawdown_effect_of_payout)}</p>}
        <p><strong>Plafond par retrait selon la taille :</strong>{' '}
          {variants.map((v) => `${variantName(v)} : ${v.funded.max_payout_usd.status === 'confirmed' ? fmtUsd(v.funded.max_payout_usd.value as number) : 'non confirmé'}`).join(' · ')}
        </p>
        <p><strong>Plafond éventuel :</strong> {sv(p.funded.payout_cap, (x) => (x.has_cap ? (x.amount_usd !== null ? fmtUsd(x.amount_usd) : 'Oui (montant non précisé)') : 'Aucun plafond'), o)}</p>
      </Block>

      <Block n={9} title="Frais" info={['activation_fee']}>
        <ObservedPricesTable program={p} ds={dataset} />
        <div className="table-wrap">
          <table className="mini">
            <thead><tr><th>Compte</th><th>Évaluation (unique)</th><th>Abonnement / mois</th><th>Activation</th><th>Reset</th></tr></thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>{variantName(v)}</td>
                  <td>{F.usd(v.pricing.one_time, '—')}</td>
                  <td>{F.usd(v.pricing.monthly, '—')}</td>
                  <td>{F.usd(v.pricing.activation_fee, 'Aucun')}</td>
                  <td>{F.usd(v.pricing.reset_fee, 'Aucun')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {variants.map((v) => (
          <p key={v.id} className="muted">
            Frais conditionnels ({variantName(v)}) :{' '}
            {sv(v.pricing.conditional_fees, (fees) => (fees.length === 0 ? 'aucun connu' : fees.map((f) => `${f.label}${f.amount_usd !== null ? ` (${fmtUsd(f.amount_usd)})` : ''} — ${f.condition}`).join(' ; ')), o)}
            {' '}— jamais additionnés au coût de départ.
          </p>
        ))}
        {p.promos.length > 0 && (
          <div className="panel info">
            <strong>Promotions observées (temporaires, jamais incluses dans les prix ni le score) :</strong>
            <ul>
              {p.promos.map((pr) => (
                <li key={pr.label}>{pr.label} — {pr.description} (observée le {fmtDate(pr.observed_on)}{pr.valid_until ? `, valable jusqu’au ${fmtDate(pr.valid_until)}` : ''})</li>
              ))}
            </ul>
          </div>
        )}
      </Block>

      <Block n={10} title="Points à surveiller">
        {p.watch_points.status === 'confirmed' && p.watch_points.value ? (
          p.watch_points.value.length > 0 ? (
            <ul>{p.watch_points.value.map((w) => <li key={w}>{w}</li>)}</ul>
          ) : (
            <p>Aucun point particulier relevé dans les sources consultées.</p>
          )
        ) : (
          <p>Non confirmé.</p>
        )}
      </Block>

      <Block n={11} title="Sources officielles">
        <OfficialWarning />
        {sources.length === 0 ? (
          <p>Aucune source.</p>
        ) : (
          <ul>
            {sources.map((s) => (
              <li key={s.id}>
                {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}{' '}
                <span className="muted">({s.type === 'official' ? 'source officielle' : s.type === 'demo' ? 'donnée fictive' : 'source tierce'})</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block n={12} title="Date de vérification">
        <p>
          Dernière vérification : <strong>{fmtDate(dates.at(-1) ?? null)}</strong>. Donnée la plus ancienne : <strong>{fmtDate(dates[0] ?? null)}</strong>.
        </p>
        {staleCount > 0 && <p className="callout">Vérification nécessaire : {staleCount} information(s) dépassent le seuil de {ctx.scoring.stale_after_days} jours.</p>}
        <p className="muted">Les données ne sont pas actualisées en temps réel. Le seuil de {ctx.scoring.stale_after_days} jours est un indicateur de maintenance, pas une garantie.</p>
      </Block>
    </div>
  )
}

function Block({ n, title, info, children }: { n: number; title: string; info?: string[]; children: React.ReactNode }) {
  return (
    <section className="block" aria-labelledby={`b${n}`}>
      <h2 id={`b${n}`}>
        <span className="num">{n}</span> {title} {info && <Info ids={info} />}
      </h2>
      {children}
    </section>
  )
}
