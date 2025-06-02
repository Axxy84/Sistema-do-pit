# Sistema de Cache Cache-Aside - ERP Pizzaria

## Visão Geral

Este documento descreve a implementação do padrão **Cache-Aside** no backend do ERP de pizzaria, focando em otimizar consultas pesadas que alimentam dashboards, relatórios e operações frequentes.

## Arquitetura do Cache

### 1. Cache Manager (`backend/cache/cache-manager.js`)
- **Implementação**: Cache em memória local usando `Map()` nativo do JavaScript
- **TTL**: Sistema de Time-To-Live configurável por item
- **Limpeza**: Automática a cada 5 minutos + limpeza manual sob demanda
- **Padrão**: Cache-Aside puro - verificação manual de cache antes de cada consulta

### 2. Gerador de Chaves (`backend/cache/cache-keys.js`)
- **Centralização**: Todas as chaves de cache são geradas em um local único
- **Consistência**: Padronização de nomenclatura (`namespace:context:parameters`)
- **Invalidação**: Padrões regex para invalidação em massa

### 3. Middleware de Invalidação (`backend/middleware/cache-invalidation.js`)
- **Automático**: Invalidação baseada em eventos de modificação de dados
- **Granular**: Diferentes estratégias por tipo de operação
- **Monitoramento**: Logs detalhados de operações de cache

## Rotas Otimizadas

### 🎯 Dashboard (`/api/dashboard`)
**Consultas otimizadas:**
- KPIs do dia (vendas, novos clientes, pizzas vendidas, pedidos pendentes)
- Pedidos recentes (últimos 5)
- Top pizzas mais vendidas (30 dias)
- Vendas ao longo do tempo (30 dias)

**TTL configurado:**
- Dashboard completo: 2 minutos
- KPIs do dia: 3 minutos
- Pedidos recentes: 1 minuto
- Top pizzas: 10 minutos
- Vendas históricas: 10 minutos

### 📊 Relatórios (`/api/reports`)
**Consultas otimizadas:**
- Relatório de vendas por período
- Fechamentos de caixa
- Produtos mais vendidos
- Relatório de clientes

**TTL configurado:**
- Relatórios de vendas: 10 minutos
- Fechamentos históricos: 15 minutos
- Top produtos: 15 minutos
- Relatórios de clientes: 15 minutos

### 💰 Fechamento de Caixa (`/api/cash-closing`)
**Consultas otimizadas:**
- Dados do dia atual para fechamento
- Listagem de fechamentos por período
- Fechamento específico por ID

**TTL configurado:**
- Dados do dia atual: 2 minutos (dados voláteis)
- Listagem de fechamentos: 10 minutos
- Fechamento por ID: 30 minutos (dados históricos)

### 📋 Pedidos (`/api/orders`)
**Consultas otimizadas:**
- Listagem de pedidos com filtros
- Pedido específico por ID (com joins pesados)

**TTL dinâmico:**
- Pedidos finalizados (entregue/cancelado): 30 minutos
- Pedidos em andamento: 2-5 minutos
- Listagem filtrada: 3-15 minutos

## Estratégia de Invalidação

### Invalidação Automática
```javascript
// Exemplo: Ao criar um novo pedido
invalidateOrderCaches(orderId, clienteId);
// Invalida: pedidos, dashboard, relatórios
```

### Padrões de Invalidação
- **Pedidos**: `orders:.*` → Invalida dashboard e relatórios
- **Fechamento**: `cash_closing:.*` → Invalida dashboard e relatórios
- **Produtos**: `products:.*` → Invalida top pizzas e relatórios
- **Clientes**: `customers:.*` → Invalida relatórios de clientes

## Administração do Cache

### Rotas Administrativas (`/api/cache-admin`)
- `GET /stats` - Estatísticas do cache
- `DELETE /clear` - Limpar todo o cache
- `DELETE /pattern/:pattern` - Limpar por padrão regex
- `DELETE /key/:key` - Remover chave específica
- `POST /cleanup` - Forçar limpeza de expirados
- `GET /health` - Health check do sistema

### Monitoramento
```bash
# Verificar estatísticas
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/cache-admin/stats

# Limpar cache específico
curl -X DELETE -H "Authorization: Bearer TOKEN" http://localhost:3000/api/cache-admin/pattern/dashboard

# Health check
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/cache-admin/health
```

## Ganhos de Performance

### Consultas Otimizadas
1. **Dashboard completo**: 8 consultas SQL → 1 consulta ao cache
2. **Relatório de vendas**: 3 consultas com agregações → 1 consulta ao cache
3. **Fechamentos históricos**: 1 consulta complexa → 1 consulta ao cache
4. **Pedidos com joins**: 3-5 consultas por pedido → 1 consulta ao cache

### Redução de Carga no Banco
- **Consultas de dashboard**: Redução de ~80% nas consultas repetidas
- **Relatórios históricos**: Cache de 15 minutos evita recálculos
- **Agregações pesadas**: Top pizzas calculadas uma vez a cada 10 minutos

## Uso do Sistema

### Implementação Cache-Aside
```javascript
// Exemplo de uso básico
const data = await cache.getOrFetch(cacheKey, async () => {
  return await fetchDataFromDatabase();
}, 300); // 5 minutos TTL
```

### Invalidação Manual
```javascript
// Invalidar cache específico
cache.delete('dashboard:data');

// Invalidar por padrão
cache.deletePattern('reports:.*');

// Limpar tudo
cache.clear();
```

## Configurações Recomendadas

### TTL por Tipo de Dados
- **Dados em tempo real** (pedidos pendentes): 1-2 minutos
- **Dados do dia** (vendas, KPIs): 2-5 minutos
- **Dados históricos** (relatórios): 10-15 minutos
- **Dados imutáveis** (pedidos finalizados): 30 minutos

### Memória e Performance
- **Cache automático**: Limpeza a cada 5 minutos
- **Limite prático**: ~1000 itens simultâneos em memória
- **Overhead**: Mínimo (~2MB RAM para uso típico)

## Logs e Debug

### Logs de Cache
```
🎯 Cache HIT: dashboard:data
❌ Cache MISS: reports:sales:2024-01-01:2024-01-31
💾 Cache SET: orders:list:entregue (TTL: 900s)
🗑️ Cache DELETE: dashboard:kpis:2024-01-01
🧹 Cache CLEANUP: 5 items expired
```

### Debug de Performance
- Use `/api/cache-admin/stats` para monitorar hit rate
- Logs automáticos mostram HIT/MISS para cada operação
- Health check verifica funcionamento do sistema

## Considerações Importantes

### Limitações
- Cache apenas em memória (perdido no restart)
- Não é cluster-safe (cada instância tem cache próprio)
- TTL baseado em tempo, não em mudanças de dados

### Vantagens
- Zero dependências externas
- Implementação simples e confiável
- Performance excelente para aplicação single-instance
- Invalidação granular e automática

### Próximos Passos
- Monitorar hit rate em produção
- Ajustar TTLs baseado no uso real
- Considerar Redis para ambientes clustered (futuro) 