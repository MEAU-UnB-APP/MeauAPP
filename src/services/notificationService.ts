// services/notificationService.js
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';

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
    // Isso faz com que a notificação seja enviada para o próprio usuário
    await setDoc(doc(db, 'usuários', donoFakeId), {
      username: 'Dono do Rex (Teste)',
      fcmToken: userData.fcmToken, // Mesmo token para receber a notificação
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
        interestedId: currentUser.uid, // Você é o interessado
        donoId: donoFakeId // O dono fake vai receber a notificação
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