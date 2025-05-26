import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Pizza } from 'lucide-react';

const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#AF19FF', '#FF4560', '#00E396'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-3 rounded-md shadow-lg border border-border">
        <p className="label font-semibold text-primary">{`${label}`}</p>
        <p className="intro text-sm text-foreground/80">{`Vendidas: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const TopPizzasChart = ({ pizzas, isLoading }) => {
  return (
    <Card className="h-full shadow-lg col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Pizza className="mr-2 text-orange-500" />
          Top Pizzas Mais Vendidas
        </CardTitle>
        <CardDescription>Quantidades vendidas dos sabores mais populares.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-80"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : pizzas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma pizza vendida encontrada para exibir no gráfico.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={pizzas}
              margin={{
                top: 5,
                right: 0,
                left: -20, // Adjusted for better YAxis label visibility
                bottom: 40, // Increased bottom margin for XAxis labels
              }}
              barSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="nome" 
                angle={-30} 
                textAnchor="end" 
                height={60} 
                interval={0} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
              />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Bar dataKey="total_vendido" name="Qtd. Vendida" radius={[4, 4, 0, 0]}>
                {pizzas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPizzasChart;