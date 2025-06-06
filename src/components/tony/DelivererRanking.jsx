import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Truck, Trophy, Star, DollarSign } from 'lucide-react';

const DelivererRanking = ({ ranking, isLoading }) => {
  if (isLoading || !ranking) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-red-400" />
            <span className="text-white">Ranking de Entregadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-red-400" />
            <span className="text-white">Ranking de Entregadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-500" />
            <p>Nenhuma entrega registrada hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Star className="h-5 w-5 text-gray-400" />;
      case 3: return <Star className="h-5 w-5 text-amber-600" />;
      default: return <Truck className="h-5 w-5 text-blue-500" />;
    }
  };

  const getRankStyle = (position) => {
    switch (position) {
      case 1: 
        return {
          border: "border-yellow-200",
          bg: "bg-gradient-to-r from-yellow-50 to-yellow-100",
          text: "text-yellow-800"
        };
      case 2:
        return {
          border: "border-gray-200",
          bg: "bg-gradient-to-r from-gray-50 to-gray-100",
          text: "text-gray-800"
        };
      case 3:
        return {
          border: "border-amber-200",
          bg: "bg-gradient-to-r from-amber-50 to-amber-100",
          text: "text-amber-800"
        };
      default:
        return {
          border: "border-blue-200",
          bg: "bg-gradient-to-r from-blue-50 to-blue-100",
          text: "text-blue-800"
        };
    }
  };

  const maxDeliveries = Math.max(...ranking.map(d => d.deliveries));

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-700/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-red-400" />
            <span className="text-white">Ranking de Entregadores</span>
          </div>
          <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
            Hoje
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.map((deliverer, index) => {
            const position = index + 1;
            const style = getRankStyle(position);
            const progressWidth = maxDeliveries > 0 ? (deliverer.deliveries / maxDeliveries) * 100 : 0;
            const averageValue = deliverer.deliveries > 0 ? deliverer.totalValue / deliverer.deliveries : 0;
            
            return (
              <div 
                key={index}
                className="p-4 rounded-lg border border-slate-600 bg-slate-700/50 transition-all duration-200 hover:shadow-sm hover:bg-slate-700/70"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600/50">
                      {getRankIcon(position)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {deliverer.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        #{position} • {deliverer.deliveries} entregas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {formatCurrency(deliverer.totalValue)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Média: {formatCurrency(averageValue)}
                    </div>
                  </div>
                </div>

                {/* Barra de progresso de entregas */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Entregas</span>
                    <span className="text-xs font-medium text-white">{deliverer.deliveries}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500 ease-out"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                </div>

                {/* Badges informativos */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {position <= 3 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {position === 1 ? '🥇 Líder' : position === 2 ? '🥈 Vice' : '🥉 3º Lugar'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(averageValue)}/entrega</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo no rodapé */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {ranking.reduce((sum, d) => sum + d.deliveries, 0)}
              </div>
              <div className="text-xs text-gray-400">Total de Entregas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">
                {formatCurrency(ranking.reduce((sum, d) => sum + d.totalValue, 0))}
              </div>
              <div className="text-xs text-gray-400">Valor Total</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DelivererRanking;