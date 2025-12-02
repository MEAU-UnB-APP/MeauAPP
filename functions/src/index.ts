// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * Cloud Function HTTP para enviar notificações push
 * Esta função pode ser chamada diretamente do seu app React Native
 */
exports.sendNotification = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Tratar requisição OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('📬 Recebendo solicitação de notificação:', {
      method: req.method,
      body: req.body
    });

    const { token, notification, data } = req.body;

    // Validação básica
    if (!token) {
      console.error('❌ Token FCM não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'Token FCM é obrigatório' 
      });
    }

    // Configurar payload da notificação
    const payload = {
      token: token,
      notification: {
        title: notification?.title || 'Nova Notificação',
        body: notification?.body || 'Você tem uma nova notificação',
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: data?.type || 'default',
          sound: notification?.sound || 'default',
          icon: 'ic_notification',
          color: data?.type === 'adocao_confirmada' ? '#4CAF50' : 
                 data?.type === 'adocao_recusada' ? '#f44336' : '#2196F3',
          tag: data?.type || 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: notification?.sound || 'default',
            badge: 1
          }
        }
      }
    };

    console.log('📤 Enviando payload:', payload);

    // Enviar notificação usando Firebase Admin SDK
    const response = await admin.messaging().send(payload);
    
    console.log('✅ Notificação enviada com sucesso:', response);

    return res.status(200).json({
      success: true,
      message: 'Notificação enviada com sucesso',
      messageId: response,
      data: {
        type: data?.type,
        title: notification?.title,
        body: notification?.body
      }
    });

  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

/**
 * Cloud Function que envia notificação push quando um novo chat é criado
 * Trigger: onCreate na coleção 'chats'
 */
