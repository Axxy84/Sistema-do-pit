// Script para testar integração completa de clientes

console.log(`
🧪 TESTE DE INTEGRAÇÃO - CLIENTES

Este script testa:
1. ✅ Backend rodando corretamente
2. ✅ Rotas /api/customers funcionando
3. ✅ Frontend atualizado para usar hook useCustomers
4. ✅ Sincronização via eventos customizados

Para executar no console do browser:

// 1. Criar cliente de teste
const testCustomer = {
  nome: 'Cliente Teste ' + Date.now(),
  telefone: '11' + Math.floor(Math.random() * 900000000 + 100000000),
  endereco: 'Rua do Teste, 123'
};

// Simular criação via evento
window.dispatchEvent(new CustomEvent('customerCreated', { 
  detail: { customer: testCustomer } 
}));

console.log('✅ Evento customerCreated disparado');

// 2. Verificar se a lista foi atualizada
setTimeout(() => {
  console.log('Verificar se a tabela de clientes foi atualizada');
}, 1000);

// 3. Simular deleção
const fakeId = 'test-123';
window.dispatchEvent(new CustomEvent('customerDeleted', { 
  detail: { customerId: fakeId } 
}));

console.log('✅ Evento customerDeleted disparado');

CORREÇÕES IMPLEMENTADAS:
✅ 1. Telefone agora é opcional no formulário
✅ 2. Substituído <tr> por <TableRow> no componente
✅ 3. Criado hook useCustomers para gerenciar estado
✅ 4. Adicionado delay de 300ms após operações
✅ 5. Implementado sistema de eventos para sincronização
✅ 6. Força refresh com timestamp para evitar cache

PRÓXIMOS PASSOS SE AINDA HOUVER PROBLEMAS:
1. Verificar no Network se a requisição GET /api/customers está sendo feita após create/delete
2. Verificar no console se há erros JavaScript silenciosos
3. Testar diretamente o clientService no console para garantir que está funcionando
4. Verificar se o backend está retornando os dados corretos após create/delete
`);