import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
// Removed framer-motion dependency

const PizzaPreview = ({ 
  nome = 'Nova Pizza', 
  ingredientes = '', 
  tamanhosPrecos = [] 
}) => {
  const validSizes = tamanhosPrecos.filter(s => s.id_tamanho && s.preco && parseFloat(s.preco) > 0);

  const getSizePixels = (sizeId) => {
    const sizeMap = {
      'pequena': 60,
      'media': 80,
      'grande': 100,
      'familia': 120
    };
    return sizeMap[sizeId] || 60;
  };

  const getPizzaColor = () => {
    // Cor baseada nos ingredientes
    if (ingredientes.toLowerCase().includes('pepperoni')) return '#D2691E';
    if (ingredientes.toLowerCase().includes('margherita') || ingredientes.toLowerCase().includes('manjericão')) return '#228B22';
    if (ingredientes.toLowerCase().includes('calabresa')) return '#8B0000';
    if (ingredientes.toLowerCase().includes('frango')) return '#F4A460';
    if (ingredientes.toLowerCase().includes('portuguesa')) return '#FF6347';
    return '#DAA520'; // Cor padrão (dourado)
  };

  if (validSizes.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-3">🍕</div>
          <p className="text-gray-500">Configure os tamanhos para ver o preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👁️</span>
          <CardTitle className="text-lg text-gray-800">Preview da Pizza</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome e Ingredientes */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{nome}</h3>
          {ingredientes && (
            <p className="text-sm text-gray-600 italic">"{ingredientes}"</p>
          )}
        </div>

        {/* Preview Visual dos Tamanhos */}
        <div className="flex justify-center items-end gap-6 py-4">
          {validSizes.map((size, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2"
            >
              {/* Pizza Visual */}
              <div className="relative">
                <div
                  className="rounded-full border-4 border-yellow-600 shadow-lg relative overflow-hidden"
                  style={{
                    width: getSizePixels(size.id_tamanho),
                    height: getSizePixels(size.id_tamanho),
                    backgroundColor: getPizzaColor()
                  }}
                >
                  {/* Cobertura da Pizza */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-black/20 rounded-full"></div>
                  
                  {/* Detalhes da Pizza */}
                  <div className="absolute inset-2 rounded-full border-2 border-yellow-700/30"></div>
                  
                  {/* Pequenos círculos para simular ingredientes */}
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-600 rounded-full opacity-80"></div>
                  <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-green-600 rounded-full opacity-80"></div>
                  <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white rounded-full opacity-90"></div>
                </div>
                
                {/* Badge de Tamanho */}
                <Badge 
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2"
                >
                  {size.tamanho}
                </Badge>
              </div>

              {/* Preço */}
              <div className="text-center">
                <div className="font-bold text-green-700">
                  {formatCurrency(parseFloat(size.preco))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tamanhos:</span>
              <div className="font-medium">{validSizes.length} opções</div>
            </div>
            <div>
              <span className="text-gray-600">Faixa de preço:</span>
              <div className="font-medium text-green-700">
                {formatCurrency(Math.min(...validSizes.map(s => parseFloat(s.preco))))} - {formatCurrency(Math.max(...validSizes.map(s => parseFloat(s.preco))))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PizzaPreview; 