# Duplicate Code Analysis Report

Generated: 2025-10-05T17:10:55.439Z

## Executive Summary

- **Files Analyzed**: 39
- **Exact Duplicates**: 0
- **Structural Duplicates**: 0
- **Functional Duplicates**: 4

- **Total Duplicate Lines**: ~0

## Duplication Types

### Exact Duplicates
Identical code blocks that appear multiple times.

### Structural Duplicates
Code blocks with similar structure but different variable names or values.

### Functional Duplicates
Code blocks that perform similar operations using similar patterns.

---

## 🔵 Functional Duplicates

These code blocks perform similar operations and could share common utilities.

### ASYNC DATA FETCHING
- **Instances**: 22
- **Pattern**: async-data-fetching

**Locations:**
- `src\app.js` (lines 42-385)
- `src\components\ErrorBoundary.js` (lines 6-147)
- `src\components\HomeView.js` (lines 4-314)
- `src\components\IHKLearningPathView.js` (lines 11-423)
- `src\components\IHKModuleListView.js` (lines 13-285)
- *... and 17 more locations*

**Refactoring Recommendation:**
Create a shared utility module for async-data-fetching operations.

---

### EVENT HANDLING
- **Instances**: 10
- **Pattern**: event-handling

**Locations:**
- `src\components\CategoryFilterComponent.js` (lines 4-528)
- `src\components\EmptyState.js` (lines 5-187)
- `src\components\ExamChanges2025Component.js` (lines 5-330)
- `src\components\IHKLearningPathListView.js` (lines 8-121)
- `src\components\Navigation.js` (lines 4-181)
- *... and 5 more locations*

**Refactoring Recommendation:**
Create a shared utility module for event-handling operations.

---

### ARRAY OPERATIONS
- **Instances**: 3
- **Pattern**: array-operations

**Locations:**
- `src\utils\validators\LearningPathValidator.js` (lines 6-131)
- `src\utils\validators\ModuleValidator.js` (lines 6-167)
- `src\utils\validators\QuizValidator.js` (lines 6-254)

**Refactoring Recommendation:**
Create a shared utility module for array-operations operations.

---

### STORAGE OPERATIONS
- **Instances**: 2
- **Pattern**: storage-operations

**Locations:**
- `src\services\StateManager.js` (lines 6-227)
- `src\services\StorageService.js` (lines 4-195)

**Refactoring Recommendation:**
Create a shared utility module for storage-operations operations.

---

## Refactoring Opportunities

### Low Priority
1. Create pattern-specific utility modules
2. Standardize common operations
3. Document best practices for each pattern

## Estimated Impact

- **Lines Reduced**: ~0 lines
- **Maintainability**: Improved (single source of truth)
- **Bug Risk**: Reduced (fix once, apply everywhere)
- **Code Clarity**: Improved (clear abstractions)

## Next Steps

1. Review exact duplicates and prioritize refactoring
2. Create shared utility modules
3. Refactor code to use shared utilities
4. Test thoroughly after each refactoring
5. Update documentation
