'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
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
    console.error('[ErrorBoundary caught an unhandled error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl border border-rose-900/60 bg-rose-950/20 text-rose-300">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-sm text-white">
              {this.props.fallbackTitle || 'Component Error Encountered'}
            </h3>
          </div>
          <p className="text-xs text-rose-200/80 mb-4">
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-800/50 border border-rose-700/50 text-xs font-medium text-white transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
