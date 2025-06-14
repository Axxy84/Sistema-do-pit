import { formatCurrency } from '@/lib/utils';
import { PIZZA_SIZES } from '@/lib/constants';

export const formatOrderTicketForPrint = (order, allProductsData) => {
  try {
    // Versão simplificada para teste - descomente para usar
    /*
    return `
PIT STOP PIZZARIA
------------------
PEDIDO: #${String(order.id || '').slice(-5).toUpperCase() || 'N/A'}
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
PEDIDO: #${String(order.id || '').slice(-5).toUpperCase() || 'N/A'}
DATA: ${formatDateTime(order.orderDate || order.createdAt)}
CLIENTE: ${order.customerName || 'N/A'}
TELEFONE: ${order.customerPhone || 'N/A'}${order.tipo_pedido === 'mesa' ? `
MESA: ${order.numero_mesa || 'N/A'}` : `
ENDEREÇO: ${order.customerAddress || 'Rua casa'}`}
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

    // Só mostrar entregador se for pedido delivery
    if (order.tipo_pedido !== 'mesa') {
      ticketContent += `
------------------------------
ENTREGADOR: ${order.delivererName || 'Não atribuído'}
`;
    } else {
      ticketContent += `
------------------------------`;
    }

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

export const formatDeliveryTicketForPrint = (order, allProductsData) => {
  try {
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
CUPOM PARA ENTREGADOR
==============================
PEDIDO: #${String(order.id || '').slice(-5).toUpperCase() || 'N/A'}
DATA: ${formatDateTime(order.orderDate || order.createdAt)}
==============================

📋 DADOS DO CLIENTE:
Nome: ${order.customerName || 'N/A'}
Telefone: ${order.customerPhone || 'N/A'}

🏠 ENDEREÇO DE ENTREGA:
${order.customerAddress || 'N/A'}

==============================
📦 ITENS PARA ENTREGA:

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
          ticketContent += `• ${item.quantity}x ${itemName}\n`;
        });
        ticketContent += `\n`;
      }

      // Imprimir Bordas separadamente
      if (bordas.length > 0) {
        ticketContent += `🧀 BORDAS RECHEADAS:\n`;
        bordas.forEach((item) => {
          ticketContent += `• ${item.quantity}x ${item.borderName}\n`;
        });
        ticketContent += `\n`;
      }

      // Imprimir Bebidas
      if (bebidas.length > 0) {
        ticketContent += `🥤 BEBIDAS:\n`;
        bebidas.forEach((item) => {
          ticketContent += `• ${item.quantity}x ${item.productName}\n`;
        });
        ticketContent += `\n`;
      }

      // Imprimir Outros itens
      if (outros.length > 0) {
        ticketContent += `📦 OUTROS ITENS:\n`;
        outros.forEach((item) => {
          ticketContent += `• ${item.quantity}x ${item.productName}\n`;
        });
        ticketContent += `\n`;
      }
    } else {
      ticketContent += 'Nenhum item no pedido\n\n';
    }

    ticketContent += `==============================
💰 INFORMAÇÕES DE PAGAMENTO:

TOTAL A COBRAR: ${formatCurrency(order.totalValue || order.total)}
`;

    // Taxa de entrega
    if (order.taxa_entrega > 0) {
      ticketContent += `(Inclui taxa de entrega: ${formatCurrency(order.taxa_entrega)})\n`;
    }

    // Informações de pagamento
    if (order.multiplos_pagamentos && order.pagamentos && order.pagamentos.length > 0) {
      ticketContent += `\nFORMAS DE PAGAMENTO:\n`;
      
      order.pagamentos.forEach((pagamento, index) => {
        const valor = parseFloat(pagamento.valor || 0);
        if (valor > 0) {
          const metodoPagamento = pagamento.forma_pagamento === 'dinheiro' ? 'DINHEIRO' :
                                 pagamento.forma_pagamento === 'cartao' ? 'CARTÃO' :
                                 pagamento.forma_pagamento === 'pix' ? 'PIX' :
                                 pagamento.forma_pagamento.toUpperCase();
          
          ticketContent += `${index + 1}. ${metodoPagamento}: ${formatCurrency(valor)}\n`;
        }
      });
      
      // Verificar se há troco (apenas se houver pagamento em dinheiro)
      const pagamentoDinheiro = order.pagamentos.find(p => p.forma_pagamento === 'dinheiro');
      const totalPago = order.pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
      
      if (pagamentoDinheiro && totalPago > (order.totalValue || order.total)) {
        const troco = totalPago - (order.totalValue || order.total);
        ticketContent += `\n💸 TROCO A DAR: ${formatCurrency(troco)}\n`;
        ticketContent += `💵 Cliente pagou: ${formatCurrency(totalPago)}\n`;
      } else if (pagamentoDinheiro) {
        ticketContent += `\n✅ NÃO PRECISA DE TROCO\n`;
      }
    } else {
      // Pagamento único
      const metodoPagamento = order.paymentMethodName?.toUpperCase() || 'N/A';
      ticketContent += `FORMA DE PAGAMENTO: ${metodoPagamento}\n`;
      
      if (order.paymentMethod === 'dinheiro' || metodoPagamento.includes('DINHEIRO')) {
        if (order.amountPaid > 0) {
          ticketContent += `💵 Cliente pagou: ${formatCurrency(order.amountPaid)}\n`;
          if (order.calculatedChange > 0) {
            ticketContent += `💸 TROCO A DAR: ${formatCurrency(order.calculatedChange)}\n`;
          } else {
            ticketContent += `✅ NÃO PRECISA DE TROCO\n`;
          }
        } else {
          ticketContent += `⚠️  CONFIRMAR VALOR PAGO\n`;
        }
      } else {
        ticketContent += `✅ PAGAMENTO JÁ REALIZADO\n`;
      }
    }

    // Observações importantes
    if (order.observacoes) {
      ticketContent += `\n📝 OBSERVAÇÕES:\n${order.observacoes}\n`;
    }

    ticketContent += `
==============================
⏰ ENTREGUE COM CUIDADO!

Status: SAIU PARA ENTREGA
Entregador: ${order.delivererName || order.entregador_nome || 'N/A'}
==============================
`;

    return ticketContent;
    
  } catch (error) {
    console.error('[DELIVERY-PRINT-FORMAT] Erro na formatação:', error);
    throw error;
  }
};

export const formatKitchenTicketForPrint = (order, allProductsData, selectedPriority = null) => {
  try {
    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    };

    let ticketContent = `
PIT STOP PIZZARIA - PEDIDO PARA PREPARO
========================================
CLIENTE: ${order.customerName || 'N/A'}
DATA: ${formatDateTime(order.orderDate || order.createdAt)}
========================================

`;

    // Separar itens por categoria para preparo
    const pizzas = [];
    const bordas = [];
    const outros = [];

    // Processar apenas itens que precisam de preparo (não incluir bebidas)
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        if (item.itemType === 'pizza') {
          pizzas.push(item);
          
          // Se a pizza tem borda, adicionar à lista de bordas
          if (item.border && item.border !== 'none' && item.borderPrice > 0) {
            bordas.push({
              ...item,
              borderName: item.border === 'salgada' ? 'Salty' : 
                         item.border === 'doce' ? 'Doce' : item.border,
              borderPrice: item.borderPrice
            });
          }
        } else if (item.category !== 'bebida' && 
                   !item.productName?.toLowerCase().includes('refrigerante') && 
                   !item.productName?.toLowerCase().includes('coca')) {
          // Incluir apenas itens que precisam de preparo (não bebidas)
          outros.push(item);
        }
      });

      // Imprimir Pizzas
      if (pizzas.length > 0) {
        ticketContent += `🍕 PIZZAS:\n`;
        pizzas.forEach((item) => {
          // Converter tamanho para letra
          const sizeMap = {
            'pequena': 'P',
            'pequeno': 'P',
            'small': 'P',
            'media': 'M',
            'médio': 'M',
            'medio': 'M',
            'medium': 'M',
            'grande': 'G',
            'large': 'G',
            'familia': 'F',
            'família': 'F',
            'family': 'F',
            'gigante': 'F'
          };
          
          const sizeLetter = sizeMap[item.sizeName?.toLowerCase()] || 
                           sizeMap[item.size?.toLowerCase()] || 
                           item.sizeName || item.size || 'M';
          
          const itemName = `${sizeLetter} ${item.flavor}`;
          ticketContent += `${item.quantity}x ${itemName}\n`;
          
          // Verificar se há observações específicas para a pizza
          if (item.observacoes) {
            ticketContent += `OBSERVAÇÕES: ${item.observacoes}\n`;
          }
        });
        ticketContent += `\n`;
      }

      // Imprimir Bordas separadamente
      if (bordas.length > 0) {
        ticketContent += `🧀 BORDA RECHEADA:\n`;
        bordas.forEach((item) => {
          ticketContent += `${item.quantity}x ${item.borderName}\n`;
          
          // Observações específicas da borda
          if (item.borderObservacoes) {
            ticketContent += `OBSERVAÇÕES: ${item.borderObservacoes}\n`;
          }
        });
        ticketContent += `\n`;
      }

      // Imprimir outros itens que precisam de preparo
      if (outros.length > 0) {
        ticketContent += `📦 OUTROS ITENS:\n`;
        outros.forEach((item) => {
          ticketContent += `${item.quantity}x ${item.productName}\n`;
          
          if (item.observacoes) {
            ticketContent += `OBSERVAÇÕES: ${item.observacoes}\n`;
          }
        });
        ticketContent += `\n`;
      }
    } else {
      ticketContent += 'Nenhum item para preparo\n\n';
    }

    // Observações gerais do pedido (importantes para a cozinha)
    if (order.observacoes) {
      ticketContent += `📝 OBSERVAÇÕES GERAIS:\n${order.observacoes}\n\n`;
    }

    // Determinar prioridade do pedido
    const getPriorityText = (order, selectedPriority) => {
      // Se uma prioridade foi selecionada manualmente, usar ela
      if (selectedPriority) {
        const priorityMap = {
          'normal': '🚚 PEDIDO DELIVERY',
          'balcao': '🏪 PEDIDO BALCÃO',
          'urgente': '⚡ PEDIDO URGENTE',
          'atrasado': '🚨 PEDIDO ATRASADO'
        };
        return priorityMap[selectedPriority] || '🚚 PEDIDO DELIVERY';
      }
      
      // Caso contrário, usar lógica automática
      // Verificar se é pedido de balcão (mesa)
      if (order.tipo_pedido === 'mesa') {
        return '🏪 PEDIDO BALCÃO';
      }
      
      // Verificar se está atrasado (mais de 30 min)
      const orderTime = new Date(order.orderDate || order.createdAt);
      const currentTime = new Date();
      const diffMinutes = (currentTime - orderTime) / (1000 * 60);
      
      if (diffMinutes > 30) {
        return '🚨 PEDIDO ATRASADO';
      }
      
      // Verificar se tem observações que indicam urgência
      const urgentKeywords = ['urgente', 'rápido', 'pressa', 'emergência'];
      const hasUrgentNote = order.observacoes?.toLowerCase().includes('urgente') || 
                           urgentKeywords.some(keyword => 
                             order.observacoes?.toLowerCase().includes(keyword)
                           );
      
      if (hasUrgentNote) {
        return '⚡ PEDIDO URGENTE';
      }
      
      // Pedido normal de delivery
      return '🚚 PEDIDO DELIVERY';
    };

    const priorityText = getPriorityText(order, selectedPriority);
    
    ticketContent += `========================================
${priorityText}
========================================
`;

    return ticketContent;
    
  } catch (error) {
    console.error('[KITCHEN-PRINT-FORMAT] Erro na formatação:', error);
    throw error;
  }
};

export const formatTableClosingTicketForPrint = (mesa, pixConfig) => {
  try {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0);
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return new Date().toLocaleString('pt-BR');
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Cabeçalho simplificado
    let ticketContent = `PIT STOP PIZZARIA
==============================
Mesa: ${mesa.numero_mesa}
Data: ${formatDateTime(mesa.data_fechamento || new Date())}
`;

    // Cliente (apenas nome)
    if (mesa.cliente_nome || mesa.cliente?.nome) {
      ticketContent += `Cliente: ${mesa.cliente_nome || mesa.cliente.nome}\n`;
    }
    ticketContent += `==============================\n`;

    // Itens consumidos (formato simples)
    if (mesa.itens && mesa.itens.length > 0) {
      ticketContent += `ITENS CONSUMIDOS:\n\n`;
      
      mesa.itens.forEach((item) => {
        const quantidade = parseInt(item.quantidade) || 1;
        const nome = item.sabor_registrado || item.produto_nome || 'Item';
        const tamanho = item.tamanho_registrado ? ` (${item.tamanho_registrado})` : '';
        const valorUnit = parseFloat(item.valor_unitario || 0);
        const valorTotal = valorUnit * quantidade;
        
        // Formato compacto: quantidade, nome, valor unitário e total
        ticketContent += `${quantidade}x ${nome}${tamanho}\n`;
        ticketContent += `   Unit: ${formatCurrency(valorUnit)} | Total: ${formatCurrency(valorTotal)}\n\n`;
      });
      
      ticketContent += `------------------------------\n`;
      
      // Descontos se houver
      if (mesa.desconto_aplicado && mesa.desconto_aplicado > 0) {
        ticketContent += `Subtotal: ${formatCurrency((parseFloat(mesa.total) + parseFloat(mesa.desconto_aplicado)))}\n`;
        ticketContent += `Desconto: -${formatCurrency(mesa.desconto_aplicado)}\n`;
        ticketContent += `------------------------------\n`;
      }
      
      // Total destacado
      ticketContent += `TOTAL: ${formatCurrency(mesa.total)}\n`;
      ticketContent += `==============================\n`;
    }

    // Forma de pagamento escolhida (se já foi definida)
    if (mesa.forma_pagamento) {
      const formaPagamento = mesa.forma_pagamento === 'dinheiro' ? 'Dinheiro' :
                            mesa.forma_pagamento === 'cartao' ? 'Cartão' :
                            mesa.forma_pagamento === 'pix' ? 'PIX' :
                            mesa.forma_pagamento;
      
      ticketContent += `\nForma de Pagamento: ${formaPagamento}\n`;
      
      // Se for PIX, mostrar dados
      if (mesa.forma_pagamento === 'pix' && pixConfig?.pix_chave) {
        ticketContent += `\n------------------------------\n`;
        ticketContent += `PAGAMENTO PIX:\n`;
        ticketContent += `Chave: ${pixConfig.pix_chave}\n`;
        ticketContent += `Valor: ${formatCurrency(mesa.total)}\n`;
        ticketContent += `------------------------------\n`;
      }
    }

    // Mensagem de agradecimento
    ticketContent += `\n==============================\n`;
    ticketContent += `Obrigado pela preferência!\n`;
    ticketContent += `==============================\n`;

    return ticketContent;
    
  } catch (error) {
    console.error('[TABLE-CLOSING-PRINT] Erro na formatação:', error);
    throw error;
  }
};

// Função para gerar HTML do QR Code PIX para impressão
export const generatePixQrCodeHTML = (pixData, valor, mesa) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pagamento PIX - Mesa ${mesa}</title>
    <style>
        body { 
            font-family: monospace; 
            font-size: 12pt; 
            margin: 10px;
            text-align: center;
        }
        .header { 
            font-size: 14pt; 
            font-weight: bold; 
            margin-bottom: 20px;
        }
        .qr-container {
            margin: 20px 0;
            border: 2px solid #000;
            padding: 10px;
            display: inline-block;
        }
        .qr-code {
            width: 200px;
            height: 200px;
            margin: 10px auto;
            display: block;
        }
        .pix-info {
            margin: 15px 0;
            font-size: 11pt;
        }
        .instructions {
            margin-top: 20px;
            font-size: 10pt;
            text-align: left;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
        }
        .footer {
            margin-top: 30px;
            font-size: 10pt;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        🍕 PIT STOP PIZZARIA<br>
        PAGAMENTO PIX - MESA ${mesa}
    </div>
    
    <div class="qr-container">
        <div class="pix-info">
            <strong>💰 Valor a Pagar: R$ ${valor}</strong><br>
            Mesa: ${mesa}
        </div>
        
        ${pixData ? `<img src="${pixData}" alt="QR Code PIX" class="qr-code" />` : `<div class="qr-code" style="border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center;">QR CODE SERÁ INSERIDO AQUI</div>`}
        
        <div class="pix-info">
            📱 Escaneie com seu app do banco
        </div>
    </div>
    
    <div class="instructions">
        <strong>Instruções:</strong><br>
        1. Abra o app do seu banco<br>
        2. Escaneie o QR Code acima<br>
        3. Confirme o valor e efetue o pagamento<br>
        4. Apresente o comprovante ao garçom<br>
        5. Aguarde a confirmação do recebimento
    </div>
    
    <div class="footer">
        Após o pagamento, informe o garçom<br>
        para liberar a mesa.<br><br>
        <strong>Obrigado pela preferência!</strong>
    </div>
</body>
</html>`;
};