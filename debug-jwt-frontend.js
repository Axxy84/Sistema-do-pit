/**
 * SCRIPT DE DEBUG JWT - FRONTEND
 * Execute este código no console do navegador para diagnosticar problemas
 */

// 1. VERIFICAR TOKEN ARMAZENADO
console.log('=== VERIFICAÇÃO DO TOKEN JWT ===');

// Verificar localStorage
const tokenLocal = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
console.log('Token no localStorage:', tokenLocal ? `${tokenLocal.substring(0, 20)}...` : 'NÃO ENCONTRADO');

// Verificar sessionStorage
const tokenSession = sessionStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('jwt');
console.log('Token no sessionStorage:', tokenSession ? `${tokenSession.substring(0, 20)}...` : 'NÃO ENCONTRADO');

// Verificar cookies
console.log('Cookies:', document.cookie || 'NENHUM COOKIE');

// 2. DECODIFICAR TOKEN (se encontrado)
const token = tokenLocal || tokenSession;
if (token) {
    try {
        // Decodificar JWT sem verificar assinatura
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('\n=== PAYLOAD DO TOKEN ===');
            console.log('Emitido em:', new Date(payload.iat * 1000).toLocaleString());
            console.log('Expira em:', new Date(payload.exp * 1000).toLocaleString());
            console.log('Tempo restante:', ((payload.exp * 1000) - Date.now()) / 1000 / 60, 'minutos');
            console.log('Usuário:', payload.user || payload.sub || payload.userId);
            console.log('Payload completo:', payload);
            
            // Verificar se expirou
            if (payload.exp * 1000 < Date.now()) {
                console.error('⚠️ TOKEN EXPIRADO!');
            }
        }
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
    }
}

// 3. VERIFICAR CONFIGURAÇÃO DO AXIOS/FETCH
console.log('\n=== CONFIGURAÇÃO DE REQUISIÇÕES ===');

// Verificar se axios está configurado
if (typeof axios !== 'undefined') {
    console.log('Axios interceptors:', axios.interceptors);
}

// 4. TESTAR REQUISIÇÃO AUTENTICADA
console.log('\n=== TESTE DE REQUISIÇÃO ===');
const testAuthRequest = async () => {
    try {
        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Status da resposta:', response.status);
        console.log('Headers da resposta:', Object.fromEntries(response.headers));
        
        if (response.status === 401) {
            const data = await response.json();
            console.error('Erro 401:', data);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
};

// Executar teste
if (token) {
    testAuthRequest();
} else {
    console.error('⚠️ Nenhum token encontrado para testar!');
}

// 5. VERIFICAR CONFIGURAÇÃO DO APILIENT
console.log('\n=== VERIFICAÇÃO DO APICLIENT ===');
// Tentar acessar configuração global do apiClient se existir
if (typeof apiClient !== 'undefined') {
    console.log('apiClient está definido');
    console.log('baseURL:', apiClient.defaults?.baseURL);
    console.log('headers padrão:', apiClient.defaults?.headers);
} 