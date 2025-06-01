import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';

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
      const dashboardData = await apiClient.get('/dashboard');
      
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
      console.error("❌ Erro ao buscar dados do dashboard:", error.message);
      
      if (showToast) {
        toast({ title: "Erro ao Atualizar Dashboard", description: error.message, variant: "destructive" });
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

    window.addEventListener('orderSaved', handleOrderSaved);
    window.addEventListener('cashClosed', handleCashClosed);

    // Atualização periódica a cada 2 minutos
    const interval = setInterval(() => {
      fetchAllDashboardData();
    }, 120000); // 2 minutos

    return () => {
      window.removeEventListener('orderSaved', handleOrderSaved);
      window.removeEventListener('cashClosed', handleCashClosed);
      clearInterval(interval);
    };

  }, [fetchAllDashboardData]);

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