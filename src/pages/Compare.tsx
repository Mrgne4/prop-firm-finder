import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { evaluateProgram } from '../engine/evaluate'
import { MAX_COMPARE, colKey, parseColKey, useApp } from '../state/AppState'
import { variantName } from '../ui/format'
import { Info } from '../ui/Glossary'
import { compareSections, type Col } from '../ui/rows'

export default function Compare() {
  const { dataset, ctx, answers, compare, setCompare } = useApp()
  const [params] = useSearchParams()

  // Lien direct ?p=programme:variante,… (ou programme seul) : on initialise la sélection si elle est vide.
  useEffect(() => {
    const p = params.get('p')
    if (compare.length === 0 && p) {
      setCompare(p.split(',').filter((k) => dataset.programs.some((x) => x.id === parseColKey(k).programId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasProfile = answers.markets.length > 0
  const changeVariant = (key: string, variantId: string) => {
    const { programId } = parseColKey(key)
    setCompare(compare.map((k) => (k === key ? colKey(programId, variantId) : k)))
  }
  const sections = useMemo(() => compareSections(dataset, ctx, changeVariant, hasProfile), [dataset, ctx, hasProfile, compare]) // eslint-disable-line react-hooks/exhaustive-deps

  // Chaque colonne = (programme, taille de compte), évaluée avec ses propres frais et règles.
  const cols: Col[] = compare.flatMap((key) => {
    const { programId, variantId } = parseColKey(key)
    const p = dataset.programs.find((x) => x.id === programId)
    if (!p) return []
    const evaluation = evaluateProgram(p, answers, ctx)
    const ev = evaluation.variants.find((x) => x.variantId === (variantId ?? evaluation.recommendedVariantId)) ?? evaluation.variants[0]
    const v = p.variants.find((x) => x.id === ev.variantId)!
    return [{ key: colKey(p.id, v.id), p, firm: dataset.firms.find((f) => f.id === p.firm_id), v, cost: ev.cost, ev }]
  })

  // Toute taille de compte de tout programme peut être ajoutée comme colonne distincte.
  const available = dataset.programs.flatMap((p) => p.variants.map((v) => ({ key: colKey(p.id, v.id), label: `${p.name} — compte de ${variantName(v)}` }))).filter((o) => !compare.includes(o.key))

  return (
    <div className="page wide">
      <h1>Comparateur</h1>
      <p className="lead">
        Compare jusqu'à {MAX_COMPARE} colonnes côte à côte. Une colonne = un programme et une taille de compte : tu peux comparer plusieurs tailles du même programme. Les règles de l'évaluation et celles du compte funded sont toujours séparées.
      </p>

      {cols.length < MAX_COMPARE && available.length > 0 && (
        <label className="sub-select inline">
          Ajouter un programme et une taille de compte
          <select value="" onChange={(e) => e.target.value && setCompare([...compare, e.target.value])}>
            <option value="">Choisis…</option>
            {available.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {cols.length === 0 ? (
        <section className="panel info">
          <p>Aucun programme sélectionné. Utilise le bouton « Comparer » sur une carte, ou ajoute une colonne ci-dessus.</p>
          <Link className="btn primary" to="/explorer">Explorer les prop firms</Link>
        </section>
      ) : (
        <div className="table-wrap">
          <table className="compare" aria-label="Comparaison des programmes">
            <thead>
              <tr>
                <th scope="col" className="sticky-col">Critère</th>
                {cols.map((c) => (
                  <th key={c.key} scope="col">
                    <Link to={`/programme/${c.p.id}`}>{c.p.name}</Link>
                    <span className="col-size"> · {variantName(c.v)}</span>
                    <button type="button" className="link-btn" onClick={() => setCompare(compare.filter((k) => k !== c.key))} aria-label={`Retirer ${c.p.name} ${variantName(c.v)}`}>
                      Retirer ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            {sections.map((s) => (
              <tbody key={s.title}>
                <tr className="section-row">
                  <th colSpan={cols.length + 1} scope="colgroup">
                    {s.title}
                    {s.note && <span className="section-note"> — {s.note}</span>}
                  </th>
                </tr>
                {s.rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="sticky-col">
                      {r.label}
                      {r.info && <Info ids={r.info} label={`Explication : ${r.label}`} />}
                    </th>
                    {cols.map((c) => (
                      <td key={c.key}>{r.cell(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
      <p className="disclaimer">Les données ne sont pas actualisées en temps réel. Confirme toujours les règles sur le site officiel.</p>
    </div>
  )
}
