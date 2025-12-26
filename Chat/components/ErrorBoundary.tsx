import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {}

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0c0c0e] text-white">
          <div className="p-6 rounded-2xl border border-white/10 bg-black/40">
            <div className="text-lg font-semibold mb-2">Algo deu errado</div>
            <div className="text-sm text-gray-400">Atualize a página. Se persistir, tente limpar o cache.</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
