# Unused Code Analysis Report

Generated: 2025-10-05T17:05:51.784Z

## Executive Summary

- **Files Analyzed**: 39
- **Unused Imports**: 0
- **Unused Exports**: 38
- **Unused Components**: 0
- **Unused Services**: 0
- **Dynamic Imports Found**: 2

## Severity Classification

### 🔴 Critical (0)
Large unused code blocks that should be evaluated for removal or integration.

### 🟡 Warning (38)
Exported functions/classes that are not imported anywhere.

### 🔵 Info (0)
Import statements that can be safely removed.

---

## 🟡 Unused Exports (Warning)

These exports are not imported anywhere. They may be:
- Dead code that can be removed
- Internal functions that should not be exported
- Functions used via dynamic imports (check carefully)

### src\app.js
- `app` (default export)

### src\components\CategoryFilterComponent.js
- `CategoryFilterComponent` (default export)

### src\components\EmptyState.js
- `EmptyState` (default export)

### src\components\ErrorBoundary.js
- `ErrorBoundary` (default export)

### src\components\ExamChanges2025Component.js
- `ExamChanges2025Component` (default export)

### src\components\HomeView.js
- `HomeView` (default export)

### src\components\IHKLearningPathListView.js
- `IHKLearningPathListView` (default export)

### src\components\IHKLearningPathView.js
- `IHKLearningPathView` (default export)

### src\components\IHKModuleListView.js
- `IHKModuleListView` (default export)

### src\components\IHKModuleView.js
- `IHKModuleView` (default export)

### src\components\IHKOverviewView.js
- `IHKOverviewView` (default export)

### src\components\IHKProgressView.js
- `IHKProgressView` (default export)

### src\components\IHKQuizListView.js
- `IHKQuizListView` (default export)

### src\components\IHKQuizView.js
- `IHKQuizView` (default export)

### src\components\LearningPathView.js
- `LearningPathView` (default export)

### src\components\LoadingSpinner.js
- `LoadingSpinner` (default export)

### src\components\ModuleDetailView.js
- `ModuleDetailView` (default export)

### src\components\ModuleListView.js
- `ModuleListView` (default export)

### src\components\Navigation.js
- `Navigation` (default export)

### src\components\NotFoundView.js
- `NotFoundView` (default export)

### src\components\ProgressView.js
- `ProgressView` (default export)

### src\components\SearchComponent.js
- `SearchComponent` (default export)

### src\components\ToastNotification.js
- `toastNotification` (default export)

### src\counter.js
- `setupCounter` (named export)

### src\services\ExamProgressService.js
- `ExamProgressService` (default export)

### src\services\IHKContentService.js
- `IHKContentService` (default export)

### src\services\ModuleService.js
- `ModuleService` (default export)

### src\services\ProgressService.js
- `ProgressService` (default export)

### src\services\QuizService.js
- `QuizService` (default export)

### src\services\Router.js
- `Router` (default export)

### src\services\StateManager.js
- `StateManager` (default export)

### src\services\StorageService.js
- `StorageService` (default export)

### src\services\ThemeManager.js
- `ThemeManager` (default export)

### src\utils\AccessibilityHelper.js
- `accessibilityHelper` (default export)

### src\utils\QuizMigrationTool.js
- `QuizMigrationTool` (default export)

### src\utils\validators\LearningPathValidator.js
- `LearningPathValidator` (default export)

### src\utils\validators\ModuleValidator.js
- `ModuleValidator` (default export)

### src\utils\validators\QuizValidator.js
- `QuizValidator` (default export)

## Dynamic Imports

The following dynamic imports were detected. Code referenced by these should NOT be removed:

- `marked`
- `highlight.js`

## Route References

The following route paths were found in the code:

- `/`
- `/>
          </svg>
        </div>
      </div>
      <div id=`
- `/g, `
- `/ihk`
- `/module/`
- `/modules`
- `/modules/:id`
- `/progress`
- `/quizzes`
- `/quizzes/`
- `/quizzes/:id`

## Recommendations

1. **Review Critical Items First**: Evaluate unused components and services for integration opportunities
2. **Check Dynamic References**: Verify that unused exports are not referenced via dynamic imports
3. **Clean Imports**: Remove unused imports to improve code clarity
4. **Document Decisions**: Record why code is kept or removed

## Next Steps

1. Run duplicate code analysis
2. Analyze integration opportunities for unused components
3. Create consolidation plan for overlapping services
4. Execute cleanup in phases with testing between each phase
