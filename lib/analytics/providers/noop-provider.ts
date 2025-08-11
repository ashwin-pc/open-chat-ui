import { AnalyticsProvider, AnalyticsEvent } from '../types';

export class NoopAnalyticsProvider implements AnalyticsProvider {
  initialize(): void {
    // No-op implementation
  }

  track(event: AnalyticsEvent): void {
    // No-op implementation - could optionally log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] (disabled):', event);
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    // No-op implementation
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] (disabled) identify:', { userId, traits });
    }
  }

  page(name?: string, properties?: Record<string, any>): void {
    // No-op implementation
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] (disabled) page:', { name, properties });
    }
  }
}