import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const updateUserState = useCallback((activeSession, activeUser, activeProfile) => {
    setSession(activeSession);
    setUser(activeUser);
    setUserProfile(activeProfile);
    setUserRole(activeProfile?.role || null);
    setLoading(false);
    setInitialized(true);
  }, []);

  useEffect(() => {
    console.log('🔐 AuthProvider - Inicializando...');
    
    // TEMPORÁRIO: Sempre começar deslogado para testes
    // Limpar localStorage para forçar tela de login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    
    updateUserState(null, null, null);
    console.log('🔧 AuthProvider - MODO TESTE: Iniciando sempre deslogado');
  }, [updateUserState]);

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
      // Simular login bem-sucedido para teste
      const userData = {
        id: '1',
        email: email,
        full_name: 'Usuário Teste',
        role: 'admin'
      };
      
      // Salvar no localStorage
      localStorage.setItem('authToken', 'test-token-123');
      localStorage.setItem('userProfile', JSON.stringify(userData));
      
      const session = { user: userData, access_token: 'test-token-123' };
      const profile = { full_name: userData.full_name, role: userData.role };
      
      updateUserState(session, userData, profile);
      console.log('✅ AuthProvider - Login realizado com sucesso');
      
      return { 
        data: { session, user: userData }, 
        error: null, 
        profile 
      };
    } catch (err) {
      console.error('❌ AuthProvider - Erro no login:', err);
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
      // TEMPORÁRIO: Simular cadastro bem-sucedido para teste
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        email: email,
        full_name: fullName,
        role: role || 'atendente'
      };
      
      // Salvar no localStorage
      localStorage.setItem('authToken', 'test-token-' + Date.now());
      localStorage.setItem('userProfile', JSON.stringify(userData));
      
      const session = { user: userData, access_token: 'test-token-' + Date.now() };
      const profile = { full_name: userData.full_name, role: userData.role };
      
      updateUserState(session, userData, profile);
      console.log('✅ AuthProvider - Cadastro realizado com sucesso');
      
      return { 
        data: { session, user: userData }, 
        error: null, 
        profile 
      };
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
      // TEMPORÁRIO: Logout simples sem API
      localStorage.removeItem('authToken');
      localStorage.removeItem('userProfile');
      
      updateUserState(null, null, null);
      console.log('✅ AuthProvider - Logout realizado com sucesso');
      return { error: null };
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