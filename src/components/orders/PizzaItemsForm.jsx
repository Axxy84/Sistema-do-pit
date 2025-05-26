import React from 'react';
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
import { Trash2, PlusCircle } from 'lucide-react';
import { PIZZA_FLAVORS, PIZZA_SIZES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

const PizzaItemsForm = ({ items, setItems, allProductsData, onItemsChange }) => {

  const getPizzaPrice = (selectedProductName, selectedSizeId) => {
    if (!allProductsData || allProductsData.length === 0) return 0;

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

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };
    currentItem[field] = value;

    if (field === 'flavor' || field === 'size') {
      const price = getPizzaPrice(currentItem.flavor, currentItem.size);
      currentItem.unitPrice = price;
    }
    
    // Always recalculate totalPrice if quantity or unitPrice changes
    const quantity = parseInt(currentItem.quantity, 10) || 0;
    const unitPrice = parseFloat(currentItem.unitPrice) || 0;
    currentItem.totalPrice = quantity * unitPrice;
    
    newItems[index] = currentItem;
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { itemType: 'pizza', flavor: '', size: '', quantity: 1, unitPrice: 0, totalPrice: 0, productId: null }];
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems); // Ensure parent recalculates total order value
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems); // Ensure parent recalculates total order value
  };
  
  const availablePizzaProducts = allProductsData.filter(p => p.tipo_produto === 'pizza' && p.ativo);

  return (
    <div className="space-y-4 pt-4">
      <Label className="text-lg font-semibold text-primary">Itens da Pizza</Label>
      {items.filter(item => item.itemType === 'pizza').map((item, index) => {
        // Find the original index in the main items array to ensure correct modification
        const actualItemIndex = items.findIndex(i => i === item); 
        return (
          <div key={`pizza-item-${actualItemIndex}`} className="p-4 border rounded-lg shadow-sm bg-card/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`item-flavor-${actualItemIndex}`} className="text-xs">Sabor</Label>
                <Select
                  value={item.flavor}
                  onValueChange={(value) => handleItemChange(actualItemIndex, 'flavor', value)}
                >
                  <SelectTrigger id={`item-flavor-${actualItemIndex}`}>
                    <SelectValue placeholder="Selecione o sabor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePizzaProducts.map((p) => (
                      <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`item-size-${actualItemIndex}`} className="text-xs">Tamanho</Label>
                <Select
                  value={item.size}
                  onValueChange={(value) => handleItemChange(actualItemIndex, 'size', value)}
                >
                  <SelectTrigger id={`item-size-${actualItemIndex}`}>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIZZA_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <Label htmlFor={`item-quantity-${actualItemIndex}`} className="text-xs">Quantidade</Label>
                <Input
                  id={`item-quantity-${actualItemIndex}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(actualItemIndex, 'quantity', parseInt(e.target.value, 10))}
                  className="bg-background/70"
                />
              </div>
              <div>
                <Label htmlFor={`item-unitprice-${actualItemIndex}`} className="text-xs">Valor Unitário</Label>
                <Input
                  id={`item-unitprice-${actualItemIndex}`}
                  type="text"
                  value={formatCurrency(item.unitPrice)}
                  readOnly
                  className="bg-muted/70 cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between md:justify-end">
                  <p className="text-sm font-medium md:hidden">Total Item: {formatCurrency(item.totalPrice)}</p>
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
            <p className="text-sm font-medium text-right hidden md:block">Total do Item: {formatCurrency(item.totalPrice)}</p>
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