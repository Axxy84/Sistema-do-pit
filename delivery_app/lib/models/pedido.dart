class Cliente {
  final String nome;
  final String telefone;
  final String? email;

  Cliente({
    required this.nome,
    required this.telefone,
    this.email,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) {
    return Cliente(
      nome: json['nome'] ?? '',
      telefone: json['telefone'] ?? '',
      email: json['email'],
    );
  }
}

class ItemPedido {
  final String id;
  final String produtoNome;
  final int quantidade;
  final double precoUnitario;
  final double subtotal;

  ItemPedido({
    required this.id,
    required this.produtoNome,
    required this.quantidade,
    required this.precoUnitario,
    required this.subtotal,
  });

  factory ItemPedido.fromJson(Map<String, dynamic> json) {
    return ItemPedido(
      id: json['id'].toString(),
      produtoNome: json['produto_nome'] ?? '',
      quantidade: json['quantidade'] ?? 0,
      precoUnitario: (json['preco_unitario'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
    );
  }
}

class Pedido {
  final String id;
  final double total;
  final String endereco;
  final String status;
  final String? entregador;
  final DateTime? dataPedido;
  final String? observacoes;
  final double taxaEntrega;
  final String? formaPagamento;
  final Cliente cliente;
  final List<ItemPedido> itens;

  Pedido({
    required this.id,
    required this.total,
    required this.endereco,
    required this.status,
    this.entregador,
    this.dataPedido,
    this.observacoes,
    required this.taxaEntrega,
    this.formaPagamento,
    required this.cliente,
    required this.itens,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    return Pedido(
      id: json['id'].toString(),
      total: (json['total'] ?? 0).toDouble(),
      endereco: json['endereco'] ?? '',
      status: json['status'] ?? 'pendente',
      entregador: json['entregador'],
      dataPedido: json['data_pedido'] != null 
          ? DateTime.tryParse(json['data_pedido'].toString())
          : null,
      observacoes: json['observacoes'],
      taxaEntrega: (json['taxa_entrega'] ?? 0).toDouble(),
      formaPagamento: json['forma_pagamento'],
      cliente: Cliente.fromJson(json['cliente'] ?? {}),
      itens: (json['itens'] as List<dynamic>?)
          ?.map((item) => ItemPedido.fromJson(item))
          .toList() ?? [],
    );
  }

  String get statusDisplayName {
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

  Color get statusColor {
    switch (status) {
      case 'pendente':
        return Colors.orange;
      case 'preparando':
        return Colors.blue;
      case 'saiu_para_entrega':
        return Colors.purple;
      case 'entregue':
        return Colors.green;
      case 'cancelado':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}