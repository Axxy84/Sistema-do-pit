import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-border">
        <p className="label font-semibold text-primary">{`Data: ${label}`}</p>
        <p className="intro text-sm text-foreground/80">{`Vendas: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const SalesOverTimeChart = ({ salesData, isLoading }) => {
  const formattedData = salesData.map(item => ({
    ...item,
    // Formatar data para exibição
    data: new Date(item.data_pedido).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    vendas: parseFloat(item.total_vendas_dia),
  }));

  return (
    <Card className="h-full shadow-lg col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 text-green-500" />
          Vendas Diárias (Últimos 30 Dias)
        </CardTitle>
        <CardDescription>Evolução do total de vendas ao longo do tempo.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-80"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : formattedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum dado de vendas encontrado para o período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={formattedData}
              margin={{
                top: 5,
                right: 10, // Adjusted for better YAxis label visibility
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="data" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={80} // Give more space for currency values
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="vendas" 
                name="Vendas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth:2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth:2, stroke: 'hsl(var(--background))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOverTimeChart;