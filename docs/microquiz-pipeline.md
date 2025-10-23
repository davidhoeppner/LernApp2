# Microquiz Compilation & QA Pipeline

The microquiz pipeline transforms SME-authored YAML drafts into production-ready JSON that the Learning App renders inline and in gated flows.

## Inputs

- YAML drafts stored under `content/microquizzes/drafts/<module-id>/*.yaml`
- Module context in `src/data/ihk/modules/<module-id>.json` (including `microQuizFocus`)
- Template guidance from `content/microquizzes/templates/`

## Compiler (`scripts/compile-microquizzes.cjs`)

Responsibilities:

- Discover YAML drafts recursively in the drafts directory.
- Validate `quiz.id` and `quiz.moduleId` against module metadata.
- Check that `microQuizFocus[quiz.id]` exists before emitting JSON.
- Normalize missing question IDs and deduplicate when necessary.
- Write JSON files to `src/data/ihk/quizzes/` with stable formatting.
- Append new quiz IDs to the owning module's `microQuizzes` array.
- Emit a report to `tmp/compile-microquizzes-report.json`, logging processed quizzes, warnings, and errors.

Failure modes:

- Missing module mapping → compilation aborts for that draft.
- YAML parse errors → recorded in the report with the file path.
- Absent `microQuizFocus` → prompts SME/engineer to add metadata before re-running.

## Automation Hooks

### npm Scripts

- `npm run compile:microquizzes` → executes the compiler and produces the report.
- `npm run validate:microquizzes` → compiles and then runs the JSON structure validator for schema checks.

### CI Workflow

- `.github/workflows/deploy.yml` now runs:
  1. `npm run compile:microquizzes`
  2. `npm run validate`
  3. `git diff --exit-code` to ensure compiled assets are committed
  4. `npm run build`

### Local QA Checklist

1. `npm run lint`
2. `npm run test`
3. `npm run compile:microquizzes`
4. `npm run validate`
5. `npm run build`
6. Manual responsive spot checks (360px, 768px, 1280px)
7. Screen reader sweep (NVDA or VoiceOver) for new quiz flows
8. Accessibility focus order review in MicroQuizPanel

Document the outcomes in the release changes log when completing tasks.
