import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _token;
  Map<String, dynamic>? _user;
  final ApiService _apiService = ApiService();

  bool get isLoggedIn => _isLoggedIn;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  String get userName => _user?['nome'] ?? 'Entregador';

  AuthService() {
    _loadTokenFromStorage();
  }

  Future<void> _loadTokenFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final userJson = prefs.getString('user_data');
      
      if (token != null && userJson != null) {
        _token = token;
        _user = Map<String, dynamic>.from(
          Uri.splitQueryString(userJson)
        );
        _isLoggedIn = true;
        _apiService.setToken(token);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Erro ao carregar token: $e');
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final result = await _apiService.login(email, password);
      
      if (result['success'] == true) {
        _token = result['token'];
        _user = result['user'];
        _isLoggedIn = true;
        
        // Salvar no storage
        await _saveTokenToStorage();
        
        notifyListeners();
        return true;
      } else {
        debugPrint('Erro no login: ${result['message']}');
        return false;
      }
    } catch (e) {
      debugPrint('Erro ao fazer login: $e');
      return false;
    }
  }

  Future<void> _saveTokenToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_token != null) {
        await prefs.setString('auth_token', _token!);
      }
      if (_user != null) {
        await prefs.setString('user_data', _user.toString());
      }
    } catch (e) {
      debugPrint('Erro ao salvar token: $e');
    }
  }

  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_data');
      
      _token = null;
      _user = null;
      _isLoggedIn = false;
      
      notifyListeners();
    } catch (e) {
      debugPrint('Erro ao fazer logout: $e');
    }
  }

  // Verificar se o token ainda é válido
  Future<bool> isTokenValid() async {
    if (_token == null) return false;
    
    try {
      // Tenta fazer uma requisição simples para verificar se o token funciona
      await _apiService.getEstatisticas();
      return true;
    } catch (e) {
      // Se falhar, remove o token e faz logout
      await logout();
      return false;
    }
  }
}