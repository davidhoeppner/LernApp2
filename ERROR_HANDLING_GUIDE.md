# Error Handling and Loading States Guide

This document describes the error handling and loading state features implemented in the Simple Learning App.

## Components

### 1. ErrorBoundary

The `ErrorBoundary` component provides graceful error handling for view components.

**Features:**

- Wraps view render functions to catch errors
- Displays user-friendly error messages
- Provides context-specific error handling (storage, network, not found)
- Includes retry functionality with exponential backoff
- Shows technical details in collapsible section

**Usage:**

```javascript
// Wrap a route with error boundary
router.register(
  '/modules',
  ErrorBoundary.wrap(async () => {
    const view = new ModuleListView(services);
    return await view.render();
  })
);

// Use retry wrapper for async operations
const fetchWithRetry = ErrorBoundary.withRetry(fetchData, {
  maxRetries: 3,
  delay: 1000,
  backoff: 2,
});
```

### 2. LoadingSpinner

The `LoadingSpinner` component provides visual feedback during async operations.

**Features:**

- Multiple sizes (small, medium, large)
- Fullscreen and overlay modes
- Inline spinners for buttons
- Skeleton loaders for content
- Button loading states

**Usage:**

```javascript
// Show loading spinner
const spinner = LoadingSpinner.create({
  message: 'Loading modules...',
  size: 'medium',
});
container.appendChild(spinner);

// Button loading state
LoadingSpinner.setButtonLoading(button, true);
await performAction();
LoadingSpinner.setButtonLoading(button, false);

// Skeleton loader
const skeleton = LoadingSpinner.createSkeleton('card', 3);
container.appendChild(skeleton);
```

### 3. ToastNotification

The `ToastNotification` system provides user feedback messages.

**Features:**

- Success, error, warning, and info types
- Auto-dismiss with configurable duration
- Action buttons
- Dismissible notifications
- Special handlers for storage and network errors

**Usage:**

```javascript
// Show success toast
toastNotification.success('Module completed!');

// Show error with action
toastNotification.error('Failed to save progress', {
  duration: 7000,
  action: {
    label: 'Retry',
    onClick: () => retryOperation(),
  },
});

// Handle specific errors
toastNotification.handleStorageError(error);
toastNotification.handleNetworkError(error);
```

### 4. EmptyState

The `EmptyState` component displays user-friendly messages when content is empty.

**Features:**

- Predefined states for common scenarios
- Custom icons and messages
- Optional action buttons
- Context-specific empty states

**Usage:**

```javascript
// Show empty state for no modules
const emptyState = EmptyState.noModules('completed');
container.appendChild(emptyState);

// Custom empty state
const emptyState = EmptyState.create({
  icon: '📭',
  title: 'No items found',
  message: 'Try adjusting your filters',
  action: {
    label: 'Clear Filters',
    onClick: () => clearFilters(),
  },
});
```

## Enhanced Services

### StorageService

**Improvements:**

- Fallback to in-memory storage when localStorage unavailable
- Better quota error handling
- Storage usage information
- Graceful degradation

**New Methods:**

```javascript
// Get storage information
const info = storageService.getStorageInfo();
// Returns: { available, used, total, percentage }
```

### StateManager

**Improvements:**

- Custom events for storage quota warnings
- Minimal state saving when quota exceeded
- Better error propagation

**Events:**

- `storage-quota-warning`: Fired when minimal state is saved
- `storage-quota-error`: Fired when save completely fails

## Global Error Handling

The application includes global error handlers in `app.js`:

1. **Uncaught Errors**: Displays toast notification
2. **Unhandled Promise Rejections**: Displays toast notification
3. **Storage Events**: Warns when storage is cleared
4. **Storage Quota Events**: Provides actionable feedback

## Best Practices

### 1. Always Use Error Boundaries for Routes

```javascript
router.register(
  '/path',
  ErrorBoundary.wrap(async () => {
    // Your view code
  })
);
```

### 2. Show Loading States for Async Operations

```javascript
const spinner = LoadingSpinner.create({ message: 'Loading...' });
container.appendChild(spinner);

try {
  const data = await fetchData();
  spinner.remove();
  // Render data
} catch (error) {
  spinner.remove();
  toastNotification.error('Failed to load data');
}
```

### 3. Use Empty States Instead of Generic Messages

```javascript
if (items.length === 0) {
  return EmptyState.noModules(filter).outerHTML;
}
```

### 4. Provide User Feedback for Actions

```javascript
try {
  await saveData();
  toastNotification.success('Data saved successfully!');
} catch (error) {
  toastNotification.error('Failed to save data. Please try again.');
}
```

### 5. Handle Storage Quota Errors

```javascript
try {
  storageService.set('key', largeData);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    toastNotification.handleStorageError(error);
  }
}
```

## Accessibility

All error handling components are accessible:

- **ARIA live regions** for dynamic content
- **Keyboard navigation** support
- **Screen reader** announcements
- **Focus management** for modals and errors
- **Semantic HTML** structure

## Styling

All components use CSS custom properties for theming:

- Error states use `--color-error`
- Success states use `--color-success`
- Warning states use `--color-warning`
- Info states use `--color-primary`

Supports:

- Light and dark themes
- Reduced motion preferences
- Responsive design

## Testing

To test error handling:

1. **Storage Quota**: Fill localStorage to trigger quota errors
2. **Network Errors**: Simulate offline mode
3. **Not Found**: Navigate to invalid routes
4. **Loading States**: Add delays to async operations
5. **Empty States**: Clear all data

## Future Enhancements

Potential improvements:

- Offline detection and handling
- Error reporting/logging service
- Retry queue for failed operations
- Progressive loading strategies
- Error recovery suggestions
