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
    
    // Verificar se existe token salvo no localStorage
    const savedToken = localStorage.getItem('authToken');
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedToken && savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        const session = { user: profile, access_token: savedToken };
        
        // Restaurar sessão salva
        updateUserState(session, profile, profile);
        console.log('✅ AuthProvider - Sessão restaurada do localStorage');
      } catch (error) {
        console.error('❌ AuthProvider - Erro ao restaurar sessão:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
        updateUserState(null, null, null);
      }
    } else {
      updateUserState(null, null, null);
      console.log('🔓 AuthProvider - Nenhuma sessão encontrada');
    }
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
      // Fazer chamada real para API de login
      const response = await fetch('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no login');
      }

      // Extrair dados da resposta
      const { token, user } = data;
      const profile = {
        full_name: user.full_name || user.name,
        role: user.role
      };

      // Salvar no localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userProfile', JSON.stringify(user));
      
      const session = { user, access_token: token };
      
      updateUserState(session, user, profile);
      console.log('✅ AuthProvider - Login realizado com sucesso');
      
      return { 
        data: { session, user }, 
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
      // Fazer chamada real para API de cadastro
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          fullName: fullName,
          role: role || 'atendente'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no cadastro');
      }

      // Extrair dados da resposta
      const { token, user } = data;
      const profile = {
        full_name: user.full_name || user.name,
        role: user.role
      };

      // Salvar no localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userProfile', JSON.stringify(user));
      
      const session = { user, access_token: token };
      
      updateUserState(session, user, profile);
      console.log('✅ AuthProvider - Cadastro realizado com sucesso');
      
      return { 
        data: { session, user }, 
        error: null, 
        profile 
      };
    } catch (err) {
      console.error('❌ AuthProvider - Erro no cadastro:', err);
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
      // Logout local (limpar dados salvos)
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