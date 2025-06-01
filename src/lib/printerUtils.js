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

    // Separar itens por categoria
    const pizzas = [];
    const bordas = [];
    const bebidas = [];
    const outros = [];

    // Processar itens do pedido
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        if (item.itemType === 'pizza') {
          pizzas.push(item);
          
          // Se a pizza tem borda, adicionar à lista de bordas
          if (item.border && item.border !== 'none' && item.borderPrice > 0) {
            bordas.push({
              ...item,
              borderName: item.border === 'salgada' ? 'Borda Salgada' : 
                         item.border === 'doce' ? 'Borda Doce' : item.border,
              borderPrice: item.borderPrice
            });
          }
        } else if (item.category === 'bebida' || item.productName?.toLowerCase().includes('refrigerante') || item.productName?.toLowerCase().includes('coca')) {
          bebidas.push(item);
        } else {
          outros.push(item);
        }
      });

      // Imprimir Pizzas
      if (pizzas.length > 0) {
        ticketContent += `🍕 PIZZAS:\n`;
        pizzas.forEach((item) => {
          const itemName = `${item.flavor} (${item.sizeName || item.size})`;
          const line = `${item.quantity}x ${itemName}`;
          const price = formatCurrency(item.totalPrice);
          ticketContent += `${line}\n   Unit.: ${formatCurrency(item.unitPrice)}  Total: ${price}\n`;
        });
        ticketContent += `\n`;
      }

      // Imprimir Bordas separadamente
      if (bordas.length > 0) {
        ticketContent += `🧀 BORDAS RECHEADAS:\n`;
        bordas.forEach((item) => {
          const borderTotal = item.quantity * item.borderPrice;
          ticketContent += `${item.quantity}x ${item.borderName}\n`;
          ticketContent += `   Unit.: ${formatCurrency(item.borderPrice)}  Total: ${formatCurrency(borderTotal)}\n`;
        });
        ticketContent += `\n`;
      }

      // Imprimir Bebidas
      if (bebidas.length > 0) {
        ticketContent += `🥤 BEBIDAS:\n`;
        bebidas.forEach((item) => {
          const line = `${item.quantity}x ${item.productName}`;
          const price = formatCurrency(item.totalPrice);
          ticketContent += `${line}\n   Unit.: ${formatCurrency(item.unitPrice)}  Total: ${price}\n`;
        });
        ticketContent += `\n`;
      }

      // Imprimir Outros itens
      if (outros.length > 0) {
        ticketContent += `📦 OUTROS ITENS:\n`;
        outros.forEach((item) => {
          const line = `${item.quantity}x ${item.productName}`;
          const price = formatCurrency(item.totalPrice);
          ticketContent += `${line}\n   Unit.: ${formatCurrency(item.unitPrice)}  Total: ${price}\n`;
        });
        ticketContent += `\n`;
      }
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

    if (order.taxa_entrega > 0) {
      ticketContent += `TAXA DE ENTREGA: ${formatCurrency(order.taxa_entrega)}\n`;
    }

    ticketContent += `
TOTAL A PAGAR: ${formatCurrency(order.totalValue || order.total)}
------------------------------
`;

    // Seção de pagamento - múltiplos ou único
    if (order.multiplos_pagamentos && order.pagamentos && order.pagamentos.length > 0) {
      ticketContent += `FORMAS DE PAGAMENTO:\n`;
      
      order.pagamentos.forEach((pagamento, index) => {
        const valor = parseFloat(pagamento.valor || 0);
        if (valor > 0) {
          const metodoPagamento = pagamento.forma_pagamento === 'dinheiro' ? 'DINHEIRO' :
                                 pagamento.forma_pagamento === 'cartao' ? 'CARTÃO' :
                                 pagamento.forma_pagamento === 'pix' ? 'PIX' :
                                 pagamento.forma_pagamento.toUpperCase();
          
          ticketContent += `${index + 1}. ${metodoPagamento}: ${formatCurrency(valor)}`;
          
          if (pagamento.observacoes) {
            ticketContent += ` (${pagamento.observacoes})`;
          }
          ticketContent += `\n`;
        }
      });
      
      // Calcular total pago
      const totalPago = order.pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
      ticketContent += `TOTAL PAGO: ${formatCurrency(totalPago)}\n`;
      
      // Verificar se há troco (apenas se houver pagamento em dinheiro)
      const pagamentoDinheiro = order.pagamentos.find(p => p.forma_pagamento === 'dinheiro');
      if (pagamentoDinheiro && totalPago > (order.totalValue || order.total)) {
        const troco = totalPago - (order.totalValue || order.total);
        ticketContent += `TROCO: ${formatCurrency(troco)}\n`;
      }
    } else {
      // Pagamento único (modo tradicional)
      ticketContent += `FORMA DE PAGAMENTO: ${order.paymentMethodName || 'N/A'}\n`;
      
      if (order.amountPaid > 0) {
        ticketContent += `VALOR PAGO: ${formatCurrency(order.amountPaid)}\n`;
        if (order.calculatedChange > 0) {
          ticketContent += `TROCO: ${formatCurrency(order.calculatedChange)}\n`;
        }
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