# Design Document - Comprehensive Quiz Rework

## Overview

Dieses Design beschreibt die vollständige Überarbeitung des Quiz-Systems für die IHK-Lernplattform. Das Ziel ist es, für jedes der 30+ Module hochwertige Quizzes mit 15-20 Fragen zu erstellen, die in korrektem Deutsch mit UTF-8-Kodierung verfasst sind und prüfungsrelevante Inhalte für die IHK-Prüfung "Fachinformatiker Anwendungsentwicklung" abdecken.

## Architecture

### Datenstruktur

Die Quiz-Daten werden als JSON-Dateien im Verzeichnis `src/data/ihk/quizzes/` gespeichert. Jedes Quiz folgt einem standardisierten Schema, das durch den `QuizValidator` validiert wird.

```
src/data/ihk/
├── quizzes/
│   ├── bp-01-conception-quiz.json
│   ├── bp-01-documentation-quiz.json
│   ├── bp-01-kerberos-quiz.json
│   ├── ... (weitere Quizzes)
│   └── fue-04-security-threats-quiz.json
├── modules/
│   └── ... (Modul-Definitionen)
└── templates/
    └── quiz-template.json
```

### Quiz-Schema

Jedes Quiz folgt diesem Schema:

```json
{
  "id": "string (eindeutig)",
  "moduleId": "string (Referenz zum Modul)",
  "title": "string (deutscher Titel)",
  "description": "string (deutsche Beschreibung)",
  "category": "FÜ-01|FÜ-02|FÜ-03|FÜ-04|BP-01|BP-02|BP-03|BP-04|BP-05",
  "difficulty": "beginner|intermediate|advanced",
  "examRelevance": "high|medium|low",
  "newIn2025": boolean,
  "timeLimit": number (Minuten),
  "passingScore": number (Prozent),
  "questions": [
    {
      "id": "string",
      "type": "single-choice|multiple-choice|code|true-false",
      "question": "string (deutsche Frage)",
      "code": "string (optional, für Code-Fragen)",
      "language": "string (optional, z.B. 'java', 'sql')",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string | string[]",
      "explanation": "string (ausführliche deutsche Erklärung)",
      "points": number,
      "category": "string (Unterkategorie)"
    }
  ],
  "tags": ["string"],
  "lastUpdated": "ISO-8601 Datum"
}
```

## Components and Interfaces

### 1. Quiz-Generierungs-Workflow

Der Workflow zur Erstellung neuer Quizzes:

```
1. Modul-Analyse
   ↓
2. Themen-Identifikation
   ↓
3. Fragen-Erstellung (15-20 pro Quiz)
   ↓
4. Validierung (QuizValidator)
   ↓
5. UTF-8-Kodierung prüfen
   ↓
6. Speicherung
```

### 2. Fragen-Typen und Verteilung

Für jedes Quiz wird folgende Verteilung angestrebt:

- **60-70% Single-Choice**: Grundlegende Konzepte, Definitionen, Verständnisfragen
- **20-30% Multiple-Choice**: Komplexere Zusammenhänge, mehrere korrekte Aspekte
- **10-20% Code-Fragen**: Praktische Anwendung (nur bei Code-relevanten Themen)
- **Optional: True-False**: Für einfache Fakten-Checks

### 3. Schwierigkeitsgrad-Verteilung

Jedes Quiz sollte eine ausgewogene Mischung haben:

- **30-40% Einfach (beginner)**: Grundlegende Definitionen, Fakten
- **40-50% Mittel (intermediate)**: Anwendung, Verständnis, Zusammenhänge
- **20-30% Schwer (advanced)**: Komplexe Szenarien, Problemlösung, Code-Analyse

### 4. Punktevergabe

- Single-Choice: 1 Punkt
- Multiple-Choice: 2 Punkte
- Code-Fragen: 2-3 Punkte (je nach Komplexität)
- Szenario-Fragen: 2-3 Punkte

## Data Models

### Quiz-Kategorien

Die Quizzes werden nach dem IHK-Prüfungskatalog kategorisiert:

**Fachübergreifende Qualifikationen (FÜ):**

- FÜ-01: Projektplanung und -durchführung
- FÜ-02: Entwicklung und Bereitstellung
- FÜ-03: Qualitätssicherung und Testing
- FÜ-04: IT-Sicherheit

**Berufsspezifische Qualifikationen (BP):**

