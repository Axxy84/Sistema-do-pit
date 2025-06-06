import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PieChart, TrendingDown } from 'lucide-react';
import { expenseService } from '@/services/expenseService';

const ExpensesCategoryChart = ({ date, isLoading: parentLoading }) => {
  const [categoryData, setCategoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCategoryConfig = (categoria) => {
    switch (categoria) {
      case 'fixa':
        return {
          label: 'Despesas Fixas',
          icon: '🏢',
          color: 'bg-blue-500',
          textColor: 'text-blue-400'
        };
      case 'insumos':
        return {
          label: 'Insumos',
          icon: '📦',
          color: 'bg-orange-500',
          textColor: 'text-orange-400'
        };
      case 'taxa':
        return {
          label: 'Taxas/Impostos',
          icon: '📋',
          color: 'bg-purple-500',
          textColor: 'text-purple-400'
        };
      default:
        return {
          label: 'Outros',
          icon: '💰',
          color: 'bg-gray-500',
          textColor: 'text-gray-400'
        };
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setIsLoading(true);
        const data = await expenseService.getExpensesByCategory(date);
        setCategoryData(data);
      } catch (error) {
        console.error('Erro ao buscar dados por categoria:', error);
        setCategoryData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [date]);

  if (isLoading || parentLoading) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-red-400" />
            <span className="text-white">Despesas por Categoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  if (!categoryData || Object.keys(categoryData).length === 0) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-red-400" />
            <span className="text-white">Despesas por Categoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-500" />
            <p>Nenhuma despesa por categoria hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular total e percentuais
  const totalAmount = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
  const categories = Object.entries(categoryData).map(([key, data]) => ({
    key,
    ...data,
    percentage: totalAmount > 0 ? (data.total / totalAmount * 100) : 0,
    config: getCategoryConfig(key)
  })).sort((a, b) => b.total - a.total);

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-red-400" />
            <span className="text-white">Despesas por Categoria</span>
          </div>
          <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
            {formatCurrency(totalAmount)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={category.key} className="space-y-2">
              {/* Header da categoria */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.config.icon}</span>
                  <span className="font-medium text-white text-sm">
                    {category.config.label}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-slate-600/50 text-gray-300"
                  >
                    {category.count} {category.count === 1 ? 'item' : 'itens'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${category.config.textColor}`}>
                    {formatCurrency(category.total)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${category.config.color} transition-all duration-500 ease-out`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>

              {/* Lista de itens (mostra apenas os 3 primeiros se houver muitos) */}
              {category.items.length > 0 && (
                <div className="ml-6 space-y-1">
                  {category.items.slice(0, 3).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-center text-xs text-gray-400">
                      <span className="truncate max-w-[200px]">{item.descricao}</span>
                      <span className="font-medium">{formatCurrency(item.valor)}</span>
                    </div>
                  ))}
                  {category.items.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      +{category.items.length - 3} outros itens...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumo no rodapé */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">
                {categories.length}
              </div>
              <div className="text-xs text-gray-400">Categorias Ativas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">
                {categories.reduce((sum, cat) => sum + cat.count, 0)}
              </div>
              <div className="text-xs text-gray-400">Total de Itens</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesCategoryChart;