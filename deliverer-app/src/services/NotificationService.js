import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configurar como as notificações devem ser exibidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Verificar se é um dispositivo físico
      if (!Device.isDevice) {
        console.warn('Notificações push só funcionam em dispositivos físicos');
        return false;
      }

      // Solicitar permissões de notificação
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permissão de notificação negada');
        return false;
      }

      // Obter token de push notification
      this.expoPushToken = await this.getExpoPushToken();
      console.log('📱 Token de notificação obtido:', this.expoPushToken);

      // Configurar listeners
      this.setupNotificationListeners();

      // Configurar canal de notificação para Android
      if (Device.osName === 'Android') {
        await this.setupAndroidNotificationChannel();
      }

      return true;

    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
      return false;
    }
  }

  async getExpoPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      return token.data;
    } catch (error) {
      console.error('Erro ao obter token de push:', error);
      return null;
    }
  }

  setupNotificationListeners() {
    // Listener para notificações recebidas enquanto o app está em foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notificação recebida:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener para quando o usuário toca na notificação
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificação tocada:', response);
      this.handleNotificationResponse(response);
    });
  }

  handleNotificationReceived(notification) {
    // Aqui você pode adicionar lógica personalizada para quando uma notificação é recebida
    const { title, body, data } = notification.request.content;
    
    // Por exemplo, se for um novo pedido, você pode atualizar a lista automaticamente
    if (data?.type === 'new_order') {
      // Disparar evento personalizado ou chamar função de atualização
      console.log('Novo pedido recebido via notificação');
    }
  }

  handleNotificationResponse(response) {
    // Lógica para quando o usuário toca na notificação
    const { data } = response.notification.request.content;
    
    if (data?.type === 'new_order' && data?.orderId) {
      // Navegar para detalhes do pedido
      console.log('Navegando para pedido:', data.orderId);
      // Aqui você pode usar navigation para navegar para a tela específica
    }
  }

  async setupAndroidNotificationChannel() {
    await Notifications.setNotificationChannelAsync('new-orders', {
      name: 'Novos Pedidos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d32f2f',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('order-updates', {
      name: 'Atualizações de Pedidos',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#d32f2f',
      sound: 'default',
    });
  }

  // Enviar notificação local
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Enviar imediatamente
      });
    } catch (error) {
      console.error('Erro ao enviar notificação local:', error);
    }
  }

  // Notificação para novo pedido
  async notifyNewOrder(orderData) {
    const title = '🆕 Novo pedido disponível!';
    const body = `${orderData.cliente_nome} - R$ ${orderData.total}\n📍 ${orderData.endereco}`;
    
    await this.sendLocalNotification(title, body, {
      type: 'new_order',
      orderId: orderData.id,
      channelId: 'new-orders'
    });
  }

  // Notificação para atualização de pedido
  async notifyOrderUpdate(orderData, message) {
    const title = '🔄 Atualização de pedido';
    const body = message || `Pedido ${orderData.id} foi atualizado`;
    
    await this.sendLocalNotification(title, body, {
      type: 'order_update',
      orderId: orderData.id,
      channelId: 'order-updates'
    });
  }

  // Notificação de lembrete
  async scheduleReminder(title, body, delay = 60000, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          seconds: Math.floor(delay / 1000),
        },
      });
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
    }
  }

  // Cancelar todas as notificações agendadas
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }

  // Limpar badge do app (iOS)
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Erro ao limpar badge:', error);
    }
  }

  // Obter notificações pendentes
  async getPendingNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao obter notificações pendentes:', error);
      return [];
    }
  }

  // Cleanup - remover listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  // Obter token para envio ao servidor
  getExpoPushToken() {
    return this.expoPushToken;
  }
}

export const NotificationService = new NotificationService();