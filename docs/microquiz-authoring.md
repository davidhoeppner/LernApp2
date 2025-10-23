# Microquiz Authoring Guide

This guide helps subject-matter experts (SMEs) create contextual microquizzes that align with module learning objectives, Requirement 7, and the new compilation workflow.

## 1. Authoring Workflow

1. **Select the quiz**
   - Open the relevant module JSON in `src/data/ihk/modules/`.
   - Copy the `microQuizFocus` entry for the quiz ID you will author.
2. **Pick a template**
   - Choose one of the YAML templates in `content/microquizzes/templates/` that matches the intended interaction.
3. **Draft the quiz**
   - Replace placeholders with real data while honoring the guidance from `microQuizFocus` (context cues, misconceptions, evidence).
   - Keep question count at five or fewer per quiz.
4. **Peer review**
   - Validate scenario accuracy with another SME.
   - Confirm accessibility, localization, and timing requirements.
5. **Submit for compilation**
   - Store the completed YAML in `content/microquizzes/drafts/<module-id>/`.
   - Notify engineering via the content handoff channel for compilation and validation.

## 2. Template Overview

| Template | Use Case | Key Notes |
|----------|----------|-----------|
| `scenario-single-choice.yaml` | Focused decision under time pressure | Ideal for reinforcing a single misconception; uses radio buttons. |
| `scenario-multi-select.yaml` | Multiple correct actions required | Explicitly states number of correct answers; AssessmentService grants partial credit. |
| `true-false-contextual.yaml` | Rapid myth busting | Best for quick checks tied to module reminders; include remediation links. |

## 3. Content Requirements

- **Scenario-first**: Start with a short narrative (2-3 sentences) that mirrors the learner's role and the module context.
- **Evidence-driven**: Link each correct answer and explanation back to the evidence cited in `microQuizFocus`.
- **Exam realistic**: Ensure questions can be answered in under two minutes and mirror the complexity of the AP2 exam.
- **Distractor quality**: Write plausible distractors that map directly to the logged misconceptions.
- **Language**: Use active voice and B1 reading level; translate technical terms only if the module does.

## 4. Accessibility & Localization

- Use gender-neutral language where possible.
- Keep sentences shorter than 25 words; break longer passages into bullet lists.
- Provide concise `screenReaderSummary` text in every template.
- Maintain consistent focus order and label associations (fieldset, legend, aria attributes).
- Avoid color-only cues; rely on text or iconography already supported by the app.

## 5. Validation Checklist

- [ ] ESLint passes (`npm run lint`).
- [ ] YAML compiles without errors (`npm run compile:microquizzes`).
- [ ] Content validation suite passes (`npm run validate`).
- [ ] Quiz imports cleanly into Vite build (`npm run build`).
- [ ] Vitest suite passes (`npm run test`).
- [ ] Manual responsive check at 360px, 768px, 1280px viewports.
- [ ] Keyboard-only navigation verified.
- [ ] Screen reader (NVDA or VoiceOver) announces prompts and feedback correctly.
- [ ] German localization reviewed by native speaker (or approved glossary).

## 6. Submission Package

Provide the following to engineering during handoff:

- Completed YAML file(s).
- Note of any new evidence references to add to the module.
- Peer-review sign-off (name, date).
- Optional: Suggested analytics instrumenting (e.g., event names).

Once received, engineering will compile the YAML, run the validate pipeline, and update the microquiz JSON and gating data.
