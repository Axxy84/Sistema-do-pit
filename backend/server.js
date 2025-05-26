const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config/env');
const db = require('./config/database');

const app = express();

// Middlewares de segurança
app.use(helmet());

// Configuração de CORS mais flexível para desenvolvimento
const defaultLocalHostPort = '5173'; // Porta que você mais usa
const localHostOriginRegex = /^http:\/\/localhost:\d+$/;

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    console.log(`[CORS] Requisição da origem: ${origin}`); // Log da origem
    console.log(`[CORS] Config.CORS_ORIGIN: ${config.CORS_ORIGIN}`); // Log da configuração
    console.log(`[CORS] Teste da regex para localhost: ${localHostOriginRegex.test(origin)} (Origem: ${origin})`);

    let allowed = false;
    if (config.CORS_ORIGIN === '*') {
      allowed = true;
    } else if (!origin) { // requisições sem 'Origin' (ex: same-origin, server-to-server, ou algumas ferramentas)
      allowed = true;
    } else if (localHostOriginRegex.test(origin)) {
      allowed = true;
    } else if (origin === config.CORS_ORIGIN) {
      allowed = true;
    } else if (config.CORS_ORIGIN && typeof config.CORS_ORIGIN === 'string' && config.CORS_ORIGIN.includes(',')) {
      // Se CORS_ORIGIN for uma lista de URLs separadas por vírgula
      if (config.CORS_ORIGIN.split(',').map(item => item.trim()).includes(origin)) {
        allowed = true;
      }
    }
    // Adicione um log final para o resultado da verificação
    console.log(`[CORS] A origem "${origin}" é permitida? ${allowed}`);

    if (allowed) {
      // console.log(`[CORS] Origem permitida: ${origin}`); // Comentado pois o log acima já informa
      callback(null, true);
    } else {
      console.warn(`[CORS] Origem NÃO permitida: ${origin}. Verifique a variável de ambiente CORS_ORIGIN ou a configuração do servidor.`);
      callback(new Error('Não permitido pelo CORS. Verifique a origem da requisição e a configuração CORS_ORIGIN do servidor.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin'], // Adicionando mais headers comuns
};

// Lidar com requisições OPTIONS globalmente ANTES de outras rotas
app.options('*', cors(corsOptions));

// Aplicar CORS para todas as outras requisições
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.NODE_ENV === 'development' ? 1000 : 100, // 1000 requests em dev, 100 em produção
  message: {
    error: 'Muitas requisições deste IP, tente novamente em alguns minutos.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000)
  }
});
app.use(limiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origem: ${req.headers.origin}`);
  next();
});

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const ingredientRoutes = require('./routes/ingredients');
const delivererRoutes = require('./routes/deliverers');
const couponRoutes = require('./routes/coupons');
const expenseRoutes = require('./routes/expenses');
const cashClosingRoutes = require('./routes/cash-closing');
const dashboardRoutes = require('./routes/dashboard');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/deliverers', delivererRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cash-closing', cashClosingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ignorar requisições para favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: config.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 CORS habilitado para: ${config.CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, fechando servidor...');
  process.exit(0);
}); 