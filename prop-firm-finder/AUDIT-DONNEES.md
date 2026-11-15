# Registre des informations non confirmées (champs essentiels)

Généré par `npx tsx scripts/audit-report.ts` — date de référence : 2026-11-15.

## Apex EOD Trail (`apex-eod-trail`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×4, variants[].pricing.activation_fee ×4, variants[].funded.daily_loss_limit_usd ×4

## Apex Intraday Trail (`apex-intraday-trail`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×4, variants[].funded.daily_loss_limit_usd ×4, variants[].pricing.activation_fee ×3

## Challenge 1-Step — type Standard (FTMO) (`ftmo-1step-standard`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5

## Challenge 1-Step — type Swing (FTMO) (`ftmo-1step-swing`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5

## Challenge 2-Step — type Standard (FTMO) (`ftmo-2step-standard`)
- Champs essentiels non confirmés : funded.drawdown_type, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5

## Challenge 2-Step — type Swing (FTMO) (`ftmo-2step-swing`)
- Champs essentiels non confirmés : funded.drawdown_type, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5

## Instant Account (FTMO) (`ftmo-instant`)
- Champs essentiels non confirmés : funded.min_withdrawal_usd, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5

## Stellar 1-Step (FundedNext) (`fundednext-stellar-1step`)
- Champs essentiels non confirmés : funded.min_withdrawal_usd, variants[].pricing.one_time ×6, variants[].pricing.activation_fee ×6
- ⚠ CONTRADICTION : la page affiche « à partir de 44,99 $ » et des prix de 65,99 $ à 1 099,99 $ pour le même programme : promotions, non confirmés.

## Stellar 2-Step (FundedNext) (`fundednext-stellar-2step`)
- Champs essentiels non confirmés : funded.min_withdrawal_usd, variants[].pricing.one_time ×6, variants[].pricing.activation_fee ×6

## Stellar Instant (FundedNext) (`fundednext-stellar-instant`)
- Champs essentiels non confirmés : funded.min_withdrawal_usd, variants[].pricing.one_time ×4, variants[].pricing.activation_fee ×4

## Stellar Lite (FundedNext) (`fundednext-stellar-lite`)
- Champs essentiels non confirmés : funded.min_withdrawal_usd, variants[].pricing.one_time ×6, variants[].pricing.activation_fee ×6
- ⚠ CONTRADICTION sur la même page : jours minimum = 2 (tableau) ou 5 par phase (FAQ) ; première récompense = 10 jours ouvrables (tableau) ou 21 jours (FAQ) : non confirmés.

## 1 Step Flex (FundingPips) (`fundingpips-1step-flex`)
- Champs essentiels non confirmés : funded.profit_split_pct, funded.min_withdrawal_usd, restrictions.overnight.funded, restrictions.weekend.funded, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5, variants[].evaluation.daily_loss_limit_usd ×5, variants[].funded.daily_loss_limit_usd ×5
- ⚠ CONTRADICTION : le partage est de 80 % ou 85 % selon la page ; les fins de semaine du Master sont soit permises avec l'option Swing, soit temporairement interdites.

## 1 Step (FundingPips) (`fundingpips-1step`)
- Champs essentiels non confirmés : funded.profit_split_pct, funded.min_withdrawal_usd, restrictions.overnight.funded, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5
- ⚠ CONTRADICTION : ce modèle (10 % / 6 %) n'est pas listé sur la page Get Started, qui cite 1 Step Flex, 2 Step Standard / Flex / Pro et Zero ; sa disponibilité actuelle n'est pas confirmée.

## 2 Step Flex (FundingPips) (`fundingpips-2step-flex`)
- Champs essentiels non confirmés : funded.profit_split_pct, funded.min_withdrawal_usd, restrictions.overnight.funded, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5
- ⚠ CONTRADICTION : les Terms indiquent une perte maximale de 10 % pour tous les modèles 2 Step alors que la page des objectifs donne 12 % pour 2 Step Flex : valeurs de la page des objectifs retenues, à reconfirmer.

