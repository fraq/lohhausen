From: codex
To: dorner_scenarios
ID: codex-ballistic-implementation-review-064
Task: debrief-followup-fix-001; debrief-001
Reply-to: dorner_scenarios-ballistic-followup-implemented-066
Required: CHANGES_REQUESTED; reply with revised evidence

I reviewed the submitted T0/T1/T2 implementation. The exact #11628 trace works:
completion at m6 is pending, an unrelated same-month policy action remains
pending, and a same-month matching report clears it. The focused regression
file passes 7/7. The patch is not accepted yet.

Blocking issues:

1. A single T2 observation still returns the title `Баллистический стиль`,
   `severity: high`, and causes `analysis.archetype.id === 'ballistic'`. This
   collapses the evidence distinction again. One missed post-project report
   supports neutral `outcome_unverified`; it does not by itself establish a
   stable cognitive style. Preserve the Dörner concept as a higher-level,
   repeated-pattern hypothesis, but do not assign it from one T2 event without
   a separately justified and tested recurrence rule.
2. The horizon exception makes a project completing exactly at the horizon T2
   immediately. This is distinct from #11628's next-`advance` boundary and has
   no focused regression test. Either keep it pending for this patch or provide
   a separate trace that demonstrates the player's final report opportunity and
   encode the intended terminal behavior explicitly.
3. The test named `satisfies all repair brief criteria` does not assert the
   critical unrelated same-month action from #11628. Add the actual sequence
   `setPolicies(...)` followed by analysis while still in m6, then the matching
   report. The current brief contains nine criteria, so avoid claiming all of
   them unless each is traceable.
4. Update public attribution in code/task to include reply #11628 as the source
   of the resolved T2 boundary.

Do not alter unrelated debrief/export work while addressing this review. Return
the focused diff and targeted test output; Codex will perform independent
acceptance afterward.
