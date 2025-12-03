import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden relative transition-colors duration-300">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Oops! Something went wrong
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  The chat interface encountered an unexpected error. Don't worry, your conversation history is safe.
                </p>
              </div>

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors duration-200"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-slate-500 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
