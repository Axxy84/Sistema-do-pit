import { apiClient } from '@/lib/apiClient';

export const profitCalculatorService = {
  // Calcular lucro/prejuízo diário
  async calculateDailyProfit(financialData) {
    try {
      const response = await apiClient.post('/profit-calculator', financialData);
      return response.data;
    } catch (error) {
      console.error('Erro ao calcular lucro/prejuízo:', error);
      throw new Error(error.response?.data?.error || 'Erro ao calcular lucro/prejuízo');
    }
  },

  // Buscar dados financeiros do dia e calcular lucro/prejuízo automaticamente
  async calculateTodayProfit(date = null) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      
      // Buscar dados financeiros necessários
      const [ordersResponse, expensesResponse] = await Promise.all([
        apiClient.get(`/orders?data_inicio=${today}&data_fim=${today}`),
        apiClient.get(`/expenses?data_inicio=${today}&data_fim=${today}`)
      ]);

      const orders = ordersResponse.data.orders || [];
      const expenses = expensesResponse.data.expenses || [];

      // Calcular vendas brutas do dia
      const vendas_brutas = orders
        .filter(order => order.status === 'entregue' || order.status === 'concluido')
        .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

      // Calcular taxas de entrega
      const taxas_entrega = orders
        .filter(order => order.tipo_pedido === 'delivery' && (order.status === 'entregue' || order.status === 'concluido'))
        .reduce((sum, order) => sum + parseFloat(order.taxa_entrega || 0), 0);

      // Calcular descontos aplicados
      const descontos = orders
        .filter(order => order.status === 'entregue' || order.status === 'concluido')
        .reduce((sum, order) => sum + parseFloat(order.desconto || 0), 0);

      // Separar despesas por tipo
      const despesas = expenses.filter(exp => exp.tipo === 'despesa');
      const receitas_extras = expenses
        .filter(exp => exp.tipo === 'receita')
        .reduce((sum, exp) => sum + parseFloat(exp.valor || 0), 0);

      const despesas_fixas = despesas
        .filter(exp => exp.categoria === 'fixa')
        .reduce((sum, exp) => sum + parseFloat(exp.valor || 0), 0);

      const despesas_extras = despesas
        .filter(exp => exp.categoria !== 'fixa')
        .reduce((sum, exp) => sum + parseFloat(exp.valor || 0), 0);

      // Calcular impostos (estimativa de 8% sobre vendas)
      const impostos = vendas_brutas * 0.08;

      const financialData = {
        vendas_brutas,
        descontos,
        impostos,
        taxas_entrega,
        receitas_extras,
        despesas_extras,
        despesas_fixas
      };

      // Calcular lucro/prejuízo
      const result = await this.calculateDailyProfit(financialData);
      
      return {
        ...result,
        input_data: financialData,
        date: today,
        orders_count: orders.length,
        expenses_count: expenses.length
      };

    } catch (error) {
      console.error('Erro ao calcular lucro do dia:', error);
      throw new Error('Erro ao calcular lucro do dia');
    }
  },

  // Calcular projeção mensal baseada na média diária
  async calculateMonthlyProjection(days = 30) {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      // Buscar dados dos últimos N dias
      const [ordersResponse, expensesResponse] = await Promise.all([
        apiClient.get(`/orders?data_inicio=${startDateStr}&data_fim=${endDateStr}`),
        apiClient.get(`/expenses?data_inicio=${startDateStr}&data_fim=${endDateStr}`)
      ]);

      const orders = ordersResponse.data.orders || [];
      const expenses = expensesResponse.data.expenses || [];

      // Calcular média diária
      const totalDays = days;
      const vendas_media = orders
        .filter(order => order.status === 'entregue' || order.status === 'concluido')
        .reduce((sum, order) => sum + parseFloat(order.total || 0), 0) / totalDays;

      const despesas_media = expenses
        .filter(exp => exp.tipo === 'despesa')
        .reduce((sum, exp) => sum + parseFloat(exp.valor || 0), 0) / totalDays;

      // Projetar para 30 dias
      const vendas_projetadas = vendas_media * 30;
      const despesas_projetadas = despesas_media * 30;
      const lucro_projetado = vendas_projetadas - despesas_projetadas;

      return {
        vendas_media_diaria: vendas_media,
        despesas_media_diaria: despesas_media,
        vendas_projetadas_mes: vendas_projetadas,
        despesas_projetadas_mes: despesas_projetadas,
        lucro_projetado_mes: lucro_projetado,
        periodo_analise: `${totalDays} dias`,
        data_calculo: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao calcular projeção mensal:', error);
      throw new Error('Erro ao calcular projeção mensal');
    }
  }
};