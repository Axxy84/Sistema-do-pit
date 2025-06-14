import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/pedido.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.0.105:3001/api';
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  // Autenticação
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signin'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        if (data['token'] != null) {
          setToken(data['token']);
        }
        return {
          'success': true,
          'token': data['token'],
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['error'] ?? 'Erro no login',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Erro de conexão: $e',
      };
    }
  }

  // Listar pedidos de delivery
  Future<List<Pedido>> getPedidosDelivery() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/delivery/pedidos-delivery'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> pedidosJson = data['pedidos'] ?? [];
        return pedidosJson.map((json) => Pedido.fromJson(json)).toList();
      } else {
        throw Exception('Erro ao carregar pedidos: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro de conexão: $e');
    }
  }

  // Buscar pedido específico
  Future<Pedido> getPedido(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/delivery/pedido/$id'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Pedido.fromJson(data['pedido']);
      } else {
        throw Exception('Pedido não encontrado');
      }
    } catch (e) {
      throw Exception('Erro de conexão: $e');
    }
  }

  // Filtrar pedidos por status
  Future<List<Pedido>> getPedidosPorStatus(String status) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/delivery/pedidos-por-status/$status'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> pedidosJson = data['pedidos'] ?? [];
        return pedidosJson.map((json) => Pedido.fromJson(json)).toList();
      } else {
        throw Exception('Erro ao carregar pedidos por status');
      }
    } catch (e) {
      throw Exception('Erro de conexão: $e');
    }
  }

  // Atualizar status do pedido
  Future<bool> atualizarStatus(String pedidoId, String novoStatus, {String? entregadorNome}) async {
    try {
      final body = <String, dynamic>{
        'status': novoStatus,
      };
      
      if (entregadorNome != null) {
        body['entregador_nome'] = entregadorNome;
      }

      final response = await http.put(
        Uri.parse('$baseUrl/delivery/pedido/$pedidoId/status'),
        headers: _headers,
        body: json.encode(body),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Estatísticas do dia
  Future<Map<String, dynamic>> getEstatisticas() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/delivery/estatisticas'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['estatisticas_hoje'] ?? {};
      } else {
        throw Exception('Erro ao carregar estatísticas');
      }
    } catch (e) {
      throw Exception('Erro de conexão: $e');
    }
  }
}