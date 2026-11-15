import { validateRaw, type DataError, type RawData } from './validate'
import type { Dataset } from './schema'

/**
 * Charge toutes les données de /data au moment du build.
 * Pour mettre à jour une règle : modifier le JSON correspondant, c'est tout.
 * Les fichiers de programmes dont le nom commence par « _ » (gabarits) sont ignorés.
 */
const files = import.meta.glob('/data/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
const programFiles = import.meta.glob('/data/programs/[!_]*.json', { eager: true, import: 'default' }) as Record<string, unknown>

function build(): RawData {
  const f = (name: string) => files[`/data/${name}.json`]
  const programs: Record<string, unknown> = {}
  for (const [path, content] of Object.entries(programFiles)) programs[path.split('/').pop() as string] = content
  return {
    firms: f('firms'),
    sources: f('sources'),
    instruments: f('instruments'),
    markets: f('markets'),
    platforms: f('platforms'),
    glossary: f('glossary'),
    countries: f('countries'),
    scoring: f('scoring'),
    programs,
  }
}

type Obj = Record<string, unknown>
/**
 * Version destinée aux étudiants : retire TOUT ce qui est fictif (programmes, entreprises et sources de démonstration).
 * Appliquée par défaut au build de production ; `VITE_SHOW_DEMO=true` la désactive (revue interne seulement).
 */
export function studentView(raw: RawData): RawData {
  const isDemo = (x: unknown) => !!x && typeof x === 'object' && (x as Obj).demo === true
  const programs = Object.fromEntries(Object.entries(raw.programs as Record<string, unknown>).filter(([, v]) => !isDemo(v)))
  const demoFirms = new Set((Array.isArray(raw.firms) ? raw.firms : []).filter(isDemo).map((x) => (x as Obj).id))
  return {
    ...raw,
    programs,
    firms: (Array.isArray(raw.firms) ? raw.firms : []).filter((x) => !demoFirms.has((x as Obj).id)),
    sources: (Array.isArray(raw.sources) ? raw.sources : []).filter((x) => (x as Obj).type !== 'demo'),
  }
}
export const SHOW_DEMO = !import.meta.env.PROD || import.meta.env.VITE_SHOW_DEMO === 'true'

export type LoadResult = { dataset: Dataset | null; errors: DataError[] }

export function loadData(showDemo: boolean = SHOW_DEMO): LoadResult {
  const raw = build()
  const { dataset, errors } = validateRaw(showDemo ? raw : studentView(raw))
  return { dataset, errors }
}
