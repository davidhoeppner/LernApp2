## Quiz Gating & Assessment Layer – Living Notes

This document records all mandated phases for the refined quiz gating & assessment feature. Each phase captures decisions, alternatives, risks, metrics, and next actions. Updated continuously; append-only (no destructive edits).

---

### Phase 1 – Analysis

**Decisions Made**

- Adopt incremental layering: (1) pure gating evaluators + data model, (2) micro-quiz inline UI, (3) final exam gate, (4) attempts/analytics/i18n, (5) performance & accessibility hardening.
- Use isolated functional core (pure evaluators + scoring) under `src/assessment/` to keep bundle growth predictable (< 15KB gzip target for runtime additions; dev-only deps excluded).
- Represent final exam state with union `LOCKED | READY | PASSED | OUTDATED | COOLDOWN` as specified (string literal constants to aid tree shaking, no enum object).
- Persistence via existing `StorageService` with new logical keys (versioned): `assessment.attempts.v1`, `assessment.progress.v1`, `assessment.flags.v1`, plus ephemeral drafts `assessment.draft.v1` (auto-saved every 5s; cleared on successful submit).
- Feature flag approach: create central config module `src/config/featureFlags.js` returning plain object; gating code checks `if (!flags.quizGating) { legacy path }` to keep side-effect minimal.

**Alternatives Rejected (why)**

- Global event emitter library (e.g., mitt) – rejected to avoid extra dependency + bundle size; simple handcrafted EventBus sufficient.
- Storing full rationales pre-submission – rejected (security/integrity requirement 7.10 prohibits exposing answers early).
- Using existing `QuizValidator` as scoring engine – rejected (validator semantics differ; scoring requires partial credit & attempt lifecycle).
- Enum object for statuses – rejected for size; string literals + JSDoc typedef achieve clarity and minified size.

**Risks & Mitigations**

- Risk: Bundle size overshoot. Mitigation: keep evaluation + scoring pure, no third-party libs, measure gz size later (Phase 6/9 metrics).
- Risk: Data migration conflicts if earlier quiz storage emerges later. Mitigation: versioned keys + adapter function placeholder.
- Risk: Race conditions on rapid submissions. Mitigation: idempotent submission guard + disabled submit button until scoring complete.
- Risk: Accessibility regressions in new components. Mitigation: early semantic planning (fieldset/legend, ARIA live regions) and axe scan before completion.
- Risk: Complexity creep in evaluators. Mitigation: maintain <200 LoC per evaluator file, unit test matrix early (Phase 5 start).

**Open Questions**

- Cooldown duration definition (not specified). Will assume none initially; placeholder logic returns READY unless separate policy added.
- Criteria for module structure change detection (hash vs. count?). Plan: compute stable signature: hash of required micro quiz IDs + required section IDs; if mismatch after pass -> OUTDATED.
- Time limit governance for micro-quizzes (only guideline median 2 min). Implementation will not enforce timer unless future requirement added; we will measure median answering time placeholder.

**Metrics / Quality Gates (Planned)**

- Gating core functions unit tested coverage ≥90% statements.
- Pure evaluator bundle (after treeshake) ≤5 KB gzip (target) – measured later.
- Scoring rounding verified with sample set (Phase 7 test cases).
- Performance: micro-quiz panel expand DOM diff <50ms (Phase 6 measurement).

**Next Immediate Actions**

- Phase 2: Formalize EARS requirements section 7 in `requirements.md` with expansions & cross references.
- Prepare requirement IDs for mapping into tasks later (Phase 3 design & tasks update).

---

### Phase 2 – Requirements Engineering (EARS)

**Decisions Made**

- Expanded each group (7.1–7.11) with additional EARS lines covering: error states, prevention clauses, feature flag disabled paths, persistence constraints, pruning, i18n fallback, analytics semantic events, and security.
- Adopt half-up rounding implemented via utility `roundHalfUp(value, decimals)` using decimal scaling to avoid floating point anomalies for one decimal.
- Partial credit formula exactly as provided with clamp and weight; store per-question fractional before scaling to percentage for transparency.
- Introduce explicit prevention requirements for: early answer reveal, duplicate submissions, accessing final exam while OUTDATED, exceeding attempt retention.

**Alternatives Rejected (why)**

- Bankers rounding vs half-up – conflicts with explicit requirement; half-up chosen.
- Weighted average recalculation stored – decide to derive on demand from attempts to reduce tampering risk (align 7.10 integrity).

**Risks & Mitigations**

- Overly granular requirements -> maintenance overhead. Mitigation: grouped logically and cross-referenced to tasks to avoid duplication.
- Potential ambiguity of "section ≥85% read" metric. Mitigation: define concretely as scroll progress or explicit mark complete event; we treat whichever first sets `sectionProgress.readRatio >= 0.85 || sectionProgress.manuallyMarked`.
- I18n fallback chain complexity. Mitigation: two-step fallback only (requested locale -> en -> key name) to keep code simple.

**Open Questions**

- Should OUTDATED state lock review of past attempts? (Not specified) – will allow viewing history but block new final exam attempt.
- Cooldown specifics still TBD (see Phase 1). Provide placeholder requirement allowing future injection of policy.

**Metrics / Quality Gates (Planned vs Actual)**

- Planned: All requirement IDs mapped to future tasks (Phase 3). Actual: Pending.
- Planned: Requirements diff appended without altering prior sections. Actual: Completed in this phase.

**Next Immediate Actions**

- Phase 3: Extend design (`design.md`) with data model delta, component hierarchy, sequence diagrams, and state transition tables; add tasks block 13 referencing requirement IDs.

