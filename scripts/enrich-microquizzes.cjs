// @ts-nocheck
/* eslint-env node */
#!/usr/bin/env node
/**
 * Enrich automatically generated placeholder micro-quiz JSON files with
 * domain-relevant questions derived heuristically from the section title.
 *
 * Detection of placeholder quizzes: any question containing
 *   "Was ist der Kernpunkt des Abschnitts" OR
 *   "Wähle zutreffende Aussagen zu"
 *
 * Strategy:
 * 1. Iterate all quiz JSON files under src/data/ihk/quizzes.
 * 2. For placeholder quizzes, derive section title from quiz id / file name.
 * 3. Use keyword → generator mapping to create 3–5 improved questions.
 * 4. Add per-question category (module category slug or derived keyword).
 * 5. Normalize true/false questions to have string options and string correctAnswer where appropriate.
 * 6. Preserve top-level quiz metadata; upgrade difficulty heuristically for advanced topics.
 * 7. Write enriched JSON (pretty printed, stable order) and keep a backup alongside (original stored with .orig only once).
 *
 * This is an incremental improvement pass. It can be safely re-run; already enriched
 * quizzes (no placeholder pattern) are skipped by default unless --force is passed.
 */

/* global console */
const fs = require('fs');
const path = require('path');
const process = require('process');

const QUIZ_DIR = path.join(process.cwd(), 'src', 'data', 'ihk', 'quizzes');
const MODULE_DIR = path.join(process.cwd(), 'src', 'data', 'ihk', 'modules');

const argv = new Set(process.argv.slice(2));
const FORCE = argv.has('--force');
const DRY_RUN = argv.has('--dry');
const VERBOSE = argv.has('--verbose');

function listQuizFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listQuizFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function safeReadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

// Load module metadata cache for potential future deeper enrichment.
const moduleCache = new Map();
for (const file of fs.readdirSync(MODULE_DIR)) {
  if (!file.endsWith('.json')) continue;
  const mod = safeReadJSON(path.join(MODULE_DIR, file));
  if (mod && mod.id) moduleCache.set(mod.id, mod);
}

function isPlaceholderQuiz(q) {
  if (!q || !Array.isArray(q.questions)) return false;
  return q.questions.some(qq => /Was ist der Kernpunkt des Abschnitts|Wähle zutreffende Aussagen zu/.test(qq.question || ''));
}

// No randomization needed now; deterministic generation.

function difficultyFromSection(title, base = 'beginner') {
  const t = (title || '').toLowerCase();
  if (/advanced|erweitert|optimierung|performance|security|sicherheit/.test(t)) return 'advanced';
  if (/grundlagen|einfuhrung|basics|overview|übersicht|ubersicht/.test(t)) return 'beginner';
  if (/design|architektur|konzept|modell|modellierung/.test(t)) return 'intermediate';
  return base;
}

// Question template creators
function qSingle(id, question, options, correct, explanation, category) {
  return { id, type: 'single-choice', question, options, correctAnswer: correct, explanation, points: 1, category };
}
function qMulti(id, question, options, correctArr, explanation, category) {
  return { id, type: 'multiple-choice', question, options, correctAnswer: correctArr, explanation, points: 1, category };
}
function qTrueFalse(id, statement, isTrue, explanation, category) {
  return { id, type: 'true-false', question: statement, options: ['Richtig', 'Falsch'], correctAnswer: isTrue ? 'Richtig' : 'Falsch', explanation, points: 1, category };
}

