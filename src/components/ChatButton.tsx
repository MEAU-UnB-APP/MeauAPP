import React from 'react';
import { Alert } from 'react-native';
import { IconButton } from 'react-native-paper'; 
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { auth, db } from '../config/firebase'; 


type RootStackParamList = {
  ChatScreen: {
    chatRoomID: string;
    chatTitle?: string;
  };
};

interface ChatIconButtonProps {
  animalId: string;
  donoId: string;
  size: number;
  iconColor: string;
}

type ChatNavigationProp = NavigationProp<RootStackParamList, 'ChatScreen'>;

const ChatIconButton: React.FC<ChatIconButtonProps> = ({
  animalId,
  donoId,
  size,
  iconColor,
}) => {
  const navigation = useNavigation<ChatNavigationProp>();

  const user = auth.currentUser;
  const loggedInUserId = user?.uid;
  
  const isOwner = loggedInUserId === donoId;
  const isNotLoggedIn = !loggedInUserId;
  const isDisabled = isOwner || isNotLoggedIn;

  const handleInitiateChat = async (): Promise<void> => {
    if (isDisabled) {
        return;
    }

    const chatRoomID = `${animalId}_${donoId}_${loggedInUserId!}`;
    const chatRef = doc(db, 'chats', chatRoomID);

    try {
      await setDoc(chatRef, {
        _chatContext: {
          animalId: animalId,
          donoId: donoId,
          interestedId: loggedInUserId!,
        },
        participants: [donoId, loggedInUserId!],
        lastMessage: "Chat iniciado.",
        lastMessageTimestamp: serverTimestamp(),
      }, { merge: true }); 

      navigation.navigate('ChatScreen', {
        chatRoomID: chatRoomID,
        chatTitle: 'Chat com o Dono'
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