---

// Subsequent phases will be appended below in future updates.

### Phase 3 – Design Extension

**Decisions Made**

- File structure addition planned:
  - `src/assessment/evaluators/` (pure gating logic)
  - `src/assessment/scoring/` (partial credit, rounding)
  - `src/assessment/services/AssessmentService.js` (front-end boundary)
  - `src/assessment/event/EventBus.js`
  - `src/assessment/i18n/` (locale JSON)
  - `src/assessment/components/` (UI panels)
- Introduce lightweight UUID generator (avoid dependency) using crypto if available fallback to timestamp-rand.
- Module structure signature: stable JSON string of sorted required quiz IDs + section IDs hashed with a simple FNV-1a implementation (pure JS) – small footprint.
- Performance: micro-quiz panel lazy render; final exam questions loaded only after status READY & user click.
- Accessibility: A11yAnnouncer single shared instance in `src/assessment/a11y/Announcer.js` to reuse existing pattern described in design system.

**Alternatives Rejected (why)**

- Hash via SubtleCrypto digest – rejected (async complexity, not essential; FNV-1a sufficient for change detection, not security).
- Direct integration into existing QuizService – rejected to keep gating isolatable behind feature flag.

**Risks & Mitigations**

- Risk: Over-fragmentation directories. Mitigation: keep only necessary separation; evaluators + scoring remain under 2 subfolders.
- Risk: Duplicate i18n loader logic. Mitigation: centralized `getAssessmentString(key)` utility with cascading fallback.

**Open Questions**

- Are micro-quizzes derived from existing quiz JSON or separate micro content? Assume separate micro quizzes keyed by section; future consolidation noted.
- Weight default unspecified. Assume weight=1 per question unless defined.

**Metrics / Quality Gates (Planned)**

- Function purity: zero DOM access in evaluators & scoring (lint rule future).
- Unit test coverage target reaffirmed (≥90%).

**Next Immediate Actions**

- Begin Phase 4 Data & Model Update: implement data type typedefs & skeleton modules + i18n files.

---

### Phase 4 – Data & Model Update

**Decisions Made**

- Implemented initial folder structure and stubs for evaluators, scoring, EventBus, i18n resources, and feature flag configuration.
- Added English & German locale JSON with initial keys; fallback strategy returns key literal when missing (will add analytics emission later in Phase 8).
- Partial credit & rounding utilities created with minimal logic (multi-select; ordering/gap fill placeholders to be added later if needed).
- Evaluator logic supports OUTDATED detection via signature comparison placeholders (structureSignature vs lastPassedSignature).

**Alternatives Rejected (why)**

- Separate attempt schema file – deferred until attempts persisted to avoid premature abstraction.
- External UUID library – avoided for bundle size; using crypto.randomUUID if available else fallback template.

**Risks & Mitigations**

- Risk: Lint issues due to CRLF or formatting – will run lint fix in later phase (Implementation Phase 5) to standardize.
- Risk: Missing tests could allow regressions – Phase 5 will introduce Vitest harness; currently repository lacks test runner scripts; may need to add.

**Open Questions**

- Need to confirm or introduce Vitest dependency for tests (not presently in package.json). Will add minimal dev dependency; measure bundle unaffected (dev only).

**Metrics / Quality Gates (Planned vs Actual)**

- Planned stubs complete (Actual: completed for gatingEvaluators, partialCredit, EventBus, i18n loader, featureFlags).
- No size measurement yet (pending build after implementation phase).

**Next Immediate Actions**

- Phase 5 Implementation: refine evaluator logic, add attempt persistence service, integrate feature flag paths, add tests & scoring edge cases.

---

### Phase 5 – Implementation (Incremental Start)

**Decisions Made**

- Implemented `AssessmentService` with attempt saving, pruning, draft handling, and scoring (multi-select partial credit + single-choice/true-false full credit).
- Deferred ordering / gap fill scoring to later (logged as future enhancement; placeholder fraction=0 currently to avoid silent incorrect scoring assumptions).
- Chose simple exponential backoff logic to add in next sub-step; retry scaffolding not yet added (tracked as open item this phase until integrated).
- Created central attempt keys and retention policy constants inside service; may externalize if reused.

**Alternatives Rejected (why)**

- Using a monolithic combined service for modules + assessment – kept separation for feature flag isolation.
- Storing pre-aggregated total scores – recomputation preferred (integrity requirement 7.10).

**Risks & Mitigations**

- Risk: Unimplemented retry/backoff could delay meeting Req 7.4. Mitigation: explicit open question & follow-up commit in same phase prior to moving to Phase 6.
- Risk: Lint/style non-compliance (CRLF endings) – will run formatting & lint fix after adding tests to avoid churn.

**Open Questions**

- Where to integrate auto-save timer (component vs service). Plan: component-level interval invoking `startDraft`.
- Need to define pass threshold for micro-quiz gating (not explicit). Assumption: pass if finalScore >= 70 (document to design extension in later phase) – pending confirmation.

**Metrics / Quality Gates (Planned vs Actual)**

- Unit tests still pending (planned next within Phase 5 before closure).
- Service file < 200 LoC (actual ~150) meets maintainability target.

**Next Immediate Actions**

- Add retry/backoff submission wrapper.
- Introduce vitest dev dependency + initial unit tests (evaluators + scoring + pruning).
- Add missing analytics for i18n missing keys.
- Then close Phase 5 and proceed to Phase 6 (Accessibility & Performance Review preparation).

---
