# Requirements Document - IHK Fachinformatiker Anwendungsentwicklung Content Integration

## Introduction

Dieses Dokument beschreibt die Anforderungen für die Integration von umfassenden Lerninhalten zur IHK Abschlussprüfung Teil 2 (AP2) für Fachinformatiker Anwendungsentwicklung in die Simple Learning App. Die Inhalte basieren auf dem neuen Prüfungskatalog ab 2025 und berücksichtigen alle wichtigen Änderungen gegenüber dem vorherigen Katalog.

## Requirements

### Requirement 1: Datenstruktur für IHK-Inhalte

**User Story:** Als Entwickler möchte ich eine strukturierte JSON-Datenstruktur für IHK-Lerninhalte, damit die Inhalte effizient gespeichert und abgerufen werden können.

#### Acceptance Criteria

1. WHEN die Datenstruktur definiert wird THEN SHALL das System Module, Quizzes und Metadaten unterstützen
2. WHEN ein Modul erstellt wird THEN SHALL es Kategorien, Schwierigkeitsgrade und Prüfungsrelevanz enthalten
3. WHEN Quizfragen erstellt werden THEN SHALL sie verschiedene Fragetypen (Multiple Choice, Single Choice, Code-Aufgaben) unterstützen
4. WHEN Inhalte kategorisiert werden THEN SHALL sie den Prüfungskatalog-Unterpunkten zugeordnet werden können
5. WHEN Metadaten hinzugefügt werden THEN SHALL sie Informationen über Prüfungsrelevanz und Änderungen ab 2025 enthalten

### Requirement 2: Prüfungskatalog-konforme Kategorisierung

**User Story:** Als Auszubildender möchte ich Lerninhalte nach Prüfungskatalog-Themen gefiltert sehen, damit ich gezielt für die Prüfung lernen kann.

#### Acceptance Criteria

1. WHEN Inhalte kategorisiert werden THEN SHALL sie nach Hauptkategorien (FÜ, BP) strukturiert sein
2. WHEN ein Thema ausgewählt wird THEN SHALL alle zugehörigen Module und Quizzes angezeigt werden
3. WHEN neue Inhalte ab 2025 markiert werden THEN SHALL sie visuell hervorgehoben werden
4. WHEN gestrichene Inhalte vorhanden sind THEN SHALL sie als "veraltet" markiert oder ausgeblendet werden
5. WHEN Unterpunkte angezeigt werden THEN SHALL die Nummerierung dem offiziellen Katalog entsprechen

### Requirement 3: SQL-Beiblatt Integration

**User Story:** Als Auszubildender möchte ich alle SQL-Befehle aus dem Prüfungsbeiblatt lernen, damit ich optimal auf SQL-Aufgaben vorbereitet bin.

#### Acceptance Criteria

1. WHEN SQL-Inhalte erstellt werden THEN SHALL alle Befehle aus dem Beiblatt abgedeckt sein
2. WHEN SQL-Syntax gezeigt wird THEN SHALL sie mit Beispielen und Erklärungen versehen sein
3. WHEN SQL-Quizzes erstellt werden THEN SHALL sie praktische Anwendungsfälle abdecken
4. WHEN SQL-Module angezeigt werden THEN SHALL sie nach Komplexität sortiert sein
5. WHEN SQL-Code dargestellt wird THEN SHALL Syntax-Highlighting verwendet werden

### Requirement 4: Neue Themen ab 2025

**User Story:** Als Auszubildender möchte ich alle neuen Themen ab 2025 lernen, damit ich auf die aktuellen Prüfungsanforderungen vorbereitet bin.

#### Acceptance Criteria

