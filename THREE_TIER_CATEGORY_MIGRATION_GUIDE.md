# Three-Tier Category System Migration Guide

## Overview

This guide helps developers migrate from the legacy category system to the new three-tier category system. The migration is designed to be seamless with full backward compatibility.

## Quick Start

### For Existing Code

**Before (Legacy):**

```javascript
// Getting modules by legacy category
const modules = await ihkContentService.getModulesByCategory('BP-DPA-01');

// Legacy search with category filter
const results = await ihkContentService.searchContent('query', {
  category: 'BP-01',
});
```

**After (Three-Tier):**

```javascript
// Getting modules by three-tier category
const modules = await ihkContentService.getModulesByThreeTierCategory(
  'daten-prozessanalyse'
);

// Three-tier search with category filter
const results = await ihkContentService.searchThreeTierCategories('query', {
  categories: ['anwendungsentwicklung'],
});
```

## Migration Steps

### Step 1: Update Service Calls

#### Content Retrieval

Replace legacy category-specific calls with three-tier equivalents:

```javascript
// OLD: Legacy category filtering
const bpModules = await ihkContentService.getModulesByCategory('BP-01');
const dpaModules = await ihkContentService.getModulesByCategory('BP-DPA-01');
const generalModules = await ihkContentService.getModulesByCategory('FÜ-01');

// NEW: Three-tier category filtering
const aeModules = await ihkContentService.getModulesByThreeTierCategory(
  'anwendungsentwicklung'
);
const dpaModules = await ihkContentService.getModulesByThreeTierCategory(
  'daten-prozessanalyse'
);
const generalModules =
  await ihkContentService.getModulesByThreeTierCategory('allgemein');
```

#### Search Operations

Update search calls to use the new category system:

```javascript
// OLD: Legacy search with category filter
const searchResults = await ihkContentService.searchContent('database', {
  category: 'BP-DPA-01',
  difficulty: 'intermediate',
});

// NEW: Three-tier search with enhanced filtering
const searchResults = await ihkContentService.searchThreeTierCategories(
  'database',
  {
    categories: ['daten-prozessanalyse'],
    contentTypes: ['module', 'quiz'],
    maxResultsPerCategory: 10,
    sortBy: 'relevance',
  }
);
```

### Step 2: Update Component Logic

#### Category Filtering in Components

Update UI components to use three-tier categories:

```javascript
// OLD: Legacy category filters
const categoryFilters = [
  { id: 'BP-01', name: 'Betriebliche Prozesse 1' },
  { id: 'BP-DPA-01', name: 'DPA Modul 1' },
  { id: 'FÜ-01', name: 'Fachrichtungsübergreifend 1' },
];

// NEW: Three-tier category filters
const categoryFilters = [
  {
    id: 'anwendungsentwicklung',
    name: 'Anwendungsentwicklung',
    icon: '💻',
    color: '#dc2626',
  },
  {
    id: 'daten-prozessanalyse',
    name: 'Daten und Prozessanalyse',
    icon: '📊',
    color: '#2563eb',
  },
  {
    id: 'allgemein',
    name: 'Allgemein',
    icon: '📖',
    color: '#059669',
  },
];
```

#### Category Detection Logic

Update category detection to use the new system:

```javascript
// OLD: Manual category detection
function getCategoryType(module) {
  const categoryId = module.category;
  if (categoryId.startsWith('BP-DPA')) return 'dpa';
  if (categoryId.startsWith('BP-')) return 'ae';
  if (categoryId.startsWith('FÜ')) return 'general';
  return 'unknown';
}

// NEW: Use three-tier category information
function getCategoryType(module) {
  // Use pre-computed three-tier category if available
  if (module.threeTierCategory) {
    return module.threeTierCategory;
  }

  // Fallback to mapping service
  if (categoryMappingService) {
    const result = categoryMappingService.mapToThreeTierCategory(module);
    return result.threeTierCategory;
  }

  return 'allgemein'; // Default fallback
}
```

### Step 3: Update Data Access Patterns

#### Content Organization

Use the new organized content structure:

```javascript
// OLD: Manual content organization
async function organizeContentBySpecialization(specializationId) {
  const allModules = await ihkContentService.getAllModules();
  const relevantModules = allModules.filter(module => {
    const relevance = specializationService.getCategoryRelevance(
      module.category,
      specializationId
    );
    return relevance === 'high';
  });

  return { modules: relevantModules };
}

// NEW: Use built-in content organization
async function organizeContentBySpecialization(specializationId) {
  const organizedContent =
    await ihkContentService.getContentWithCategoryInfo(specializationId);

  // Content is already organized by three-tier categories with relevance
  return organizedContent;
}
```

#### Statistics and Analytics

Update statistics gathering:

```javascript
// OLD: Manual statistics calculation
async function getContentStatistics() {
  const allModules = await ihkContentService.getAllModules();
  const stats = {
    total: allModules.length,
    byCategory: {},
  };

  allModules.forEach(module => {
    const category = module.category;
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });

  return stats;
}

// NEW: Use built-in statistics
async function getContentStatistics() {
  const stats = await ihkContentService.getThreeTierCategoryStatistics({
    includeSpecializationRelevance: true,
    includeDifficultyDistribution: true,
    includeContentTypes: true,
  });

  return stats;
}
```

## Legacy Category Mapping

### Automatic Mapping Rules

The system automatically maps legacy categories to three-tier categories:

| Legacy Category Pattern  | Three-Tier Category     | Description          |
| ------------------------ | ----------------------- | -------------------- |
| `BP-DPA-*`, `bp-dpa-*`   | `daten-prozessanalyse`  | DPA-specific content |
| `BP-AE-*`, `bp-ae-*`     | `anwendungsentwicklung` | AE-specific content  |
| `BP-01` to `BP-05`       | `anwendungsentwicklung` | General AE modules   |
| `FÜ-*`, `FUE-*`, `fue-*` | `allgemein`             | General content      |
| Unknown/Other            | `allgemein`             | Default fallback     |

### Custom Mapping Rules

If you need custom mapping logic, use the CategoryMappingService:

```javascript
// Check current mapping for content
const mappingResult =
  categoryMappingService.mapToThreeTierCategory(contentItem);
console.log('Mapped to:', mappingResult.threeTierCategory);
console.log('Mapping reason:', mappingResult.reason);

// Get category relevance for specialization
const relevance = categoryMappingService.getCategoryRelevance(
  'daten-prozessanalyse',
  'daten-prozessanalyse'
);
console.log('Relevance:', relevance); // 'high'
```

## Handling Backward Compatibility

### Deprecation Warnings

Legacy methods will show deprecation warnings but continue to work:

```javascript
// This will work but show a warning
const modules = await ihkContentService.getModulesByLegacyCategory('BP-DPA-01');
// Console: "getModulesByLegacyCategory() is deprecated. Use getModulesByThreeTierCategory() instead."

// Preferred approach
const modules = await ihkContentService.getModulesByThreeTierCategory(
  'daten-prozessanalyse'
);
```

### Gradual Migration Strategy

You can migrate gradually by updating one component at a time:

1. **Phase 1**: Update data access layer to use new methods
2. **Phase 2**: Update UI components to display three-tier categories
3. **Phase 3**: Remove legacy method calls
4. **Phase 4**: Clean up deprecated code

### Testing During Migration

Test both old and new approaches during migration:

```javascript
// Test helper to compare old vs new results
async function compareResults(contentId) {
  // Legacy approach
  const legacyModules =
    await ihkContentService.getModulesByCategory('BP-DPA-01');

  // New approach
  const newModules = await ihkContentService.getModulesByThreeTierCategory(
    'daten-prozessanalyse'
  );

  console.log('Legacy count:', legacyModules.length);
  console.log('New count:', newModules.length);

  // Verify content overlap
  const legacyIds = new Set(legacyModules.map(m => m.id));
  const newIds = new Set(newModules.map(m => m.id));
  const overlap = [...legacyIds].filter(id => newIds.has(id));

  console.log('Content overlap:', overlap.length);
}
```

## Common Migration Patterns

### Pattern 1: Category-Based Filtering

```javascript
// OLD: Hard-coded category checks
function filterModulesByType(modules, type) {
  return modules.filter(module => {
    switch (type) {
      case 'dpa':
        return module.category.includes('BP-DPA');
      case 'ae':
        return (
          module.category.startsWith('BP-') && !module.category.includes('DPA')
        );
      case 'general':
        return module.category.startsWith('FÜ');
      default:
        return true;
    }
  });
}

// NEW: Use three-tier category system
function filterModulesByType(modules, type) {
  const categoryMap = {
    dpa: 'daten-prozessanalyse',
    ae: 'anwendungsentwicklung',
    general: 'allgemein',
  };

  const targetCategory = categoryMap[type];
  if (!targetCategory) return modules;

  return modules.filter(module => module.threeTierCategory === targetCategory);
}
```

### Pattern 2: Specialization-Aware Content

