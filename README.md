# IHK Fachinformatiker Lern-App 📚

Eine moderne, interaktive Lern-App zur Vorbereitung auf die IHK-Abschlussprüfung Teil 2 für Fachinformatiker Anwendungsentwicklung.

## ✨ Features

### 📖 Umfangreiche Lerninhalte
- **31 IHK-Module** mit detaillierten Erklärungen
- **9 interaktive Quizze** zum Testen des Wissens
- **4 Lernpfade** für strukturiertes Lernen
- Alle Inhalte basieren auf dem **IHK-Prüfungskatalog 2025**

### 🎯 Neue Themen 2025
- ✅ Aktivitätsdiagramme und Pseudocode (statt Struktogramme)
- ✅ Test-Driven Development (TDD)
- ✅ Scrum und agile Methoden
- ✅ Sortierverfahren (Bubble Sort, Selection Sort, Insertion Sort)
- ✅ Last- und Performancetests

### 💡 Intelligente Features
- **Fortschrittsverfolgung**: Behalte den Überblick über abgeschlossene Module und Quiz-Versuche
- **Prüfungsbereitschaft**: Detaillierte Analyse deiner Prüfungsvorbereitung mit Schwachstellenerkennung
- **Personalisierte Empfehlungen**: Intelligente Vorschläge basierend auf deinem Lernfortschritt
- **Einheitliches Quiz-System**: Alle 9 Quizze nutzen das fortschrittliche IHK-Quiz-Interface
- **Code-Highlighting**: Syntax-Highlighting in Quizfragen und Modulen
- **Detaillierte Erklärungen**: Jede Quiz-Antwort enthält ausführliche Erklärungen
- **Erweiterte Suche**: Volltextsuche mit Kategorie- und Schwierigkeitsfiltern
- **Markdown-Rendering**: Schön formatierte Inhalte mit Syntax-Highlighting
- **Responsive Design**: Funktioniert auf Desktop, Tablet und Smartphone
- **Dark/Light Mode**: Automatische Theme-Anpassung
- **Offline-fähig**: Alle Daten lokal gespeichert
- **Barrierefreiheit**: WCAG 2.1 AA konform
- **Export-Funktion**: Exportiere deinen Lernfortschritt als JSON

## 🚀 Quick Start

### Voraussetzungen
- Node.js 20.19+ oder 22.12+
- npm oder yarn

### Installation

```bash
# Repository klonen
git clone https://github.com/DEIN-USERNAME/ihk-lern-app.git
cd ihk-lern-app

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

### Production Build

```bash
# Build erstellen
npm run build

