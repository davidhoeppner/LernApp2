# Design Document: Code Cleanup and Refactor

## Overview

This design outlines a systematic approach to analyzing, refactoring, and cleaning up the codebase. The primary goal is to eliminate unused code while first checking if it can be integrated into existing functionality, reduce duplication, consolidate services, and improve overall code quality. The approach prioritizes integration over deletion to avoid wasting existing functionality.

## Architecture

### Analysis-First Approach

**Three-Phase Strategy**:
1. **Discovery**: Identify all unused code, duplicates, and integration opportunities
2. **Integration**: Attempt to integrate valuable unused code before deletion
3. **Cleanup**: Remove truly unused code and refactor duplicates

### Code Analysis Tools

**Static Analysis**:
- AST (Abstract Syntax Tree) parsing for JavaScript files
- Import/export analysis
- Function call graph generation
- Component usage tracking

**Dynamic Analysis**:
- Route usage tracking
- Service method usage
- Component rendering frequency

## Components and Interfaces

### 1. Unused Code Analyzer

**Purpose**: Identify all potentially unused code

**Implementation**:
```javascript
class UnusedCodeAnalyzer {
  constructor() {
    this.imports = new Map();
    this.exports = new Map();
    this.usages = new Map();
  }

  async analyzeProject() {
    // Scan all JS files
    // Build import/export graph
    // Identify unused exports
    // Check for dynamic imports
    // Generate report
  }

  findUnusedImports(file) {
    // Parse file AST
    // Track imported symbols
    // Check if symbols are used
    // Return unused imports
  }

  findUnusedFunctions(file) {
    // Parse file AST
    // Find all function declarations
    // Check if functions are called
    // Return unused functions
  }

  findUnusedComponents(file) {
    // Parse component files
    // Check router registrations
    // Check dynamic imports
    // Return unused components
  }
}
```

**Output**: `UNUSED_CODE_REPORT.md`

### 2. Duplicate Code Detector

**Purpose**: Find and document code duplication

**Detection Strategies**:
- **Exact Duplicates**: Identical code blocks
- **Structural Duplicates**: Same logic, different names
- **Functional Duplicates**: Different implementation, same purpose

**Implementation**:
```javascript
class DuplicateCodeDetector {
  findDuplicates(files) {
    // Tokenize code
    // Generate hashes
    // Find matching patterns
    // Calculate similarity scores
    // Return duplicates with locations
  }

  analyzeSimilarity(code1, code2) {
    // Compare AST structures
    // Calculate similarity percentage
    // Identify refactoring opportunities
  }
}
```

**Output**: `DUPLICATE_CODE_REPORT.md`

### 3. Integration Opportunity Analyzer

**Purpose**: Identify unused code that could be integrated

**Analysis Criteria**:
- **Functionality Value**: Does it provide useful features?
- **Code Quality**: Is it well-written and tested?
- **Integration Effort**: How difficult to integrate?
- **User Benefit**: Would users benefit from this feature?

**Current Unused Components to Analyze**:
- Old QuizView vs IHKQuizView (IHK is better, migrate to it)
- Old QuizService vs IHKContentService (consolidate)
- Any unused utility functions
- Any unused UI components

**Integration Strategies**:
```javascript
{
  "component": "QuizView",
  "status": "unused",
  "analysis": {
    "functionality": "Basic quiz interface",
    "quality": "Good but less featured than IHKQuizView",
    "integrationEffort": "Medium - need to migrate data format",
    "recommendation": "Deprecate in favor of IHKQuizView"
  },
  "action": "migrate-and-remove"
}
```

### 4. Service Consolidation

**Current Service Overlap**:

**QuizService vs IHKContentService**:
- Both handle quiz data loading
- IHKContentService is more comprehensive
- QuizService has simpler interface

**Consolidation Strategy**:
```javascript
// Unified service approach
class ContentService {
  constructor(stateManager, storageService) {
    this.stateManager = stateManager;
    this.storage = storageService;
    this.modules = new Map();
    this.quizzes = new Map();
    this.learningPaths = new Map();
  }

  // Unified methods for all content types
  async getQuizById(id) {
    // Load from IHK quizzes directory
    // Support both old and new formats
    // Return normalized quiz object
  }

  async getModuleById(id) {
    // Load from modules or IHK modules
    // Return normalized module object
  }
}
```

**Migration Path**:
1. Create unified ContentService
2. Update all components to use ContentService
3. Deprecate old QuizService
4. Remove old service after verification

### 5. Route Cleanup

**Route Analysis**:
```javascript
// Current routes (from app.js)
const routes = {
  '/': HomeView,
  '/modules': ModuleListView,
  '/modules/:id': ModuleDetailView,
  '/quizzes': QuizListView,
  '/quizzes/:id': QuizView,
  '/progress': ProgressView
};

// Check for:
// - Unused routes
// - Duplicate route handlers
// - Routes pointing to deprecated components
```

**Cleanup Actions**:
- Remove routes to deprecated components
- Consolidate similar routes
- Update route handlers to use new components

### 6. Import Cleanup

**Automated Import Cleanup**:
```javascript
class ImportCleaner {
  cleanFile(filePath) {
    // Parse file
    // Find all imports
    // Check if each import is used
    // Remove unused imports
    // Rewrite file
  }

  organizeImports(imports) {
    // Group by type (external, internal, relative)
    // Sort alphabetically within groups
    // Return organized imports
  }
}
```

