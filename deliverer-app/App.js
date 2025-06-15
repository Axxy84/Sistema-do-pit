import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// Services
import { AuthService } from './src/services/AuthService';
import { DatabaseService } from './src/services/DatabaseService';
import { NotificationService } from './src/services/NotificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import { AuthContext } from './src/context/AuthContext';
import { OrderContext } from './src/context/OrderContext';

// Theme
import { theme } from './src/utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Configuração das abas principais
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Início' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{ title: 'Pedidos' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: 'Histórico' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deliverer, setDeliverer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Inicializar banco de dados local
      await DatabaseService.initialize();
      
      // Verificar se há token salvo
      const token = await AuthService.getStoredToken();
      if (token) {
        // Validar token com o servidor
        const userData = await AuthService.validateToken(token);
        if (userData) {
          setDeliverer(userData.entregador);
          setIsAuthenticated(true);
          
          // Configurar notificações
          await NotificationService.initialize();
        }
      }
      
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (telefone, senha) => {
    try {
      const result = await AuthService.login(telefone, senha);
      
      if (result.success) {
        setDeliverer(result.entregador);
        setIsAuthenticated(true);
        
        // Configurar notificações após login
        await NotificationService.initialize();
        
        Toast.show({
          type: 'success',
          text1: 'Login realizado!',
          text2: `Bem-vindo, ${result.entregador.nome}`,
        });
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setDeliverer(null);
      setIsAuthenticated(false);
      setOrders([]);
      setAvailableOrders([]);
      
      Toast.show({
        type: 'info',
        text1: 'Logout realizado',
        text2: 'Até logo!',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Context values
  const authContextValue = {
    isAuthenticated,
    deliverer,
    login,
    logout,
  };

  const orderContextValue = {
    orders,
    setOrders,
    availableOrders,
    setAvailableOrders,
  };

  if (isLoading) {
    // Você pode criar uma tela de loading aqui
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AuthContext.Provider value={authContextValue}>
        <OrderContext.Provider value={orderContextValue}>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            
            {isAuthenticated ? (
              <Stack.Navigator>
                <Stack.Screen 
                  name="MainTabs" 
                  component={MainTabs}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="OrderDetail" 
                  component={OrderDetailScreen}
                  options={{ 
                    title: 'Detalhes do Pedido',
                    headerStyle: { backgroundColor: theme.colors.primary },
                    headerTintColor: '#fff',
                  }}
                />
              </Stack.Navigator>
            ) : (
              <Stack.Navigator>
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            )}
            
            <Toast />
          </NavigationContainer>
        </OrderContext.Provider>
      </AuthContext.Provider>
    </PaperProvider>
  );
}