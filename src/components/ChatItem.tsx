import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
  const [otherUsername, setOtherUsername] = useState<string | null>(null);
  const [animalPhoto, setAnimalPhoto] = useState<string | null>(null);
  
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
          const data = docSnap.data();
          setOtherUserName(data?.nome ?? 'Usuário');
          setOtherUsername(data?.username ?? null);
        } else {
          setOtherUserName("Usuário Desconhecido");
          setOtherUsername(null);
        }
      } catch (error) {
        console.error("Erro ao buscar nome do usuário:", error);
        setOtherUserName("Erro ao carregar");
        setOtherUsername(null);
      }
    };

    fetchUserData();
  }, [chat]); 

  useEffect(() => {
    const fetchAnimalPhoto = async () => {
      const animalId = chat?._chatContext?.animalId;

      if (!animalId) {
        setAnimalPhoto(null);
        return;
      }

      const animalDocRef = doc(db, "animais", animalId);

      try {
        const docSnap = await getDoc(animalDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fotoPrincipal = data?.fotoPrincipal;
          if (typeof fotoPrincipal === 'string' && fotoPrincipal.length > 0) {
            setAnimalPhoto(fotoPrincipal);
          } else {
            setAnimalPhoto(null);
          }
        } else {
          setAnimalPhoto(null);
        }
      } catch (error) {
        console.error("Erro ao buscar foto do animal:", error);
        setAnimalPhoto(null);
      }
    };

    fetchAnimalPhoto();
  }, [chat?._chatContext?.animalId]);

  const handlePress = () => {
    const animalName = chat?._chatContext?.animalName;
    const chatTitle = animalName ? `Sobre ${animalName}` : otherUserName;

    navigation.navigate('IndividualChat', {
      chatRoomID: chat.id,
      chatTitle,
    });
  };

  const displayUserLabel = otherUsername ?? otherUserName;
  const animalName = chat?._chatContext?.animalName;
  const displayName = animalName ? `${displayUserLabel} | ${animalName}` : displayUserLabel;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.avatar}>
        {animalPhoto ? (
          <Image source={{ uri: animalPhoto }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person-circle-outline" size={40} color="#757575" />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{displayName}</Text>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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

