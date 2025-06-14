import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import apiClient from '@/lib/apiClient';

export const useDashboardData = () => {
  const [kpiRawData, setKpiRawData] = useState({ salesToday: 0, newCustomersToday: 0, pizzasSoldToday: 0, pendingOrders: 0 });
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [topPizzasData, setTopPizzasData] = useState([]);
  const [isLoadingTopPizzas, setIsLoadingTopPizzas] = useState(true);
  const [salesOverTimeData, setSalesOverTimeData] = useState([]);
  const [isLoadingSalesOverTime, setIsLoadingSalesOverTime] = useState(true);

  const { toast } = useToast();

  const fetchAllDashboardData = useCallback(async (showToast = false) => {
    setLoadingKpis(true);
    setIsLoadingRecent(true);
    setIsLoadingTopPizzas(true);
    setIsLoadingSalesOverTime(true);

    try {
      console.log('📊 Buscando dados do dashboard da API...');
      
      // Buscar dados reais da API
      const dashboardData = await apiClient.get('/dashboard');
      
      console.log('✅ Dados do dashboard carregados');
      
      // Verificar se os dados existem
      if (!dashboardData) {
        throw new Error('Nenhum dado retornado da API');
      }
      
      // Processar KPIs
      const newKpiData = {
        salesToday: dashboardData.kpis?.salesToday || 0,
        newCustomersToday: dashboardData.kpis?.newCustomersToday || 0,
        pizzasSoldToday: dashboardData.kpis?.pizzasSoldToday || 0,
        pendingOrders: dashboardData.kpis?.pendingOrders || 0,
      };
      setKpiRawData(newKpiData);
      setLoadingKpis(false);

      // Processar pedidos recentes
      const newRecentOrders = dashboardData.recentOrders || [];
      setRecentOrders(newRecentOrders);
      setIsLoadingRecent(false);

      // Processar top pizzas
      const newTopPizzasData = dashboardData.topPizzas || [];
      setTopPizzasData(newTopPizzasData);
      setIsLoadingTopPizzas(false);

      // Processar vendas ao longo do tempo
      const newSalesOverTimeData = dashboardData.salesOverTime || [];
      setSalesOverTimeData(newSalesOverTimeData);
      setIsLoadingSalesOverTime(false);

      if (showToast) {
        toast({ title: "Dashboard Atualizado", description: "Dados atualizados com sucesso!" });
      }

    } catch (error) {
      console.error("❌ Erro ao buscar dados do dashboard:", error);
      console.error("Stack trace:", error.stack);
      
      if (showToast) {
        toast({ title: "Erro ao Atualizar Dashboard", description: error.message || 'Erro desconhecido', variant: "destructive" });
      }
      
      // Definir estados de erro
      setKpiRawData({ salesToday: 0, newCustomersToday: 0, pizzasSoldToday: 0, pendingOrders: 0 });
      setRecentOrders([]);
      setTopPizzasData([]);
      setSalesOverTimeData([]);
      setLoadingKpis(false);
      setIsLoadingRecent(false);
      setIsLoadingTopPizzas(false);
      setIsLoadingSalesOverTime(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllDashboardData();
    
    const handleOrderSaved = () => {
      fetchAllDashboardData(true);
    };
    const handleCashClosed = () => {
      fetchAllDashboardData(true);
    };
    
    // Novos eventos para atualização quando mesa é fechada
    const handleCashUpdate = (event) => {
      console.log('📊 [Dashboard] Evento cashUpdated recebido:', event.detail);
      setTimeout(() => fetchAllDashboardData(true), 1000);
    };

    const handleOrderUpdate = (event) => {
      console.log('📊 [Dashboard] Evento orderStatusChanged recebido:', event.detail);
      if (event.detail?.newStatus === 'fechada' || event.detail?.newStatus === 'entregue') {
        setTimeout(() => fetchAllDashboardData(true), 1000);
      }
    };
    
    // Evento específico para pedido entregue
    const handleOrderDelivered = (event) => {
      console.log('📊 [Dashboard] Evento orderDelivered recebido:', event.detail);
      // Atualizar dashboard imediatamente quando pedido é entregue
      setTimeout(() => fetchAllDashboardData(true), 500);
    };

    window.addEventListener('orderSaved', handleOrderSaved);
    window.addEventListener('cashClosed', handleCashClosed);
    window.addEventListener('cashUpdated', handleCashUpdate);
    window.addEventListener('orderStatusChanged', handleOrderUpdate);
    window.addEventListener('orderDelivered', handleOrderDelivered);

    // Atualização periódica a cada 2 minutos
    const interval = setInterval(() => {
      fetchAllDashboardData();
    }, 120000); // 2 minutos

    return () => {
      window.removeEventListener('orderSaved', handleOrderSaved);
      window.removeEventListener('cashClosed', handleCashClosed);
      window.removeEventListener('cashUpdated', handleCashUpdate);
      window.removeEventListener('orderStatusChanged', handleOrderUpdate);
      window.removeEventListener('orderDelivered', handleOrderDelivered);
      clearInterval(interval);
    };

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    kpiRawData,
    loadingKpis,
    recentOrders,
    isLoadingRecent,
    topPizzasData,
    isLoadingTopPizzas,
    salesOverTimeData,
    isLoadingSalesOverTime,
    fetchAllDashboardData
  };
};