- BP-01: Konzeption und Design
- BP-02: Datenbanken und Datenformate
- BP-03: Softwareentwicklung und Qualität
- BP-04: Architektur und Patterns
- BP-05: Algorithmen und Datenstrukturen

### Modul-zu-Quiz-Mapping

Jedes Modul erhält mindestens ein Quiz. Umfangreiche Module können in mehrere thematische Quizzes aufgeteilt werden:

| Modul                     | Quiz(zes)              | Anzahl Fragen   |
| ------------------------- | ---------------------- | --------------- |
| bp-01-kerberos            | kerberos-quiz          | 15-20           |
| bp-01-conception          | conception-quiz        | 15-20           |
| bp-04-scrum               | scrum-quiz             | 15-20           |
| sql-ddl, sql-dml, sql-dql | sql-comprehensive-quiz | 20 (aufgeteilt) |
| fue-04-security-threats   | security-threats-quiz  | 20              |

## Error Handling

### Validierung

Der `QuizValidator` prüft:

1. **Strukturelle Validierung**:
   - Alle Pflichtfelder vorhanden
   - Korrekte Datentypen
   - Gültiges JSON

2. **Inhaltliche Validierung**:
   - correctAnswer in options vorhanden
   - Eindeutige Fragen-IDs
   - Mindestens 15, maximal 20 Fragen
   - Erklärungen mindestens 50 Zeichen

3. **UTF-8-Validierung**:
   - Keine falschen Kodierungen (ae statt ä)
   - Korrekte Umlaute und Sonderzeichen

### Fehlerbehandlung

```javascript
try {
  const quiz = JSON.parse(quizContent);
  const validation = QuizValidator.validate(quiz);

  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    // Fehler ausgeben und Korrektur anfordern
  }
} catch (error) {
  console.error('JSON parsing error:', error);
  // Syntaxfehler beheben
}
```

## Testing Strategy

### 1. Automatisierte Tests

**Validierungs-Tests**:

```javascript
// Test: Quiz hat 15-20 Fragen
test('Quiz should have 15-20 questions', () => {
  const quiz = loadQuiz('bp-01-kerberos-quiz.json');
  expect(quiz.questions.length).toBeGreaterThanOrEqual(15);
  expect(quiz.questions.length).toBeLessThanOrEqual(20);
});

// Test: Alle correctAnswer in options vorhanden
test('All correct answers should be in options', () => {
  const quiz = loadQuiz('bp-01-kerberos-quiz.json');
  quiz.questions.forEach(q => {
    if (Array.isArray(q.correctAnswer)) {
      q.correctAnswer.forEach(answer => {
        expect(q.options).toContain(answer);
      });
    } else {
      expect(q.options).toContain(q.correctAnswer);
    }
  });
});

// Test: UTF-8-Kodierung korrekt
test('Quiz should use proper UTF-8 encoding', () => {
  const quiz = loadQuiz('bp-01-kerberos-quiz.json');
  const content = JSON.stringify(quiz);

  // Keine falschen Kodierungen
  expect(content).not.toMatch(/ae(?![a-z])/); // ä statt ae
  expect(content).not.toMatch(/oe(?![a-z])/); // ö statt oe
  expect(content).not.toMatch(/ue(?![a-z])/); // ü statt ue
});
```

### 2. Manuelle Qualitätsprüfung

Für jedes Quiz:

- [ ] Fachliche Korrektheit der Fragen
- [ ] Plausibilität der Ablenker
- [ ] Verständlichkeit der Erklärungen
- [ ] Grammatik und Rechtschreibung
- [ ] Prüfungsrelevanz der Inhalte

### 3. Integrationstests

```javascript
// Test: Quiz kann geladen und angezeigt werden
test('Quiz can be loaded and displayed', () => {
  const quizService = new QuizService();
  const quiz = quizService.getQuizById('bp-01-kerberos-quiz');

  expect(quiz).toBeDefined();
  expect(quiz.questions.length).toBeGreaterThan(0);
});

// Test: Quiz-Ergebnisse werden korrekt berechnet
test('Quiz results are calculated correctly', () => {
  const quiz = loadQuiz('bp-01-kerberos-quiz.json');
  const answers = {
    q1: 'Zentrale Authentifizierung und Ticket-Ausgabe',
    q2: 'Authentication Server (AS) und Ticket Granting Server (TGS)',
    // ...
  };

  const result = calculateQuizResult(quiz, answers);
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
});
```

## Content Creation Guidelines

### Fragen-Erstellung

