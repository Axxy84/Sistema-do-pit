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
import { PlusCircle, X, Pizza, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import PizzaAutocomplete from './PizzaAutocomplete';

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

  // Garantir que sempre haja um campo vazio para adicionar, se houver espaço
  useEffect(() => {
    const lastFlavorIsSelected = selectedFlavors.length > 0 && selectedFlavors[selectedFlavors.length - 1].nome;
    if (selectedFlavors.length < maxFlavors && (lastFlavorIsSelected || selectedFlavors.length === 0)) {
        const newFlavors = [...selectedFlavors, { nome: '', produto_id: '' }];
        setSelectedFlavors(newFlavors);
    }
  }, [selectedFlavors, maxFlavors]);

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

  // Calcular preço MÁXIMO dos sabores selecionados (padrão pizzaria)
  const calculateMaxPrice = (flavorsArray) => {
    if (!flavorsArray || flavorsArray.length === 0 || !selectedSize) return 0;
    
    let maxPrice = 0;
    let maxPriceFlavorName = '';
    
    flavorsArray.forEach(flavor => {
      const product = allProductsData.find(p => p.nome === flavor.nome && p.tipo_produto === 'pizza');
      if (product && product.tamanhos_precos) {
        const sizePrice = product.tamanhos_precos.find(tp => tp.id_tamanho === selectedSize);
        const price = sizePrice ? parseFloat(sizePrice.preco) : 0;
        if (price > maxPrice) {
          maxPrice = price;
          maxPriceFlavorName = flavor.nome;
        }
      }
    });
    
    return { maxPrice, maxPriceFlavorName };
  };

  // Obter preço individual de um sabor
  const getFlavorPrice = (flavorName) => {
    if (!flavorName || !selectedSize) return 0;
    
    const product = allProductsData.find(p => p.nome === flavorName && p.tipo_produto === 'pizza');
    if (product && product.tamanhos_precos) {
      const sizePrice = product.tamanhos_precos.find(tp => tp.id_tamanho === selectedSize);
      return sizePrice ? parseFloat(sizePrice.preco) : 0;
    }
    return 0;
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
    
    // Remover duplicados
    const uniqueFlavors = newFlavors.filter((f, idx, self) => 
        f.nome && self.findIndex(t => t.nome === f.nome) === idx
    );

    const flavorsWithPercentages = calculatePercentages(uniqueFlavors);
    setSelectedFlavors(flavorsWithPercentages);
    onChange(flavorsWithPercentages);
  };

  const availablePizzaProducts = allProductsData.filter(p => p.tipo_produto === 'pizza' && p.ativo);
  const { maxPrice, maxPriceFlavorName } = calculateMaxPrice(selectedFlavors);

  return (
    <div className="space-y-4">
      {/* Header com informações */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg border border-orange-300">
        <div className="flex items-center gap-2">
          <Pizza className="h-5 w-5 text-orange-600" />
          <div>
            <Label className="text-sm font-bold text-orange-800">
              Múltiplos Sabores
            </Label>
            <p className="text-xs text-orange-600">
              Máximo {maxFlavors} sabores • Cobramos o preço do mais caro
            </p>
          </div>
        </div>
        
        {selectedFlavors.length > 0 && selectedFlavors.every(f => f.nome) && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-700">
              <DollarSign className="h-4 w-4" />
              <span className="font-bold text-lg">{formatCurrency(maxPrice)}</span>
            </div>
            <p className="text-xs text-green-600">
              (preço de "{maxPriceFlavorName}")
            </p>
          </div>
        )}
      </div>

      {/* Lista de sabores */}
      <div className="space-y-3">
        {selectedFlavors.map((flavor, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg bg-white hover:bg-orange-50 transition-colors">
              {/* Número do sabor */}
              <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold">
                {index + 1}
              </div>
              
              {/* Seletor de sabor */}
              <div className="flex-1">
                <PizzaAutocomplete
                    value={flavor.nome}
                    onChange={(value) => updateFlavor(index, value)}
                    products={availablePizzaProducts.filter(p => !selectedFlavors.some(sf => sf.nome === p.nome && sf.nome !== flavor.nome))}
                    selectedSize={selectedSize}
                    placeholder={`Escolha o ${index + 1}º sabor`}
                />
              </div>
              
              {/* Percentual e preço individual */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-bold">
                  {flavor.percentual}%
                </Badge>
                
                {flavor.nome && (
                  <div className="text-xs text-right text-muted-foreground">
                    <div className="font-medium">{formatCurrency(getFlavorPrice(flavor.nome))}</div>
                  </div>
                )}
                
                {/* Botão remover */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFlavor(index)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo visual da distribuição */}
      {selectedFlavors.filter(f => f.nome).length > 1 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Pizza className="h-4 w-4 text-blue-600" />
            <Label className="text-sm font-medium text-blue-800">
              Como ficará sua pizza:
            </Label>
          </div>
          
          {/* Barra visual de distribuição */}
          <div className="flex rounded-lg overflow-hidden h-8 border border-blue-300 mb-3">
            {selectedFlavors.filter(f => f.nome).map((flavor, index) => {
              const colors = ['bg-red-400', 'bg-yellow-400', 'bg-green-400'];
              return (
                <div
                  key={index}
                  className={`${colors[index]} flex items-center justify-center text-xs font-bold text-white`}
                  style={{ width: `${flavor.percentual}%` }}
                >
                  {flavor.percentual}%
                </div>
              );
            })}
          </div>
          
          {/* Lista detalhada */}
          <div className="space-y-1">
            {selectedFlavors.filter(f => f.nome).map((flavor, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${['bg-red-400', 'bg-yellow-400', 'bg-green-400'][index]}`}></div>
                  <span className="font-medium">{flavor.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">{flavor.percentual}%</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">{formatCurrency(getFlavorPrice(flavor.nome))}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Preço final */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">
                Preço cobrado (mais caro):
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(maxPrice)}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              ✨ Baseado no sabor "{maxPriceFlavorName}" que é o mais caro
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiFlavorSelector;