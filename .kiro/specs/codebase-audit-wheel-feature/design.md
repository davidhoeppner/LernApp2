# Design Document

## Overview

This design document outlines the architecture and implementation approach for a comprehensive codebase audit, refactoring initiative, and new "Wheel of Fortune" module selector feature for the IHK Fachinformatiker Lern-App.

### Project Context

The application is a JavaScript-based single-page application (SPA) built with:
- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Architecture**: Service-oriented with clear separation of concerns
- **State Management**: Custom StateManager with Pub/Sub pattern
- **Routing**: Custom hash-based Router
- **Storage**: LocalStorage with in-memory fallback
- **Content**: 31 IHK modules, 35+ quizzes, 4 learning paths

### Goals

1. **Eliminate Technical Debt**: Remove dead code, unused imports, duplicate logic, and unreachable code
2. **Improve Code Quality**: Enhance error handling, add logging, improve type safety
3. **Maintain Stability**: Ensure zero functional regression throughout refactoring
4. **Add Gamification**: Implement engaging "Wheel of Fortune" random module selector
5. **Enhance User Experience**: Provide fun, accessible way to discover learning content

### Phased Approach

The work is structured in strict sequential phases to minimize risk:

1. **Phase 1: Audit** - Comprehensive codebase analysis
2. **Phase 2: Planning** - Risk-ranked refactor roadmap
3. **Phase 3: Refactoring** - Incremental, tested improvements
4. **Phase 4: Validation** - Regression testing and verification
5. **Phase 5: Feature Design** - Wheel of Fortune specification
6. **Phase 6: Feature Implementation** - Build and integrate new feature
7. **Phase 7: Final Validation** - End-to-end testing and documentation

## Architecture

### Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Application                          │
│                          (app.js)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Services   │ │  Components  │ │    Utils     │
└──────────────┘ └──────────────┘ └──────────────┘


#### Services Layer
- **StateManager**: Central state with Pub/Sub
- **IHKContentService**: Module/quiz/learning path management
- **ExamProgressService**: Progress tracking and recommendations
- **ModuleService**: Module operations
- **QuizService**: Quiz logic and scoring
- **ProgressService**: User progress calculations
- **Router**: Hash-based navigation
- **ThemeManager**: Dark/light mode
- **StorageService**: LocalStorage abstraction

#### Components Layer
- View components (HomeView, ModuleListView, etc.)
- UI components (LoadingSpinner, ErrorBoundary, etc.)
- IHK-specific views (IHKModuleView, IHKQuizView, etc.)

#### Data Layer
- Static JSON imports for optimal bundling
- 31 IHK modules in `src/data/ihk/modules/`
- 35+ quizzes in `src/data/ihk/quizzes/`
- 4 learning paths in `src/data/ihk/learning-paths/`
- Metadata (categories, exam changes)

### Audit Architecture

The audit system will analyze the codebase systematically:


```
┌─────────────────────────────────────────────────────────────┐
│                      Audit System                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        │               │               │              │
        ▼               ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐
│ File Scanner │ │Code Analyzer │ │Dependency│ │ Reporter │
│              │ │              │ │ Tracker  │ │          │
└──────────────┘ └──────────────┘ └──────────┘ └──────────┘
```

#### Audit Components

1. **File Scanner**
   - Recursively scan `src/` directory
   - Identify all `.js` files
   - Categorize by type (service, component, util, data)
   - Build file inventory with metadata

2. **Code Analyzer**
   - Parse JavaScript AST (Abstract Syntax Tree)
   - Extract function signatures
   - Identify imports and exports
   - Detect unreachable code
   - Find duplicate patterns
   - Analyze error handling

3. **Dependency Tracker**
   - Build import/export graph
   - Identify unused imports
   - Find dead code (never referenced)
   - Detect circular dependencies
   - Map function call chains

4. **Reporter**
   - Generate structured findings
   - Assign priority levels (High/Medium/Low)
   - Create unique IDs (AUD-001, AUD-002, etc.)
   - Produce markdown reports
   - Generate actionable recommendations

### Refactor Architecture


The refactoring will be organized into batches by category and risk level:

#### Refactor Categories

1. **DEAD_CODE** (Low Risk)
   - Remove unused functions
   - Delete unreferenced variables
   - Clean up commented code

2. **CLEANUP** (Low Risk)
   - Remove unused imports
   - Fix formatting inconsistencies
   - Organize import statements

3. **STRUCTURE** (Medium Risk)
   - Consolidate duplicate logic
   - Extract helper functions
   - Improve code organization

4. **RESILIENCE** (Medium Risk)
   - Improve error handling
   - Add input validation
   - Enhance logging

5. **PERF** (Medium-High Risk)
   - Optimize repeated operations
   - Add caching where beneficial
   - Reduce redundant I/O

6. **MAINTAINABILITY** (Low-Medium Risk)
   - Add JSDoc comments
   - Improve naming
   - Add type hints

#### Refactor Workflow


```
For each batch:
  1. Identify files to modify
  2. Create backup (automatic via git)
  3. Apply changes with REFACTOR comments
  4. Run linter (npm run lint)
  5. Test manually (smoke test)
  6. Commit changes
  7. Move to next batch
```

### Wheel of Fortune Feature Architecture

The new feature will integrate seamlessly into the existing architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Navigation                              │
│  Home | Modules | Quizzes | Progress | 🎯 Lern-Modul       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   WheelView Component                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Wheel Animation Container               │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         Module Selection Display            │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  [Rad drehen] [Nochmal] [Zum Modul]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Selected: BP-03: Test-Driven Development (TDD)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│StateManager  │ │IHKContent    │ │  Router      │
│lastWheel     │ │Service       │ │/wheel route  │
│Module        │ │getModules()  │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Components and Interfaces

### Phase 1-4: Audit & Refactor Components

#### AuditEngine

```javascript
class AuditEngine {
  constructor() {
    this.fileScanner = new FileScanner();
    this.codeAnalyzer = new CodeAnalyzer();
    this.dependencyTracker = new DependencyTracker();
    this.reporter = new AuditReporter();
  }

  async runAudit() {
    // Scan files
    const files = await this.fileScanner.scan('src/');
    
    // Analyze code
    const analysis = await this.codeAnalyzer.analyze(files);
    
    // Track dependencies
    const dependencies = await this.dependencyTracker.track(files);
    
    // Generate report
    return this.reporter.generate(analysis, dependencies);
  }
}
```

#### FileScanner

```javascript
class FileScanner {
  async scan(directory) {
    // Returns: Array<FileInfo>
    // FileInfo: { path, type, size, lines, imports, exports }
  }
}
```

#### CodeAnalyzer

```javascript
class CodeAnalyzer {
  analyze(files) {
    // Returns: AnalysisResult
    // Includes: functions, deadCode, duplicates, errorHandling, etc.
  }
}
```

### Phase 5-7: Wheel Feature Components

#### WheelView Component

```javascript
class WheelView {
  constructor(services) {
    this.stateManager = services.stateManager;
    this.ihkContentService = services.ihkContentService;
    this.router = services.router;
    this.modules = [];
    this.selectedModule = null;
    this.isSpinning = false;
  }

  async render() {
    // Load modules
    await this.loadModules();
    
    // Create container
    const container = this.createContainer();
    
    // Render wheel UI
    this.renderWheel(container);
    
    // Attach event listeners
    this.attachEventListeners(container);
    
    return container;
  }

  async loadModules() {
    // Load from IHKContentService
    // Fallback to static list if needed
  }

  spin() {
    // Animate selection
    // Update state
    // Announce result
  }
}
```

#### WheelAnimator

