# Requirements Document

## Introduction

Das Ziel dieser Feature-Spezifikation ist die vollständige Überarbeitung des Quiz-Systems für die IHK-Lernplattform. Aktuell existieren Quizzes mit unterschiedlicher Qualität und Umfang (teilweise nur 10 Fragen). Diese sollen durch umfassende, hochwertige Quizzes mit 15-20 Fragen pro Thema ersetzt werden. Alle Inhalte müssen in korrektem Deutsch mit UTF-8-Kodierung verfasst sein, um Umlaute und Sonderzeichen korrekt darzustellen.

Die Quizzes sollen prüfungsrelevante Inhalte für die IHK-Prüfung "Fachinformatiker Anwendungsentwicklung" abdecken und den Lernenden eine realistische Vorbereitung ermöglichen.

## Requirements

### Requirement 1: Vollständige Quiz-Abdeckung für alle Module

**User Story:** Als Lernender möchte ich für jedes relevante Lernmodul ein umfassendes Quiz haben, damit ich mein Wissen zu allen Themen testen kann.

#### Acceptance Criteria

1. WHEN ein Modul in src/data/ihk/modules existiert THEN SHALL ein entsprechendes Quiz in src/data/ihk/quizzes existieren
2. WHEN ein Quiz erstellt wird THEN SHALL es die korrekte moduleId-Referenz zum zugehörigen Modul enthalten
3. WHEN alle Module überprüft werden THEN SHALL für mindestens 30 Module vollständige Quizzes existieren
4. IF ein Modul sehr umfangreich ist THEN SHALL es in mehrere thematische Quizzes aufgeteilt werden können

### Requirement 2: Standardisierter Umfang von 15-20 Fragen pro Quiz

**User Story:** Als Lernender möchte ich Quizzes mit ausreichend Fragen (15-20), damit ich mein Wissen umfassend testen kann, ohne dass das Quiz zu lang wird.

#### Acceptance Criteria

1. WHEN ein Quiz erstellt wird THEN SHALL es mindestens 15 Fragen enthalten
2. WHEN ein Quiz erstellt wird THEN SHALL es maximal 20 Fragen enthalten
3. WHEN ein bestehendes Quiz weniger als 15 Fragen hat THEN SHALL es auf 15-20 Fragen erweitert werden
4. WHEN ein Quiz mehr als 20 Fragen hat THEN SHALL es in mehrere thematische Quizzes aufgeteilt werden
5. WHEN Fragen erstellt werden THEN SHALL sie verschiedene Schwierigkeitsgrade abdecken (einfach, mittel, schwer)

### Requirement 3: Korrekte deutsche Sprache mit UTF-8-Kodierung

**User Story:** Als deutschsprachiger Lernender möchte ich alle Inhalte in korrektem Deutsch mit korrekten Umlauten lesen, damit ich die Fragen und Antworten ohne Verständnisprobleme verstehe.

#### Acceptance Criteria

1. WHEN eine Quiz-Datei gespeichert wird THEN SHALL sie UTF-8-Kodierung verwenden
2. WHEN Text deutsche Umlaute enthält THEN SHALL diese als ä, ö, ü, Ä, Ö, Ü dargestellt werden (nicht ae, oe, ue)
3. WHEN Text das Eszett enthält THEN SHALL es als ß dargestellt werden
4. WHEN Fragen formuliert werden THEN SHALL sie grammatikalisch korrektes Deutsch verwenden
5. WHEN Antworten formuliert werden THEN SHALL sie in vollständigen deutschen Sätzen oder korrekten Fachbegriffen sein
6. WHEN Erklärungen geschrieben werden THEN SHALL sie verständliches, fachlich korrektes Deutsch verwenden

### Requirement 4: Realistische Multiple-Choice-Fragen mit Ablenkern

**User Story:** Als Lernender möchte ich realistische Prüfungsfragen mit plausiblen Ablenkern, damit ich mich optimal auf die echte IHK-Prüfung vorbereiten kann.

#### Acceptance Criteria

1. WHEN eine Frage erstellt wird THEN SHALL sie 4 Antwortoptionen enthalten
2. WHEN Antwortoptionen erstellt werden THEN SHALL die falschen Antworten plausible Ablenker sein (keine offensichtlich falschen Antworten)
3. WHEN eine single-choice Frage erstellt wird THEN SHALL genau eine Antwort korrekt sein
4. WHEN eine multiple-choice Frage erstellt wird THEN SHALL mindestens 2 und maximal 3 Antworten korrekt sein
5. WHEN Fragen formuliert werden THEN SHALL sie eindeutig und ohne Interpretationsspielraum sein
6. WHEN Code-Fragen verwendet werden THEN SHALL der Code syntaktisch korrekt und ausführbar sein

### Requirement 5: Umfassende Erklärungen für jede Frage

**User Story:** Als Lernender möchte ich zu jeder Frage eine ausführliche Erklärung erhalten, damit ich aus meinen Fehlern lernen und mein Verständnis vertiefen kann.

#### Acceptance Criteria

1. WHEN eine Frage beantwortet wird THEN SHALL eine Erklärung angezeigt werden
2. WHEN eine Erklärung geschrieben wird THEN SHALL sie erklären, warum die richtige Antwort korrekt ist
3. WHEN eine Erklärung geschrieben wird THEN SHALL sie auch erklären, warum die falschen Antworten falsch sind (wenn relevant)
4. WHEN eine Erklärung geschrieben wird THEN SHALL sie zusätzliche Kontext-Informationen oder Merkhilfen enthalten
5. WHEN eine Erklärung geschrieben wird THEN SHALL sie mindestens 50 Zeichen lang sein
6. WHEN Code-Fragen erklärt werden THEN SHALL die Erklärung den Code-Ablauf beschreiben

### Requirement 6: Thematische Kategorisierung und Metadaten

**User Story:** Als Lernender möchte ich Quizzes nach Kategorie, Schwierigkeit und Prüfungsrelevanz filtern können, damit ich gezielt die für mich relevanten Inhalte üben kann.

#### Acceptance Criteria

1. WHEN ein Quiz erstellt wird THEN SHALL es eine category haben (FÜ-01 bis FÜ-04 oder BP-01 bis BP-05)
2. WHEN ein Quiz erstellt wird THEN SHALL es eine difficulty haben (beginner, intermediate, advanced)
3. WHEN ein Quiz erstellt wird THEN SHALL es eine examRelevance haben (high, medium, low)
4. WHEN ein Quiz erstellt wird THEN SHALL es einen timeLimit in Minuten haben
5. WHEN ein Quiz erstellt wird THEN SHALL es einen passingScore (typisch 70%) haben
6. WHEN ein Quiz zu neuen 2025-Themen gehört THEN SHALL es das Flag newIn2025: true haben
7. WHEN ein Quiz erstellt wird THEN SHALL es relevante tags enthalten

### Requirement 7: Vielfältige Fragetypen

**User Story:** Als Lernender möchte ich verschiedene Fragetypen bearbeiten (Single-Choice, Multiple-Choice, Code-Fragen), damit das Lernen abwechslungsreich bleibt und verschiedene Kompetenzen geprüft werden.

#### Acceptance Criteria

1. WHEN ein Quiz erstellt wird THEN SHALL es mindestens 60% single-choice Fragen enthalten
2. WHEN ein Quiz erstellt wird THEN SHALL es 20-30% multiple-choice Fragen enthalten
3. WHEN das Thema Code-bezogen ist THEN SHALL das Quiz 10-20% code-Fragen enthalten
4. WHEN eine code-Frage erstellt wird THEN SHALL sie ein code-Feld und ein language-Feld haben
5. WHEN Fragen gemischt werden THEN SHALL schwierigere Fragetypen (multiple-choice, code) höhere Punktzahlen haben

### Requirement 8: Prüfungsrelevante Inhalte für IHK AP2

**User Story:** Als Prüfling möchte ich Quizzes, die die tatsächlichen IHK-Prüfungsthemen abdecken, damit ich mich gezielt auf die Abschlussprüfung Teil 2 vorbereiten kann.

#### Acceptance Criteria

1. WHEN Fragen erstellt werden THEN SHALL sie sich an den IHK-Prüfungskatalogen orientieren
2. WHEN neue 2025-Themen existieren THEN SHALL diese besonders gekennzeichnet sein (newIn2025: true)
3. WHEN Fragen zu Kernthemen erstellt werden THEN SHALL diese als examRelevance: "high" markiert sein
4. WHEN praktische Szenarien relevant sind THEN SHALL Szenario-basierte Fragen enthalten sein
5. WHEN Code-Beispiele verwendet werden THEN SHALL sie praxisrelevant und prüfungsnah sein

### Requirement 9: Konsistente Dateistruktur und Namenskonventionen

**User Story:** Als Entwickler möchte ich eine konsistente Dateistruktur und Namenskonventionen, damit das System wartbar bleibt und neue Quizzes einfach hinzugefügt werden können.

#### Acceptance Criteria

1. WHEN ein Quiz erstellt wird THEN SHALL die Datei nach dem Schema {moduleId}-quiz.json benannt sein
2. WHEN ein Quiz erstellt wird THEN SHALL die id dem Schema {moduleId}-quiz entsprechen
3. WHEN mehrere Quizzes für ein Modul existieren THEN SHALL sie nach dem Schema {moduleId}-{topic}-quiz.json benannt sein
4. WHEN ein Quiz erstellt wird THEN SHALL es alle Pflichtfelder aus dem Template enthalten
5. WHEN ein Quiz gespeichert wird THEN SHALL es valides JSON sein
6. WHEN ein Quiz aktualisiert wird THEN SHALL das lastUpdated-Feld aktualisiert werden

### Requirement 10: Qualitätssicherung und Validierung

**User Story:** Als Systemadministrator möchte ich sicherstellen, dass alle Quizzes validiert und qualitätsgeprüft sind, damit Lernende keine fehlerhaften Inhalte erhalten.

#### Acceptance Criteria

1. WHEN ein Quiz erstellt wird THEN SHALL es durch den QuizValidator validiert werden
2. WHEN eine Frage erstellt wird THEN SHALL die correctAnswer in den options vorhanden sein
3. WHEN eine multiple-choice Frage erstellt wird THEN SHALL alle correctAnswer-Einträge in den options vorhanden sein
4. WHEN ein Quiz gespeichert wird THEN SHALL es keine doppelten Fragen-IDs enthalten
5. WHEN Fragen erstellt werden THEN SHALL sie eindeutige IDs innerhalb des Quiz haben
6. WHEN Code-Fragen erstellt werden THEN SHALL der Code syntaktisch korrekt sein
7. WHEN ein Quiz fertiggestellt wird THEN SHALL es manuell auf fachliche Korrektheit geprüft werden
