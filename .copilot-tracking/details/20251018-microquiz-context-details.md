<!-- markdownlint-disable-file -->

# Task Details: Microquiz Contextual Content

## Research Reference

**Source Research**: .copilot-tracking/research/20251018-microquiz-context-research.md (Lines 1-176)

## Phase 1: Establish Curated Microquiz Inputs

### Task 1.1: Map priority modules and extend microQuizFocus metadata

Document the high-impact modules, align inline <!-- micro-quiz:id --> markers with learning objectives, and define microQuizFocus metadata that captures context cues for SME-authored quizzes.

- **Files**:
  - src/data/ihk/modules/*.json - add or update microQuizFocus fields alongside existing microQuizzes arrays.
  - modules.md - log the prioritized sections and metadata schema.
- **Success**:
  - Inventory lists targeted modules with matching markers and metadata.
  - microQuizFocus schema documented for SMEs with example values per module.
- **Research References**:
  - .copilot-tracking/research/20251018-microquiz-context-research.md (Lines 78-82, 167-176)
  - #githubRepo:"microsoft/Web-Dev-For-Beginners quiz-app" - contextual quiz sequencing inspiration (Lines 62-63)
- **Dependencies**:
  - Access to module content owners for confirmation of learning objectives.
  - Current module JSON files synced from main branch.

### Task 1.2: Draft SME-facing YAML templates for contextual questions

Design YAML (or JSON5) templates that encode scenario-driven questions, distractor guidance, rationale text, and metadata (category, difficulty, timeLimit) ready for compilation.

- **Files**:
  - content/microquizzes/templates/*.yaml - define reusable template structure with placeholders and validation hints.
  - docs/microquiz-authoring.md - capture authoring checklist, accessibility requirements, and submission workflow.
- **Success**:
  - Templates cover single-choice, multi-select, and true/false variants with rationale fields.
  - Authoring guide spells out accessibility, timing, and feedback expectations.
- **Research References**:
  - .copilot-tracking/research/20251018-microquiz-context-research.md (Lines 82-145, 150-156, 171-176)
  - #fetch:https://www.valamis.com/hub/microlearning - microlearning best practices (Lines 65-66)
- **Dependencies**:
  - Task 1.1 completion to supply module context and metadata schema.
  - SME availability for iterative review of template drafts.

## Phase 2: Plan Compilation and Validation Pipeline

### Task 2.1: Architect quiz compiler and QA automation updates

Outline the compiler script that transforms YAML sources into validated quiz JSON, updates import paths, and integrates with validation and build workflows; specify QA gates and reporting updates.

- **Files**:
  - scripts/compile-microquizzes.cjs - planned entry point for transforming YAML into quiz JSON aligned with AssessmentService contracts.
  - package.json - add npm scripts (e.g., compile:microquizzes) and hook into validate pipeline.
  - scripts/enrich-microquizzes.cjs - note deprecation path or hybrid handoff to new compiler.
  - .github/workflows/*.yml - ensure CI runs compile + validate steps before build (if workflow exists).
- **Success**:
  - Compiler responsibilities, inputs, outputs, and error handling documented.
  - QA checklist enumerates npm run lint, test, build, validate, and manual responsive/accessibility passes for updated quizzes.
- **Research References**:
  - .copilot-tracking/research/20251018-microquiz-context-research.md (Lines 82-145, 154-163, 167-176)
  - #fetch:https://en.wikipedia.org/wiki/Microlearning - emphasizes short, sequenced assessments guiding QA focus (Lines 67-68)
- **Dependencies**:
  - Phase 1 completion to supply curated YAML inputs.
  - Coordination with validation report maintainers to align outputs.

## Dependencies

- Node.js 20+ environment with Vite toolchain available (Lines 9-10).
- Access to validation and reporting scripts (Lines 21-23, 158-163).

## Success Criteria

- Planning artifacts enable SMEs and engineers to author contextual quizzes without placeholders.
- Compiler workflow defined end-to-end with validation gates and reporting responsibilities.
