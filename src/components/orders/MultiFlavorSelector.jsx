import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const MultiFlavorSelector = ({ 
  selectedSize, 
  flavors = [], 
  onChange, 
  allProductsData = [] 
}) => {
  const [selectedFlavors, setSelectedFlavors] = useState(flavors);

  // Determinar número máximo de sabores baseado no tamanho
  const getMaxFlavors = (size) => {
    return size === 'familia' ? 3 : 2;
  };

  const maxFlavors = getMaxFlavors(selectedSize);

  useEffect(() => {
    setSelectedFlavors(flavors);
  }, [flavors]);

  // Calcular percentuais automaticamente
  const calculatePercentages = (flavorsArray) => {
    const count = flavorsArray.length;
    if (count === 0) return [];
    
    if (count === 2) {
      return flavorsArray.map((flavor, index) => ({
        ...flavor,
        percentual: 50
      }));
    } else if (count === 3) {
      return flavorsArray.map((flavor, index) => ({
        ...flavor,
        percentual: index === 2 ? 34 : 33 // Último sabor pega 34% para somar 100%
      }));
    }
    
    return flavorsArray;
  };

  // Calcular preço médio dos sabores selecionados
  const calculateAveragePrice = (flavorsArray) => {
    if (!flavorsArray || flavorsArray.length === 0 || !selectedSize) return 0;
    
    const totalPrice = flavorsArray.reduce((sum, flavor) => {
      const product = allProductsData.find(p => p.nome === flavor.nome && p.tipo_produto === 'pizza');
      if (product && product.tamanhos_precos) {
        const sizePrice = product.tamanhos_precos.find(tp => tp.id_tamanho === selectedSize);
        return sum + (sizePrice ? parseFloat(sizePrice.preco) : 0);
      }
      return sum;
    }, 0);
    
    return totalPrice / flavorsArray.length;
  };

  const addFlavor = () => {
    if (selectedFlavors.length >= maxFlavors) return;
    
    const newFlavors = [...selectedFlavors, { nome: '', produto_id: '' }];
    const flavorsWithPercentages = calculatePercentages(newFlavors);
    setSelectedFlavors(flavorsWithPercentages);
    onChange(flavorsWithPercentages);
  };

  const removeFlavor = (index) => {
    const newFlavors = selectedFlavors.filter((_, i) => i !== index);
    const flavorsWithPercentages = calculatePercentages(newFlavors);
    setSelectedFlavors(flavorsWithPercentages);
    onChange(flavorsWithPercentages);
  };

  const updateFlavor = (index, flavorName) => {
    const product = allProductsData.find(p => p.nome === flavorName && p.tipo_produto === 'pizza');
    const newFlavors = selectedFlavors.map((flavor, i) => 
      i === index ? { 
        nome: flavorName, 
        produto_id: product ? product.id : '' 
      } : flavor
    );
    
    const flavorsWithPercentages = calculatePercentages(newFlavors);
    setSelectedFlavors(flavorsWithPercentages);
    onChange(flavorsWithPercentages);
  };

  const availablePizzaProducts = allProductsData.filter(p => p.tipo_produto === 'pizza' && p.ativo);
  const averagePrice = calculateAveragePrice(selectedFlavors);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Múltiplos Sabores 
          <span className="text-xs text-muted-foreground ml-1">
            (máx {maxFlavors} sabores)
          </span>
        </Label>
        {selectedFlavors.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Preço médio: {formatCurrency(averagePrice)}
          </div>
        )}
      </div>

      {selectedFlavors.map((flavor, index) => (
        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <div className="flex-1">
            <Select
              value={flavor.nome}
              onValueChange={(value) => updateFlavor(index, value)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder={`Sabor ${index + 1}`} />
              </SelectTrigger>
              <SelectContent>
                {availablePizzaProducts.map((product) => (
                  <SelectItem key={product.id} value={product.nome}>
                    {product.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {flavor.percentual}%
          </Badge>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeFlavor(index)}
            className="h-8 w-8 text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {selectedFlavors.length < maxFlavors && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFlavor}
          className="w-full text-xs"
        >
          <PlusCircle className="mr-2 h-3 w-3" />
          Adicionar Sabor ({selectedFlavors.length}/{maxFlavors})
        </Button>
      )}

      {selectedFlavors.length > 1 && (
        <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
          <p className="font-medium text-blue-800">Distribuição dos sabores:</p>
          {selectedFlavors.map((flavor, index) => (
            <div key={index} className="flex justify-between">
              <span>{flavor.nome || `Sabor ${index + 1}`}</span>
              <span>{flavor.percentual}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiFlavorSelector;