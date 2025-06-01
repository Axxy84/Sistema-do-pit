import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import KpiCards from '@/components/dashboard/KpiCards';
import RecentSales from '@/components/dashboard/RecentSales';
import TopPizzas from '@/components/dashboard/TopPizzas';
import TopPizzasChart from '@/components/dashboard/TopPizzasChart';
import SalesOverTimeChart from '@/components/dashboard/SalesOverTimeChart';
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
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
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
          </motion.div>
        </div>
      </div>
    );
  }

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