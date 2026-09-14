# extremistan-completion-001

Owner: codex
Status: review
Accepted: 2026-09-14, direct user instruction: «прочитай проект и возьми на себя задачу про Крайнестан».

## Scope

Take responsibility for completing the Extremistan mode in this checkout. This new task supersedes the proposed implementation allocation in message 086 for this checkout; historical cards and other agents' state files remain historical evidence. No active collaborator or overlapping uncommitted work was present on intake (clean main, HEAD 3607c0f).

Write boundaries: Extremistan sections of src/taleb-events.js, src/scenarios.js, src/app.js, src/model.js, src/debrief.js, src/counterfactual.js; new src/extremistan-analysis.js and src/locales/extremistan.js; relevant tests; scripts/verify-scenarios.mjs and HTTP asset list if necessary; docs/extremistan-implementation-spec.md, docs/extremistan-verification.md; this card and state/codex.md. Internal helpers receive separate explicit subsets.

Acceptance: resolve the nine findings in docs/extremistan-review-20260912.md; review the revised operational specification before implementing it; verify deterministic controls and benchmarks, explicit purchases, seed UX, legacy persistence, four locales, canonical regressions and browser behavior.

Result: accepted operational specification and implementation candidate on codex/extremistan. Reproducible shock controls, explicit purchases, six event counters, seeded engine-generated benchmark recipes, uint32 UI input, translations and stronger persistence validation implemented. Full suite 205/205, syntax checks, 960 monthly states, 4 canonical LMN scenarios and HTTP 12 pages/18 modules pass. See docs/extremistan-verification.md.

Next: visual browser review; CUA reported “Computer Use permissions are not granted” for Chrome. This is a review candidate, not a completed release verdict. Existing unrelated cc7be0e reviews remain separate.

Publication: the user's follow-up «и коммит и пуш?» explicitly authorizes committing and pushing this implementation branch. It supersedes the historical commit/push freeze for this task. No main merge or Pages deployment is included.

Publication attempt: implementation committed as b41fb00. HTTPS push with the user's one-time credential authenticated as Kate-Lus but GitHub denied repository write access (403). The token was entered only into Git's password prompt with credential helpers disabled; no credential is stored in project files. Branch publication requires repository/token write permission. No remote branch was created by these attempts.
