import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, ShoppingCart, Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';

const TonyAnalyticsCards = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border border-border/50 bg-card/30 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const cards = [
    {
      title: "Total de Vendas",
      value: formatCurrency(analytics?.totalSales || 0),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Hoje"
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(analytics?.averageTicket || 0),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Por pedido"
    },
    {
      title: "Pedidos Entregues",
      value: analytics?.deliveredOrdersCount || 0,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Concluídos"
    },
    {
      title: "Horário de Pico",
      value: analytics?.peakHour?.formatted || "--:--",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: analytics?.peakHour?.count ? `${analytics.peakHour.count} pedidos` : "Nenhum ainda"
    },
    {
      title: "Pedidos Atrasados",
      value: analytics?.delayedOrdersCount || 0,
      icon: AlertTriangle,
      color: (analytics?.delayedOrdersCount || 0) > 0 ? "text-red-600" : "text-green-600",
      bgColor: (analytics?.delayedOrdersCount || 0) > 0 ? "bg-red-50" : "bg-green-50",
      borderColor: (analytics?.delayedOrdersCount || 0) > 0 ? "border-red-200" : "border-green-200",
      description: (analytics?.delayedOrdersCount || 0) > 0 ? "Precisa atenção!" : "Tudo em dia!"
    },
    {
      title: "Entregadores Ativos",
      value: analytics?.delivererRanking?.length || 0,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      description: "Em atividade"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className={`border ${card.borderColor} bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color} mb-1`}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Card de Pedidos por Tipo */}
      <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Pedidos por Tipo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {analytics?.ordersByType?.delivery || 0}
              </div>
              <div className="text-sm text-orange-700 font-medium">Delivery</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.ordersByType?.mesa || 0}
              </div>
              <div className="text-sm text-purple-700 font-medium">Mesa</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.ordersByType?.balcao || 0}
              </div>
              <div className="text-sm text-blue-700 font-medium">Balcão</div>
            </div>
          </div>
          
          {/* Barra de progresso visual */}
          <div className="mt-4">
            <div className="flex h-2 bg-gray-100 rounded-full overflow-hidden">
              {(() => {
                const total = (analytics?.ordersByType?.delivery || 0) + 
                             (analytics?.ordersByType?.mesa || 0) + 
                             (analytics?.ordersByType?.balcao || 0);
                
                if (total === 0) return <div className="w-full bg-gray-200"></div>;
                
                const deliveryPercent = ((analytics?.ordersByType?.delivery || 0) / total) * 100;
                const mesaPercent = ((analytics?.ordersByType?.mesa || 0) / total) * 100;
                const balcaoPercent = ((analytics?.ordersByType?.balcao || 0) / total) * 100;
                
                return (
                  <>
                    <div className="bg-orange-500" style={{ width: `${deliveryPercent}%` }}></div>
                    <div className="bg-purple-500" style={{ width: `${mesaPercent}%` }}></div>
                    <div className="bg-blue-500" style={{ width: `${balcaoPercent}%` }}></div>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TonyAnalyticsCards;