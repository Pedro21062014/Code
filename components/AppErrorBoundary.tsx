import React, { Component, type ReactNode } from 'react';

/**
 * Captura qualquer erro de renderização para evitar "tela branca".
 * Mostra uma mensagem amigável com a opção de recarregar.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Erro de renderização:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-white gap-4 p-6 text-center">
          <div className="text-3xl">⚠️</div>
          <h1 className="text-xl font-bold">Algo deu errado</h1>
          <p className="text-sm text-gray-400 max-w-md break-words">
            {this.state.error || 'Ocorreu um erro inesperado ao renderizar a página.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:opacity-90"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