```javascript
class WheelAnimator {
  constructor(container, modules) {
    this.container = container;
    this.modules = modules;
    this.currentIndex = 0;
  }

  async animate(finalIndex) {
    // Cycle through modules visually
    // Max 1.5 seconds total
    // Slow down near end
    // Stop at finalIndex
  }
}
```

#### Module Loader

```javascript
class ModuleLoader {
  constructor(ihkContentService) {
    this.service = ihkContentService;
    this.cache = null;
  }

  async loadModules() {
    if (this.cache) return this.cache;
    
    try {
      // Load from IHKContentService
      const modules = await this.service.getAllModules();
      this.cache = modules;
      return modules;
    } catch (error) {
      // Fallback to static list
      return this.getFallbackModules();
    }
  }

  getFallbackModules() {
    return [
      { id: 'bp-03-tdd', title: 'Test-Driven Development' },
      { id: 'bp-04-scrum', title: 'Scrum' },
      // ... more modules
    ];
  }
}
```

## Data Models

### Audit Data Models

#### AuditFinding

```javascript
{
  id: 'AUD-001',
  category: 'DEAD_CODE' | 'CLEANUP' | 'STRUCTURE' | 'RESILIENCE' | 'PERF' | 'MAINTAINABILITY',
  priority: 'High' | 'Medium' | 'Low',
  file: 'src/services/Example.js',
  line: 42,
  description: 'Unused function "calculateSomething"',
  recommendation: 'Remove function or mark as RESERVED if needed',
  impact: 'Low - function is never called',
  effort: 'Low - simple deletion'
}
```

#### RefactorBatch

```javascript
{
  batchId: 'BATCH-01',
  category: 'DEAD_CODE',
  issues: ['AUD-001', 'AUD-002', 'AUD-003'],
  rationale: 'Remove unused code to reduce bundle size',
  risk: 'Low',
  estimatedEffort: '30 minutes',
  successMetric: 'All tests pass, no import errors',
  status: 'not_started' | 'in_progress' | 'completed'
}
```

### Wheel Feature Data Models

#### WheelState

```javascript
{
  lastWheelModule: {
    id: 'bp-03-tdd',
    title: 'Test-Driven Development',
    category: 'BP-03',
    selectedAt: '2025-10-05T20:30:00Z'
  },
  spinHistory: [
    { moduleId: 'bp-03-tdd', timestamp: '2025-10-05T20:30:00Z' },
    { moduleId: 'bp-04-scrum', timestamp: '2025-10-05T20:25:00Z' }
  ]
}
```

#### ModuleInfo (for Wheel)

```javascript
{
  id: 'bp-03-tdd',
  title: 'Test-Driven Development',
  category: 'BP-03',
  difficulty: 'intermediate',
  examRelevance: 'high',
  newIn2025: true,
  icon: '🧪'
}
```

## Error Handling

### Audit Phase Error Handling

1. **File Access Errors**
   - Catch and log file read failures
   - Continue with remaining files
   - Report inaccessible files in audit

2. **Parse Errors**
   - Catch syntax errors during AST parsing
   - Mark file as "needs manual review"
   - Continue with other files

3. **Analysis Errors**
   - Wrap analysis in try-catch
   - Log errors with context
   - Provide partial results

### Refactor Phase Error Handling

1. **Pre-flight Checks**
   - Verify git status is clean
   - Ensure tests exist and pass
   - Check for uncommitted changes

2. **Batch Execution**
   - Wrap each batch in try-catch
   - Rollback on failure (git reset)
   - Log detailed error information

3. **Validation Errors**
   - Run linter after each batch
   - Run tests after each batch
   - Halt on failures

### Wheel Feature Error Handling

1. **Module Loading Errors**
   ```javascript
   try {
     modules = await ihkContentService.getAllModules();
   } catch (error) {
     console.error('Failed to load modules:', error);
     // Fallback to static list
     modules = getFallbackModules();
     // Show warning toast
     toastNotification.warning('Using offline module list');
   }
   ```

