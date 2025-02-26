import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Artifacts error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
