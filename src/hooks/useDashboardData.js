import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';

export const useDashboardData = () => {
  console.log('🎯 useDashboardData - Hook inicializado');

  const [kpiRawData, setKpiRawData] = useState({
    salesToday: 0,
    newCustomersToday: 0,
    pizzasSoldToday: 0,
    pendingOrders: 0,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topPizzasData, setTopPizzasData] = useState([]);
  const [salesOverTimeData, setSalesOverTimeData] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingTopPizzas, setIsLoadingTopPizzas] = useState(true);
  const [isLoadingSalesOverTime, setIsLoadingSalesOverTime] = useState(true);
  const { toast } = useToast();

  // Log quando o hook é reinicializado
  useEffect(() => {
    console.log('🔄 useDashboardData - Hook foi reinicializado ou remontado');
  }, []);

  const fetchAllDashboardData = useCallback(async (showToast = false) => {
    console.log('🔄 useDashboardData - Iniciando busca de dados do dashboard...');
    console.log('🔄 useDashboardData - showToast:', showToast);
    
    setLoadingKpis(true);
    setIsLoadingRecent(true);
    setIsLoadingTopPizzas(true);
    setIsLoadingSalesOverTime(true);

    try {
      console.log('📡 useDashboardData - Fazendo requisição para /dashboard...');
      console.log('📡 useDashboardData - apiClient:', typeof apiClient);
      
      // Buscar dados do dashboard via API
      const dashboardData = await apiClient.get('/dashboard');
      
      console.log('✅ useDashboardData - Resposta recebida do servidor:');
      console.log('✅ useDashboardData - Tipo da resposta:', typeof dashboardData);
      console.log('✅ useDashboardData - Dados completos:', JSON.stringify(dashboardData, null, 2));
      
      // Log detalhado de cada seção dos dados
      console.log('📊 useDashboardData - KPIs recebidos:', dashboardData.kpis);
      console.log('📋 useDashboardData - Pedidos recentes recebidos:', dashboardData.recentOrders);
      console.log('🍕 useDashboardData - Top pizzas recebidas:', dashboardData.topPizzas);
      console.log('📈 useDashboardData - Vendas ao longo do tempo recebidas:', dashboardData.salesOverTime);
      
      // Processar KPIs
      const newKpiData = {
        salesToday: dashboardData.kpis?.salesToday || 0,
        newCustomersToday: dashboardData.kpis?.newCustomersToday || 0,
        pizzasSoldToday: dashboardData.kpis?.pizzasSoldToday || 0,
        pendingOrders: dashboardData.kpis?.pendingOrders || 0,
      };
      console.log('📊 useDashboardData - KPIs processados:', newKpiData);
      setKpiRawData(newKpiData);
      setLoadingKpis(false);
      console.log('✅ useDashboardData - KPIs atualizados no estado');

      // Processar pedidos recentes
      const newRecentOrders = dashboardData.recentOrders || [];
      console.log('📋 useDashboardData - Pedidos recentes processados:', newRecentOrders);
      setRecentOrders(newRecentOrders);
      setIsLoadingRecent(false);
      console.log('✅ useDashboardData - Pedidos recentes atualizados no estado');

      // Processar top pizzas
      const newTopPizzas = dashboardData.topPizzas || [];
      console.log('🍕 useDashboardData - Top pizzas processadas:', newTopPizzas);
      setTopPizzasData(newTopPizzas);
      setIsLoadingTopPizzas(false);
      console.log('✅ useDashboardData - Top pizzas atualizadas no estado');

      // Processar vendas ao longo do tempo
      const newSalesOverTime = dashboardData.salesOverTime || [];
      console.log('📈 useDashboardData - Vendas ao longo do tempo processadas:', newSalesOverTime);
      setSalesOverTimeData(newSalesOverTime);
      setIsLoadingSalesOverTime(false);
      console.log('✅ useDashboardData - Vendas ao longo do tempo atualizadas no estado');

      console.log('✅ useDashboardData - Todos os dados do dashboard foram atualizados com sucesso');

      if (showToast) {
        console.log('🍞 useDashboardData - Mostrando toast de sucesso');
        toast({ title: "Dashboard Atualizado", description: "Os dados do dashboard foram recarregados." });
      }

    } catch (error) {
      console.error("❌ useDashboardData - Erro ao buscar dados do dashboard:");
      console.error("❌ useDashboardData - Tipo do erro:", typeof error);
      console.error("❌ useDashboardData - Erro completo:", error);
      console.error("❌ useDashboardData - Stack trace:", error.stack);
      console.error("❌ useDashboardData - Mensagem:", error.message);
      
      if (error.response) {
        console.error("❌ useDashboardData - Status da resposta:", error.response.status);
        console.error("❌ useDashboardData - Dados da resposta:", error.response.data);
        console.error("❌ useDashboardData - Headers da resposta:", error.response.headers);
      } else if (error.request) {
        console.error("❌ useDashboardData - Requisição feita mas sem resposta:", error.request);
      }
      
      toast({ title: "Erro ao Atualizar Dashboard", description: error.message, variant: "destructive" });
      
      // Definir estados de erro
      console.log('🔄 useDashboardData - Definindo estados de erro...');
      setKpiRawData({ salesToday: 0, newCustomersToday: 0, pizzasSoldToday: 0, pendingOrders: 0 });
      setRecentOrders([]);
      setTopPizzasData([]);
      setSalesOverTimeData([]);
      setLoadingKpis(false);
      setIsLoadingRecent(false);
      setIsLoadingTopPizzas(false);
      setIsLoadingSalesOverTime(false);
      console.log('✅ useDashboardData - Estados de erro definidos');
    }
  }, [toast]);

  useEffect(() => {
    console.log('🎯 useDashboardData - useEffect principal executado');
    fetchAllDashboardData();
    
    const handleOrderSaved = () => {
      console.log('📢 useDashboardData - Evento orderSaved recebido');
      fetchAllDashboardData(true);
    };
    const handleCashClosed = () => {
      console.log('📢 useDashboardData - Evento cashClosed recebido');
      fetchAllDashboardData(true);
    };

    window.addEventListener('orderSaved', handleOrderSaved);
    window.addEventListener('cashClosed', handleCashClosed);

    // Atualização periódica a cada 2 minutos (reduzido de 30 segundos para evitar rate limiting)
    console.log('⏰ useDashboardData - Configurando intervalo de atualização (2 minutos)');
    const interval = setInterval(() => {
      console.log('⏰ useDashboardData - Executando atualização periódica');
      fetchAllDashboardData();
    }, 120000); // 2 minutos

    return () => {
      console.log('🧹 useDashboardData - Limpando event listeners e intervalo');
      window.removeEventListener('orderSaved', handleOrderSaved);
      window.removeEventListener('cashClosed', handleCashClosed);
      clearInterval(interval);
    };

  }, [fetchAllDashboardData]);

  // Log do estado atual sempre que algo mudar
  useEffect(() => {
    console.log('📊 useDashboardData - Estado atual do hook:', {
      kpiRawData,
      loadingKpis,
      recentOrdersCount: recentOrders.length,
      isLoadingRecent,
      topPizzasCount: topPizzasData.length,
      isLoadingTopPizzas,
      salesOverTimeCount: salesOverTimeData.length,
      isLoadingSalesOverTime
    });
  }, [kpiRawData, loadingKpis, recentOrders, isLoadingRecent, topPizzasData, isLoadingTopPizzas, salesOverTimeData, isLoadingSalesOverTime]);

  // Log específico para detectar quando os dados são "zerados" ou perdidos
  useEffect(() => {
    const allDataEmpty = kpiRawData.salesToday === 0 && 
                        kpiRawData.newCustomersToday === 0 && 
                        recentOrders.length === 0 && 
                        topPizzasData.length === 0 &&
                        !loadingKpis && !isLoadingRecent && !isLoadingTopPizzas;
    
    if (allDataEmpty) {
      console.warn('⚠️ useDashboardData - DADOS PERDIDOS! Todos os dados estão vazios após carregamento');
      console.warn('⚠️ useDashboardData - Stack trace para investigar:', new Error().stack);
    }
  }, [kpiRawData, recentOrders, topPizzasData, loadingKpis, isLoadingRecent, isLoadingTopPizzas]);

  return {
    kpiRawData,
    loadingKpis,
    recentOrders,
    isLoadingRecent,
    topPizzasData,
    isLoadingTopPizzas,
    salesOverTimeData,
    isLoadingSalesOverTime,
    fetchAllDashboardData // Exposing this if manual refresh is needed elsewhere
  };
};