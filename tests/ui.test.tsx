import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { encodeShare } from '../src/engine/share'
import { ALPHA, BETA, GAMMA, NOW, ds, profile } from './helpers'

function open(hash = '#/') {
  window.location.hash = hash
  return render(<App dataset={ds} errors={[]} now={NOW} />)
}

async function answerQuiz(user: ReturnType<typeof userEvent.setup>, opts: { markets?: string[]; residence?: string } = {}) {
  const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
  await user.click(screen.getByRole('link', { name: 'TROUVER MA PROP FIRM' }))
  for (const m of opts.markets ?? ['Futures sur indices']) await user.click(screen.getByRole('checkbox', { name: new RegExp(m) }))
  await next()
  await user.click(screen.getByRole('radio', { name: opts.residence ?? 'Canada — Québec' })) // résidence : 3ᵉ question
  await next()
  await next() // instruments précis : facultatif
  await user.click(screen.getByRole('radio', { name: /Day trading/ }))
  await next()
  await user.click(screen.getByRole('checkbox', { name: /heures normales/ }))
  await next()
  await user.click(screen.getByRole('radio', { name: "Jusqu'à 100 $" }))
  await next()
  await user.click(screen.getByRole('radio', { name: 'Peu importe' }))
  await next()
  await user.click(screen.getByRole('radio', { name: 'Aucune préférence' }))
  await next()
  await user.click(screen.getByRole('radio', { name: 'Coût total faible' }))
  await user.click(screen.getByRole('button', { name: /Voir mes résultats/ }))
}

