import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/pedido.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../widgets/pedido_card.dart';
import 'detalhes_pedido_screen.dart';

class PedidosScreen extends StatefulWidget {
  const PedidosScreen({super.key});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  List<Pedido> _pedidos = [];
  bool _isLoading = false;
  String _filtroAtual = 'todos';

  final List<String> _statusFiltros = [
    'todos',
    'pendente',
    'preparando',
    'saiu_para_entrega',
    'entregue',
  ];

  final Map<String, String> _statusLabels = {
    'todos': 'Todos',
    'pendente': 'Pendentes',
    'preparando': 'Preparando',
    'saiu_para_entrega': 'Em Entrega',
    'entregue': 'Entregues',
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _statusFiltros.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _carregarPedidos();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {
        _filtroAtual = _statusFiltros[_tabController.index];
      });
      _carregarPedidos();
    }
  }

  Future<void> _carregarPedidos() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      List<Pedido> pedidos;

      if (_filtroAtual == 'todos') {
        pedidos = await apiService.getPedidosDelivery();
      } else {
        pedidos = await apiService.getPedidosPorStatus(_filtroAtual);
      }

      setState(() {
        _pedidos = pedidos;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar pedidos: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _logout() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.logout();
    
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  void _abrirDetalhesPedido(Pedido pedido) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => DetalhesPedidoScreen(pedido: pedido),
      ),
    ).then((_) {
      // Recarregar lista quando voltar dos detalhes
      _carregarPedidos();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Entregas'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _carregarPedidos,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') {
                _logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    const Icon(Icons.logout, color: Colors.red),
                    const SizedBox(width: 8),
                    Text('Sair (${authService.userName})'),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: _statusFiltros.map((status) => 
            Tab(text: _statusLabels[status])
          ).toList(),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : _pedidos.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _carregarPedidos,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _pedidos.length,
                    itemBuilder: (context, index) {
                      final pedido = _pedidos[index];
                      return PedidoCard(
                        pedido: pedido,
                        onTap: () => _abrirDetalhesPedido(pedido),
                        onStatusChanged: () => _carregarPedidos(),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _carregarPedidos,
        backgroundColor: Colors.red,
        child: const Icon(Icons.refresh, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.delivery_dining,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'Nenhum pedido encontrado',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _filtroAtual == 'todos' 
                ? 'Não há pedidos de delivery no momento'
                : 'Não há pedidos com status "${_statusLabels[_filtroAtual]}"',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _carregarPedidos,
            icon: const Icon(Icons.refresh),
            label: const Text('Atualizar'),
          ),
        ],
      ),
    );
  }
}