import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pizza, TrendingUp, Award } from 'lucide-react';

const TopProductsWidget = ({ products, isLoading }) => {
  if (isLoading || !products) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pizza className="h-5 w-5 text-red-400" />
            <span className="text-white">Produtos Mais Vendidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pizza className="h-5 w-5 text-red-400" />
            <span className="text-white">Produtos Mais Vendidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Pizza className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-500" />
            <p>Nenhuma venda registrada hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Encontrar o valor máximo para normalização
  const maxQuantity = Math.max(...products.map(p => p.quantity));

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Award className="h-4 w-4 text-yellow-500" />;
      case 1: return <Award className="h-4 w-4 text-gray-400" />;
      case 2: return <Award className="h-4 w-4 text-amber-600" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 1: return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 2: return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default: return "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200";
    }
  };

  const getProgressColor = (index) => {
    switch (index) {
      case 0: return "bg-emerald-500";
      case 1: return "bg-indigo-500";
      case 2: return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Pizza className="h-5 w-5 text-red-400" />
            <span className="text-white">Produtos Mais Vendidos</span>
          </div>
          <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
            Top {products.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => {
            const progressWidth = maxQuantity > 0 ? (product.quantity / maxQuantity) * 100 : 0;
            
            return (
              <div 
                key={index} 
                className="p-3 rounded-lg border border-slate-600 bg-slate-700/50 transition-all duration-200 hover:shadow-sm hover:bg-slate-700/70"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index)}
                    <span className="font-medium text-sm text-white truncate max-w-[150px]">
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-red-600/20 text-red-300 border-red-600/30"
                    >
                      {product.quantity} vendas
                    </Badge>
                    <span className="text-xs text-gray-400">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(index)} transition-all duration-500 ease-out`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                
                {/* Porcentagem em relação ao primeiro */}
                {index > 0 && (
                  <div className="mt-1 text-xs text-gray-400">
                    {((product.quantity / products[0].quantity) * 100).toFixed(0)}% do líder
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumo no rodapé */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Total de produtos diferentes vendidos:</span>
            <Badge variant="outline" className="border-slate-600 text-gray-300">{products.length}</Badge>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-400 mt-1">
            <span>Total de unidades vendidas:</span>
            <Badge variant="outline" className="border-slate-600 text-gray-300">
              {products.reduce((sum, p) => sum + p.quantity, 0)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProductsWidget;