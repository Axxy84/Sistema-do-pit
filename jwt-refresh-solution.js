/**
 * SOLUÇÃO COMPLETA PARA REFRESH TOKEN
 * Frontend (React) + Backend (Node.js/Express)
 */

// ===== FRONTEND (React/Axios) =====

// 1. Configuração do Axios com Interceptadores
import axios from 'axios';

// Criar instância do axios
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Função para obter token do storage
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

// Interceptador de Request - Adiciona token em todas requisições
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptador de Response - Trata erro 401 e renova token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch(err => Promise.reject(err));
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                
                const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
                    refreshToken
                });
                
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                setTokens(accessToken, newRefreshToken);
                
                processQueue(null, accessToken);
                
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
                
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                // Limpar tokens e redirecionar para login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

// ===== BACKEND (Node.js/Express) =====

// 2. Middleware de Autenticação
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }
        
        const token = authHeader.substring(7);
        
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token expirado' });
                }
                return res.status(401).json({ error: 'Token inválido' });
            }
            
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(401).json({ error: 'Erro na autenticação' });
    }
};

// 3. Rotas de Autenticação
import express from 'express';
import bcrypt from 'bcryptjs';

const authRouter = express.Router();

// Função para gerar tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    
    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    return { accessToken, refreshToken };
};

// Rota de Login
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Verificar usuário no banco (exemplo)
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        // Gerar tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        
        // Salvar refresh token no banco (opcional, mas recomendado)
        await RefreshToken.create({
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
        });
        
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Rota de Refresh Token
authRouter.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token não fornecido' });
        }
        
        // Verificar refresh token
        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(401).json({ error: 'Refresh token inválido' });
                }
                
                // Verificar se token existe no banco (se implementado)
                const storedToken = await RefreshToken.findOne({
                    token: refreshToken,
                    userId: decoded.userId
                });
                
                if (!storedToken) {
                    return res.status(401).json({ error: 'Refresh token não encontrado' });
                }
                
                // Gerar novos tokens
                const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
                
                // Atualizar refresh token no banco
                storedToken.token = newRefreshToken;
                storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await storedToken.save();
                
                res.json({
                    accessToken,
                    refreshToken: newRefreshToken
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Rota de Logout
authRouter.post('/logout', authMiddleware, async (req, res) => {
    try {
        // Remover refresh token do banco
        await RefreshToken.deleteMany({ userId: req.user.userId });
        
        res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer logout' });
    }
});

// 4. Configuração do .env
/*
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_REFRESH_SECRET=outra_chave_secreta_para_refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
*/

export { apiClient, authRouter, authMiddleware }; 