import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/pedido.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class PedidoCard extends StatefulWidget {
  final Pedido pedido;
  final VoidCallback? onTap;
  final VoidCallback? onStatusChanged;

  const PedidoCard({
    super.key,
    required this.pedido,
    this.onTap,
    this.onStatusChanged,
  });

  @override
  State<PedidoCard> createState() => _PedidoCardState();
}

class _PedidoCardState extends State<PedidoCard> {
  bool _isUpdating = false;

  Future<void> _atualizarStatus(String novoStatus) async {
    setState(() {
      _isUpdating = true;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      
      String? entregadorNome;
      if (novoStatus == 'saiu_para_entrega' && widget.pedido.entregador == null) {
        entregadorNome = authService.userName;
      }

      final success = await apiService.atualizarStatus(
        widget.pedido.id,
        novoStatus,
        entregadorNome: entregadorNome,
      );

      if (success) {
        widget.onStatusChanged?.call();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Status atualizado para: ${_getStatusDisplayName(novoStatus)}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
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

  String _getStatusDisplayName(String status) {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'preparando':
        return 'Preparando';
      case 'saiu_para_entrega':
        return 'Saiu para Entrega';
      case 'entregue':
        return 'Entregue';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }

  Widget _buildQuickActionButton(String status, String label, Color color, IconData icon) {
    return Expanded(
      child: ElevatedButton.icon(
        onPressed: _isUpdating ? null : () => _atualizarStatus(status),
        icon: Icon(icon, size: 16),
        label: Text(
          label,
          style: const TextStyle(fontSize: 11),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: widget.onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cabeçalho
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pedido #${widget.pedido.id.substring(0, 8)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.pedido.cliente.nome,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: widget.pedido.statusColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.pedido.statusDisplayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Informações principais
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.red),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      widget.pedido.endereco,
                      style: const TextStyle(fontSize: 13),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              Row(
                children: [
                  const Icon(Icons.phone, size: 16, color: Colors.green),
                  const SizedBox(width: 4),
                  Text(
                    widget.pedido.cliente.telefone,
                    style: const TextStyle(fontSize: 13),
                  ),
                  const Spacer(),
                  const Icon(Icons.monetization_on, size: 16, color: Colors.orange),
                  const SizedBox(width: 4),
                  Text(
                    'R\$ ${widget.pedido.total.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),

              if (widget.pedido.entregador != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.delivery_dining, size: 16, color: Colors.blue),
                    const SizedBox(width: 4),
                    Text(
                      'Entregador: ${widget.pedido.entregador}',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),

              // Ações rápidas
              if (_isUpdating)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(8.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else
                _buildQuickActions(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    switch (widget.pedido.status) {
      case 'pendente':
        return Row(
          children: [
            _buildQuickActionButton(
              'preparando',
              'Iniciar Preparo',
              Colors.blue,
              Icons.restaurant,
            ),
            const SizedBox(width: 8),
            _buildQuickActionButton(
              'cancelado',
              'Cancelar',
              Colors.red,
              Icons.cancel,
            ),
          ],
        );
      
      case 'preparando':
        return Row(
          children: [
            _buildQuickActionButton(
              'saiu_para_entrega',
              'Saiu para Entrega',
              Colors.purple,
              Icons.motorcycle,
            ),
            const SizedBox(width: 8),
            _buildQuickActionButton(
              'cancelado',
              'Cancelar',
              Colors.red,
              Icons.cancel,
            ),
          ],
        );
      
      case 'saiu_para_entrega':
        return _buildQuickActionButton(
          'entregue',
          'Marcar como Entregue',
          Colors.green,
          Icons.check_circle,
        );
      
      default:
        return Container(
          padding: const EdgeInsets.all(8),
          child: Text(
            'Toque para ver detalhes',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
        );
    }
  }
}