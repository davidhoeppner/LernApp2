# IHK Fachinformatiker Lern-App 📚

Eine moderne, interaktive Lern-App zur Vorbereitung auf die IHK-Abschlussprüfung Teil 2 für Fachinformatiker Anwendungsentwicklung.

## ✨ Features

### 📖 Umfangreiche Lerninhalte
- **31 IHK-Module** mit detaillierten Erklärungen
- **5 Prüfungsquizze** zum Testen des Wissens
- **4 Lernpfade** für strukturiertes Lernen
- Alle Inhalte basieren auf dem **IHK-Prüfungskatalog 2025**

### 🎯 Neue Themen 2025
- ✅ Aktivitätsdiagramme und Pseudocode (statt Struktogramme)
- ✅ Test-Driven Development (TDD)
- ✅ Scrum und agile Methoden
- ✅ Sortierverfahren (Bubble Sort, Selection Sort, Insertion Sort)
- ✅ Last- und Performancetests

### 💡 Intelligente Features
- **Fortschrittsverfolgung**: Behalte den Überblick über abgeschlossene Module
- **Markdown-Rendering**: Schön formatierte Inhalte mit Syntax-Highlighting
- **Responsive Design**: Funktioniert auf Desktop, Tablet und Smartphone
- **Dark/Light Mode**: Automatische Theme-Anpassung
- **Offline-fähig**: Alle Daten lokal gespeichert
- **Barrierefreiheit**: WCAG 2.1 AA konform

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
│   │   ├── ModuleListView.js
│   │   ├── ModuleDetailView.js
│   │   ├── QuizView.js
│   │   └── ...
│   ├── services/            # Business Logic
│   │   ├── ModuleService.js
│   │   ├── QuizService.js
│   │   ├── IHKContentService.js
│   │   └── ...
│   ├── data/
│   │   └── ihk/             # IHK-Lerninhalte
│   │       ├── modules/     # 31 Module
│   │       ├── quizzes/     # 5 Quizze
│   │       ├── learning-paths/
│   │       └── metadata/
│   ├── utils/               # Hilfsfunktionen
│   ├── app.js               # App-Initialisierung
│   └── style.css            # Styling
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
- **State Management**: Custom StateManager
- **Routing**: Custom Router mit Hash-Navigation

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
