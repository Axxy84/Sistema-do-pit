import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';

import { ORDER_STATUSES_GENERAL, PAYMENT_METHODS } from '@/lib/constants'; 
import { formatCurrency } from '@/lib/utils';
import { Truck, Coffee, CreditCard, DollarSign, Smartphone, Layers, Edit, Printer, Trash2, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OrdersTable = ({ 
  orders = [], 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onPrint = () => {}, 
  onPrintDelivery = () => {},
  onPrintKitchen = () => {},
  actionsComponent: ActionsComponent = null 
}) => {

  const getStatusBadge = (statusId) => {
    const statusInfo = ORDER_STATUSES_GENERAL.find(s => s.id === statusId);
    if (!statusInfo) return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full bg-gray-400`}>Desconhecido</span>;
    return <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${statusInfo.color}`}>{statusInfo.name}</span>;
  };

  const getOrderTypeBadge = (order) => {
    if (order.tipo_pedido === 'mesa') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
          <Coffee className="h-3 w-3" />
          Mesa {order.numero_mesa}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
        <Truck className="h-3 w-3" />
        Delivery
      </span>
    );
  };

  const getPaymentInfo = (order) => {
    if (order.multiplos_pagamentos && order.pagamentos && order.pagamentos.length > 0) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
            <Layers className="h-3 w-3" />
            {order.pagamentos.length} formas
          </span>
          <div className="text-xs text-muted-foreground">
            {order.pagamentos.map((pagamento, index) => {
              const icon = pagamento.forma_pagamento === 'dinheiro' ? '💵' :
                          pagamento.forma_pagamento === 'cartao' ? '💳' :
                          pagamento.forma_pagamento === 'pix' ? '📱' : '💰';
              return (
                <div key={index} className="flex justify-between">
                  <span>{icon} {pagamento.forma_pagamento}</span>
                  <span>{formatCurrency(pagamento.valor)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Pagamento único
      const paymentMethod = PAYMENT_METHODS.find(pm => pm.id === order.paymentMethod);
      const icon = order.paymentMethod === 'dinheiro' ? <DollarSign className="h-3 w-3" /> :
                   order.paymentMethod === 'cartao' ? <CreditCard className="h-3 w-3" /> :
                   order.paymentMethod === 'pix' ? <Smartphone className="h-3 w-3" /> :
                   <CreditCard className="h-3 w-3" />;
      
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
          {icon}
          {paymentMethod?.name || order.paymentMethodName || 'N/A'}
        </span>
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/20">
            <TableHead className="text-foreground/90">ID</TableHead>
            <TableHead className="text-foreground/90">Tipo</TableHead>
            <TableHead className="text-foreground/90">Cliente</TableHead>
            <TableHead className="text-foreground/90">Valor Total</TableHead>
            <TableHead className="text-foreground/90">Pagamento</TableHead>
            <TableHead className="text-foreground/90">Entregador</TableHead>
            <TableHead className="text-foreground/90">Status</TableHead>
            <TableHead className="text-foreground/90">Data</TableHead>
            <TableHead className="text-right text-foreground/90">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {orders.map((order) => (
              <tr 
                key={order.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-mono text-xs text-foreground/80">#{String(order.id).slice(-5).toUpperCase()}</TableCell>
                <TableCell>{getOrderTypeBadge(order)}</TableCell>
                <TableCell className="font-medium text-foreground">{order.customerName}</TableCell>
                <TableCell className="text-foreground/90">{formatCurrency(order.totalValue)}</TableCell>
                <TableCell>{getPaymentInfo(order)}</TableCell>
                <TableCell className="text-foreground/90">
                  {order.tipo_pedido === 'mesa' ? '-' : (order.delivererName || order.entregador_nome || 'N/A')}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-foreground/80 text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {/* Render actions passed from OrdersList or default actions */}
                  {order.actions ? order.actions : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onEdit(order)}
                        size="sm"
                        variant="outline"
                        className="h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onPrint(order)}
                        size="sm"
                        variant="outline"
                        className="h-8"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {/* Novo botão: Imprimir para entregador */}
                      <Button
                        onClick={() => onPrintDelivery(order)}
                        size="sm"
                        variant="outline"
                        className="h-8 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        title="Imprimir para entregador"
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                      {/* Novo botão: Imprimir para cozinha */}
                      <Button
                        onClick={() => onPrintKitchen(order)}
                        size="sm"
                        variant="outline"
                        className="h-8 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                        title="Imprimir para cozinha"
                      >
                        <ChefHat className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onDelete(order.id)}
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </tr>
            ))}
        </TableBody>
        {orders.length === 0 && <TableCaption>Nenhum pedido encontrado.</TableCaption>}
        {orders.length > 5 && <TableCaption>Total de {orders.length} pedidos registrados.</TableCaption>}
      </Table>
    </div>
  );
};

export default OrdersTable;