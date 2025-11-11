import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator, Platform } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import {auth, db } from '../../config/firebase'; 
import ChatItem from '../../components/ChatItem';
import * as Notifications from 'expo-notifications';

export interface ChatRoom {
  id: string; 
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  _chatContext: {
    animalId: string;
    donoId: string;
    interestedId: string;
    animalName?: string;
  };
}

export function Chat() {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notificationPermissionGrantedRef = useRef(false);
  const lastMessageTimestampsRef = useRef<Map<string, number>>(new Map());
  const isInitialLoadRef = useRef(true);

  const updateNotificationPermission = useCallback(async () => {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      notificationPermissionGrantedRef.current = permissions.status === 'granted';
    } catch (err) {
      console.error('Erro ao verificar permissões de notificação:', err);
      notificationPermissionGrantedRef.current = false;
    }
  }, []);

  useEffect(() => {
    updateNotificationPermission();
  }, [updateNotificationPermission]);

  const triggerChatNotification = useCallback(async () => {
    if (!notificationPermissionGrantedRef.current) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nova mensagem!',
          body: 'Você recebeu uma nova mensagem no chat.',
          sound: true,
          data: { category: 'chat-new-message' },
        },
        trigger: null,
      });
    } catch (err) {
      console.error('Erro ao agendar notificação:', err);
    }
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatList: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        chatList.push({
          id: doc.id,
          ...doc.data()
        } as ChatRoom);
      });

      setChats(chatList);
      setLoading(false);

      const docChanges = querySnapshot.docChanges();

      if (isInitialLoadRef.current) {
        docChanges.forEach((change) => {
          const data = change.doc.data() as ChatRoom;
          const timestamp = data?.lastMessageTimestamp?.toMillis?.() ?? 0;
          lastMessageTimestampsRef.current.set(change.doc.id, timestamp);
        });
        isInitialLoadRef.current = false;
        return;
      }

      let shouldNotify = false;

      docChanges.forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data() as ChatRoom;
          const timestamp = data?.lastMessageTimestamp?.toMillis?.() ?? 0;
          const previousTimestamp = lastMessageTimestampsRef.current.get(change.doc.id) ?? 0;
          lastMessageTimestampsRef.current.set(change.doc.id, timestamp);

          if (timestamp > previousTimestamp) {
            shouldNotify = true;
          }
        }
      });

      if (shouldNotify) {
        triggerChatNotification();
      }
    }, (err) => {
      console.error("Erro ao buscar chats: ", err);
      setError("Não foi possível carregar as conversas.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [triggerChatNotification]);


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#88c9bf" />
        <Text>Carregando conversas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Nenhuma conversa iniciada.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatItem chat={item} />}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});
