import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { GiftedChat, IMessage, Avatar, Bubble } from 'react-native-gifted-chat';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  serverTimestamp,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  where
} from 'firebase/firestore';
import { Text, View, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Button, Dialog, Portal, Provider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebase'; 
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { 
  sendAdoptionApprovedNotification, 
  sendAdoptionRejectedNotification 
} from '../../services/notificationService';

type RootStackParamList = {
  IndividualChat: {
    chatRoomID: string;
    chatTitle: string;
  };
};

type IndividualChatRouteProp = RouteProp<RootStackParamList, 'IndividualChat'>;

interface FirestoreMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string; 
  };
}

export function IndividualChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [chatData, setChatData] = useState<any>(null);
  const [isPetOwner, setIsPetOwner] = useState(false);
  const [animalAdopted, setAnimalAdopted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogRejectionVisible, setDialogRejectionVisible] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<{
    nome: string;
    fotoPerfil?: string | null;
    userId: string;
  } | null>(null);
  const [animalInfo, setAnimalInfo] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const navigation = useNavigation();
  const route = useRoute<IndividualChatRouteProp>();
  const insets = useSafeAreaInsets();

  const { chatRoomID, chatTitle } = route.params;
  const user = auth.currentUser;

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const chatRef = doc(db, 'chats', chatRoomID);
        const chatSnap = await getDoc(chatRef);
        
        if (chatSnap.exists()) {
          const data = chatSnap.data();
          setChatData(data);
          
          const isOwner = user?.uid === data?._chatContext?.donoId;
          setIsPetOwner(isOwner);
          
          if (data?._chatContext?.animalId) {
            const animalRef = doc(db, 'animais', data._chatContext.animalId);
            const animalSnap = await getDoc(animalRef);
            if (animalSnap.exists()) {
              const animalData = animalSnap.data();
              setAnimalAdopted(animalData?.disponivel === false);
              setAnimalInfo({
                id: data._chatContext.animalId,
                nome: animalData?.nome || data._chatContext?.animalName || 'Pet'
              });
            }
          }

          const participants: string[] = Array.isArray(data?.participants) ? data.participants : [];
          const otherId = participants.find((id) => id !== user?.uid);
          if (otherId) {
            const otherUserRef = doc(db, 'usuários', otherId);
            const otherUserSnap = await getDoc(otherUserRef);
            if (otherUserSnap.exists()) {
              const otherData = otherUserSnap.data();
              setOtherParticipant({
                nome: otherData?.nome ?? 'Usuário',
                fotoPerfil: otherData?.fotoPerfil ?? null,
                userId: otherId
              });
            } else {
              setOtherParticipant({
                nome: 'Usuário',
                fotoPerfil: null,
                userId: otherId
              });
            }
          } else {
            setOtherParticipant(null);
          }
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do chat.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatRoomID, user]);

  useLayoutEffect(() => {
    navigation.setOptions({ 
      title: chatTitle,
      headerRight: () => (
        isPetOwner && !animalAdopted ? (
          <View style={{ flexDirection: 'row', marginRight: 8, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setDialogRejectionVisible(true)}
              style={{
                backgroundColor: '#ff4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                marginRight: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDialogVisible(true)}
              style={{
                backgroundColor: '#4CAF50',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Aprovar</Text>
            </TouchableOpacity>
          </View>
        ) : null
      )
    });
  }, [navigation, chatTitle, isPetOwner, animalAdopted]);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
          const data = change.doc.data() as FirestoreMessage;
          
          // Ignorar mensagens do sistema ou quando animal já foi adotado
          if (data.user._id === 'system' || animalAdopted) {
            return;
          }
        }
      });

      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreMessage;
        const createdAtValue = (data as any)?.createdAt;
        const createdAt =
          createdAtValue && typeof createdAtValue.toDate === 'function'
            ? createdAtValue.toDate()
            : new Date();

        return {
          _id: doc.id,
          text: data.text,
          createdAt,
          user: data.user,
        };
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chatRoomID, user, animalAdopted]);

  const handleConfirmAdoption = async () => {
    if (!chatData?._chatContext?.animalId || !otherParticipant || !animalInfo || !user) {
      console.log('No animal ID or other participant found');
      Alert.alert('Erro', 'Dados incompletos para confirmar adoção.');
      return;
    }

    try {
      console.log('Updating animal adoption status...');
      
      const animalRef = doc(db, 'animais', chatData._chatContext.animalId);
      await updateDoc(animalRef, {
        dono: chatData._chatContext.interestedId,
        disponivel: false,
        dataAdocao: serverTimestamp(),
        adotadoPor: chatData._chatContext.interestedId,
        adotadoEm: serverTimestamp(),
      });

      const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
      await addDoc(messagesRef, {
        _id: Date.now().toString(),
        text: `🎉 Adoção confirmada! Pet oficialmente adotado(a)!`,
        createdAt: serverTimestamp(),
        user: {
          _id: 'system',
          name: 'Sistema',
        },
        system: true,
      });

      const chatRef = doc(db, 'chats', chatRoomID);
      await setDoc(chatRef, {
        lastMessage: `Adoção confirmada - Pet oficialmente adotado(a)!`,
        lastMessageTimestamp: serverTimestamp(),
        adoptionConfirmed: true,
      }, { merge: true });

      // Criar documento na coleção 'adocoes' para acionar Cloud Function de notificação
      const adocoesRef = collection(db, 'adocoes');
      await addDoc(adocoesRef, {
        status: 'confirmada',
        interessadoId: chatData._chatContext.interestedId,
        donoId: user.uid,
        donoName: user.displayName || 'O dono',
        animalName: animalInfo.nome,
        animalId: chatData._chatContext.animalId,
        chatId: chatRoomID,
        createdAt: serverTimestamp(),
      });

      setAnimalAdopted(true);
      setDialogVisible(false);
      
      // Manter a chamada da função antiga para compatibilidade
      sendAdoptionApprovedNotification({
        chatRoomID,
        animalName: animalInfo.nome
      }).then(result => {
        console.log('✅ Notificação de adoção aprovada configurada:', result.message);
      }).catch(error => {
        console.log('⚠️ Erro ao configurar notificação:', error.message);
      });

      await deleteOtherChatsForPet(
        chatData._chatContext.animalId,
        chatData._chatContext.interestedId, // novo dono
        user.uid                              // dono atual (antigo dono)
      );

      Alert.alert('Sucesso!', 'Adoção confirmada com sucesso!');
      console.log('Adoption confirmed successfully!');

    } catch (error) {
      console.error('Error confirming adoption:', error);
      setDialogVisible(false);
      Alert.alert('Erro', 'Não foi possível confirmar a adoção. Tente novamente.');
    }
  };

  const handleRejectAdoption = async () => {
    if (!chatData?._chatContext?.animalId || !otherParticipant || !animalInfo || !user) {
      console.log('No animal ID or other participant found');
      Alert.alert('Erro', 'Dados incompletos para recusar adoção.');
      return;
    }

    try {
      const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
      await addDoc(messagesRef, {
        _id: Date.now().toString(),
        text: `❌ Adoção recusada.`,
        createdAt: serverTimestamp(),
        user: {
          _id: 'system',
          name: 'Sistema',
        },
        system: true,
      });

      const chatRef = doc(db, 'chats', chatRoomID);
      await setDoc(chatRef, {
        lastMessage: `Adoção recusada.`,
        lastMessageTimestamp: serverTimestamp(),
        adoptionRejected: true,
      }, { merge: true });

      // Criar documento na coleção 'adocoes' para acionar Cloud Function de notificação
      const adocoesRef = collection(db, 'adocoes');
      await addDoc(adocoesRef, {
        status: 'recusada',
        interessadoId: chatData._chatContext.interestedId,
        donoId: user.uid,
        donoName: user.displayName || 'O dono',
        animalName: animalInfo.nome,
        animalId: chatData._chatContext.animalId,
        chatId: chatRoomID,
        createdAt: serverTimestamp(),
      });

      setDialogRejectionVisible(false);
      
      // Manter a chamada da função antiga para compatibilidade
      sendAdoptionRejectedNotification({
        chatRoomID,
        animalName: animalInfo.nome
      }).then(result => {
        console.log('✅ Notificação de adoção recusada configurada:', result.message);
      }).catch(error => {
        console.log('⚠️ Erro ao configurar notificação:', error.message);
      });

      Alert.alert('Adoção Recusada', 'A adoção foi recusada com sucesso.');
      console.log('Adoption rejected successfully!');

    } catch (error) {
      console.error('Error rejecting adoption:', error);
      setDialogRejectionVisible(false);
      Alert.alert('Erro', 'Não foi possível recusar a adoção. Tente novamente.');
    }
  };

  const onSend = useCallback(async (messages: IMessage[] = []) => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para enviar mensagens.');
      return;
    }

    if (animalAdopted) {
      Alert.alert('Animal Adotado', 'Este animal já foi adotado. Não é possível enviar mensagens.');
      return;
    }

    const messageToSend = messages[0];
    const { text, user: giftedUser } = messageToSend;

    try {
      const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
      await addDoc(messagesRef, {
        _id: messageToSend._id, 
        text: text,
        createdAt: serverTimestamp(), 
        user: giftedUser, 
      });

      const chatRef = doc(db, 'chats', chatRoomID);
      await setDoc(chatRef, {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(), 
      }, { merge: true });

      console.log('📤 Mensagem enviada - Notificação será configurada pelo listener');

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }

  }, [chatRoomID, user, animalAdopted]);

  const deleteOtherChatsForPet = async (animalId: string, newOwnerId: string, oldOwnerId: string) => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('_chatContext.animalId', '==', animalId));
    const snap = await getDocs(q);

    for (const chatDoc of snap.docs) {
      const chatId = chatDoc.id;
      const data = chatDoc.data();
      const participants = data?.participants || [];

      const isCurrentChat = chatId === chatRoomID;
      const isOwnerOwnerChat =
        participants.includes(oldOwnerId) && participants.includes(newOwnerId);

      // Pular o chat atual e o chat entre os donos antigo e novo
      if (isCurrentChat || isOwnerOwnerChat) continue;

      // 1. Deletar todas as mensagens do chat
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      const batch = writeBatch(db);

      messagesSnap.forEach((msg) => batch.delete(msg.ref));
      await batch.commit();

      // 2. Deletar documento do chat
      await deleteDoc(doc(db, 'chats', chatId));

      console.log(`Deleted chat ${chatId} related to pet ${animalId}`);
    }
  } catch (err) {
    console.error('Error deleting other chats:', err);
  }
};


  const renderSystemMessage = (props: any) => (
    <View style={{
      alignItems: 'center',
      marginVertical: 10,
      paddingHorizontal: 20,
    }}>
      <View style={{
        backgroundColor: '#e8f5e8',
        padding: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
      }}>
        <Text style={{
          color: '#2e7d32',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          {props.currentMessage.text}
        </Text>
      </View>
    </View>
  );

  const renderAvatar = (props: any) => {
    if (!props?.currentMessage) {
      return null;
    }

    if (props.currentMessage.user?._id === user?.uid) {
      return <Avatar {...props} />;
    }

    if (otherParticipant?.fotoPerfil) {
      return (
        <Image
          source={{ uri: otherParticipant.fotoPerfil }}
          style={styles.avatarImage}
          onError={() => {
            setOtherParticipant((prev) =>
              prev ? { ...prev, fotoPerfil: null } : prev
            );
          }}
        />
      );
    }

    return <Avatar {...props} />;
  };

  const renderChatBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: { backgroundColor: '#f0f0f0' },
        right: { backgroundColor: '#4CAF50' },
      }}
      textStyle={{
        right: { color: 'white' },
      }}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando chat...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Provider>
        <View style={{ flex: 1 }}>
          <Portal>
            {/* Diálogo de Confirmação de Adoção */}
            <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
              <Dialog.Title>Confirmar Adoção</Dialog.Title>
              <Dialog.Content>
                <Text
                  style={{ fontSize: 16, color: '#fff' }}
                >
                  Tem certeza que deseja confirmar a adoção deste animal? 
                  {"\n\n"}
                  Esta ação não pode ser desfeita.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDialogVisible(false)}>
                  Cancelar
                </Button>
                <Button 
                  onPress={handleConfirmAdoption} 
                  textColor="#fff"
                  mode="contained"
                  buttonColor="#4CAF50"
                  >
                  Confirmar Adoção
                </Button>
              </Dialog.Actions>
            </Dialog>

            {/* Diálogo de Rejeição de Adoção */}
            <Dialog visible={dialogRejectionVisible} onDismiss={() => setDialogRejectionVisible(false)}>
              <Dialog.Title>Recusar Adoção</Dialog.Title>
              <Dialog.Content>
                <Text
                  style={{ fontSize: 16, color: '#fff' }}
                >
                  Tem certeza que deseja recusar a adoção deste animal? 
                  {"\n\n"}
                  Esta ação não pode ser desfeita.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDialogRejectionVisible(false)}>
                  Cancelar
                </Button>
                <Button 
                  onPress={handleRejectAdoption} 
                  textColor="#fff"
                  mode="contained"
                  buttonColor="#ff4444"
                  >
                  Recusar Adoção
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {animalAdopted && (
            <View style={{
              backgroundColor: '#4CAF50',
              padding: 15,
              alignItems: 'center',
            }}>
              <Text style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16,
              }}>
                🎉 Este animal foi adotado!
              </Text>
            </View>
          )}
          
          <GiftedChat
            messages={messages}
            onSend={animalAdopted ? () => {} : (messages => onSend(messages))}
            user={{
              _id: user?.uid || 'user_anonimo',
              name: user?.displayName || 'Você', 
            }}
            placeholder={animalAdopted ? "Animal já adotado" : "Digite sua mensagem..."}
            renderSystemMessage={renderSystemMessage}
            renderAvatar={renderAvatar}
            renderBubble={renderChatBubble}
            textInputProps={{
              editable: !animalAdopted,
            }}
            bottomOffset={insets.bottom}
            />
        </View>
      </Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});