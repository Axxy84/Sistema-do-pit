# 🔧 Resolver: Bordas não aparecem no Frontend

## 🚨 Problema Identificado

As bordas foram inseridas no banco mas não aparecem no frontend porque:
1. O servidor precisa ser reiniciado para reconhecer a nova rota `/api/bordas`
2. A rota está retornando "Rota não encontrada"

## ✅ Solução Rápida (3 passos)

### 1️⃣ Reiniciar o Backend
```bash
# Parar o servidor atual (Ctrl+C)
# Então reiniciar:
cd backend
npm run dev
```

### 2️⃣ Verificar se a API está funcionando
```bash
# Em outro terminal, teste:
curl http://localhost:3001/api/bordas
```

Deve retornar algo como:
```json
{
  "success": true,
  "bordas": [...],
  "total": 6
}
```

### 3️⃣ Limpar cache do navegador e recarregar
```javascript
// No console do navegador (F12):
localStorage.clear();
location.reload();
```

## 📍 Onde as bordas aparecem?

### No Formulário de Pedidos:
- Ao criar um novo pedido
- Após selecionar uma pizza
- Aparece o campo "Borda Recheada" com as opções

### Na Página de Produtos:
- Aba "Bordas Recheadas" mostra "(0 itens)" porque:
  - Esta aba busca produtos do tipo "borda" 
  - As bordas estão em uma tabela separada `bordas`
  - Isso é normal e esperado

## 🔍 Verificações Adicionais

### 1. Confirmar que as bordas estão no banco:
```bash
cd backend
node populate-bordas.js
```

### 2. Testar a API completa:
```bash
cd backend
node test-bordas-api.js
```

### 3. Verificar no console do navegador:
- Abra o DevTools (F12)
- Vá para a aba Network
- Crie um novo pedido
- Procure pela requisição "bordas"
- Deve retornar status 200

## ❌ Se ainda não funcionar

### 1. Verificar logs do servidor:
O terminal do backend deve mostrar:
```
GET /api/bordas 200
```

### 2. Verificar se o arquivo foi salvo:
```bash
cat backend/server.js | grep bordas
```
Deve mostrar:
```javascript
app.use('/api/bordas', require('./routes/bordas'));
```

### 3. Forçar reload completo:
- Pare o frontend (Ctrl+C)
- Pare o backend (Ctrl+C)
- Reinicie ambos:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## ✨ Resultado Esperado

Quando funcionar, você verá:
- No formulário de pedidos: dropdown com 6 bordas + "Sem Borda"
- Preços de R$ 7,00 a R$ 10,00
- Seleção atualiza o preço total do pedido automaticamente