```javascript
// OLD: Manual relevance calculation
function getRelevantContent(modules, specializationId) {
  return modules.filter(module => {
    const relevance = specializationService.getCategoryRelevance(
      module.category,
      specializationId
    );
    return relevance === 'high' || relevance === 'medium';
  });
}

// NEW: Use organized content with built-in relevance
async function getRelevantContent(specializationId) {
  const organizedContent =
    await ihkContentService.getContentWithCategoryInfo(specializationId);

  // Get content from categories with high/medium relevance
  const relevantContent = [];
  Object.entries(organizedContent).forEach(([categoryId, categoryData]) => {
    if (
      categoryData.relevance === 'high' ||
      categoryData.relevance === 'medium'
    ) {
      relevantContent.push(...categoryData.modules);
    }
  });

  return relevantContent;
}
```

### Pattern 3: Search with Category Context

```javascript
// OLD: Basic search with manual filtering
async function searchWithContext(query, userSpecialization) {
  const allResults = await ihkContentService.searchContent(query);

  // Manual filtering and sorting by relevance
  const relevantResults = allResults
    .filter(item => {
      const relevance = specializationService.getCategoryRelevance(
        item.category,
        userSpecialization
      );
      return relevance !== 'none';
    })
    .sort((a, b) => {
      const aRelevance = specializationService.getCategoryRelevance(
        a.category,
        userSpecialization
      );
      const bRelevance = specializationService.getCategoryRelevance(
        b.category,
        userSpecialization
      );
      const relevanceOrder = { high: 3, medium: 2, low: 1, none: 0 };
      return relevanceOrder[bRelevance] - relevanceOrder[aRelevance];
    });

  return relevantResults;
}

// NEW: Use enhanced search with built-in relevance
async function searchWithContext(query, userSpecialization) {
  const searchResults = await ihkContentService.searchThreeTierCategories(
    query,
    {
      categories: [
        'daten-prozessanalyse',
        'anwendungsentwicklung',
        'allgemein',
      ],
      specializationId: userSpecialization, // Automatic relevance boosting
      sortBy: 'relevance',
      maxResultsPerCategory: 10,
    }
  );

  // Results are already organized and sorted by relevance
  return searchResults;
}
```

## Error Handling During Migration

### Graceful Fallbacks

```javascript
// Robust category detection with fallbacks
function getCategoryInfo(contentItem) {
  try {
    // Try new three-tier system first
    if (contentItem.threeTierCategory) {
      return {
        category: contentItem.threeTierCategory,
        source: 'three-tier',
      };
    }

    // Try mapping service
    if (categoryMappingService) {
      const result = categoryMappingService.mapToThreeTierCategory(contentItem);
      return {
        category: result.threeTierCategory,
        source: 'mapped',
      };
    }

    // Fallback to legacy detection
    const legacyCategory = contentItem.category || contentItem.categoryId;
    if (legacyCategory) {
      if (legacyCategory.includes('BP-DPA'))
        return { category: 'daten-prozessanalyse', source: 'legacy' };
      if (legacyCategory.includes('BP-AE') || legacyCategory.startsWith('BP-'))
        return { category: 'anwendungsentwicklung', source: 'legacy' };
      return { category: 'allgemein', source: 'legacy' };
    }

    // Ultimate fallback
    return { category: 'allgemein', source: 'default' };
  } catch (error) {
    console.warn(
      'Error determining category for content:',
      contentItem.id,
      error
    );
    return { category: 'allgemein', source: 'error-fallback' };
  }
}
```

### Migration Validation

```javascript
// Validate migration results
async function validateMigration() {
  const issues = [];

  try {
    // Check if all content has three-tier categories
    const allModules = await ihkContentService.getAllModules();
    const modulesWithoutCategory = allModules.filter(m => !m.threeTierCategory);

    if (modulesWithoutCategory.length > 0) {
      issues.push(
        `${modulesWithoutCategory.length} modules missing three-tier category`
      );
    }

    // Check category distribution
    const stats = await ihkContentService.getThreeTierCategoryStatistics();
    const totalContent = stats.overview.totalContent;

    Object.entries(stats.categories).forEach(([categoryId, categoryStats]) => {
      const percentage =
        (categoryStats.contentCounts.total / totalContent) * 100;
      if (percentage < 5) {
        issues.push(
          `Category ${categoryId} has very low content (${percentage.toFixed(1)}%)`
        );
      }
    });

    // Check for mapping errors
    if (categoryMappingService) {
      const validation = await categoryMappingService.validateAllMappings();
      if (validation.errors.length > 0) {
        issues.push(
          `${validation.errors.length} category mapping errors found`
        );
      }
    }
  } catch (error) {
    issues.push(`Migration validation failed: ${error.message}`);
  }

  return {
    success: issues.length === 0,
    issues: issues,
  };
}
```

