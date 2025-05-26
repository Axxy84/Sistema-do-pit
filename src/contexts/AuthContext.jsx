import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log('🔐 AuthProvider - Componente renderizado');
  
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  console.log('🔐 AuthProvider - Estado atual:', {
    hasSession: !!session,
    loading: loading,
    initialized: initialized,
    userRole: userRole,
    userEmail: user?.email
  });

  const updateUserState = useCallback((activeSession, activeUser, activeProfile) => {
    console.log('🔄 AuthProvider - Atualizando estado do usuário:', { activeUser, activeProfile });
    setSession(activeSession);
    setUser(activeUser);
    setUserProfile(activeProfile);
    setUserRole(activeProfile?.role || null);
    setLoading(false);
    setInitialized(true);
  }, []);

  // Função para restaurar dados do localStorage rapidamente
  const restoreFromLocalStorage = useCallback(() => {
    console.log('⚡ AuthProvider - Tentando restaurar do localStorage...');
    try {
      const token = localStorage.getItem('authToken');
      const userProfileData = localStorage.getItem('userProfile');
      
      if (token && userProfileData) {
        const userData = JSON.parse(userProfileData);
        const mockSession = { 
          user: userData, 
          access_token: token 
        };
        const mockProfile = {
          full_name: userData.full_name,
          role: userData.role
        };
        
        console.log('⚡ AuthProvider - Restaurando dados do localStorage:', userData);
        updateUserState(mockSession, userData, mockProfile);
        return true;
      }
    } catch (error) {
      console.error('❌ AuthProvider - Erro ao restaurar dados do localStorage:', error);
    }
    console.log('❌ AuthProvider - Nenhum dado válido no localStorage');
    return false;
  }, [updateUserState]);

  useEffect(() => {
    console.log('🔐 AuthProvider - useEffect principal executado');
    
    const initializeAuth = async () => {
      console.log('🚀 AuthProvider - Inicializando autenticação...');
      
      // Primeiro, tentar restaurar rapidamente do localStorage
      const restoredFromLocal = restoreFromLocalStorage();
      
      if (restoredFromLocal) {
        console.log('✅ AuthProvider - Dados restaurados do localStorage, validando no servidor...');
        // Se restaurou do localStorage, validar no servidor em background
        try {
          const activeSession = await authService.getSession();
          const activeUser = activeSession?.user ?? null;
          let activeProfile = null;
          
          if (activeUser) {
            const { profile } = await authService.getUserWithProfile();
            activeProfile = profile;
          }
          
          // Atualizar com dados validados do servidor
          console.log('✅ AuthProvider - Dados validados no servidor');
          updateUserState(activeSession, activeUser, activeProfile);
        } catch (error) {
          console.error("❌ AuthProvider - Erro ao validar sessão no servidor:", error);
          // Se falhou a validação, limpar dados
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          updateUserState(null, null, null);
        }
      } else {
        console.log('❌ AuthProvider - Sem dados locais, tentando do servidor...');
        // Se não tinha dados locais, tentar do servidor
        try {
          const activeSession = await authService.getSession();
          const activeUser = activeSession?.user ?? null;
          let activeProfile = null;
          
          if (activeUser) {
            const { profile } = await authService.getUserWithProfile();
            activeProfile = profile;
          }
          
          console.log('✅ AuthProvider - Dados obtidos do servidor');
          updateUserState(activeSession, activeUser, activeProfile);
        } catch (error) {
          console.error("❌ AuthProvider - Erro na inicialização:", error);
          updateUserState(null, null, null);
        }
      }
    };

    initializeAuth();

    // Configurar listener para mudanças de autenticação
    console.log('🔗 AuthProvider - Configurando listener de mudanças de auth');
    const authListener = authService.onAuthStateChange(
      (event, newSession, newUser, newProfile) => {
        console.log('🔄 AuthProvider - Mudança de estado de autenticação:', event, { newUser, newProfile });
        updateUserState(newSession, newUser, newProfile);
      }
    );

    return () => {
      console.log('🧹 AuthProvider - Limpando listener de auth');
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [updateUserState, restoreFromLocalStorage]);

  // Log sempre que o estado mudar
  useEffect(() => {
    console.log('🔐 AuthProvider - Estado mudou:', {
      hasSession: !!session,
      loading: loading,
      initialized: initialized,
      userRole: userRole,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
  }, [session, loading, initialized, userRole, user]);

  const signInWithPassword = async (email, password) => {
    console.log('🔐 AuthProvider - Realizando login...', { email });
    setLoading(true);
    
    try {
      const { data, error, profile } = await authService.signInWithPassword(email, password);
      
      if (!error && data?.user) {
        updateUserState(data.session, data.user, profile);
        console.log('✅ AuthProvider - Login realizado com sucesso');
        return { data, error: null, profile };
      } else {
        console.error('❌ AuthProvider - Erro no login:', error);
        updateUserState(null, null, null);
        return { data: null, error, profile: null };
      }
    } catch (err) {
      console.error('❌ AuthProvider - Exceção no login:', err);
      updateUserState(null, null, null);
      return { data: null, error: { message: err.message }, profile: null };
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email, password, fullName, role) => {
    console.log('📝 AuthProvider - Realizando cadastro...', { email, fullName, role });
    setLoading(true);
    
    try {
      const { data, error, profile } = await authService.signUp(email, password, fullName, role);
      
      if (!error && data?.user) {
        updateUserState(data.session, data.user, profile);
        console.log('✅ AuthProvider - Cadastro realizado com sucesso');
        return { data, error: null, profile };
      } else {
        console.error('❌ AuthProvider - Erro no cadastro:', error);
        updateUserState(null, null, null);
        return { data: null, error, profile: null };
      }
    } catch (err) {
      console.error('❌ AuthProvider - Exceção no cadastro:', err);
      updateUserState(null, null, null);
      return { data: null, error: { message: err.message }, profile: null };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 AuthProvider - Fazendo logout...');
    setLoading(true);
    
    try {
      const { error } = await authService.signOut();
      updateUserState(null, null, null);
      console.log('✅ AuthProvider - Logout realizado com sucesso');
      return { error };
    } catch (err) {
      console.error('❌ AuthProvider - Erro no logout:', err);
      updateUserState(null, null, null);
      return { error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    userProfile,
    userRole,
    loading,
    initialized,
    signInWithPassword,
    signUp,
    signOut,
    // Métodos utilitários
    isAuthenticated: () => !!user && !!session,
    hasRole: (role) => userRole === role,
    hasAnyRole: (roles) => roles.includes(userRole),
  };

  console.log('✅ AuthProvider - Renderização concluída');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};