1. WHEN neue Themen angezeigt werden THEN SHALL sie als "Neu ab 2025" markiert sein
2. WHEN Test Driven Development (TDD) gelehrt wird THEN SHALL praktische Beispiele enthalten sein
3. WHEN Scrum behandelt wird THEN SHALL alle wichtigen Rollen, Events und Artefakte erklärt werden
4. WHEN Sortierverfahren gelehrt werden THEN SHALL Bubble, Selection und Insertion Sort mit Visualisierungen erklärt werden
5. WHEN Cyber-physische Systeme behandelt werden THEN SHALL Sensoren, Aktoren und Bibliotheken erklärt werden
6. WHEN Architektur-Pattern gelehrt werden THEN SHALL MVC, Layered Architecture etc. mit Beispielen erklärt werden
7. WHEN Sicherheitsthemen behandelt werden THEN SHALL Man-in-the-Middle, SQL-Injection und DDoS erklärt werden
8. WHEN Kapselung in OOP gelehrt wird THEN SHALL praktische Code-Beispiele enthalten sein

### Requirement 5: Gestrichene Inhalte

**User Story:** Als Auszubildender möchte ich wissen, welche Themen nicht mehr prüfungsrelevant sind, damit ich meine Lernzeit effizient nutzen kann.

#### Acceptance Criteria

1. WHEN gestrichene Themen angezeigt werden THEN SHALL sie als "Nicht mehr prüfungsrelevant ab 2025" markiert sein
2. WHEN Struktogramme und PAP behandelt werden THEN SHALL ein Hinweis auf Aktivitätsdiagramme erfolgen
3. WHEN Trend-Themen (IoT, Blockchain, Big Data) vorhanden sind THEN SHALL sie optional oder als Hintergrundwissen markiert sein
4. WHEN Load Balancing behandelt wird THEN SHALL ein Hinweis auf die Streichung erfolgen
5. WHEN Programmierparadigmen behandelt werden THEN SHALL ein Hinweis auf die Streichung erfolgen

### Requirement 6: Modulstruktur und Lernpfade

**User Story:** Als Auszubildender möchte ich strukturierte Lernpfade durchlaufen, damit ich systematisch alle Prüfungsthemen abdecke.

#### Acceptance Criteria

1. WHEN Lernpfade erstellt werden THEN SHALL sie nach Prüfungskatalog-Struktur organisiert sein
2. WHEN ein Lernpfad gestartet wird THEN SHALL Voraussetzungen und Abhängigkeiten angezeigt werden
3. WHEN Module abgeschlossen werden THEN SHALL der Fortschritt im Lernpfad aktualisiert werden
4. WHEN Schwierigkeitsgrade definiert werden THEN SHALL sie von Grundlagen bis Expertenwissen reichen
5. WHEN Zeitschätzungen angegeben werden THEN SHALL sie realistisch für die Prüfungsvorbereitung sein

### Requirement 7: Quiz-Typen und Prüfungssimulation

**User Story:** Als Auszubildender möchte ich verschiedene Quiz-Typen bearbeiten, damit ich optimal auf die Prüfungsformate vorbereitet bin.

#### Acceptance Criteria

1. WHEN Quizzes erstellt werden THEN SHALL sie Multiple Choice, Single Choice und Code-Aufgaben enthalten
2. WHEN Prüfungssimulationen angeboten werden THEN SHALL sie zeitlich begrenzt sein
3. WHEN Fragen beantwortet werden THEN SHALL sofortiges Feedback mit Erklärungen gegeben werden
4. WHEN falsche Antworten gegeben werden THEN SHALL die richtige Lösung mit Begründung angezeigt werden
5. WHEN Quiz-Ergebnisse angezeigt werden THEN SHALL sie nach Themengebieten aufgeschlüsselt sein

### Requirement 8: Code-Beispiele und Syntax-Highlighting

**User Story:** Als Auszubildender möchte ich Code-Beispiele mit Syntax-Highlighting sehen, damit ich Code besser verstehen kann.

#### Acceptance Criteria

