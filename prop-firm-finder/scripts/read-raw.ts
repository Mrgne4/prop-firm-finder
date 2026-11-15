import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RawData } from '../src/data/validate'

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

/** Lit tous les fichiers de /data (les fichiers de programmes commençant par « _ » sont ignorés). */
export function readRawFromDisk(root = DEFAULT_ROOT): RawData {
  const read = (rel: string): unknown => {
    try {
      return JSON.parse(readFileSync(join(root, rel), 'utf8'))
    } catch (e) {
      throw new Error(`Impossible de lire data/${rel} : ${(e as Error).message}`)
    }
  }
  const programs: Record<string, unknown> = {}
  for (const f of readdirSync(join(root, 'programs'))) {
    if (f.endsWith('.json') && !f.startsWith('_')) programs[f] = read(`programs/${f}`)
  }
  return {
    firms: read('firms.json'),
    sources: read('sources.json'),
    instruments: read('instruments.json'),
    markets: read('markets.json'),
    platforms: read('platforms.json'),
    glossary: read('glossary.json'),
    countries: read('countries.json'),
    scoring: read('scoring.json'),
    programs,
  }
}
