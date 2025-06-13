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
import { Trash2, PlusCircle, Beer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const OtherItemsForm = ({ items, setItems, allProductsData, onItemsChange }) => {
  
  const getProductPrice = (productId) => {
    if (!allProductsData || allProductsData.length === 0 || !productId) return 0;
    const product = allProductsData.find(p => p.id === productId && p.tipo_produto !== 'pizza');
    return product ? parseFloat(product.preco_unitario) : 0;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };

    if (field === 'productId') {
      const selectedProduct = allProductsData.find(p => p.id === value);
      currentItem.productId = value;
      currentItem.productName = selectedProduct ? selectedProduct.nome : '';
      currentItem.unitPrice = selectedProduct ? parseFloat(selectedProduct.preco_unitario) : 0;
    } else {
      currentItem[field] = value;
    }
    
    // Always recalculate totalPrice if quantity, unitPrice or productId (which influences unitPrice) changes
    const quantity = parseInt(currentItem.quantity, 10) || 0;
    const unitPrice = parseFloat(currentItem.unitPrice) || 0;
    currentItem.totalPrice = quantity * unitPrice;
    
    newItems[index] = currentItem;
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { itemType: 'other', productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }];
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems); // Ensure parent recalculates total order value
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (onItemsChange) onItemsChange(newItems); // Ensure parent recalculates total order value
  };
  
  const availableOtherProducts = allProductsData.filter(p => p.tipo_produto !== 'pizza' && p.tipo_produto !== 'borda' && p.ativo);

  return (
    <div className="space-y-4 pt-4">
      <Label className="text-lg font-semibold text-primary flex items-center"><Beer className="mr-2 h-5 w-5"/> Bebidas e Outros Itens</Label>
      {items.filter(item => item.itemType === 'other').map((item, index) => {
        // Find the original index in the main items array
        const actualItemIndex = items.findIndex(i => i === item); 
        return (
          <div key={`other-item-${actualItemIndex}`} className="p-4 border rounded-lg shadow-sm bg-card/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
              <div>
                <Label htmlFor={`item-product-${actualItemIndex}`} className="text-xs">Produto</Label>
                <Select
                  value={item.productId}
                  onValueChange={(value) => handleItemChange(actualItemIndex, 'productId', value)}
                >
                  <SelectTrigger id={`item-product-${actualItemIndex}`}>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOtherProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} ({p.categoria || p.tipo_produto}) - {formatCurrency(p.preco_unitario)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <Label htmlFor={`item-other-quantity-${actualItemIndex}`} className="text-xs">Quantidade</Label>
                <Input
                  id={`item-other-quantity-${actualItemIndex}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(actualItemIndex, 'quantity', parseInt(e.target.value, 10))}
                  className="bg-background/70"
                />
              </div>
              <div>
                <Label htmlFor={`item-other-unitprice-${actualItemIndex}`} className="text-xs">Valor Unitário</Label>
                <Input
                  id={`item-other-unitprice-${actualItemIndex}`}
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
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Bebida/Outro Item
      </Button>
    </div>
  );
};

export default OtherItemsForm;