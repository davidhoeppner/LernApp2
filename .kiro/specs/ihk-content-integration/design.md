# Design Document - IHK Content Integration

## Overview

Dieses Design-Dokument beschreibt die Architektur und Datenstrukturen für die Integration von IHK Fachinformatiker Anwendungsentwicklung Lerninhalten in die Simple Learning App. Der Fokus liegt auf einer skalierbaren, wartbaren JSON-Struktur, die alle Anforderungen des neuen Prüfungskatalogs ab 2025 abdeckt.

## JSON Data Structure

### Module Structure

```json
{
  "id": "string (unique identifier)",
  "title": "string",
  "description": "string",
  "category": "string (FÜ-01, FÜ-02, BP-01, etc.)",
  "subcategory": "string (detailed subcategory)",
  "difficulty": "beginner | intermediate | advanced",
  "examRelevance": "high | medium | low",
  "newIn2025": boolean,
  "removedIn2025": boolean,
  "important": boolean,
  "estimatedTime": number (minutes),
  "prerequisites": ["array of module IDs"],
  "tags": ["array of keywords"],
  "content": "string (markdown format)",
  "codeExamples": [
    {
      "language": "java | python | sql | javascript",
      "code": "string",
      "explanation": "string",
      "title": "string"
    }
  ],
  "relatedQuizzes": ["array of quiz IDs"],
  "resources": [
    {
      "title": "string",
      "url": "string",
      "type": "video | article | documentation"
    }
  ],
  "lastUpdated": "ISO 8601 date string",
  "version": "string"
}
```

### Quiz Structure

```json
{
  "id": "string (unique identifier)",
  "moduleId": "string (reference to module)",
  "title": "string",
  "description": "string",
  "category": "string (FÜ-01, BP-01, etc.)",
  "difficulty": "beginner | intermediate | advanced",
  "examRelevance": "high | medium | low",
  "newIn2025": boolean,
  "timeLimit": number (minutes, optional),
  "passingScore": number (percentage),
  "questions": [
    {
      "id": "string",
      "type": "multiple-choice | single-choice | code | true-false",
      "question": "string (markdown supported)",
      "code": "string (optional, for code-based questions)",
      "language": "string (optional, for syntax highlighting)",
      "options": ["array of strings"],
      "correctAnswer": "string | array of strings",
      "explanation": "string (markdown supported)",
      "points": number,
      "category": "string (subcategory for statistics)"
    }
  ],
  "tags": ["array of keywords"],
  "lastUpdated": "ISO 8601 date string"
}
```

### Category Taxonomy Structure

```json
{
  "categories": [
    {
      "id": "FÜ-01",
      "name": "Planen eines Softwareproduktes",
      "description": "Fachrichtungsübergreifende Inhalte",
      "subcategories": [
        {
          "id": "FÜ-01.01",
          "name": "Kundenanforderungen analysieren",
          "examRelevance": "high",
          "newIn2025": false,
          "removedIn2025": false
        }
      ]
    },
    {
      "id": "BP-01",
      "name": "Konzipieren und Umsetzen von kundenspezifischen Softwareanwendungen",
      "description": "Berufsprofilgebende Inhalte Anwendungsentwicklung",
      "subcategories": []
    }
  ]
}
```

