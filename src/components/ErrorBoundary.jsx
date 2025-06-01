import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    console.error('🚨 ErrorBoundary - Erro capturado:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log detalhado do erro
    console.error('🚨 ErrorBoundary - Detalhes do erro:', {
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: this
    });
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      console.log('🚨 ErrorBoundary - Renderizando tela de erro');
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              🚨 Erro na Aplicação
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Algo deu errado. Verifique o console para mais detalhes.
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 