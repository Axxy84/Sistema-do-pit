import React from 'react';

import { Loader2, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import KpiCards from '@/components/dashboard/KpiCards';
import RecentSales from '@/components/dashboard/RecentSales';
import TopPizzas from '@/components/dashboard/TopPizzas';
import TopPizzasChart from '@/components/dashboard/TopPizzasChart';
import SalesOverTimeChart from '@/components/dashboard/SalesOverTimeChart';
import SalesComparisonChart from '@/components/dashboard/SalesComparisonChart';
import SalesHistogram from '@/components/dashboard/SalesHistogram';
import MultiTrendChart from '@/components/dashboard/MultiTrendChart';
import CumulativeAreaChart from '@/components/dashboard/CumulativeAreaChart';
import { useDashboardData } from '@/hooks/useDashboardData';

const DashboardPage = () => {
  const {
    kpiRawData,
    loadingKpis,
    recentOrders,
    isLoadingRecent,
    topPizzasData,
    isLoadingTopPizzas,
    salesOverTimeData,
    isLoadingSalesOverTime,
    fetchAllDashboardData
  } = useDashboardData();

  // Verificar se todos os componentes estão carregando
  const isAllLoading = loadingKpis && isLoadingRecent && isLoadingTopPizzas && isLoadingSalesOverTime;
  
  // Verificar se há pelo menos alguns dados disponíveis
  const hasAnyData = !loadingKpis || !isLoadingRecent || !isLoadingTopPizzas || !isLoadingSalesOverTime;

  // Verificar se há dados vazios após carregamento
  const hasEmptyData = !loadingKpis && !isLoadingRecent && !isLoadingTopPizzas && !isLoadingSalesOverTime &&
    kpiRawData.salesToday === 0 && kpiRawData.newCustomersToday === 0 && 
    recentOrders.length === 0 && topPizzasData.length === 0;

  const handleManualRefresh = () => {
    fetchAllDashboardData(true);
  };

  // Tela de carregamento inicial completo
  if (isAllLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Carregando Dashboard...</h2>
          <p className="text-muted-foreground">Buscando dados da pizzaria</p>
        </div>
      </div>
    );
  }

  // Tela de dados vazios
  if (hasEmptyData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div
          >
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Nenhum Dado Encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Parece que ainda não há dados suficientes para exibir o dashboard. 
              Isso pode acontecer se você acabou de configurar o sistema ou se não há pedidos hoje.
            </p>
            <Button onClick={handleManualRefresh} variant="outline" size="lg">
              <RefreshCw className="h-5 w-5 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-950 dark:to-red-950/20 min-h-screen p-6">
      <div
        className="bg-gradient-to-r from-black to-red-600 text-white p-6 rounded-lg shadow-xl"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              🍕 Dashboard da Pizzaria
            </h1>
            <p className="text-red-100 text-lg">
              Painel analítico completo - Visualize o desempenho da sua pizzaria em tempo real
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleManualRefresh}
            className="bg-white text-black hover:bg-red-100 border-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <KpiCards kpiData={kpiRawData} isLoading={loadingKpis} />

      {/* Gráficos de Tendências Múltiplas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
        >
          <MultiTrendChart 
            salesData={salesOverTimeData} 
            recentOrders={recentOrders}
            isLoading={isLoadingSalesOverTime || isLoadingRecent} 
          />
        </div>
        <div
        >
          <CumulativeAreaChart 
            salesData={salesOverTimeData} 
            isLoading={isLoadingSalesOverTime} 
          />
        </div>
      </div>

      {/* Gráficos de Comparação e Distribuição */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
        >
          <SalesComparisonChart 
            salesData={salesOverTimeData} 
            isLoading={isLoadingSalesOverTime} 
          />
        </div>
        <div
        >
          <SalesHistogram 
            recentOrders={recentOrders} 
            isLoading={isLoadingRecent} 
          />
        </div>
      </div>

      {/* Gráficos Tradicionais Atualizados */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
        >
          <TopPizzasChart pizzas={topPizzasData} isLoading={isLoadingTopPizzas} />
        </div>
        <div
        >
          <SalesOverTimeChart salesData={salesOverTimeData} isLoading={isLoadingSalesOverTime} />
        </div>
      </div>
      
      {/* Seção de Vendas Recentes e Top Pizzas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div
          className="xl:col-span-2"
        >
          <RecentSales orders={recentOrders} isLoading={isLoadingRecent} />
        </div>
        <div
        >
          <TopPizzas pizzas={topPizzasData.slice(0,5)} isLoading={isLoadingTopPizzas} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;