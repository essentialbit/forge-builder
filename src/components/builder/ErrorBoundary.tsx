"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches render-time errors in the builder so one broken section
 * doesn't take the whole editor down.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[builder] render error:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6">
              An error occurred while rendering. Your data is safe. Reloading usually fixes it.
            </p>
            <pre className="text-xs font-mono bg-slate-900 border border-slate-800 rounded p-3 text-red-300 text-left overflow-x-auto mb-4">
              {this.state.error?.message ?? "Unknown error"}
            </pre>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-md text-sm"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-md text-sm inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