/** Questions de base jusqu'au budget (marché + résidence + instruments + style + horaires). */
async function toBudget(user: ReturnType<typeof userEvent.setup>) {
  const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
  await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ }))
  await next()
  await user.click(screen.getByRole('radio', { name: 'Canada — Québec' }))
  await next()
  await next()
  await user.click(screen.getByRole('radio', { name: /Day trading/ }))
  await next()
  await user.click(screen.getByRole('checkbox', { name: /Je n'ai pas de préférence/ }))
  await next()
}

describe('Accueil', () => {
  it('affiche le titre, le sous-titre, les deux boutons et la mention', () => {
    open()
    expect(screen.getByRole('heading', { level: 1, name: 'TROUVE LA PROP FIRM ADAPTÉE À TON TRADING' })).toBeInTheDocument()
    expect(screen.getByText(/Réponds à quelques questions et découvre les programmes compatibles/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TROUVER MA PROP FIRM' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'EXPLORER TOUTES LES PROP FIRMS' })).toBeInTheDocument()
    expect(screen.getAllByText(/Comparateur indépendant à vocation éducative. Les conditions des entreprises peuvent évoluer./).length).toBeGreaterThan(0)
  })
  it('signale que les programmes sont des démonstrations fictives', () => {
    open()
    expect(screen.getByRole('note')).toHaveTextContent('démonstrations fictives')
  })
})

describe('Questionnaire', () => {
  it('parcourt les 8 questions et mène aux résultats', async () => {
    const user = userEvent.setup()
    open()
    await answerQuiz(user)
    expect(await screen.findByRole('heading', { level: 1, name: /VOICI LES PROGRAMMES QUI CORRESPONDENT À TON PROFIL/ })).toBeInTheDocument()
  })

  it('affiche une barre de progression et empêche d’avancer sans réponse', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText(/Question 1 sur \d+/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /Forex/ }))
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeEnabled()
  })

  it('revenir à la question précédente conserve les réponses', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ }))
    await next()
    await user.click(screen.getByRole('radio', { name: 'Canada — Québec' }))
    await next()
    await next()
    await user.click(screen.getByRole('radio', { name: /Swing trading/ }))
    await user.click(screen.getByRole('button', { name: /Précédent/ }))
    await user.click(screen.getByRole('button', { name: /Précédent/ }))
    await user.click(screen.getByRole('button', { name: /Précédent/ }))
    expect(screen.getByRole('checkbox', { name: /Futures sur indices/ })).toBeChecked()
    await next()
    expect(screen.getByRole('radio', { name: 'Canada — Québec' })).toBeChecked()
    await next()
    await next()
    expect(screen.getByRole('radio', { name: /Swing trading/ })).toBeChecked()
  })

  it('propose la sous-question futures / CFD pour l’or', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    await user.click(screen.getByRole('checkbox', { name: /Or et métaux précieux/ }))
    await user.click(screen.getByRole('button', { name: /Suivant/ }))
    expect(screen.getByRole('heading', { name: 'Sous quelle forme ?' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Contrats futures' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'CFD' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled()
  })

  it('pas de sous-question pour les futures sur indices (le forex en propose une : devises au comptant ou futures)', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ }))
    await user.click(screen.getByRole('button', { name: /Suivant/ }))
    expect(screen.queryByRole('heading', { name: 'Sous quelle forme ?' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Où résides-tu/ })).toBeInTheDocument() // résidence en 3ᵉ position
    await user.click(screen.getByRole('radio', { name: 'Canada — Québec' }))
    await user.click(screen.getByRole('button', { name: /Suivant/ }))
    expect(screen.getByRole('heading', { name: /instruments précis/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Suivant/ }))
    expect(screen.getByRole('heading', { name: /style de trading/ })).toBeInTheDocument()
  })

  it('le drawdown propose une explication chiffrée sans présenter l’EOD comme une autorisation de dépasser la limite', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    await toBudget(user)
    const nx = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('radio', { name: 'Aucun budget défini' }))
    await nx()
    await user.click(screen.getByRole('radio', { name: 'Peu importe' }))
    await nx()
    await user.click(screen.getByRole('button', { name: 'Explication : End-of-Day Trailing' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Exemple chiffré/)).toBeInTheDocument()
    expect(dialog).toHaveTextContent(/ne t'autorise pas à dépasser la limite pendant la séance/)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('« Autre pays » propose une liste de pays', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ }))
    await user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('radio', { name: 'Autre pays' }))
    expect(screen.getByRole('combobox', { name: /Ton pays/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled()
  })

  it('la priorité « plateforme » ajoute la question de la plateforme', async () => {
    const user = userEvent.setup()
    open('#/questionnaire')
    await toBudget(user)
    const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('radio', { name: 'Aucun budget défini' })); await next()
    await user.click(screen.getByRole('radio', { name: 'Peu importe' })); await next()
    await user.click(screen.getByRole('radio', { name: 'Aucune préférence' })); await next()
    await user.click(screen.getByRole('radio', { name: /Compatibilité avec ma plateforme/ })); await next()
    expect(screen.getByRole('heading', { name: 'Quelle plateforme utilises-tu ?' })).toBeInTheDocument()
  })
})

