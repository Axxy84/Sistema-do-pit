import React, { createContext, useContext } from 'react';

export const OrderContext = createContext({
  orders: [],
  setOrders: () => {},
  availableOrders: [],
  setAvailableOrders: () => {},
});

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders deve ser usado dentro de um OrderProvider');
  }
  return context;
};