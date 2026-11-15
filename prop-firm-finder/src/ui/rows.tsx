import { withdrawalDisclosure } from '../engine/withdrawals'
import type { ReactNode } from 'react'
import type { Dataset, Firm, Program, Sourced, Variant } from '../data/schema'
import { BASIS_TEXT, type EngineContext, type VariantCost, type VariantEvaluation } from '../engine/evaluate'
import { eligibilityText, DRAWDOWN_GLOSSARY, DRAWDOWN_LABEL, NATURE_TEXT, RESTRICTION_NAME, countryName, fmtUsd, marketLabelsOf, restrictionSummary, stepsText, sv, variantName } from './format'
import { Info } from './Glossary'
import { StatusBadge } from './ProgramCard'

/** Une colonne = un programme ET une taille de compte (variante), évaluées individuellement. */
export type Col = { key: string; p: Program; firm?: Firm; v: Variant; cost: VariantCost | null; ev: VariantEvaluation }
export type Row = { label: string; info?: string[]; cell: (c: Col) => ReactNode }
export type Section = { title: string; note?: string; rows: Row[] }

/** Formateurs qui affichent toujours « Non confirmé » ou « à revérifier » plutôt qu'une valeur par défaut. */
export function formatters(ctx: EngineContext) {
  const o = { now: ctx.now, staleDays: ctx.scoring.stale_after_days }
  return {
    usd: (s: Sourced<number>, na = 'Sans objet') => sv(s, fmtUsd, { ...o, na }),
    pct: (s: Sourced<number>) => sv(s, (n) => `${n} %`, o),
    num: (s: Sourced<number>, na = 'Sans objet') => sv(s, (n) => String(n), { ...o, na }),
    dd: (s: Sourced<string>) => sv(s, (x) => DRAWDOWN_LABEL[x] ?? x, { ...o, na: 'Sans objet' }),
    text: (s: Sourced<string>) => sv(s, (x) => x, o),
    list: (s: Sourced<string[]>, map: (x: string) => string = (x) => x) => sv(s, (x) => x.map(map).join(', '), o),
  }
}

const stack = (a: ReactNode, b: ReactNode) => (
  <>
    <span className="scope">Évaluation :</span> {a}
    <br />
    <span className="scope">Funded :</span> {b}
  </>
)

