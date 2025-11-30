import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin
// No Firebase Cloud Functions, usa Application Default Credentials automaticamente
// O Service Account JSON só é necessário para testes locais (emulators)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function que envia notificação push quando um novo chat é criado
 * Trigger: onCreate na coleção 'chats'
 * 
 * Quando um usuário demonstra interesse em adotar um animal, esta função
 * envia uma notificação para o dono do animal informando que alguém
 * demonstrou interesse.
 */
export const onNewChatCreated = onDocumentCreated(
  'chats/{chatId}',
  async (event) => {
    try {
      const chatData = event.data?.data();
      const chatId = event.params.chatId;

      console.log('🔔 Novo chat criado:', chatId);

      if (!chatData) {
        console.log('⚠️ Dados do chat não encontrados');
        return null;
      }

      // Verificar se o chat tem participantes
      if (!chatData.participants || !Array.isArray(chatData.participants)) {
        console.log('⚠️ Chat sem participantes válidos');
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
        console.log('⚠️ Não foi possível determinar o destinatário da notificação');
        return null;
      }

      console.log('👤 Destinatário:', recipientId);
      console.log('👤 Interessado:', interestedId);
      console.log('🐾 Animal:', animalName);

      // Buscar dados do usuário destinatário no Firestore
      const userDoc = await admin.firestore().collection('usuários').doc(recipientId).get();

      if (!userDoc.exists) {
        console.log('⚠️ Usuário destinatário não encontrado no Firestore');
        return null;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.log('⚠️ Usuário não possui token FCM registrado');
        return null;
      }

      // Buscar nome do usuário interessado (para personalizar a notificação)
      let interestedUserName = 'Alguém';
      if (interestedId) {
        try {
          const interestedUserDoc = await admin.firestore().collection('usuários').doc(interestedId).get();
          if (interestedUserDoc.exists) {
            const interestedUserData = interestedUserDoc.data();
            interestedUserName = interestedUserData?.username || interestedUserData?.nome || 'Alguém';
          }
        } catch (error) {
          console.error('❌ Erro ao buscar nome do usuário interessado:', error);
        }
      }

      console.log('📝 Preparando notificação...');
      console.log('   Título: Nova conversa iniciada! 🐾');
      console.log('   Mensagem:', `${interestedUserName} demonstrou interesse em adotar ${animalName}`);

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
      console.log('📤 Enviando notificação via FCM...');
      const response = await admin.messaging().send(message);
      console.log('✅ Notificação enviada com sucesso:', response);

      return response;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return null;
    }
  }
);

