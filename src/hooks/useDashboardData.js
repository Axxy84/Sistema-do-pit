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
      console.log('📊 Buscando dados do dashboard...');
      
      // TEMPORÁRIO: Simular dados para teste (backend não responde)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      
      const dashboardData = {
        kpis: {
          salesToday: 1234.56,
          newCustomersToday: 8,
          pizzasSoldToday: 45,
          pendingOrders: 3
        },
        recentOrders: [
          { id: 1, customerName: 'João Silva', total: 45.00, createdAt: new Date().toISOString() },
          { id: 2, customerName: 'Maria Santos', total: 32.50, createdAt: new Date().toISOString() }
        ],
        topPizzas: [
          { nome: 'Margherita', quantidade: 15 },
          { nome: 'Pepperoni', quantidade: 12 },
          { nome: 'Calabresa', quantidade: 8 }
        ],
        salesOverTime: [
          { data: '2025-01-01', total: 500 },
          { data: '2025-01-02', total: 750 },
          { data: '2025-01-03', total: 1200 }
        ]
      };
      
      console.log('✅ Dados de teste carregados:', dashboardData);
      
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