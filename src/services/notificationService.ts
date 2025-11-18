import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Serviço de notificações push via Firebase Cloud Messaging (FCM)
 * Este serviço registra o token FCM do dispositivo e o salva no Firestore
 * para que o Firebase possa enviar notificações push quando necessário
 */

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registra o dispositivo para receber notificações push
 * Solicita permissões e obtém o token FCM
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Verificar se é um dispositivo físico (emulators não suportam FCM)
    // Para Expo, podemos verificar via Platform
    if (Platform.OS === 'web') {
      console.warn('Notificações push não suportadas na web');
      return null;
    }

    // Solicitar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      return null;
    }

    // Obter o token FCM
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '32cd120f-7040-43bf-bb32-e6c43ca2ecc7', // Do seu app.json
    });

    const token = tokenData.data;

    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat-updates', {
        name: 'Atualizações de Chat',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#88c9bf',
        sound: 'default',
        description: 'Notificações de novos chats e mensagens',
      });
    }

    // Salvar token no Firestore
    const user = auth.currentUser;
    if (user && token) {
      await saveTokenToFirestore(user.uid, token);
    }

    console.log('✅ Token FCM registrado com sucesso:', token);
    return token;
  } catch (error) {
    console.error('❌ Erro ao registrar notificações:', error);
    return null;
  }
}

/**
 * Salva o token FCM no perfil do usuário no Firestore
 */
async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
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
      console.warn('⚠️ Documento do usuário não encontrado. Token não foi salvo.');
    }
  } catch (error) {
    console.error('❌ Erro ao salvar token no Firestore:', error);
  }
}

/**
 * Remove o token FCM quando o usuário faz logout
 */
export async function removeTokenFromFirestore(userId: string): Promise<void> {
  try {
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
  }
}

/**
 * Configura listeners para notificações recebidas e interações
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): { remove: () => void } {
  // Listener para notificações recebidas quando o app está em foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📬 Notificação recebida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener para quando o usuário toca na notificação
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('👆 Notificação tocada:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    }
  );

  // Retornar função para remover listeners
  return {
    remove: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
}