export function compareSections(ds: Dataset, ctx: EngineContext, onVariant: (colKey: string, variantId: string) => void, hasProfile: boolean): Section[] {
  const F = formatters(ctx)
  const platformName = (id: string) => ds.platforms.find((p) => p.id === id)?.label ?? id
  const restr = (key: keyof typeof RESTRICTION_NAME): Row => ({
    label: RESTRICTION_NAME[key],
    cell: (c) => {
      const r = restrictionSummary(c.p, key)
      return stack(r.evaluation, r.funded)
    },
  })
  const profile: Section[] = hasProfile
    ? [
        {
          title: 'Pour ton profil',
          note: 'Chaque colonne est évaluée avec les frais et les règles de SA taille de compte.',
          rows: [
            { label: 'Statut', cell: (c) => <StatusBadge status={c.ev.status} /> },
            {
              label: 'Raisons',
              cell: (c) => (
                <ul className="reasons">
                  {c.ev.criteria.map((k) => (
                    <li key={k.key} className={`r-${k.state}${k.relaxed ? ' relaxed' : ''}`}>
                      <span className="r-icon" aria-hidden="true">{k.state === 'ok' ? '✓' : k.state === 'fail' ? '✕' : '!'}</span>
                      <span><strong>{k.label}.</strong> {k.message}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
          ],
        },
      ]
    : []
  const reliability: Section = {
    title: 'Fiabilité des informations',
    note: 'Les informations essentielles (admissibilité, marchés, drawdown, restrictions clés, prix, retraits) sont comptées à part des secondaires.',
    rows: [
      {
        label: 'Informations essentielles',
        cell: (c) => (
          <>
            <strong>{Math.round(c.ev.coverage.essential.pct)} %</strong>
            {c.ev.coverage.essential.problems.length > 0 && (
              <p className="gap" role="alert">
                ⚠ Informations critiques {c.ev.coverage.gaps.length > 0 ? 'manquantes' : 'à revérifier'} : {c.ev.coverage.essential.problems.map((x) => x.label).join(', ')}
              </p>
            )}
          </>
        ),
      },
      { label: 'Informations secondaires', cell: (c) => `${Math.round(c.ev.coverage.secondary.pct)} %${c.ev.coverage.secondary.staleCount ? ` (${c.ev.coverage.secondary.staleCount} à revérifier)` : ''}` },
    ],
  }
  return [
    ...profile,
    {
      title: 'Informations générales',
      rows: [
        { label: 'Entreprise', cell: (c) => c.firm?.name ?? c.p.firm_id },
        { label: 'Programme', cell: (c) => <>{c.p.name}{c.p.demo && <span className="badge demo small">DÉMO</span>}</> },
        { label: 'Type de marché', info: ['cfd_vs_futures'], cell: (c) => (c.p.instruments.status === 'confirmed' ? marketLabelsOf(c.p, ds).join(', ') : 'Non confirmé') },
        {
          label: 'Taille du compte',
          cell: (c) => (
            <select aria-label={`Taille du compte — ${c.p.name}`} value={c.v.id} onChange={(e) => onVariant(c.key, e.target.value)}>
              {c.p.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {variantName(v)}
                </option>
              ))}
            </select>
          ),
        },
        { label: 'Plateforme', cell: (c) => F.list(c.p.platforms, platformName) },
      ],
    },
    {
      title: "Évaluation (challenge)",
      note: "Ces règles s'appliquent pendant l'évaluation, pas sur le compte funded.",
      rows: [
        { label: "Nombre d'étapes", cell: (c) => sv(c.p.evaluation.steps, stepsText, { now: ctx.now, staleDays: ctx.scoring.stale_after_days }) },
        { label: 'Objectif de profit', cell: (c) => F.usd(c.v.evaluation.profit_target_usd) },
        { label: 'Drawdown maximal', cell: (c) => F.usd(c.v.evaluation.max_drawdown_usd) },
        {
          label: 'Type de drawdown',
          cell: (c) => (
            <>
              {F.dd(c.p.evaluation.drawdown_type)}
              {c.p.evaluation.drawdown_type.value && <Info ids={[DRAWDOWN_GLOSSARY[c.p.evaluation.drawdown_type.value]]} label="Expliquer ce drawdown" />}
            </>
          ),
        },
        { label: 'Limite quotidienne', info: ['daily_loss_limit'], cell: (c) => F.usd(c.v.evaluation.daily_loss_limit_usd, 'Aucune') },
        { label: 'Nombre minimal de journées', cell: (c) => F.num(c.v.evaluation.min_trading_days, 'Aucun minimum') },
        {
          label: 'Règle de consistance',
          info: ['consistency_rule'],
          cell: (c) => sv(c.p.evaluation.consistency_rule, (x) => (x.exists ? x.detail ?? 'Oui' : 'Aucune'), { now: ctx.now, staleDays: ctx.scoring.stale_after_days }),
        },
        { label: 'Nombre maximal de contrats', cell: (c) => F.num(c.v.evaluation.max_contracts) },
      ],
    },
    {
      title: 'Restrictions',
      note: "Chaque règle est indiquée séparément pour l'évaluation et pour le compte funded.",
      rows: [
        restr('news'),
        restr('overnight'),
        restr('weekend'),
        restr('asian_session'),
        restr('scalping'),
        restr('automated'),
        restr('copy_trading'),
        {
          label: 'Restrictions géographiques',
          cell: (c) =>
            sv(c.p.eligibility, eligibilityText, { now: ctx.now, staleDays: ctx.scoring.stale_after_days }),
        },
      ],
    },
    {
      title: 'Frais',
      note: BASIS_TEXT,
      rows: [
        { label: "Prix de l'évaluation (paiement unique)", cell: (c) => F.usd(c.v.pricing.one_time, 'Sans objet (abonnement)') },
        { label: 'Abonnement mensuel', cell: (c) => F.usd(c.v.pricing.monthly, 'Sans objet (paiement unique)') },
        { label: "Frais d'activation", info: ['activation_fee'], cell: (c) => F.usd(c.v.pricing.activation_fee, 'Aucun') },
        { label: 'Frais de reset', cell: (c) => F.usd(c.v.pricing.reset_fee, 'Aucun') },
        {
          label: 'Frais supplémentaires connus',
          cell: (c) =>
            sv(c.v.pricing.conditional_fees, (fees) => (fees.length === 0 ? 'Aucun frais conditionnel connu' : fees.map((f) => `${f.label}${f.amount_usd !== null ? ` (${fmtUsd(f.amount_usd)})` : ''} — ${f.condition}`).join(' ; ')), {
              now: ctx.now,
              staleDays: ctx.scoring.stale_after_days,
            }),
        },
        {
          label: 'Promotion observée',
          cell: (c) => (c.p.promos.length === 0 ? 'Aucune enregistrée' : c.p.promos.map((p) => `${p.label} (observée le ${p.observed_on}) — non incluse dans les prix`).join(' ; ')),
        },
      ],
    },
    {
      title: 'Compte funded',
      note: "Ces règles s'appliquent au compte funded, pas à l'évaluation.",
      rows: [
        { label: 'Compte simulé ou réel', cell: (c) => sv(c.p.funded.account_nature, (x) => NATURE_TEXT[x], { now: ctx.now, staleDays: ctx.scoring.stale_after_days }) },
        {
          label: 'Règles de drawdown',
          cell: (c) => (
            <>
              {F.dd(c.p.funded.drawdown_type)}
              {c.p.funded.drawdown_type.value && <Info ids={[DRAWDOWN_GLOSSARY[c.p.funded.drawdown_type.value]]} label="Expliquer ce drawdown" />}
              <br />
              Maximal : {F.usd(c.v.funded.max_drawdown_usd)}
              <br />
              Quotidien : {F.usd(c.v.funded.daily_loss_limit_usd, 'Aucune limite')}
            </>
          ),
        },
        { label: 'Nombre maximal de contrats', cell: (c) => F.num(c.v.funded.max_contracts) },
        { label: 'Conditions de retrait', cell: (c) => F.text(c.p.funded.withdrawal_conditions) },
        { label: 'Retraits : informations manquantes', cell: (c) => withdrawalDisclosure(c.p, c.v).summary ?? 'Aucune lacune connue' },
        { label: 'Partage des profits', info: ['profit_split'], cell: (c) => F.pct(c.p.funded.profit_split_pct) },
        { label: 'Montant minimal de retrait', cell: (c) => F.usd(c.p.funded.min_withdrawal_usd, 'Aucun minimum') },
        {
          label: 'Plafond éventuel',
          cell: (c) => sv(c.p.funded.payout_cap, (x) => (x.has_cap ? (x.amount_usd !== null ? fmtUsd(x.amount_usd) : 'Oui (montant non précisé)') : 'Aucun plafond'), { now: ctx.now, staleDays: ctx.scoring.stale_after_days }),
        },
        {
          label: 'Safety Net',
          info: ['safety_net'],
          cell: (c) => sv(c.p.funded.safety_net, (x) => (x.exists ? x.detail ?? 'Oui' : 'Aucun'), { now: ctx.now, staleDays: ctx.scoring.stale_after_days }),
        },
      ],
    },
    reliability,
  ]
}

export function regionName(code: string): string {
  const [c, r] = code.split('-')
  return r ? `${countryName(c)} (${r})` : countryName(c)
}
