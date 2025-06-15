// Script de teste para verificar qual serviço está sendo usado
import { clientService } from './services/clientService';

console.log('🔍 Testando clientService...');
console.log('Funções disponíveis:', Object.keys(clientService));

// Verificar o código da função deleteClient
console.log('\n📝 Código de deleteClient:');
console.log(clientService.deleteClient.toString());

// Testar uma chamada
console.log('\n🧪 Testando chamada deleteClient(1)...');
try {
  clientService.deleteClient(1).then(result => {
    console.log('✅ Resultado:', result);
  }).catch(error => {
    console.error('❌ Erro:', error.message);
    console.error('URL tentada deve ser /customers/1, não /clients/1');
  });
} catch (error) {
  console.error('❌ Erro ao executar:', error);
}

export default {};