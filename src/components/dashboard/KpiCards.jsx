import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// Removed framer-motion dependency
import { BarChartBig, Users, Pizza, ShoppingBag, Loader2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const KpiCards = ({ kpiData, isLoading }) => {
  const kpiConfig = [
    { 
      id: 'salesToday', 
      title: 'Vendas Hoje', 
      value: formatCurrency(kpiData.salesToday), 
      rawValue: kpiData.salesToday,
      icon: BarChartBig, 
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20',
      borderColor: 'border-l-red-500'
    },
    { 
      id: 'newCustomersToday', 
      title: 'Novos Clientes Hoje', 
      value: kpiData.newCustomersToday.toString(), 
      rawValue: kpiData.newCustomersToday,
      icon: Users, 
      color: 'text-gray-800 dark:text-gray-200',
      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20',
      borderColor: 'border-l-gray-500'
    },
    { 
      id: 'pizzasSoldToday', 
      title: 'Pizzas Vendidas Hoje', 
      value: kpiData.pizzasSoldToday.toString(), 
      rawValue: kpiData.pizzasSoldToday,
      icon: Pizza, 
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/20',
      borderColor: 'border-l-red-600'
    },
    { 
      id: 'pendingOrders', 
      title: 'Pedidos Pendentes', 
      value: kpiData.pendingOrders.toString(), 
      rawValue: kpiData.pendingOrders,
      icon: ShoppingBag, 
      color: 'text-black dark:text-white',
      bgColor: 'bg-gradient-to-br from-black/5 to-black/10 dark:from-black/20 dark:to-black/30',
      borderColor: 'border-l-black'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiConfig.map((kpi, index) => (
        <div
          key={kpi.id}
        >
          <Card className={`shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 ${kpi.borderColor} ${kpi.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-full bg-white/50 dark:bg-black/20`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-12">
                    <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                  </div>
                ) : (
                  <div className={`text-3xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Atualizado agora
                  </p>
                  {!isLoading && kpi.rawValue > 0 && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Ativo
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;