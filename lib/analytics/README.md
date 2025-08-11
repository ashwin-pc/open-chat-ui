# Analytics System

This analytics system uses dependency injection to provide a clean, pluggable interface for different analytics providers. It's designed to keep the open-source version completely generic and cloud-agnostic while allowing parent applications to inject specific analytics implementations.

## Architecture

The system follows the same dependency injection pattern as the API client:

```typescript
// Parent application creates and injects analytics provider
const analyticsProvider = new MyAnalyticsProvider(config);

<ChatProvider analyticsProvider={analyticsProvider}>
  <ChatApp apiClient={apiClient} />
</ChatProvider>
```

## What's Included in Open-UI

Open-UI provides only the **generic interface** and **no-op implementation**:

- `AnalyticsProvider` interface - Generic contract for all analytics providers
- `AnalyticsEvent` type - Standard event structure
- `NoopAnalyticsProvider` - Silent implementation (default)

**What's NOT included**: No cloud-specific providers (AWS, Google, etc.) - these are implemented by consuming applications.

## Quick Start

### Option 1: No Analytics (Default - Open Source)
By default, no analytics provider is injected, so the system uses a no-op provider:

```typescript
// No analytics provider passed - uses no-op by default
<ChatProvider prompts={systemPrompts} threadId={threadId}>
  <ChatApp apiClient={apiClient} />
</ChatProvider>
```

### Option 2: Custom Analytics Provider
Parent application implements and injects their own analytics:

```typescript
// In your parent application
import { AnalyticsProvider, AnalyticsEvent } from './open-ui';

class MyAnalyticsProvider implements AnalyticsProvider {
  async initialize(): Promise<void> {
    // Your initialization logic
  }
  
  track(event: AnalyticsEvent): void {
    // Your tracking logic
  }
}

const analyticsProvider = new MyAnalyticsProvider();

<ChatProvider 
  prompts={systemPrompts} 
  threadId={threadId} 
  analyticsProvider={analyticsProvider}
>
  <ChatApp apiClient={apiClient} />
</ChatProvider>
```

## Available in Open-UI

### NoopAnalyticsProvider
Silent implementation that does nothing. Used automatically when no provider is injected.

```typescript
import { NoopAnalyticsProvider } from './open-ui';

const provider = new NoopAnalyticsProvider(); // Optional - used by default
```

## Creating Custom Providers

To create a custom analytics provider:

1. Implement the `AnalyticsProvider` interface:

```typescript
import { AnalyticsProvider, AnalyticsEvent } from './open-ui';

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  async initialize(): Promise<void> {
    // Initialize Google Analytics
  }
  
  track(event: AnalyticsEvent): void {
    // Track event with Google Analytics
    gtag('event', event.name, event.attributes);
  }
  
  identify(userId: string, traits?: Record<string, any>): void {
    // Identify user
    gtag('set', { user_id: userId });
  }
  
  page(name?: string, properties?: Record<string, any>): void {
    // Track page view
    gtag('config', 'GA_MEASUREMENT_ID', { page_title: name });
  }
}
```

2. Use it in your parent application:

```typescript
const analyticsProvider = new GoogleAnalyticsProvider();

<ChatProvider analyticsProvider={analyticsProvider}>
  <ChatApp apiClient={apiClient} />
</ChatProvider>
```

## Benefits

### For Open Source
- **No Analytics by Default**: Privacy-first approach
- **No AWS Dependencies**: Clean, dependency-free open-source version
- **User Choice**: Users can inject any analytics provider they prefer
- **Zero Configuration**: Works out of the box without any setup

### For Production Applications
- **Hardcoded Configuration**: Parent controls all analytics configuration
- **Type Safety**: Full TypeScript support for configuration
- **Flexible**: Can switch providers or disable analytics easily
- **Testable**: Easy to inject test/mock providers for testing

### For Developers
- **Consistent Pattern**: Same as API client dependency injection
- **Clean Architecture**: Clear separation of concerns
- **Extensible**: Easy to add new providers
- **Error Handling**: Graceful fallbacks if providers fail

## Integration Example

```typescript
// parent-app/src/index.tsx
import { ChatApp, ChatProvider } from './open-ui';
import { MyAnalyticsProvider } from './analytics/my-analytics-provider';

const analyticsConfig = {
  // Your analytics configuration
  apiKey: 'your-api-key',
  projectId: 'your-project-id'
};

const analyticsProvider = new MyAnalyticsProvider(analyticsConfig);

ReactDOM.render(
  <ChatProvider 
    prompts={systemPrompts} 
    threadId={threadId} 
    analyticsProvider={analyticsProvider}
  >
    <ChatApp apiClient={apiClient} />
  </ChatProvider>,
  document.getElementById('root')
);
```

The open-ui component remains completely agnostic to the specific analytics implementation while providing a clean interface for tracking user interactions.