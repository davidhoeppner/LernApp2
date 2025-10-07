# Design Document: Content Cleanup and Fix

## Overview

This design outlines the approach to fix UTF-8 encoding issues across all IHK learning modules, remove dead routes and undefined values, and clean up unnecessary documentation files. The solution uses automated scripts for scanning and fixing, with validation to ensure data integrity.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Content Cleanup System                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  UTF-8 Encoding  │      │  Content Format  │        │
│  │     Fixer        │      │    Validator     │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Route Auditor   │      │  File Cleanup    │        │
│  │                  │      │    Manager       │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                           │
│  ┌──────────────────────────────────────────┐           │
│  │      Validation & Reporting Engine       │           │
│  └──────────────────────────────────────────┘           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. UTF-8 Encoding Fixer

**Purpose**: Scan and fix UTF-8 encoding issues in all module JSON files.

**Input**:

- Directory path: `src/data/ihk/modules/`
- Encoding map for common corruptions

**Output**:

- Fixed JSON files with proper UTF-8 encoding
- Report of all fixes applied

**Encoding Mappings**:

```javascript
const encodingFixes = {
  'Ã¼': 'ü', // u-umlaut
  'Ã¶': 'ö', // o-umlaut
  'Ã¤': 'ä', // a-umlaut
  ÃŸ: 'ß', // eszett
  Ãœ: 'Ü', // U-umlaut
  'Ã–': 'Ö', // O-umlaut
  'Ã„': 'Ä', // A-umlaut
  'â€œ': '"', // left double quote
  'â€': '"', // right double quote
  'â€™': "'", // right single quote
  'â€"': '–', // en dash
  'â€"': '—', // em dash
};
```

**Algorithm**:

1. Read all JSON files from modules directory
2. For each file:
   - Load content as string
   - Apply encoding fixes using regex replacement
   - Validate JSON structure
   - Write back with UTF-8 encoding
3. Generate fix report

### 2. Content Format Validator

**Purpose**: Validate JSON structure, markdown formatting, and required fields.

**Validation Checks**:

- Valid JSON syntax
- Required fields present: `id`, `title`, `description`, `category`, `content`
- Markdown syntax in `content` field is well-formed
- Code examples have required fields: `language`, `title`, `code`, `explanation`
- No literal "undefined" string values
- Escaped newlines (`\n`) are properly formatted

**Output**:

- Validation report with pass/fail status
- List of issues found with file paths and line numbers

### 3. Route Auditor

**Purpose**: Identify and fix dead routes and undefined references.

**Process**:

1. **Extract all route definitions** from `Router.js`
2. **Scan for route references** in:
   - Component files (`src/components/*.js`)
   - Service files (`src/services/*.js`)
   - Module JSON files (relatedQuizzes, prerequisites)
3. **Identify dead routes**:
   - Routes referenced but not registered
   - Module/quiz IDs that don't exist
4. **Generate fix recommendations**:
   - Remove invalid references
   - Update to correct IDs
   - Add missing route registrations

**Route Registry**:

```javascript
{
  registered: ['/ihk', '/ihk/modules/:id', '/ihk/quizzes/:id', ...],
  referenced: ['/ihk', '/ihk/modules/fue-04-security', ...],
  dead: ['/old-route', ...],
  moduleIds: ['fue-01-planning', 'bp-01-conception', ...],
  quizIds: ['fue-01-quiz', 'bp-01-quiz', ...]
}
```

### 4. File Cleanup Manager

**Purpose**: Remove unnecessary documentation files while preserving essential docs.

**File Categories**:

**KEEP** (Essential Documentation):

- `README.md` - Project overview
- `LICENSE` - Legal
- `DEPLOYMENT.md` - Deployment guide
- `ERROR_HANDLING_GUIDE.md` - Error handling patterns
- `ACCESSIBILITY_*.md` - Accessibility documentation
- `RESPONSIVE_*.md` - Responsive design docs
- `.deployment-checklist.md` - Deployment checklist
- Spec files in `.kiro/specs/*/` (requirements.md, design.md, tasks.md)

**REMOVE** (Temporary/Redundant):

- Task summaries: `TASK_*_SUMMARY.md`, `TASK_*_COMPLETE.md`
- Fix documentation: `*_FIXED.md`, `*_FIX.md`, `FINAL_*.md`
- Deployment duplicates: `DEPLOYMENT_COMPLETE.md`, `DEPLOYMENT_SUCCESS_*.md`, `GITHUB_*.md`
- Analysis reports: `*_REPORT.md`, `*_ANALYSIS.json`, `*_AUDIT.json`, `*_METRICS.json`
- Cleanup summaries: `CODE_CLEANUP_SUMMARY.md`, `FIXES_APPLIED.md`, `SEAMLESS_*.md`, `ZERO_*.md`
- Quiz temporary docs: `QUIZ_*_SUMMARY.md`, `QUIZ_*_REPORT.json`
- Integration docs: `INTEGRATION_*.md`, `*_INTEGRATION_*.md`
- Style audits: `STYLE_*.md`, `*_AUDIT_REPORT.md`
- Unused code reports: `UNUSED_*.md`, `DUPLICATE_*.md`

**Process**:

1. Scan workspace for all `.md` and `.json` files (excluding node_modules, .git)
2. Categorize files as KEEP or REMOVE
3. Generate removal plan with file list and reasons
4. Execute removal after confirmation
5. Create summary document: `CLEANUP_SUMMARY.md`

### 5. Validation & Reporting Engine

**Purpose**: Comprehensive validation of all fixes and generation of reports.

**Validation Steps**:

1. **JSON Validation**: All module files parse correctly
2. **Encoding Validation**: No "Ã" sequences remain
3. **Content Validation**: All required fields present
4. **Reference Validation**: All module/quiz references valid
5. **Route Validation**: No dead routes exist
6. **File System Validation**: No broken file references in docs

**Report Format**:

```json
{
  "timestamp": "2025-01-10T12:00:00Z",
  "summary": {
    "totalModules": 31,
    "modulesFixed": 15,
    "encodingIssuesFixed": 247,
    "deadRoutesRemoved": 3,
    "filesRemoved": 45,
    "validationPassed": true
  },
  "details": {
    "encodingFixes": [
      {
        "file": "fue-04-security.json",
        "fixes": 18,
        "examples": ["FÃœ → FÜ", "MaÃŸnahmen → Maßnahmen"]
      }
    ],
    "routeFixes": [...],
    "filesRemoved": [...]
  },
  "validation": {
    "jsonValid": true,
    "encodingClean": true,
    "referencesValid": true,
    "routesValid": true
  }
}
```

## Data Models

### Module Structure (Expected)

```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  category: string; // e.g., "FÜ-01", "BP-02"
  subcategory: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  examRelevance: 'low' | 'medium' | 'high';
  newIn2025: boolean;
  removedIn2025: boolean;
  important: boolean;
  estimatedTime: number;
  prerequisites: string[]; // Array of module IDs
  tags: string[];
  content: string; // Markdown content
  codeExamples?: CodeExample[];
  relatedQuizzes: string[]; // Array of quiz IDs
  resources?: Resource[];
  lastUpdated: string; // ISO date
  version: string;
}
```

### Encoding Fix Record

```typescript
interface EncodingFix {
  file: string;
  lineNumber?: number;
  original: string;
  fixed: string;
  context: string; // Surrounding text
}
```

### Route Audit Result

```typescript
interface RouteAudit {
  registeredRoutes: string[];
  referencedRoutes: string[];
  deadRoutes: string[];
  invalidModuleRefs: Array<{
    file: string;
    field: string;
    invalidId: string;
  }>;
  invalidQuizRefs: Array<{
    file: string;
    field: string;
    invalidId: string;
  }>;
}
```

## Error Handling

### Encoding Fixes

- **Invalid JSON after fix**: Revert to original, log error, continue with next file
- **File read/write errors**: Log error, skip file, continue processing
- **Backup strategy**: Create `.backup` copy before modifying

### Route Fixes

- **Ambiguous references**: Log warning, require manual review
- **Circular dependencies**: Detect and report, don't auto-fix

### File Cleanup

- **Protected files**: Never delete files in `.git`, `node_modules`, `src/`
- **Confirmation required**: Generate plan first, execute after review
- **Rollback**: Keep list of deleted files for potential recovery

## Testing Strategy

### Unit Tests

- Encoding fix function with known corrupted strings
- JSON validation with valid/invalid samples
- Route matching logic
- File categorization logic

### Integration Tests

1. **End-to-End Encoding Fix**:
   - Create test module with known encoding issues
   - Run fixer
   - Validate output matches expected

2. **Route Audit**:
   - Mock router with known routes
   - Mock components with route references
   - Verify dead route detection

3. **File Cleanup**:
   - Create test directory structure
   - Run cleanup
   - Verify correct files removed/kept

### Manual Testing

1. Load application after fixes
2. Navigate to fue-04-security module
3. Verify German characters display correctly
4. Test all navigation links work
5. Verify no console errors

## Implementation Phases

### Phase 1: Analysis & Backup

1. Create backup of all module files
2. Run encoding scanner to identify issues
3. Run route auditor to map all routes
4. Generate file cleanup plan

### Phase 2: Encoding Fixes

1. Implement encoding fixer script
2. Run on all modules
3. Validate JSON integrity
4. Generate fix report

### Phase 3: Content Validation

1. Implement content validator
2. Check all required fields
3. Validate markdown syntax
4. Fix any issues found

### Phase 4: Route Cleanup

1. Remove dead route references
2. Fix invalid module/quiz IDs
3. Update navigation components
4. Test all routes

### Phase 5: File Cleanup

1. Execute file removal plan
2. Create cleanup summary
3. Verify no broken references

### Phase 6: Final Validation

1. Run comprehensive validation
2. Generate final report
3. Manual testing
4. Documentation update

## Performance Considerations

- **Batch Processing**: Process modules in batches to avoid memory issues
- **Caching**: Cache module ID lists to avoid repeated file system scans
- **Parallel Processing**: Use async operations for file I/O
- **Progress Reporting**: Show progress for long-running operations

## Security Considerations

- **File Permissions**: Verify write permissions before modifying files
- **Backup Strategy**: Always create backups before destructive operations
- **Validation**: Validate all JSON before writing to prevent corruption
- **Audit Trail**: Log all changes for traceability

## Rollback Strategy

1. **Backup Location**: `.backup/content-cleanup-TIMESTAMP/`
2. **Rollback Script**: Restore from backup if issues found
3. **Git Integration**: Commit changes incrementally for easy revert
4. **Validation Gates**: Don't proceed if validation fails

## Success Criteria

1. ✅ All modules display German characters correctly (no "Ã" sequences)
2. ✅ All JSON files are valid and parseable
3. ✅ No dead routes or broken navigation links
4. ✅ Workspace contains only necessary documentation files
5. ✅ All module references (prerequisites, relatedQuizzes) are valid
6. ✅ Comprehensive validation report shows all checks passed
7. ✅ Application loads and functions correctly after fixes
