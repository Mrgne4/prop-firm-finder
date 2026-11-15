export const OFFICIAL_WARNING = "Vérifie les prix, les règles et ton admissibilité directement auprès de l’entreprise avant d’acheter un challenge."

/** Avertissement obligatoire, affiché AVANT tout lien vers le site d'une prop firm. */
export function OfficialWarning() {
  return (
    <p className="official-warning" role="note">
      <strong>⚠ {OFFICIAL_WARNING}</strong>
    </p>
  )
}
