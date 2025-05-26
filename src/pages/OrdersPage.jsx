import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderForm from '@/components/orders/OrderForm';
import OrdersList from '@/components/orders/layout/OrdersList';
import OrdersHeader from '@/components/orders/layout/OrdersHeader';
import { PAYMENT_METHODS, PIZZA_SIZES } from '@/lib/constants';
import { formatOrderTicketForPrint } from '@/lib/printerUtils';

import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { delivererService } from '@/services/delivererService';


const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [allProductsData, setAllProductsData] = useState([]);
  const [deliverersList, setDeliverersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false); 
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const { toast } = useToast();

  const fetchDeliverers = useCallback(async () => {
    try {
      const data = await delivererService.getActiveDeliverers();
      setDeliverersList(data || []);
    } catch (err) {
      toast({ title: "Erro ao buscar entregadores", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const fetchAllProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await productService.getAllActiveProducts();
      setAllProductsData(data || []);
    } catch (error) {
       toast({ title: 'Erro ao carregar produtos', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoadingProducts(false);
    }
  }, [toast]);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await orderService.getAllOrders();
      const formattedOrders = data.map(order => ({
        id: order.id,
        customerName: order.cliente_id?.nome || 'Cliente não encontrado',
        customerPhone: order.cliente_id?.telefone || 'N/A',
        customerAddress: order.cliente_id?.endereco || 'N/A',
        deliverer: order.entregador_id?.id || 'none', 
        delivererName: order.entregador_id?.nome,
        delivererPhone: order.entregador_id?.telefone,
        status: order.status_pedido,
        paymentMethod: order.forma_pagamento,
        paymentMethodName: PAYMENT_METHODS.find(pm => pm.id === order.forma_pagamento)?.name || order.forma_pagamento,
        totalValue: order.total,
        amountPaid: order.valor_pago,
        calculatedChange: order.troco_calculado,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        orderDate: order.data_pedido,
        cupom_id: order.cupom_id,
        cupom_codigo: order.cupom_id_data?.codigo,
        cupom_tipo_desconto: order.cupom_id_data?.tipo_desconto,
        cupom_valor_desconto: order.cupom_id_data?.valor_desconto,
        desconto_aplicado: order.desconto_aplicado,
        pontos_ganhos: order.pontos_ganhos,
        pontos_resgatados: order.pontos_resgatados,
        observacoes: order.observacoes,
        items: order.itens_pedido.map(item => {
          const isPizza = item.produto_id_ref?.tipo_produto === 'pizza' || (item.sabor_registrado && item.tamanho_registrado);
          let sizeName = item.tamanho_registrado;
          let unitPrice = item.valor_unitario;

          if (isPizza) {
            if (item.produto_id_ref?.tamanhos_precos) { 
              const sizeInfo = item.produto_id_ref.tamanhos_precos.find(tp => tp.id_tamanho === item.tamanho_registrado);
              sizeName = sizeInfo?.nome_tamanho || item.tamanho_registrado;
            } else { 
              const legacySize = PIZZA_SIZES.find(s => s.id === item.tamanho_registrado);
              sizeName = legacySize?.name || item.tamanho_registrado;
            }
          }
          
          return {
            id: item.id,
            itemType: isPizza ? 'pizza' : (item.produto_id_ref?.tipo_produto || 'other'),
            productId: item.produto_id_ref?.id || null,
            flavor: isPizza ? (item.produto_id_ref?.nome || item.sabor_registrado) : null,
            size: item.tamanho_registrado, 
            sizeName: sizeName, 
            productName: !isPizza ? (item.produto_id_ref?.nome || item.sabor_registrado) : null,
            category: item.produto_id_ref?.categoria,
            quantity: item.quantidade,
            unitPrice: unitPrice,
            totalPrice: unitPrice * item.quantidade,
          };
        }),
        cliente_id: order.cliente_id, 
        entregador_id: order.entregador_id 
      }));
      setOrders(formattedOrders);
    } catch (error) {
      toast({ title: 'Erro ao buscar pedidos', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeliverers();
    fetchAllProducts();
    fetchOrders();

    const handleDeliverersUpdated = () => fetchDeliverers();
    window.addEventListener('deliverersUpdated', handleDeliverersUpdated);
    
    const handleOrderStatusChanged = () => fetchOrders();
    window.addEventListener('orderStatusChanged', handleOrderStatusChanged);

    const handleOrderSavedGlobal = () => fetchOrders();
    window.addEventListener('orderSaved', handleOrderSavedGlobal);


    return () => {
      window.removeEventListener('deliverersUpdated', handleDeliverersUpdated);
      window.removeEventListener('orderStatusChanged', handleOrderStatusChanged);
      window.removeEventListener('orderSaved', handleOrderSavedGlobal);
    };
  }, [fetchDeliverers, fetchAllProducts, fetchOrders]);


  const resetFormState = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  const handleFormOpenChange = useCallback((isOpen) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      resetFormState();
    }
  }, [resetFormState]);

  const handleSaveOrder = useCallback(async (orderFormData) => {
    setIsSavingOrder(true);
    let savedPedidoFullData = null;
    let success = false;
    let finalToastMessage = '';

    try {
      if (!orderFormData.customerPhone || !orderFormData.customerName) {
        throw new Error("Nome e telefone do cliente são obrigatórios.");
      }

      const clienteId = await orderService.manageCustomer({
        customerId: orderFormData.customerId,
        customerName: orderFormData.customerName,
        customerPhone: orderFormData.customerPhone,
        customerAddress: orderFormData.customerAddress,
      });
      
      finalToastMessage = orderFormData.customerId ? 
        (currentOrder ? 'Pedido atualizado com sucesso!' : 'Pedido salvo para cliente existente!') 
        : 'Cliente criado automaticamente e pedido salvo!';
      if (currentOrder && orderFormData.customerId && orderFormData.customerId !== clienteId) {
         finalToastMessage = 'Cliente atualizado e pedido salvo!';
      }


      const pedidoToSave = {
        cliente_id: clienteId,
        entregador_id: orderFormData.entregador_id === '' || orderFormData.entregador_id === 'none' ? null : orderFormData.entregador_id,
        status_pedido: orderFormData.status_pedido,
        total: orderFormData.total,
        forma_pagamento: orderFormData.forma_pagamento,
        observacoes: orderFormData.observacoes || '', 
        data_pedido: currentOrder?.orderDate || new Date().toISOString(), 
        valor_pago: orderFormData.valor_pago,
        troco_calculado: orderFormData.troco_calculado,
        cupom_id: orderFormData.cupom_id,
        desconto_aplicado: orderFormData.desconto_aplicado,
        pontos_ganhos: orderFormData.pontos_ganhos,
        pontos_resgatados: orderFormData.pontos_resgatados,
        updated_at: new Date().toISOString(),
      };
      if (!currentOrder?.id) {
        pedidoToSave.created_at = new Date().toISOString();
      }

      const itensToPersist = orderFormData.items.map(item => {
        let productRefId = null;
        if(item.itemType === 'pizza') {
            const pizzaProduct = allProductsData.find(p => p.nome === item.flavor && p.tipo_produto === 'pizza');
            productRefId = pizzaProduct?.id || null;
        } else { 
            productRefId = item.productId || null;
        }
        return {
            produto_id_ref: productRefId, 
            sabor_registrado: item.itemType === 'pizza' ? item.flavor : item.productName,
            tamanho_registrado: item.itemType === 'pizza' ? item.size : null,
            quantidade: item.quantity,
            valor_unitario: item.unitPrice,
        };
      });

      const savedOrder = await orderService.saveOrder(pedidoToSave, itensToPersist, currentOrder);
      
      savedPedidoFullData = { // Reconstruct for printing and immediate UI update if needed
        ...savedOrder,
        customerName: savedOrder.cliente_id?.nome || orderFormData.customerName,
        customerPhone: savedOrder.cliente_id?.telefone || orderFormData.customerPhone,
        customerAddress: savedOrder.cliente_id?.endereco || orderFormData.customerAddress,
        items: orderFormData.items, // Use items from form for print consistency for now
        delivererName: savedOrder.entregador_id?.nome || 'Não atribuído',
        delivererPhone: savedOrder.entregador_id?.telefone || '',
        paymentMethodName: PAYMENT_METHODS.find(pm => pm.id === savedOrder.forma_pagamento)?.name || 'Não informado',
        cupom_codigo: savedOrder.cupom_id_data?.codigo,
        observacoes: savedOrder.observacoes,
        amountPaid: savedOrder.valor_pago,
        calculatedChange: savedOrder.troco_calculado,
        orderDate: savedOrder.data_pedido || savedOrder.created_at,
      };
      
      success = true;

      setIsFormOpen(false); 
      resetFormState();
      
      toast({ title: 'Sucesso!', description: finalToastMessage });
      
      setTimeout(() => {
        if (savedPedidoFullData) {
          handlePrint(savedPedidoFullData, true); 
        }
        fetchOrders(); 
        window.dispatchEvent(new CustomEvent('orderSaved', { detail: { orderId: savedOrder.id } })); 
        if (currentOrder?.status_pedido !== savedOrder.status_pedido || !currentOrder) {
          window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId: savedOrder.id, newStatus: savedOrder.status_pedido } }));
        }
      }, 0);

    } catch (error) {
      toast({ title: `Erro ao ${currentOrder ? 'atualizar' : 'salvar'} pedido`, description: error.message, variant: 'destructive' });
      success = false;
    } finally {
      setIsSavingOrder(false);
    }
  }, [currentOrder, toast, resetFormState, fetchOrders, allProductsData, handleFormOpenChange]);

  const handleEdit = useCallback((order) => {
    const orderForForm = {
        ...order,
        customerId: order.cliente_id?.id || null,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        deliverer: order.entregador_id?.id || 'none',
        status_pedido: order.status,
        forma_pagamento: order.paymentMethod || PAYMENT_METHODS[0].id,
        valor_pago: order.amountPaid || '',
        cupom_id: order.cupom_id,
        cupom_codigo: order.cupom_codigo,
        cupom_tipo_desconto: order.cupom_tipo_desconto,
        cupom_valor_desconto: order.cupom_valor_desconto,
        pontos_resgatados: order.pontos_resgatados,
        total: order.totalValue,
        troco_calculado: order.calculatedChange,
        observacoes: order.observacoes,
        items: order.items,
        orderDate: order.orderDate || order.createdAt,
    };
    setCurrentOrder(orderForForm);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    setIsSavingOrder(true); 
    try {
      await orderService.deleteOrder(id);
      toast({ title: 'Sucesso!', description: 'Pedido removido com sucesso.' });
      fetchOrders(); 
      window.dispatchEvent(new CustomEvent('orderSaved', { detail: { orderId: id, action: 'delete' } })); 
    } catch (error) {
      toast({ title: 'Erro ao remover pedido', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingOrder(false);
    }
  }, [fetchOrders, toast]);

  const handlePrint = useCallback((orderToPrint, autoPrint = false) => {
    const completeOrderDataForPrint = {
        ...orderToPrint,
        delivererName: orderToPrint.delivererName || deliverersList.find(d => d.id === orderToPrint.entregador_id?.id)?.nome || 'Não atribuído',
        delivererPhone: orderToPrint.delivererPhone || deliverersList.find(d => d.id === orderToPrint.entregador_id?.id)?.telefone || '',
        paymentMethodName: orderToPrint.paymentMethodName || PAYMENT_METHODS.find(pm => pm.id === orderToPrint.forma_pagamento)?.name || 'Não informado',
    };

    const ticketContent = formatOrderTicketForPrint(completeOrderDataForPrint, allProductsData);
    
    const printWindow = window.open('', '_blank', 'width=300,height=500');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Cupom</title>');
      printWindow.document.write('<style>body { font-family: monospace; font-size: 10pt; margin: 5px; } pre { white-space: pre-wrap; word-wrap: break-word; } </style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<pre>' + ticketContent + '</pre>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      printWindow.onload = function() { 
          printWindow.focus(); 
          printWindow.print();
      };
      toast({ title: 'Impressão', description: `Ticket do pedido #${orderToPrint.id.slice(-5).toUpperCase()} preparado.` });
    } else {
      toast({ title: 'Erro de Impressão', description: 'Não foi possível abrir a janela de impressão. Verifique as configurações do seu navegador.', variant: 'destructive'});
    }
  }, [toast, allProductsData, deliverersList]);

  const filteredOrders = useMemo(() => orders.filter(order => 
    (order.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ), [orders, searchTerm]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <OrdersHeader />
          <Button 
            onClick={() => { setCurrentOrder(null); setIsFormOpen(true); }}
            className="bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow"
            disabled={isSavingOrder || isLoadingProducts || isLoadingOrders}
          >
            {(isLoadingProducts || isLoadingOrders) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />} 
            Novo Pedido
          </Button>
        </div>
      </motion.div>

      <OrderForm
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSaveOrder}
        initialOrderData={currentOrder}
        allProductsData={allProductsData}
        isSubmittingOrder={isSavingOrder}
      />

      <OrdersList
        orders={filteredOrders}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={(order) => handlePrint(order, false)} 
        isLoading={isLoadingOrders}
        fetchOrders={fetchOrders}
      />
    </div>
  );
};

export default OrdersPage;
