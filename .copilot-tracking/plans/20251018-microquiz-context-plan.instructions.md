---
applyTo: '.copilot-tracking/changes/20251018-microquiz-context-changes.md'
---

<!-- markdownlint-disable-file -->

# Task Checklist: Microquiz Contextual Content

## Overview

Define a curated microquiz authoring pipeline and validation workflow that anchors questions in module context.

## Objectives

- Replace heuristic enrichment with SME-authored templates aligned to module learning objectives.
- Integrate a compilation and QA pipeline that keeps microquiz JSON, gating, and validation in sync.

## Research Summary

### Project Docs

- README.md - Confirms Node.js 20+, Vite stack, and accessibility/responsive guarantees for microlearning (Lines 9-10, 150).
- requirements.md - Requirement 7 enforces five-question cap, timing, partial credit, and feedback flow (Lines 12-13, 150).
- design.md - Details MicroQuizPanel and AssessmentService collaboration for rendering and scoring (Lines 15, 34-37).
- modules.md - Maps microQuizzes arrays and inline <!-- micro-quiz:id --> markers (Lines 16-17, 78-82).
- RESPONSIVE_TEST_GUIDE.md - Specifies breakpoints and touch interactions to maintain quiz usability (Lines 18-19).
- VALIDATION_GUIDE.md - Documents validation scripts and expected reports for quiz schema (Lines 20-23, 162).

### Source References

- src/data/ihk/modules/*.json - Module structure with microQuizzes entries needing contextual metadata (Lines 28-29, 78-82).
- scripts/apply-microquizzes.js - Current placeholder generator illustrating templated content gaps (Lines 42-45, 122-145).

### Research Notes

- .copilot-tracking/research/20251018-microquiz-context-research.md synthesizes module mappings, automation limits, and YAML compiler recommendations (Lines 78-176).

### External References

- #githubRepo:"microsoft/Web-Dev-For-Beginners quiz-app" - Shows contextual quiz sequencing before progression (Lines 62-63).
- #fetch:https://www.valamis.com/hub/microlearning - Reinforces short, purposeful microlearning content (Lines 65-66).

### QA & Automation

- npm run validate - Ensures quiz JSON schema compliance and updates validation reports (Lines 21-23, 158-163).
- npm run test - Confirms AssessmentService and related utilities remain stable after quiz updates (Lines 159-160).

## Implementation Checklist

### [x] Phase 1: Establish Curated Microquiz Inputs

- [x] Task 1.1: Map priority modules and extend microQuizFocus metadata
  - Details: .copilot-tracking/details/20251018-microquiz-context-details.md (Lines 11-26)

- [x] Task 1.2: Draft SME-facing YAML templates for contextual questions
  - Details: .copilot-tracking/details/20251018-microquiz-context-details.md (Lines 28-43)
### [x] Phase 2: Plan Compilation and Validation Pipeline

- [x] Task 2.1: Architect quiz compiler and QA automation updates
  - Details: .copilot-tracking/details/20251018-microquiz-context-details.md (Lines 47-64)
## Dependencies

- Node.js 20+ with Vite tooling configured (Lines 9-10).
- SME access for contextual content review and authoring.
- Existing validation scripts and reports available for integration (Lines 21-23, 158-163).

## Success Criteria

- Curated metadata and templates documented for prioritized modules.
- Compiler architecture and QA handoffs defined with executable next steps.
- Validation, testing, and accessibility requirements enumerated for implementation handoff.
