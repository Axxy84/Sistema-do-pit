# 🧹 Como Limpar Cache do Browser

## Problema: API ainda tentando acessar /clients em vez de /customers

### Solução Rápida:

1. **No Browser (Chrome/Edge):**
   - Pressione `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
   - Ou: Abra DevTools (F12) → Clique com botão direito no botão Reload → "Empty Cache and Hard Reload"

2. **No Terminal (projeto):**
   ```bash
   # Parar o servidor (Ctrl+C)
   
   # Limpar cache do Vite
   node clear-cache.js
   
   # Reiniciar o servidor
   npm run dev
   ```

3. **Se ainda não funcionar:**
   ```bash
   # Limpar tudo e reinstalar
   rm -rf node_modules/.vite
   rm -rf dist
   npm run dev
   ```

### Verificação:
Após limpar o cache, ao tentar deletar um cliente, você deve ver no console:
```
[ClientService] Deletando cliente ID: 1
[ClientService] URL: /customers/1
```

E NÃO deve ver:
```
❌ URL completa: http://localhost:3001/api/clients/1
```

### O que foi corrigido:
- ✅ `clientService.js`: Todas as rotas mudadas de `/clients` → `/customers`
- ✅ `orderService.js`: Método `getCustomers()` corrigido
- ✅ Backend está esperando `/customers/*`

### Para testar:
```bash
cd backend
node test-customers-api.js
```

Isso confirmará que as rotas estão funcionando corretamente.