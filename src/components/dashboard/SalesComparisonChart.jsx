import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-red-200 dark:border-red-800">
        <p className="label font-bold text-red-600 dark:text-red-400 mb-2">{`Período: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SalesComparisonChart = ({ salesData, isLoading }) => {
  // Agrupa dados por semana para comparação
  const processDataForComparison = (data) => {
    if (!data || data.length === 0) return [];
    
    const weeks = {};
    
    data.forEach(item => {
      const date = new Date(item.data_pedido);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          semana: `Semana ${weekKey}`,
          vendasAtuais: 0,
          metaSemanal: 5000, // Meta fictícia de R$ 5000 por semana
        };
      }
      
      weeks[weekKey].vendasAtuais += parseFloat(item.total_vendas_dia);
    });
    
    return Object.values(weeks).slice(-4); // Últimas 4 semanas
  };

  const formattedData = processDataForComparison(salesData);

  return (
    <Card className="h-full shadow-lg border-l-4 border-l-red-500">
      <CardHeader className="bg-gradient-to-r from-red-50 to-black/5 dark:from-red-950/20 dark:to-black/20">
        <CardTitle className="flex items-center text-red-700 dark:text-red-300">
          <BarChart3 className="mr-2 h-5 w-5" />
          Comparativo de Vendas vs Meta
        </CardTitle>
        <CardDescription className="text-red-600/80 dark:text-red-400/80">
          Vendas realizadas versus metas semanais (últimas 4 semanas)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          </div>
        ) : formattedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
            <p className="text-muted-foreground">Dados insuficientes para comparação.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={formattedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="semana" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={80}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="vendasAtuais" 
                name="Vendas Realizadas" 
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="metaSemanal" 
                name="Meta Semanal" 
                fill="#991b1b"
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesComparisonChart;