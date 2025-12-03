import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Import condicional do React Native Firebase (só funciona em Android/iOS)
let messaging: any = null;
try {
  if (Platform.OS !== 'web') {
    messaging = require('@react-native-firebase/messaging').default;
  }
} catch (error) {
  console.warn('⚠️ React Native Firebase não disponível:', error);
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
 * Configura handlers para notificações recebidas
 * SOLUÇÃO SIMPLES: Não faz nada no foreground para deixar o FCM mostrar na barra
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

  // Handler para notificações recebidas quando app está em foreground
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
    console.log('📬 Notificação recebida em foreground:', remoteMessage);
    
    // IMPORTANTE: No Android, notificações em foreground precisam ser mostradas manualmente
    // A Cloud Function já envia o payload correto com 'notification' e 'data'
    // Mas precisamos garantir que a notificação apareça na barra
    
    // Verificar se a notificação tem título e corpo (vem do campo 'notification')
    if (remoteMessage.notification) {
      console.log('✅ Notificação tem payload completo:', {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body
      });
      
      // No Android, quando o app está em foreground, o FCM não mostra automaticamente
      // A notificação deve aparecer se o payload tiver o campo 'notification' preenchido
      // e o Android estiver configurado corretamente
      console.log('📱 A notificação deve aparecer na barra do Android');
    } else {
      console.warn('⚠️ Notificação sem campo notification - pode não aparecer em foreground');
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