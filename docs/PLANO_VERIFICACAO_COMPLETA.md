# 🎯 PLANO DE VERIFICAÇÃO COMPLETA - PIT STOP PIZZARIA

## 📊 **1. DASHBOARD PRINCIPAL**

### Testes Funcionais:
- [ ] **Carregamento Inicial**
  - Acessar dashboard após login
  - Verificar tempo de carregamento < 3 segundos
  - Confirmar ausência de erros no console

- [ ] **KPIs Precisos**
  - Vendas Hoje: Soma apenas pedidos "entregue" do dia
  - Novos Clientes: Contagem correta de cadastros do dia
  - Pizzas Vendidas: Quantidade correta
  - Pedidos Pendentes: Status != "entregue" ou "cancelado"

- [ ] **Atualização Automática**
  - Aguardar 2 minutos
  - Verificar se dados atualizam sem refresh manual
  - Criar novo pedido e verificar atualização

### Critérios de Sucesso:
- ✅ Todos os valores numéricos corretos
- ✅ Gráficos renderizando adequadamente
- ✅ Responsivo em mobile/tablet
- ✅ Performance adequada

### Verificação de Integridade:
```sql
-- Query para validar KPIs manualmente
SELECT 
  COUNT(*) as total_pedidos,
  SUM(total) as total_vendas,
  COUNT(DISTINCT cliente_id) as clientes_unicos
FROM pedidos 
WHERE DATE(created_at) = CURDATE()
  AND status_pedido = 'entregue';
```

---

## 🔐 **2. AUTENTICAÇÃO E AUTORIZAÇÃO**

### Testes Funcionais:
- [ ] **Login Básico**
  - Email: admin@pitstop.com
  - Senha: [senha_configurada]
  - Verificar redirecionamento para dashboard

- [ ] **Login com Erro**
  - Credenciais incorretas → Mensagem de erro clara
  - Campos vazios → Validação adequada

- [ ] **Sessão Persistente**
  - Fazer login
  - Fechar navegador
  - Reabrir → Deve manter logado

- [ ] **Logout**
  - Clicar logout
  - Tentar acessar rota protegida → Redireciona para login

- [ ] **Token Expirado**
  - Aguardar expiração (ou simular)
  - Fazer requisição → Deve renovar automaticamente

### Critérios de Sucesso:
- ✅ Tokens armazenados corretamente
- ✅ Headers Authorization enviados
- ✅ Refresh token funcionando
- ✅ Logout limpa todos os tokens

---

## 🍕 **3. GERENCIAMENTO DE PRODUTOS**

### Testes Funcionais:

#### **Criar Produto Pizza:**
- [ ] Nome: "Pizza Especial da Casa"
- [ ] Categoria: "Pizza"
- [ ] Descrição: "Molho especial, mussarela, calabresa, cebola"
- [ ] Preços por tamanho:
  - P: R$ 25,00
  - M: R$ 35,00
  - G: R$ 45,00
- [ ] Salvar e verificar listagem

#### **Criar Produto Bebida:**
- [ ] Nome: "Coca-Cola 2L"
- [ ] Categoria: "Bebida"
- [ ] Preço único: R$ 12,00
- [ ] Quantidade em estoque: 50

#### **Editar Produto:**
- [ ] Alterar preço da pizza G para R$ 48,00
- [ ] Desativar produto temporariamente
- [ ] Verificar se não aparece nos pedidos

#### **Validações:**
- [ ] Tentar criar produto sem nome → Erro
- [ ] Preço negativo → Erro
- [ ] Produto duplicado → Aviso

### Critérios de Sucesso:
- ✅ CRUD completo funcionando
- ✅ Produtos inativos não aparecem em pedidos
- ✅ Alterações refletem imediatamente
- ✅ Validações adequadas

---

## 📋 **4. FLUXO COMPLETO DE PEDIDOS**

### Teste Crítico - Pedido Completo:

