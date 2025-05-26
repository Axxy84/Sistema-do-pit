import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import TonyLoginPage from '@/components/tony/TonyLoginPage';
import TonyDashboardPage from '@/components/tony/TonyDashboardPage';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TonyPage = () => {
  console.log('👑 TonyPage - Componente renderizado');
  
  const { session, loading, userRole, user } = useAuth();

  console.log('👑 TonyPage - Estado de autenticação:', {
    hasSession: !!session,
    loading: loading,
    userRole: userRole,
    hasUser: !!user,
    userEmail: user?.email
  });

  useEffect(() => {
    console.log('👑 TonyPage - useEffect executado');
    
    return () => {
      console.log('👑 TonyPage - Componente desmontado (cleanup)');
    };
  }, []);

  if (loading) {
    console.log('⏳ TonyPage - Mostrando tela de carregamento');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 dark:from-slate-900 dark:to-primary/10">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = session && userRole === 'admin';
  console.log('👑 TonyPage - Verificação de admin:', {
    isAdmin: isAdmin,
    hasSession: !!session,
    userRole: userRole
  });
  
  // If there is a session, but the user is not admin, redirect them from /tony
  if (session && !isAdmin) {
    console.log('🚫 TonyPage - Usuário não é admin, redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ TonyPage - Renderizando componente principal:', isAdmin ? 'TonyDashboardPage' : 'TonyLoginPage');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full"
    >
      {isAdmin ? <TonyDashboardPage /> : <TonyLoginPage />}
    </motion.div>
  );
};

export default TonyPage;