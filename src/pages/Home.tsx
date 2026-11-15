import { Link } from 'react-router-dom'
import { useApp } from '../state/AppState'

export default function Home() {
  const { answers } = useApp()
  const hasAnswers = answers.markets.length > 0
  return (
    <div className="page hero">
      <h1 className="hero-title">TROUVE LA PROP FIRM ADAPTÉE À TON TRADING</h1>
      <p className="hero-sub">
        Réponds à quelques questions et découvre les programmes compatibles avec ton style de trading, tes marchés et tes préférences.
      </p>
      <div className="hero-actions">
        <Link className="btn primary big" to="/questionnaire">TROUVER MA PROP FIRM</Link>
        <Link className="btn secondary big" to="/explorer">EXPLORER TOUTES LES PROP FIRMS</Link>
      </div>
      {hasAnswers && (
        <p className="muted">
          Tu as déjà des réponses enregistrées sur cet appareil. <Link to="/resultats">Revoir mes résultats</Link>
        </p>
      )}
      <p className="disclaimer">Comparateur indépendant à vocation éducative. Les conditions des entreprises peuvent évoluer.</p>
      <ul className="hero-points">
        <li><strong>Pas un classement.</strong> Un outil d'aide à la décision fondé sur les règles officielles.</li>
        <li><strong>Transparent.</strong> Chaque règle a une source et une date de vérification ; ce qui est inconnu est signalé « Non confirmé ».</li>
        <li><strong>Sans compte.</strong> Rien n'est envoyé : tes réponses restent dans ton navigateur.</li>
      </ul>
    </div>
  )
}