#### **Passo 1: Cliente Novo**
- [ ] Telefone: "11987654321"
- [ ] Nome: "Maria Silva"
- [ ] Endereço: "Rua das Flores, 123, Centro"
- [ ] Sistema deve criar cliente automaticamente

#### **Passo 2: Adicionar Itens**
- [ ] 1x Pizza Margherita (G) - R$ 45,00
- [ ] 1x Pizza Calabresa (M) - R$ 35,00
- [ ] 2x Coca-Cola 2L - R$ 24,00
- [ ] Total: R$ 104,00

#### **Passo 3: Pagamento**
- [ ] Forma: Dinheiro
- [ ] Valor Pago: R$ 120,00
- [ ] Troco Calculado: R$ 16,00

#### **Passo 4: Atribuir Entregador**
- [ ] Selecionar entregador ativo
- [ ] Adicionar observação: "Apartamento 302"

#### **Passo 5: Fluxo de Status**
1. [ ] Criar pedido → Status: "Pendente"
2. [ ] Alterar para "Em Preparo" (após 2 min)
3. [ ] Alterar para "Saiu para Entrega" (após 10 min)
4. [ ] Alterar para "Entregue" (após 20 min)

#### **Passo 6: Verificações**
- [ ] Imprimir cupom → Formatação correta
- [ ] Dashboard atualiza automaticamente
- [ ] Pedido aparece no fechamento do dia

### Casos de Erro:
- [ ] Cliente sem telefone → Erro apropriado
- [ ] Pedido sem itens → Não permite salvar
- [ ] Troco negativo → Aviso ao usuário

---

## 👥 **5. GERENCIAMENTO DE CLIENTES**

### Testes Funcionais:

#### **Busca por Telefone:**
- [ ] Buscar "75992328545" → Deve encontrar
- [ ] Buscar "00000000000" → Não encontrado
- [ ] Buscar parcial "7599" → Lista filtrada

#### **Editar Cliente:**
- [ ] Alterar endereço
- [ ] Adicionar complemento
- [ ] Verificar se reflete nos pedidos futuros

#### **Histórico do Cliente:**
- [ ] Visualizar pedidos anteriores
- [ ] Total gasto
- [ ] Frequência de pedidos
- [ ] Pontos de fidelidade (se aplicável)

### Critérios de Sucesso:
- ✅ Busca rápida e precisa
- ✅ Dados completos visíveis
- ✅ Histórico correto
- ✅ LGPD compliance (dados protegidos)

---

## 💰 **6. FECHAMENTO DE CAIXA - TESTE CRÍTICO**

### Preparação do Teste:
1. **Criar 3 pedidos para hoje:**
   - Pedido A: R$ 45,00 (Dinheiro) - ENTREGUE
   - Pedido B: R$ 60,00 (Cartão) - ENTREGUE  
   - Pedido C: R$ 30,00 (PIX) - PENDENTE

2. **Adicionar Transações:**
   - Despesa: R$ 50,00 (Compra de ingredientes)
   - Receita Extra: R$ 20,00 (Venda balcão)

### Verificações Obrigatórias:
- [ ] **Total de Vendas**: R$ 105,00 (apenas A+B)
- [ ] **Total de Pedidos**: 2 (apenas entregues)
- [ ] **Por Forma de Pagamento**:
  - Dinheiro: R$ 45,00 (1 pedido)
  - Cartão: R$ 60,00 (1 pedido)
  - PIX: R$ 0,00 (0 pedidos entregues)
- [ ] **Despesas**: R$ 50,00
- [ ] **Receitas Extras**: R$ 20,00
- [ ] **Saldo Final**: R$ 75,00 (105 + 20 - 50)

### Processo de Fechamento:
- [ ] Clicar "Fechar Caixa do Dia"
- [ ] Confirmar valores
- [ ] Gerar relatório impresso
- [ ] Verificar histórico salvo

### Validações:
- [ ] Não permitir fechar dia já fechado
- [ ] Alertar se há pedidos pendentes
- [ ] Backup automático dos dados

---

