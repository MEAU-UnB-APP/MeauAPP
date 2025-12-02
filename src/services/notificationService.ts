// services/notificationService.js
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Função para enviar notificação de NOVA MENSAGEM (chat real)
 * Esta função é chamada quando um usuário envia uma mensagem no chat
 */
export const sendNewMessageNotification = async ({ chatRoomID, messageText, senderName }) => {
  console.log('💬 [sendNewMessageNotification] Iniciando notificação para chat real');
  
  try {
    const currentUser = auth.currentUser;
    console.log('💬 [1] Usuário atual (remetente):', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // 1. Buscar dados do chat para identificar o outro participante
    console.log('💬 [2] Buscando dados do chat:', chatRoomID);
    const chatDoc = await getDoc(doc(db, 'chats', chatRoomID));
    
    if (!chatDoc.exists()) {
      throw new Error('Chat não encontrado');
    }

    const chatData = chatDoc.data();
    console.log('💬 [3] Dados do chat encontrados');
    
    // 2. Identificar o outro participante (destinatário)
    const participants = Array.isArray(chatData?.participants) ? chatData.participants : [];
    const otherParticipantId = participants.find((id) => id !== currentUser.uid);
    
    if (!otherParticipantId) {
      throw new Error('Outro participante não encontrado no chat');
    }

    console.log('💬 [4] Destinatário identificado:', otherParticipantId);

    // 3. Buscar token FCM do destinatário
    console.log('💬 [5] Buscando token FCM do destinatário...');
    const recipientDoc = await getDoc(doc(db, 'usuários', otherParticipantId));
    
    if (!recipientDoc.exists()) {
      throw new Error('Destinatário não encontrado no Firestore');
    }

    const recipientData = recipientDoc.data();
    
    if (!recipientData?.fcmToken) {
      console.warn('⚠️ Destinatário não tem token FCM registrado');
      return {
        success: false,
        message: 'Destinatário não tem token FCM'
      };
    }

    console.log('💬 [6] Token FCM do destinatário encontrado');

    // 4. Criar mensagem de sistema para notificação
    console.log('💬 [7] Criando mensagem de sistema para notificação...');
    
    // Adicionar mensagem de sistema indicando notificação
    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    const systemMessageId = Date.now().toString() + '_notification';
    
    await addDoc(messagesRef, {
      _id: systemMessageId,
      text: `🔔 Notificação enviada para ${recipientData?.nome || 'usuário'}`,
      createdAt: serverTimestamp(),
      user: {
        _id: 'system',
        name: 'Sistema',
      },
      system: true,
      _notificationTrigger: true,
      _debug: {
        recipientId: otherParticipantId,
        notificationType: 'NEW_MESSAGE_REAL'
      }
    });

    // 5. Atualizar chat com última mensagem (já feito pelo IndividualChatScreen)
    console.log('💬 [8] Atualizando dados do chat para acionar Cloud Function...');
    
    await setDoc(doc(db, 'chats', chatRoomID), {
      lastMessage: messageText,
      lastMessageAt: serverTimestamp(),
      lastMessageSender: currentUser.uid,
      _lastNotificationTrigger: serverTimestamp(),
      _notificationPending: true
    }, { merge: true });

    console.log('✅ [9] Notificação de nova mensagem configurada!');
    console.log('🔔 Cloud Function será acionada automaticamente');

    return {
      success: true,
      message: 'Notificação de nova mensagem configurada com sucesso',
      recipientId: otherParticipantId,
      recipientName: recipientData?.nome || 'Usuário',
      chatRoomID
    };
    
  } catch (error) {
    console.error('❌ [ERROR] Erro ao configurar notificação de nova mensagem:', error);
    throw error;
  }
};

/**
 * Função para enviar notificação de ADOÇÃO APROVADA (chat real)
 * Esta função é chamada quando o dono aprova uma adoção
 */
export const sendAdoptionApprovedNotification = async ({ chatRoomID, animalName }) => {
  console.log('✅ [sendAdoptionApprovedNotification] Iniciando notificação de adoção aprovada');
  
  try {
    const currentUser = auth.currentUser;
    console.log('✅ [1] Usuário atual (dono que está aprovando):', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // 1. Buscar dados do chat
    console.log('✅ [2] Buscando dados do chat:', chatRoomID);
    const chatDoc = await getDoc(doc(db, 'chats', chatRoomID));
    
    if (!chatDoc.exists()) {
      throw new Error('Chat não encontrado');
    }

    const chatData = chatDoc.data();
    
    // 2. Identificar o adotante (interessado)
    const interestedId = chatData?._chatContext?.interestedId;
    if (!interestedId) {
      throw new Error('ID do interessado não encontrado no chat');
    }

    console.log('✅ [3] Adotante identificado:', interestedId);

    // 3. Buscar token FCM do adotante
    console.log('✅ [4] Buscando token FCM do adotante...');
    const adopterDoc = await getDoc(doc(db, 'usuários', interestedId));
    
    if (!adopterDoc.exists()) {
      throw new Error('Adotante não encontrado no Firestore');
    }

    const adopterData = adopterDoc.data();
    
    if (!adopterData?.fcmToken) {
      console.warn('⚠️ Adotante não tem token FCM registrado');
      return {
        success: false,
        message: 'Adotante não tem token FCM'
      };
    }

    console.log('✅ [5] Token FCM do adotante encontrado');

    // 4. Adicionar mensagem de sistema sobre adoção aprovada
    console.log('✅ [6] Criando mensagem de sistema para adoção aprovada...');
    
    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    const systemMessageId = Date.now().toString() + '_adoption_approved';
    
    await addDoc(messagesRef, {
      _id: systemMessageId,
      text: `🎉 ADOÇÃO APROVADA! ${animalName} foi oficialmente adotado(a)!`,
      createdAt: serverTimestamp(),
      user: {
        _id: 'system',
        name: 'Sistema',
      },
      system: true,
      _adoptionApproved: true,
      _debug: {
        adopterId: interestedId,
        notificationType: 'ADOPTION_APPROVED_REAL'
      }
    });

    // 5. Marcar chat como tendo adoção aprovada
    console.log('✅ [7] Marcando chat como adoção aprovada...');
    
    await setDoc(doc(db, 'chats', chatRoomID), {
      adoptionConfirmed: true,
      adoptionStatus: 'approved',
      lastMessage: `🎉 Adoção de ${animalName} aprovada!`,
      lastMessageAt: serverTimestamp(),
      _adoptionApprovedAt: serverTimestamp(),
      _notificationPending: true
    }, { merge: true });

    console.log('✅ [8] Notificação de adoção aprovada configurada!');
    console.log('🔔 Cloud Function será acionada automaticamente');

    return {
      success: true,
      message: 'Notificação de adoção aprovada configurada com sucesso',
      adopterId: interestedId,
      adopterName: adopterData?.nome || 'Adotante',
      animalName,
      chatRoomID
    };
    
  } catch (error) {
    console.error('❌ [ERROR] Erro ao configurar notificação de adoção aprovada:', error);
    throw error;
  }
};

/**
 * Função para enviar notificação de ADOÇÃO RECUSADA (chat real)
 * Esta função é chamada quando o dono recusa uma adoção
 */
export const sendAdoptionRejectedNotification = async ({ chatRoomID, animalName }) => {
  console.log('❌ [sendAdoptionRejectedNotification] Iniciando notificação de adoção recusada');
  
  try {
    const currentUser = auth.currentUser;
    console.log('❌ [1] Usuário atual (dono que está recusando):', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // 1. Buscar dados do chat
    console.log('❌ [2] Buscando dados do chat:', chatRoomID);
    const chatDoc = await getDoc(doc(db, 'chats', chatRoomID));
    
    if (!chatDoc.exists()) {
      throw new Error('Chat não encontrado');
    }

    const chatData = chatDoc.data();
    
    // 2. Identificar o adotante (interessado)
    const interestedId = chatData?._chatContext?.interestedId;
    if (!interestedId) {
      throw new Error('ID do interessado não encontrado no chat');
    }

    console.log('❌ [3] Adotante identificado:', interestedId);

    // 3. Buscar token FCM do adotante
    console.log('❌ [4] Buscando token FCM do adotante...');
    const adopterDoc = await getDoc(doc(db, 'usuários', interestedId));
    
    if (!adopterDoc.exists()) {
      throw new Error('Adotante não encontrado no Firestore');
    }

    const adopterData = adopterDoc.data();
    
    if (!adopterData?.fcmToken) {
      console.warn('⚠️ Adotante não tem token FCM registrado');
      return {
        success: false,
        message: 'Adotante não tem token FCM'
      };
    }

    console.log('❌ [5] Token FCM do adotante encontrado');

    // 4. Adicionar mensagem de sistema sobre adoção recusada
    console.log('❌ [6] Criando mensagem de sistema para adoção recusada...');
    
    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    const systemMessageId = Date.now().toString() + '_adoption_rejected';
    
    await addDoc(messagesRef, {
      _id: systemMessageId,
      text: `❌ Adoção de ${animalName} recusada.`,
      createdAt: serverTimestamp(),
      user: {
        _id: 'system',
        name: 'Sistema',
      },
      system: true,
      _adoptionRejected: true,
      _debug: {
        adopterId: interestedId,
        notificationType: 'ADOPTION_REJECTED_REAL'
      }
    });

    // 5. Marcar chat como tendo adoção recusada
    console.log('❌ [7] Marcando chat como adoção recusada...');
    
    await setDoc(doc(db, 'chats', chatRoomID), {
      adoptionRejected: true,
      adoptionStatus: 'rejected',
      lastMessage: `❌ Adoção de ${animalName} recusada`,
      lastMessageAt: serverTimestamp(),
      _adoptionRejectedAt: serverTimestamp(),
      _notificationPending: true
    }, { merge: true });

    console.log('❌ [8] Notificação de adoção recusada configurada!');
    console.log('🔔 Cloud Function será acionada automaticamente');

    return {
      success: true,
      message: 'Notificação de adoção recusada configurada com sucesso',
      adopterId: interestedId,
      adopterName: adopterData?.nome || 'Adotante',
      animalName,
      chatRoomID
    };
    
  } catch (error) {
    console.error('❌ [ERROR] Erro ao configurar notificação de adoção recusada:', error);
    throw error;
  }
};

/**
 * ============================================
 * FUNÇÕES DE TESTE (MANTIDAS COMO ESTAVAM)
 * ============================================
 */

export const sendTestNotification = async () => {
  console.log('🎯 [1] sendTestNotification chamado');
  
  try {
    const currentUser = auth.currentUser;
    console.log('🎯 [2] Usuário atual:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // 1. Verificar se o usuário tem FCM token
    console.log('🎯 [3] Verificando token FCM no Firestore...');
    const userDoc = await getDoc(doc(db, 'usuários', currentUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado no Firestore');
    }

    const userData = userDoc.data();
    console.log('🎯 [4] Dados do usuário:', { 
      hasFcmToken: !!userData?.fcmToken,
      username: userData?.username 
    });
    
    if (!userData?.fcmToken) {
      throw new Error('❌ FCM token não encontrado. Registre notificações primeiro.');
    }

    console.log('🎯 [5] Token FCM encontrado:', userData.fcmToken.substring(0, 20) + '...');

    // 2. Criar um usuário "dono" fake para receber a notificação
    console.log('🎯 [6] Criando usuário dono fake...');
    const donoFakeId = 'dono_test_' + Date.now();
    
    // Criar documento do dono fake com o MESMO token FCM do usuário atual
    await setDoc(doc(db, 'usuários', donoFakeId), {
      username: 'Dono do Rex (Teste)',
      fcmToken: userData.fcmToken,
      email: 'dono_test@example.com',
      createdAt: serverTimestamp()
    }, { merge: true });

    // 3. Criar chat de teste
    console.log('🎯 [7] Criando chat de teste...');
    const testChatData = {
      participants: [currentUser.uid, donoFakeId],
      _chatContext: {
        animalName: 'Rex - Cachorro Fofinho 🐕',
        animalId: 'animal_test_' + Date.now(),
        interestedId: currentUser.uid,
        donoId: donoFakeId
      },
      createdAt: serverTimestamp(),
      lastMessage: 'Olá! Gostaria de saber mais sobre o Rex para adoção. 🐾',
      lastMessageAt: serverTimestamp(),
      lastMessageSender: currentUser.uid,
      _testNotification: true,
      _debug: {
        timestamp: new Date().toISOString(),
        type: 'test_notification'
      }
    };

    console.log('🎯 [8] Adicionando chat na coleção...');
    const docRef = await addDoc(collection(db, 'chats'), testChatData);
    
    console.log('✅ [9] Chat de teste criado com ID:', docRef.id);
    console.log('🔔 [10] Cloud Function deve ser acionada agora!');

    return {
      success: true,
      chatId: docRef.id,
      message: 'Notificação enviada! Verifique a BARRA de notificações do seu celular.',
      debug: {
        donoFakeId,
        yourToken: userData.fcmToken.substring(0, 20) + '...'
      }
    };
    
  } catch (error) {
    console.error('❌ [ERROR] Erro detalhado:', error);
    throw error;
  }
};

export const sendDelayedTestNotification = async () => {
  console.log('⏰ [1] sendDelayedTestNotification chamado - TESTE COM APP FECHADO');
  
  try {
    const currentUser = auth.currentUser;
    console.log('⏰ [2] Usuário atual:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // 1. Verificar se o usuário tem FCM token
    console.log('⏰ [3] Verificando token FCM no Firestore...');
    const userDoc = await getDoc(doc(db, 'usuários', currentUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado no Firestore');
    }

    const userData = userDoc.data();
    
    if (!userData?.fcmToken) {
      throw new Error('❌ FCM token não encontrado. Registre notificações primeiro.');
    }

    console.log('⏰ [4] Token FCM encontrado:', userData.fcmToken.substring(0, 20) + '...');

    // 2. Criar um usuário "dono" fake para receber a notificação
    console.log('⏰ [5] Criando usuário dono fake...');
    const donoFakeId = 'dono_delayed_test_' + Date.now();
    
    // Criar documento do dono fake com o MESMO token FCM do usuário atual
    await setDoc(doc(db, 'usuários', donoFakeId), {
      username: 'Dono Teste App Fechado',
      fcmToken: userData.fcmToken,
      email: 'dono_delayed@example.com',
      createdAt: serverTimestamp()
    }, { merge: true });

    // 3. AGUARDAR 15 SEGUNDOS PARA VOCÊ FECHAR O APP
    console.log('⏰ [6] AGUARDANDO 15 SEGUNDOS - FECHE O APP AGORA! 🚨');
    
    return new Promise((resolve) => {
      let countdown = 15;
      
      const countdownInterval = setInterval(() => {
        console.log(`⏰ [${countdown}] FECHE O APP!`);
        countdown--;
        
        if (countdown === 0) {
          clearInterval(countdownInterval);
          createDelayedChat();
        }
      }, 1000);

      async function createDelayedChat() {
        try {
          console.log('⏰ [7] Criando chat de teste DELAYED...');
          
          const testChatData = {
            participants: [currentUser.uid, donoFakeId],
            _chatContext: {
              animalName: 'TESTE COM APP FECHADO 🐕',
              animalId: 'animal_delayed_test_' + Date.now(),
              interestedId: currentUser.uid,
              donoId: donoFakeId
            },
            createdAt: serverTimestamp(),
            lastMessage: 'Esta notificação deve aparecer com APP FECHADO! 📱',
            lastMessageAt: serverTimestamp(),
            lastMessageSender: currentUser.uid,
            _testNotification: true,
            _delayedTest: true,
            _debug: {
              timestamp: new Date().toISOString(),
              type: 'delayed_test_notification'
            }
          };

          console.log('⏰ [8] Adicionando chat DELAYED na coleção...');
          const docRef = await addDoc(collection(db, 'chats'), testChatData);
          
          console.log('✅ [9] Chat DELAYED criado com ID:', docRef.id);
          console.log('🔔 [10] Cloud Function deve ser acionada para APP FECHADO!');

          resolve({
            success: true,
            chatId: docRef.id,
            message: '✅ Notificação enviada para APP FECHADO!\n\nVerifique a BARRA de notificações do seu celular. A notificação deve aparecer mesmo com o app fechado!',
            debug: {
              donoFakeId,
              yourToken: userData.fcmToken.substring(0, 20) + '...',
              testType: 'app_fechado'
            }
          });
          
        } catch (error) {
          console.error('❌ [ERROR] Erro no delayed chat:', error);
          resolve({
            success: false,
            message: 'Erro ao criar chat delayed: ' + error.message
          });
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [ERROR] Erro detalhado no delayed:', error);
    throw error;
  }
};