async function testCompleteFlow() {
  try {
    console.log('🔄 Testando fluxo completo: Login → Verificação Owner');
    
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@pizzaria.com',
        password: 'admin123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', loginData);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.user.full_name, `(${loginData.user.email})`);
    console.log('🔑 Token:', loginData.token.substring(0, 50) + '...');
    
    // 2. Verificar acesso de owner
    console.log('\n2️⃣ Verificando acesso de owner...');
    const ownerResponse = await fetch('http://localhost:3001/api/owner/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });

    const ownerData = await ownerResponse.json();
    
    console.log(`📡 Resposta HTTP ${ownerResponse.status}:`);
    console.log(JSON.stringify(ownerData, null, 2));
    
    if (ownerResponse.ok && ownerData.success && ownerData.isOwner) {
      console.log('\n🎉 SUCESSO COMPLETO!');
      console.log('✅ Login funcionando');
      console.log('✅ Verificação de owner funcionando');
      console.log('✅ Token válido');
      console.log('✅ Sistema 100% operacional para Tony!');
      
      console.log('\n🎯 COMO ACESSAR:');
      console.log('1. Vá para: http://localhost:5173/tony');
      console.log('2. Use as credenciais pré-preenchidas');
      console.log('3. Clique em "Acessar Centro Financeiro"');
    } else {
      console.log('\n❌ Problema na verificação de owner');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCompleteFlow();