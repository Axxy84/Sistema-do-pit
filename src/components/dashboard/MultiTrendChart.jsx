import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-red-200 dark:border-red-800">
        <p className="label font-bold text-red-600 dark:text-red-400 mb-2">{`Data: ${label}`}</p>
        {payload.map((entry, index) => {
          // Validação robusta para evitar NaN
          const safeValue = Number.isFinite(entry.value) ? entry.value : 0;
          const displayValue = entry.name.includes('Vendas') || entry.name.includes('Ticket') 
            ? formatCurrency(safeValue) 
            : safeValue.toString();
            
          return (
            <div key={index} className="flex items-center gap-2 text-sm mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="font-medium">{entry.name}:</span>
              <span style={{ color: entry.color }}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const MultiTrendChart = ({ salesData, recentOrders, isLoading }) => {
  // Processa dados para múltiplas tendências
  const processMultiTrendData = (salesData, orders) => {
    if (!salesData || salesData.length === 0) return [];
    
    const dataMap = {};
    
    // Processa dados de vendas com validação
    salesData.forEach(item => {
      const date = new Date(item.data_pedido).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const vendas = parseFloat(item.total_vendas_dia);
      dataMap[date] = {
        data: date,
        vendas: Number.isFinite(vendas) ? vendas : 0,
        pedidos: 0,
        ticketMedio: 0
      };
    });
    
    // Agrupa pedidos por dia
    if (orders && orders.length > 0) {
      const ordersByDay = {};
      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!ordersByDay[date]) {
          ordersByDay[date] = [];
        }
        ordersByDay[date].push(order);
      });
      
      // Calcula pedidos e ticket médio por dia
      Object.keys(ordersByDay).forEach(date => {
        if (dataMap[date]) {
          const dayOrders = ordersByDay[date];
          dataMap[date].pedidos = dayOrders.length;
          const ticketMedio = dataMap[date].pedidos > 0 
            ? dataMap[date].vendas / dataMap[date].pedidos 
            : 0;
          dataMap[date].ticketMedio = Number.isFinite(ticketMedio) ? ticketMedio : 0;
        }
      });
    }
    
    return Object.values(dataMap).slice(-14); // Últimos 14 dias
  };

  const multiTrendData = processMultiTrendData(salesData, recentOrders);
  
  // Calcula tendências com validação
  const calculateTrend = (data, key) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-3).reduce((sum, item) => sum + (Number.isFinite(item[key]) ? item[key] : 0), 0) / 3;
    const previous = data.slice(-6, -3).reduce((sum, item) => sum + (Number.isFinite(item[key]) ? item[key] : 0), 0) / 3;
    const trend = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    return Number.isFinite(trend) ? trend : 0;
  };

  const vendasTrend = calculateTrend(multiTrendData, 'vendas');
  const pedidosTrend = calculateTrend(multiTrendData, 'pedidos');

  return (
    <Card className="h-full shadow-lg border-l-4 border-l-red-600">
      <CardHeader className="bg-gradient-to-r from-red-50 to-black/5 dark:from-red-950/20 dark:to-black/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-red-700 dark:text-red-300">
              <TrendingUp className="mr-2 h-5 w-5" />
              Análise de Tendências Múltiplas
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Vendas, Pedidos e Ticket Médio (últimos 14 dias)
            </CardDescription>
          </div>
          <div className="text-right text-xs">
            <div className={`flex items-center gap-1 ${vendasTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {vendasTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="font-medium">Vendas: {vendasTrend.toFixed(1)}%</span>
            </div>
            <div className={`flex items-center gap-1 ${pedidosTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pedidosTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="font-medium">Pedidos: {pedidosTrend.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          </div>
        ) : multiTrendData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
            <p className="text-muted-foreground">Dados insuficientes para análise de tendências.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={multiTrendData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                yAxisId="vendas"
                orientation="left"
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                yAxisId="quantidade"
                orientation="right"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                iconType="line"
              />
              
              {/* Linha de Vendas */}
              <Line 
                yAxisId="vendas"
                type="monotone" 
                dataKey="vendas" 
                name="Vendas (R$)" 
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#dc2626', strokeWidth: 2, stroke: '#ffffff' }}
              />
              
              {/* Linha de Pedidos */}
              <Line 
                yAxisId="quantidade"
                type="monotone" 
                dataKey="pedidos" 
                name="Pedidos (Qtd)" 
                stroke="#991b1b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#991b1b', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 5, fill: '#991b1b', strokeWidth: 2, stroke: '#ffffff' }}
              />
              
              {/* Linha de Ticket Médio */}
              <Line 
                yAxisId="vendas"
                type="monotone" 
                dataKey="ticketMedio" 
                name="Ticket Médio (R$)" 
                stroke="#7f1d1d"
                strokeWidth={2}
                dot={{ r: 2, fill: '#7f1d1d', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 4, fill: '#7f1d1d', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {/* Métricas resumidas */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
          <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
            <div className="font-medium text-red-700 dark:text-red-300">Vendas Médias</div>
            <div className="text-sm text-red-600 dark:text-red-400">
              {multiTrendData.length > 0 
                ? formatCurrency(multiTrendData.reduce((sum, item) => sum + item.vendas, 0) / multiTrendData.length)
                : 'N/A'
              }
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950/20 p-2 rounded">
            <div className="font-medium text-gray-700 dark:text-gray-300">Pedidos Médios</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {multiTrendData.length > 0 
                ? Math.round(multiTrendData.reduce((sum, item) => sum + item.pedidos, 0) / multiTrendData.length)
                : 'N/A'
              }
            </div>
          </div>
          <div className="bg-black/5 dark:bg-black/20 p-2 rounded">
            <div className="font-medium text-gray-700 dark:text-gray-300">Ticket Médio</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {multiTrendData.length > 0 
                ? formatCurrency(multiTrendData.reduce((sum, item) => sum + item.ticketMedio, 0) / multiTrendData.length)
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiTrendChart;