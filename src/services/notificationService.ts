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
  console.log('🔔 Iniciando registro de notificações push...');
  
  try {
    // Verificar se é um dispositivo físico (emulators não suportam FCM)
    // Para Expo, podemos verificar via Platform
    if (Platform.OS === 'web') {
      console.warn('⚠️ Notificações push não suportadas na web');
      return null;
    }

    console.log('📱 Plataforma:', Platform.OS);

    // Solicitar permissões
    console.log('🔐 Verificando permissões de notificação...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Status atual da permissão:', existingStatus);
    
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('📢 Solicitando permissão de notificação ao usuário...');
      // Solicitar permissão - o sistema mostrará um diálogo nativo
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 Novo status da permissão:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permissão de notificação não concedida pelo usuário');
      console.warn('⚠️ Status:', finalStatus);
      console.warn('⚠️ O usuário precisará habilitar notificações nas configurações do dispositivo para receber notificações push');
      return null;
    }

    console.log('✅ Permissão de notificação concedida pelo usuário');

    // Obter o token FCM (Expo Push Token)
    console.log('🎫 Gerando token FCM...');
    let token: string | null = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '32cd120f-7040-43bf-bb32-e6c43ca2ecc7', // Do seu app.json
      });
      token = tokenData.data;
      console.log('✅ Token FCM gerado com sucesso');
    } catch (tokenError: any) {
      console.error('❌ Erro ao gerar token FCM:', tokenError);
      // Se der erro relacionado a Firebase/FCM, pode ser que precise configurar credenciais
      if (tokenError?.message?.includes('Firebase') || tokenError?.message?.includes('FCM')) {
        console.warn('⚠️ Credenciais FCM não configuradas. Veja: https://docs.expo.dev/push-notifications/fcm-credentials/');
        console.warn('⚠️ Notificações push podem não funcionar até configurar as credenciais no Expo.');
      }
      console.error('❌ Detalhes do erro:', tokenError.message);
      throw tokenError;
    }

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
    console.log('💾 Preparando para salvar token no Firestore...');
    const user = auth.currentUser;
    if (user) {
      console.log('👤 Usuário autenticado encontrado:', user.uid);
      if (token) {
        await saveTokenToFirestore(user.uid, token);
      } else {
        console.warn('⚠️ Token não disponível para salvar');
      }
    } else {
      console.warn('⚠️ Nenhum usuário autenticado encontrado. Token não será salvo.');
      console.warn('⚠️ O token será salvo quando o usuário fizer login.');
    }

    console.log('✅ Token FCM registrado com sucesso:', token);
    return token;
  } catch (error: any) {
    console.error('❌ Erro ao registrar notificações:', error);
    console.error('❌ Tipo do erro:', error?.constructor?.name);
    console.error('❌ Mensagem do erro:', error?.message);
    console.error('❌ Stack do erro:', error?.stack);
    return null;
  }
}

/**
 * Salva o token FCM no perfil do usuário no Firestore
 */
async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  console.log('💾 Tentando salvar token FCM no Firestore...');
  console.log('👤 User ID:', userId);
  console.log('🎫 Token:', token.substring(0, 20) + '...');
  
  try {
    const userDocRef = doc(db, 'usuários', userId);
    console.log('📄 Referência do documento criada');
    
    const userDocSnap = await getDoc(userDocRef);
    console.log('📄 Documento existe?', userDocSnap.exists());

    if (userDocSnap.exists()) {
      // Atualizar documento existente
      console.log('✏️ Atualizando documento existente...');
      await setDoc(
        userDocRef,
        {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString(),
          notificationEnabled: true,
        },
        { merge: true }
      );
      console.log('✅ Token FCM salvo no Firestore com sucesso!');
    } else {
      console.warn('⚠️ Documento do usuário não encontrado no Firestore.');
      console.warn('⚠️ User ID:', userId);
      console.warn('⚠️ Tentando criar documento com token...');
      
      // Tentar criar o documento mesmo que não exista
      try {
        await setDoc(
          userDocRef,
          {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString(),
            notificationEnabled: true,
          },
          { merge: true }
        );
        console.log('✅ Token FCM salvo criando novo documento!');
      } catch (createError: any) {
        console.error('❌ Erro ao criar documento com token:', createError);
        console.error('❌ Mensagem:', createError?.message);
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao salvar token no Firestore:', error);
    console.error('❌ Tipo do erro:', error?.constructor?.name);
    console.error('❌ Mensagem do erro:', error?.message);
    console.error('❌ Código do erro:', error?.code);
    throw error; // Re-throw para que o erro seja visível
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