**Import Organization**:
```javascript
// External dependencies
import React from 'react';

// Services
import StorageService from './services/StorageService.js';
import StateManager from './services/StateManager.js';

// Components
import Navigation from './components/Navigation.js';
import HomeView from './components/HomeView.js';

// Utilities
import accessibilityHelper from './utils/AccessibilityHelper.js';
```

### 7. Code Quality Improvements

**Refactoring Patterns**:

**Extract Function**:
```javascript
// Before: Long function
function processQuizData(quiz) {
  // 100 lines of code
}

// After: Extracted functions
function processQuizData(quiz) {
  const validated = validateQuizData(quiz);
  const normalized = normalizeQuizFormat(validated);
  const enriched = enrichWithMetadata(normalized);
  return enriched;
}
```

**Extract Constant**:
```javascript
// Before: Magic numbers
if (score >= 70) { /* pass */ }

// After: Named constant
const PASSING_SCORE_PERCENTAGE = 70;
if (score >= PASSING_SCORE_PERCENTAGE) { /* pass */ }
```

**Simplify Conditionals**:
```javascript
// Before: Complex nested conditions
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // do something
    }
  }
}

// After: Guard clauses
if (!user) return;
if (!user.isActive) return;
if (!user.hasPermission) return;
// do something
```

## Data Models

### Cleanup Report Structure

```javascript
{
  "timestamp": "2025-01-10T00:00:00Z",
  "summary": {
    "filesAnalyzed": 85,
    "unusedCode": {
      "files": 5,
      "functions": 23,
      "imports": 47,
      "linesOfCode": 1250
    },
    "duplicates": {
      "instances": 12,
      "linesOfCode": 340
    },
    "integrationOpportunities": 3,
    "refactoringOpportunities": 18
  },
  "actions": {
    "integrated": 2,
    "removed": 3,
    "refactored": 15,
    "consolidated": 4
  },
  "metrics": {
    "before": {
      "totalFiles": 85,
      "totalLines": 12450,
      "bundleSize": "245KB"
    },
    "after": {
      "totalFiles": 80,
      "totalLines": 10800,
      "bundleSize": "215KB"
    },
    "improvement": {
      "filesReduced": 5,
      "linesReduced": 1650,
      "bundleSizeReduced": "30KB (12.2%)"
    }
  }
}
```

### Integration Decision Matrix

```javascript
{
  "component": "ComponentName",
  "analysis": {
    "isUsed": false,
    "hasValue": true,
    "codeQuality": "good",
    "integrationEffort": "medium",
    "userBenefit": "high"
  },
  "decision": "integrate",
  "integrationPlan": {
    "steps": [
      "Update component to use new service",
      "Add route to router",
      "Add navigation link",
      "Test functionality"
    ],
    "estimatedEffort": "2 hours"
  }
}
```

## Error Handling

### Safe Deletion Strategy

**Pre-Deletion Checks**:
1. Verify no dynamic imports reference the code
2. Check for string-based references (e.g., route names)
3. Search for comments mentioning the code
4. Verify no runtime reflection uses the code

**Backup Strategy**:
- Create git branch before cleanup
- Document all deletions
- Keep deleted code in archive for 30 days

### Integration Failure Handling

**If Integration Fails**:
1. Revert integration changes
2. Document why integration failed
3. Mark component for deletion
4. Update integration report

## Testing Strategy

### Pre-Cleanup Testing

**Baseline Tests**:
1. Run all existing tests
2. Document current functionality
3. Create integration test suite
4. Verify all routes work

### Post-Cleanup Testing

**Verification Tests**:
1. All tests still pass
2. No console errors
3. All routes still work
4. Bundle size reduced
5. No broken imports

### Integration Testing

**For Each Integration**:
1. Unit test the integrated component
2. Integration test with existing features
3. E2E test user workflows
4. Performance test

## Implementation Plan

### Phase 1: Analysis (No Code Changes)
1. Run unused code analyzer
2. Run duplicate code detector
3. Analyze integration opportunities
4. Generate comprehensive reports
5. Review findings with stakeholder

### Phase 2: Integration
1. Prioritize integration opportunities
2. Implement integrations one by one
3. Test each integration thoroughly
4. Document integration decisions

### Phase 3: Consolidation
1. Consolidate duplicate code
2. Merge similar services
3. Refactor complex functions
4. Organize imports

### Phase 4: Cleanup
1. Remove truly unused code
2. Delete deprecated files
3. Clean up imports
4. Update documentation

### Phase 5: Validation
1. Run full test suite
2. Manual testing
3. Performance testing
4. Generate final report

## Success Metrics

**Quantitative**:
- Reduce total lines of code by 10-15%
- Reduce bundle size by 10-15%
- Eliminate all unused imports
- Consolidate duplicate code (< 5% duplication)
- 0 unused exports

**Qualitative**:
- Cleaner, more maintainable codebase
- Consistent coding patterns
- Better organized imports
- Clearer service boundaries
- Improved code readability

## Documentation

### Cleanup Summary Document

**Contents**:
1. Executive summary
2. Analysis findings
3. Integration decisions
4. Refactoring changes
5. Deleted code inventory
6. Before/after metrics
7. Recommendations for future

**File**: `CODE_CLEANUP_SUMMARY.md`
