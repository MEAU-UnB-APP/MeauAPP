import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Import condicional do React Native Firebase (só funciona em Android/iOS)
let messaging: any = null;
let notifee: any = null;
try {
  if (Platform.OS !== 'web') {
    messaging = require('@react-native-firebase/messaging').default;
    // Importar notifee para mostrar notificações em foreground
    notifee = require('@notifee/react-native').default;
  }
} catch (error) {
  console.warn('⚠️ React Native Firebase ou Notifee não disponível:', error);
}

/**
 * Serviço de notificações push via Firebase Cloud Messaging (FCM) V1
 * SOLUÇÃO SIMPLES: Deixa o FCM mostrar notificações na barra automaticamente
 */

/**
 * Solicita permissão de notificações do usuário
 * @returns {Promise<boolean>} true se permissão foi concedida, false caso contrário
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.warn('⚠️ Notificações push não suportadas nesta plataforma');
      return false;
    }

    console.log('🔐 Solicitando permissão de notificações...');
    
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Permissão de notificação concedida');
    } else {
      console.warn('⚠️ Permissão de notificação negada');
    }

    return enabled;
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão de notificações:', error);
    return false;
  }
}

/**
 * Obtém o token FCM do dispositivo
 * @returns {Promise<string | null>} Token FCM ou null se não conseguir obter
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.warn('⚠️ Token FCM não disponível nesta plataforma');
      return null;
    }

    console.log('🎫 Obtendo token FCM...');

    // Verificar permissão antes de obter token
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('⚠️ Sem permissão para obter token FCM');
      return null;
    }

    // Obter token
    const token = await messaging().getToken();
    
    if (token) {
      console.log('✅ Token FCM obtido com sucesso:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ Token FCM não disponível');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao obter token FCM:', error);
    return null;
  }
}

/**
 * Salva o token FCM no Firestore no documento do usuário
 * @param {string} userId - ID do usuário
 * @param {string} token - Token FCM do dispositivo
 */
export async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    console.log('💾 Salvando token FCM no Firestore...');
    console.log('👤 User ID:', userId);

    const userDocRef = doc(db, 'usuários', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // Atualizar documento existente
      await setDoc(
        userDocRef,
        {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString(),
          notificationEnabled: true,
        },
        { merge: true }
      );
      console.log('✅ Token FCM salvo no Firestore');
    } else {
      // Tentar criar documento mesmo que não exista (usando merge)
      await setDoc(
        userDocRef,
        {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString(),
          notificationEnabled: true,
        },
        { merge: true }
      );
      console.log('✅ Token FCM salvo criando documento no Firestore');
    }
  } catch (error) {
    console.error('❌ Erro ao salvar token no Firestore:', error);
    throw error;
  }
}

/**
 * Remove o token FCM do Firestore quando usuário faz logout
 * @param {string} userId - ID do usuário
 */
export async function removeTokenFromFirestore(userId: string): Promise<void> {
  try {
    console.log('🗑️ Removendo token FCM do Firestore...');
    console.log('👤 User ID:', userId);

    const userDocRef = doc(db, 'usuários', userId);
    await setDoc(
      userDocRef,
      {
        fcmToken: null,
        notificationEnabled: false,
      },
      { merge: true }
    );
    console.log('✅ Token FCM removido do Firestore');
  } catch (error) {
    console.error('❌ Erro ao remover token do Firestore:', error);
    throw error;
  }
}

/**
 * Registra o dispositivo para receber notificações push
 * Obtém token FCM e salva no Firestore
 * @returns {Promise<string | null>} Token FCM ou null se não conseguir
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log('🔔 Iniciando registro de notificações push...');

    // Verificar plataforma
    if (Platform.OS === 'web') {
      console.warn('⚠️ Notificações push não suportadas na web');
      return null;
    }

    // Verificar se usuário está autenticado
    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ Usuário não autenticado. Token não será salvo.');
      return null;
    }

    // Obter token FCM
    const token = await getFCMToken();
    if (!token) {
      return null;
    }

    // Salvar token no Firestore
    await saveTokenToFirestore(user.uid, token);

    console.log('✅ Registro de notificações concluído com sucesso');
    return token;
  } catch (error) {
    console.error('❌ Erro ao registrar notificações:', error);
    return null;
  }
}

/**
 * Inicializa os canais de notificação no Android
 * Deve ser chamado uma vez quando o app inicia
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !notifee) {
    return;
  }

  try {
    console.log('📱 Inicializando canais de notificação...');

    // Canal para mensagens
    await notifee.createChannel({
      id: 'mensagens',
      name: 'Mensagens',
      description: 'Notificações de novas mensagens',
      sound: 'default',
      importance: 4, // High importance
      vibration: true,
      vibrationPattern: [300, 500],
    });

    // Canal para novos chats
    await notifee.createChannel({
      id: 'novos_chats',
      name: 'Novos Chats',
      description: 'Notificações de novos chats iniciados',
      sound: 'default',
      importance: 4,
      vibration: true,
      vibrationPattern: [300, 500],
    });

    // Canal para adoções
    await notifee.createChannel({
      id: 'adocoes',
      name: 'Adoções',
      description: 'Notificações sobre status de adoções',
      sound: 'default',
      importance: 4,
      vibration: true,
      vibrationPattern: [300, 500],
    });

    console.log('✅ Canais de notificação inicializados');
  } catch (error: any) {
    console.error('❌ Erro ao inicializar canais de notificação:', error);
  }
}

/**
 * Configura handlers para notificações recebidas
 * Usa Notifee para mostrar notificações em foreground
 * @param {Function} onNotificationReceived - Callback quando notificação é recebida em foreground
 * @param {Function} onNotificationOpened - Callback quando usuário toca na notificação
 */
