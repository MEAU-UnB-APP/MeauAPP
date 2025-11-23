import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Serviço de notificações push para adoções
 */

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registra o dispositivo para receber notificações push
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
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
      projectId: '32cd120f-7040-43bf-bb32-e6c43ca2ecc7',
    });

    const token = tokenData.data;

    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('adoption-updates', {
        name: 'Atualizações de Adoção',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'default',
        description: 'Notificações sobre status de adoção',
      });
    }

    // SALVAR TOKEN NO FIRESTORE (ESSENCIAL)
    await saveTokenToFirestore(token);

    console.log('✅ Token FCM registrado com sucesso:', token);
    return token;
  } catch (error) {
    console.error('❌ Erro ao registrar notificações:', error);
    return null;
  }
}

/**
 * SALVAR TOKEN NO FIRESTORE - FUNÇÃO ESSENCIAL
 */
async function saveTokenToFirestore(token: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ Usuário não autenticado. Token não salvo.');
      return;
    }

    const userDocRef = doc(db, 'usuários', user.uid);
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
  } catch (error) {
    console.error('❌ Erro ao salvar token no Firestore:', error);
  }
}

/**
 * REMOVER TOKEN NO LOGOUT - IMPORTANTE PARA SEGURANÇA
 */
export async function removeTokenFromFirestore(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, 'usuários', user.uid);
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
 * LISTENERS PARA NOTIFICAÇÕES - ESSENCIAIS
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): { remove: () => void } {
  
  // Listener para notificações recebidas em foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📬 Notificação recebida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener para quando usuário toca na notificação
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('👆 Notificação tocada:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    }
  );

  return {
    remove: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
}

/**
 * ENVIAR NOTIFICAÇÃO DE ADOÇÃO CONFIRMADA
 */
export async function sendAdoptionConfirmationNotification(
  interestedUserId: string, 
  petName: string,
  ownerName: string
): Promise<void> {
  try {
    // Buscar o token FCM do usuário interessado
    const userDocRef = doc(db, 'usuários', interestedUserId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      console.warn('⚠️ Usuário interessado não encontrado');
      return;
    }
    
    const userData = userDocSnap.data();
    const fcmToken = userData?.fcmToken;
    
    if (!fcmToken) {
      console.warn('⚠️ Token FCM do usuário interessado não encontrado');
      return;
    }
    
    console.log('📤 Enviando notificação para:', fcmToken);
    
    // Enviar notificação via Expo Push Notifications
    const message = {
      to: fcmToken,
      sound: 'default',
      title: '🎉 Adoção Confirmada!',
      body: `Parabéns! Você adotou ${petName}. ${ownerName} confirmou sua adoção.`,
      data: {
        type: 'adoption_confirmed',
        petName,
        ownerName,
        timestamp: new Date().toISOString(),
      },
      channelId: Platform.OS === 'android' ? 'adoption-updates' : undefined,
    };
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.data?.status === 'ok') {
      console.log('✅ Notificação de adoção enviada com sucesso');
    } else {
      console.error('❌ Erro ao enviar notificação:', responseData);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de adoção:', error);
  }
}