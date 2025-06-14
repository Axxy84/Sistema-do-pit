import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Loader2, Printer } from 'lucide-react';

import OrderForm from '@/components/orders/OrderForm';
import OrdersList from '@/components/orders/layout/OrdersList';
import OrdersHeader from '@/components/orders/layout/OrdersHeader';
import { PAYMENT_METHODS, PIZZA_SIZES } from '@/lib/constants';
import { formatOrderTicketForPrint, formatDeliveryTicketForPrint, formatKitchenTicketForPrint, testSimplePrint } from '@/lib/printerUtils';

import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import customerService from '@/services/customerService';


const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [allProductsData, setAllProductsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false); 
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [orderForKitchenPrint, setOrderForKitchenPrint] = useState(null);

  const { toast } = useToast();

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
      const formattedOrders = data.map(order => {
        // Calcular subtotal baseado nos itens (com verificação de segurança)
        const calculatedSubtotal = (order.itens_pedido || []).reduce((sum, item) => {
          return sum + (parseFloat(item.valor_unitario || 0) * parseInt(item.quantidade || 0));
        }, 0);

        return {
          id: order.id,
          customerName: order.cliente_id?.nome || 'Cliente não encontrado',
          customerPhone: order.cliente_id?.telefone || 'N/A',
          customerAddress: order.cliente_id?.endereco || order.endereco_entrega || 'N/A',
          deliverer: 'none', // Não usado mais
          delivererName: order.entregador_nome || 'N/A',
          delivererPhone: null, // Não usado mais
          status: order.status_pedido,
          paymentMethod: order.forma_pagamento,
          paymentMethodName: PAYMENT_METHODS.find(pm => pm.id === order.forma_pagamento)?.name || order.forma_pagamento,
          totalValue: order.total,
          subtotal: calculatedSubtotal, // Adicionar subtotal calculado
          taxa_entrega: order.taxa_entrega || 0, // Taxa de entrega do banco
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
          tipo_pedido: order.tipo_pedido || 'delivery',
          numero_mesa: order.numero_mesa,
          entregador_nome: order.entregador_nome, // Adicionar campo direto
          items: order.itens_pedido.map(item => {
            const isPizza = item.produto_id_ref?.tipo_produto === 'pizza' || (item.sabor_registrado && item.tamanho_registrado) || item.sabores_registrados;
            let sizeName = item.tamanho_registrado;
            let unitPrice = item.valor_unitario;
            
            // Verificar se tem múltiplos sabores
            const hasMultipleFlavors = item.sabores_registrados && Array.isArray(item.sabores_registrados) && item.sabores_registrados.length > 1;

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
              flavor: isPizza ? (hasMultipleFlavors ? null : (item.produto_id_ref?.nome || item.sabor_registrado)) : null,
              size: item.tamanho_registrado, 
              sizeName: sizeName, 
              productName: !isPizza ? (item.produto_id_ref?.nome || item.sabor_registrado) : null,
              category: item.produto_id_ref?.categoria,
              quantity: item.quantidade,
              unitPrice: unitPrice,
              totalPrice: unitPrice * item.quantidade,
              // Adicionar campos para múltiplos sabores
              useMultipleFlavors: hasMultipleFlavors,
              multipleFlavors: hasMultipleFlavors ? item.sabores_registrados : [],
              // Para exibição, criar um nome descritivo dos sabores
              displayName: isPizza ? (
                hasMultipleFlavors ? 
                  item.sabores_registrados.map(s => s.nome).join(' + ') :
                  (item.produto_id_ref?.nome || item.sabor_registrado)
              ) : (item.produto_id_ref?.nome || item.sabor_registrado)
            };
          }),
          cliente_id: order.cliente_id, 
          entregador_id: order.entregador_id 
        };
      });
      setOrders(formattedOrders);
    } catch (error) {
      toast({ title: 'Erro ao buscar pedidos', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllProducts();
    fetchOrders();

    const handleOrderStatusChanged = () => fetchOrders();
    window.addEventListener('orderStatusChanged', handleOrderStatusChanged);

    const handleOrderSavedGlobal = () => fetchOrders();
    window.addEventListener('orderSaved', handleOrderSavedGlobal);


    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChanged);
      window.removeEventListener('orderSaved', handleOrderSavedGlobal);
    };
  }, [fetchAllProducts, fetchOrders]);


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
      if (!orderFormData.customerName) {
        throw new Error("Nome do cliente é obrigatório.");
      }

      console.log('[OrdersPage] Iniciando processo de salvar pedido:', orderFormData);
      
      // Mostrar toast informativo apenas se não houver customerId
      if (!orderFormData.customerId) {
        toast({ 
          title: 'Processando...', 
          description: 'Verificando dados do cliente...' 
        });
      }

      const clienteId = await customerService.manageCustomer({
        nome: orderFormData.customerName,
        telefone: orderFormData.customerPhone || '', // Telefone pode estar vazio
        endereco: orderFormData.customerAddress || '',
      });
      
      console.log('[OrdersPage] Cliente gerenciado com sucesso, ID:', clienteId);
      
      finalToastMessage = orderFormData.customerId ? 
        (currentOrder ? 'Pedido atualizado com sucesso!' : 'Pedido salvo para cliente existente!') 
        : 'Novo cliente cadastrado e pedido salvo com sucesso!';
      if (currentOrder && orderFormData.customerId && orderFormData.customerId !== clienteId) {
         finalToastMessage = 'Cliente atualizado e pedido salvo!';
      }

      const pedidoToSave = {
        cliente_id: clienteId,
        entregador_nome: orderFormData.entregador_nome || null,
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
        tipo_pedido: orderFormData.tipo_pedido,
        numero_mesa: orderFormData.numero_mesa,
        endereco_entrega: orderFormData.customerAddress,
        taxa_entrega: orderFormData.taxa_entrega || 0,
        // Dados de múltiplos pagamentos
        multiplos_pagamentos: orderFormData.multiplos_pagamentos || false,
        pagamentos: orderFormData.pagamentos || []
      };
      if (!currentOrder?.id) {
        pedidoToSave.created_at = new Date().toISOString();
      }

      const itensToPersist = orderFormData.items.map(item => {
        let productRefId = null;
        if(item.itemType === 'pizza') {
            if (item.useMultipleFlavors && item.multipleFlavors && item.multipleFlavors.length > 0) {
                // Para múltiplos sabores, usar o primeiro sabor como referência (ou null)
                const firstFlavor = item.multipleFlavors[0];
                const pizzaProduct = allProductsData.find(p => p.nome === firstFlavor.nome && p.tipo_produto === 'pizza');
                productRefId = pizzaProduct?.id || null;
            } else {
                // Pizza tradicional com sabor único
                const pizzaProduct = allProductsData.find(p => p.nome === item.flavor && p.tipo_produto === 'pizza');
                productRefId = pizzaProduct?.id || null;
            }
        } else { 
            productRefId = item.productId || null;
        }
        
        // Para pizzas, incluir o preço da borda no valor unitário
        const valorUnitario = item.itemType === 'pizza' ? 
          item.unitPrice + (item.borderPrice || 0) : 
          item.unitPrice;
        
        const itemData = {
            produto_id_ref: productRefId, 
            quantidade: item.quantity,
            valor_unitario: valorUnitario,
            itemType: item.itemType, // Adicionar para identificar no backend
        };

        // Adicionar dados específicos de pizzas
        if (item.itemType === 'pizza') {
            itemData.tamanho_registrado = item.size;
            
            if (item.useMultipleFlavors && item.multipleFlavors && item.multipleFlavors.length > 1) {
                // Pizza com múltiplos sabores
                itemData.sabores_registrados = item.multipleFlavors;
            } else {
                // Pizza tradicional com sabor único
                itemData.sabor_registrado = item.flavor;
            }
        } else {
            // Produtos que não são pizza
            itemData.sabor_registrado = item.productName;
            itemData.tamanho_registrado = null;
        }
        
        return itemData;
      });

      console.log('[OrdersPage] Salvando pedido:', pedidoToSave);
      const savedOrder = await orderService.saveOrder(pedidoToSave, itensToPersist, currentOrder);
      console.log('[OrdersPage] Pedido salvo com sucesso:', savedOrder);
      
      savedPedidoFullData = { // Reconstruct for printing and immediate UI update if needed
        ...savedOrder,
        customerName: savedOrder.cliente_id?.nome || orderFormData.customerName,
        customerPhone: savedOrder.cliente_id?.telefone || orderFormData.customerPhone,
        customerAddress: savedOrder.cliente_id?.endereco || orderFormData.customerAddress,
        items: orderFormData.items, // Use items from form for print consistency for now
        delivererName: orderFormData.entregador_nome || 'Não atribuído',
        paymentMethodName: PAYMENT_METHODS.find(pm => pm.id === savedOrder.forma_pagamento)?.name || 'Não informado',
        cupom_codigo: savedOrder.cupom_id_data?.codigo,
        observacoes: savedOrder.observacoes,
        amountPaid: savedOrder.valor_pago,
        calculatedChange: savedOrder.troco_calculado,
        orderDate: savedOrder.data_pedido || savedOrder.created_at,
        // Adicionar valores do formulário para impressão correta
        subtotal: orderFormData.subtotal,
        totalValue: orderFormData.total,
        desconto_aplicado: orderFormData.desconto_aplicado || 0,
        taxa_entrega: orderFormData.taxa_entrega || 0,
        // Dados de múltiplos pagamentos para impressão
        multiplos_pagamentos: orderFormData.multiplos_pagamentos || false,
        pagamentos: orderFormData.pagamentos || []
      };
      
      success = true;

      setIsFormOpen(false); 
      resetFormState();
      
      toast({ title: 'Sucesso!', description: finalToastMessage });
      
      // Atualizar lista de pedidos imediatamente
      await fetchOrders(); 
      
      // Emitir eventos
      window.dispatchEvent(new CustomEvent('orderSaved', { detail: { orderId: savedOrder.id } })); 
      if (currentOrder?.status_pedido !== savedOrder.status_pedido || !currentOrder) {
        window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId: savedOrder.id, newStatus: savedOrder.status_pedido } }));
      }

    } catch (error) {
      console.error('[OrdersPage] Erro ao salvar pedido:', error);
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
        entregador_nome: order.entregador_nome || '',
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
        tipo_pedido: order.tipo_pedido || 'delivery',
        numero_mesa: order.numero_mesa,
        endereco_entrega: order.endereco_entrega,
        taxa_entrega: order.taxa_entrega || 0,
        // Dados de múltiplos pagamentos
        multiplos_pagamentos: order.multiplos_pagamentos || false,
        pagamentos: order.pagamentos || []
    };
    setCurrentOrder(orderForForm);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    // Adicionar confirmação
    const confirmed = window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.');
    if (!confirmed) {
      console.log('[OrdersPage] Exclusão cancelada pelo usuário');
      return;
    }

    setIsDeletingOrder(true); 
    try {
      console.log('[OrdersPage] Deletando pedido:', id);
      await orderService.deleteOrder(id);
      toast({ title: 'Sucesso!', description: 'Pedido removido com sucesso.' });
      fetchOrders(); 
      window.dispatchEvent(new CustomEvent('orderSaved', { detail: { orderId: id, action: 'delete' } })); 
    } catch (error) {
      console.error('[OrdersPage] Erro ao deletar pedido:', error);
      toast({ title: 'Erro ao remover pedido', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeletingOrder(false);
    }
  }, [fetchOrders, toast]);

  const handlePrint = useCallback((orderToPrint, autoPrint = false) => {
    try {
      // Verificar se os dados do pedido são válidos
      if (!orderToPrint) {
        console.error('[PRINT] Dados do pedido inválidos para impressão');
        toast({ title: 'Erro', description: 'Dados do pedido inválidos para impressão', variant: 'destructive' });
        return;
      }
      
      const completeOrderDataForPrint = {
        ...orderToPrint,
        delivererName: orderToPrint.delivererName || orderToPrint.entregador_nome || 'Não atribuído',
        paymentMethodName: orderToPrint.paymentMethodName || PAYMENT_METHODS.find(pm => pm.id === orderToPrint.forma_pagamento)?.name || 'Não informado',
      };

      let ticketContent;
      try {
        ticketContent = formatOrderTicketForPrint(completeOrderDataForPrint, allProductsData);
      } catch (formatError) {
        console.error('[PRINT] Erro ao formatar ticket:', formatError);
        toast({ title: 'Erro', description: 'Erro ao formatar cupom para impressão', variant: 'destructive' });
        return;
      }
      
      // Se o conteúdo for muito grande, pode causar problemas
      if (ticketContent && ticketContent.length > 10000) {
        console.warn('[PRINT] Conteúdo do ticket muito grande:', ticketContent.length);
      }
      
      // Usar setTimeout para garantir que não bloqueie o thread principal
      setTimeout(() => {
        try {
          const printWindow = window.open('', '_blank', 'width=300,height=500');
          
          if (!printWindow) {
            console.error('[PRINT] Não foi possível abrir janela de impressão');
            toast({ title: 'Erro de Impressão', description: 'Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.', variant: 'destructive'});
            return;
          }
          
          printWindow.document.write('<html><head><title>Cupom</title>');
          printWindow.document.write('<style>body { font-family: monospace; font-size: 10pt; margin: 5px; } pre { white-space: pre-wrap; word-wrap: break-word; } </style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write('<pre>' + ticketContent + '</pre>');
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          
          printWindow.onload = function() {
            try {
              printWindow.focus();
              if (autoPrint) {
                printWindow.print();
              }
            } catch (printError) {
              console.error('[PRINT] Erro ao chamar print():', printError);
            }
          };
          
          const printAction = autoPrint ? 'enviado para impressão' : 'aberto para impressão';
          toast({ title: 'Cupom Preparado', description: `Cupom do pedido #${String(orderToPrint.id || '').slice(-5).toUpperCase() || 'N/A'} ${printAction}.` });
          
        } catch (error) {
          console.error('[PRINT] Erro geral:', error);
          toast({ title: 'Erro de Impressão', description: 'Erro inesperado durante a impressão', variant: 'destructive' });
        }
      }, 100);
      
    } catch (error) {
      console.error('[PRINT] Erro crítico:', error);
      toast({ title: 'Erro Crítico', description: 'Falha crítica no sistema de impressão', variant: 'destructive' });
    }
  }, [allProductsData, toast]);

  const handlePrintDelivery = useCallback((orderToPrint) => {
    try {
      // Verificar se os dados do pedido são válidos
      if (!orderToPrint) {
        console.error('[DELIVERY-PRINT] Dados do pedido inválidos para impressão');
        toast({ title: 'Erro', description: 'Dados do pedido inválidos para impressão de entregador', variant: 'destructive' });
        return;
      }
      
      const completeOrderDataForPrint = {
        ...orderToPrint,
        delivererName: orderToPrint.delivererName || orderToPrint.entregador_nome || 'Não atribuído',
        paymentMethodName: orderToPrint.paymentMethodName || PAYMENT_METHODS.find(pm => pm.id === orderToPrint.forma_pagamento)?.name || 'Não informado',
      };

      let ticketContent;
      try {
        ticketContent = formatDeliveryTicketForPrint(completeOrderDataForPrint, allProductsData);
      } catch (formatError) {
        console.error('[DELIVERY-PRINT] Erro ao formatar cupom do entregador:', formatError);
        toast({ title: 'Erro', description: 'Erro ao formatar cupom do entregador', variant: 'destructive' });
        return;
      }
      
      // Usar setTimeout para garantir que não bloqueie o thread principal
      setTimeout(() => {
        try {
          const printWindow = window.open('', '_blank', 'width=300,height=500');
          
          if (!printWindow) {
            console.error('[DELIVERY-PRINT] Não foi possível abrir janela de impressão');
            toast({ title: 'Erro de Impressão', description: 'Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.', variant: 'destructive'});
            return;
          }
          
          printWindow.document.write('<html><head><title>Cupom Entregador</title>');
          printWindow.document.write('<style>body { font-family: monospace; font-size: 10pt; margin: 5px; } pre { white-space: pre-wrap; word-wrap: break-word; } </style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write('<pre>' + ticketContent + '</pre>');
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          
          printWindow.onload = function() {
            try {
              printWindow.focus();
              printWindow.print();
            } catch (printError) {
              console.error('[DELIVERY-PRINT] Erro ao chamar print():', printError);
            }
          };
          
          toast({ title: 'Impressão Entregador', description: `Cupom para entregador #${String(orderToPrint.id || '').slice(-5).toUpperCase() || 'N/A'} preparado.` });
          
        } catch (error) {
          console.error('[DELIVERY-PRINT] Erro geral:', error);
          toast({ title: 'Erro de Impressão', description: 'Erro inesperado durante a impressão para entregador', variant: 'destructive' });
        }
      }, 100);
      
    } catch (error) {
      console.error('[DELIVERY-PRINT] Erro crítico:', error);
      toast({ title: 'Erro Crítico', description: 'Falha crítica no sistema de impressão para entregador', variant: 'destructive' });
    }
  }, [allProductsData, toast]);

  const handlePrintKitchen = useCallback((orderToPrint, selectedPriority = null) => {
    try {
      // Verificar se os dados do pedido são válidos
      if (!orderToPrint) {
        console.error('[KITCHEN-PRINT] Dados do pedido inválidos para impressão');
        toast({ title: 'Erro', description: 'Dados do pedido inválidos para impressão de cozinha', variant: 'destructive' });
        return;
      }

      // Se não foi fornecida uma prioridade, mostrar modal de seleção
      if (selectedPriority === null) {
        setOrderForKitchenPrint(orderToPrint);
        setShowPriorityModal(true);
        return;
      }
      
      const completeOrderDataForPrint = {
        ...orderToPrint,
        delivererName: orderToPrint.delivererName || orderToPrint.entregador_nome || 'Não atribuído',
        paymentMethodName: orderToPrint.paymentMethodName || PAYMENT_METHODS.find(pm => pm.id === orderToPrint.forma_pagamento)?.name || 'Não informado',
      };

      let ticketContent;
      try {
        ticketContent = formatKitchenTicketForPrint(completeOrderDataForPrint, allProductsData, selectedPriority);
      } catch (formatError) {
        console.error('[KITCHEN-PRINT] Erro ao formatar cupom da cozinha:', formatError);
        toast({ title: 'Erro', description: 'Erro ao formatar cupom da cozinha', variant: 'destructive' });
        return;
      }
      
      // Usar setTimeout para garantir que não bloqueie o thread principal
      setTimeout(() => {
        try {
          const printWindow = window.open('', '_blank', 'width=300,height=500');
          
          if (!printWindow) {
            console.error('[KITCHEN-PRINT] Não foi possível abrir janela de impressão');
            toast({ title: 'Erro de Impressão', description: 'Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.', variant: 'destructive'});
            return;
          }
          
          printWindow.document.write('<html><head><title>Cupom Cozinha</title>');
          printWindow.document.write('<style>body { font-family: monospace; font-size: 10pt; margin: 5px; } pre { white-space: pre-wrap; word-wrap: break-word; } </style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write('<pre>' + ticketContent + '</pre>');
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          
          printWindow.onload = function() {
            try {
              printWindow.focus();
              printWindow.print();
            } catch (printError) {
              console.error('[KITCHEN-PRINT] Erro ao chamar print():', printError);
            }
          };
          
          toast({ title: 'Impressão Cozinha', description: `Cupom para cozinha #${String(orderToPrint.id || '').slice(-5).toUpperCase() || 'N/A'} preparado.` });
          
        } catch (error) {
          console.error('[KITCHEN-PRINT] Erro geral:', error);
          toast({ title: 'Erro de Impressão', description: 'Erro inesperado durante a impressão para cozinha', variant: 'destructive' });
        }
      }, 100);
      
    } catch (error) {
      console.error('[KITCHEN-PRINT] Erro crítico:', error);
      toast({ title: 'Erro Crítico', description: 'Falha crítica no sistema de impressão para cozinha', variant: 'destructive' });
    }
  }, [allProductsData, toast]);

  const handlePrioritySelection = useCallback((priority) => {
    if (orderForKitchenPrint) {
      setShowPriorityModal(false);
      // Chamar a função novamente com a prioridade selecionada
      handlePrintKitchen(orderForKitchenPrint, priority);
      setOrderForKitchenPrint(null);
    }
  }, [orderForKitchenPrint, handlePrintKitchen]);

  const filteredOrders = useMemo(() => orders.filter(order => 
    (order.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ), [orders, searchTerm]);

  return (
    <div className="space-y-6">
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
        onPrintDelivery={handlePrintDelivery}
        onPrintKitchen={handlePrintKitchen}
        isLoading={isLoadingOrders}
        fetchOrders={fetchOrders}
      />

      {/* Modal de Seleção de Prioridade para Cozinha */}
      <Dialog open={showPriorityModal} onOpenChange={setShowPriorityModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🧑‍🍳 Selecionar Prioridade do Pedido</DialogTitle>
            <DialogDescription>
              Escolha a prioridade para o cupom da cozinha do pedido #{String(orderForKitchenPrint?.id || '').slice(-5).toUpperCase() || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button
              onClick={() => handlePrioritySelection('normal')}
              variant="outline"
              className="h-16 text-left flex items-center gap-3 hover:bg-blue-50"
            >
              <span className="text-2xl">🚚</span>
              <div>
                <div className="font-semibold">PEDIDO DELIVERY</div>
                <div className="text-sm text-muted-foreground">Prioridade normal de entrega</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handlePrioritySelection('balcao')}
              variant="outline"
              className="h-16 text-left flex items-center gap-3 hover:bg-amber-50"
            >
              <span className="text-2xl">🏪</span>
              <div>
                <div className="font-semibold">PEDIDO BALCÃO</div>
                <div className="text-sm text-muted-foreground">Cliente aguardando no balcão</div>
              </div>
            </Button>

            <Button
              onClick={() => handlePrioritySelection('urgente')}
              variant="outline"
              className="h-16 text-left flex items-center gap-3 hover:bg-yellow-50"
            >
              <span className="text-2xl">⚡</span>
              <div>
                <div className="font-semibold">PEDIDO URGENTE</div>
                <div className="text-sm text-muted-foreground">Preparar com prioridade máxima</div>
              </div>
            </Button>

            <Button
              onClick={() => handlePrioritySelection('atrasado')}
              variant="outline"
              className="h-16 text-left flex items-center gap-3 hover:bg-red-50"
            >
              <span className="text-2xl">🚨</span>
              <div>
                <div className="font-semibold">PEDIDO ATRASADO</div>
                <div className="text-sm text-muted-foreground">Pedido que passou do prazo</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