#### 1. Gute Fragen schreiben

**DO:**

- Klare, eindeutige Formulierung
- Prüfungsrelevante Inhalte
- Realistische Szenarien
- Fachlich korrekt

**DON'T:**

- Doppelte Verneinungen
- Mehrdeutige Formulierungen
- Triviale Fragen
- Trick-Fragen ohne Lernwert

#### 2. Plausible Ablenker erstellen

**Gute Ablenker:**

- Klingen plausibel
- Basieren auf häufigen Missverständnissen
- Sind fachlich verwandt
- Erfordern echtes Verständnis zur Unterscheidung

**Schlechte Ablenker:**

- Offensichtlich falsch
- Unsinnig oder absurd
- Nicht zum Thema passend

#### 3. Erklärungen schreiben

Jede Erklärung sollte:

- Warum die richtige Antwort korrekt ist
- Warum die falschen Antworten falsch sind (wenn relevant)
- Zusätzlichen Kontext oder Merkhilfen
- Mindestens 50 Zeichen, idealerweise 100-200 Zeichen

**Beispiel:**

```json
{
  "question": "Was ist die Hauptfunktion des Key Distribution Center (KDC) in Kerberos?",
  "correctAnswer": "Zentrale Authentifizierung und Ticket-Ausgabe",
  "explanation": "Das KDC ist die zentrale Vertrauensinstanz in Kerberos und besteht aus dem Authentication Server (AS) und dem Ticket Granting Server (TGS). Es authentifiziert Benutzer und stellt Tickets aus. Die anderen Optionen beschreiben keine Funktionen des KDC."
}
```

### UTF-8 und deutsche Sprache

#### Korrekte Verwendung von Umlauten

**Richtig:**

- ä, ö, ü, Ä, Ö, Ü, ß
- "Schlüssel", "Größe", "Übertragung"
- "Prüfung", "Qualität", "Lösung"

**Falsch:**

- ae, oe, ue, ss (außer in Eigennamen)
- "Schluessel", "Groesse", "Uebertragung"

#### Fachbegriffe

Viele IT-Fachbegriffe bleiben englisch:

- "Server", "Client", "Router"
- "Framework", "Pattern", "Interface"

Deutsche Übersetzungen verwenden, wo üblich:

- "Datenbank" (nicht "Database")
- "Netzwerk" (nicht "Network")
- "Verschlüsselung" (nicht "Encryption")

## Quiz-Erstellungs-Prozess

### Phase 1: Modul-Analyse (pro Modul)

1. Modul-Inhalt lesen und verstehen
2. Kernthemen identifizieren
3. Prüfungsrelevanz bewerten
4. Lernziele definieren

### Phase 2: Fragen-Planung

1. 15-20 Fragen planen
2. Themen-Verteilung festlegen
3. Schwierigkeitsgrade verteilen
4. Fragetypen auswählen

### Phase 3: Fragen-Erstellung

1. Fragen formulieren
2. Antwortoptionen erstellen
3. Ablenker entwickeln
4. Erklärungen schreiben

### Phase 4: Review und Validierung

1. QuizValidator ausführen
2. UTF-8-Kodierung prüfen
3. Fachliche Korrektheit prüfen
4. Grammatik und Rechtschreibung prüfen

### Phase 5: Integration

1. Quiz-Datei speichern
2. Modul-Referenz aktualisieren
3. Tags und Metadaten setzen
4. lastUpdated aktualisieren

## Priorisierung der Module

### Priorität 1: Neue 2025-Themen (newIn2025: true)

Diese Themen sind besonders wichtig, da sie neu im Prüfungskatalog sind:

1. bp-01-kerberos ✓ (bereits vorhanden, 10 Fragen → erweitern auf 15)
2. fue-04-security-threats ✓ (bereits vorhanden, 22 Fragen → auf 20 reduzieren)
3. bp-04-scrum (5 Fragen → erweitern auf 15-20)
4. bp-03-tdd (Fragen prüfen und ggf. erweitern)
5. sql-ddl, sql-dml, sql-dql ✓ (sql-comprehensive-quiz vorhanden, 35 Fragen → auf 20 reduzieren oder aufteilen)

### Priorität 2: Hohe Prüfungsrelevanz (examRelevance: high)

Module mit hoher Prüfungsrelevanz:

