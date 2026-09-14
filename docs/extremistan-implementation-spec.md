# Extremistan: operational contract, 2026-09-14

Owner: Codex. Task: extremistan-completion-001. Status: accepted by Codex after independent extremistan_review review and the observation-phase correction below (2026-09-14).

This replaces the rejected mathematical proposal in knowledge/agy-extremistan-semantics-spec.md for this implementation. All coefficients below are authored educational choices, not quotations, calibrated economic predictions or claims to reproduce Taleb's mathematics. Four canonical Dorner scenarios retain their current rules.

## Event model

Use a bounded, seeded stress deck, explicitly described as such. This release retains the existing five-card schedule (two different negative events, two different positive events, one noise event) and fixed catalogue magnitudes/durations. It does not claim a Pareto process or statistical reproduction of Extremistan. The unused general-purpose Pareto utility is not evidence about this mode. This is the honest stress-deck alternative expressly allowed by review criterion 3; variable heavy tails are a separate future extension.

Persist the whole schedule and uint32 seed. New UI games generate the seed once with crypto.getRandomValues; a supplied decimal uint32 is accepted, invalid text is rejected without replacing a save. The model API retains its deterministic default and normalizes integer seeds via >>> 0 for legacy compatibility. No timestamp fallback. prngState remains a legacy generation-checkpoint field, not a promise of a live random stream.

## Event accounting and explicit opportunities

Use unique event-instance identity derived from schedule index/month/id so repeated events cannot collide. Negative events apply on months start through start+duration-1 inclusive. They count completed after the last affected month's calculation. Each completed negative event counts as survived only if every monthly snapshot in that interval is present and has treasury > 0, debt <= 5000, population >= 2500. These are declared stress-test limits, not a new borrowing cap in the city engine. Missing history gives unknown, never success.

Expose six separate counters: activatedEventsCount (all), completedNegativeShocks, survivedNegativeShocks, windfallEventsCount (positive activations), noiseEventsCount, capitalizedOpportunities (explicit asset purchases). Active events are not completed or survived.

The asset sale offers equipment +18 (capped at 100) for 200, requiring treasury >= 800 immediately before purchase. It lasts three decision months, including activation (m..m+2), and is explicitly buy or decline. No spending on activation, no debt financing, no second purchase. Expiry does not accuse the player of failure. Record choice/month/instance in the action journal and outcome in event history; save/load preserves pending and resolved offers. A legacy automatic purchase remains a historical record, not new evidence of player choice.

Rename barbellCompliance to liquidityDiscipline: percentage of observed snapshots with treasury >= 600 and debt == 0. Cash alone is not a barbell strategy. Do not claim the bounded equipment purchase has unbounded upside or proves convexity.

## Counterfactual evidence

Reconstruct the factual game from scenario start, persisted seed, persisted event schedule and the action journal. Reapply policy patches, project starts and explicit event choices in order at their recorded month. Reports and notes have no numerical effects. Unknown action types, missing actions, an impossible action, or failure to reproduce the original numeric state/history yields insufficient_evidence. Do not silently skip an unaffordable control action.

For each completed negative shock, replay again omitting only that event instance; retain every other event and every player action up to the observation month. The seed and schedule are identical in both runs. Observation is exactly six months after the last affected month (start+duration-1+6), never the best point in a window. If it is beyond the horizon or has not arrived, the window remains open. Overlapping shocks are retained in the control; evidence is conditional on this exact action sequence, not an additive causal decomposition.

Compare performance using fixed scales, avoiding zero denominators:

The comparison uses immutable history[observationMonth] snapshots immediately after that month's calculation. Only actions at months strictly less than observationMonth affect that interval's control; actions at the observation month still participate in full factual validation but cannot retroactively change this comparison or make its control infeasible. Numeric replay establishes reproducibility, not tamper detection: a missing action with no numerical effect may be undetectable.

delta = 0.5 * ((treasury-debt)_actual - (treasury-debt)_control) / 800
      + 0.25 * (production_actual-production_control) / 800
      + 0.25 * (satisfaction_actual-satisfaction_control) / 100.

Higher is better. epsilon = 0.01. Display the three raw deltas alongside the aggregate. This is an operational, local shock-benefit indicator, not proof of mathematical convexity or a psychological diagnosis. Equal improvements from modernization in both branches do not count as shock benefit.

State machine (recomputed from evidence, so not sticky):

1. No negative shock with complete evidence, failed factual replay, missing interval snapshots or any infeasible control -> insufficient_evidence.
2. Any fully evaluated interval that failed survival or has delta < -epsilon -> fragile, even if another window is open. State explicitly refers to the observed interval, not every cause of poor finances.
3. Otherwise any open negative shock/recovery window -> insufficient_evidence (show completed counters separately).
4. Otherwise all intervals survived and have delta >= -epsilon, and at least one delta > epsilon -> antifragile, labelled 'benefit in the observed comparison'.
5. Otherwise -> robust (difference within the declared threshold).

Positive windfalls, cash reserves or an explicit asset purchase alone never establish antifragility. Rich month 0 and a no-negative-shock game are insufficient_evidence.

## Scenario and benchmarks

Victory requires the four existing city objectives plus at least one survived negative shock; it is a resilience exercise, not a requirement to manufacture positive shock benefit. A victory message does not assert antifragility. The same rule applies at the terminal month.

Replace Extremistan's fabricated numeric benchmark arrays with two deterministic author-written policy recipes executed through the real engine with the player's seed. Export seed, action journal and resulting trajectories; do not promise that the recipe named Conrad wins or the recipe named Marcus loses. Benchmark names describe policies, not verified optimality. Both recipes and any feasible/infeasible decisions must be inspectable.

## Verification and visibility

Required regressions: wealthy month 0; no negative events; positive/noise not counted as survived; inclusive shock end; breach/recovery; missing snapshots; open terminal window; pre/post growth without control benefit; identical seed/actions; changed seeds; uint32/negative seed; corrupt save; pending/declined/bought/expired opportunity and duplicate/poor purchase rejection; unaffordable control action; modified initial state or action journal; generated benchmark replay; all four locales and UI actions.

Run npm test, npm run check, scenario/HTTP/LMN checks and browser review. Keep the canonical getScenariosList() API at four scenarios. The implementation candidate on codex/extremistan exposes the full new-game list for review; public release requires acceptance including browser verification. Public deployment remains a separate action.
