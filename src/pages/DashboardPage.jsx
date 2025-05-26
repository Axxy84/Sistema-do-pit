import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import KpiCards from '@/components/dashboard/KpiCards';
import RecentSales from '@/components/dashboard/RecentSales';
import TopPizzas from '@/components/dashboard/TopPizzas';
import TopPizzasChart from '@/components/dashboard/TopPizzasChart';
import SalesOverTimeChart from '@/components/dashboard/SalesOverTimeChart';
import { useDashboardData } from '@/hooks/useDashboardData';

const DashboardPage = () => {
  console.log('📊 DashboardPage - Iniciando renderização');

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

  console.log('📊 DashboardPage - Dados recebidos do hook:', {
    kpiRawData: kpiRawData,
    loadingKpis: loadingKpis,
    recentOrdersCount: recentOrders?.length || 0,
    isLoadingRecent: isLoadingRecent,
    topPizzasCount: topPizzasData?.length || 0,
    isLoadingTopPizzas: isLoadingTopPizzas,
    salesOverTimeCount: salesOverTimeData?.length || 0,
    isLoadingSalesOverTime: isLoadingSalesOverTime
  });

  // Verificar se há dados zerados que podem indicar problemas
  if (!loadingKpis && kpiRawData.salesToday === 0 && kpiRawData.newCustomersToday === 0) {
    console.warn('⚠️ DashboardPage - Todos os KPIs estão zerados, pode indicar problema na API ou dados vazios');
  }

  if (!isLoadingRecent && recentOrders.length === 0) {
    console.warn('⚠️ DashboardPage - Nenhum pedido recente encontrado');
  }

  // Verificar se todos os dados estão carregando
  const isAllLoading = loadingKpis && isLoadingRecent && isLoadingTopPizzas && isLoadingSalesOverTime;
  const hasAnyData = !loadingKpis || !isLoadingRecent || !isLoadingTopPizzas || !isLoadingSalesOverTime;

  console.log('📊 DashboardPage - Estados de carregamento:', {
    isAllLoading,
    hasAnyData,
    loadingStates: {
      kpis: loadingKpis,
      recent: isLoadingRecent,
      topPizzas: isLoadingTopPizzas,
      salesOverTime: isLoadingSalesOverTime
    }
  });

  // Verificar se há dados vazios após carregamento
  const hasEmptyData = !loadingKpis && !isLoadingRecent && !isLoadingTopPizzas && !isLoadingSalesOverTime &&
    kpiRawData.salesToday === 0 && kpiRawData.newCustomersToday === 0 && 
    recentOrders.length === 0 && topPizzasData.length === 0;

  if (hasEmptyData) {
    console.warn('⚠️ DashboardPage - Todos os dados estão vazios após carregamento completo');
  }

  const handleManualRefresh = () => {
    console.log('🔄 DashboardPage - Refresh manual solicitado');
    fetchAllDashboardData(true);
  };

  // Tela de carregamento inicial completo
  if (isAllLoading) {
    console.log('⏳ DashboardPage - Mostrando tela de carregamento completo');
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
    console.log('📭 DashboardPage - Mostrando tela de dados vazios');
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-red-400">
            Dashboard da Pizzaria
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Bem-vindo ao seu painel de controle. Aqui você encontra um resumo das atividades.
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Nenhum Dado Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Não foram encontrados dados para exibir no dashboard. Isso pode acontecer se:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
              <li>• Não há pedidos registrados ainda</li>
              <li>• Há um problema de conexão com o servidor</li>
              <li>• O banco de dados está vazio</li>
            </ul>
            <Button onClick={handleManualRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('✅ DashboardPage - Renderizando dashboard com dados');

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-red-400">
              Dashboard da Pizzaria
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Bem-vindo ao seu painel de controle. Aqui você encontra um resumo das atividades.
            </p>
          </div>
          <Button variant="outline" onClick={handleManualRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Debug Info Card - Remover em produção */}
      <Card className="border-dashed border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-700 dark:text-yellow-300">
            🔍 Debug Info (Remover em produção)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>KPIs: {loadingKpis ? 'Carregando...' : `Vendas: R$ ${kpiRawData.salesToday}, Clientes: ${kpiRawData.newCustomersToday}`}</div>
          <div>Pedidos Recentes: {isLoadingRecent ? 'Carregando...' : `${recentOrders.length} pedidos`}</div>
          <div>Top Pizzas: {isLoadingTopPizzas ? 'Carregando...' : `${topPizzasData.length} pizzas`}</div>
          <div>Vendas no Tempo: {isLoadingSalesOverTime ? 'Carregando...' : `${salesOverTimeData.length} pontos`}</div>
        </CardContent>
      </Card>

      <KpiCards kpiData={kpiRawData} isLoading={loadingKpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TopPizzasChart pizzas={topPizzasData} isLoading={isLoadingTopPizzas} />
        </motion.div>
         <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SalesOverTimeChart salesData={salesOverTimeData} isLoading={isLoadingSalesOverTime} />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <RecentSales orders={recentOrders} isLoading={isLoadingRecent} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <TopPizzas pizzas={topPizzasData.slice(0,5)} isLoading={isLoadingTopPizzas} />
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;