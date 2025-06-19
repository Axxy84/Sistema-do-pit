# 🔧 Como Resolver: Produtos Não Aparecem no Sistema

## 📋 Diagnóstico Rápido

As pizzas foram inseridas com sucesso no banco de dados (14 pizzas), mas não aparecem no frontend devido a problemas de cache ou autenticação.

## 🚀 Solução Rápida (3 passos)

### 1️⃣ Limpar Cache do Navegador
Abra o sistema no navegador e execute no console (F12):
```javascript
// Limpar todo o cache
localStorage.clear();
sessionStorage.clear();
window.location.reload(true);
```

### 2️⃣ Fazer Login Novamente
1. Faça logout do sistema
2. Faça login novamente com suas credenciais:
   - Email: `admin@pizzaria.com`
   - Senha: `admin123`

### 3️⃣ Acessar a Página de Produtos
1. Vá para o menu lateral
2. Clique em "Produtos" 
3. As pizzas devem aparecer agora

## 🔍 Verificações Adicionais

### Verificar se as pizzas estão no banco:
```bash
cd backend
node test-pizzas-cardapio.js
```

### Se ainda não aparecer, verificar o servidor:
```bash
# Parar o servidor (Ctrl+C)
# Reiniciar o servidor
cd backend
npm run dev
```

### Verificar no console do navegador:
1. Abra o DevTools (F12)
2. Vá na aba Console
3. Procure por mensagens como:
   - "API retornou X produtos"
   - "produtos válidos carregados"

## 🛠️ Solução Completa (se necessário)

### 1. Limpar Cache Completo
```bash
# No console do navegador
localStorage.clear();
sessionStorage.clear();
```

### 2. Reiniciar Backend
```bash
cd backend
# Ctrl+C para parar
npm run dev
```

### 3. Verificar Dados
```bash
cd backend
node test-pizzas-cardapio.js
```

### 4. Abrir em Aba Anônima
- Abra uma aba anônima/privada no navegador
- Acesse http://localhost:5173
- Faça login e verifique

## ❓ Ainda com Problemas?

### Verificar logs do backend:
Quando acessar a página de produtos, o terminal do backend deve mostrar:
```
GET /api/products 200
```

### Verificar Network no navegador:
1. F12 → Aba Network
2. Recarregue a página de produtos
3. Procure pela requisição "products"
4. Verifique o status (deve ser 200)
5. Verifique a resposta (deve conter as pizzas)

## ✅ Confirmação

Quando funcionar, você verá:
- 14 pizzas na lista de produtos
- Tipo: Pizza
- Categoria: Salgada
- Com 4 tamanhos de preços cada