# Build lokal testen
npm run preview
```

## 📂 Projektstruktur

```
├── src/
│   ├── components/          # UI-Komponenten
│   │   ├── IHKModuleListView.js
│   │   ├── IHKModuleView.js
│   │   ├── IHKQuizView.js
│   │   ├── IHKQuizListView.js
│   │   ├── IHKProgressView.js
│   │   ├── SearchComponent.js
│   │   ├── CategoryFilterComponent.js
│   │   ├── ExamChanges2025Component.js
│   │   ├── ErrorBoundary.js
│   │   ├── LoadingSpinner.js
│   │   ├── EmptyState.js
│   │   └── ...
│   ├── services/            # Business Logic
│   │   ├── IHKContentService.js     # Zentrale Datenverwaltung
│   │   ├── ExamProgressService.js   # Fortschrittsanalyse & Empfehlungen
│   │   ├── QuizService.js           # Quiz-Logik
│   │   ├── StateManager.js          # Zentrales State Management
│   │   ├── StorageService.js        # LocalStorage-Wrapper
│   │   ├── Router.js                # Client-side Routing
│   │   └── ThemeManager.js          # Dark/Light Mode
│   ├── data/
│   │   └── ihk/             # IHK-Lerninhalte
│   │       ├── modules/     # 31 Module
│   │       ├── quizzes/     # 9 Quizze (einheitliches Format)
│   │       ├── learning-paths/  # 4 Lernpfade
│   │       └── metadata/    # Kategorien & Prüfungsänderungen
│   ├── utils/               # Hilfsfunktionen & Validatoren
│   │   ├── AccessibilityHelper.js
│   │   ├── constants.js
│   │   └── validators/      # JSON-Schema-Validatoren
│   ├── app.js               # App-Initialisierung
│   └── style.css            # Styling
├── scripts/                 # Build & Analyse-Scripts
├── index.html
├── vite.config.js
└── package.json
```

## 🎓 Verfügbare Inhalte

### Module nach Kategorien

#### FÜ-01: Planen eines Softwareproduktes
- Projektplanung und Anforderungsanalyse

#### FÜ-02: Entwickeln und Bereitstellen
- Kontrollstrukturen (Aktivitätsdiagramme, Pseudocode)
- Datenbank-Anomalien und Normalisierung

#### FÜ-03: Qualitätssicherung
- Software-Tests (Black Box, White Box)
- Last- und Performancetests (NEU 2025)

#### FÜ-04: Informationssicherheit
- Sicherheitsbedrohungen
- Technisch-organisatorische Maßnahmen

#### BP-01 bis BP-05: Betriebliche Projektarbeit
- Kerberos, ODBC, NAS/SAN
- Cloud-Modelle, REST-API
- TDD (NEU 2025), Scrum (NEU 2025)
- Design Patterns, OOP
- Sortierverfahren (NEU 2025)
- SQL (DDL, DML, DQL)

### Lernpfade
1. **AP2 Komplett** - Vollständige Prüfungsvorbereitung
2. **SQL Mastery** - Alle SQL-Befehle meistern
3. **Neue Themen 2025** - TDD, Scrum, Sortierverfahren
4. **OOP Fundamentals** - Objektorientierung von Grund auf

## 🛠️ Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Markdown**: marked.js
- **Syntax Highlighting**: highlight.js
- **Styling**: Custom CSS mit CSS Variables
- **State Management**: Custom StateManager mit Pub/Sub-Pattern
- **Routing**: Custom Router mit Hash-Navigation
- **Storage**: LocalStorage mit In-Memory-Fallback
- **Architecture**: Service-oriented mit klarer Trennung von Concerns

## 🏗️ Architektur

Die App folgt einer klaren Service-orientierten Architektur:

### Services
- **IHKContentService**: Zentrale Verwaltung aller IHK-Inhalte (Module, Quizze, Lernpfade)
- **ExamProgressService**: Fortschrittsanalyse, Schwachstellenerkennung, Prüfungsbereitschaft
- **StateManager**: Zentrales State Management mit Pub/Sub für reaktive Updates
- **StorageService**: Abstraktionsschicht für LocalStorage mit automatischem Fallback
- **QuizService**: Quiz-Logik und Auswertung
- **Router**: Client-side Routing mit Hash-Navigation
- **ThemeManager**: Dark/Light Mode Management

### Components
- Alle UI-Komponenten sind eigenständige Klassen
- Klare Trennung von Darstellung und Logik
- Wiederverwendbare Komponenten (LoadingSpinner, EmptyState, ErrorBoundary)

### Data Flow
1. Services laden Daten aus JSON-Dateien (statische Imports für optimales Bundling)
2. StateManager verwaltet den globalen App-State
3. Components subscriben zu State-Änderungen
4. User-Interaktionen triggern Service-Methoden
5. Services aktualisieren den State
6. Components re-rendern automatisch

## 📱 Browser-Unterstützung

- Chrome/Edge (letzte 2 Versionen)
- Firefox (letzte 2 Versionen)
- Safari (letzte 2 Versionen)
- Mobile Browser (iOS Safari, Chrome Mobile)

## 🤝 Beitragen

Contributions sind willkommen! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### Neue Inhalte hinzufügen

Module und Quizze können einfach als JSON-Dateien hinzugefügt werden:

#### Modul hinzufügen

```javascript
// src/data/ihk/modules/neues-modul.json
{
  "id": "neues-modul",
  "title": "Titel des Moduls",
  "description": "Kurzbeschreibung",
  "category": "BP-01",
  "difficulty": "beginner",
  "examRelevance": "high",
  "newIn2025": false,
  "content": "# Markdown-Inhalt hier...",
  "codeExamples": [],
  "relatedQuizzes": [],
  "resources": []
}
```

#### Quiz hinzufügen

Alle Quizze verwenden das **einheitliche IHK-Quiz-Format** mit erweiterten Features:

```javascript
// src/data/ihk/quizzes/neues-quiz.json
{
  "id": "neues-quiz",
  "moduleId": "modul-id",
  "title": "Quiz-Titel",
  "description": "Kurzbeschreibung",
  "category": "FÜ-02",
  "difficulty": "beginner",
  "examRelevance": "high",
  "timeLimit": 15,
  "passingScore": 70,
  "questions": [
    {
      "id": "q1",
      "type": "single-choice",
      "question": "Frage-Text",
      "options": ["Option A", "Option B", "Option C"],
      "correctAnswer": "Option A",
      "explanation": "Erklärung der richtigen Antwort",
      "points": 1,
      "category": "Kategorie"
    }
  ],
  "tags": ["Tag1", "Tag2"]
}
```

**Unterstützte Fragetypen:**
- `single-choice` - Eine richtige Antwort
- `multiple-choice` - Mehrere richtige Antworten
- `true-false` - Wahr/Falsch-Fragen
- `code` - Code-basierte Fragen mit Syntax-Highlighting

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- IHK für den Prüfungskatalog 2025
- Alle Contributors
- Open Source Community

## 📞 Kontakt

Bei Fragen oder Anregungen öffne bitte ein Issue auf GitHub.

---

**Hinweis**: Diese App dient zur Prüfungsvorbereitung und ersetzt nicht die offizielle IHK-Dokumentation. Alle Inhalte wurden nach bestem Wissen und Gewissen erstellt, aber ohne Gewähr auf Vollständigkeit oder Richtigkeit.

**Viel Erfolg bei der Prüfung! 🎓**
