# Correção: Mesas Abertas no Fechamento de Caixa

## Problema Identificado
O sistema estava buscando mesas abertas usando uma condição incorreta:
```sql
WHERE status_pedido != 'fechado'
```

Porém, o status `'fechado'` não existe no sistema. Os status válidos são:
- `pendente`, `preparando`, `pronto`, `saiu_entrega`, `entregue`, `retirado`, `cancelado`

## Arquivos Corrigidos

### 1. `/backend/routes/dashboard.js`
- **Linha 251**: Corrigida query de mesas abertas no endpoint `/fechamento-consolidado`
- **Linha 391**: Corrigida query no endpoint `/mesas-tempo-real`

**De:**
```sql
WHERE status_pedido != 'fechado'
```

**Para:**
```sql
WHERE status_pedido NOT IN ('entregue', 'retirado', 'cancelado')
```

### 2. `/backend/routes/orders.js`
- **Linha 788**: Corrigida query para buscar mesa aberta

**De:**
```sql
AND p.status_pedido != 'fechado'
```

**Para:**
```sql
AND p.status_pedido NOT IN ('entregue', 'retirado', 'cancelado')
```

### 3. `/src/services/mesaService.js`
- Arquivo completamente reescrito para usar APIs reais ao invés de dados mockados
- Agora usa o endpoint `/dashboard/mesas-tempo-real` para buscar mesas abertas

## Explicação dos Status

Para pedidos de **mesa**:
- **Abertos**: `pendente`, `preparando`, `pronto`
- **Fechados**: `entregue`, `retirado`, `cancelado`

O status `retirado` é usado quando o cliente paga e retira o pedido da mesa.

## Teste de Verificação

Foi criado o arquivo `backend/test-mesas-abertas.js` para verificar o funcionamento correto:

```bash
node backend/test-mesas-abertas.js
```

## Resultado

Agora o sistema:
- ✅ Mostra corretamente as mesas abertas no Dashboard de Fechamento
- ✅ Exclui mesas com status `entregue`, `retirado` ou `cancelado`
- ✅ Funciona com dados reais do banco ao invés de dados mockados
- ✅ Calcula corretamente o valor pendente das mesas abertas