## 2 Step Pro (FundingPips) (`fundingpips-2step-pro`)
- Champs essentiels non confirmés : funded.profit_split_pct, funded.min_withdrawal_usd, restrictions.news.evaluation, restrictions.overnight.funded, variants[].pricing.one_time ×6, variants[].pricing.activation_fee ×6

## 2 Step Standard (FundingPips) (`fundingpips-2step-standard`)
- Champs essentiels non confirmés : funded.profit_split_pct, funded.min_withdrawal_usd, restrictions.overnight.funded, variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5
- ⚠ CONTRADICTION : à la demande 90 % (blog) ou 100 % (page d'aide) ; minimum de jours de la phase 1 non tranché.

## Zero (FundingPips) (`fundingpips-zero`)
- Champs essentiels non confirmés : funded.min_withdrawal_usd, restrictions.overnight.funded, restrictions.weekend.funded, variants[].pricing.one_time ×6, variants[].pricing.activation_fee ×6

## Builder (MyFundedFutures) (`myfundedfutures-builder`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×3, variants[].pricing.activation_fee

## Pro (MyFundedFutures) (`myfundedfutures-pro`)
- Champs essentiels non confirmés : restrictions.overnight.evaluation, restrictions.overnight.funded, restrictions.weekend.evaluation, restrictions.weekend.funded, variants[].pricing.one_time ×3

## Rapid (MyFundedFutures) (`myfundedfutures-rapid`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×4

## Test → PRO → PRO+ (Take Profit Trader) (`take-profit-trader-test`)
- Champs essentiels non confirmés : instruments, eligibility, variants[].pricing.monthly ×5, variants[].pricing.activation_fee ×5, variants[].evaluation.max_drawdown_usd ×4, variants[].funded.max_drawdown_usd ×4

## Bootcamp (The5ers) (`the5ers-bootcamp`)
- Champs essentiels non confirmés : evaluation.drawdown_type, funded.drawdown_type, funded.min_withdrawal_usd, variants[].pricing.one_time ×3, variants[].pricing.activation_fee ×3
- ⚠ CONTRADICTION : le levier est 1:30 (blog récent) ou 1:10 (page communautaire ancienne) : non modélisé.

## High Stakes (The5ers) (`the5ers-high-stakes`)
- Champs essentiels non confirmés : variants[].pricing.one_time ×5, variants[].pricing.activation_fee ×5, variants[].evaluation.profit_target_usd ×5
- ⚠ CONTRADICTION : l'objectif de l'étape 1 est de 8 % (tableau, autres articles) ou 10 % (texte du comparatif) : non confirmé.

## Hyper Growth (The5ers) (`the5ers-hyper-growth`)
- Champs essentiels non confirmés : evaluation.drawdown_type, funded.drawdown_type, variants[].pricing.one_time ×3, variants[].pricing.activation_fee ×3

## Trading Combine (Topstep) (`topstep-trading-combine`)
- Champs essentiels non confirmés : funded.account_nature, restrictions.news.evaluation, restrictions.news.funded, eligibility

## Fast Pass fin de journée (TradeDay) (`tradeday-fp-eod`)
- Champs essentiels non confirmés : instruments, restrictions.news.evaluation, restrictions.news.funded, eligibility, variants[].pricing.one_time ×4, variants[].pricing.monthly ×4, variants[].evaluation.daily_loss_limit_usd ×4, variants[].funded.daily_loss_limit_usd ×4

## Quick Pay fin de journée (TradeDay) (`tradeday-qp-eod`)
- Champs essentiels non confirmés : instruments, restrictions.news.evaluation, restrictions.news.funded, eligibility, variants[].pricing.one_time ×4, variants[].pricing.monthly ×4, variants[].evaluation.daily_loss_limit_usd ×4, variants[].funded.daily_loss_limit_usd ×4

## Quick Pay Intraday (TradeDay) (`tradeday-qp-intraday`)
- Champs essentiels non confirmés : instruments, restrictions.news.evaluation, restrictions.news.funded, eligibility, variants[].pricing.one_time ×4, variants[].pricing.monthly ×4, variants[].evaluation.daily_loss_limit_usd ×4, variants[].funded.daily_loss_limit_usd ×4

Total : 119 lacunes de champs essentiels, tous programmes réels confondus.
