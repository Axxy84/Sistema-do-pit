# 📱 App Flutter - Entregadores

## 🎯 Funcionalidades do App

### 🔐 Autenticação
- Login do entregador
- Token JWT para autenticação
- Perfil do entregador

### 📋 Gestão de Entregas
- Lista de pedidos para entrega
- Detalhes do pedido (endereço, itens, valor)
- Status da entrega (aceito, saiu, entregue)
- Histórico de entregas

### 🗺️ Navegação
- Integração com GPS/Maps
- Rota otimizada para entrega
- Localização em tempo real

## 🔌 Conexão com API Existente

### Endpoints Necessários

#### Autenticação
```http
POST /api/auth/signin
Content-Type: application/json
{
  "email": "entregador@pizzaria.com",
  "password": "senha123"
}
```

#### Listar Pedidos para Entrega
```http
GET /api/orders?tipo_pedido=delivery&status=pendente
Authorization: Bearer {token}
```

#### Aceitar Entrega
```http
PUT /api/orders/{id}/aceitar
Authorization: Bearer {token}
{
  "entregador_nome": "João Silva"
}
```

#### Atualizar Status
```http
PUT /api/orders/{id}/status
Authorization: Bearer {token}
{
  "status_pedido": "saiu_para_entrega"
}
```

## 📱 Estrutura do Flutter

### Dependências
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^0.13.5           # Requisições HTTP
  provider: ^6.0.5        # Gerenciamento de estado
  geolocator: ^9.0.2      # GPS
  google_maps_flutter: ^2.2.1  # Mapas
  shared_preferences: ^2.0.15  # Armazenamento local
```

### Estrutura de Pastas
```
lib/
├── models/
│   ├── pedido.dart
│   ├── entregador.dart
│   └── auth.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   └── location_service.dart
├── screens/
│   ├── login_screen.dart
│   ├── pedidos_screen.dart
│   ├── detalhes_pedido_screen.dart
│   └── mapa_screen.dart
├── widgets/
│   ├── pedido_card.dart
│   └── status_button.dart
└── main.dart
```

## 💻 Exemplo de Código

### Model do Pedido
```dart
class Pedido {
  final String id;
  final String clienteId;
  final String endereco;
  final double total;
  final String status;
  final String? entregadorNome;
  final List<ItemPedido> itens;

  Pedido({
    required this.id,
    required this.clienteId,
    required this.endereco,
    required this.total,
    required this.status,
    this.entregadorNome,
    required this.itens,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    return Pedido(
      id: json['id'],
      clienteId: json['cliente_id'],
      endereco: json['endereco_entrega'],
      total: json['total'].toDouble(),
      status: json['status_pedido'],
      entregadorNome: json['entregador_nome'],
      itens: [], // Parse dos itens
    );
  }
}
```

### Service de API
```dart
class ApiService {
  static const String baseUrl = 'http://192.168.0.105:3001/api';
  String? _token;

  Future<List<Pedido>> getPedidosParaEntrega() async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders?tipo_pedido=delivery&status=pendente'),
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Pedido.fromJson(json)).toList();
    }
    throw Exception('Erro ao carregar pedidos');
  }

  Future<void> aceitarEntrega(String pedidoId, String entregadorNome) async {
    await http.put(
      Uri.parse('$baseUrl/orders/$pedidoId/aceitar'),
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'entregador_nome': entregadorNome}),
    );
  }
}
```

### Tela de Pedidos
```dart
class PedidosScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Entregas Disponíveis')),
      body: FutureBuilder<List<Pedido>>(
        future: ApiService().getPedidosParaEntrega(),
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            return ListView.builder(
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                return PedidoCard(pedido: snapshot.data![index]);
              },
            );
          }
          return CircularProgressIndicator();
        },
      ),
    );
  }
}
```

## 🔧 Modificações Necessárias no Backend

### 1. Endpoints Específicos para Entregadores
```javascript
// Listar pedidos para entrega
app.get('/api/deliveries/available', authenticateToken, async (req, res) => {
  const query = `
    SELECT p.*, c.nome as cliente_nome, c.telefone 
    FROM pedidos p 
    JOIN clientes c ON p.cliente_id = c.id 
    WHERE p.tipo_pedido = 'delivery' 
    AND p.status_pedido IN ('pendente', 'preparando')
    ORDER BY p.created_at
  `;
  // ... implementação
});

// Aceitar entrega
app.put('/api/deliveries/:id/accept', authenticateToken, async (req, res) => {
  const { entregador_nome } = req.body;
  const query = `
    UPDATE pedidos 
    SET entregador_nome = $1, status_pedido = 'aceito' 
    WHERE id = $2
  `;
  // ... implementação
});
```

### 2. WebSocket para Atualizações em Tempo Real
```javascript
const io = require('socket.io')(server);

// Quando novo pedido é criado
io.emit('novo_pedido_delivery', pedidoData);

// Quando status é atualizado
io.emit('status_atualizado', { pedidoId, novoStatus });
```

## 📊 Banco de Dados - Ajustes

### Tabela Entregadores (se não existir)
```sql
CREATE TABLE IF NOT EXISTS entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    veiculo VARCHAR(50),
    status VARCHAR(20) DEFAULT 'disponivel',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Campos Adicionais na Tabela Pedidos
```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS 
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  tempo_estimado INTEGER,
  data_saida TIMESTAMP,
  data_entrega TIMESTAMP;
```

## 🚀 Implementação Rápida

### 1. Criar projeto Flutter
```bash
flutter create delivery_app
cd delivery_app
```

### 2. Adicionar dependências
```bash
flutter pub add http provider geolocator google_maps_flutter
```

### 3. Configurar API
- Usar IP: `192.168.0.105:3001`
- Mesmo JWT do sistema
- Mesmas tabelas e estrutura

## 🎯 Roadmap de Desenvolvimento

### Fase 1 (MVP)
- [ ] Login do entregador
- [ ] Lista de pedidos disponíveis
- [ ] Aceitar/recusar entregas
- [ ] Atualizar status

### Fase 2
- [ ] Integração com GPS
- [ ] Mapas e rotas
- [ ] Notificações push

### Fase 3
- [ ] Chat com cliente
- [ ] Foto de comprovação
- [ ] Relatórios de entrega

## 💡 Vantagens
- ✅ Backend já pronto
- ✅ Banco estruturado
- ✅ API funcionando
- ✅ Autenticação implementada
- ✅ Rápido desenvolvimento
- ✅ Integração perfeita com sistema atual 