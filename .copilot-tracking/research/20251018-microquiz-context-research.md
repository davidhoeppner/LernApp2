<!-- markdownlint-disable-file -->

# Task Research Notes: Microquiz contextual content

## Research Executed

### File Analysis

- README.md
  - Documents Node.js 20+ requirement, Vite toolchain, service-oriented architecture, and feature list (responsive design, accessibility, offline capability) that frame microquiz expectations.
- equirements.md
  - Requirement 7 details micro-quiz behavioral constraints (5 questions, timed completion targets, gating rules, feedback timing, accessibility semantics, partial credit).
- design.md
  - Describes assessment architecture, MicroQuizPanel rendering responsibilities, AssessmentService scoring flow, and gating interactions with module progression.
- modules.md
  - Summarizes module coverage, tracks microQuizzes arrays, and flags sections with inline <!-- micro-quiz:id --> markers that drive placement.
- RESPONSIVE_TEST_GUIDE.md
  - Provides breakpoints, touch target expectations, and mobile nav checks ensuring inline microquizzes stay usable on all viewports.
- VALIDATION_GUIDE.md
  - Explains validation scripts, including 
pm run validate, 
pm run validate:json, and report outputs that highlight quiz schema issues.
- ACCESSIBILITY_FEATURES.md
  - Catalogs WCAG 2.1 AA implementations (fieldset/legend patterns, aria-live feedback, focus management) that MicroQuizPanel must continue honoring.
- public/site.webmanifest
  - Declares PWA metadata ensuring microlearning surfaces load offline with education/productivity categories.
- src/data/ihk/modules/bp-01-documentation.json
  - Representative module showing dense microQuizzes entries mapped to section anchors and inline markers.
- src/data/ihk/quizzes/bp-01-documentation-arten-der-dokumentation-micro-1.json
  - Enriched quiz file illustrating semi-generic question wording tied loosely to documentation content.
- src/data/ihk/quizzes/bp-05-data-structures-arrays-micro-1.json
  - Keyword-enriched artifact demonstrating off-target questions (queue terminology) for arrays section.
- src/assessment/components/MicroQuizPanel.js
  - Renders up to five questions with fieldset/legend semantics, handles submission, highlights answers, dispatches events.
- src/assessment/services/AssessmentService.js
  - Computes scores (including partial credit), persists attempts, enforces gating rules, emits completion events.
- src/services/IHKContentService.js
  - getQuizById resolves quiz JSON using dynamic import caching, powering inline and sidebar quiz mounts.
- src/components/ModuleDetailView.js
  - Replaces <!-- micro-quiz:id --> placeholders with inline containers and mounts MicroQuizPanel when quizGating is active.
- scripts/apply-microquizzes.js
  - Generates placeholder quizzes per section with templated questions and seeds microQuizzes arrays.
- scripts/enrich-microquizzes.cjs
  - Attempts keyword-based enrichment to replace placeholders; limited heuristics cause mismatches and repeated phrasing.
- QUIZ_VALIDATION_REPORT.json
  - Highlights current warnings (missing categories, malformed true/false options) across legacy microquiz data.
- package.json
  - Exposes automation scripts (lint, 	est, uild, preview, alidate suite) and dependencies for quiz infrastructure tooling.

### Code Search Results

- microquiz
  - Matches automation scripts and quiz JSON IDs using <module>-<slug>-micro-# convention, confirming naming scheme consumed by IHKContentService.
- <!-- micro-quiz
  - Located in src/components/ModuleDetailView.js and module markdown content, verifying marker replacement pipeline.
- quizGating
  - Appears in ModuleDetailView and AssessmentService, showing feature-flagged gating flow integration with microquiz completion status.

### External Research

- #githubRepo:"microsoft/Web-Dev-For-Beginners quiz-app"
  - Provides reference implementation where localized quiz JSON supplies three contextual questions per lesson and enforces completion feedback loops before progression.
- #fetch:https://www.valamis.com/hub/microlearning
  - Confirms best practices: keep sessions under ten minutes, reinforce through spaced repetition, and apply gamified feedback to sustain engagement.
- #fetch:https://en.wikipedia.org/wiki/Microlearning
  - Defines microlearning as bite-sized, push-delivered modules with short assessments that reduce cognitive load and improve retention when sequenced.

### Project Conventions

- Standards referenced: README.md; requirements.md; design.md; modules.md; RESPONSIVE_TEST_GUIDE.md; VALIDATION_GUIDE.md; ACCESSIBILITY_FEATURES.md; QUIZ_VALIDATION_REPORT.json; package.json.
- Instructions followed: Workspace developer brief, Task Researcher instructions (.github/chatmodes/task-researcher.chatmode.md).

## Key Discoveries

### Project Structure

Microquizzes reside under src/data/ihk/quizzes/, mapped by ID from module JSON in src/data/ihk/modules/ and embedded via inline markers inside module markdown. ModuleDetailView converts markers to inline containers, then loads MicroQuizPanel (sidebar and inline) while AssessmentService coordinates gating, storage, and event broadcasting. Public manifest settings maintain offline accessibility, aligning with README promises for responsive, accessible microlearning experiences.

### Implementation Patterns

Automation seeds coverage by running scripts/apply-microquizzes.js to insert markers and placeholder JSON per H2 section, followed by scripts/enrich-microquizzes.cjs to swap in heuristically generated content. Because enrichment keys on section titles, numerous quizzes drift into generic or mismatched questions, echoing arrays vs. queue terminology issues. UI components lean on accessibility conventions from ACCESSIBILITY_FEATURES.md (fieldset/legend, aria-live) while responsive behavior relies on breakpoints from RESPONSIVE_TEST_GUIDE.md. AssessmentService ensures requirement-driven constraints (5 questions, partial credit, gating) but current content quality undermines engagement goals from README and requirements.

### Complete Examples

`javascript
// src/assessment/components/MicroQuizPanel.js
render(quiz, moduleState = {}) {
  this.quiz = quiz;
  this.root.innerHTML = '';

  const form = document.createElement('form');
  quiz.questions.slice(0, 5).forEach(q => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = q.question;
    fieldset.appendChild(legend);

    (q.options || []).forEach(opt => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = q.type === 'multiple-choice' ? 'checkbox' : 'radio';
      input.name = q-;
      input.value = opt;
      label.append(input, document.createTextNode(opt));
      fieldset.appendChild(label);
    });

    form.appendChild(fieldset);
  });
  // submission + highlighting logic omitted
}
`

### API and Schema Documentation

Microquiz JSON includes id, moduleId, 	itle, description, category, difficulty, 	imeLimit, passingScore, and questions. Questions support single-choice, multiple-choice, and 	rue-false, with id, question, options, correctAnswer or correct, optional explanation, points, category, and ationale. Module JSON maintains microQuizzes arrays and inline markers; AssessmentService expects consistent IDs for storage keys (ssessment.attempts.v1) and gating transitions. PWA manifest metadata in public/site.webmanifest must remain aligned when adjusting quiz availability offline.

### Configuration Examples

`javascript
// scripts/apply-microquizzes.js
function createQuizFile(moduleJson, sectionTitle, quizId) {
  const safeTitle = sectionTitle.split(/[:\n]/)[0].trim();
  const quiz = {
    id: quizId,
    moduleId: moduleJson.id,
    title: ${safeTitle} - Microquiz 1,
    questions: [
      {
        question: Was ist der Kernpunkt des Abschnitts ""?,
        options: [
          Zentrales Konzept von "" im Kontext des Moduls,
          'Ein irrelevanter Aspekt ohne Bezug',
          'Nur dekorative Formatierung',
        ],
        correctAnswer: Zentrales Konzept von "" im Kontext des Moduls,
        explanation: 'Der Abschnitt vermittelt ein zentrales Teilthema des Moduls.',
      },
      // additional templated items trimmed
    ],
  };
  fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2), 'utf8');
}
`

### Technical Requirements

Requirement 7 enforces microquiz scope: cap at five questions, two-minute median completion, delayed feedback until submission, retry gating with incremental cooldown, partial credit scoring for multi-select, one-decimal score rounding, WCAG-compliant semantics (fieldset/legend, aria-live), and gating dependencies for final exam eligibility. README reiterates responsive, offline-ready, WCAG 2.1 AA goals, reinforcing accessibility and device coverage obligations.

### Data & Content Contracts

Inline markers and microQuizzes arrays must stay synchronized to avoid broken imports in IHKContentService. Quiz IDs feed storage persistence (ssessment.attempts.v1), so renames require migration. Placeholder content inserted by automation must be replaced with curated YAML/JSON5 sources while maintaining schema fields (category, difficulty, descriptions) to clear validation warnings. Manifest metadata ensures offline availability; responsive and accessibility guides guard UI consistency when quizzes change structure.

### Automation & QA Signals

- npm run lint  ESLint validation across src/ and scripts/ to catch syntax/style regressions introduced by quiz tooling tweaks.
- npm run test  Executes Vitest suites to confirm assessment services and utilities remain stable.
- npm run build  Produces Vite production bundle ensuring quiz imports resolve and tree-shaking retains updated JSON.
- npm run preview  Serves production build locally to smoke-test inline quiz rendering and gating flows.
- npm run validate  Orchestrates full content validation, updating JSON/markdown/encoding reports including microquiz warnings.
- Manual QA  Follow RESPONSIVE_TEST_GUIDE.md breakpoints plus manual quiz attempt flows (desktop/mobile) to ensure accessibility focus and gating behavior hold.

## Recommended Approach

Adopt a curated microquiz authoring pipeline backed by lightweight YAML (or JSON5) source files keyed to module learningObjectives and contentOutline, reviewed by subject-matter experts, then compiled into the existing JSON schema with validated metadata. Prioritize high-impact sections flagged via new microQuizFocus metadata to reduce fatigue, craft 2-3 scenario-driven questions per quiz with rationale, and integrate guidance from external microlearning research (short, contextual, spaced, gamified). Replace heuristic enrichment with deterministic compilation and validation that auto-runs lint, test, build, and validate scripts, producing reports free of microquiz warnings while preserving accessibility and responsive guarantees.

## Implementation Guidance

- **Objectives**: Deliver contextual, engaging microquizzes that comply with requirement 7, uphold accessibility/responsive standards, and eliminate validation warnings.
- **Key Tasks**: Define focus metadata in module JSON; create SME-authored YAML templates with question rationale and distractor rules; implement compiler script to transform YAML into quiz JSON, update imports, and flag untouched placeholders; wire compiler into validation pipeline; update enrichment tooling to detect outdated placeholders.
- **Dependencies**: Module markdown structure, IHKContentService caching, AssessmentService gating logic, validation scripts (
pm run validate:*), accessibility/responsive conventions, manifest offline expectations.
- **Success Criteria**: All microquizzes use contextual questions with rationales, pass validation (
pm run validate) without warnings, maintain gating/storage continuity, uphold accessibility/responsive behavior across breakpoints, and receive SME sign-off on representative modules before broader rollout.