### Learning Path Structure

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "targetExam": "AP2-2025",
  "difficulty": "beginner | intermediate | advanced",
  "estimatedDuration": number (hours),
  "modules": [
    {
      "moduleId": "string",
      "order": number,
      "required": boolean
    }
  ],
  "quizzes": [
    {
      "quizId": "string",
      "order": number,
      "unlockAfterModules": ["array of module IDs"]
    }
  ],
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "requiredModules": ["array of module IDs"],
      "requiredQuizzes": ["array of quiz IDs"]
    }
  ]
}
```

## Content Categories Based on 2025 Exam Catalog

### Fachrichtungsübergreifende Inhalte (FÜ)

#### FÜ-01: Planen eines Softwareproduktes
- Kundenanforderungen analysieren
- Projektplanung
- Wirtschaftlichkeitsberechnung

#### FÜ-02: Entwickeln und Bereitstellen von Softwareanwendungen
- **NEU 2025**: Anomalien/Redundanzen in Datenbanken erkennen
- **NEU 2025**: SQL (detailliertes Beiblatt) - siehe separate SQL-Sektion
- Kontrollstrukturen mit Aktivitätsdiagramm oder Pseudocode
- **ENTFERNT**: Struktogramm und PAP

#### FÜ-03: Durchführen von qualitätssichernden Maßnahmen
- **NEU 2025**: Last-/Performancetests
- Software-Test (Black Box, White Box, Review, Extremwertetest)

#### FÜ-04: Sicherstellen der Informationssicherheit
- **NEU 2025**: Bedrohungsszenarien (Man-in-the-Middle, SQL-Injection, DDoS)
- Technisch Organisatorische Maßnahmen (TOM)
- Datenschutz und Datensicherheit

### Berufsprofilgebende Inhalte Anwendungsentwicklung (BP)

#### BP-01: Konzipieren und Umsetzen von kundenspezifischen Softwareanwendungen
- **NEU 2025**: Kerberos (Zugriffskontrolle)
- **NEU 2025**: ODBC (Datenabruf)
- **NEU 2025**: Monitoring von Systemen
- **NEU 2025**: Programm- und Konfigurationsdokumentation
- Netzwerktopologien und -protokolle

#### BP-02: Sicherstellen der Qualität von Softwareanwendungen
- **NEU 2025**: NAS und SAN
- Datenaustauschformate (XML, JSON, CSV)
- Verschlüsselung (z.B. Bitlocker)
- Cloud-Modelle (SaaS, IaaS, PaaS)

#### BP-03: Entwickeln von Softwareanwendungen
- **NEU 2025**: Softwarequalitätsmerkmale (ISO 25001)
- **NEU 2025**: Cyber-physische Systeme
- **NEU 2025**: Test Driven Development (TDD)
- API-Entwicklung (z.B. REST)

#### BP-04: Projektmanagement und Softwareentwicklungsmethoden
- **NEU 2025**: Scrum (explizit genannt)
- **NEU 2025**: Architektur-Pattern (zusätzlich zu Design-Pattern)
- **NEU 2025**: Kapselung in OOP
- **ENTFERNT**: Programmierparadigmen

#### BP-05: Objektorientierte Programmierung und Algorithmen
- **NEU 2025**: Sortierverfahren (Bubble, Selection, Insertion Sort)
- **NEU 2025**: SQL mit Verweis auf Beiblatt
- Objektorientierte Konzepte
- Datenstrukturen

## SQL Beiblatt Content (Detailliert)

Basierend auf dem 2-seitigen Beiblatt, das der Prüfung beiliegt:

### DDL (Data Definition Language)
```sql
-- Tabellenstruktur
CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
);

ALTER TABLE table_name
ADD column_name datatype;

ALTER TABLE table_name
DROP COLUMN column_name;

-- Index
CREATE INDEX index_name
ON table_name (column_name);
```

### DML (Data Manipulation Language)
```sql
-- INSERT
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);

-- UPDATE
UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition;

-- DELETE
DELETE FROM table_name
WHERE condition;
```

### DQL (Data Query Language)
```sql
-- Projektion
SELECT column1, column2, ...
FROM table_name;

-- Selektion
SELECT *
FROM table_name
WHERE condition;

-- Subquery
SELECT column1
FROM table_name
WHERE column2 IN (SELECT column FROM other_table);

-- Sortieren
SELECT *
FROM table_name
ORDER BY column1 ASC, column2 DESC;

-- Gruppieren
SELECT column1, COUNT(*)
FROM table_name
GROUP BY column1
HAVING COUNT(*) > 1;

-- Joins
SELECT t1.column1, t2.column2
FROM table1 t1
INNER JOIN table2 t2 ON t1.id = t2.foreign_id;

