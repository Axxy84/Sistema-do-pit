import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, Calculator, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { profitCalculatorService } from '@/services/profitCalculatorService';

const ProfitLossCard = ({ date, onRefresh }) => {
  const { toast } = useToast();
  const [profitData, setProfitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateProfit = async () => {
    try {
      setIsLoading(true);
      const result = await profitCalculatorService.calculateTodayProfit(date);
      setProfitData(result);
    } catch (error) {
      console.error('Erro ao calcular lucro:', error);
      toast({
        title: 'Erro no cálculo',
        description: error.message || 'Não foi possível calcular o lucro/prejuízo.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await calculateProfit();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    calculateProfit();
  }, [date]);

  if (isLoading) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-red-400" />
            <span className="text-white">Lucro/Prejuízo Diário</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  if (!profitData) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-white">Erro no Cálculo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-500" />
            <p>Não foi possível calcular o resultado</p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="mt-4 bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = !profitData.prejuizo;
  const profitValue = Math.abs(profitData.lucro);
  const percentage = profitData.receita_total > 0 
    ? (profitValue / profitData.receita_total * 100).toFixed(1)
    : 0;

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-red-400" />
            <span className="text-white">Lucro/Prejuízo Diário</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isProfitable ? "default" : "destructive"} 
              className={`text-xs ${isProfitable 
                ? 'bg-green-600/20 text-green-300 border-green-600/30' 
                : 'bg-red-600/20 text-red-300 border-red-600/30'
              }`}
            >
              {isProfitable ? 'Lucro' : 'Prejuízo'}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3 w-3 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Resultado Principal */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {isProfitable ? (
              <TrendingUp className="h-8 w-8 text-green-400" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-400" />
            )}
            <div className={`text-4xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(profitValue)}
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {percentage}% da receita total
          </div>
        </div>

        {/* Detalhes Financeiros */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-700/30">
            <span className="text-sm text-gray-400">Receita Total</span>
            <span className="font-medium text-green-400">
              {formatCurrency(profitData.receita_total)}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-700/30">
            <span className="text-sm text-gray-400">Despesas Totais</span>
            <span className="font-medium text-red-400">
              {formatCurrency(profitData.despesas_totais)}
            </span>
          </div>
        </div>

        {/* Breakdown Detalhado */}
        <div className="border-t border-slate-600 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Detalhamento</h4>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Vendas Brutas:</span>
                <span className="text-white">
                  {formatCurrency(profitData.detalhes?.vendas_brutas)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Taxas Entrega:</span>
                <span className="text-green-400">
                  {formatCurrency(profitData.detalhes?.taxas_entrega)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Receitas Extras:</span>
                <span className="text-green-400">
                  {formatCurrency(profitData.detalhes?.receitas_extras)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Descontos:</span>
                <span className="text-red-400">
                  {formatCurrency(profitData.detalhes?.descontos_aplicados)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Impostos:</span>
                <span className="text-red-400">
                  {formatCurrency(profitData.detalhes?.impostos)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Despesas:</span>
                <span className="text-red-400">
                  {formatCurrency(profitData.detalhes?.despesas_extras + profitData.detalhes?.despesas_fixas)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadados */}
        <div className="border-t border-slate-600 pt-3 mt-4">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{profitData.orders_count} pedidos • {profitData.expenses_count} despesas</span>
            <span>Calculado em tempo real</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitLossCard;