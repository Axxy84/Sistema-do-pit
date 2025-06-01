import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext(null);

// Função auxiliar para obter dados iniciais do localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('authToken');
    const userProfileData = localStorage.getItem('userProfile');
    
    if (token && userProfileData) {
      const userData = JSON.parse(userProfileData);
      return {
        session: { user: userData, access_token: token },
        user: userData,
        userProfile: {
          full_name: userData.full_name,
          role: userData.role
        },
        userRole: userData.role,
        loading: false, // Não está carregando pois já temos dados
        initialized: true
      };
    }
  } catch (error) {
    console.error('Erro ao recuperar dados iniciais:', error);
  }
  
  return {
    session: null,
    user: null,
    userProfile: null,
    userRole: null,
    loading: true,
    initialized: false
  };
};

export const AuthProvider = ({ children }) => {
  console.log('🔐 AuthProvider - Componente renderizado');
  
  // Inicializar com dados do localStorage se disponíveis
  const initialState = getInitialAuthState();
  
  const [session, setSession] = useState(initialState.session);
  const [user, setUser] = useState(initialState.user);
  const [userProfile, setUserProfile] = useState(initialState.userProfile);
  const [userRole, setUserRole] = useState(initialState.userRole);
  const [loading, setLoading] = useState(initialState.loading);
  const [initialized, setInitialized] = useState(initialState.initialized);

  console.log('🔐 AuthProvider - Estado inicial:', {
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

  useEffect(() => {
    console.log('🔐 AuthProvider - useEffect principal executado');
    
    const validateAuth = async () => {
      // Se já temos dados do localStorage, validar em background
      if (initialState.initialized && initialState.user) {
        console.log('✅ AuthProvider - Validando dados do localStorage no servidor...');
        try {
          const activeSession = await authService.getSession();
          
          if (!activeSession || !activeSession.user) {
            // Token inválido, limpar tudo
            console.log('❌ AuthProvider - Token inválido, limpando dados');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            updateUserState(null, null, null);
          } else {
            console.log('✅ AuthProvider - Sessão validada com sucesso');
            // Atualizar com dados frescos do servidor se necessário
            if (activeSession.user.id !== user?.id) {
              const { profile } = await authService.getUserWithProfile();
              updateUserState(activeSession, activeSession.user, profile);
            }
          }
        } catch (error) {
          console.error("❌ AuthProvider - Erro ao validar sessão:", error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          updateUserState(null, null, null);
        }
      } else {
        // Sem dados locais, tentar obter do servidor
        console.log('🔍 AuthProvider - Buscando dados do servidor...');
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

    // Só validar se ainda não começamos o processo
    if (!initialized || loading) {
      validateAuth();
    }

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
  }, []); // Removendo dependências para evitar re-execução

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