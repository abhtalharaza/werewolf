import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center z-50">
          <div className="max-w-md p-6 rounded-2xl bg-zinc-950/90 border border-red-900/60 shadow-2xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-cinzel font-bold text-red-400">The Veil Wavered</h2>
            <p className="text-xs text-zinc-300">
              A supernatural disturbance was encountered. The village remains standing.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition"
            >
              Resume Village
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
