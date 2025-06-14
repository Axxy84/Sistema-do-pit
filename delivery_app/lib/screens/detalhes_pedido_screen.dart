import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/pedido.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class DetalhesPedidoScreen extends StatefulWidget {
  final Pedido pedido;

  const DetalhesPedidoScreen({super.key, required this.pedido});

  @override
  State<DetalhesPedidoScreen> createState() => _DetalhesPedidoScreenState();
}

class _DetalhesPedidoScreenState extends State<DetalhesPedidoScreen> {
  late Pedido _pedido;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _pedido = widget.pedido;
  }

  Future<void> _atualizarStatus(String novoStatus) async {
    setState(() {
      _isUpdating = true;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      
      String? entregadorNome;
      if (novoStatus == 'saiu_para_entrega' && _pedido.entregador == null) {
        entregadorNome = authService.userName;
      }

      final success = await apiService.atualizarStatus(
        _pedido.id,
        novoStatus,
        entregadorNome: entregadorNome,
      );

      if (success) {
        setState(() {
          _pedido = Pedido(
            id: _pedido.id,
            total: _pedido.total,
            endereco: _pedido.endereco,
            status: novoStatus,
            entregador: entregadorNome ?? _pedido.entregador,
            dataPedido: _pedido.dataPedido,
            observacoes: _pedido.observacoes,
            taxaEntrega: _pedido.taxaEntrega,
            formaPagamento: _pedido.formaPagamento,
            cliente: _pedido.cliente,
            itens: _pedido.itens,
          );
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Status atualizado para: ${_pedido.statusDisplayName}'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Erro ao atualizar status'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  Widget _buildStatusButton(String status, String label, Color color) {
    final isCurrentStatus = _pedido.status == status;
    
    return Expanded(
      child: ElevatedButton(
        onPressed: isCurrentStatus || _isUpdating 
            ? null 
            : () => _atualizarStatus(status),
        style: ElevatedButton.styleFrom(
          backgroundColor: isCurrentStatus ? color : Colors.grey[300],
          foregroundColor: isCurrentStatus ? Colors.white : Colors.black87,
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 12),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Pedido #${_pedido.id.substring(0, 8)}'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status atual
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _pedido.statusColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: Colors.white,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _pedido.statusDisplayName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_pedido.entregador != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Entregador: ${_pedido.entregador}',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Informações do cliente
            _buildInfoCard(
              'Cliente',
              Icons.person,
              [
                'Nome: ${_pedido.cliente.nome}',
                'Telefone: ${_pedido.cliente.telefone}',
                if (_pedido.cliente.email != null) 'Email: ${_pedido.cliente.email}',
              ],
            ),
            const SizedBox(height: 16),

            // Endereço de entrega
            _buildInfoCard(
              'Endereço de Entrega',
              Icons.location_on,
              [_pedido.endereco],
            ),
            const SizedBox(height: 16),

            // Itens do pedido
            _buildItensCard(),
            const SizedBox(height: 16),

            // Valores
            _buildValoresCard(),
            const SizedBox(height: 16),

            // Observações
            if (_pedido.observacoes != null && _pedido.observacoes!.isNotEmpty) ...[
              _buildInfoCard(
                'Observações',
                Icons.note,
                [_pedido.observacoes!],
              ),
              const SizedBox(height: 16),
            ],

            // Ações de status
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Atualizar Status',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    if (_isUpdating)
                      const Center(
                        child: CircularProgressIndicator(),
                      )
                    else
                      Column(
                        children: [
                          Row(
                            children: [
                              _buildStatusButton('preparando', 'Preparando', Colors.blue),
                              const SizedBox(width: 8),
                              _buildStatusButton('saiu_para_entrega', 'Saiu para\nEntrega', Colors.purple),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              _buildStatusButton('entregue', 'Entregue', Colors.green),
                              const SizedBox(width: 8),
                              _buildStatusButton('cancelado', 'Cancelado', Colors.red),
                            ],
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String titulo, IconData icon, List<String> infos) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.red),
                const SizedBox(width: 8),
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...infos.map((info) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                info,
                style: const TextStyle(fontSize: 16),
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildItensCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.restaurant_menu, color: Colors.red),
                SizedBox(width: 8),
                Text(
                  'Itens do Pedido',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._pedido.itens.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.produtoNome,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          'Qtd: ${item.quantidade} x R\$ ${item.precoUnitario.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    'R\$ ${item.subtotal.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildValoresCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.monetization_on, color: Colors.red),
                SizedBox(width: 8),
                Text(
                  'Resumo do Pagamento',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Subtotal:'),
                Text('R\$ ${(_pedido.total - _pedido.taxaEntrega).toStringAsFixed(2)}'),
              ],
            ),
            const SizedBox(height: 4),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Taxa de Entrega:'),
                Text('R\$ ${_pedido.taxaEntrega.toStringAsFixed(2)}'),
              ],
            ),
            const Divider(height: 20),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total:',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'R\$ ${_pedido.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
            
            if (_pedido.formaPagamento != null) ...[
              const SizedBox(height: 8),
              Text(
                'Forma de Pagamento: ${_pedido.formaPagamento}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}