// Domain-specific generators keyed by regex pattern (lowercased check)
const generators = [
  {
    test: t => /http-methoden|http method|get -|post -|put -|patch -|delete -/.test(t),
    gen: () => {
      return [
        qSingle('q1', 'Welche Aussage zu HTTP-GET ist korrekt?', [
          'GET ist safe und idempotent',
          'GET verändert immer Serverzustand',
          'GET ist nie cacheable'
        ], 'GET ist safe und idempotent', 'GET wird zum reinen Abruf genutzt und darf keine Seiteneffekte haben.', 'HTTP'),
        qMulti('q2', 'Welche Methoden sind idempotent?', [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'], ['GET','PUT','DELETE'], 'Diese Methoden liefern bei Wiederholung dasselbe Ergebnis (POST nicht, PATCH oft situationsabhängig).', 'HTTP'),
        qTrueFalse('q3', 'POST ist typischerweise nicht idempotent.', true, 'Mehrfaches POST kann mehrere Ressourcen erzeugen.', 'HTTP'),
        qSingle('q4', 'Worin unterscheidet sich PATCH von PUT?', [
          'PATCH modifiziert nur Teilfelder, PUT ersetzt die Ressource vollständig',
          'PUT modifiziert nur Teilfelder, PATCH ersetzt vollständig',
          'Es gibt keinen Unterschied – beide sind identisch'
        ], 'PATCH modifiziert nur Teilfelder, PUT ersetzt die Ressource vollständig', 'Semantische Unterschiede zwischen PUT und PATCH.', 'HTTP')
      ];
    }
  },
  {
    test: t => /status-codes|status codes/.test(t),
    gen: () => [
      qSingle('q1','Welcher Status-Code signalisiert erfolgreiche Erstellung?', ['200 OK','201 Created','204 No Content','409 Conflict'], '201 Created', '201 wird bei erfolgreichem Anlegen einer Ressource verwendet.', 'HTTP-Status'),
      qMulti('q2','Welche 4xx Codes deuten auf Client-Fehler hin?', ['200','400','401','404','500'], ['400','401','404'], '4xx = Clientfehler, 5xx = Serverfehler.', 'HTTP-Status'),
      qTrueFalse('q3','404 Not Found kann für nicht existente Ressourcen genutzt werden.', true, '404 ist Standard bei unbekannter Ressource.', 'HTTP-Status'),
      qSingle('q4','Welcher Code ist geeignet bei zu vielen Anfragen?', ['422 Unprocessable Entity','301 Moved Permanently','429 Too Many Requests','503 Service Unavailable'], '429 Too Many Requests', '429 kennzeichnet Rate Limit Überschreitung.', 'HTTP-Status')
    ]
  },
  {
    test: t => /url-design|url design/.test(t),
    gen: () => [
      qSingle('q1','Welche URL entspricht REST-Best Practices?', ['GET /api/getUsers','GET /api/users','POST /api/getCreateUser','GET /api/user'], 'GET /api/users', 'Ressourcen plural, keine Verbpräfixe.', 'REST-Design'),
      qTrueFalse('q2','Hierarchische Beziehungen können durch Verschachtelung wie /users/123/orders dargestellt werden.', true, 'Ressourcen-Hierarchien sind üblich.', 'REST-Design'),
      qMulti('q3','Welche Aspekte gehören zu gutem URL-Design?', ['Plural für Kollektionen','HTTP-Verb im Pfad','Filter via Query-Parameter','Nomen statt Verben'], ['Plural für Kollektionen','Filter via Query-Parameter','Nomen statt Verben'], 'Verben gehören ins HTTP-Verb, nicht den Pfad.', 'REST-Design')
    ]
  },
  {
    test: t => /authentifizierung|authentication|oauth|jwt|api key/.test(t),
    gen: () => [
      qSingle('q1','Was enthält typischerweise ein JWT im Payload (Claims)?', ['Signatur Algorithmus','Benutzer- und Gültigkeitsinformationen','SSL-Zertifikat','HTTP-Status-Code'], 'Benutzer- und Gültigkeitsinformationen', 'Claims transportieren Identität & Ablauf.', 'Auth'),
      qTrueFalse('q2','Ein API Key identifiziert meist nur das aufrufende System, nicht zwingend einen Endnutzer.', true, 'API Keys sind oft system-/anwendungsbasiert.', 'Auth'),
      qMulti('q3','Welche Schritte gehören typischerweise zum OAuth 2.0 Authorization Code Flow?', ['Authorization Request','Token Exchange','Direkte Passwortübertragung an Resource Server','Verwendung eines Authorization Codes'], ['Authorization Request','Token Exchange','Verwendung eines Authorization Codes'], 'Passwörter werden nicht direkt an Resource Server weitergereicht.', 'Auth')
    ]
  },
  {
    test: t => /pagination/.test(t),
    gen: () => [
      qSingle('q1','Was ist ein Vorteil von Cursor-basierter Pagination gegenüber Offset?', ['Einfachere Implementierung in jeder SQL-Version','Stabile Performance bei großen Datensätzen','Automatische Sortierung nach Primärschlüssel','Keine Zusatzlogik nötig'], 'Stabile Performance bei großen Datensätzen', 'Cursor vermeidet lineares Überspringen vieler Zeilen.', 'Pagination'),
      qTrueFalse('q2','Offset-basierte Pagination kann bei großen Offsets Performance-Probleme verursachen.', true, 'OFFSET n zwingt Datenbank viele Zeilen zu zählen/überspringen.', 'Pagination'),
      qMulti('q3','Welche Metadaten sind bei Pagination hilfreich?', ['total','limit','offset oder cursor','hash der gesamten Tabelle'], ['total','limit','offset oder cursor'], 'Hash der Tabelle ist unüblich und teuer.', 'Pagination')
    ]
  },
  {
    test: t => /rate limiting|rate-limiting/.test(t),
    gen: () => [
      qSingle('q1','Welcher Header zeigt verbleibende Requests?', ['X-RateLimit-Limit','X-RateLimit-Remaining','Retry-After','ETag'], 'X-RateLimit-Remaining', 'Remaining zeigt Restkontingent.', 'Rate-Limit'),
      qTrueFalse('q2','Bei Überschreitung des Limits ist 429 ein üblicher Status-Code.', true, 'HTTP 429 Too Many Requests.', 'Rate-Limit'),
      qMulti('q3','Welche Strategien sind legitime Rate-Limiting Ansätze?', ['Token Bucket','Leaky Bucket','MD5 Hash Flood','Fixed Window'], ['Token Bucket','Leaky Bucket','Fixed Window'], 'MD5 Hash Flood ist kein Rate-Limiting-Algorithmus.', 'Rate-Limit')
    ]
  },
  {
    test: t => /cors/.test(t),
    gen: () => [
      qSingle('q1','Welcher Header legt erlaubte Ursprünge fest?', ['Access-Control-Allow-Origin','Access-Control-Allow-Methods','Access-Control-Allow-Headers','Origin-CORS-Policy'], 'Access-Control-Allow-Origin', 'Der Header bestimmt zugelassene Ursprünge.', 'CORS'),
      qTrueFalse('q2','Ein Wert * für Access-Control-Allow-Origin erlaubt alle Ursprünge.', true, 'Wildcard erlaubt jeden Ursprung (Ausnahmen bei Credentials).', 'CORS'),
      qMulti('q3','Welche gehören zu Preflight-Response-Headern?', ['Access-Control-Allow-Methods','Access-Control-Request-Method','Access-Control-Allow-Headers','Access-Control-Max-Age'], ['Access-Control-Allow-Methods','Access-Control-Allow-Headers','Access-Control-Max-Age'], 'Request-Method ist ein Request-Header.', 'CORS')
    ]
  },
  {
    test: t => /select|where|group by|order by|join|limit/.test(t),
  gen: () => [
      qSingle('q1','Welche Klausel filtert Zeilen vor der Gruppierung?', ['WHERE','HAVING','ORDER BY','LIMIT'], 'WHERE', 'WHERE wirkt vor Aggregation, HAVING nach GROUP BY.', 'SQL'),
      qMulti('q2','Welche Aussagen zu SELECT sind korrekt?', ['DISTINCT entfernt Duplikate','ORDER BY kommt vor GROUP BY','LIMIT kann Anzahl begrenzen','HAVING filtert Aggregatgruppen'], ['DISTINCT entfernt Duplikate','LIMIT kann Anzahl begrenzen','HAVING filtert Aggregatgruppen'], 'ORDER BY folgt nach GROUP BY.', 'SQL'),
      qTrueFalse('q3','ORDER BY 2 verweist auf die zweite Spalte der Ergebnismenge.', true, 'Positionsangaben sind erlaubt (wenn auch weniger lesbar).', 'SQL'),
      qSingle('q4','Welche JOIN-Art liefert nur übereinstimmende Zeilen beider Tabellen?', ['INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL OUTER JOIN'], 'INNER JOIN', 'INNER liefert Schnittmenge.', 'SQL')
    ]
  },
  {
    test: t => /kerberos/.test(t),
    gen: () => [
      qSingle('q1','Welches Ticket erhält der Client zuerst?', ['Service Ticket (ST)','Ticket Granting Ticket (TGT)','Session Ticket','Access Token'], 'Ticket Granting Ticket (TGT)', 'Das TGT erlaubt spätere Service-Ticket-Anforderungen.', 'Kerberos'),
      qTrueFalse('q2','Kerberos setzt synchronisierte Uhren der Teilnehmer voraus.', true, 'Zeitdrift verhindert Ticket-Validierung.', 'Kerberos'),
      qMulti('q3','Welche Komponenten gehören zum KDC?', ['Authentication Server','Ticket Granting Server','Resource Server','DNS Server'], ['Authentication Server','Ticket Granting Server'], 'KDC umfasst AS & TGS.', 'Kerberos'),
      qSingle('q4','Welcher Port wird standardmäßig von Kerberos genutzt?', ['53','80','88','443'], '88', 'Kerberos verwendet standardmäßig UDP/TCP 88.', 'Kerberos')
    ]
  },
  {
    test: t => /dokumentation|documentation|einfuhrung/.test(t),
  gen: () => [
      qSingle('q1','Welches Ziel technischer Softwaredokumentation ist zentral?', ['Wartbarkeit erhöhen','Quellcode verschleiern','Deployment erschweren','Team-Kommunikation reduzieren'], 'Wartbarkeit erhöhen', 'Dokumentation unterstützt Verständnis & Wartung.', 'Dokumentation'),
      qTrueFalse('q2','Architekturdokumentation beschreibt übergreifende Struktur und Entscheidungen.', true, 'Architektur = Struktur + rationale Entscheidung.', 'Dokumentation'),
      qMulti('q3','Welche sind typische Dokumentationsarten?', ['Benutzerdoku','Architekturdoku','Log-Datei','API-Referenz'], ['Benutzerdoku','Architekturdoku','API-Referenz'], 'Logs sind keine strukturierte Dokumentationsart.', 'Dokumentation')
    ]
  },
  {
    test: t => /arrays|listen|stack|queue|baum|trees|hash|datenstrukturen|data structure/.test(t),
  gen: () => [
      qSingle('q1','Welche Operation hat bei einer Queue FIFO-Semantik?', ['push','enqueue','random access','hash'], 'enqueue', 'Queue: enqueue hinten, dequeue vorne.', 'Datenstrukturen'),
      qMulti('q2','Welche Strukturen sind linear?', ['Array','Liste','Baum','Queue','Stack'], ['Array','Liste','Queue','Stack'], 'Bäume sind nicht linear.', 'Datenstrukturen'),
      qTrueFalse('q3','Ein Hash Table ermöglicht durchschnittlich O(1) Zugriff.', true, 'Durch Hashing amortisiert konstanter Zugriff.', 'Datenstrukturen')
    ]
  },
  {
    test: t => /bubble|selection|insertion|sort|sortierverfahren/.test(t),
    gen: () => [
      qSingle('q1','Welche durchschnittliche Zeitkomplexität hat Insertion Sort?', ['O(n)','O(n log n)','O(n^2)','O(log n)'], 'O(n^2)', 'Best Case O(n), durchschnittlich O(n^2).', 'Sortierung'),
      qTrueFalse('q2','Bubble Sort ist stabil.', true, 'Relative Reihenfolge gleicher Elemente bleibt erhalten.', 'Sortierung'),
      qMulti('q3','Welche Algorithmen sind in-place?', ['Bubble Sort','Selection Sort','Insertion Sort','Merge Sort'], ['Bubble Sort','Selection Sort','Insertion Sort'], 'Merge Sort benötigt zusätzlichen Speicher.', 'Sortierung')
    ]
  },
  {
    test: t => /odbc/.test(t),
    gen: () => [
      qSingle('q1','Wofür steht ODBC?', ['Open Database Connectivity','Open Data Binary Channel','Organized Database Caching','Optimized Data Bus Connector'], 'Open Database Connectivity', 'Standardisierte API für DB-Zugriff.', 'ODBC'),
      qTrueFalse('q2','ODBC abstrahiert den Zugriff auf unterschiedliche Datenbanken.', true, 'Treiber implementieren spezifische Protokolle.', 'ODBC'),
      qMulti('q3','Welche Vorteile bietet ODBC?', ['Portabilität','Leichtere Treiberverwaltung','DB-spezifische SQL-Erweiterungen entfallen vollständig','Einheitliche Verbindungs-API'], ['Portabilität','Einheitliche Verbindungs-API'], 'Spezifische Erweiterungen bleiben teils notwendig.', 'ODBC')
    ]
  },
  {
    test: t => /monitoring|logging|alerting|metrics|metriken/.test(t),
    gen: () => [
      qSingle('q1','Welche Metrik misst durchschnittliche Antwortzeit?', ['Latency','Throughput','Error Rate','Saturation'], 'Latency', 'Latenz = Verzögerung einer Anfrage.', 'Monitoring'),
      qTrueFalse('q2','Dashboards dienen auch zur Trendanalyse.', true, 'Visualisierung historischer Werte.', 'Monitoring'),
      qMulti('q3','Welche gehören zu den „Golden Signals“?', ['Latency','Traffic','Errors','Saturation','Color'], ['Latency','Traffic','Errors','Saturation'], 'Color ist kein Golden Signal.', 'Monitoring')
    ]
  },
  {
    test: () => true, // fallback
    gen: (sectionTitle) => [
      qSingle('q1', `Was beschreibt am besten den Schwerpunkt des Abschnitts "${sectionTitle}"?`, [
        'Zentrales Konzept / Definition',
        'Unzusammenhängendes Randthema',
        'Reine Formatierungsanweisung'
      ], 'Zentrales Konzept / Definition', 'Abschnitt dient dem inhaltlichen Verständnis.', 'Allgemein'),
      qTrueFalse('q2', `Der Abschnitt "${sectionTitle}" ist Teil des Modulthemas.`, true, 'Struktur folgt den H2 Überschriften.', 'Allgemein'),
      qMulti('q3', `Was trifft typischerweise auf den Abschnitt "${sectionTitle}" zu?`, [
        'Lernrelevanter Inhalt', 'Hilft bei Prüfungsvorbereitung', 'Nur dekorativ'
      ], ['Lernrelevanter Inhalt','Hilft bei Prüfungsvorbereitung'], 'Dekorative Abschnitte werden selten als H2 geführt.', 'Allgemein')
    ]
  }
];

function generateQuestions(sectionTitle, module, quizId) {
  const t = (sectionTitle || '').toLowerCase();
  for (const g of generators) {
    if (g.test(t)) return g.gen(sectionTitle, module, quizId);
  }
  return generators[generators.length - 1].gen(sectionTitle, module, quizId);
}

function extractSectionTitle(quiz) {
  // Use quiz.title before dash — Microquiz 1 pattern; else derive from id
  if (quiz.title) return quiz.title.replace(/—\s*Microquiz.*$/i, '').trim();
  const parts = quiz.id.split('-');
  return parts.slice(3, -2).join(' ');
}

function enrichQuiz(original) {
  const sectionTitle = extractSectionTitle(original);
  const module = moduleCache.get(original.moduleId) || {};
  const difficulty = difficultyFromSection(sectionTitle, original.difficulty || module.difficulty || 'beginner');
  const questions = generateQuestions(sectionTitle, module, original.id);

  return {
    ...original,
    difficulty,
    questions: questions.map(q => ({
      ...q,
      category: q.category || module.category || 'GENERAL'
    })),
    description: original.description?.includes('Automatisch generiertes Microquiz')
      ? `Angereicherte Fragen zu "${sectionTitle}" (automatische Domänen-Heuristik).` : original.description
  };
}

function processFile(file) {
  const data = safeReadJSON(file);
  if (!data) return { file, skipped: true, reason: 'parse-error' };
  const placeholder = isPlaceholderQuiz(data);
  if (!placeholder && !FORCE) return { file, skipped: true, reason: 'not-placeholder' };
  const enriched = enrichQuiz(data);
  if (!DRY_RUN) {
    const backup = file + '.orig';
    if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
    fs.writeFileSync(file, JSON.stringify(enriched, null, 2) + '\n', 'utf8');
  }
  return { file, updated: true, placeholder };
}

function main() {
  const files = listQuizFiles(QUIZ_DIR);
  let updated = 0, skipped = 0, parseErrors = 0;
  for (const f of files) {
    const result = processFile(f);
    if (result.updated) { updated++; if (VERBOSE) console.log('Updated', path.basename(f)); }
    else {
      skipped++; if (result.reason === 'parse-error') parseErrors++; if (VERBOSE) console.log('Skipped', path.basename(f), '-', result.reason);
    }
  }
  console.log(`Enrichment complete: updated=${updated}, skipped=${skipped}, parseErrors=${parseErrors}${DRY_RUN ? ' (dry-run)' : ''}`);
  if (updated === 0 && !FORCE) console.log('Hint: Use --force to re-enrich already processed quizzes.');
}

// Execute when run directly
if (require.main === module) {
  main();
}
