import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected application error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
          <div className="max-w-lg w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-8">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Something interrupted your session
              </h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
              Your local and cloud records remain safe. You can reload the workspace to continue.
            </p>
            <pre className="text-xs font-mono-tabular bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 p-3 rounded-lg overflow-x-auto mb-6">
              {this.state.errorMessage.slice(0, 320)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
