import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChartBig, Users, Pizza, ShoppingBag, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const KpiCards = ({ kpiData, isLoading }) => {
  console.log('📊 KpiCards - Renderizando componente');
  console.log('📊 KpiCards - Props recebidas:', {
    kpiData: kpiData,
    isLoading: isLoading,
    kpiDataType: typeof kpiData,
    hasKpiData: !!kpiData
  });

  // Verificar se kpiData está definido
  if (!kpiData) {
    console.error('❌ KpiCards - kpiData é undefined ou null');
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <div className="text-3xl font-bold">...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiConfig = [
    { 
      id: 'salesToday', 
      title: 'Vendas Hoje', 
      value: formatCurrency(kpiData.salesToday), 
      rawValue: kpiData.salesToday,
      icon: BarChartBig, 
      color: 'text-green-500' 
    },
    { 
      id: 'newCustomersToday', 
      title: 'Novos Clientes Hoje', 
      value: kpiData.newCustomersToday.toString(), 
      rawValue: kpiData.newCustomersToday,
      icon: Users, 
      color: 'text-blue-500' 
    },
    { 
      id: 'pizzasSoldToday', 
      title: 'Pizzas Vendidas Hoje', 
      value: kpiData.pizzasSoldToday.toString(), 
      rawValue: kpiData.pizzasSoldToday,
      icon: Pizza, 
      color: 'text-orange-500' 
    },
    { 
      id: 'pendingOrders', 
      title: 'Pedidos Pendentes', 
      value: kpiData.pendingOrders.toString(), 
      rawValue: kpiData.pendingOrders,
      icon: ShoppingBag, 
      color: 'text-yellow-500' 
    },
  ];

  console.log('📊 KpiCards - Configuração dos KPIs:', kpiConfig.map(kpi => ({
    id: kpi.id,
    title: kpi.title,
    rawValue: kpi.rawValue,
    formattedValue: kpi.value
  })));

  // Verificar se todos os valores são zero
  const allZero = kpiConfig.every(kpi => kpi.rawValue === 0);
  if (allZero && !isLoading) {
    console.warn('⚠️ KpiCards - Todos os KPIs estão zerados');
  }

  console.log('✅ KpiCards - Renderização concluída');

  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {kpiConfig.map((kpi) => {
        console.log(`📊 KpiCards - Renderizando KPI ${kpi.id}:`, {
          title: kpi.title,
          rawValue: kpi.rawValue,
          formattedValue: kpi.value,
          isLoading: isLoading
        });

        return (
          <motion.div
            key={kpi.id}
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 }
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="text-sm font-medium text-foreground/80">{kpi.title}</CardTitle>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <kpi.icon className={`h-5 w-5 ${kpi.color}`} />}
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <div className={`text-3xl font-bold ${kpi.color}`}>{isLoading ? '...' : kpi.value}</div>
                {!isLoading && <p className="text-xs text-muted-foreground pt-1">Atualizado agora</p>}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default KpiCards;