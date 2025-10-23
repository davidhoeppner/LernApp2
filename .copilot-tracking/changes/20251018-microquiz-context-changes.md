<!-- markdownlint-disable-file -->

# Release Changes: Microquiz Contextual Content

**Related Plan**: .copilot-tracking/plans/20251018-microquiz-context-plan.instructions.md
**Implementation Date**: 2025-10-23

## Summary

Introduced curated microquiz authoring metadata, SME templates, and the YAML→JSON compiler pipeline with CI and QA gates.

## Changes

### Added

- content/microquizzes/templates/scenario-single-choice.yaml - Vorlage für szenariobasierte Single-Choice-Fragen mit Fokus auf Kontext und Fehlannahmen.
- content/microquizzes/templates/scenario-multi-select.yaml - Vorlage für Multi-Select-Szenarien inklusive Teilpunktelogik und SME-Hinweisen.
- content/microquizzes/templates/true-false-contextual.yaml - Vorlage für echte/falsche Myth-Busting-Checks mit Remediation-Linking.
- docs/microquiz-authoring.md - Leitfaden für SMEs mit Workflow, Accessibility-Vorgaben und Validierungs-Checkliste.
- scripts/compile-microquizzes.cjs - YAML-Compiler mit Berichtsausgabe und Modul-Synchronisation.
- docs/microquiz-pipeline.md - Pipeline-Dokumentation mit QA-Gates und CI-Einbindung.

### Modified

- src/data/ihk/modules/bp-05-data-structures.json - Added microQuizFocus mapping for Einführung, Arrays, Listen und Queue inklusive SME-Kontext.
- src/data/ihk/modules/bp-03-rest-api.json - Documented REST-Prinzipien, HTTP-Methoden und Authentifizierung mit gezielten Frageblaupausen.
- src/data/ihk/modules/fue-03-quality.json - Ergänzte Black-Box-, White-Box- und Performancetest-Fokusdaten für kuratierte Fragen.
- modules.md - Beschrieb neues microQuizFocus-Schema und inventarisierte priorisierte Module und Marker.
- .copilot-tracking/plans/20251018-microquiz-context-plan.instructions.md - Kennzeichnet beide Phasen als abgeschlossen.
- docs/microquiz-authoring.md - Ergänzte QA-Checkliste um Linting, Kompilierung und Validierung.
- scripts/enrich-microquizzes.cjs - Hinweis auf Legacy-Status und Verweis auf neuen Compiler.
- package.json - Registrierte Compiler-Skripte und YAML-Abhängigkeit.
- package-lock.json - Aktualisiert nach Installation der YAML-Abhängigkeit.
- .github/workflows/deploy.yml - Fügte Compile/Validate-Schritte und Node.js 20 Support hinzu.

### Removed

- _Pending_

## Release Summary

**Total Files Affected**: 16

### Files Created (6)

- content/microquizzes/templates/scenario-single-choice.yaml - SME-Vorlage für szenariobasierte Single-Choice-Fragen.
- content/microquizzes/templates/scenario-multi-select.yaml - Multi-Select-Vorlage mit Teilpunkte-Konfiguration.
- content/microquizzes/templates/true-false-contextual.yaml - True/False-Myth-Busting-Vorlage mit Remediation.
- docs/microquiz-authoring.md - Autor:in-Guide inklusive Workflow und Validierungscheckliste.
- scripts/compile-microquizzes.cjs - YAML-Compiler mit Fokusprüfung und Berichtsdatei.
- docs/microquiz-pipeline.md - Dokumentiert End-to-End-Pipeline und QA-Gates.

### Files Modified (10)

- src/data/ihk/modules/bp-05-data-structures.json - Ergänzt microQuizFocus-Leitplanken für priorisierte Abschnitte.
- src/data/ihk/modules/bp-03-rest-api.json - Kontextualisierte REST-Prinzipien-, Methoden- und Authentifizierungs-Fokusdaten.
- src/data/ihk/modules/fue-03-quality.json - Definierte Fokusblöcke für Black-/White-Box und Performance-Tests.
- modules.md - Dokumentierte microQuizFocus-Schema und inventarisierte priorisierte Module.
- .copilot-tracking/plans/20251018-microquiz-context-plan.instructions.md - Markierte alle Tasks und Phasen als abgeschlossen.
- docs/microquiz-authoring.md - Erweiterte Validierungs-Checkliste um Linting, Kompilierung und Vollvalidierung.
- scripts/enrich-microquizzes.cjs - Kennzeichnet Skript als Legacy mit Verweis auf neuen Compiler.
- package.json - Ergänzte Compiler/Validierungsskripte und devDependency yaml.
- package-lock.json - Aktualisierte Lock-Datei nach Installation von yaml.
- .github/workflows/deploy.yml - Füllt CI um Compile/Validate-Schritte auf und hebt Node.js-Version an.

### Dependencies & Infrastructure

- **New Dependencies**: yaml@^2.6.0 (dev)
- **Updated Dependencies**: npm install refreshed package-lock.json
- **Infrastructure Changes**: CI deploy workflow now compiles microquizzes, runs validation, and enforces clean git status before build.
- **Configuration Updates**: Added npm scripts `compile:microquizzes` and `validate:microquizzes`.

### Deployment Notes

Run `npm run compile:microquizzes && npm run validate` locally before committing new YAML drafts to ensure generated JSON stays in sync.
