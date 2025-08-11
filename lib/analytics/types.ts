export interface AnalyticsEvent {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  metrics?: Record<string, number>;
}

export interface AnalyticsProvider {
  initialize(): Promise<void> | void;
  track(event: AnalyticsEvent): Promise<void> | void;
  identify?(userId: string, traits?: Record<string, any>): Promise<void> | void;
  page?(name?: string, properties?: Record<string, any>): Promise<void> | void;
}