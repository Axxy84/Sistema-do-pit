import { formatCurrency } from '@/lib/utils';
import { PIZZA_SIZES } from '@/lib/constants';

export const formatOrderTicketForPrint = (order, allProductsData) => {
  if (!order) return "Dados do pedido inválidos.";

  const header = `
    PIT STOP PIZZARIA
    ------------------------------
    PEDIDO: #${order.id ? order.id.slice(-5).toUpperCase() : 'N/A'}
    DATA: ${order.orderDate ? new Date(order.orderDate).toLocaleString() : (order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A')}
    CLIENTE: ${order.customerName || 'N/A'}
    TELEFONE: ${order.customerPhone || 'N/A'}
    ENDEREÇO: ${order.customerAddress || 'N/A'}
    ------------------------------
    ITENS DO PEDIDO:
  `;

  let itemsDetails = "";
  let calculatedTotal = 0;

  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      const itemName = item.itemType === 'pizza' ? 
        `${item.flavor || 'Pizza'} (${item.sizeName || item.size || 'Tamanho não especificado'})` :
        (item.productName || item.flavor || 'Produto');
      
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemQuantity = parseInt(item.quantity, 10) || 0;
      const itemTotal = itemPrice * itemQuantity;
      calculatedTotal += itemTotal;

      itemsDetails += `
    ${itemQuantity}x ${itemName}
        Unit.: ${formatCurrency(itemPrice)}  Total: ${formatCurrency(itemTotal)}
      `;
    });
  } else {
    itemsDetails = "\n    Nenhum item encontrado no pedido.\n";
  }

  const subtotal = calculatedTotal;
  const discount = parseFloat(order.desconto_aplicado) || 0;
  const pointsDiscountValue = (parseFloat(order.pontos_resgatados) || 0) * 0.5; // Assuming 1 point = R$0.50
  const totalDiscount = discount + pointsDiscountValue;
  const finalTotal = subtotal - totalDiscount;

  const paymentInfo = `
    ------------------------------
    SUBTOTAL: ${formatCurrency(subtotal)}
    ${order.cupom_codigo ? `CUPOM (${order.cupom_codigo}): -${formatCurrency(discount)}` : ''}
    ${order.pontos_resgatados ? `PONTOS (${order.pontos_resgatados}pts): -${formatCurrency(pointsDiscountValue)}` : ''}
    ${totalDiscount > 0 ? `TOTAL DESCONTOS: -${formatCurrency(totalDiscount)}` : ''}
    TOTAL A PAGAR: ${formatCurrency(finalTotal)}
    ------------------------------
    FORMA DE PAGAMENTO: ${order.paymentMethodName || order.paymentMethod || 'Não informada'}
    ${order.paymentMethod === 'dinheiro' && order.amountPaid ? `VALOR PAGO: ${formatCurrency(order.amountPaid)}` : ''}
    ${order.paymentMethod === 'dinheiro' && order.calculatedChange ? `TROCO: ${formatCurrency(order.calculatedChange)}` : ''}
    ------------------------------
    ENTREGADOR: ${order.delivererName || 'Não atribuído'} ${order.delivererPhone ? `(${order.delivererPhone})` : ''}
    OBSERVAÇÕES: ${order.observacoes || 'Nenhuma'}
    ------------------------------
    OBRIGADO PELA PREFERÊNCIA!
  `;

  return header + itemsDetails + paymentInfo;
};