2. **Empty Module List**
   ```javascript
   if (!modules || modules.length < 2) {
     return renderEmptyState(
       'Nicht genügend Module verfügbar',
       'Mindestens 2 Module werden benötigt'
     );
   }
   ```

3. **State Save Errors**
   ```javascript
   try {
     stateManager.setState('lastWheelModule', selectedModule);
   } catch (error) {
     console.error('Failed to save wheel state:', error);
     // Continue anyway - not critical
   }
   ```

4. **Navigation Errors**
   ```javascript
   try {
     router.navigate(`/modules/${moduleId}`);
   } catch (error) {
     console.error('Navigation failed:', error);
     toastNotification.error('Modul konnte nicht geöffnet werden');
   }
   ```

## Testing Strategy

### Audit Testing

1. **Unit Tests**
   - Test FileScanner with mock file system
   - Test CodeAnalyzer with sample code snippets
   - Test DependencyTracker with known dependency graphs
   - Test Reporter output format

2. **Integration Tests**
   - Run audit on small test project
   - Verify findings are accurate
   - Check report generation

3. **Manual Validation**
   - Review audit findings manually
   - Verify no false positives
   - Confirm priority assignments

### Refactor Testing

1. **Pre-Refactor Baseline**
   - Document current test results
   - Record bundle size
   - Measure load time
   - Screenshot key features

2. **Per-Batch Testing**
   - Run `npm run lint` after each batch
   - Execute manual smoke tests
   - Verify no console errors
   - Check key user flows

3. **Post-Refactor Validation**
   - All tests must pass
   - No new console errors
   - Bundle size same or smaller
   - Load time same or faster
   - All features functional

### Wheel Feature Testing

1. **Unit Tests** (`tests/test-wheel.js`)
   ```javascript
   describe('WheelView', () => {
     test('loads modules from IHKContentService', async () => {
       const view = new WheelView(mockServices);
       await view.loadModules();
       expect(view.modules.length).toBeGreaterThan(0);
     });

     test('selects random module on spin', () => {
       const view = new WheelView(mockServices);
       view.modules = mockModules;
       const selected = view.selectRandomModule();
       expect(mockModules).toContain(selected);
     });

     test('updates state after selection', async () => {
       const view = new WheelView(mockServices);
       await view.spin();
       expect(mockStateManager.setState).toHaveBeenCalledWith(
         'lastWheelModule',
         expect.any(Object)
       );
     });

     test('handles single module gracefully', () => {
       const view = new WheelView(mockServices);
       view.modules = [mockModules[0]];
       const result = view.render();
       expect(result).toContain('Nicht genügend Module');
     });
   });
   ```

2. **Integration Tests**
   - Test full spin workflow
   - Verify state persistence
   - Test navigation to module
   - Verify accessibility features

3. **Manual Testing Checklist**
   - [ ] Wheel page accessible from navigation
   - [ ] Modules load correctly
   - [ ] Spin animation works smoothly
   - [ ] Result announced to screen readers
   - [ ] "Nochmal" button works
   - [ ] "Zum Modul" button navigates correctly
   - [ ] State persists across page reloads
   - [ ] Works with keyboard only
   - [ ] Works on mobile devices
   - [ ] Dark mode styling correct

4. **Accessibility Testing**
   - Screen reader announces selection
   - Keyboard navigation works
   - Focus management correct
   - ARIA labels present
   - Color contrast sufficient
   - Reduced motion respected

## Implementation Plan Summary

### Phase 1: Audit (Estimated: 4-6 hours)

1. Create audit scripts in `scripts/audit/`
2. Implement FileScanner
3. Implement CodeAnalyzer
4. Implement DependencyTracker
5. Implement Reporter
6. Run audit on codebase
7. Generate AUDIT_REPORT.md

### Phase 2: Planning (Estimated: 2-3 hours)

