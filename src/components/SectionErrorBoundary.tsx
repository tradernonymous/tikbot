'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SectionErrorBoundary] Caught UI error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 text-slate-200"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            <h3 className="font-semibold text-red-200">
              {this.props.fallbackTitle || 'Section Failed to Render'}
            </h3>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {this.state.error?.message || 'An unexpected rendering error occurred in this section.'}
          </p>
          <button
            onClick={this.handleReset}
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
