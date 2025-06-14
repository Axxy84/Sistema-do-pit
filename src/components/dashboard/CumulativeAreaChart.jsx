import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-red-200 dark:border-red-800">
        <p className="label font-bold text-red-600 dark:text-red-400 mb-2">{`Data: ${label}`}</p>
        {payload.map((entry, index) => {
          const safeValue = Number.isFinite(entry.value) ? entry.value : 0;
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(safeValue)}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const CumulativeAreaChart = ({ salesData, isLoading }) => {
  // Processa dados para área cumulativa
  const processCumulativeData = (data) => {
    if (!data || data.length === 0) return [];
    
    let cumulativeTotal = 0;
    let monthlyTotal = 0;
    let weeklyTotal = 0;
    
    return data.map((item, index) => {
      const dailySales = parseFloat(item.total_vendas_dia);
      const safeDailySales = Number.isFinite(dailySales) ? dailySales : 0;
      cumulativeTotal += safeDailySales;
      
      // Reset semanal (a cada 7 dias)
      if (index % 7 === 0) weeklyTotal = 0;
      weeklyTotal += safeDailySales;
      
      // Reset mensal (a cada 30 dias)
      if (index % 30 === 0) monthlyTotal = 0;
      monthlyTotal += safeDailySales;
      
      return {
        data: new Date(item.data_pedido).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        cumulativo: cumulativeTotal,
        mensal: monthlyTotal,
        semanal: weeklyTotal,
        diario: dailySales
      };
    }).slice(-21); // Últimas 3 semanas
  };

  const cumulativeData = processCumulativeData(salesData);
  
  // Calcula estatísticas
  const totalVendas = cumulativeData.length > 0 
    ? cumulativeData[cumulativeData.length - 1].cumulativo 
    : 0;
    
  const mediadiaria = cumulativeData.length > 0 
    ? totalVendas / cumulativeData.length 
    : 0;

  return (
    <Card className="h-full shadow-lg border-l-4 border-l-black">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 dark:from-gray-950/20 dark:to-red-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-gray-800 dark:text-gray-200">
              <Activity className="mr-2 h-5 w-5 text-red-600" />
              Evolução Cumulativa de Vendas
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Progressão diária, semanal e cumulativa (últimas 3 semanas)
            </CardDescription>
          </div>
          <div className="text-right text-xs">
            <div className="text-red-600 font-medium">
              Total: {formatCurrency(totalVendas)}
            </div>
            <div className="text-gray-600">
              Média/dia: {formatCurrency(mediadiaria)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          </div>
        ) : cumulativeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-2" />
            <p className="text-muted-foreground">Dados insuficientes para análise cumulativa.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={cumulativeData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="cumulativo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="semanal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#991b1b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#991b1b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="diario" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7f1d1d" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#7f1d1d" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={2} // Mostra uma data a cada 3
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Área Cumulativa */}
              <Area
                type="monotone"
                dataKey="cumulativo"
                name="Vendas Cumulativas"
                stackId="1"
                stroke="#dc2626"
                strokeWidth={2}
                fill="url(#cumulativo)"
              />
              
              {/* Área Semanal */}
              <Area
                type="monotone"
                dataKey="semanal"
                name="Vendas Semanais"
                stackId="2"
                stroke="#991b1b"
                strokeWidth={1.5}
                fill="url(#semanal)"
                fillOpacity={0.6}
              />
              
              {/* Área Diária */}
              <Area
                type="monotone"
                dataKey="diario"
                name="Vendas Diárias"
                stackId="3"
                stroke="#7f1d1d"
                strokeWidth={1}
                fill="url(#diario)"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        
        {/* Indicadores de performance */}
        <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
            <div className="font-medium text-red-700 dark:text-red-300">Melhor Dia</div>
            <div className="text-sm text-red-600 dark:text-red-400">
              {cumulativeData.length > 0 
                ? formatCurrency(Math.max(...cumulativeData.map(d => d.diario)))
                : 'N/A'
              }
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950/20 p-2 rounded">
            <div className="font-medium text-gray-700 dark:text-gray-300">Pior Dia</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {cumulativeData.length > 0 
                ? formatCurrency(Math.min(...cumulativeData.map(d => d.diario)))
                : 'N/A'
              }
            </div>
          </div>
          <div className="bg-black/5 dark:bg-black/20 p-2 rounded">
            <div className="font-medium text-gray-700 dark:text-gray-300">Melhor Semana</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {cumulativeData.length > 0 
                ? formatCurrency(Math.max(...cumulativeData.map(d => d.semanal)))
                : 'N/A'
              }
            </div>
          </div>
          <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded">
            <div className="font-medium text-red-800 dark:text-red-200">Crescimento</div>
            <div className="text-sm text-red-700 dark:text-red-300">
              {cumulativeData.length > 7 
                ? `${(((cumulativeData[cumulativeData.length - 1].semanal / cumulativeData[cumulativeData.length - 8].semanal) - 1) * 100).toFixed(1)}%`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CumulativeAreaChart;