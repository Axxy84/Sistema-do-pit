import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';


const ProductTypeSelector = ({ 
  selectedType, 
  onTypeChange, 
  productTypes = [],
  disabled = false 
}) => {
  const getTypeIcon = (typeId) => {
    const iconMap = {
      'pizza': '🍕',
      'bebida': '🥤',
      'sobremesa': '🍰',
      'acompanhamento': '🍟',
      'borda': '🥖',
      'outro': '📦'
    };
    return iconMap[typeId] || '📦';
  };

  const getTypeDescription = (typeId) => {
    const descMap = {
      'pizza': 'Pizzas tradicionais com múltiplos tamanhos',
      'bebida': 'Refrigerantes, sucos e águas',
      'sobremesa': 'Doces, tortas e sorvetes',
      'acompanhamento': 'Porções, molhos e extras',
      'borda': 'Bordas recheadas para pizzas',
      'outro': 'Outros produtos diversos'
    };
    return descMap[typeId] || 'Categoria geral de produtos';
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground/80 flex items-center gap-2">
        <span className="text-lg">🏷️</span>
        Tipo do Produto
      </Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {productTypes.map((type) => (
          <div
            key={type.id}
            className="transform transition-transform duration-150 active:scale-95"
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedType === type.id 
                  ? 'border-2 border-orange-400 bg-orange-50 shadow-lg' 
                  : 'border border-gray-200 hover:border-orange-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onTypeChange(type.id)}
            >
              <CardContent className="p-4 text-center relative">
                {selectedType === type.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                
                <div className="text-3xl mb-2">{getTypeIcon(type.id)}</div>
                <h3 className="font-medium text-gray-800 mb-1">{type.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {getTypeDescription(type.id)}
                </p>
                
                {selectedType === type.id && (
                  <Badge className="mt-2 bg-orange-100 text-orange-700 text-xs">
                    Selecionado
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductTypeSelector; 