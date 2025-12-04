import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';

let notifee: any = null;
try {
  if (Platform.OS !== 'web') {
    notifee = require('@notifee/react-native').default;
  }
} catch (error) {
  console.warn('⚠️ Notifee não disponível:', error);
}

interface NotificationData {
  type?: string;
  chatId?: string;
  animalName?: string;
  animalId?: string;
  [key: string]: any;
}

interface RemoteMessage {
  data?: NotificationData;
  notification?: {
    title?: string;
    body?: string;
  };
}

let navigationRef: NavigationContainerRefWithCurrent<any> | null = null;

/**
 * Define a referência de navegação para ser usada pelo serviço
 */
export function setNavigationRef(ref: NavigationContainerRefWithCurrent<any> | null) {
  navigationRef = ref;
}

/**
 * Configura handlers do Notifee para navegação quando notificações forem tocadas
 * (apenas para foreground - background é tratado pelo FCM)
 */
export function setupNotifeeNavigationHandlers() {
  if (Platform.OS === 'web' || !notifee) {
    return;
  }

  // Handler para notificações tocadas quando app está em foreground
  notifee.onForegroundEvent(async ({ type, detail }: any) => {
    if (type === 1) { // PRESS - notificação foi tocada
      const notification = detail.notification;
      const data = notification?.data;
      if (data) {
        const remoteMessage = {
          data: data,
          notification: {
            title: notification?.title,
            body: notification?.body,
          },
        };
        await handleNotificationNavigation(remoteMessage);
      }
    }
  });
}

/**
 * Busca o título do chat baseado no chatId
 */
async function getChatTitle(chatId: string): Promise<string> {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const animalName = chatData?._chatContext?.animalName;
      if (animalName) {
        return `Sobre ${animalName}`;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar título do chat:', error);
  }
  return 'Chat';
}

/**
 * Navega para o chat quando uma notificação é tocada
 */
export async function handleNotificationNavigation(remoteMessage: RemoteMessage | null) {
  if (!remoteMessage || !remoteMessage.data) {
    console.log('⚠️ Notificação sem dados válidos');
    return;
  }

  const data = remoteMessage.data;
  const chatId = data.chatId;

  // Verificar se há chatId
  if (!chatId) {
    console.log('⚠️ Notificação sem chatId');
    return;
  }

  // Verificar se usuário está autenticado
  const user = auth.currentUser;
  if (!user) {
    console.log('⚠️ Usuário não autenticado, não é possível navegar');
    return;
  }

  // Aguardar um pouco para garantir que a navegação está pronta
  await new Promise(resolve => setTimeout(resolve, 500));

  // Determinar o título do chat
  let chatTitle = 'Chat';
  if (data.animalName) {
    chatTitle = `Sobre ${data.animalName}`;
  } else {
    chatTitle = await getChatTitle(chatId);
  }

  // Navegar para o chat
  if (navigationRef?.isReady()) {
    try {
      console.log('📱 Navegando para o chat:', { chatRoomID: chatId, chatTitle });
      navigationRef.navigate('AppDrawer', {
        screen: 'IndividualChat',
        params: {
          chatRoomID: chatId,
          chatTitle: chatTitle,
        },
      });
    } catch (error) {
      console.error('❌ Erro ao navegar para o chat:', error);
    }
  } else {
    console.log('⚠️ Navegação ainda não está pronta, tentando novamente em 1 segundo...');
    // Tentar novamente após 1 segundo
    setTimeout(async () => {
      if (navigationRef?.isReady()) {
        try {
          console.log('📱 Navegando para o chat (segunda tentativa):', { chatRoomID: chatId, chatTitle });
          navigationRef.navigate('AppDrawer', {
            screen: 'IndividualChat',
            params: {
              chatRoomID: chatId,
              chatTitle: chatTitle,
            },
          });
        } catch (error) {
          console.error('❌ Erro ao navegar para o chat:', error);
        }
      }
    }, 1000);
  }
}

