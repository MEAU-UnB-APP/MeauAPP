import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { LocationMap } from './LocationMap';
import ChatButton from './ChatButton';
import { Animal } from '../types/index';
import { Colors } from '../config/colors';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

interface ChatData {
  id: string;
  _chatContext?: {
    animalId: string;
    donoId: string;
    interestedId: string;
    animalName?: string;
  };
  createdAt?: any;
  lastMessageTimestamp?: any;
  interestedName?: string;
  [key: string]: any;
}

interface PetDetailsModalProps {
  visible: boolean;
  animal: Animal | null;
  onClose: () => void;
  isOwner?: boolean;
  onToggleVisibility?: (isVisible: boolean) => void;
  onRemovePet?: () => void;
}

export const PetDetailsModal: React.FC<PetDetailsModalProps> = ({
  visible,
  animal,
  onClose,
  isOwner = false,
  onToggleVisibility,
  onRemovePet,
}) => {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [disponivel, setDisponivel] = useState(animal?.disponivel ?? true);
  const navigation = useNavigation<any>();

  // Sincronizar estado quando o animal mudar
  useEffect(() => {
    if (animal) {
      setDisponivel(animal.disponivel);
    }
  }, [animal?.disponivel]);

  // Buscar interessados quando for dono
  useEffect(() => {
    if (!isOwner || !animal || !visible) {
      setChats([]);
      return;
    }

    setChatsLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setChatsLoading(false);
      return;
    }

    if (!animal) {
      setChatsLoading(false);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('_chatContext.animalId', '==', animal.id),
      where('_chatContext.donoId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const chatsList = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const chatData: ChatData = { id: docSnap.id, ...docSnap.data() };
            // Buscar nome do interessado
            const interessadoId = chatData._chatContext?.interestedId;
            if (interessadoId) {
              try {
                const userRef = doc(db, 'usuarios', interessadoId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  chatData.interestedName = userSnap.data()?.nome || 'Interessado';
                }
              } catch (error) {
                console.error('Erro ao buscar nome do interessado:', error);
              }
            }
            return chatData;
          })
        );
        
        // Ordenar manualmente por timestamp
        chatsList.sort((a, b) => {
          const aTime = a.lastMessageTimestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.lastMessageTimestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        
        setChats(chatsList);
        setChatsLoading(false);
      },
      (error) => {
        console.error('Erro em tempo real dos chats:', error);
        setChatsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [animal?.id, isOwner, visible]);

  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      const novoEstado = !disponivel;
      setDisponivel(novoEstado);
      onToggleVisibility(novoEstado);
    }
  };

  const handleRemovePet = () => {
    if (onRemovePet && animal) {
      Alert.alert(
        'Remover Animal',
        `Tem certeza que deseja remover ${animal.nome}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: onRemovePet,
          },
        ]
      );
    }
  };

  const handleChatPress = (chat: ChatData) => {
    const otherUserName = chat.interestedName || 'Interessado';
    navigation.navigate('IndividualChat', {
      chatRoomID: chat.id,
      chatTitle: `Chat com ${otherUserName}`,
    });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return (
        date.toLocaleDateString('pt-BR') +
        ' ' +
        date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (error) {
      return '';
    }
  };

  // Função para renderizar tags
  const renderTags = (items: string[], style: any = {}) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={[styles.tagsContainer, style]}>
        {items.map((item, index) => (
          <View key={index} style={styles.tagItem}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!animal) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor={Colors.branco} barStyle="dark-content" />

      <View style={styles.fullScreenModal}>
        {/* Header Fixo */}
        <View
          style={[
            styles.modalHeader,
            isOwner && { backgroundColor: Colors.rosaescuro },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              isOwner && { backgroundColor: Colors.rosaescuro },
            ]}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{animal.nome}</Text>
          <View style={styles.iconContainer}>
            {isOwner ? (
              <IconButton
                icon={disponivel ? 'eye' : 'eye-off'}
                size={24}
                iconColor={Colors.branco}
                onPress={handleToggleVisibility}
              />
            ) : (
              <ChatButton
                animalId={animal.id}
                animalName={animal.nome}
                donoId={animal.dono}
                size={24}
                iconColor={Colors.branco}
              />
            )}
          </View>
        </View>

        {/* Conteúdo com Scroll */}
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Foto Principal */}
          <Image
            source={{
              uri:
                animal.fotoPrincipal ||
                'https://placehold.co/400x300/e0e0e0/757575?text=Sem+Foto',
            }}
            style={styles.modalImage}
          />

          <View style={styles.modalInfo}>
            {/* Informações Básicas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Básicas</Text>

              <View style={styles.tagsRow}>
                <View style={styles.mainTag}>
                  <Text style={styles.mainTagText}>
                    {animal.sexo || 'Não informado'}
                  </Text>
                </View>
                <View style={styles.mainTag}>
                  <Text style={styles.mainTagText}>
                    {animal.idade || 'Não informado'}
                  </Text>
                </View>
                <View style={styles.mainTag}>
                  <Text style={styles.mainTagText}>
                    {animal.porte || 'Não informado'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Espécie</Text>
                  <Text style={styles.infoValue}>
                    {animal.especie || 'Não informada'}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Localização</Text>
                  <Text style={styles.infoValue}>
                    {animal.localizacao || 'Não informada'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Temperamento */}
            {animal.temperamento && animal.temperamento.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Temperamento</Text>
                {renderTags(animal.temperamento)}
              </View>
            )}

            {/* Saúde */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saúde</Text>

              {animal.saude && animal.saude.length > 0 && (
                <>{renderTags(animal.saude, { marginBottom: 12 })}</>
              )}

              {animal.doencas ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Doenças/Condições</Text>
                  <Text style={styles.infoValue}>{animal.doencas}</Text>
                </View>
              ) : (
                <Text style={styles.noInfoText}>
                  Nenhuma doença ou condição especial informada
                </Text>
              )}
            </View>

            {/* Exigências para Adoção */}
            {animal.exigencias && animal.exigencias.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Exigências para Adoção</Text>
                {renderTags(animal.exigencias)}
              </View>
            )}

            {/* Sobre o Animal */}
            {animal.sobre && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sobre o Animal</Text>
                <Text style={styles.description}>{animal.sobre}</Text>
              </View>
            )}

            {/* Localização */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localização</Text>
              <LocationMap locationData={animal.locationData} petName={animal.nome} />
            </View>

            {/* Interessados (apenas para dono) */}
            {isOwner && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interessados</Text>
                {chatsLoading ? (
                  <View style={styles.interestedLoading}>
                    <ActivityIndicator size="small" color={Colors.roxo} />
                    <Text style={styles.interestedLoadingText}>
                      Buscando interessados...
                    </Text>
                  </View>
                ) : chats.length === 0 ? (
                  <Text style={styles.noInfoText}>
                    Nenhum interessado encontrado para {animal.nome}
                  </Text>
                ) : (
                  <View style={styles.interestedList}>
                    {chats.map((chat) => (
                      <TouchableOpacity
                        key={chat.id}
                        style={styles.interestedItem}
                        onPress={() => handleChatPress(chat)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.interestedItemContent}>
                          <Text style={styles.interestedItemName}>
                            {chat.interestedName || 'Interessado'}
                          </Text>
                          <Text style={styles.interestedItemDate}>
                            {formatTimestamp(chat.createdAt) ||
                              formatTimestamp(chat.lastMessageTimestamp) ||
                              'Data não disponível'}
                          </Text>
                        </View>
                        <Text style={styles.interestedItemArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Galeria de Fotos (se tiver mais fotos) */}
            {animal.fotos && animal.fotos.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Mais Fotos ({animal.fotos.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.galleryContainer}>
                    {animal.fotos.map((foto, index) => (
                      <Image key={index} source={{ uri: foto }} style={styles.galleryImage} />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Botão Remover Animal (apenas para dono) */}
            {isOwner && onRemovePet && (
              <View style={styles.removeButtonContainer}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemovePet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>Remover Animal</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenModal: {
    flex: 1,
    backgroundColor: Colors.branco,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cinza,
    backgroundColor: Colors.roxoclaro,
    marginTop: StatusBar.currentHeight,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.roxo,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
    lineHeight: 24,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Roboto-Medium',
    color: Colors.branco,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.cinza,
  },
  modalInfo: {
    padding: 16,
  },

  // Seções
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cinza,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
    color: Colors.roxo,
    marginBottom: 16,
    fontWeight: 'semibold',
  },

  // Tags principais
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mainTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  mainTagText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: Colors.roxo,
    textTransform: 'capitalize',
  },

  // Grid de informações
  infoGrid: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: Colors.preto,
    flex: 1,
    fontWeight: 'semibold',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: Colors.preto,
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'right',
  },

  // Tags de lista
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    backgroundColor: Colors.cinza,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: Colors.preto,
  },

  // Descrição
  description: {
    fontSize: 14,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
    lineHeight: 20,
  },

  // Texto sem informação
  noInfoText: {
    fontSize: 14,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
    opacity: 0.6,
  },

  // Galeria de fotos
  galleryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.cinza,
  },

  // Interessados
  interestedLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  interestedLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: Colors.preto,
  },
  interestedList: {
    marginTop: 8,
  },
  interestedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cinza,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  interestedItemContent: {
    flex: 1,
  },
  interestedItemName: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: Colors.preto,
    marginBottom: 4,
  },
  interestedItemDate: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: Colors.preto,
    opacity: 0.7,
  },
  interestedItemArrow: {
    fontSize: 20,
    color: Colors.roxo,
    marginLeft: 12,
  },

  // Botão Remover
  removeButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  removeButton: {
    backgroundColor: Colors.rosaescuro,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: Colors.branco,
  },
});

