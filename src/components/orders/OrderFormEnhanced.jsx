// EXEMPLO DE INTEGRAÇÃO NO ORDERFORM
// Este é um exemplo de como integrar bordas e taxa de entrega no formulário

import React, { useState, useEffect } from 'react';
import PizzaBorderSelector, { PIZZA_BORDERS } from './PizzaBorderSelector';
import DeliveryFeeInput from './DeliveryFeeInput';
import { formatCurrency } from '@/lib/utils';

// Adicionar ao estado do formulário:
const OrderFormExample = () => {
  const [orderData, setOrderData] = useState({
    items: [],
    deliveryFee: 0,
    subtotal: 0,
    total: 0
  });

  // Estado para o item sendo adicionado/editado
  const [currentItem, setCurrentItem] = useState({
    itemType: 'pizza',
    flavor: '',
    size: '',
    border: 'none', // Nova propriedade
    quantity: 1,
    unitPrice: 0,
    borderPrice: 0, // Preço adicional da borda
    totalPrice: 0
  });

  // Calcular preço do item incluindo borda
  const calculateItemPrice = (item) => {
    const border = PIZZA_BORDERS.find(b => b.id === item.border) || PIZZA_BORDERS[0];
    const borderPrice = item.itemType === 'pizza' ? border.price : 0;
    const basePrice = parseFloat(item.unitPrice) || 0;
    const quantity = parseInt(item.quantity) || 1;
    
    return {
      borderPrice,
      totalPrice: (basePrice + borderPrice) * quantity
    };
  };

  // Atualizar item quando borda mudar
  const handleBorderChange = (borderId) => {
    const updatedItem = { ...currentItem, border: borderId };
    const { borderPrice, totalPrice } = calculateItemPrice(updatedItem);
    
    setCurrentItem({
      ...updatedItem,
      borderPrice,
      totalPrice
    });
  };

  // Calcular total do pedido
  const calculateOrderTotal = () => {
    const itemsTotal = orderData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.totalPrice) || 0);
    }, 0);
    
    const subtotal = itemsTotal;
    const deliveryFee = parseFloat(orderData.deliveryFee) || 0;
    const total = subtotal + deliveryFee;
    
    return { subtotal, total };
  };

  // Atualizar totais quando items ou taxa de entrega mudarem
  useEffect(() => {
    const { subtotal, total } = calculateOrderTotal();
    setOrderData(prev => ({ ...prev, subtotal, total }));
  }, [orderData.items, orderData.deliveryFee]);

  // Adicionar item ao pedido
  const handleAddItem = () => {
    const newItem = {
      ...currentItem,
      id: Date.now(), // ID temporário
    };
    
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    // Limpar formulário do item
    setCurrentItem({
      itemType: 'pizza',
      flavor: '',
      size: '',
      border: 'none',
      quantity: 1,
      unitPrice: 0,
      borderPrice: 0,
      totalPrice: 0
    });
  };

  // Renderização do formulário
  return (
    <div className="space-y-6">
      {/* Formulário do Item */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">Adicionar Item</h3>
        
        {/* Campos existentes do item... */}
        
        {/* Seletor de Borda (apenas para pizzas) */}
        {currentItem.itemType === 'pizza' && (
          <PizzaBorderSelector
            value={currentItem.border}
            onChange={handleBorderChange}
          />
        )}
        
        {/* Resumo do item */}
        <div className="bg-muted/50 p-3 rounded">
          <p className="text-sm">
            Preço base: {formatCurrency(currentItem.unitPrice)}
            {currentItem.borderPrice > 0 && (
              <> + Borda: {formatCurrency(currentItem.borderPrice)}</>
            )}
          </p>
          <p className="font-semibold">
            Total do item: {formatCurrency(currentItem.totalPrice)}
          </p>
        </div>
      </div>

      {/* Lista de Items */}
      <div className="space-y-2">
        <h3 className="font-semibold">Itens do Pedido</h3>
        {orderData.items.map((item, index) => (
          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
            <div>
              <p className="font-medium">{item.flavor || item.productName}</p>
              <p className="text-sm text-muted-foreground">
                {item.quantity}x {formatCurrency(item.unitPrice)}
                {item.borderPrice > 0 && (
                  <> + borda {formatCurrency(item.borderPrice)}</>
                )}
              </p>
            </div>
            <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
          </div>
        ))}
      </div>

      {/* Taxa de Entrega */}
      <DeliveryFeeInput
        value={orderData.deliveryFee}
        onChange={(value) => setOrderData(prev => ({ ...prev, deliveryFee: value }))}
      />

      {/* Resumo do Pedido */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(orderData.subtotal)}</span>
        </div>
        {orderData.deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span>Taxa de Entrega:</span>
            <span>{formatCurrency(orderData.deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>{formatCurrency(orderData.total)}</span>
        </div>
      </div>
    </div>
  );
};

// Ao salvar o pedido, incluir a taxa de entrega:
const handleSaveOrder = async () => {
  const orderToSave = {
    ...orderData,
    taxa_entrega: orderData.deliveryFee,
    total: orderData.total,
    items: orderData.items.map(item => ({
      ...item,
      borda: item.border,
      valor_borda: item.borderPrice
    }))
  };
  
  // Salvar pedido...
};

export default OrderFormExample; 