exports.onNewChatCreated = functions.firestore
  .document('chats/{chatId}')
  .onCreate(async (snap, context) => {
    try {
      const chatData = snap.data();
      const chatId = context.params.chatId;

      console.log('🔔 Novo chat criado:', chatId);

      if (!chatData) {
        console.log('⚠️ Dados do chat não encontrados');
        return null;
      }

      // Ignorar chats de teste
      if (chatData._testNotification || chatData._delayedTest) {
        console.log('Ignorando chat de teste');
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
      const message = {
        token: fcmToken,
        notification: {
          title: 'Nova conversa iniciada! 🐾',
          body: `${interestedUserName} demonstrou interesse em adotar ${animalName}`,
        },
        data: {
          type: 'novo_chat',
          chatId: chatId,
          animalId: chatContext.animalId || '',
          animalName: animalName,
          timestamp: new Date().toISOString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'novos_chats',
            sound: 'default',
            icon: 'ic_notification',
            color: '#88c9bf',
            tag: 'new_chat'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              category: 'NEW_CHAT'
            }
          }
        }
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
  });

/**
 * Função automática: Notificar nova mensagem no chat
 * É acionada automaticamente quando uma nova mensagem é criada
 */
exports.notifyNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const messageData = snap.data();
      const { chatId, messageId } = context.params;

      console.log('💬 Nova mensagem detectada:', { chatId, messageId });

      // Ignorar mensagens do sistema
      if (messageData.user?._id === 'system') {
        console.log('Ignorando mensagem do sistema');
        return null;
      }

      // Ignorar mensagens de teste
      if (messageData._testNotification) {
        console.log('Ignorando mensagem de teste');
        return null;
      }

      // Buscar informações do chat
      const chatRef = admin.firestore().collection('chats').doc(chatId);
      const chatSnap = await chatRef.get();
      
      if (!chatSnap.exists) {
        console.log('Chat não encontrado');
        return null;
      }

      const chatData = chatSnap.data();
      const participants = chatData?.participants || [];
      
      // Encontrar o receptor (usuário que não enviou a mensagem)
      const senderId = messageData.user?._id;
      const receiverId = participants.find(id => id !== senderId);

      if (!receiverId) {
        console.log('Receptor não encontrado');
        return null;
      }

      // Buscar informações do receptor
      const receiverRef = admin.firestore().collection('usuários').doc(receiverId);
      const receiverSnap = await receiverRef.get();
      
      if (!receiverSnap.exists) {
        console.log('Receptor não encontrado no banco de dados');
        return null;
      }

      const receiverData = receiverSnap.data();
      const fcmToken = receiverData?.fcmToken;

      if (!fcmToken) {
        console.log('Receptor não tem token FCM');
        return null;
      }

      // Buscar informações do remetente
      const senderRef = admin.firestore().collection('usuários').doc(senderId);
      const senderSnap = await senderRef.get();
      const senderName = senderSnap.exists ? 
        (senderSnap.data()?.nome || senderSnap.data()?.username || 'Alguém') : 'Alguém';

      // Truncar mensagem se for muito longa
      const messageText = messageData.text || '';
      const truncatedMessage = messageText.length > 50 ? 
        messageText.substring(0, 50) + '...' : messageText;

      // Configurar notificação
      const payload = {
        token: fcmToken,
        notification: {
          title: '💬 Nova Mensagem',
          body: `${senderName}: ${truncatedMessage}`,
        },
        data: {
          type: 'nova_mensagem',
          screenToOpen: 'ChatScreen',
          chatId: chatId,
          senderId: senderId,
          timestamp: new Date().toISOString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'mensagens',
            sound: 'default',
            icon: 'ic_notification',
            color: '#2196F3',
            tag: `chat_${chatId}`
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      console.log('📤 Enviando notificação de nova mensagem para:', receiverId);
      const response = await admin.messaging().send(payload);
      console.log('✅ Notificação de mensagem enviada:', response);

      // Atualizar contador de notificações não lidas
      await chatRef.update({
        [`unread_${receiverId}`]: admin.firestore.FieldValue.increment(1),
        lastNotificationAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return response;

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de mensagem:', error);
      return null;
    }
  });

/**
 * Função automática: Notificar sobre status de adoção
 * É acionada automaticamente quando um registro de adoção é criado
 */
exports.notifyAdoptionStatus = functions.firestore
  .document('adocoes/{adocaoId}')
  .onCreate(async (snap, context) => {
    try {
      const adoptionData = snap.data();
      const { adocaoId } = context.params;

      console.log('🐾 Nova adoção detectada:', { adocaoId, status: adoptionData.status });

      const status = adoptionData.status;
      
      // Apenas processar status específicos
      if (!['confirmada', 'recusada'].includes(status)) {
        console.log('Status não suportado:', status);
        return null;
      }

      const receiverId = adoptionData.interessadoId;
      const senderName = adoptionData.donoName || 'O dono';
      const animalName = adoptionData.animalName || 'o animal';
      const chatId = adoptionData.chatId;
      const animalId = adoptionData.animalId;

      if (!receiverId) {
        console.log('ID do receptor não encontrado');
        return null;
      }

      // Buscar informações do receptor
      const receiverRef = admin.firestore().collection('usuários').doc(receiverId);
      const receiverSnap = await receiverRef.get();
      
      if (!receiverSnap.exists) {
        console.log('Receptor não encontrado');
        return null;
      }

      const receiverData = receiverSnap.data();
      const fcmToken = receiverData?.fcmToken;

      if (!fcmToken) {
        console.log('Receptor não tem token FCM');
        return null;
      }

      let notificationConfig = {};
      
      if (status === 'confirmada') {
        notificationConfig = {
          title: '✅ Adoção Confirmada!',
          body: `${senderName} confirmou sua adoção do ${animalName}!`,
          sound: 'default'
        };
      } else if (status === 'recusada') {
        notificationConfig = {
          title: '❌ Adoção Não Aprovada',
          body: `${senderName} não aprovou sua solicitação para ${animalName}.`,
          sound: 'default'
        };
      }

      // Configurar payload
      const payload = {
        token: fcmToken,
        notification: {
          title: notificationConfig.title,
          body: notificationConfig.body,
        },
        data: {
          type: status === 'confirmada' ? 'adocao_confirmada' : 'adocao_recusada',
          screenToOpen: 'ChatScreen',
          chatId: chatId,
          animalId: animalId,
          timestamp: new Date().toISOString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'adocoes',
            sound: notificationConfig.sound,
            icon: 'ic_notification',
            color: status === 'confirmada' ? '#4CAF50' : '#f44336',
            tag: 'adoption_status'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notificationConfig.sound,
              badge: 1,
              category: status === 'confirmada' ? 'ADOPTION_CONFIRMED' : 'ADOPTION_DENIED'
            }
          }
        }
      };

      console.log('📤 Enviando notificação de adoção:', status);
      const response = await admin.messaging().send(payload);
      console.log('✅ Notificação de adoção enviada:', response);

      return response;

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de adoção:', error);
      return null;
    }
  });

/**
 * Função para marcar outras adoções como recusadas quando uma adoção é confirmada
 */
