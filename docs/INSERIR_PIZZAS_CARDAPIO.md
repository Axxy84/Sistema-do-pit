# 🍕 Instruções para Inserir Pizzas do Cardápio

## 📋 Scripts Criados

1. **SQL Puro**: `backend/scripts/insert-pizzas-cardapio.sql`
2. **Node.js (Recomendado)**: `backend/populate-pizzas-cardapio.js`
3. **Teste/Verificação**: `backend/test-pizzas-cardapio.js`

## 🚀 Como Executar

### Opção 1: Usando Node.js (Recomendado)

```bash
# Entre na pasta backend
cd backend

# Execute o script de inserção
node populate-pizzas-cardapio.js
```

### Opção 2: Usando SQL direto

```bash
# Entre na pasta backend
cd backend

# Execute via psql
psql -U postgres -d pizzaria_db -f scripts/insert-pizzas-cardapio.sql
```

## ✅ Verificar se Funcionou

```bash
# Execute o script de teste
cd backend
node test-pizzas-cardapio.js
```

## 📊 O que foi inserido

14 pizzas do cardápio com 4 tamanhos cada:
- Pequena
- Média
- Grande
- Família

### Lista das Pizzas:
1. Bacon
2. Bacon com Milho
3. Baiana
4. Bauru
5. Brasileira
6. Brócolis
7. Brócolis com Bacon
8. Calabresa
9. Calabresa ao Catupiry
10. Calabresa com Cheddar
11. Calabresa Paulista
12. Camarão
13. Camarão ao Catupiry
14. Canadense

## 🔍 Notas Importantes

- As pizzas são inseridas na tabela `produtos` com `tipo_produto = 'pizza'`
- Se uma pizza já existir, ela será atualizada com os novos preços
- As descrições (ingredientes) são salvas no campo `ingredientes`
- O sistema usa JSONB para armazenar os diferentes tamanhos e preços

## 🛠️ Solução de Problemas

Se houver erro de conexão:
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Use o comando: `node test-connection.js`

Se houver erro de permissão:
```bash
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE pizzaria_db TO postgres;
```