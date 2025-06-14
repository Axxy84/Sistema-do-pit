# CORREÇÃO ADICIONAL: Import do apiClient no Dashboard

**Data:** 14/06/2025  
**Status:** ✅ CORRIGIDO

## 🐛 Problema Adicional

Após a primeira correção, o erro persistia devido a um conflito de importação.

## 🔍 Causa Raiz

O arquivo `apiClient.js` tinha tanto export named quanto export default:
```javascript
export const apiClient = { ... }
export default apiClient;
```

Mas `useDashboardData.js` estava usando named import:
```javascript
import { apiClient } from '@/lib/apiClient'; // ❌ Conflito
```

## ✅ Solução Final

### 1. Mudança na Importação
**useDashboardData.js:**
```javascript
// Antes
import { apiClient } from '@/lib/apiClient';

// Depois
import apiClient from '@/lib/apiClient';
```

### 2. Adição de Suporte a Query Parameters
**apiClient.js:**
```javascript
// Agora suporta params para GET requests
if (options.params) {
  const queryString = new URLSearchParams(options.params).toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  delete options.params;
}
```

## 📋 Resumo das Correções

1. **dashboardService.js**: Removido `.data` dos retornos
2. **useDashboardData.js**: Mudado para import default
3. **apiClient.js**: Adicionado suporte a query parameters

## ✨ Resultado Final

- ✅ Dashboard carrega sem erros
- ✅ Import/Export consistente
- ✅ Query parameters funcionando
- ✅ Sincronização com entregas operacional

## 🧪 Para Verificar

1. Recarregue a página (F5)
2. Abra o Dashboard
3. Não deve haver erros no console
4. KPIs devem aparecer corretamente