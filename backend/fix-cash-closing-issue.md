# 🔧 CORREÇÃO DO PROBLEMA DE FECHAMENTO DE CAIXA

## DIAGNÓSTICO DO PROBLEMA

O dashboard está mostrando R$ 0,00 e 0 pedidos entregues porque:

### 1. **Problema de Timezone/Data**
- O frontend pode estar enviando a data em um timezone diferente do backend
- A comparação de datas no PostgreSQL pode estar falhando

### 2. **Campo data_pedido vs created_at**
- Alguns pedidos podem ter `data_pedido` NULL
- A query está usando COALESCE mas pode haver inconsistência

### 3. **Status do Pedido**
- Verificar se os pedidos estão realmente com status 'entregue' (minúsculo)
- Pode haver pedidos com status 'Entregue' (maiúsculo) ou 'ENTREGUE'

## SOLUÇÕES RECOMENDADAS

### Solução 1: Ajustar Query no Backend

```javascript
// Em backend/routes/orders.js
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const { data_inicio, data_fim, status } = req.query;
    
    let query = 'SELECT * FROM pedidos WHERE 1=1';
    const params = [];
    
    if (data_inicio && data_fim) {
      // Usar timezone do servidor e garantir comparação correta
      params.push(data_inicio, data_fim);
      query += ` AND DATE(COALESCE(data_pedido, created_at)) >= DATE($${params.length - 1})`;
      query += ` AND DATE(COALESCE(data_pedido, created_at)) <= DATE($${params.length})`;
    }
    
    if (status) {
      params.push(status.toLowerCase());
      query += ` AND LOWER(status_pedido) = LOWER($${params.length})`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    console.log('[DEBUG] Query:', query);
    console.log('[DEBUG] Params:', params);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Solução 2: Atualizar OrderService no Frontend

```javascript
// Em src/services/orderService.js
getAllOrders: async (filters = {}) => {
  try {
    // Log para debug
    console.log('[OrderService] Buscando pedidos com filtros:', filters);
    
    const params = new URLSearchParams();
    
    if (filters.data_inicio) {
      // Garantir formato correto da data
      const startDate = new Date(filters.data_inicio);
      params.append('data_inicio', startDate.toISOString().split('T')[0]);
    }
    
    if (filters.data_fim) {
      const endDate = new Date(filters.data_fim);
      params.append('data_fim', endDate.toISOString().split('T')[0]);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    const response = await apiClient.get(`/orders?${params.toString()}`);
    console.log('[OrderService] Pedidos recebidos:', response.data?.length || 0);
    
    return response.data;
  } catch (error) {
    console.error('[OrderService] Erro:', error);
    throw error;
  }
}
```

### Solução 3: Script SQL para Normalizar Dados

```sql
-- Normalizar status dos pedidos
UPDATE pedidos 
SET status_pedido = LOWER(status_pedido)
WHERE status_pedido != LOWER(status_pedido);

-- Preencher data_pedido onde está NULL
UPDATE pedidos 
SET data_pedido = created_at
WHERE data_pedido IS NULL;

-- Verificar pedidos de hoje
SELECT 
  COUNT(*) as total,
  status_pedido,
  DATE(COALESCE(data_pedido, created_at)) as data
FROM pedidos
WHERE DATE(COALESCE(data_pedido, created_at)) = CURRENT_DATE
GROUP BY status_pedido, DATE(COALESCE(data_pedido, created_at));
```

### Solução 4: Adicionar Listener para Atualização em Tempo Real

```javascript
// Em CashClosingPage.jsx
useEffect(() => {
  const handleOrderStatusChanged = () => {
    console.log('[CashClosing] Status do pedido mudou, atualizando...');
    fetchAndSetDailyData(filterDate);
  };
  
  window.addEventListener('orderStatusChanged', handleOrderStatusChanged);
  
  return () => {
    window.removeEventListener('orderStatusChanged', handleOrderStatusChanged);
  };
}, [filterDate, fetchAndSetDailyData]);
```

### Solução 5: Adicionar Taxa de Entrega ao Fechamento

```javascript
// Atualizar calculateDailySummary para incluir taxas de entrega
const calculateDailySummary = (orders, transactions) => {
  // ... código existente ...
  
  // Calcular total de taxas de entrega
  const totalDeliveryFees = orders.reduce((sum, order) => {
    return sum + (parseFloat(order.taxa_entrega) || 0);
  }, 0);
  
  // Incluir no cálculo do total
  const netRevenue = totalSales + totalExtraRevenues + totalDeliveryFees - totalExpenses;
  
  return {
    // ... outros campos ...
    totalDeliveryFees,
    netRevenue
  };
};
```

## TESTE RÁPIDO

Execute este comando SQL para verificar se há pedidos:

```sql
SELECT 
  COUNT(*) as total_pedidos,
  SUM(total) as total_vendas,
  status_pedido
FROM pedidos
WHERE DATE(COALESCE(data_pedido, created_at)) = '2025-01-06'
GROUP BY status_pedido;
```

Se retornar pedidos mas o dashboard continuar em zero, o problema está na comunicação frontend/backend. 