1. Review audit findings
2. Categorize issues
3. Assign priorities
4. Create refactor batches
5. Define success metrics
6. Generate REFACTOR_ROADMAP.md

### Phase 3: Refactoring (Estimated: 8-12 hours)

1. Execute DEAD_CODE batch
2. Execute CLEANUP batch
3. Execute STRUCTURE batch
4. Execute RESILIENCE batch
5. Execute PERF batch (if needed)
6. Execute MAINTAINABILITY batch
7. Generate CHANGELOG.md and DIFF_SUMMARY.md

### Phase 4: Validation (Estimated: 2-3 hours)

1. Run full test suite
2. Execute manual smoke tests
3. Verify all features work
4. Check performance metrics
5. Generate TEST_RESULTS.md

### Phase 5: Feature Design (Estimated: 1-2 hours)

1. Finalize UI mockups
2. Define component structure
3. Plan state management
4. Design accessibility features
5. Generate WHEEL_DESIGN.md

### Phase 6: Feature Implementation (Estimated: 6-8 hours)

1. Create WheelView component
2. Implement ModuleLoader
3. Implement WheelAnimator
4. Add route and navigation
5. Integrate with StateManager
6. Style component (light/dark modes)
7. Add accessibility features
8. Generate CODE_IMPLEMENTATION.md

### Phase 7: Final Validation (Estimated: 2-3 hours)

1. Write unit tests
2. Run integration tests
3. Execute manual testing checklist
4. Verify accessibility
5. Generate SUCCESS_CHECKLIST.md
6. Generate NEXT_IMPROVEMENTS.md
7. Finalize documentation

## Risk Mitigation

### Audit Risks

| Risk | Mitigation |
|------|------------|
| False positives in dead code detection | Manual review of all findings before deletion |
| Missing dependencies in analysis | Cross-reference with multiple tools |
| Large codebase analysis time | Implement caching and incremental analysis |

### Refactor Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Small batches, test after each, git commits |
| Introducing new bugs | Comprehensive testing, code review |
| Performance regression | Measure before/after, rollback if needed |
| Scope creep | Strict adherence to audit findings only |

### Feature Risks

| Risk | Mitigation |
|------|------------|
| Poor animation performance | Use CSS transforms, respect reduced motion |
| Module loading failures | Implement fallback static list |
| State persistence issues | Graceful degradation, non-critical feature |
| Accessibility gaps | Follow WCAG 2.1 AA, test with screen readers |

## Success Metrics

### Audit Success Metrics

- [ ] All JavaScript files inventoried
- [ ] Function map complete with 100% coverage
- [ ] Dead code identified with confidence scores
- [ ] Duplicate patterns documented
- [ ] Prioritized findings list generated
- [ ] Audit report delivered

### Refactor Success Metrics

- [ ] Zero functional regressions
- [ ] All tests passing
- [ ] No new console errors
- [ ] Bundle size same or reduced
- [ ] Load time same or improved
- [ ] Code quality metrics improved
- [ ] Technical debt reduced by ≥50%

### Feature Success Metrics

- [ ] Wheel page accessible from navigation
- [ ] Module selection works ≥3 consecutive times
- [ ] State persists across sessions
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Works on mobile and desktop
- [ ] Dark mode styling correct
- [ ] No performance impact on app load
- [ ] User testing positive (if applicable)

## Deliverables Checklist

- [ ] AUDIT_REPORT.md
- [ ] REFACTOR_ROADMAP.md
- [ ] CHANGELOG.md
- [ ] DIFF_SUMMARY.md
- [ ] WHEEL_DESIGN.md
- [ ] CODE_IMPLEMENTATION.md
- [ ] TEST_RESULTS.md
- [ ] SUCCESS_CHECKLIST.md
- [ ] NEXT_IMPROVEMENTS.md
- [ ] Updated README.md (if needed)

---

**Design Document Version**: 1.0  
**Last Updated**: 2025-10-05  
**Status**: Ready for Review
