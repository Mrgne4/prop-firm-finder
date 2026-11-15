import { useMemo, useState } from 'react'
import type { Residence } from '../engine/answers'
import { CA_PROVINCES, US_STATES } from '../quiz/steps'
import { countryName } from './format'
import { Option } from './Options'

type Choice = 'ca_qc' | 'ca_other' | 'FR' | 'BE' | 'CH' | 'US' | 'other'
const DIRECT = ['FR', 'BE', 'CH', 'US']

export function choiceOf(r: Residence): Choice | null {
  if (!r.country) return null
  if (r.country === 'CA') return r.region === 'QC' ? 'ca_qc' : 'ca_other'
  if (DIRECT.includes(r.country)) return r.country as Choice
  return 'other'
}

/**
 * Sélecteur de résidence : pays et, si utile, province / État.
 * Aucune adresse ni donnée personnelle. Rien n'est inclus dans les liens de partage.
 */
export function ResidencePicker({ value, countries, onChange }: { value: Residence; countries: string[]; onChange: (r: Residence) => void }) {
  // « Autre pays » doit rester sélectionné même tant qu'aucun pays n'a été choisi dans la liste.
  const [otherMode, setOtherMode] = useState(choiceOf(value) === 'other')
  const choice = otherMode && (value.country === null || choiceOf(value) === 'other') ? 'other' : choiceOf(value)
  const others = useMemo(
    () =>
      countries
        .filter((c) => c !== 'CA' && !DIRECT.includes(c))
        .map((c) => ({ code: c, name: countryName(c) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [countries],
  )
  const pick = (c: Choice) => {
    setOtherMode(c === 'other')
    if (c === 'ca_qc') onChange({ country: 'CA', region: 'QC' })
    else if (c === 'ca_other') onChange({ country: 'CA', region: null, notRegions: ['QC'] })
    else if (c === 'other') onChange({ country: value.country && choiceOf(value) === 'other' ? value.country : null, region: null })
    else onChange({ country: c, region: null })
  }

  return (
    <div className="options" role="radiogroup" aria-label="Pays de résidence">
      <Option selected={choice === 'ca_qc'} onClick={() => pick('ca_qc')} label="Canada — Québec" />
      <Option selected={choice === 'ca_other'} onClick={() => pick('ca_other')} label="Canada — Autres provinces">
        {choice === 'ca_other' && (
          <label className="sub-select">
            Province (facultatif)
            <select
              value={value.region ?? ''}
              onChange={(e) => onChange({ country: 'CA', region: e.target.value || null, notRegions: ['QC'] })}
            >
              <option value="">Je préfère ne pas préciser</option>
              {CA_PROVINCES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </Option>
      <Option selected={choice === 'FR'} onClick={() => pick('FR')} label="France" />
      <Option selected={choice === 'BE'} onClick={() => pick('BE')} label="Belgique" />
      <Option selected={choice === 'CH'} onClick={() => pick('CH')} label="Suisse" />
      <Option selected={choice === 'US'} onClick={() => pick('US')} label="États-Unis">
        {choice === 'US' && (
          <label className="sub-select">
            État (facultatif)
            <select value={value.region ?? ''} onChange={(e) => onChange({ country: 'US', region: e.target.value || null })}>
              <option value="">Je préfère ne pas préciser</option>
              {US_STATES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </Option>
      <Option selected={choice === 'other'} onClick={() => pick('other')} label="Autre pays">
        {choice === 'other' && (
          <label className="sub-select">
            Ton pays
            <select value={value.country ?? ''} onChange={(e) => onChange({ country: e.target.value || null, region: null })}>
              <option value="">Choisis un pays…</option>
              {others.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </Option>
    </div>
  )
}
