const axios = require('axios');

const testSignup = async () => {
  const baseURL = 'http://localhost:3001/api';
  
  // Test data for new user
  const newUser = {
    email: `test${Date.now()}@pizzaria.com`,
    password: 'senha123',
    fullName: 'Usuário de Teste',
    role: 'atendente'
  };
  
  console.log('🧪 Testando cadastro de novo usuário...\n');
  console.log('📝 Dados do teste:');
  console.log(`   Email: ${newUser.email}`);
  console.log(`   Senha: ${newUser.password}`);
  console.log(`   Nome: ${newUser.fullName}`);
  console.log(`   Função: ${newUser.role}\n`);
  
  try {
    // Test signup endpoint
    console.log('📤 Enviando requisição POST para /api/auth/signup...');
    const response = await axios.post(`${baseURL}/auth/signup`, newUser);
    
    console.log('\n✅ Cadastro realizado com sucesso!');
    console.log('📥 Resposta do servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Test signin with the new user
    console.log('\n🔐 Testando login com o novo usuário...');
    const loginResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: newUser.email,
      password: newUser.password
    });
    
    console.log('✅ Login realizado com sucesso!');
    console.log('🎫 Token recebido:', loginResponse.data.token.substring(0, 50) + '...');
    
    // Test /me endpoint with the token
    console.log('\n👤 Testando endpoint /api/auth/me...');
    const meResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('✅ Dados do usuário obtidos com sucesso:');
    console.log(JSON.stringify(meResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get('http://localhost:3001/api/auth/signin');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ O servidor backend não está rodando!');
      console.error('   Execute "npm run dev" no diretório backend primeiro.\n');
      process.exit(1);
    }
  }
};

// Run tests
(async () => {
  await checkServer();
  await testSignup();
})();