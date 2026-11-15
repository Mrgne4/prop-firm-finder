import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Contract } from '../data/schema'
import type { Answers, DrawdownPref } from '../engine/answers'
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
import { ResidencePicker } from '../ui/ResidencePicker'

export default function Quiz() {
  const { dataset, answers, setAnswers } = useApp()
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
            <Option key={o.id} selected={answers.style === o.id} label={o.label} help={o.help} onClick={() => set({ style: o.id })} />
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
                onClick={() =>
                  set({
                    when: o.id === 'none' ? (answers.when.includes('none') ? [] : ['none']) : toggle(answers.when.filter((w) => w !== 'none'), o.id),
                  })
                }
              />
            ))}
          </div>
        </>
      )}

      {current === 'drawdown' && (
        <>
          <p className="q-hint">Le drawdown est la perte maximale que ton compte peut subir avant d'être fermé.</p>
          <div className="options" role="radiogroup">
            {DRAWDOWN_OPTIONS.map((o) => (
              <Option key={o.id} selected={answers.drawdown === o.id} label={o.label} gloss={o.gloss} onClick={() => set({ drawdown: o.id as DrawdownPref })} />
            ))}
          </div>
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
          <div className="options" role="radiogroup">
            {BUDGET_OPTIONS.map((o) => (
              <Option key={o.id} selected={answers.budget === o.id} label={o.label} onClick={() => set({ budget: o.id })} />
            ))}
          </div>
          <p className="note">Montants en USD. {BASIS_TEXT}</p>
        </>
      )}

      {current === 'steps' && (
        <>
        <p className="q-hint">Si tu choisis un type précis, les programmes d'un autre type seront exclus. Choisis « Peu importe » pour tout voir.</p>
        <div className="options" role="radiogroup">
          {STEPS_OPTIONS.map((o) => (
            <Option
              key={o.id}
              selected={answers.steps === o.id}
              label={o.label}
              gloss={o.id === 'none' ? 'instant_funding' : null}
              onClick={() => set({ steps: o.id })}
            />
          ))}
        </div>
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
                onClick={() => set({ platforms: toggle(answers.platforms, p.id) })}
              />
            ))}
          </div>
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
