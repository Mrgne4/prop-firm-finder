import { Link } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { ProgramCard } from '../ui/ProgramCard'

export default function Favorites() {
  const { dataset, favorites } = useApp()
  const progs = favorites.map((id) => dataset.programs.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)
  return (
    <div className="page">
      <h1>Mes favoris</h1>
      <p className="lead">Enregistrés uniquement sur cet appareil, dans ton navigateur. Aucun compte n'est nécessaire.</p>
      {progs.length === 0 ? (
        <section className="panel info">
          <p>Tu n'as pas encore de favori. Clique sur ☆ sur la carte d'un programme pour l'ajouter.</p>
          <Link className="btn primary" to="/explorer">Explorer les prop firms</Link>
        </section>
      ) : (
        <div className="grid">{progs.map((p) => <ProgramCard key={p.id} program={p} ds={dataset} />)}</div>
      )}
    </div>
  )
}
