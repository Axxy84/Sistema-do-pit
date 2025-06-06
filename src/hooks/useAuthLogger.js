import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useAuthLogger = () => {
  const authState = useAuth();
  const { session, loading, userRole, user, userProfile } = authState;

  useEffect(() => {
    console.log('🔐 ESTADO DE AUTENTICAÇÃO MUDOU:', {
      hasSession: !!session,
      isLoading: loading,
      userRole: userRole,
      hasUser: !!user,
      hasUserProfile: !!userProfile,
      userEmail: user?.email || 'N/A',
      timestamp: new Date().toISOString()
    });

    // Logs específicos para diferentes estados
    if (loading) {
      console.log('⏳ Autenticação carregando...');
    } else if (session && user) {
      console.log('✅ Usuário autenticado:', {
        email: user.email,
        role: userRole,
        profileName: userProfile?.full_name
      });
    } else {
      console.log('❌ Usuário não autenticado');
    }

    // Verificar problemas comuns
    if (session && !userRole) {
      console.warn('⚠️ PROBLEMA: Sessão existe mas userRole está undefined');
    }

    if (user && !session) {
      console.warn('⚠️ PROBLEMA: User existe mas session está undefined');
    }

  }, [session, loading, userRole, user, userProfile]);

  return authState;
}; 