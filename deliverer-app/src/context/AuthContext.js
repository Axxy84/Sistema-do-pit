import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({
  isAuthenticated: false,
  deliverer: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};