-- Aggregatfunktionen
SELECT COUNT(*), SUM(column), AVG(column), MIN(column), MAX(column)
FROM table_name;
```

## New Topics 2025 - Detailed Content Structure

### 1. Test Driven Development (TDD)

**Module Content:**
- Was ist TDD?
- Red-Green-Refactor Zyklus
- Vorteile und Nachteile
- Unit-Tests schreiben
- Praktische Beispiele in Java/Python

**Quiz Topics:**
- TDD-Zyklus erkennen
- Test-First vs. Test-Last
- Unit-Test-Frameworks
- Code-Coverage

### 2. Scrum

**Module Content:**
- Scrum-Rollen (Product Owner, Scrum Master, Development Team)
- Scrum-Events (Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective)
- Scrum-Artefakte (Product Backlog, Sprint Backlog, Increment)
- Definition of Done
- User Stories und Story Points

**Quiz Topics:**
- Rollen zuordnen
- Events identifizieren
- Artefakte unterscheiden
- Scrum-Prinzipien

### 3. Sortierverfahren

**Module Content:**
- Bubble Sort (Algorithmus, Komplexität, Visualisierung)
- Selection Sort (Algorithmus, Komplexität, Visualisierung)
- Insertion Sort (Algorithmus, Komplexität, Visualisierung)
- Vergleich der Verfahren
- Zeitkomplexität (Best/Average/Worst Case)

**Quiz Topics:**
- Algorithmen erkennen
- Komplexität berechnen
- Sortierverfahren anwenden
- Code-Lücken füllen

### 4. Cyber-physische Systeme (CPS)

**Module Content:**
- Definition und Beispiele
- Sensoren und Aktoren
- Bibliotheken für CPS
- Abfragerhythmus planen
- Zugriff auf Hardware

**Quiz Topics:**
- Sensoren/Aktoren zuordnen
- CPS-Anwendungen erkennen
- Bibliotheken auswählen

### 5. Architektur-Pattern

**Module Content:**
- Layered Architecture (Schichtenarchitektur)
- Model-View-Controller (MVC)
- Model-View-ViewModel (MVVM)
- Microservices
- Event-Driven Architecture

**Quiz Topics:**
- Pattern erkennen
- Vor-/Nachteile benennen
- Anwendungsfälle zuordnen

### 6. Sicherheitsbedrohungen

**Module Content:**
- Man-in-the-Middle Angriffe
- SQL-Injection
- DDoS-Attacken
- Gegenmaßnahmen
- Best Practices

**Quiz Topics:**
- Angriffsszenarien erkennen
- Schutzmaßnahmen zuordnen
- Sicherheitslücken identifizieren

### 7. Kapselung in OOP

**Module Content:**
- Private, Protected, Public
- Getter und Setter
- Information Hiding
- Vorteile der Kapselung
- Code-Beispiele

**Quiz Topics:**
- Zugriffsmodifikatoren zuordnen
- Kapselung anwenden
- Code-Fehler finden

## Data Organization Strategy

### File Structure
```
src/data/
├── ihk/
│   ├── modules/
│   │   ├── fue-01-planning.json
│   │   ├── fue-02-development.json
│   │   ├── fue-03-quality.json
│   │   ├── fue-04-security.json
│   │   ├── bp-01-conception.json
│   │   ├── bp-02-quality-assurance.json
│   │   ├── bp-03-development.json
│   │   ├── bp-04-project-management.json
│   │   └── bp-05-oop-algorithms.json
│   ├── quizzes/
│   │   ├── fue-01-quiz.json
│   │   ├── fue-02-quiz.json
│   │   ├── sql-comprehensive-quiz.json
│   │   ├── tdd-quiz.json
│   │   ├── scrum-quiz.json
│   │   ├── sorting-algorithms-quiz.json
│   │   └── security-threats-quiz.json
│   ├── learning-paths/
│   │   ├── ap2-complete-path.json
│   │   ├── sql-mastery-path.json
│   │   ├── oop-fundamentals-path.json
│   │   └── new-topics-2025-path.json
│   └── metadata/
│       ├── categories.json
│       ├── exam-changes-2025.json
│       └── glossary.json
```

### Content Loading Strategy

1. **Initial Load**: Load category taxonomy and metadata
2. **Lazy Loading**: Load module content on demand
3. **Caching**: Cache loaded modules in localStorage
4. **Prefetching**: Prefetch related modules based on user progress
5. **Updates**: Check for content updates periodically

## Service Layer Extensions

### IHKContentService

```javascript
class IHKContentService {
  constructor(stateManager, storageService) {
    this.stateManager = stateManager;
    this.storageService = storageService;
    this.categories = null;
    this.examChanges = null;
  }

