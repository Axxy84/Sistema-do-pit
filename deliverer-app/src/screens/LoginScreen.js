import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme, globalStyles } from '../utils/theme';

export default function LoginScreen() {
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!telefone.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(telefone.trim(), senha);
      
      if (!result.success) {
        Alert.alert('Erro no Login', result.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Formata como (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 2) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      }
      if (numbers.length > 7) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      }
      return formatted;
    }
    return text;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setTelefone(formatted);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.primary, '#b71c1c']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons 
                name="bicycle-outline" 
                size={60} 
                color={theme.colors.onPrimary} 
              />
            </View>
            <Title style={styles.title}>Entregador PIT</Title>
            <Paragraph style={styles.subtitle}>
              Sistema de Delivery
            </Paragraph>
          </View>

          {/* Formulário de Login */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Fazer Login</Title>
              
              <TextInput
                label="Telefone"
                value={telefone}
                onChangeText={handlePhoneChange}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="(11) 99999-9999"
                maxLength={15}
                left={<TextInput.Icon icon="phone" />}
                disabled={loading}
              />

              <TextInput
                label="Senha"
                value={senha}
                onChangeText={setSenha}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Sua senha"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              {/* Credenciais de teste */}
              <View style={styles.testCredentials}>
                <Text style={styles.testTitle}>Credenciais de Teste:</Text>
                <Text style={styles.testText}>Telefone: 11999999999</Text>
                <Text style={styles.testText}>Senha: 123456</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              PIT STOP PIZZARIA © 2025
            </Text>
            <Text style={styles.versionText}>
              Versão 1.0.0
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.onPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  card: {
    marginBottom: theme.spacing.xl,
    ...theme.shadows.large,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  buttonContent: {
    height: 50,
  },
  testCredentials: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginTop: theme.spacing.sm,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  testText: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontFamily: 'monospace',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  versionText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    opacity: 0.6,
    marginTop: theme.spacing.xs,
  },
});