export function setupNotificationHandlers(
  onNotificationReceived?: (remoteMessage: any) => void,
  onNotificationOpened?: (remoteMessage: any) => void
): () => void {
  if (Platform.OS === 'web' || !messaging) {
    console.warn('⚠️ Handlers de notificação não disponíveis nesta plataforma');
    return () => {}; // Retorna função vazia para cleanup
  }

  console.log('📱 Configurando handlers de notificações...');

  // Inicializar canais de notificação no Android
  if (Platform.OS === 'android' && notifee) {
    initializeNotificationChannels();
  }

  // Handler para notificações recebidas quando app está em foreground
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
    console.log('📬 Notificação recebida em foreground:', remoteMessage);
    
    // Usar Notifee para mostrar notificações quando o app está em foreground
    if (remoteMessage.notification && notifee) {
      try {
        const notification = remoteMessage.notification;
        const data = remoteMessage.data || {};

        // Criar canal de notificação no Android (necessário para Android 8+)
        let channelId = 'mensagens'; // Canal padrão para mensagens
        
        // Determinar o canal baseado no tipo de notificação
        if (data.type === 'novo_chat') {
          channelId = 'novos_chats';
        } else if (data.type === 'nova_mensagem') {
          channelId = 'mensagens';
        } else if (data.type === 'adocao_confirmada' || data.type === 'adocao_recusada') {
          channelId = 'adocoes';
        }

        // Canais já devem estar criados pela função initializeNotificationChannels
        // Mas criar aqui também como fallback caso não tenham sido criados

        // Exibir notificação local usando Notifee
        await notifee.displayNotification({
          title: notification.title || 'Nova Notificação',
          body: notification.body || '',
          data: data,
          android: {
            channelId: channelId,
            smallIcon: 'ic_notification',
            pressAction: {
              id: 'default',
            },
            sound: 'default',
            vibrationPattern: [300, 500],
            importance: 4, // High importance
          },
        });

        console.log('✅ Notificação exibida em foreground usando Notifee');
      } catch (error: any) {
        console.error('❌ Erro ao exibir notificação com Notifee:', error);
        console.warn('⚠️ Tentando mostrar notificação de forma alternativa...');
      }
    } else if (!remoteMessage.notification) {
      console.warn('⚠️ Notificação sem campo notification - não será exibida');
    } else if (!notifee) {
      console.warn('⚠️ Notifee não disponível - notificação pode não aparecer em foreground');
    }

    // Chamar callback se fornecido
    if (onNotificationReceived) {
      onNotificationReceived(remoteMessage);
    }
  });

  // Handler para quando usuário toca na notificação e abre o app
  const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage: any) => {
    console.log('👆 Notificação tocada (app em background):', remoteMessage);
    if (onNotificationOpened) {
      onNotificationOpened(remoteMessage);
    }
  });

  // Verificar se app foi aberto através de notificação (app estava fechado)
  messaging()
    .getInitialNotification()
    .then((remoteMessage: any) => {
      if (remoteMessage) {
        console.log('👆 App aberto através de notificação (app estava fechado):', remoteMessage);
        if (onNotificationOpened) {
          onNotificationOpened(remoteMessage);
        }
      }
    });

  // Retornar função para remover listeners
  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
  };
}

/**
 * Verifica se as notificações estão habilitadas
 * @returns {Promise<boolean>} true se habilitado, false caso contrário
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' || !messaging) {
      return false;
    }

    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('❌ Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Função para forçar uma notificação de teste
 * Útil para debug
 */
export async function testNotificationInBar() {
  try {
    console.log('🧪 Testando notificação na barra...');
    
    // Esta função é apenas para debug - não é necessária para o funcionamento
    if (Platform.OS === 'android') {
      console.log('📱 Android: Notificações devem aparecer na barra automaticamente');
      console.log('📱 Verifique a BARRA superior do seu celular');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}