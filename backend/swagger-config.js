const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Pizzaria - API Completa',
      version: '2.0.0',
      description: `
        # Sistema de Gestão para Pizzarias - APIs dos 3 Apps Premium

        Esta documentação abrange todas as APIs desenvolvidas para os 3 aplicativos premium:
        
        ## 📱 **App do Garçom** - Gestão de Mesas e Pedidos
        - Gerenciamento de mesas
        - Criação e acompanhamento de pedidos
        - Controle de status dos pedidos
        - Fechamento de contas
        
        ## 🚚 **App do Entregador** - Gestão de Entregas
        - Listagem de entregas disponíveis
        - Aceitar e gerenciar entregas
        - Tracking de localização em tempo real
        - Finalização de entregas
        
        ## 📊 **App do Dono** - Analytics e Métricas
        - Dashboard executivo completo
        - Relatórios financeiros detalhados
        - Análise de clientes e operações
        - Alertas e notificações
        
        ## 🔐 **Sistema de Autenticação**
        Cada app possui autenticação específica com diferentes níveis de acesso:
        - **JWT tokens** específicos por aplicação
        - **Role-based access control** (RBAC)
        - **Middleware de autorização** por funcionalidade
        
        ## 🚀 **Pronto para Agentes Automatizados**
        - Arquitetura modular e extensível
        - Interfaces bem definidas
        - Documentação completa para development automation
        - Rate limiting e security headers
      `,
      contact: {
        name: 'Suporte Técnico',
        email: 'suporte@pizzaria.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.pizzaria.com',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação nas APIs'
        }
      },
      schemas: {
        // Schemas de Autenticação
        LoginRequest: {
          type: 'object',
          required: ['email', 'senha'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'garcom@pizzaria.com'
            },
            senha: {
              type: 'string',
              minLength: 6,
              example: 'senha123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['view_tables', 'create_orders']
            }
          }
        },
        
        // Schemas de Entidades
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            nome: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@pizzaria.com'
            },
            tipo_usuario: {
              type: 'string',
              enum: ['admin', 'garcom', 'entregador', 'atendente'],
              example: 'garcom'
            },
            ativo: {
              type: 'boolean',
              example: true
            }
          }
        },
        
        Mesa: {
          type: 'object',
          properties: {
            numero_mesa: {
              type: 'integer',
              example: 5
            },
            status: {
              type: 'string',
              enum: ['livre', 'ocupada', 'reservada'],
              example: 'ocupada'
            },
            pedidos_ativos: {
              type: 'integer',
              example: 2
            },
            valor_conta: {
              type: 'number',
              format: 'decimal',
              example: 85.50
            },
            tempo_ocupacao: {
              type: 'string',
              example: '45 min'
            }
          }
        },
        
        Pedido: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            tipo_pedido: {
              type: 'string',
              enum: ['mesa', 'delivery'],
              example: 'mesa'
            },
            numero_mesa: {
              type: 'integer',
              example: 5
            },
            cliente_nome: {
              type: 'string',
              example: 'Mesa 5'
            },
            valor_total: {
              type: 'number',
              format: 'decimal',
              example: 85.50
            },
            status_pedido: {
              type: 'string',
              enum: ['pendente', 'preparando', 'pronto', 'retirado', 'entregue', 'fechada', 'cancelado'],
              example: 'preparando'
            },
            data_pedido: {
              type: 'string',
              format: 'date-time'
            },
            itens: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ItemPedido'
              }
            }
          }
        },
        
        ItemPedido: {
          type: 'object',
          properties: {
            produto_nome: {
              type: 'string',
              example: 'Pizza Margherita'
            },
            quantidade: {
              type: 'integer',
              example: 1
            },
            preco_unitario: {
              type: 'number',
              format: 'decimal',
              example: 42.90
            },
            observacoes: {
              type: 'string',
              example: 'Sem cebola'
            },
            sabores: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Margherita', 'Pepperoni']
            },
            borda: {
              type: 'string',
              example: 'Catupiry'
            }
          }
        },
        
        Entrega: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            endereco: {
              type: 'string',
              example: 'Rua das Flores, 123'
            },
            cliente_nome: {
              type: 'string',
              example: 'Maria Santos'
            },
            cliente_telefone: {
              type: 'string',
              example: '(11) 99999-9999'
            },
            valor_total: {
              type: 'number',
              format: 'decimal',
              example: 65.90
            },
            taxa_entrega: {
              type: 'number',
              format: 'decimal',
              example: 5.00
            },
            status_pedido: {
              type: 'string',
              enum: ['preparando', 'pronto', 'saiu_para_entrega', 'entregue'],
              example: 'pronto'
            },
            tempo_estimado: {
              type: 'integer',
              description: 'Tempo estimado em minutos',
              example: 25
            },
            prioridade: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'medium'
            }
          }
        },
        
        DashboardExecutivo: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'quarter', 'year'],
              example: 'today'
            },
            summary: {
              type: 'object',
              properties: {
                revenue: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'number',
                      example: 2850.75
                    },
                    growth: {
                      type: 'number',
                      example: 12.5
                    },
                    target_achievement: {
                      type: 'number',
                      example: 95.0
                    }
                  }
                },
                orders: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'integer',
                      example: 42
                    },
                    average_ticket: {
                      type: 'number',
                      example: 67.88
                    },
                    conversion_rate: {
                      type: 'number',
                      example: 85.5
                    }
                  }
                }
              }
            }
          }
        },
        
        // Schemas de Request
        CriarPedidoRequest: {
          type: 'object',
          required: ['numero_mesa', 'itens'],
          properties: {
            numero_mesa: {
              type: 'integer',
              example: 5
            },
            cliente_nome: {
              type: 'string',
              example: 'Mesa 5'
            },
            itens: {
              type: 'array',
              items: {
                type: 'object',
                required: ['produto_id', 'quantidade'],
                properties: {
                  produto_id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  quantidade: {
                    type: 'integer',
                    minimum: 1,
                    example: 2
                  },
                  observacoes: {
                    type: 'string',
                    example: 'Sem cebola'
                  },
                  sabores: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  },
                  borda: {
                    type: 'string'
                  }
                }
              }
            },
            observacoes_gerais: {
              type: 'string',
              example: 'Cliente preferencial'
            }
          }
        },
        
        AtualizarStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pendente', 'preparando', 'pronto', 'retirado', 'entregue'],
              example: 'preparando'
            }
          }
        },
        
        FecharMesaRequest: {
          type: 'object',
          required: ['forma_pagamento'],
          properties: {
            forma_pagamento: {
              type: 'string',
              enum: ['dinheiro', 'cartao', 'pix'],
              example: 'cartao'
            },
            valor_pago: {
              type: 'number',
              format: 'decimal',
              example: 85.50
            },
            desconto: {
              type: 'number',
              format: 'decimal',
              example: 5.00
            }
          }
        },
        
        FinalizarEntregaRequest: {
          type: 'object',
          required: ['valor_recebido', 'forma_pagamento'],
          properties: {
            valor_recebido: {
              type: 'number',
              format: 'decimal',
              example: 65.90
            },
            forma_pagamento: {
              type: 'string',
              enum: ['dinheiro', 'cartao', 'pix'],
              example: 'dinheiro'
            },
            observacoes: {
              type: 'string',
              example: 'Entrega realizada com sucesso'
            },
            foto_comprovante: {
              type: 'string',
              format: 'base64',
              description: 'Foto do comprovante em base64 (opcional)'
            }
          }
        },
        
        // Schemas de Response padrão
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso'
            },
            data: {
              type: 'object'
            }
          }
        },
        
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Erro na operação'
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR'
            },
            details: {
              type: 'object'
            }
          }
        }
      },
      
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso inválido ou expirado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acesso negado - permissões insuficientes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: 'Acesso negado',
                code: 'INSUFFICIENT_PERMISSION'
              }
            }
          }
        },
        ValidationError: {
          description: 'Dados de entrada inválidos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: 'Dados inválidos',
                code: 'VALIDATION_ERROR'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: 'Recurso não encontrado',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
              }
            }
          }
        }
      }
    },
    
    tags: [
      {
        name: 'Waiter App',
        description: '📱 API do App do Garçom - Gestão de mesas e pedidos',
        externalDocs: {
          description: 'Documentação específica',
          url: '/docs/waiter-app'
        }
      },
      {
        name: 'Deliverer App', 
        description: '🚚 API do App do Entregador - Gestão de entregas',
        externalDocs: {
          description: 'Documentação específica',
          url: '/docs/deliverer-app'
        }
      },
      {
        name: 'Owner App',
        description: '📊 API do App do Dono - Analytics e métricas',
        externalDocs: {
          description: 'Documentação específica',
          url: '/docs/owner-app'
        }
      },
      {
        name: 'Authentication',
        description: '🔐 Sistema de autenticação e autorização',
        externalDocs: {
          description: 'Guia de autenticação',
          url: '/docs/authentication'
        }
      }
    ],
    
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/waiter-app.js',
    './routes/deliverer-app.js', 
    './routes/owner-app.js',
    './middleware/app-auth.js',
    './routes/auth.js'
  ]
};

const specs = swaggerJsdoc(options);

// Configuração personalizada do Swagger UI
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      // Adicionar headers personalizados se necessário
      request.headers['X-API-Version'] = '2.0';
      return request;
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-bottom: 2rem }
    .swagger-ui .scheme-container { background: #f7f7f7; padding: 1rem; border-radius: 5px }
    .swagger-ui .info .title { color: #dc2626; font-size: 2.5rem }
    .swagger-ui .info .description { font-size: 1.1rem; line-height: 1.6 }
    .swagger-ui .opblock { margin: 1rem 0; border-radius: 8px }
    .swagger-ui .opblock.opblock-post { border-color: #10b981 }
    .swagger-ui .opblock.opblock-get { border-color: #3b82f6 }
    .swagger-ui .opblock.opblock-patch { border-color: #f59e0b }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444 }
  `,
  customSiteTitle: 'Sistema Pizzaria - API Documentation',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};