1. WHEN Code-Beispiele angezeigt werden THEN SHALL Syntax-Highlighting für Java, Python, SQL verwendet werden
2. WHEN OOP-Konzepte erklärt werden THEN SHALL vollständige Code-Beispiele enthalten sein
3. WHEN Algorithmen erklärt werden THEN SHALL Pseudocode oder echte Implementierungen gezeigt werden
4. WHEN Design Patterns erklärt werden THEN SHALL UML-Diagramme und Code-Beispiele kombiniert werden
5. WHEN SQL-Befehle gezeigt werden THEN SHALL sie mit Beispieldaten und Ergebnissen dargestellt werden

### Requirement 9: Prüfungsrelevanz-Kennzeichnung

**User Story:** Als Auszubildender möchte ich sehen, wie prüfungsrelevant ein Thema ist, damit ich meine Prioritäten setzen kann.

#### Acceptance Criteria

1. WHEN Themen angezeigt werden THEN SHALL ihre Prüfungsrelevanz (hoch/mittel/niedrig) gekennzeichnet sein
2. WHEN wichtige Änderungen ab 2025 vorhanden sind THEN SHALL sie mit "wichtig" markiert sein
3. WHEN Themen häufig in Prüfungen vorkommen THEN SHALL dies statistisch angezeigt werden
4. WHEN optionale Themen vorhanden sind THEN SHALL sie als "Zusatzwissen" markiert sein
5. WHEN Kernthemen angezeigt werden THEN SHALL sie priorisiert dargestellt werden

### Requirement 10: Suchfunktion und Filterung

**User Story:** Als Auszubildender möchte ich Inhalte durchsuchen und filtern, damit ich schnell relevante Themen finde.

#### Acceptance Criteria

1. WHEN nach Themen gesucht wird THEN SHALL Volltextsuche über Module und Quizzes funktionieren
2. WHEN nach Kategorien gefiltert wird THEN SHALL FÜ und BP separat filterbar sein
3. WHEN nach Schwierigkeit gefiltert wird THEN SHALL Grundlagen, Fortgeschritten und Experte wählbar sein
4. WHEN nach Prüfungsrelevanz gefiltert wird THEN SHALL "Neu ab 2025" und "Wichtig" filterbar sein
5. WHEN nach Lernstatus gefiltert wird THEN SHALL "Nicht begonnen", "In Bearbeitung", "Abgeschlossen" wählbar sein

### Requirement 11: Fortschritts-Tracking für Prüfungsvorbereitung

**User Story:** Als Auszubildender möchte ich meinen Lernfortschritt nach Prüfungsthemen sehen, damit ich weiß, wo ich noch Lücken habe.

#### Acceptance Criteria

1. WHEN der Fortschritt angezeigt wird THEN SHALL er nach Prüfungskatalog-Kategorien aufgeschlüsselt sein
2. WHEN Schwachstellen identifiziert werden THEN SHALL Empfehlungen für weitere Module gegeben werden
3. WHEN Quiz-Ergebnisse ausgewertet werden THEN SHALL Statistiken nach Themengebieten angezeigt werden
4. WHEN der Gesamtfortschritt berechnet wird THEN SHALL er gewichtet nach Prüfungsrelevanz sein
5. WHEN Lernziele gesetzt werden THEN SHALL sie mit Prüfungsterminen verknüpfbar sein

### Requirement 12: Offline-Verfügbarkeit der Inhalte

**User Story:** Als Auszubildender möchte ich Inhalte offline verfügbar haben, damit ich überall lernen kann.

#### Acceptance Criteria

1. WHEN Inhalte geladen werden THEN SHALL sie im localStorage gespeichert werden
2. WHEN keine Internetverbindung besteht THEN SHALL alle geladenen Inhalte verfügbar sein
3. WHEN Fortschritt offline gespeichert wird THEN SHALL er bei Verbindung synchronisiert werden
4. WHEN neue Inhalte verfügbar sind THEN SHALL eine Update-Benachrichtigung angezeigt werden
5. WHEN Speicherplatz knapp wird THEN SHALL eine Warnung mit Optionen angezeigt werden

