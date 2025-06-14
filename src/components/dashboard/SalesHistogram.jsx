import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-red-200 dark:border-red-800">
        <p className="label font-bold text-red-600 dark:text-red-400 mb-2">{`Horário: ${label}:00h`}</p>
        <p className="text-sm text-foreground">
          {`Pedidos: ${payload[0].value}`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {payload[0].value > 20 ? 'Horário de pico' : payload[0].value > 10 ? 'Movimento moderado' : 'Movimento baixo'}
        </p>
      </div>
    );
  }
  return null;
};

const SalesHistogram = ({ recentOrders, isLoading }) => {
  // Processa os dados para criar histograma por horário
  const processOrdersByHour = (orders) => {
    if (!orders || orders.length === 0) return [];
    
    // Inicializa contadores para cada hora do dia
    const hourlyData = Array.from({ length: 24 }, (_, index) => ({
      hora: index,
      pedidos: 0,
      label: `${String(index).padStart(2, '0')}h`
    }));
    
    // Conta pedidos por hora
    orders.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        const hour = date.getHours();
        hourlyData[hour].pedidos += 1;
      }
    });
    
    // Filtra apenas horários com atividade para melhor visualização
    return hourlyData.filter(item => item.pedidos > 0 || (item.hora >= 10 && item.hora <= 23));
  };

  const histogramData = processOrdersByHour(recentOrders);
  
  // Determina a cor da barra baseada na quantidade de pedidos
  const getBarColor = (value) => {
    if (value >= 20) return '#dc2626'; // Vermelho forte para picos
    if (value >= 10) return '#ef4444'; // Vermelho médio
    if (value >= 5) return '#f87171';  // Vermelho claro
    return '#fca5a5'; // Vermelho muito claro
  };

  return (
    <Card className="h-full shadow-lg border-l-4 border-l-black">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 dark:from-gray-950/20 dark:to-red-950/20">
        <CardTitle className="flex items-center text-gray-800 dark:text-gray-200">
          <Clock className="mr-2 h-5 w-5 text-red-600" />
          Distribuição de Pedidos por Horário
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Histograma mostrando a concentração de pedidos ao longo do dia
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          </div>
        ) : histogramData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
            <p className="text-muted-foreground">Nenhum pedido encontrado para análise.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={histogramData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={1} // Mostra todas as horas
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: 'Quantidade de Pedidos', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="pedidos" 
                fill={(entry) => getBarColor(entry.pedidos)}
                radius={[2, 2, 0, 0]}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={1}
              >
                {histogramData.map((entry, index) => (
                  <Bar key={`bar-${index}`} fill={getBarColor(entry.pedidos)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {/* Legenda explicativa */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-muted-foreground">Pico (20+ pedidos)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-muted-foreground">Alto (10-19 pedidos)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f87171' }}></div>
            <span className="text-muted-foreground">Médio (5-9 pedidos)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fca5a5' }}></div>
            <span className="text-muted-foreground">Baixo (1-4 pedidos)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesHistogram;