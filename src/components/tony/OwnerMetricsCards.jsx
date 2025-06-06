import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Truck, Store } from 'lucide-react';

const OwnerMetricsCards = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2">
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular métricas do dia
  const totalVendasDia = data?.consolidated?.totais_gerais?.vendas_brutas || 0;
  const totalDespesasDia = data?.expenses?.reduce((sum, expense) => sum + parseFloat(expense.valor || 0), 0) || 0;
  const totalPedidosEntregues = data?.consolidated?.totais_gerais?.total_pedidos || 0;
  const valorLiquidoCaixa = totalVendasDia - totalDespesasDia;

  // Separar vendas por tipo
  const vendasDelivery = data?.consolidated?.vendas_por_tipo?.delivery?.vendas_brutas || 0;
  const vendasMesa = data?.consolidated?.vendas_por_tipo?.mesa?.vendas_brutas || 0;

  const cards = [
    {
      title: "Total de Vendas",
      value: totalVendasDia,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      format: "currency"
    },
    {
      title: "Total de Despesas",
      value: totalDespesasDia,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      format: "currency"
    },
    {
      title: "Pedidos Entregues",
      value: totalPedidosEntregues,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      format: "number"
    },
    {
      title: "Valor Líquido",
      value: valorLiquidoCaixa,
      icon: valorLiquidoCaixa >= 0 ? TrendingUp : TrendingDown,
      color: valorLiquidoCaixa >= 0 ? "text-green-600" : "text-red-600",
      bgColor: valorLiquidoCaixa >= 0 ? "bg-green-50" : "bg-red-50",
      borderColor: valorLiquidoCaixa >= 0 ? "border-green-200" : "border-red-200",
      format: "currency"
    }
  ];

  const formatValue = (value, format) => {
    if (format === "currency") {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className={`border-2 ${card.borderColor} hover:shadow-lg transition-shadow`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {formatValue(card.value, card.format)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cards de Separação por Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Delivery
            </CardTitle>
            <div className="p-2 rounded-full bg-orange-50">
              <Truck className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatValue(vendasDelivery, "currency")}
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="secondary" className="text-xs">
                {data?.consolidated?.vendas_por_tipo?.delivery?.total_pedidos || 0} pedidos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Mesa
            </CardTitle>
            <div className="p-2 rounded-full bg-purple-50">
              <Store className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatValue(vendasMesa, "currency")}
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="secondary" className="text-xs">
                {data?.consolidated?.vendas_por_tipo?.mesa?.total_pedidos || 0} pedidos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerMetricsCards;