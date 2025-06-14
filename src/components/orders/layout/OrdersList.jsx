import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, AlertTriangle, CheckCircle2, Printer, Edit2, Trash2, Truck, ChefHat } from 'lucide-react'; // Added Truck and ChefHat
import OrdersTable from '@/components/orders/OrdersTable';
import { Button } from '@/components/ui/button';
import { orderService } from '@/services/orderService';
import { useToast } from '@/components/ui/use-toast';

// Componente padrão para ações da tabela
const DefaultActionsComponent = ({ order, onEdit, onDelete, onPrint, onPrintDelivery, onPrintKitchen }) => {
  const handleDeleteClick = () => {
    console.log('[DefaultActionsComponent] Botão deletar clicado, pedido:', order.id);
    onDelete(order.id);
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => onPrint(order)} className="text-sky-500 hover:text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-800/50" title="Imprimir cupom">
        <Printer className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onPrintDelivery(order)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50" title="Imprimir para entregador">
        <Truck className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onPrintKitchen(order)} className="text-orange-500 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-800/50" title="Imprimir para cozinha">
        <ChefHat className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onEdit(order)} className="text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-800/50" title="Editar pedido">
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleDeleteClick} className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-800/50" title="Deletar pedido">
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
};

const OrdersList = ({ orders, searchTerm, setSearchTerm, onEdit, onDelete, onPrint, onPrintDelivery, onPrintKitchen, isLoading, fetchOrders }) => {
  const [updatingStatusOrderId, setUpdatingStatusOrderId] = useState(null);
  const { toast } = useToast();

  const handleMarkAsDelivered = async (orderId) => {
    setUpdatingStatusOrderId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, 'entregue');

      toast({ title: 'Sucesso!', description: 'Pedido marcado como entregue.' });
      fetchOrders(); // Re-fetch orders to update the list
      window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId, newStatus: 'entregue' } }));
      window.dispatchEvent(new CustomEvent('orderSaved')); // General event for dashboard/cash closing updates
    } catch (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingStatusOrderId(null);
    }
  };
  
  const handleMarkAsRetirado = async (orderId) => {
    setUpdatingStatusOrderId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, 'retirado');

      toast({ title: 'Sucesso!', description: 'Pedido marcado como retirado.' });
      fetchOrders(); // Re-fetch orders to update the list
      window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId, newStatus: 'retirado' } }));
      window.dispatchEvent(new CustomEvent('orderSaved')); // General event for dashboard/cash closing updates
    } catch (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingStatusOrderId(null);
    }
  };
  
  const extendedOrders = orders.map(order => ({
    ...order,
    actions: (
      <div className="flex items-center justify-end space-x-1">
        {/* Botão "Entregue" para pedidos delivery */}
        {order.tipo_pedido !== 'mesa' && order.status !== 'entregue' && order.status !== 'retirado' && order.status !== 'cancelado' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAsDelivered(order.id)}
            disabled={updatingStatusOrderId === order.id}
            className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-700/20"
          >
            {updatingStatusOrderId === order.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Entregue
          </Button>
        )}
        
        {/* Botão "Retirado" para pedidos de mesa */}
        {order.tipo_pedido === 'mesa' && order.status !== 'entregue' && order.status !== 'retirado' && order.status !== 'cancelado' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAsRetirado(order.id)}
            disabled={updatingStatusOrderId === order.id}
            className="text-purple-600 border-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-700/20"
          >
            {updatingStatusOrderId === order.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Retirado
          </Button>
        )}
        
         <DefaultActionsComponent 
            order={order} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onPrint={onPrint} 
            onPrintDelivery={onPrintDelivery}
            onPrintKitchen={onPrintKitchen}
        />
      </div>
    )
  }));


  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Lista de Pedidos</CardTitle>
            <CardDescription>Visualize e gerencie todos os pedidos registrados.</CardDescription>
          </div>
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/70"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && orders.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : !isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum pedido encontrado</h2>
            <p className="text-muted-foreground max-w-md">
              {searchTerm 
                ? `Nenhum pedido corresponde à sua busca por "${searchTerm}".` 
                : 'Ainda não há pedidos registrados. Clique em "Novo Pedido" para começar.'}
            </p>
          </div>
        ) : (
          <OrdersTable
            orders={extendedOrders}
            onEdit={onEdit}
            onDelete={onDelete}
            onPrint={onPrint}
            onPrintDelivery={onPrintDelivery}
            onPrintKitchen={onPrintKitchen}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersList;
