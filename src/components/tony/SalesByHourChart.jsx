import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, BarChart3 } from 'lucide-react';

const SalesByHourChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Vendas por Hora</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Processar dados para agrupar por hora
  const salesByHour = {};
  
  // Inicializar todas as horas do dia
  for (let hour = 0; hour < 24; hour++) {
    salesByHour[hour] = {
      hora: hour,
      delivery: 0,
      mesa: 0,
      total: 0,
      pedidos: 0
    };
  }

  // Processar pedidos do dia
  if (data?.orders) {
    data.orders.forEach(order => {
      if (order.created_at) {
        const orderDate = new Date(order.created_at);
        const hour = orderDate.getHours();
        
        if (salesByHour[hour]) {
          salesByHour[hour].total += parseFloat(order.total || 0);
          salesByHour[hour].pedidos += 1;
          
          if (order.tipo_pedido === 'delivery') {
            salesByHour[hour].delivery += parseFloat(order.total || 0);
          } else if (order.tipo_pedido === 'mesa') {
            salesByHour[hour].mesa += parseFloat(order.total || 0);
          }
        }
      }
    });
  }

  // Converter para array e encontrar valor máximo para normalização
  const hourlyData = Object.values(salesByHour);
  const maxValue = Math.max(...hourlyData.map(h => h.total));

  // Horários de pico
  const peakHours = hourlyData
    .filter(h => h.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatHour = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Vendas por Hora</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Hoje
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumo dos horários de pico */}
          {peakHours.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Horários de Pico</h4>
              <div className="flex flex-wrap gap-2">
                {peakHours.map((hour, index) => (
                  <Badge 
                    key={hour.hora} 
                    variant={index === 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {formatHour(hour.hora)} - {formatCurrency(hour.total)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico de barras simples */}
          <div className="space-y-2">
            {hourlyData.filter(h => h.total > 0).map((hourData) => {
              const barWidth = maxValue > 0 ? (hourData.total / maxValue) * 100 : 0;
              const deliveryWidth = hourData.total > 0 ? (hourData.delivery / hourData.total) * barWidth : 0;
              const mesaWidth = hourData.total > 0 ? (hourData.mesa / hourData.total) * barWidth : 0;
              
              return (
                <div key={hourData.hora} className="flex items-center space-x-3">
                  <div className="w-12 text-sm text-gray-600">
                    {formatHour(hourData.hora)}
                  </div>
                  <div className="flex-1 relative">
                    <div className="bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      {/* Barra de delivery */}
                      <div 
                        className="bg-orange-500 h-full absolute left-0 top-0 rounded-full transition-all duration-300"
                        style={{ width: `${deliveryWidth}%` }}
                      />
                      {/* Barra de mesa */}
                      <div 
                        className="bg-purple-500 h-full absolute top-0 rounded-full transition-all duration-300"
                        style={{ 
                          left: `${deliveryWidth}%`,
                          width: `${mesaWidth}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-gray-500">
                        {hourData.pedidos} pedido{hourData.pedidos !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs font-medium">
                        {formatCurrency(hourData.total)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Mesa</span>
            </div>
          </div>

          {/* Mensagem se não houver dados */}
          {hourlyData.filter(h => h.total > 0).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma venda registrada hoje</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesByHourChart;