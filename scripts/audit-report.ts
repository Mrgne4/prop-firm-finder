// Mission 5 : registre automatique des informations non confirmées (champs essentiels) et des contradictions signalées.
import { writeFileSync } from 'node:fs'
import { validateRaw } from '../src/data/validate'
import { collectSourced } from '../src/data/sourced'
import { normPath } from '../src/engine/coverage'
import { readRawFromDisk } from './read-raw'

const { dataset } = validateRaw(readRawFromDisk(), new Date('2026-11-15T12:00:00Z'))
if (!dataset) throw new Error('données invalides')
const essential = new Set(dataset.scoring.essential_fields)
const lines: string[] = ['# Registre des informations non confirmées (champs essentiels)', '', 'Généré par `npx tsx scripts/audit-report.ts` — date de référence : 2026-11-15.', '']
let total = 0
for (const p of dataset.programs.filter((x) => !x.demo)) {
  const found = collectSourced(p)
  const gaps = new Map<string, number>()
  for (const f of found) {
    const np = normPath(f.path)
    if (essential.has(np) && f.sv.status === 'unconfirmed') gaps.set(np, (gaps.get(np) ?? 0) + 1)
  }
  const contra = (p.watch_points.value ?? []).filter((w) => w.includes('CONTRADICTION'))
  total += gaps.size
  lines.push(`## ${p.name} (\`${p.id}\`)`, `- Champs essentiels non confirmés : ${gaps.size === 0 ? 'aucun' : [...gaps.entries()].map(([k, n]) => `${k}${n > 1 ? ` ×${n}` : ''}`).join(', ')}`)
  for (const c of contra) lines.push(`- ⚠ ${c}`)
  lines.push('')
}
lines.push(`Total : ${total} lacunes de champs essentiels, tous programmes réels confondus.`)
writeFileSync('AUDIT-DONNEES.md', lines.join('\n') + '\n')
console.log(`Registre écrit : AUDIT-DONNEES.md (${total} lacunes)`)