1. bp-01-conception (Netzwerke, Protokolle)
2. bp-01-documentation
3. bp-02-data-formats (JSON, XML, YAML)
4. bp-03-rest-api
5. bp-04-design-patterns
6. bp-04-architecture-patterns
7. bp-05-data-structures
8. bp-05-sorting
9. fue-01-planning
10. fue-02-development
11. fue-03-quality

### Priorität 3: Mittlere Prüfungsrelevanz

Alle weiteren Module mit vollständigen Quizzes ausstatten.

## Qualitätskriterien

Ein Quiz gilt als "fertig", wenn:

- [ ] 15-20 Fragen vorhanden
- [ ] Alle Fragen haben 4 Antwortoptionen
- [ ] Alle correctAnswer sind in options vorhanden
- [ ] Alle Erklärungen sind mindestens 50 Zeichen lang
- [ ] UTF-8-Kodierung ist korrekt (ä, ö, ü, ß)
- [ ] Keine grammatikalischen Fehler
- [ ] Fachlich korrekt
- [ ] QuizValidator gibt keine Fehler
- [ ] Schwierigkeitsgrade sind ausgewogen
- [ ] Fragetypen sind gemischt
- [ ] Metadaten sind vollständig (category, difficulty, examRelevance, etc.)

## Maintenance und Updates

### Regelmäßige Überprüfung

- Jährliche Überprüfung auf Aktualität
- Anpassung an neue Prüfungskataloge
- Feedback von Nutzern einarbeiten

### Versionierung

- lastUpdated-Feld bei jeder Änderung aktualisieren
- Größere Änderungen dokumentieren
- Alte Versionen archivieren (optional)

## Tools und Hilfsmittel

### Validierungs-Script

```javascript
// scripts/validate-all-quizzes.js
const fs = require('fs');
const path = require('path');
const QuizValidator = require('../src/utils/validators/QuizValidator');

const quizzesDir = path.join(__dirname, '../src/data/ihk/quizzes');
const files = fs.readdirSync(quizzesDir);

let errors = 0;

files.forEach(file => {
  if (!file.endsWith('.json')) return;

  const content = fs.readFileSync(path.join(quizzesDir, file), 'utf8');
  const quiz = JSON.parse(content);

  const validation = QuizValidator.validate(quiz);

  if (!validation.isValid) {
    console.error(`❌ ${file}:`);
    validation.errors.forEach(err => console.error(`  - ${err}`));
    errors++;
  } else {
    console.log(`✓ ${file}`);
  }
});

console.log(`\n${files.length - errors}/${files.length} quizzes valid`);
process.exit(errors > 0 ? 1 : 0);
```

### UTF-8-Prüfungs-Script

```javascript
// scripts/check-utf8-encoding.js
const fs = require('fs');
const path = require('path');

const quizzesDir = path.join(__dirname, '../src/data/ihk/quizzes');
const files = fs.readdirSync(quizzesDir);

const problematicPatterns = [
  { pattern: /\bae\b/g, should: 'ä' },
  { pattern: /\boe\b/g, should: 'ö' },
  { pattern: /\bue\b/g, should: 'ü' },
  { pattern: /\bAe\b/g, should: 'Ä' },
  { pattern: /\bOe\b/g, should: 'Ö' },
  { pattern: /\bUe\b/g, should: 'Ü' },
];

files.forEach(file => {
  if (!file.endsWith('.json')) return;

  const content = fs.readFileSync(path.join(quizzesDir, file), 'utf8');

  problematicPatterns.forEach(({ pattern, should }) => {
    const matches = content.match(pattern);
    if (matches) {
      console.warn(`⚠️  ${file}: Found "${matches[0]}", should be "${should}"`);
    }
  });
});
```

## Beispiel: Vollständiges Quiz

Siehe `src/data/ihk/quizzes/kerberos-quiz.json` und `src/data/ihk/quizzes/security-threats-quiz.json` als Referenz-Implementierungen.

## Zusammenfassung

Dieses Design beschreibt einen systematischen Ansatz zur Erstellung hochwertiger, prüfungsrelevanter Quizzes für die IHK-Lernplattform. Durch die Einhaltung der definierten Standards, Validierungsprozesse und Qualitätskriterien wird sichergestellt, dass alle Quizzes:

- Fachlich korrekt sind
- Prüfungsrelevante Inhalte abdecken
- In korrektem Deutsch mit UTF-8-Kodierung verfasst sind
- Eine ausgewogene Mischung aus Schwierigkeitsgraden und Fragetypen bieten
- Den Lernenden optimal auf die IHK-Prüfung vorbereiten
