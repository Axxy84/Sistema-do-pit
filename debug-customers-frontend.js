// Script para debugar o problema de listagem de clientes no frontend

console.log(`
🐛 DEBUG: Problema de Listagem de Clientes

SINTOMAS:
1. Após cadastrar novo cliente, ele não aparece na lista
2. Ao deletar um cliente, recebe 404 (mas a API está funcionando)

POSSÍVEIS CAUSAS:
1. Cache do frontend não está sendo atualizado
2. Estado React não está re-renderizando
3. Problema de timing (fetch acontece antes do create/delete terminar)

SOLUÇÕES IMPLEMENTADAS:
1. ✅ Corrigido <tr> para <TableRow> no componente da tabela
2. ✅ Telefone agora é opcional no formulário
3. ✅ clientService.js já usa rotas corretas /customers

PRÓXIMOS PASSOS:
1. Verificar se fetchCustomers() está sendo chamado após create/delete
2. Verificar se há algum cache no apiClient que precisa ser limpo
3. Adicionar logs para debugar o fluxo de atualização

Para testar no console do browser:
`);

console.log(`
// 1. Verificar se o service está funcionando
const { clientService } = await import('./src/services/clientService.js');
const customers = await clientService.getAllClients();
console.log('Clientes:', customers);

// 2. Criar um cliente de teste
const newCustomer = await clientService.createClient({
  nome: 'Cliente Debug ' + Date.now(),
  telefone: '11999999999',
  endereco: 'Rua Debug, 123'
});
console.log('Cliente criado:', newCustomer);

// 3. Verificar se aparece na lista
const updatedList = await clientService.getAllClients();
console.log('Lista atualizada:', updatedList);
console.log('Cliente novo está na lista?', updatedList.some(c => c.id === newCustomer.id));

// 4. Deletar o cliente
await clientService.deleteClient(newCustomer.id);
console.log('Cliente deletado');

// 5. Verificar se foi removido da lista
const finalList = await clientService.getAllClients();
console.log('Lista final:', finalList);
console.log('Cliente foi removido?', !finalList.some(c => c.id === newCustomer.id));
`);

console.log(`
🔧 CORREÇÕES ADICIONAIS A VERIFICAR:

1. No CustomersPage.jsx, verificar se após criar/deletar:
   - setIsFormOpen(false) está sendo chamado
   - fetchCustomers() está sendo aguardado com await
   - Não há erro silencioso impedindo o fetch

2. Verificar se há algum sistema de cache no apiClient.js que precisa ser invalidado

3. Adicionar um pequeno delay antes de fetchCustomers() caso seja problema de timing:
   setTimeout(() => fetchCustomers(), 500);

4. Verificar no Network do DevTools se a requisição GET /api/customers está sendo feita após create/delete
`);