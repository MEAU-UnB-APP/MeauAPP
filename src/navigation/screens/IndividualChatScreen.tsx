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
  updateDoc
} from 'firebase/firestore';
import { Text, View, Image, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Provider } from 'react-native-paper';
import { auth, db } from '../../config/firebase'; 
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

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
  const [otherParticipant, setOtherParticipant] = useState<{
    nome: string;
    fotoPerfil?: string | null;
  } | null>(null);
  const navigation = useNavigation();
  const route = useRoute<IndividualChatRouteProp>();

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
              });
            } else {
              setOtherParticipant({
                nome: 'Usuário',
                fotoPerfil: null,
              });
            }
          } else {
            setOtherParticipant(null);
          }
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
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
          <Button 
            mode="contained" 
            onPress={() => setDialogVisible(true)}
            style={{ marginRight: 10, marginTop: 140 }}
            buttonColor="#4CAF50"
            textColor="white"
          >
            Confirmar Adoção
          </Button>
        ) : null
      )
    });
  }, [navigation, chatTitle, isPetOwner, animalAdopted]);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
  }, [chatRoomID]);

  const handleConfirmAdoption = async () => {
    if (!chatData?._chatContext?.animalId) {
      console.log('No animal ID found');
      return;
    }

    try {
      console.log('Updating animal adoption status...');
      
      const animalRef = doc(db, 'animais', chatData._chatContext.animalId);
      await updateDoc(animalRef, {
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

      setAnimalAdopted(true);
      setDialogVisible(false);
      
      setTimeout(() => {
        console.log('Adoption confirmed successfully!');
      }, 100);

    } catch (error) {
      console.error('Error confirming adoption:', error);
      setDialogVisible(false);
      setTimeout(() => {
        console.log('Error confirming adoption');
      }, 100);
    }
  };

  const onSend = useCallback(async (messages: IMessage[] = []) => {
    if (!user) return;

    const messageToSend = messages[0];
    const { text, user: giftedUser } = messageToSend;

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

  }, [chatRoomID, user]);

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

  return (
    <View style={{ flex: 1 }}>
      <Provider>

      <Portal>
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
        onSend={messages => onSend(messages)}
        user={{
          _id: user?.uid || 'user_anonimo',
          name: user?.displayName || 'Você', 
        }}
        placeholder={animalAdopted ? "Animal já adotado" : "Digite sua mensagem..."}
        renderSystemMessage={renderSystemMessage}
        renderAvatar={renderAvatar}
        renderBubble={renderChatBubble}
        />
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
});