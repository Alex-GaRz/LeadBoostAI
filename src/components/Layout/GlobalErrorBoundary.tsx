// src/components/Layout/GlobalErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL SYSTEM FAILURE:', error, errorInfo);
    // Aquí conectaríamos con el servicio de logs (ej. Sentry/Datadog)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-gray-300 flex flex-col items-center justify-center font-mono p-4">
          <div className="max-w-md w-full border border-red-900/50 bg-red-950/10 p-6 rounded-sm">
            <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center">
              <span className="mr-2">⚠</span> SYSTEM PARTIALLY UNAVAILABLE
            </h2>
            <p className="text-sm mb-4 text-gray-400">
              Se ha detectado una anomalía crítica en el módulo visual. 
              El núcleo de seguridad ha aislado el componente defectuoso.
            </p>
            <div className="bg-black/50 p-3 rounded border border-gray-800 mb-6 overflow-auto max-h-32">
              <code className="text-xs text-red-400">
                {this.state.error?.toString()}
              </code>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/dashboard';
              }}
              className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 py-2 px-4 transition-colors uppercase tracking-widest text-xs font-semibold"
            >
              Forzar Reinicio de Interfaz
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;