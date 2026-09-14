# Extremistan implementation verification — 2026-09-14

Branch: codex/extremistan. Base: 3607c0f. Owner: Codex.
Status: automated checks passed; visual review pending. This is a branch review candidate, not a public release verdict.

## What changed

The previous month-zero antifragility verdict is replaced by evidence-based classification. Each negative event is compared with a replay using the same seed, schedule and decisions, omitting only that event. Measurement uses the fixed snapshot six months after the final affected month. A growing factory in both branches no longer counts as shock benefit. Unreproducible histories and infeasible control decisions produce insufficient evidence.

The event generator is honestly described as a bounded five-event stress deck, using the alternative explicitly allowed by the original review. No Pareto/heavy-tail process or general mathematical convexity is claimed. Liquidity discipline is separated from a barbell strategy. Event activation, completed negative shocks, survived negative shocks, positive/noise events and explicit asset purchases have separate counters.

Equipment offers require an explicit buy/decline decision, expire after three decision months, preserve their choice through save/load and cannot spend twice. Scenario victory also requires a survived negative shock. New games accept a decimal uint32 seed or generate one once using browser crypto. Benchmarks run author-written policy recipes through the engine and export the seed, schedule, actions, skipped decisions and full resulting state; neither recipe promises a win.

The four-scenario canonical API is preserved. The branch's new-game dialog includes the Extremistan candidate, seed input, explicit offer controls and a translated debrief in Russian, English, German and French.

## Checks actually run

Node.js 22.23.2, official darwin-arm64 binary downloaded into /private/tmp. SHA256 matched the official checksum before project execution. The system Node.js 14.15.5 was not changed.

| Check | Result |
| --- | --- |
| Original baseline, npm test | 184/184 passed |
| Final npm test | 205/205 passed |
| npm run check; new module syntax checks | passed |
| scripts/verify-scenarios.mjs | 960 monthly states, 10 trajectories, finite values, stock/budget/workforce bounds and save round trips |
| Extremistan benchmark replay | Conrad/Marcus recipes at seeds 42 and 19870505 match their full exported final states |
| scripts/verify-chess-export.mjs | 4/4 canonical scenarios passed |
| scripts/verify-http.mjs | 12 pages, 18 modules, static assets and private-file boundaries passed |
| Translation checks | catalogue placeholders and runtime event text checked for en/de/fr |
| git diff --check | passed |

Regressions include wealthy month zero, positive/noise-only events, inclusive negative-shock end, pending recovery/horizon, missing and modified evidence, modernization in both worlds, immutable observation month, explicit buy/decline/expiry, duplicate/insufficient-cash rejection, choice replay, legacy schedules, malformed offer data, missing scenario state, uint32 input and one crypto draw.

An internal reviewer independently examined the operational specification and accepted it after correcting within-month observation timing. The benchmark helper independently ran its 7 focused tests. Codex integrated and checked all changes. Helpers became unavailable due to a usage limit before an independent final code review; their partial work was inspected and completed by Codex.

## Remaining review and limits

The Computer Use tool had no browser surface. Native Chrome was found, but getApp returned “Computer Use permissions are not granted”. Consequently no real browser screenshot, layout, keyboard/focus or end-to-end click verification is claimed. Seed handling and generated month-zero debrief were exercised as JavaScript unit tests; these are not substitutes for visual review.

Before merging: open the local server, start Extremistan with blank seed and seed 42, test invalid input, verify a pending offer's buy/decline buttons and reload, inspect intermediate/terminal debrief, and switch all four languages. A seed whose final recovery window extends beyond month 60 intentionally retains insufficient evidence for that window.

Legacy saves containing automatic purchases may load and continue but fail factual replay under the new choice rules. Their past automatic purchases are not counted as explicit choices. The existing generic project-removal comparison remains conservative/unavailable for journals containing Taleb events; this task supplies the separate shock-removal comparison. No unrelated H1/H2, binding-constraint or model-calibration review is accepted here.

The user explicitly authorized commit and push of this branch. Main merge, public deployment and release acceptance remain separate.
