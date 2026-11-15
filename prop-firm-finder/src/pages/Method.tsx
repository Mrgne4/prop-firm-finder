import { useApp } from '../state/AppState'
import { partLabel, BASIS_TEXT } from '../engine/evaluate'
import { STATUS_META } from '../ui/ProgramCard'

export default function Method() {
  const { dataset } = useApp()
  const s = dataset.scoring
  return (
    <div className="page narrow prose">
      <h1>Méthodologie et transparence</h1>

      <h2>À quoi sert cet outil</h2>
      <p>Prop Firm Finder est un comparateur indépendant à vocation éducative. Il aide à repérer les programmes dont les règles officielles correspondent à ton profil. Ce n'est ni un classement des « meilleures » entreprises, ni un conseil financier.</p>

      <h2>Les trois statuts</h2>
      <ul>
        {(['COMPATIBLE', 'A_VERIFIER', 'INCOMPATIBLE'] as const).map((k) => (
          <li key={k}><strong>{STATUS_META[k].label}</strong> — {STATUS_META[k].blurb}</li>
        ))}
      </ul>
      <p>Une information inconnue n'est jamais une incompatibilité : elle donne « À VÉRIFIER ». Une règle « sous conditions » n'est jamais traitée comme « autorisée » tant que ses conditions n'ont pas été évaluées. Une entreprise dont l'admissibilité n'est pas confirmée n'est jamais présentée comme définitivement compatible.</p>
      <p>Les restrictions sont vérifiées séparément pour l'évaluation et pour le compte funded : une activité autorisée pendant le challenge mais interdite sur le compte funded ne rend pas le programme pleinement compatible.</p>

      <h2>Critères bloquants et préférences</h2>
      <p><strong>Bloquants :</strong> marchés (tous ceux que tu sélectionnes), pays de résidence, positions overnight et fin de semaine, trading pendant les annonces et session asiatique (si tu les coches), scalping (si c'est ton style), budget.{" Le type d'évaluation (une étape, deux étapes ou sans challenge) est bloquant quand tu en choisis un ; avec « Peu importe », rien n'est exclu."}</p>
      <p><strong>Préférences (score) :</strong> type de drawdown, coût, conditions de retrait, liberté de trading, plateforme.</p>
      <p>Tu peux assouplir certains critères bloquants sur la page de résultats pour voir les programmes « partiellement compatibles ». La résidence ne peut pas être assouplie.</p>

      <h2>Le score de correspondance</h2>
      <p>Le score indique uniquement dans quelle mesure un programme correspond à <em>tes préférences</em>. Il ne représente <strong>pas</strong> la probabilité de réussir le challenge, la fiabilité financière de l'entreprise, la probabilité de recevoir un retrait ni ta rentabilité future.</p>
      <p>Deux nombres sont toujours affichés : la <strong>correspondance</strong> (calculée sur les critères évaluables) et les <strong>informations vérifiées</strong> (part des données du programme confirmées et récentes). Le classement tient compte de l'incertitude : un critère inconnu rapporte 0 point, donc un programme mal documenté ne peut pas passer devant un programme complet grâce à une normalisation favorable.</p>
      <table className="mini">
        <thead><tr><th>Critère</th><th>Poids de base</th></tr></thead>
        <tbody>
          {Object.entries(s.weights).map(([k, w]) => <tr key={k}><td>{partLabel(k as never)}</td><td>{w}</td></tr>)}
        </tbody>
      </table>
      <p>Le critère que tu choisis comme priorité voit son poids multiplié par {s.priority_multiplier}. Ces pondérations sont dans <code>data/scoring.json</code> et se modifient sans toucher au code.</p>

      <h2>Budget et coûts</h2>
      <p>{BASIS_TEXT} Les frais conditionnels sont affichés mais jamais additionnés comme s'ils étaient certains. Les promotions temporaires sont identifiées à part et n'entrent ni dans le filtre budget, ni dans le score. Montants en USD.</p>

      <h2>Sources et fraîcheur</h2>
      <p>Chaque règle importante conserve sa valeur, sa source, sa date de vérification et son statut. Les valeurs doivent s'appuyer sur des sources officielles ; un comparateur tiers ne suffit jamais comme seule source. Si une information est introuvable, elle est marquée « Non confirmé ». Au-delà de {s.stale_after_days} jours sans revérification, une donnée passe en « Vérification nécessaire ». Ce seuil est un indicateur de maintenance, pas une garantie : les données ne sont pas actualisées en temps réel.</p>

      <h2>Affiliation</h2>
      <p>Aucun lien affilié n'est utilisé dans cette version. Si de tels liens sont ajoutés un jour, ils seront clairement identifiés et n'influenceront jamais le score ni le classement.</p>

      <h2>Vie privée</h2>
      <p>Aucun compte, aucun serveur : tes réponses et tes favoris restent dans ton navigateur. Le lien de partage contient uniquement tes critères de trading, jamais ton pays ni ta région. Ce site est public : toute personne qui en connaît l'adresse peut l'ouvrir.</p>
    </div>
  )
}
