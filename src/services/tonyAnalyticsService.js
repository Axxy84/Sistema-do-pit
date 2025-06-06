import apiClient from '@/lib/apiClient';

export const tonyAnalyticsService = {
  // Buscar analytics completos do dia
  async getTodayAnalytics(date = new Date().toISOString().split('T')[0]) {
    try {
      const [ordersResponse, deliverersResponse, dashboardResponse] = await Promise.all([
        // Pedidos do dia
        apiClient.get('/orders', {
          params: {
            data_inicio: date,
            data_fim: date
          }
        }),
        // Entregadores ativos
        apiClient.get('/deliverers/active'),
        // Dados consolidados
        apiClient.get('/dashboard/fechamento-consolidado', {
          params: {
            data_inicio: date,
            data_fim: date
          }
        })
      ]);

      const orders = ordersResponse.data.orders || [];
      const deliverers = deliverersResponse.data.deliverers || [];
      const consolidated = dashboardResponse.data;

      return {
        orders,
        deliverers,
        consolidated,
        analytics: this.calculateAnalytics(orders, deliverers, consolidated)
      };
    } catch (error) {
      console.error('Erro ao buscar analytics do Tony:', error);
      throw error;
    }
  },

  // Calcular métricas analíticas
  calculateAnalytics(orders, deliverers, consolidated) {
    const deliveredOrders = orders.filter(order => order.status_pedido === 'entregue');
    const pendingOrders = orders.filter(order => 
      !['entregue', 'cancelado', 'fechado'].includes(order.status_pedido)
    );
    const delayedOrders = orders.filter(order => {
      if (!order.created_at) return false;
      const orderTime = new Date(order.created_at);
      const now = new Date();
      const diffMinutes = (now - orderTime) / (1000 * 60);
      return diffMinutes > 60 && !['entregue', 'cancelado'].includes(order.status_pedido);
    });

    // Total de vendas
    const totalSales = consolidated?.totais_gerais?.vendas_brutas || 0;

    // Produtos mais vendidos
    const productSales = {};
    deliveredOrders.forEach(order => {
      if (order.itens_pedido) {
        order.itens_pedido.forEach(item => {
          const productName = item.sabor_registrado || item.produto_nome || 'Produto';
          productSales[productName] = (productSales[productName] || 0) + (item.quantidade || 1);
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // Horário com mais pedidos
    const hourlyOrders = {};
    deliveredOrders.forEach(order => {
      if (order.created_at) {
        const hour = new Date(order.created_at).getHours();
        hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
      }
    });

    const peakHour = Object.entries(hourlyOrders)
      .sort(([,a], [,b]) => b - a)[0];

    // Ticket médio
    const averageTicket = deliveredOrders.length > 0 
      ? totalSales / deliveredOrders.length 
      : 0;

    // Pedidos por tipo
    const ordersByType = {
      mesa: consolidated?.vendas_por_tipo?.mesa?.total_pedidos || 0,
      delivery: consolidated?.vendas_por_tipo?.delivery?.total_pedidos || 0,
      balcao: orders.filter(o => o.tipo_pedido === 'balcao' && o.status_pedido === 'entregue').length
    };

    // Ranking de entregadores
    const delivererStats = {};
    deliveredOrders.forEach(order => {
      if (order.entregador_nome && order.tipo_pedido === 'delivery') {
        if (!delivererStats[order.entregador_nome]) {
          delivererStats[order.entregador_nome] = {
            name: order.entregador_nome,
            deliveries: 0,
            totalValue: 0
          };
        }
        delivererStats[order.entregador_nome].deliveries += 1;
        delivererStats[order.entregador_nome].totalValue += parseFloat(order.total || 0);
      }
    });

    const delivererRanking = Object.values(delivererStats)
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);

    return {
      totalSales,
      topProducts,
      peakHour: peakHour ? {
        hour: parseInt(peakHour[0]),
        count: peakHour[1],
        formatted: `${peakHour[0].padStart(2, '0')}:00`
      } : null,
      averageTicket,
      ordersByType,
      deliveredOrdersCount: deliveredOrders.length,
      pendingOrdersCount: pendingOrders.length,
      delayedOrdersCount: delayedOrders.length,
      delivererRanking
    };
  },

  // Gerar frases automáticas baseadas nos dados
  generateInsights(analytics) {
    const insights = [];

    if (analytics.totalSales > 1000) {
      insights.push(`🎉 Excelente! Já vendemos R$ ${analytics.totalSales.toFixed(2)} hoje!`);
    } else if (analytics.totalSales > 500) {
      insights.push(`📈 Bom trabalho! R$ ${analytics.totalSales.toFixed(2)} em vendas até agora.`);
    } else {
      insights.push(`🌱 Vamos lá! R$ ${analytics.totalSales.toFixed(2)} no início do dia.`);
    }

    if (analytics.topProducts.length > 0) {
      insights.push(`🍕 A pizza mais pedida hoje é: ${analytics.topProducts[0].name} (${analytics.topProducts[0].quantity} unidades)`);
    }

    if (analytics.peakHour) {
      insights.push(`⏰ Horário de pico: ${analytics.peakHour.formatted} com ${analytics.peakHour.count} pedidos`);
    }

    if (analytics.delayedOrdersCount > 0) {
      insights.push(`⚠️ Atenção: ${analytics.delayedOrdersCount} pedidos estão atrasados`);
    } else {
      insights.push(`✅ Ótimo! Nenhum pedido atrasado no momento`);
    }

    if (analytics.delivererRanking.length > 0) {
      insights.push(`🏆 Entregador destaque: ${analytics.delivererRanking[0].name} com ${analytics.delivererRanking[0].deliveries} entregas`);
    }

    return insights;
  }
};