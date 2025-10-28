import React from 'react';
import { Alert } from 'react-native';
import { IconButton } from 'react-native-paper'; 
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { auth, db } from '../config/firebase'; 

type HomeStackParamList = {
  AdotarHome: undefined;
  CadastroAnimal: undefined;
  CadastroPessoal: undefined;
  IndividualChat: {
    chatRoomID: string;
    chatTitle?: string;
  };
};

interface ChatIconButtonProps {
  animalId: string;
  donoId: string;
  size: number;
  iconColor: string;
  animalName?: string;
}

type ChatNavigationProp = NavigationProp<HomeStackParamList, 'IndividualChat'>;

const ChatIconButton: React.FC<ChatIconButtonProps> = ({
  animalId,
  donoId,
  size,
  iconColor,
  animalName = 'o animal',
}) => {
  const navigation = useNavigation<ChatNavigationProp>();

  const user = auth.currentUser;
  const loggedInUserId = user?.uid;
  
  const isOwner = loggedInUserId === donoId;
  const isNotLoggedIn = !loggedInUserId;
  const isDisabled = isOwner || isNotLoggedIn;

  const handleInitiateChat = async (): Promise<void> => {
    if (isNotLoggedIn) {
      Alert.alert("Atenção", "Você precisa estar logado para iniciar um chat.");
      return;
    }

    if (isOwner) {
      Alert.alert("Atenção", "Você não pode iniciar um chat consigo mesmo.");
      return;
    }

    const chatRoomID = `${animalId}_${donoId}_${loggedInUserId}`;

    try {
      const chatRef = doc(db, 'chats', chatRoomID);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          _chatContext: {
            animalId: animalId,
            donoId: donoId,
            interestedId: loggedInUserId,
            animalName: animalName,
          },
          participants: [donoId, loggedInUserId],
          lastMessage: `Interesse em adotar ${animalName}`,
          lastMessageTimestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      console.log('Navigating to IndividualChat...'); 
      navigation.navigate('IndividualChat', {
        chatRoomID: chatRoomID,
        chatTitle: `Sobre ${animalName}`
      });


    } catch (error) {
      console.error("Erro ao iniciar o chat: ", error);
      Alert.alert("Erro", "Não foi possível iniciar o chat.");
    }
  };

  return (
    <IconButton
      icon="chat-processing-outline" 
      size={size}
      iconColor={iconColor}
      onPress={handleInitiateChat}
      disabled={isDisabled}
    />
  );
};

export default ChatIconButton;