## 🖨️ **7. SISTEMA DE IMPRESSÃO**

### Testes de Impressão:

#### **Cupom de Pedido:**
- [ ] Dados do cliente completos
- [ ] Lista de itens com preços
- [ ] Total e forma de pagamento
- [ ] Dados do entregador
- [ ] Observações visíveis

#### **Relatório de Fechamento:**
- [ ] Resumo financeiro
- [ ] Detalhamento por pagamento
- [ ] Assinatura para conferência

### Critérios:
- ✅ Formatação adequada para impressora térmica
- ✅ Sem corte de informações
- ✅ Fonte legível

---

## 🚚 **8. GERENCIAMENTO DE ENTREGAS**

### Testes:
- [ ] **Cadastrar Entregador**
  - Nome, telefone, veículo
  - Ativar/desativar

- [ ] **Atribuição**
  - Selecionar no pedido
  - Múltiplos pedidos mesmo entregador

- [ ] **Relatório de Entregas**
  - Quantidade por entregador
  - Tempo médio de entrega

---

## 📊 **9. RELATÓRIOS**

### Testes por Tipo:
- [ ] **Vendas por Período**
  - Selecionar últimos 7 dias
  - Verificar totalização

- [ ] **Produtos Mais Vendidos**
  - Ranking correto
  - Quantidades precisas

- [ ] **Performance Entregadores**
  - Entregas realizadas
  - Tempo médio

### Exportação:
- [ ] Gerar PDF
- [ ] Exportar Excel
- [ ] Enviar por email

---

## 🎟️ **10. SISTEMA DE CUPONS**

### Testes:
- [ ] **Criar Cupom**
  - Código: "PIZZA10"
  - Desconto: 10%
  - Validade: 30 dias

- [ ] **Aplicar no Pedido**
  - Total R$ 100 → R$ 90
  - Cupom marca como usado

- [ ] **Validações**
  - Cupom expirado → Erro
  - Cupom já usado → Erro

---

## 👑 **11. ÁREA DO DONO**

### Verificar Funcionalidades:
- [ ] Configurações gerais
- [ ] Gestão de usuários
- [ ] Relatórios avançados
- [ ] Backup de dados
- [ ] Logs de auditoria

---

## 🚀 **CRITÉRIOS FINAIS PARA PRODUÇÃO**

### Checklist de Aprovação:
- [ ] Todos os testes críticos passando
- [ ] Zero erros no console
- [ ] Performance adequada (< 3s carregamento)
- [ ] Backup configurado e testado
- [ ] SSL/HTTPS configurado
- [ ] Variáveis de ambiente seguras
- [ ] Logs de erro configurados
- [ ] Monitoramento ativo

### Documentação:
- [ ] README atualizado
- [ ] Manual do usuário
- [ ] Documentação da API
- [ ] Guia de instalação

### Segurança:
- [ ] Senhas fortes obrigatórias
- [ ] Rate limiting configurado
- [ ] Proteção contra SQL injection
- [ ] XSS prevention
- [ ] CORS configurado corretamente

---

## 📱 **TESTES DE RESPONSIVIDADE**

### Dispositivos:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Funcionalidades Mobile:
- [ ] Menu hamburguer funcionando
- [ ] Formulários usáveis
- [ ] Botões com tamanho adequado
- [ ] Scroll suave

---

## 🎯 **PLANO DE CONTINGÊNCIA**

### Se encontrar problemas:
1. **Erro Crítico**: Parar deploy imediatamente
2. **Erro Médio**: Corrigir em até 24h
3. **Erro Baixo**: Adicionar ao backlog

### Rollback:
- [ ] Backup antes do deploy
- [ ] Script de rollback pronto
- [ ] Teste de recuperação

---

**TEMPO ESTIMADO PARA VERIFICAÇÃO COMPLETA**: 4-6 horas
**EQUIPE NECESSÁRIA**: 2-3 pessoas (dev + tester + usuário)

✅ **Após todos os testes, a aplicação estará pronta para produção!** 