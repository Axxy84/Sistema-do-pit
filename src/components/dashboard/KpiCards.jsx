import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChartBig, Users, Pizza, ShoppingBag, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const KpiCards = ({ kpiData, isLoading }) => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiConfig.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="space-y-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-2xl font-bold">{kpi.value}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Atualizado agora
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default KpiCards;