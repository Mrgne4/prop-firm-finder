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

      <h2>Les statuts affichés sur les cartes</h2>
      <ul>
        {(['COMPATIBLE', 'A_VERIFIER', 'PARTIEL', 'INCOMPATIBLE'] as const).map((k) => (
          <li key={k}><strong>{STATUS_META[k].label}</strong> — {STATUS_META[k].blurb}</li>
        ))}
      </ul>
      <p>Une information inconnue n'est jamais une incompatibilité : elle donne « À VÉRIFIER ». Une règle « sous conditions » n'est jamais traitée comme « autorisée » tant que ses conditions n'ont pas été évaluées. Une entreprise dont l'admissibilité n'est pas confirmée n'est jamais présentée comme définitivement compatible.</p>
      <p>Les restrictions sont vérifiées séparément pour l'évaluation et pour le compte funded : une activité autorisée pendant le challenge mais interdite sur le compte funded ne rend pas le programme pleinement compatible.</p>

      <h2>Trois catégories de résultats</h2>
      <ul>
        <li><strong>A. Correspondances potentielles</strong> — aucune incompatibilité confirmée avec tes critères. Les points inconnus sont listés « à vérifier ».</li>
        <li><strong>B. Alternatives proches</strong> — aucune contrainte indispensable en échec, mais au moins une préférence n'est pas satisfaite. L'ajustement nécessaire est indiqué. Ce ne sont pas des correspondances.</li>
        <li><strong>C. Incompatibles</strong> — au moins un critère indispensable est en échec de façon confirmée (par exemple une exclusion géographique confirmée ou une restriction qui interdit ce que tu veux faire).</li>
      </ul>
      <h2>Indispensable ou souhaitable</h2>
      <p><strong>Toujours indispensables :</strong> marché, instruments précis, pays de résidence. <strong>Indispensables par défaut (modifiables) :</strong> restrictions de trading que tu as cochées (nuit, fin de semaine, annonces, session asiatique, scalping). <strong>Souhaitables par défaut :</strong> budget, type d'évaluation, type de drawdown, plateforme. Tu peux déclarer l'un d'eux indispensable, ou rendre souhaitable une restriction. L'outil ne change jamais un critère indispensable de lui-même.</p>
      <p>Un critère n'écarte un programme que si l'échec est <strong>confirmé</strong>. Un prix seulement observé sur le site officiel reste « à vérifier » : il ne confirme ni ne rejette jamais ton budget. Si un critère indispensable empêche tout résultat, l'outil peut te suggérer un changement de stratégie, présenté séparément et jamais comme un programme compatible.</p>
      <h2>Comment on compte</h2>
      <p>L'unité est le <strong>programme</strong> : une offre d'une entreprise (par exemple un type de challenge), quel que soit le nombre de tailles de compte. Chaque programme n'est compté qu'une fois, dans une seule catégorie. Les alternatives sont comptées à part et n'augmentent jamais le nombre de programmes possibles.</p>

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
