import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Contract } from '../data/schema'
import type { Answers, CriterionKey, DrawdownPref } from '../engine/answers'
import { RESTRICTION_KEYS, weightOf } from '../engine/answers'
import { budgetBrackets } from '../engine/budget'
import { activeCriteria, funnelCounts, trail as funnelTrail } from '../engine/funnel'
import { BASIS_TEXT } from '../engine/evaluate'
import {
  BUDGET_OPTIONS,
  DRAWDOWN_OPTIONS,
  PRIORITY_OPTIONS,
  STEPS_OPTIONS,
  STEP_TITLES,
  STYLE_OPTIONS,
  WHEN_OPTIONS,
  activeSteps,
  multiFormMarkets,
  stepIsValid,
  type StepId,
} from '../quiz/steps'
import { useApp } from '../state/AppState'
import { CONTRACT_LABEL } from '../ui/format'
import { GlossaryBody, Info } from '../ui/Glossary'
import { Option } from '../ui/Options'
import { FunnelBar, LockSwitch } from '../ui/FunnelBar'
import { fmtUsd } from '../ui/format'
import { ResidencePicker } from '../ui/ResidencePicker'

export default function Quiz() {
  const { dataset, ctx, answers, setAnswers } = useApp()
  const navigate = useNavigate()
  const steps = useMemo(() => activeSteps(answers, dataset), [answers, dataset])
  const [current, setCurrent] = useState<StepId>('markets')
  const index = Math.max(0, steps.indexOf(current))
  const valid = stepIsValid(current, answers, dataset)

  // Si la sous-question disparaît (ex. marché décoché), on retombe sur une étape existante.
  useEffect(() => {
    if (!steps.includes(current)) setCurrent(steps[Math.min(index, steps.length - 1)])
  }, [steps, current, index])

  const set = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const setWeight = (k: CriterionKey, w: 'required' | 'preferred') => set({ locks: { ...answers.locks, [k]: w } })
  const flip = (k: CriterionKey) => setWeight(k, weightOf(k, answers) === 'required' ? 'preferred' : 'required')
  const activeRestrictions = activeCriteria(answers).filter((k) => RESTRICTION_KEYS.includes(k))
  const restrictionsRequired = activeRestrictions.every((k) => weightOf(k, answers) === 'required')

  // Aperçu : nombre de programmes possibles si l'étudiant retient chaque option de la question courante.
  const preview = useMemo(() => {
    const c = (patch: Partial<Answers>) => funnelCounts(dataset, { ...answers, ...patch }, ctx.now).a
    const addTo = <T,>(list: T[], v: T) => (list.includes(v) ? list : [...list, v])
    const out: Record<string, number> = {}
    switch (current) {
      case 'markets':
        for (const m of dataset.markets) out[m.id] = c({ markets: addTo(answers.markets, m.id) })
        break
      case 'instruments':
        for (const i of dataset.instruments) if (answers.markets.includes(i.market)) out[i.id] = c({ instruments: addTo(answers.instruments, i.id) })
        break
      case 'style':
        for (const o of STYLE_OPTIONS) out[o.id] = c({ style: o.id })
        break
      case 'when':
        for (const o of WHEN_OPTIONS) out[o.id] = o.id === 'none' ? c({ when: ['none'] }) : c({ when: addTo(answers.when.filter((w) => w !== 'none'), o.id) })
        break
      case 'budget':
        for (const o of BUDGET_OPTIONS) out[o.id] = c({ budget: o.id })
        break
      case 'steps':
        for (const o of STEPS_OPTIONS) out[o.id] = c({ steps: o.id })
        break
      case 'drawdown':
        for (const o of DRAWDOWN_OPTIONS) out[o.id] = c({ drawdown: o.id as DrawdownPref })
        break
      case 'platform':
        for (const p of dataset.platforms) out[p.id] = c({ platforms: addTo(answers.platforms, p.id) })
        break
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, answers, dataset, ctx.now])

  const stagePatches = useMemo(() => {
    const patchOf: Record<StepId, Partial<Answers>> = {
      markets: { markets: answers.markets },
      forms: { marketForms: answers.marketForms },
      residence: { residence: answers.residence },
      instruments: { instruments: answers.instruments },
      style: { style: answers.style },
      when: { when: answers.when },
      budget: { budget: answers.budget },
      steps: { steps: answers.steps },
      drawdown: { drawdown: answers.drawdown },
      priority: { priority: answers.priority },
      platform: { platforms: answers.platforms },
    }
    const upto = steps.slice(0, index + 1).filter((id) => id === current || stepIsValid(id, answers, dataset))
    return upto.map((id) => patchOf[id])
  }, [steps, index, current, answers, dataset])
  const trailValues = useMemo(() => {
    const start = funnelTrail(dataset, answers, [{}], ctx.now)
    return [...start, ...funnelTrail(dataset, answers, stagePatches, ctx.now)]
  }, [dataset, answers, stagePatches, ctx.now])

  const budgetView = useMemo(() => (current === 'budget' ? budgetBrackets(dataset, answers, ctx.now) : null), [current, dataset, answers, ctx.now])

  const next = () => {
    if (!valid) return
    if (index >= steps.length - 1) navigate('/resultats')
    else setCurrent(steps[index + 1])
  }
  const back = () => (index === 0 ? navigate('/') : setCurrent(steps[index - 1]))
  const pct = Math.round((index / steps.length) * 100)

  return (
    <div className="page narrow">
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-label="Progression du questionnaire">
        <div className="progress-bar" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <p className="step-count">
        Question {index + 1} sur {steps.length}
      </p>
      <FunnelBar ds={dataset} answers={answers} now={ctx.now} trail={trailValues} onSoften={(k) => setWeight(k, 'preferred')} />
      <h1 className="q-title">{STEP_TITLES[current]}</h1>

      {current === 'markets' && (
        <>
          <p className="q-hint">Tu peux en choisir plusieurs.</p>
          <div className="options">
            {dataset.markets.map((m) => (
              <Option
                key={m.id}
                multi
                selected={answers.markets.includes(m.id)}
                label={m.label}
                help={m.help}
                count={preview[m.id]}
                onClick={() => set({ markets: toggle(answers.markets, m.id) })}
              />
            ))}
          </div>
          <p className="note">
            Les contrats futures (NQ, ES…) et les CFD (NAS100, SPX500…) sont des instruments différents : l'outil ne les considère jamais comme équivalents. <Info ids={['cfd_vs_futures']} label="Futures ou CFD ?" />
          </p>
        </>
      )}

      {current === 'forms' && (
        <>
          <p className="q-hint">Pour certains marchés, le programme peut proposer des contrats futures, des CFD ou d'autres instruments.</p>
          {multiFormMarkets(dataset, answers.markets).map(({ market, forms }) => (
            <fieldset key={market} className="fieldset">
              <legend>{dataset.markets.find((m) => m.id === market)?.label}</legend>
              <div className="options" role="radiogroup">
                {([...forms, 'any'] as ('any' | Contract)[]).map((f) => (
                  <Option
                    key={f}
                    selected={answers.marketForms[market] === f}
                    label={f === 'any' ? 'Peu importe' : CONTRACT_LABEL[f]}
                    onClick={() => set({ marketForms: { ...answers.marketForms, [market]: f } })}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </>
      )}

      {current === 'instruments' && (
        <>
          <p className="q-hint">
            Choisis les contrats exacts que tu veux trader : l'outil vérifie chacun, programme par programme. Tu peux passer cette étape.
          </p>
          {dataset.markets
            .filter((m) => answers.markets.includes(m.id))
            .map((m) => {
              const list = dataset.instruments.filter((i) => i.market === m.id)
              if (list.length === 0) return null
              return (
                <fieldset key={m.id} className="fieldset">
                  <legend>{m.label}</legend>
                  <div className="options">
                    {list.map((i) => (
                      <Option
                        key={i.id}
                        multi
                        selected={answers.instruments.includes(i.id)}
                        label={i.label}
                        count={preview[i.id]}
                        help={`${CONTRACT_LABEL[i.contract]} — sous-jacent : ${i.underlying}`}
                        onClick={() => set({ instruments: toggle(answers.instruments, i.id) })}
                      />
                    ))}
                  </div>
                </fieldset>
              )
            })}
        </>
      )}

      {current === 'style' && (
        <div className="options" role="radiogroup">
          {STYLE_OPTIONS.map((o) => (
            <Option key={o.id} selected={answers.style === o.id} label={o.label} help={o.help} count={preview[o.id]} onClick={() => set({ style: o.id })} />
          ))}
        </div>
      )}

      {current === 'when' && (
        <>
          <p className="q-hint">Tes réponses servent à vérifier les restrictions de chaque programme.</p>
          {answers.style === 'swing' && !answers.when.some((w) => w === 'overnight' || w === 'weekend') && (
            <p className="callout">Le swing trading implique en général de garder des positions ouvertes : pense à cocher « nuit » et/ou « fin de semaine ».</p>
          )}
          <div className="options">
            {WHEN_OPTIONS.map((o) => (
              <Option
                key={o.id}
                multi
                selected={answers.when.includes(o.id)}
                label={o.label}
                help={o.help}
                count={preview[o.id]}
                onClick={() =>
                  set({
                    when: o.id === 'none' ? (answers.when.includes('none') ? [] : ['none']) : toggle(answers.when.filter((w) => w !== 'none'), o.id),
                  })
                }
              />
            ))}
          </div>
          {activeRestrictions.length > 0 && (
            <p className="lock-line">
              Ces choix sont traités comme <strong>indispensables</strong> : un programme qui les interdit sera écarté.{' '}
              <button type="button" className="linklike" onClick={() => activeRestrictions.forEach((k) => setWeight(k, restrictionsRequired ? 'preferred' : 'required'))}>
                {restrictionsRequired ? 'Les traiter comme souhaitables' : 'Les rendre indispensables'}
              </button>
            </p>
          )}
        </>
      )}

      {current === 'drawdown' && (
        <>
          <p className="q-hint">Le drawdown est la perte maximale que ton compte peut subir avant d'être fermé.</p>
          <div className="options" role="radiogroup">
            {DRAWDOWN_OPTIONS.map((o) => (
              <Option key={o.id} selected={answers.drawdown === o.id} label={o.label} gloss={o.gloss} count={preview[o.id]} onClick={() => set({ drawdown: o.id as DrawdownPref })} />
            ))}
          </div>
          {answers.drawdown && ['static', 'eod_trailing', 'intraday_trailing'].includes(answers.drawdown) && (
            <LockSwitch checked={weightOf('drawdown', answers) === 'required'} onChange={() => flip('drawdown')}>Indispensable pour moi</LockSwitch>
          )}
          <details className="explain" open={answers.drawdown === 'unknown'}>
            <summary>Comprendre les trois modèles (avec un exemple chiffré)</summary>
            {['static_drawdown', 'eod_trailing', 'intraday_trailing'].map((id) => {
              const g = dataset.glossary.find((x) => x.id === id)
              return g ? <GlossaryBody key={id} g={g} /> : null
            })}
          </details>
        </>
      )}

      {current === 'budget' && (
        <>
          <p className="q-hint">Un budget n’élimine pas un programme au hasard : si son prix dépasse ton plafond, il passe simplement en « alternative proche ». Un prix inconnu n’est jamais considéré comme « sous ton budget ».</p>
          <div className="options" role="radiogroup">
            {BUDGET_OPTIONS.map((o) => (
              <Option key={o.id} selected={answers.budget === o.id} label={o.label} count={preview[o.id]} onClick={() => set({ budget: o.id })} />
            ))}
          </div>
          {answers.budget && ['lt50', '50_100', '100_200'].includes(answers.budget) && (
            <LockSwitch checked={weightOf('budget', answers) === 'required'} onChange={() => flip('budget')}>Indispensable pour moi</LockSwitch>
          )}
          {budgetView && budgetView.brackets.length > 0 && (
            <div className="panel info budget-view" data-testid="budget-view">
              <strong>Où se situent les {budgetView.possible} programmes encore possibles</strong>
              <table className="mini">
                <thead><tr><th>Prix de départ (plus petit compte)</th><th>Programmes</th></tr></thead>
                <tbody>
                  {budgetView.brackets.map((b) => (
                    <tr key={b.id}>
                      <td>
                        {b.label}
                        <details>
                          <summary className="muted">voir les programmes</summary>
                          <ul>
                            {b.programs.map((x) => (
                              <li key={x.id}>
                                {x.name}
                                {x.price ? ` — ${x.price.currency === 'EUR' ? `${x.price.amount} €` : fmtUsd(x.price.amount)}${x.price.basis === 'observed' ? ' (prix observé, à vérifier)' : ' (prix confirmé)'}${x.price.partial ? ' · certaines tailles de compte sans prix relevé (le vrai prix de départ peut être plus bas)' : ''}` : ' — prix non confirmé'}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td>{b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="note">
                Chaque programme est compté une seule fois, à son prix de départ le plus bas : les comptes plus grands coûtent plus cher. Prix observés sur les sites officiels, indicatifs : <strong>Prix à vérifier</strong>. Les prix en euros ne sont pas convertis. {BASIS_TEXT}
              </p>
            </div>
          )}
        </>
      )}

      {current === 'steps' && (
        <>
        <p className="q-hint">C’est une préférence : les programmes d’un autre type restent visibles comme « alternatives proches ». Coche « indispensable » seulement si tu ne veux vraiment pas d’autre type.</p>
        <div className="options" role="radiogroup">
          {STEPS_OPTIONS.map((o) => (
            <Option
              key={o.id}
              selected={answers.steps === o.id}
              label={o.label}
              count={preview[o.id]}
              gloss={o.id === 'none' ? 'instant_funding' : null}
              onClick={() => set({ steps: o.id })}
            />
          ))}
        </div>
        {answers.steps && ['one', 'two', 'none'].includes(answers.steps) && (
          <LockSwitch checked={weightOf('steps', answers) === 'required'} onChange={() => flip('steps')}>Indispensable pour moi</LockSwitch>
        )}
        </>
      )}

      {current === 'priority' && (
        <>
          <p className="q-hint">Cette réponse sert à départager les programmes compatibles.</p>
          <div className="options" role="radiogroup">
            {PRIORITY_OPTIONS.map((o) => (
              <Option key={o.id} selected={answers.priority === o.id} label={o.label} onClick={() => set({ priority: o.id })} />
            ))}
          </div>
        </>
      )}

      {current === 'platform' && (
        <>
          <p className="q-hint">Choisis une ou plusieurs plateformes. Si tu ne sais pas encore, passe à la suite.</p>
          <div className="options">
            {dataset.platforms.map((p) => (
              <Option
                key={p.id}
                multi
                selected={answers.platforms.includes(p.id)}
                label={p.label}
                count={preview[p.id]}
                onClick={() => set({ platforms: toggle(answers.platforms, p.id) })}
              />
            ))}
          </div>
          {answers.platforms.length > 0 && (
            <LockSwitch checked={weightOf('platform', answers) === 'required'} onChange={() => flip('platform')}>Indispensable pour moi</LockSwitch>
          )}
        </>
      )}

      {current === 'residence' && (
        <>
          <p className="q-hint">
            Ta résidence détermine si tu es admissible à un programme. On te demande seulement ton pays (et ta province ou ton État si c'est utile) : jamais ton adresse.
            Elle n'est pas incluse dans les liens de partage.
          </p>
          <ResidencePicker value={answers.residence} countries={dataset.countries} onChange={(residence) => set({ residence })} />
        </>
      )}

      <div className="nav-row">
        <button className="btn ghost" type="button" onClick={back}>
          ← Précédent
        </button>
        <button className="btn primary" type="button" onClick={next} disabled={!valid}>
          {index >= steps.length - 1 ? 'Voir mes résultats' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}
