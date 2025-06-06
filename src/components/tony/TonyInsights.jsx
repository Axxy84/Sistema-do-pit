import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, MessageCircle, Brain } from 'lucide-react';

const TonyInsights = ({ insights, isLoading }) => {
  if (isLoading || !insights) {
    return (
      <Card className="border border-border/50 bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Brain className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-indigo-800 font-medium">
                Olá! Sou o Tony, sua IA de análise.
              </p>
              <p className="text-indigo-600 text-sm mt-1">
                Preciso de mais dados para gerar insights sobre a pizzaria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header do Tony */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-800">Tony Insights</h3>
                <p className="text-xs text-indigo-600">IA de Análise da Pizzaria</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700">
              <MessageCircle className="h-3 w-3 mr-1" />
              {insights.length} insight{insights.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Insights */}
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-colors"
              >
                <div className="p-1 bg-indigo-100 rounded-full mt-0.5">
                  <Lightbulb className="h-3 w-3 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    {insight}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-indigo-100">
            <p className="text-xs text-indigo-600 text-center">
              💡 Análise automática baseada nos dados de hoje
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TonyInsights;