describe('Résultats', () => {
  it('affiche les trois statuts selon les réponses', async () => {
    const user = userEvent.setup()
    open()
    await answerQuiz(user)
    const alpha = await screen.findByTestId(`card-${ALPHA}`)
    expect(within(alpha).getByText('COMPATIBLE')).toBeInTheDocument()
    const beta = screen.getByTestId(`card-${BETA}`)
    expect(within(beta).getByText('À VÉRIFIER')).toBeInTheDocument()
    expect(within(beta).getAllByText(/Vérification nécessaire/).length).toBeGreaterThan(0)
    // Gamma est dans la section « Incompatibles », repliée par défaut mais présente
    const gamma = screen.getByTestId(`card-${GAMMA}`)
    expect(within(gamma).getByText('INCOMPATIBLE')).toBeInTheDocument()
    expect(within(gamma).getByText(/Aucun de tes marchés n'est disponible/)).toBeInTheDocument()
  })

  it('chaque carte affiche le contenu demandé et marque les démos', async () => {
    const user = userEvent.setup()
    open()
    await answerQuiz(user)
    const alpha = await screen.findByTestId(`card-${ALPHA}`)
    for (const t of ['Marchés disponibles', 'Taille du compte', 'Type de drawdown', 'Objectif de profit', 'Coût', 'Principales restrictions']) {
      expect(within(alpha).getByText(t, { selector: 'dt' })).toBeInTheDocument()
    }
    expect(within(alpha).getByText(/Dernière vérification/)).toBeInTheDocument()
    expect(within(alpha).getByText(/DÉMO — programme fictif/)).toBeInTheDocument()
    expect(within(alpha).getByText(/Correspondance :/)).toBeInTheDocument()
    expect(within(alpha).getByText(/Informations essentielles : \d+ %/)).toBeInTheDocument()
    expect(within(alpha).getByRole('link', { name: 'Voir les détails' })).toBeInTheDocument()
    expect(within(alpha).getByRole('button', { name: 'Comparer' })).toBeInTheDocument()
    expect(within(alpha).getByText(/Site officiel/)).toBeInTheDocument()
  })

  it('le bouton « Modifier mes réponses » ramène au questionnaire', async () => {
    const user = userEvent.setup()
    open()
    await answerQuiz(user)
    await user.click(await screen.findByRole('link', { name: /Modifier mes réponses/ }))
    expect(screen.getByRole('heading', { name: /Quels marchés/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Futures sur indices/ })).toBeChecked()
  })

  it('aucun programme compatible : liste les critères responsables, sans proposer une entreprise artificiellement', async () => {
    const token = encodeShare({ answers: profile({ markets: ['stocks'], marketForms: { stocks: 'spot' } }) })
    open(`#/resultats?r=${token}`)
    const user = userEvent.setup()
    await user.click(within(await screen.findByRole('region', { name: 'Résidence manquante' })).getByRole('radio', { name: 'Canada — Québec' }))
    const panel = await screen.findByRole('region', { name: 'Aucune correspondance' })
    expect(within(panel).getByText(/Aucun programme ne remplit tous tes critères/)).toBeInTheDocument()
    expect(within(screen.getByTestId('incompatibles')).getByText(/3 écartés : Ne proposent pas les marchés choisis/)).toBeInTheDocument()
    expect(screen.queryByText('COMPATIBLE', { selector: '.badge' })).not.toBeInTheDocument()
  })

  it('lien de partage : restaure les critères mais demande la résidence', async () => {
    const token = encodeShare({ answers: profile() })
    open(`#/resultats?r=${token}`)
    expect(await screen.findByRole('heading', { name: /VOICI LES PROGRAMMES/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Résidence manquante' })).toBeInTheDocument()
    // sans résidence, aucun programme n'est confirmé compatible
    // sans résidence, aucune carte n'est « compatible » (au mieux « à vérifier »)
    expect(screen.queryByText('COMPATIBLE', { selector: '.badge' })).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(within(screen.getByRole('region', { name: 'Résidence manquante' })).getByRole('radio', { name: 'Canada — Québec' }))
    expect(within(await screen.findByTestId(`card-${ALPHA}`)).getByText('COMPATIBLE')).toBeInTheDocument()
  })

  it('rendre une restriction « souhaitable » fait apparaître des alternatives proches, jamais des correspondances', async () => {
    const answers = profile({ when: ['overnight'] })
    const token = encodeShare({ answers })
    open(`#/resultats?r=${token}`)
    const user = userEvent.setup()
    await user.click(within(await screen.findByRole('region', { name: 'Résidence manquante' })).getByRole('radio', { name: 'Canada — Québec' }))
    expect(screen.queryByRole('region', { name: /B\. Alternatives proches/ })).not.toBeInTheDocument()
    await user.click(await screen.findByText(/Ajuster mes critères/))
    await user.click(screen.getByRole('button', { name: /Indispensable/ }))
    const alt = await screen.findByRole('region', { name: /B\. Alternatives proches/ })
    expect(within(alt).getAllByText(/Ajustement/).length).toBeGreaterThan(0)
    expect(screen.queryByText('COMPATIBLE', { selector: '.badge' })).not.toBeInTheDocument()
  })
})

describe('Comparateur, fiches, explorer, favoris', () => {
  it('compare jusqu’à trois programmes en colonnes, évaluation et funded séparés', async () => {
    const user = userEvent.setup()
    open('#/explorer')
    for (const id of [ALPHA, BETA, GAMMA]) {
      await user.click(within(screen.getByTestId(`card-${id}`)).getByRole('button', { name: 'Comparer' }))
    }
    expect(within(screen.getByTestId(`card-${ALPHA}`)).getByRole('button', { name: /Dans la comparaison/ })).toBeInTheDocument()
    await user.click(screen.getAllByRole('link', { name: /Comparer/ })[0])
    const table = await screen.findByRole('table', { name: 'Comparaison des programmes' })
    expect(within(table.querySelector('thead') as HTMLElement).getAllByRole('columnheader')).toHaveLength(4)
    const sections = [...table.querySelectorAll('th[scope=colgroup]')].map((th) => th.textContent ?? '')
    for (const t of ['Informations générales', 'Évaluation (challenge)', 'Restrictions', 'Frais', 'Compte funded']) {
      expect(sections.some((x) => x.startsWith(t))).toBe(true)
    }
    expect(within(table).getByText('Safety Net')).toBeInTheDocument()
    expect(within(table).getAllByText(/Non confirmé/).length).toBeGreaterThan(0)
  })

  it('limite la comparaison à trois programmes', async () => {
    window.location.hash = `#/comparer?p=${ALPHA},${BETA},${GAMMA}`
    render(<App dataset={ds} errors={[]} now={NOW} />)
    expect(await screen.findByRole('table', { name: 'Comparaison des programmes' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Ajouter un programme')).not.toBeInTheDocument()
  })

  it('la fiche détaillée contient les 12 sections', async () => {
    open(`#/programme/${ALPHA}`)
    const titles = [
      'Présentation de l’entreprise', 'Description du programme', 'Instruments disponibles', 'Fonctionnement du challenge',
      'Explication du drawdown', 'Restrictions de trading', 'Conditions du compte funded', 'Retraits', 'Frais',
      'Points à surveiller', 'Sources officielles', 'Date de vérification',
    ]
    for (const t of titles) expect(await screen.findByRole('heading', { level: 2, name: new RegExp(t) })).toBeInTheDocument()
    expect(screen.getByText(/Promotions observées/)).toBeInTheDocument()
  })

  it('fiche d’un programme inconnu', () => {
    open('#/programme/nexiste-pas')
    expect(screen.getByRole('heading', { name: 'Programme introuvable' })).toBeInTheDocument()
  })

  it('explorer : recherche par nom', async () => {
    const user = userEvent.setup()
    open('#/explorer')
    expect(screen.getByText(/3 programmes affichés/)).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: /Recherche par nom/ }), 'gamma')
    expect(screen.getByText(/1 programme affiché/)).toBeInTheDocument()
    expect(screen.getByTestId(`card-${GAMMA}`)).toBeInTheDocument()
  })

  it('explorer : filtres manuels sans questionnaire (marché futures)', async () => {
    const user = userEvent.setup()
    open('#/explorer')
    await user.selectOptions(screen.getByLabelText('Marché'), 'futures_index')
    expect(screen.queryByTestId(`card-${GAMMA}`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`card-${ALPHA}`)).toBeInTheDocument()
  })

  it('favoris : sauvegarde locale', async () => {
    const user = userEvent.setup()
    open('#/explorer')
    await user.click(within(screen.getByTestId(`card-${ALPHA}`)).getByRole('button', { name: 'Ajouter aux favoris' }))
    expect(JSON.parse(window.localStorage.getItem('pff.favorites.v1') as string).ids).toEqual([ALPHA])
    await user.click(screen.getByRole('link', { name: /Favoris/ }))
    expect(await screen.findByTestId(`card-${ALPHA}`)).toBeInTheDocument()
  })

  it('la page méthodologie décrit ce que le score ne mesure pas', () => {
    open('#/methode')
    expect(screen.getByText(/Il ne représente/)).toBeInTheDocument()
    expect(screen.getByText(/Aucun lien affilié/)).toBeInTheDocument()
  })
})

describe('Données invalides', () => {
  it('affiche les erreurs plutôt que de planter', () => {
    render(<App dataset={null} errors={[{ file: 'programs/x.json', path: 'id', message: 'Test' }]} />)
    expect(screen.getByRole('heading', { name: 'Données invalides' })).toBeInTheDocument()
    expect(screen.getByText(/programs\/x.json/)).toBeInTheDocument()
  })
})