## Performance Considerations

### Caching Strategy During Migration

```javascript
// Preload three-tier category data for better performance
async function optimizeForMigration() {
  try {
    // Preload categorized content
    await ihkContentService.preloadCategorizedContent();

    // Warm up category statistics cache
    await ihkContentService.getThreeTierCategoryStatistics();

    // Build category indexes
    await ihkContentService.optimizeCache();

    console.log('Migration optimization completed');
  } catch (error) {
    console.warn('Migration optimization failed:', error);
  }
}
```

### Memory Management

```javascript
// Monitor memory usage during migration
function monitorMigrationMemory() {
  const stats = ihkContentService.getCacheStats();

  console.log('Cache Statistics:', {
    modules: stats.modules,
    quizzes: stats.quizzes,
    categorizedContent: stats.categorizedContent,
    memoryUsage: stats.memoryUsage,
  });

  // Optimize if memory usage is high
  if (stats.categorizedContent.cacheSize > 100) {
    ihkContentService.optimizeCache();
  }
}
```

## Testing Your Migration

### Unit Tests

```javascript
// Test category mapping
describe('Three-Tier Category Migration', () => {
  test('should map DPA content correctly', async () => {
    const dpaModule = { id: 'test', category: 'BP-DPA-01' };
    const result = categoryMappingService.mapToThreeTierCategory(dpaModule);
    expect(result.threeTierCategory).toBe('daten-prozessanalyse');
  });

  test('should preserve backward compatibility', async () => {
    const legacyResult =
      await ihkContentService.getModulesByLegacyCategory('BP-DPA-01');
    const newResult = await ihkContentService.getModulesByThreeTierCategory(
      'daten-prozessanalyse'
    );

    // Should have significant overlap
    const legacyIds = new Set(legacyResult.map(m => m.id));
    const newIds = new Set(newResult.map(m => m.id));
    const overlap = [...legacyIds].filter(id => newIds.has(id));

    expect(overlap.length).toBeGreaterThan(legacyResult.length * 0.8);
  });
});
```

### Integration Tests

```javascript
// Test complete migration workflow
describe('Migration Integration', () => {
  test('should maintain user progress across migration', async () => {
    // Simulate user with progress in legacy system
    const userProgress = {
      modulesCompleted: ['bp-dpa-01-module', 'bp-ae-02-module'],
      quizAttempts: [{ quizId: 'bp-dpa-01-quiz', score: 85 }],
    };

    // Load content with new system
    const organizedContent = await ihkContentService.getContentWithCategoryInfo(
      'daten-prozessanalyse'
    );

    // Verify progress is preserved
    const dpaModules = organizedContent['daten-prozessanalyse'].modules;
    const completedModule = dpaModules.find(m => m.id === 'bp-dpa-01-module');

    expect(completedModule.completed).toBe(true);
  });
});
```

## Rollback Strategy

If you need to rollback the migration:

```javascript
// Disable three-tier category system temporarily
const ENABLE_THREE_TIER_CATEGORIES = false;

function getModules(categoryFilter) {
  if (ENABLE_THREE_TIER_CATEGORIES) {
    return ihkContentService.getModulesByThreeTierCategory(categoryFilter);
  } else {
    return ihkContentService.getModulesByLegacyCategory(categoryFilter);
  }
}
```

## Getting Help

### Debug Information

```javascript
// Get detailed migration status
function getMigrationStatus() {
  return {
    cacheStats: ihkContentService.getCacheStats(),
    categoryMappingAvailable: !!categoryMappingService,
    threeTierCategoriesEnabled: true,
    migrationTimestamp: new Date().toISOString(),
  };
}
```

### Common Issues and Solutions

1. **Content not appearing in expected category**
   - Check `threeTierCategory` field on content items
   - Verify CategoryMappingService is available
   - Review mapping rules and priorities

2. **Performance degradation**
   - Use `preloadCategorizedContent()` for better performance
   - Monitor cache statistics with `getCacheStats()`
   - Optimize cache with `optimizeCache()`

3. **Backward compatibility issues**
   - Ensure original category fields are preserved
   - Test legacy methods still work
   - Check deprecation warning handling

For additional support, refer to the main documentation or contact the development team.