  async loadCategories() {
    // Load category taxonomy
  }

  async getModulesByCategory(categoryId) {
    // Get all modules for a category
  }

  async getNewTopics2025() {
    // Get all modules marked as new in 2025
  }

  async getRemovedTopics2025() {
    // Get all modules marked as removed in 2025
  }

  async searchContent(query, filters) {
    // Full-text search with filters
  }

  async getLearningPath(pathId) {
    // Get structured learning path
  }

  async getRecommendations(userId) {
    // Get personalized recommendations based on progress
  }
}
```

### ExamProgressService

```javascript
class ExamProgressService {
  constructor(stateManager, storageService) {
    this.stateManager = stateManager;
    this.storageService = storageService;
  }

  getProgressByCategory() {
    // Calculate progress for each exam category
  }

  getWeakAreas() {
    // Identify areas where user needs improvement
  }

  getExamReadiness() {
    // Calculate overall exam readiness score
  }

  getRecommendedModules() {
    // Recommend modules based on weak areas
  }

  exportProgress() {
    // Export progress for external use
  }
}
```

## UI Components

### CategoryFilter Component
- Filter by FÜ/BP categories
- Filter by exam relevance
- Filter by "New in 2025"
- Filter by difficulty

### ExamChanges2025 Component
- Highlight new topics
- Show removed topics
- Display important changes
- Link to relevant modules

### LearningPathView Component
- Display structured learning path
- Show progress through path
- Unlock modules based on prerequisites
- Milestone tracking

### SQLPlayground Component
- Interactive SQL editor
- Execute queries against sample database
- Show query results
- Provide hints and solutions

## Testing Strategy

### Content Validation
- Validate JSON structure
- Check for broken references
- Verify category assignments
- Test search functionality

### Quiz Validation
- Verify correct answers
- Check explanation quality
- Test all question types
- Validate scoring logic

### Integration Tests
- Test content loading
- Test filtering and search
- Test progress tracking
- Test learning path navigation

## Performance Considerations

### Content Size Management
- Split large modules into smaller chunks
- Lazy load code examples
- Compress JSON data
- Use pagination for large lists

### Caching Strategy
- Cache frequently accessed modules
- Cache quiz results
- Cache user progress
- Implement cache invalidation

### Search Optimization
- Index content for fast search
- Use debouncing for search input
- Implement fuzzy search
- Cache search results

## Accessibility

### Content Accessibility
- Provide alt text for diagrams
- Ensure code examples are screen-reader friendly
- Use semantic HTML in markdown
- Provide keyboard navigation

### Quiz Accessibility
- Announce quiz progress to screen readers
- Provide clear focus indicators
- Support keyboard-only interaction
- Provide time extensions option

## Summary

Diese Design-Struktur bietet eine skalierbare, wartbare Lösung für die Integration von IHK-Lerninhalten. Die JSON-Struktur ist flexibel genug, um alle Anforderungen des Prüfungskatalogs 2025 abzudecken, und die Service-Layer-Erweiterungen ermöglichen eine effiziente Verwaltung und Bereitstellung der Inhalte.

Die Trennung von Modulen, Quizzes und Lernpfaden ermöglicht eine flexible Zusammenstellung von Lerninhalten, während die Kategorisierung nach Prüfungskatalog eine gezielte Prüfungsvorbereitung unterstützt.
