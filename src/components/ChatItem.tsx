import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase'; 
import { ChatRoom } from '../navigation/screens/Chat'; 
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

type RootStackParamList = {
  IndividualChat: {
    chatRoomID: string;
    chatTitle: string;
  };
};

type ChatNavigationProp = NavigationProp<RootStackParamList, 'IndividualChat'>;

interface ChatItemProps {
  chat: ChatRoom;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat }) => {
  const [otherUserName, setOtherUserName] = useState('Carregando...');
  
  const navigation = useNavigation<ChatNavigationProp>();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const otherUserId = chat.participants.find(id => id !== user.uid);

    if (!otherUserId) {
      setOtherUserName("Chat de Grupo"); 
      return;
    }

    const fetchUserData = async () => {
      const userDocRef = doc(db, "usuários", otherUserId); 
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setOtherUserName(docSnap.data().nome);
        } else {
          setOtherUserName("Usuário Desconhecido");
        }
      } catch (error) {
        console.error("Erro ao buscar nome do usuário:", error);
        setOtherUserName("Erro ao carregar");
      }
    };

    fetchUserData();
  }, [chat]); 

  const handlePress = () => {
    navigation.getParent()?.navigate('IndividualChat', {
      chatRoomID: chat.id,
      chatTitle: otherUserName,
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle-outline" size={40} color="#757575" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{otherUserName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {chat.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1, 
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#434343',
  },
  lastMessage: {
    fontSize: 14,
    color: '#757575',
  },
});

export default ChatItem;

