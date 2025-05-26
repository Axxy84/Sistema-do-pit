import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, user, userRole, loading, initialized, isAuthenticated } = useAuth();
  const location = useLocation();

  // Enquanto está carregando e não foi inicializado ainda
  if (loading && !initialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Verificando autenticação...</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Aguarde um momento</p>
      </div>
    );
  }

  // Verificar se está autenticado
  if (!isAuthenticated() || !session || !user) {
    console.log('🔒 Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permissões de role se especificado
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('⛔ Usuário sem permissão para esta rota:', { userRole, allowedRoles });
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
          <div className="flex items-center space-x-3 text-destructive">
            <Shield className="h-8 w-8" />
            <p className="text-lg font-medium">Acesso Negado</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => window.history.back()}
          >
            Voltar
          </button>
        </div>
      );
    }
  }

  // Se chegou aqui, o usuário está autenticado e tem permissão
  console.log('✅ Acesso autorizado:', { user: user.email, role: userRole });
  return children;
};

export default ProtectedRoute;
