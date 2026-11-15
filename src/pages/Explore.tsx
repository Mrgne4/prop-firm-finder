import { useMemo, useState } from 'react'
import { cheapestVariant, computeVariantCosts } from '../engine/evaluate'
import { useApp } from '../state/AppState'
import { DRAWDOWN_LABEL } from '../ui/format'
import { ProgramCard } from '../ui/ProgramCard'

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function Explore() {
  const { dataset, ctx } = useApp()
  const [q, setQ] = useState('')
  const [market, setMarket] = useState('')
  const [steps, setSteps] = useState('')
  const [dd, setDd] = useState('')
  const [budget, setBudget] = useState('')

  const list = useMemo(() => {
    const cap = budget ? dataset.scoring.budget_caps_usd[budget as keyof typeof dataset.scoring.budget_caps_usd] : null
    return dataset.programs.filter((p) => {
      const firm = dataset.firms.find((f) => f.id === p.firm_id)
      if (q && !norm(`${firm?.name ?? ''} ${p.name}`).includes(norm(q))) return false
      // Un filtre ne cache jamais une donnée simplement parce qu'elle est inconnue : le programme reste visible (« Non confirmé »).
      if (market && p.instruments.status === 'confirmed' && !p.instruments.value?.some((i) => dataset.instruments.find((x) => x.id === i)?.market === market)) return false
      if (steps && p.evaluation.steps.status === 'confirmed') {
        const want = steps === 'one' ? 1 : steps === 'two' ? 2 : 0
        if (p.evaluation.steps.value !== want) return false
      }
      if (dd) {
        const types = [p.evaluation.drawdown_type, p.funded.drawdown_type].filter((s) => s.status === 'confirmed').map((s) => s.value)
        if (types.length > 0 && !types.includes(dd as never)) return false
      }
      if (budget && cap !== null) {
        const cheap = cheapestVariant(computeVariantCosts(p, ctx))
        if (cheap && cheap.lowerBound !== null && cheap.lowerBound > cap) return false
      }
      return true
    })
  }, [dataset, ctx, q, market, steps, dd, budget])

  const reset = () => {
    setQ(''); setMarket(''); setSteps(''); setDd(''); setBudget('')
  }

  return (
    <div className="page">
      <h1>Explorer toutes les prop firms</h1>
      <p className="lead">Filtre directement les programmes, sans passer par le questionnaire. Ici, aucun score de compatibilité : seulement les règles.</p>
      <div className="filters" role="search">
        <label>
          Recherche par nom
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom d'une prop firm ou d'un programme" />
        </label>
        <label>
          Marché
          <select value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="">Tous</option>
            {dataset.markets.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label>
          Évaluation
          <select value={steps} onChange={(e) => setSteps(e.target.value)}>
            <option value="">Toutes</option>
            <option value="one">Une étape</option>
            <option value="two">Deux étapes</option>
            <option value="none">Sans challenge</option>
          </select>
        </label>
        <label>
          Drawdown
          <select value={dd} onChange={(e) => setDd(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(DRAWDOWN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          Budget de départ (max.)
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">Aucune limite</option>
            <option value="lt50">Moins de 50 $</option>
            <option value="50_100">Jusqu'à 100 $</option>
            <option value="100_200">Jusqu'à 200 $</option>
          </select>
        </label>
        <button className="btn ghost" type="button" onClick={reset}>Réinitialiser</button>
      </div>
      <p className="muted" role="status">{list.length} programme{list.length > 1 ? 's' : ''} affiché{list.length > 1 ? 's' : ''}. Un programme dont une information est « Non confirmé » reste affiché.</p>
      <div className="grid">
        {list.map((p) => <ProgramCard key={p.id} program={p} ds={dataset} />)}
      </div>
      {list.length === 0 && <section className="panel info"><p>Aucun programme ne correspond à ces filtres.</p></section>}
    </div>
  )
}
