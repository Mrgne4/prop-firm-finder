import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Program } from '../data/schema'
import { weightOf, type CriterionKey } from '../engine/answers'
import { criterionLabel, evaluateAll, type Category, type Evaluation } from '../engine/evaluate'
import { activeCriteria, bottleneck, countsOf, strategySuggestions } from '../engine/funnel'
import { decodeShare, encodeShare } from '../engine/share'
import { MAX_COMPARE, useApp } from '../state/AppState'
import { UNIT_NOTE } from '../ui/FunnelBar'
import { ProgramCard } from '../ui/ProgramCard'
import { ResidencePicker } from '../ui/ResidencePicker'

const REASON: Partial<Record<string, string>> = {
  markets: 'Ne proposent pas les marchés choisis',
  instruments: 'Ne proposent pas tous les instruments choisis',
  residence: 'Admissibilité géographique exclue (confirmée)',
  budget: 'Prix confirmé au-dessus de ton budget (indispensable)',
  steps: "Autre type d'évaluation (indispensable)",
  drawdown: 'Autre type de drawdown (indispensable)',
  platform: 'Plateforme non proposée (indispensable)',
  news: 'Annonces économiques interdites (indispensable)',
  overnight: 'Positions overnight interdites (indispensable)',
  weekend: 'Positions pendant la fin de semaine interdites (indispensable)',
  asian_session: 'Session asiatique interdite (indispensable)',
  scalping: 'Scalping interdit (indispensable)',
}
const ORDER = ['markets', 'instruments', 'residence', 'overnight', 'weekend', 'news', 'asian_session', 'scalping', 'budget', 'steps', 'drawdown', 'platform']
const reasonOf = (e: Evaluation): string => {
  const keys = e.missed.filter((c) => c.weight === 'required').map((c) => c.key as string)
  const k = ORDER.find((x) => keys.includes(x)) ?? keys[0]
  return REASON[k] ?? 'Critère indispensable non respecté'
}

export default function Results() {
  const { dataset, ctx, answers, replaceAnswers, setAnswers, compare } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const loadedToken = useRef<string | null>(null)

  // Lien de partage : on restaure les critères et les cadenas (la résidence n'y figure jamais).
  const token = params.get('r')
  const [ready, setReady] = useState(!token)
  useEffect(() => {
    if (!token || loadedToken.current === token) return
    loadedToken.current = token
    const shared = decodeShare(token)
    if (shared) replaceAnswers({ ...shared.answers, residence: answers.residence })
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const evals = useMemo(() => evaluateAll(dataset, answers, { now: ctx.now }), [dataset, answers, ctx.now])
  const counts = useMemo(() => countsOf(dataset, evals), [dataset, evals])
  const of = (c: Category) => evals.filter((e) => e.category === c)
  const A = of('A').filter((e) => !e.uncertainBudget)
  const U = of('A').filter((e) => e.uncertainBudget)
  const B = of('B')
  const C = of('C')
  const programOf = (e: Evaluation) => dataset.programs.find((p) => p.id === e.programId) as Program
  const nameOf = (id: string) => dataset.programs.find((p) => p.id === id)?.name ?? id
  const suggestions = useMemo(() => strategySuggestions(dataset, answers, ctx.now, counts), [dataset, answers, ctx.now, counts])
  const neck = useMemo(() => (counts.a === 0 ? bottleneck(dataset, answers, ctx.now, counts) : null), [dataset, answers, ctx.now, counts])
  const active = activeCriteria(answers)

  const setWeight = (k: CriterionKey, w: 'required' | 'preferred') => setAnswers((a) => ({ ...a, locks: { ...a.locks, [k]: w } }))

  const copyLink = async () => {
    const t = encodeShare({ answers })
    const url = `${window.location.href.split('#')[0]}#/resultats?r=${t}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied('ok')
    } catch {
      window.prompt('Copie ce lien :', url)
      setCopied('fail')
    }
  }

  // C regroupés par raison.
  const groups = useMemo(() => {
    const m = new Map<string, Evaluation[]>()
    for (const e of C) m.set(reasonOf(e), [...(m.get(reasonOf(e)) ?? []), e])
    return [...m.entries()].sort((x, y) => y[1].length - x[1].length)
  }, [C])

  if (!ready) return <div className="page"><p>Chargement de tes critères…</p></div>

  if (answers.markets.length === 0) {
    return (
      <div className="page narrow">
        <h1>Tu n'as pas encore répondu au questionnaire</h1>
        <p>Réponds à quelques questions pour voir les programmes qui correspondent à ton profil.</p>
        <button className="btn primary" onClick={() => navigate('/questionnaire')}>Commencer le questionnaire</button>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>VOICI LES PROGRAMMES QUI CORRESPONDENT À TON PROFIL</h1>
      <p className="lead" data-testid="results-summary">
        {counts.a} programme{counts.a > 1 ? 's' : ''} possible{counts.a > 1 ? 's' : ''} ({counts.firmsA} entreprise{counts.firmsA > 1 ? 's' : ''}){counts.u > 0 ? ` · ${counts.u} à confirmer (budget)` : ''} · {counts.b} alternative{counts.b > 1 ? 's' : ''} proche{counts.b > 1 ? 's' : ''} · {counts.c} incompatible{counts.c > 1 ? 's' : ''}
      </p>
      <p className="muted unit-note">{UNIT_NOTE}</p>

      <div className="toolbar">
        <Link className="btn ghost" to="/questionnaire">✎ Modifier mes réponses</Link>
        <button className="btn ghost" type="button" onClick={copyLink}>🔗 Copier le lien de mes critères</button>
        {copied === 'ok' && <span role="status" className="muted">Lien copié (sans ta résidence).</span>}
      </div>

      {!answers.residence.country && (
        <section className="panel warn" aria-label="Résidence manquante">
          <h2>Indique ton pays de résidence</h2>
          <p>Sans cette information, l'admissibilité ne peut pas être vérifiée : aucun programme ne peut être confirmé compatible.</p>
          <ResidencePicker value={answers.residence} countries={dataset.countries} onChange={(residence) => setAnswers((a) => ({ ...a, residence }))} />
        </section>
      )}

      {active.length > 0 && (
        <details className="panel weights">
          <summary>Ajuster mes critères (indispensable ou souhaitable)</summary>
          <p>
            Un critère <strong>indispensable</strong> écarte tout programme qui ne le respecte pas, de façon confirmée. Un critère <strong>souhaitable</strong> place le programme parmi les alternatives proches. L’outil ne change jamais un critère indispensable de lui-même. Le marché, les instruments et la résidence sont toujours indispensables.
          </p>
          <ul className="weight-list">
            {active.map((k) => (
              <li key={k}>
                <span>{criterionLabel(k)}</span>
                <button type="button" className="btn ghost small" aria-pressed={weightOf(k, answers) === 'required'} onClick={() => setWeight(k, weightOf(k, answers) === 'required' ? 'preferred' : 'required')}>
                  {weightOf(k, answers) === 'required' ? '🔒 Indispensable' : 'Souhaitable'}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Group title="A. Correspondances potentielles" cat="A" evals={A} programOf={programOf} blurb="Aucune incompatibilité confirmée avec tes critères. Ce ne sont pas des programmes garantis : les points « à vérifier » doivent l’être sur le site officiel avant tout achat." />
      {U.length > 0 && (
        <Group title="À confirmer : budget indispensable, prix seulement observé" cat="A" evals={U} programOf={programOf} blurb="Tu as déclaré ton budget indispensable. Pour ces programmes, aucun prix confirmé n’existe : le prix observé sur le site officiel semble au-dessus de ton plafond. Ce n’est pas une correspondance confirmée : vérifie le prix avant de les retenir." />
      )}
      {A.length === 0 && (
        <section className="panel info" aria-label="Aucune correspondance">
          <h2>Aucun programme ne remplit tous tes critères</h2>
          {U.length > 0 && <p>Certains programmes restent à confirmer sur le prix (voir plus haut), sans être des correspondances.</p>}
          {B.length > 0 ? <p>Voici les alternatives les plus proches : chacune indique ce qui ne correspond pas et l’ajustement nécessaire.</p> : <p>Aucune alternative proche non plus avec tes critères indispensables actuels.</p>}
          {neck && (
            <p>
              « {neck.label} » est ce qui restreint le plus tes choix : sans lui, {neck.gain} programme{neck.gain > 1 ? 's' : ''} de plus seraient possibles.
              {weightOf(neck.key, answers) === 'required' && (
                <>
                  {' '}<button type="button" className="linklike" onClick={() => setWeight(neck.key, 'preferred')}>Le rendre seulement souhaitable</button>
                </>
              )}
            </p>
          )}
          <p>L'outil ne te proposera jamais une entreprise artificiellement.</p>
        </section>
      )}

      <Group title="B. Alternatives proches" cat="B" evals={B} programOf={programOf} limit={A.length === 0 ? 6 : 3} blurb="Aucune contrainte indispensable en échec, mais au moins une préférence n’est pas satisfaite. Ce ne sont PAS des correspondances : l’ajustement nécessaire est indiqué sur chaque carte." />

      {suggestions.length > 0 && (
        <section className="panel strategy" aria-label="Changements de stratégie possibles" data-testid="strategy">
          <h2>Et si tu changeais de stratégie ?</h2>
          <p className="muted">Ces programmes <strong>ne sont pas compatibles</strong> avec tes critères actuels. Ils ne le deviendraient que si tu modifiais un critère que tu as déclaré indispensable.</p>
          <ul>
            {suggestions.map((x) => (
              <li key={x.target}>
                <strong>Si tu changes « {x.label} » :</strong> {x.programIds.length} programme{x.programIds.length > 1 ? 's' : ''} de plus ({x.programIds.slice(0, 4).map(nameOf).join(', ')}{x.programIds.length > 4 ? '…' : ''}).
                <br />
                <span className="muted">{x.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {C.length > 0 && (
        <details className="group" data-testid="incompatibles">
          <summary>
            <h2 className="inline">C. Incompatibles ({C.length})</h2>
          </summary>
          <p className="muted">Au moins un critère indispensable est en échec de façon confirmée. Un programme n’est jamais écarté sur une information inconnue.</p>
          {groups.map(([reason, list]) => (
            <details key={reason} className="group sub">
              <summary><strong>{list.length} écarté{list.length > 1 ? 's' : ''} : {reason}</strong></summary>
              <div className="grid">
                {list.map((e) => (
                  <ProgramCard key={e.programId} program={programOf(e)} evaluation={e} ds={dataset} />
                ))}
              </div>
            </details>
          ))}
        </details>
      )}

      <p className="disclaimer">
        Comparateur indépendant à vocation éducative. Les conditions des entreprises peuvent évoluer : les données affichées ne sont pas actualisées en temps réel. Confirme toujours les règles et ton admissibilité sur le site officiel avant tout achat.
      </p>

      {compare.length > 0 && (
        <div className="compare-tray" role="region" aria-label="Comparaison">
          <span>
            {compare.length} programme{compare.length > 1 ? 's' : ''} sélectionné{compare.length > 1 ? 's' : ''} (max {MAX_COMPARE})
          </span>
          <Link className="btn primary" to={`/comparer?p=${compare.join(',')}`}>
            Comparer
          </Link>
        </div>
      )}
    </div>
  )
}

function Group({ title, cat, evals, programOf, blurb, limit }: { title: string; cat: Category; evals: Evaluation[]; programOf: (e: Evaluation) => Program; blurb: string; limit?: number }) {
  const { dataset } = useApp()
  if (evals.length === 0) return null
  const shown = limit ? evals.slice(0, limit) : evals
  const rest = limit ? evals.slice(limit) : []
  return (
    <section aria-label={title} data-category={cat}>
      <h2>
        {title} <span className="count">{evals.length}</span>
      </h2>
      <p className="muted">{blurb}</p>
      <div className="grid">
        {shown.map((e) => (
          <ProgramCard key={e.programId} program={programOf(e)} evaluation={e} ds={dataset} />
        ))}
      </div>
      {rest.length > 0 && (
        <details className="group">
          <summary>Voir {rest.length} autre{rest.length > 1 ? 's' : ''} (moins proche{rest.length > 1 ? 's' : ''})</summary>
          <div className="grid">
            {rest.map((e) => (
              <ProgramCard key={e.programId} program={programOf(e)} evaluation={e} ds={dataset} />
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
