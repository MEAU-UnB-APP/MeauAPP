import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {auth, db } from '../../config/firebase'; 
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'

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
  const navigation = useNavigation();
  const route = useRoute<IndividualChatRouteProp>();

  const { chatRoomID, chatTitle } = route.params;
  const user = auth.currentUser;

  useLayoutEffect(() => {
    navigation.setOptions({ title: chatTitle });
  }, [navigation, chatTitle]);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreMessage;
        const createdAt = (data.createdAt as any).toDate ? (data.createdAt as any).toDate() : new Date();
        
        return {
          _id: doc.id,
          text: data.text,
          createdAt: createdAt,
          user: data.user,
        };
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chatRoomID]);

  const onSend = useCallback(async (messages: IMessage[] = []) => {
    if (!user) return;

    const messageToSend = messages[0];
    const { text, user: giftedUser } = messageToSend;

    const messagesRef = collection(db, 'chats', chatRoomID, 'messages');
    await addDoc(messagesRef, {
      _id: messageToSend._id, 
      text: text,
      createdAt: new Date(), 
      user: giftedUser, 
    });

    const chatRef = doc(db, 'chats', chatRoomID);
    await setDoc(chatRef, {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp(), 
    }, { merge: true }); 

  }, [chatRoomID, user]);

  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      user={{
        _id: user?.uid || 'user_anonimo',
        name: user?.displayName || 'Você', 
      }}
      placeholder="Digite sua mensagem..."
    />
  );
}
