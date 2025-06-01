import { formatCurrency } from '@/lib/utils';
import { PIZZA_SIZES } from '@/lib/constants';

export const formatOrderTicketForPrint = (order, allProductsData) => {
  try {
    // Versão simplificada para teste - descomente para usar
    /*
    return `
PIT STOP PIZZARIA
------------------
PEDIDO: #${order.id?.slice(-5) || 'N/A'}
CLIENTE: ${order.customerName || 'N/A'}
TOTAL: R$ ${order.totalValue?.toFixed(2) || '0.00'}
------------------
TESTE DE IMPRESSÃO SIMPLIFICADA
    `.trim();
    */
    
    // Versão completa original
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0);
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    };

    let ticketContent = `
PIT STOP PIZZARIA
------------------------------
PEDIDO: #${order.id?.slice(-5).toUpperCase() || 'N/A'}
DATA: ${formatDateTime(order.orderDate || order.createdAt)}
CLIENTE: ${order.customerName || 'N/A'}
TELEFONE: ${order.customerPhone || 'N/A'}
ENDEREÇO: ${order.customerAddress || 'Rua casa'}
------------------------------
ITENS DO PEDIDO:

`;

    // Processar itens do pedido
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const itemName = item.itemType === 'pizza' 
          ? `${item.flavor} (${item.sizeName || item.size})` 
          : item.productName;
        const line = `${item.quantity}x ${itemName}`;
        const price = formatCurrency(item.totalPrice);
        ticketContent += `${line}\n   Unit.: ${formatCurrency(item.unitPrice)}  Total: ${price}\n`;
      });
    } else {
      ticketContent += 'Nenhum item no pedido\n';
    }

    ticketContent += `
------------------------------
SUBTOTAL: ${formatCurrency(order.subtotal || order.totalValue)}
`;

    if (order.desconto_aplicado > 0) {
      ticketContent += `DESCONTO: -${formatCurrency(order.desconto_aplicado)}\n`;
      if (order.cupom_codigo) {
        ticketContent += `CUPOM: ${order.cupom_codigo}\n`;
      }
    }

    ticketContent += `
TOTAL A PAGAR: ${formatCurrency(order.totalValue)}
------------------------------
FORMA DE PAGAMENTO: ${order.paymentMethodName || 'N/A'}
`;

    if (order.amountPaid > 0) {
      ticketContent += `VALOR PAGO: ${formatCurrency(order.amountPaid)}\n`;
      if (order.calculatedChange > 0) {
        ticketContent += `TROCO: ${formatCurrency(order.calculatedChange)}\n`;
      }
    }

    ticketContent += `
------------------------------
ENTREGADOR: ${order.delivererName || 'Não atribuído'}
`;

    if (order.observacoes) {
      ticketContent += `OBSERVAÇÕES: ${order.observacoes}\n`;
    }

    ticketContent += `------------------------------
OBRIGADO PELA PREFERÊNCIA!
`;

    return ticketContent;
    
  } catch (error) {
    console.error('[PRINT-FORMAT] Erro na formatação:', error);
    throw error;
  }
};

// Função de teste simplificada
export const testSimplePrint = () => {
  console.log('[TEST-PRINT] Testando impressão simples');
  const testWindow = window.open('', '_blank', 'width=300,height=200');
  if (testWindow) {
    testWindow.document.write('<h1>TESTE</h1><p>Se você vê isso, a impressão básica funciona!</p>');
    testWindow.document.close();
    testWindow.print();
  } else {
    console.error('[TEST-PRINT] Não foi possível abrir janela de teste');
  }
};