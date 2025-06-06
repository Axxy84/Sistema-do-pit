import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const useRouteLogger = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    console.log('🧭 ROTA MUDOU:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
      navigationType: navigationType,
      timestamp: new Date().toISOString()
    });

    // Log adicional para rotas específicas que podem ter problemas
    if (location.pathname === '/dashboard') {
      console.log('📊 Navegando para Dashboard - verificar se dados carregam');
    } else if (location.pathname === '/tony') {
      console.log('👑 Navegando para Área do Dono - verificar autenticação admin');
    } else if (location.pathname.startsWith('/pedidos')) {
      console.log('🛒 Navegando para Pedidos - verificar rate limiting');
    }

    // Verificar se há parâmetros de URL que podem afetar o comportamento
    if (location.search) {
      console.log('🔍 Parâmetros de URL detectados:', new URLSearchParams(location.search));
    }

  }, [location, navigationType]);

  return { location, navigationType };
}; 