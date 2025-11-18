import * as functions from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function que envia notificação push quando um novo chat é criado
 * Trigger: onCreate na coleção 'chats'
 */
export const onNewChatCreated = onDocumentCreated(
  'chats/{chatId}',
  async (event) => {
    try {
      const chatData = event.data?.data();
      const chatId = event.params.chatId;

      if (!chatData) {
        console.log('Dados do chat não encontrados');
        return null;
      }

      // Verificar se o chat tem participantes
      if (!chatData.participants || !Array.isArray(chatData.participants)) {
        console.log('Chat sem participantes válidos');
        return null;
      }

      // Obter informações do contexto do chat
      const chatContext = chatData._chatContext || {};
      const animalName = chatContext.animalName || 'o animal';
      const interestedId = chatContext.interestedId;
      const donoId = chatContext.donoId;

      // Determinar quem receberá a notificação (o dono do animal)
      const recipientId = donoId;

      if (!recipientId) {
        console.log('Não foi possível determinar o destinatário da notificação');
        return null;
      }

      // Buscar dados do usuário destinatário no Firestore
      const userDoc = await admin.firestore().collection('usuários').doc(recipientId).get();

      if (!userDoc.exists) {
        console.log('Usuário destinatário não encontrado');
        return null;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.log('Usuário não possui token FCM registrado');
        return null;
      }

      // Buscar nome do usuário interessado (opcional, para personalizar a notificação)
      let interestedUserName = 'Alguém';
      if (interestedId) {
        try {
          const interestedUserDoc = await admin.firestore().collection('usuários').doc(interestedId).get();
          if (interestedUserDoc.exists) {
            const interestedUserData = interestedUserDoc.data();
            interestedUserName = interestedUserData?.username || interestedUserData?.nome || 'Alguém';
          }
        } catch (error) {
          console.error('Erro ao buscar nome do usuário interessado:', error);
        }
      }

      // Preparar payload da notificação
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: 'Nova conversa iniciada! 🐾',
          body: `${interestedUserName} demonstrou interesse em adotar ${animalName}`,
        },
        data: {
          type: 'new_chat',
          chatId: chatId,
          animalId: chatContext.animalId || '',
          animalName: animalName,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // Para React Native/Expo
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'chat-updates',
            sound: 'default',
            icon: 'ic_notification',
            color: '#88c9bf',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Enviar notificação
      const response = await admin.messaging().send(message);
      console.log('✅ Notificação enviada com sucesso:', response);

      return response;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return null;
    }
  });

/**
 * Cloud Function que envia notificação quando uma nova mensagem é enviada
 * (Opcional - se você quiser notificar sobre mensagens também)
 */
export const onNewMessage = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    try {
      const messageData = event.data?.data();
      const chatId = event.params.chatId;

      if (!messageData) {
        return null;
      }

      const senderId = messageData?.user?._id;

      // Não enviar notificação se for mensagem do sistema
      if (messageData?.system || senderId === 'system') {
        return null;
      }

      // Buscar dados do chat
      const chatDoc = await admin.firestore().collection('chats').doc(chatId).get();
      
      if (!chatDoc.exists) {
        return null;
      }

      const chatData = chatDoc.data();
      const participants = chatData?.participants || [];

      // Encontrar o destinatário (participante que não é o remetente)
      const recipientId = participants.find((id: string) => id !== senderId);

      if (!recipientId) {
        return null;
      }

      // Buscar token FCM do destinatário
      const userDoc = await admin.firestore().collection('usuários').doc(recipientId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        return null;
      }

      // Buscar nome do remetente
      let senderName = 'Alguém';
      if (senderId) {
        try {
          const senderDoc = await admin.firestore().collection('usuários').doc(senderId).get();
          if (senderDoc.exists) {
            const senderData = senderDoc.data();
            senderName = senderData?.username || senderData?.nome || 'Alguém';
          }
        } catch (error) {
          console.error('Erro ao buscar nome do remetente:', error);
        }
      }

      const messageText = messageData?.text || 'Nova mensagem';

      const notificationMessage: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: senderName,
          body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        },
        data: {
          type: 'new_message',
          chatId: chatId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'chat-updates',
            sound: 'default',
            icon: 'ic_notification',
            color: '#88c9bf',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(notificationMessage);
      console.log('✅ Notificação de mensagem enviada:', response);

      return response;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de mensagem:', error);
      return null;
    }
  });