exports.autoDenyOtherAdoptions = functions.firestore
  .document('adocoes/{adocaoId}')
  .onCreate(async (snap, context) => {
    try {
      const adoptionData = snap.data();
      const { adocaoId } = context.params;

      // Apenas processar se for uma adoção confirmada
      if (adoptionData.status !== 'confirmada') {
        return null;
      }

      const animalId = adoptionData.animalId;
      const confirmedChatId = adoptionData.chatId;

      if (!animalId) {
        console.log('Animal ID não encontrado');
        return null;
      }

      console.log(`🔍 Buscando outras adoções pendentes para o animal: ${animalId}`);

      // Buscar todas as outras adoções pendentes para o mesmo animal
      const adoptionsRef = admin.firestore().collection('adocoes');
      const querySnapshot = await adoptionsRef
        .where('animalId', '==', animalId)
        .where('status', '==', 'pendente')
        .get();

      if (querySnapshot.empty) {
        console.log('Nenhuma outra adoção pendente encontrada');
        return null;
      }

      console.log(`📝 Encontradas ${querySnapshot.size} adoções pendentes para marcar como recusadas`);

      const batch = admin.firestore().batch();
      const updates = [];

      // Marcar cada adoção pendente como recusada automaticamente
      querySnapshot.forEach((doc) => {
        const adoptionDoc = doc.data();
        
        // Pular a adoção que foi confirmada
        if (doc.id === adocaoId) {
          return;
        }

        // Atualizar status para recusada
        batch.update(doc.ref, {
          status: 'recusada',
          reason: 'Animal adotado por outra pessoa',
          autoDenied: true,
          deniedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        updates.push({
          adoptionId: doc.id,
          interessadoId: adoptionDoc.interessadoId,
          interessadoName: adoptionDoc.interessadoName
        });
      });

      // Executar todas as atualizações em lote
      await batch.commit();

      // Enviar notificações para cada interessado recusado
      for (const update of updates) {
        try {
          // Buscar token FCM do interessado
          const userRef = admin.firestore().collection('usuários').doc(update.interessadoId);
          const userSnap = await userRef.get();
          
          if (userSnap.exists) {
            const userData = userSnap.data();
            const fcmToken = userData?.fcmToken;

            if (fcmToken) {
              const payload = {
                token: fcmToken,
                notification: {
                  title: '❌ Adoção Não Disponível',
                  body: `${adoptionData.animalName || 'O animal'} foi adotado por outra pessoa.`,
                },
                data: {
                  type: 'adocao_recusada',
                  animalId: animalId,
                  animalName: adoptionData.animalName,
                  timestamp: new Date().toISOString(),
                  click_action: 'FLUTTER_NOTIFICATION_CLICK'
                },
                android: {
                  priority: 'high',
                  notification: {
                    channel_id: 'adocoes',
                    sound: 'default',
                    icon: 'ic_notification',
                    color: '#f44336'
                  }
                }
              };

              await admin.messaging().send(payload);
              console.log(`📤 Notificação de recusa automática enviada para: ${update.interessadoName}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao enviar notificação para ${update.interessadoId}:`, error);
        }
      }

      console.log(`✅ ${updates.length} adoções pendentes foram marcadas como recusadas automaticamente`);

      return {
        success: true,
        autoDeniedCount: updates.length
      };

    } catch (error) {
      console.error('❌ Erro ao processar recusas automáticas:', error);
      return null;
    }
  });

/**
 * Função para teste de notificações
 */
exports.testNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, type = 'test' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // Buscar token FCM do usuário
    const userRef = admin.firestore().collection('usuários').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userSnap.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({ error: 'Usuário não tem token FCM' });
    }

    const notificationConfigs = {
      test: {
        title: '🧪 Teste de Notificação',
        body: 'Esta é uma notificação de teste do sistema!',
        sound: 'default'
      },
      nova_mensagem: {
        title: '💬 Nova Mensagem (Teste)',
        body: 'João: Olá! Como vai o animal?',
        sound: 'default'
      },
      adocao_confirmada: {
        title: '✅ Adoção Confirmada (Teste)',
        body: 'Maria confirmou sua adoção do Rex!',
        sound: 'default'
      },
      adocao_recusada: {
        title: '❌ Adoção Recusada (Teste)',
        body: 'Pedro não aprovou sua solicitação para o Luna.',
        sound: 'default'
      }
    };

    const config = notificationConfigs[type] || notificationConfigs.test;

    const payload = {
      token: fcmToken,
      notification: {
        title: config.title,
        body: config.body,
      },
      data: {
        type: type,
        test: 'true',
        timestamp: new Date().toISOString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'testes',
          sound: config.sound,
          icon: 'ic_notification',
          color: type === 'adocao_confirmada' ? '#4CAF50' : 
                 type === 'adocao_recusada' ? '#f44336' : '#2196F3'
        }
      }
    };

    const response = await admin.messaging().send(payload);
    
    return res.status(200).json({
      success: true,
      message: 'Notificação de teste enviada',
      messageId: response,
      type: type
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Função para enviar notificação de lembrete
 */
exports.sendReminderNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ 
        error: 'userId, title e body são obrigatórios' 
      });
    }

    // Buscar token FCM do usuário
    const userRef = admin.firestore().collection('usuários').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userSnap.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({ error: 'Usuário não tem token FCM' });
    }

    const payload = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: {
        type: 'lembrete',
        ...data,
        timestamp: new Date().toISOString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'lembretes',
          sound: 'default',
          icon: 'ic_notification',
          color: '#FF9800'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(payload);
    
    return res.status(200).json({
      success: true,
      message: 'Notificação de lembrete enviada',
      messageId: response
    });

  } catch (error) {
    console.error('❌ Erro ao enviar lembrete:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});