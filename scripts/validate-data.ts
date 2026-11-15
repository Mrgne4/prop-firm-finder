import { formatErrors, validateRaw } from '../src/data/validate'
import { readRawFromDisk } from './read-raw'

const { errors, dataset } = validateRaw(readRawFromDisk())
if (errors.length > 0 || !dataset) {
  console.error(`\n❌ Validation des données : ${errors.length} erreur(s)\n`)
  console.error(formatErrors(errors))
  console.error('\nCorrige les fichiers JSON dans /data puis relance « npm run validate ».\n')
  process.exit(1)
}
const demo = dataset.programs.filter((p) => p.demo).length
console.log(
  `✅ Données valides : ${dataset.firms.length} entreprise(s), ${dataset.programs.length} programme(s) ` +
    `(${demo} démo, ${dataset.programs.length - demo} réel(s)), ${dataset.sources.length} source(s).`,
)
