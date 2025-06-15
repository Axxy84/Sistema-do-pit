// Hook para gerenciar status de pedidos com binários
import { useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { useToast } from '@/components/ui/use-toast';

// ===== BINÁRIOS (constantes únicas) =====
export const TIPO_PEDIDO_BIN = {
  MESA: 0,
  DELIVERY: 1
};

export const STATUS_BIN = {
  NAO_ENTREGUE: 0,
  ENTREGUE: 1
};

// Mapeamento de status texto para binário
const STATUS_TO_BIN = {
  'pendente': STATUS_BIN.NAO_ENTREGUE,
  'preparando': STATUS_BIN.NAO_ENTREGUE,
  'pronto': STATUS_BIN.NAO_ENTREGUE,
  'saiu_para_entrega': STATUS_BIN.NAO_ENTREGUE,
  'retirado': STATUS_BIN.NAO_ENTREGUE,
  'entregue': STATUS_BIN.ENTREGUE,
  'fechada': STATUS_BIN.ENTREGUE
};

export const useOrderStatus = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // ===== PREVENÇÃO · 80% =====
  const updateOrderStatus = useCallback(async (order, newStatus) => {
    // 1️⃣ Validação frontend antes de enviar
    const currentStatusBin = STATUS_TO_BIN[order.status_pedido];
    const tipoBin = order.tipo_pedido === 'mesa' ? TIPO_PEDIDO_BIN.MESA : TIPO_PEDIDO_BIN.DELIVERY;
    const newStatusBin = STATUS_TO_BIN[newStatus];

    console.log('[useOrderStatus] Validando:', {
      orderId: order.id,
      currentStatus: order.status_pedido,
      newStatus,
      currentStatusBin,
      newStatusBin,
      tipoBin
    });

    // Validar se pode fazer a transição
    if (currentStatusBin === STATUS_BIN.ENTREGUE) {
      toast({ 
        title: 'Status inválido', 
        description: 'Pedido já foi entregue/fechado',
        variant: 'destructive' 
      });
      return false;
    }

    if (tipoBin !== TIPO_PEDIDO_BIN.MESA && tipoBin !== TIPO_PEDIDO_BIN.DELIVERY) {
      toast({ 
        title: 'Tipo inválido', 
        description: 'Tipo de pedido não reconhecido',
        variant: 'destructive' 
      });
      return false;
    }

    setIsUpdating(true);

    try {
      // 3️⃣ Retry + timeout no fetch (implementado no orderService)
      await orderService.updateOrderStatus(order.id, newStatus);

      // 4️⃣ Log estruturado
      console.log(JSON.stringify({
        pedido: order.id,
        tipo: tipoBin,
        status: newStatusBin,
        evento: 'update+caixa',
        timestamp: new Date().toISOString()
      }));

      // Disparar evento para sincronização
      window.dispatchEvent(new CustomEvent('orderStatusChanged', {
        detail: { 
          orderId: order.id, 
          newStatus,
          statusBin: newStatusBin,
          tipoBin
        }
      }));

      // Se marcando como entregue/fechada, sincronizar caixa e dashboard
      if (newStatusBin === STATUS_BIN.ENTREGUE) {
        await syncCaixaEDashboard();
      }

      toast({ 
        title: 'Sucesso!', 
        description: `Pedido marcado como ${newStatus}` 
      });

      return true;

    } catch (error) {
      console.error('[useOrderStatus] Erro:', error);
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  // ===== INSTRUÇÃO · 20% =====
  // Sincronizar caixa e dashboard após mudanças
  const syncCaixaEDashboard = useCallback(async () => {
    console.log('[useOrderStatus] Sincronizando caixa e dashboard...');
    
    // Disparar eventos para atualizar componentes
    const events = [
      'cashUpdated',
      'dashboardRefresh',
      'orderDelivered',
      'mesasClosed'
    ];

    events.forEach(event => {
      window.dispatchEvent(new CustomEvent(event, {
        detail: { timestamp: Date.now() }
      }));
    });

    // Aguardar um pouco para garantir que os componentes processaram
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  return {
    updateOrderStatus,
    syncCaixaEDashboard,
    isUpdating,
    TIPO_PEDIDO_BIN,
    STATUS_BIN
  };
};