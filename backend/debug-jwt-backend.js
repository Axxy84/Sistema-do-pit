/**
 * SCRIPT DE DEBUG JWT - BACKEND
 * Execute este script no servidor para diagnosticar problemas de autenticação
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== DEBUG JWT BACKEND ===\n');

// 1. VERIFICAR CONFIGURAÇÃO DE AMBIENTE
console.log('1. CONFIGURAÇÃO DE AMBIENTE:');
console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'NÃO DEFINIDO');
console.log('JWT_REFRESH_EXPIRES_IN:', process.env.JWT_REFRESH_EXPIRES_IN || 'NÃO DEFINIDO');
console.log('NODE_ENV:', process.env.NODE_ENV);

// 2. TESTAR GERAÇÃO DE TOKEN
console.log('\n2. TESTE DE GERAÇÃO DE TOKEN:');
try {
    const testPayload = {
        userId: '123',
        email: 'test@pitstop.com',
        role: 'admin'
    };
    
    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '1h'
    });
    
    console.log('Token gerado com sucesso');
    console.log('Token (primeiros 50 chars):', token.substring(0, 50) + '...');
    
    // Verificar o token gerado
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    console.log('Token verificado com sucesso:', decoded);
    
} catch (error) {
    console.error('ERRO ao gerar/verificar token:', error.message);
}

// 3. VERIFICAR TOKEN DE EXEMPLO (substitua pelo token real do erro)
console.log('\n3. VERIFICAR TOKEN DO CLIENTE:');
const clientToken = 'COLE_AQUI_O_TOKEN_DO_FRONTEND'; // Substitua pelo token real

if (clientToken !== 'COLE_AQUI_O_TOKEN_DO_FRONTEND') {
    try {
        const decoded = jwt.verify(clientToken, process.env.JWT_SECRET || 'test-secret');
        console.log('Token do cliente é VÁLIDO:', decoded);
        console.log('Expiração:', new Date(decoded.exp * 1000).toLocaleString());
    } catch (error) {
        console.error('Token do cliente é INVÁLIDO:', error.message);
        
        // Tentar decodificar sem verificar
        try {
            const decoded = jwt.decode(clientToken);
            console.log('Payload do token (sem verificação):', decoded);
            if (decoded?.exp) {
                console.log('Token expirou em:', new Date(decoded.exp * 1000).toLocaleString());
            }
        } catch (e) {
            console.error('Token malformado:', e.message);
        }
    }
}

// 4. SIMULAR MIDDLEWARE DE AUTENTICAÇÃO
console.log('\n4. TESTE DO MIDDLEWARE:');
const testAuthMiddleware = (token) => {
    if (!token) {
        return { error: 'Token não fornecido', status: 401 };
    }
    
    // Remover "Bearer " se presente
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    try {
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'test-secret');
        return { success: true, user: decoded };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { error: 'Token expirado', status: 401 };
        } else if (error.name === 'JsonWebTokenError') {
            return { error: 'Token inválido', status: 401 };
        }
        return { error: error.message, status: 401 };
    }
};

// Testar diferentes cenários
console.log('Teste sem token:', testAuthMiddleware(''));
console.log('Teste com Bearer:', testAuthMiddleware('Bearer ' + 'token-fake'));

// 5. VERIFICAR ROTAS PROTEGIDAS
console.log('\n5. ROTAS QUE DEVEM ESTAR PROTEGIDAS:');
const protectedRoutes = [
    '/api/orders',
    '/api/customers',
    '/api/products',
    '/api/cash-closings',
    '/api/deliverers',
    '/api/expenses',
    '/api/coupons'
];

console.log('Rotas protegidas configuradas:');
protectedRoutes.forEach(route => {
    console.log(`  - ${route}`);
});

// 6. SUGESTÕES DE CORREÇÃO
console.log('\n6. SUGESTÕES DE CORREÇÃO:');
console.log('- Verificar se JWT_SECRET está definido no .env');
console.log('- Verificar se o middleware de autenticação está aplicado nas rotas');
console.log('- Verificar se o token está sendo enviado no header Authorization');
console.log('- Implementar refresh token para renovação automática');
console.log('- Aumentar tempo de expiração do token para desenvolvimento');

console.log('\n=== FIM DO DEBUG ==='); 