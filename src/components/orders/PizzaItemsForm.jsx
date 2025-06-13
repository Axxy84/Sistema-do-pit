import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, Search, Pizza } from 'lucide-react';
import { PIZZA_FLAVORS, PIZZA_SIZES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import PizzaBorderSelector, { PIZZA_BORDERS } from './PizzaBorderSelector';
import RealBorderSelector from './RealBorderSelector';
import MultiFlavorSelector from './MultiFlavorSelector';
import PizzaAutocomplete from './PizzaAutocomplete';

const PizzaItemsForm = ({ items, setItems, allProductsData, onItemsChange }) => {
  const getPizzaPrice = (selectedProductName, selectedSizeId, multipleFlavors = null) => {
    if (!allProductsData || allProductsData.length === 0) return 0;

    // Se há múltiplos sabores, calcular preço MÁXIMO (não médio)
    if (multipleFlavors && multipleFlavors.length > 1) {
      let maxPrice = 0;
      multipleFlavors.forEach(flavor => {
        const product = allProductsData.find(p => p.nome === flavor.nome && p.tipo_produto === 'pizza');
        if (product && product.tamanhos_precos) {
          const sizePriceInfo = product.tamanhos_precos.find(tp => tp.id_tamanho === selectedSizeId);
          const price = sizePriceInfo ? parseFloat(sizePriceInfo.preco) : 0;
          if (price > maxPrice) {
            maxPrice = price;
          }
        }
      });
      return maxPrice;
    }

    // Pizza com sabor único (lógica original)
    const product = allProductsData.find(p => p.nome === selectedProductName && p.tipo_produto === 'pizza');
    
    if (product && product.tamanhos_precos) {
        const sizePriceInfo = product.tamanhos_precos.find(tp => tp.id_tamanho === selectedSizeId);
        return sizePriceInfo ? parseFloat(sizePriceInfo.preco) : 0;
    }
    
    const legacyPizzaFlavor = PIZZA_FLAVORS.find(f => f.id === selectedProductName);
    if(legacyPizzaFlavor) {
      const legacyPizzaSize = PIZZA_SIZES.find(s => s.id === selectedSizeId);
    }
    
    return 0;
  };

  const getBorderPrice = (borderValue) => {
    if (!borderValue || borderValue === 'none') return 0;
    
    // Tentar encontrar por ID ou nome no banco de dados
    const border = allProductsData.find(p => 
      p.tipo_produto === 'borda' && 
      (p.id === borderValue || p.nome === borderValue)
    );
    
    return border ? parseFloat(border.preco_unitario) : 0;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };
    currentItem[field] = value;

    // Se o sabor único for alterado, e ainda não estamos no modo de múltiplos sabores,
    // mostramos a opção de escolha.
    if (field === 'flavor' && value && !currentItem.useMultipleFlavors) {
      currentItem.showMultiFlavorChoice = true;
    }

    // Lógica para alternar para múltiplos sabores
    if (field === 'useMultipleFlavors') {
      currentItem.showMultiFlavorChoice = false; // Sempre esconder a escolha ao tomar uma decisão
      if (value) {
        // Habilitando múltiplos sabores: mover o sabor existente para a lista
        const firstFlavorProduct = allProductsData.find(p => p.nome === currentItem.flavor && p.tipo_produto === 'pizza');
        currentItem.multipleFlavors = firstFlavorProduct ? [{ nome: firstFlavorProduct.nome, id: firstFlavorProduct.id }] : [];
        currentItem.flavor = ''; // Limpar o sabor único
      } else {
        // Desabilitando múltiplos sabores (caso seja necessário no futuro)
        currentItem.multipleFlavors = [];
        currentItem.flavor = '';
        currentItem.unitPrice = 0;
      }
    }
    
    // Esconder a escolha se o usuário clicar em "Não"
    if (field === 'showMultiFlavorChoice' && !value) {
        currentItem.showMultiFlavorChoice = false;
    }

    // Recalcular preço quando sabor, tamanho ou sabores múltiplos mudarem
    if (field === 'flavor' || field === 'size' || field === 'multipleFlavors' || field === 'useMultipleFlavors') {
      let price = 0;
      let primaryProductId = currentItem.productId; // Manter o productId se já existir

      if (currentItem.useMultipleFlavors && currentItem.multipleFlavors && currentItem.multipleFlavors.length > 0) {
        // Lógica para múltiplos sabores
        let maxPrice = 0;
        let mostExpensiveFlavor = null;
        
        currentItem.multipleFlavors.forEach(flavor => {
          const product = allProductsData.find(p => p.nome === flavor.nome && p.tipo_produto === 'pizza');
          if (product && product.tamanhos_precos) {
            const sizePriceInfo = product.tamanhos_precos.find(tp => tp.id_tamanho === currentItem.size);
            const flavorPrice = sizePriceInfo ? parseFloat(sizePriceInfo.preco) : 0;
            if (flavorPrice > maxPrice) {
              maxPrice = flavorPrice;
              mostExpensiveFlavor = product;
            }
          }
        });
        
        price = maxPrice;
        // Definir o productId com base no sabor mais caro para a validação
        primaryProductId = mostExpensiveFlavor ? mostExpensiveFlavor.id : null;

      } else if (!currentItem.useMultipleFlavors && currentItem.flavor && currentItem.size) {
        // Lógica para sabor único
        const product = allProductsData.find(p => p.nome === currentItem.flavor && p.tipo_produto === 'pizza');
        price = getPizzaPrice(currentItem.flavor, currentItem.size);
        primaryProductId = product ? product.id : null;
      }
      
      currentItem.unitPrice = price;
      currentItem.productId = primaryProductId; // Atualiza o productId do item
    }
    
    // Calcular preço total incluindo borda
    const quantity = parseInt(currentItem.quantity, 10) || 0;
    const unitPrice = parseFloat(currentItem.unitPrice) || 0;
    const borderPrice = getBorderPrice(currentItem.border || 'none');
    currentItem.borderPrice = borderPrice;
    currentItem.totalPrice = quantity * (unitPrice + borderPrice);
    
    newItems[index] = currentItem;
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { 
      itemType: 'pizza', 
      flavor: '', 
      size: '', 
      border: 'none',
      borderPrice: 0,
      quantity: 1, 
      unitPrice: 0, 
      totalPrice: 0, 
      productId: null,
      useMultipleFlavors: false,
      multipleFlavors: [],
      showMultiFlavorChoice: false, // Novo estado para controlar a visibilidade do card de escolha
    }];
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems);
  };
  
  const availablePizzaProducts = allProductsData.filter(p => p.tipo_produto === 'pizza' && p.ativo);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold text-primary flex items-center gap-2">
          <Pizza className="h-5 w-5" />
          Itens da Pizza
        </Label>
      </div>
      
      {items.filter(item => item.itemType === 'pizza').map((item, index) => {
        // Find the original index in the main items array to ensure correct modification
        const actualItemIndex = items.findIndex(i => i === item); 
        return (
          <div key={`pizza-item-${actualItemIndex}`} className="p-4 border rounded-lg shadow-sm bg-card/50 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`item-size-${actualItemIndex}`} className="text-sm font-medium">
                  🍕 Tamanho da Pizza
                </Label>
                <Select
                  value={item.size}
                  onValueChange={(value) => handleItemChange(actualItemIndex, 'size', value)}
                >
                  <SelectTrigger id={`item-size-${actualItemIndex}`} className="mt-1">
                    <SelectValue placeholder="Selecione o tamanho primeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIZZA_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`item-quantity-${actualItemIndex}`} className="text-sm font-medium">
                  📊 Quantidade
                </Label>
                <Input
                  id={`item-quantity-${actualItemIndex}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(actualItemIndex, 'quantity', parseInt(e.target.value, 10))}
                  className="bg-background/70 mt-1"
                />
              </div>
            </div>

            {item.size && (
              <div className="space-y-3">
                {item.useMultipleFlavors ? (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <MultiFlavorSelector
                      selectedSize={item.size}
                      flavors={item.multipleFlavors || []}
                      onChange={(flavors) => {
                        handleItemChange(actualItemIndex, 'multipleFlavors', flavors);
                      }}
                      allProductsData={availablePizzaProducts}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={`item-flavor-${actualItemIndex}`} className="text-sm font-medium">
                      🍕 Nome da Pizza
                    </Label>
                    <PizzaAutocomplete
                      value={item.flavor}
                      onChange={(value) => {
                        handleItemChange(actualItemIndex, 'flavor', value);
                      }}
                      products={availablePizzaProducts}
                      selectedSize={item.size}
                      placeholder="Digite o nome da pizza..."
                    />

                    {item.showMultiFlavorChoice && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center animate-fade-in">
                        <p className="text-sm font-medium text-blue-800 mb-2">Gostaria de adicionar mais sabores?</p>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleItemChange(actualItemIndex, 'showMultiFlavorChoice', false)}
                          >
                            Não, Sabor Único
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleItemChange(actualItemIndex, 'useMultipleFlavors', true)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Sim, Adicionar Sabor
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {item.size && (
              <div className="w-full">
                <RealBorderSelector
                  value={item.border || 'none'}
                  onChange={(value) => handleItemChange(actualItemIndex, 'border', value)}
                  allProductsData={allProductsData}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Valor Unitário</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={formatCurrency(item.unitPrice + (item.borderPrice || 0))}
                    readOnly
                    className="bg-muted/70 cursor-not-allowed text-sm"
                  />
                  {item.unitPrice > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <div>Pizza: {formatCurrency(item.unitPrice)}</div>
                      {item.borderPrice > 0 && <div>+ Borda: {formatCurrency(item.borderPrice)}</div>}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-muted-foreground">Total do Item</Label>
                  <p className="text-lg font-bold text-primary">{formatCurrency(item.totalPrice)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(actualItemIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
      
      <Button type="button" variant="outline" onClick={addItem} className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Pizza
      </Button>
    </div>
  );
};

export default PizzaItemsForm;