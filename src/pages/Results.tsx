import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { CriterionKey } from '../engine/answers'
import { RELAXABLE } from '../engine/answers'
import { criterionLabel, evaluateAll, type Evaluation, type Status } from '../engine/evaluate'
import { decodeShare, encodeShare } from '../engine/share'
import { MAX_COMPARE, useApp } from '../state/AppState'
import { ProgramCard, STATUS_META } from '../ui/ProgramCard'
import { ResidencePicker } from '../ui/ResidencePicker'

function activeCriteria(a: ReturnType<typeof useApp>['answers'], stepsBlocking: boolean, capNull: boolean): CriterionKey[] {
  const keys: CriterionKey[] = []
  if (a.markets.length > 0) keys.push('markets')
  if (a.when.includes('overnight')) keys.push('overnight')
  if (a.when.includes('weekend')) keys.push('weekend')
  if (a.when.includes('news')) keys.push('news')
  if (a.when.includes('asian')) keys.push('asian_session')
  if (a.style === 'scalping') keys.push('scalping')
  if (a.budget && !capNull) keys.push('budget')
  if (stepsBlocking && a.steps && a.steps !== 'any') keys.push('steps')
  return keys.filter((k) => RELAXABLE.includes(k))
}

export default function Results() {
  const { dataset, ctx, answers, replaceAnswers, setAnswers, relaxed, setRelaxed, compare } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const loadedToken = useRef<string | null>(null)

  // Lien de partage : on restaure les critères (la résidence n'y figure jamais).
  const token = params.get('r')
  const [ready, setReady] = useState(!token)
  useEffect(() => {
    if (!token || loadedToken.current === token) return
    loadedToken.current = token
    const shared = decodeShare(token)
    if (shared) {
      replaceAnswers({ ...shared.answers, residence: answers.residence })
      setRelaxed(shared.relaxed)
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const evals = useMemo(() => evaluateAll(dataset, answers, { now: ctx.now, relaxed }), [dataset, answers, relaxed, ctx.now])
  const byStatus = (s: Status) => evals.filter((e) => e.status === s)
  const compatible = byStatus('COMPATIBLE')
  const toCheck = byStatus('A_VERIFIER')
  const partial = byStatus('PARTIEL')
  const incompatible = byStatus('INCOMPATIBLE')
  const programOf = (e: Evaluation) => dataset.programs.find((p) => p.id === e.programId)!

  const capNull = answers.budget ? dataset.scoring.budget_caps_usd[answers.budget] === null : true
  const relaxable = activeCriteria(answers, dataset.scoring.steps_is_blocking, capNull)

  const copyLink = async () => {
    const t = encodeShare({ answers, relaxed })
    const url = `${window.location.href.split('#')[0]}#/resultats?r=${t}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied('ok')
    } catch {
      window.prompt('Copie ce lien :', url)
      setCopied('fail')
    }
  }

  // Critères responsables lorsqu'aucun programme n'est compatible.
  const blockers = useMemo(() => {
    const count = new Map<string, number>()
    for (const e of evals)
      for (const c of e.criteria) if (c.state === 'fail' && !c.relaxed) count.set(c.key, (count.get(c.key) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1])
  }, [evals])

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
      <p className="lead">
        {compatible.length} compatible{compatible.length > 1 ? 's' : ''} · {toCheck.length} à vérifier · {incompatible.length} incompatible{incompatible.length > 1 ? 's' : ''}
        {partial.length > 0 && ` · ${partial.length} partiellement compatible${partial.length > 1 ? 's' : ''}`}
      </p>

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

      <details className="panel" open={relaxed.length > 0}>
        <summary>Assouplir mes critères</summary>
        <p>
          Coche les critères que tu es prêt à assouplir pour voir aussi les programmes <strong>partiellement compatibles</strong>. Ces programmes ne sont jamais présentés comme compatibles. La résidence ne peut pas être assouplie : c'est un critère d'admissibilité.
        </p>
        <div className="relax-list">
          {relaxable.map((k) => (
            <label key={k} className="check">
              <input type="checkbox" checked={relaxed.includes(k)} onChange={() => setRelaxed(relaxed.includes(k) ? relaxed.filter((x) => x !== k) : [...relaxed, k])} />
              {criterionLabel(k)}
            </label>
          ))}
        </div>
      </details>

      <Section title="Compatibles" status="COMPATIBLE" evals={compatible} programOf={programOf} />
      {compatible.length === 0 && (
        <section className="panel info" aria-label="Aucun programme compatible">
          <h2>Aucun programme n'est confirmé compatible avec tous tes critères</h2>
          {blockers.length > 0 ? (
            <>
              <p>Voici les critères qui écartent le plus de programmes :</p>
              <ul>
                {blockers.map(([k, n]) => (
                  <li key={k}>
                    <strong>{criterionLabel(k as CriterionKey)}</strong> — {n} programme{n > 1 ? 's' : ''} écarté{n > 1 ? 's' : ''}
                  </li>
                ))}
              </ul>
              <p>Tu peux modifier tes réponses ou assouplir un critère ci-dessus. L'outil ne te proposera jamais une entreprise artificiellement.</p>
            </>
          ) : (
            <p>Aucune incompatibilité n'est confirmée, mais aucune information ne suffit encore pour confirmer la compatibilité : consulte les programmes « à vérifier » ci-dessous.</p>
          )}
        </section>
      )}
      <Section title="À vérifier" status="A_VERIFIER" evals={toCheck} programOf={programOf} />
      {partial.length > 0 && <Section title="Partiellement compatibles (critères assouplis)" status="PARTIEL" evals={partial} programOf={programOf} />}
      {incompatible.length > 0 && (
        <details className="group">
          <summary>
            <h2 className="inline">Incompatibles ({incompatible.length})</h2>
          </summary>
          <p className="muted">{STATUS_META.INCOMPATIBLE.blurb}</p>
          <div className="grid">
            {incompatible.map((e) => (
              <ProgramCard key={e.programId} program={programOf(e)} evaluation={e} ds={dataset} />
            ))}
          </div>
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

function Section({ title, status, evals, programOf }: { title: string; status: Status; evals: Evaluation[]; programOf: (e: Evaluation) => import('../data/schema').Program }) {
  const { dataset } = useApp()
  if (evals.length === 0) return null
  return (
    <section aria-label={title}>
      <h2>
        {title} <span className="count">{evals.length}</span>
      </h2>
      <p className="muted">{STATUS_META[status].blurb}</p>
      <div className="grid">
        {evals.map((e) => (
          <ProgramCard key={e.programId} program={programOf(e)} evaluation={e} ds={dataset} />
        ))}
      </div>
    </section>
  )
}
