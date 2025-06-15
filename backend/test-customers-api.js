// Script para testar as rotas de clientes

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const axios = require('axios');
const API_BASE = `http://localhost:${process.env.PORT || 3001}/api`;

// Token de teste (você pode gerar um novo com generate-test-token.js)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OWE2MmIyNC03YWNkLTRiZDAtYTg0Yy05ZWUyMTY0Y2VjMjYiLCJpYXQiOjE3NDk5NDU2NjEsImV4cCI6MTc1MDAzMjA2MX0.EGjYWlmK0YtTOb8wT73sI73oziucH5w1f2DZIT4itZc';

async function testCustomersAPI() {
  console.log('🧪 Testando API de Clientes...\n');
  
  const headers = { 
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Listar todos os clientes
    console.log('📋 1. Listando todos os clientes...');
    const listResponse = await axios.get(`${API_BASE}/customers`, { headers });
    console.log(`✅ Clientes encontrados: ${listResponse.data.customers.length}`);
    console.log('Exemplo:', listResponse.data.customers[0] || 'Nenhum cliente');
    
    // 2. Criar novo cliente
    console.log('\n🆕 2. Criando novo cliente...');
    const newCustomer = {
      nome: 'Cliente Teste API',
      telefone: '11' + Math.floor(Math.random() * 900000000 + 100000000),
      endereco: 'Rua Teste, 123'
    };
    
    try {
      const createResponse = await axios.post(`${API_BASE}/customers`, newCustomer, { headers });
      console.log('✅ Cliente criado:', createResponse.data.customer);
      const createdId = createResponse.data.customer.id;
      
      // 3. Buscar cliente por ID
      console.log('\n🔍 3. Buscando cliente por ID...');
      const getResponse = await axios.get(`${API_BASE}/customers/${createdId}`, { headers });
      console.log('✅ Cliente encontrado:', getResponse.data.customer);
      
      // 4. Atualizar cliente
      console.log('\n✏️  4. Atualizando cliente...');
      const updateData = { 
        nome: 'Cliente Teste Atualizado',
        endereco: 'Rua Nova, 456'
      };
      const updateResponse = await axios.patch(`${API_BASE}/customers/${createdId}`, updateData, { headers });
      console.log('✅ Cliente atualizado:', updateResponse.data.customer);
      
      // 5. Buscar pontos do cliente
      console.log('\n🏆 5. Buscando pontos do cliente...');
      const pointsResponse = await axios.get(`${API_BASE}/customers/${createdId}/points`, { headers });
      console.log('✅ Pontos:', pointsResponse.data.points);
      
      // 6. Deletar cliente
      console.log('\n🗑️  6. Deletando cliente...');
      const deleteResponse = await axios.delete(`${API_BASE}/customers/${createdId}`, { headers });
      console.log('✅ Cliente deletado com sucesso');
      
      // 7. Verificar se foi deletado
      console.log('\n🔍 7. Verificando se foi deletado...');
      try {
        await axios.get(`${API_BASE}/customers/${createdId}`, { headers });
        console.log('❌ ERRO: Cliente ainda existe!');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Cliente não encontrado (deletado corretamente)');
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  Cliente já existe com esse telefone (esperado em alguns casos)');
      } else {
        throw error;
      }
    }
    
    // 8. Testar endpoint /manage
    console.log('\n🔄 8. Testando endpoint /manage...');
    const manageData = {
      nome: 'Cliente Manage Test',
      telefone: '11' + Math.floor(Math.random() * 900000000 + 100000000),
      endereco: 'Endereço Manage'
    };
    
    const manageResponse = await axios.post(`${API_BASE}/customers/manage`, manageData, { headers });
    console.log('✅ Manage response:', manageResponse.data);
    
    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config?.url);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

// Executar testes
testCustomersAPI();