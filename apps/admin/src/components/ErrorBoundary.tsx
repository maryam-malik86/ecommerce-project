import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 my-6 max-w-xl mx-auto rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Something went wrong</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              An unexpected rendering error occurred in this view. Other sections of your admin dashboard remain active.
            </p>
            {this.state.error && (
              <p className="text-2xs font-mono bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 mt-3 truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
