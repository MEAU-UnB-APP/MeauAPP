import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Text, 
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar 
} from 'react-native';
import { PetCard } from '../../components/PetCard';
import { Animal } from '../../types'; 
import { db } from '../../config/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 

export function Adotar() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchAnimaisDisponiveis = async () => {
      try {
        const animaisCollectionRef = collection(db, "animais");
        const q = query(animaisCollectionRef, where("disponivel", "==", true));
        const querySnapshot = await getDocs(q);
        const animaisList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Animal[]; 

        setAnimais(animaisList);
      } catch (error) {
        console.error("Erro ao buscar animais disponíveis: ", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchAnimaisDisponiveis();
  }, []); 

  const handlePetPress = (animal: Animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAnimal(null);
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

  // Função para formatar data
  const formatDate = (date: any) => {
    if (!date) return 'Não informada';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffd358" />
        <Text style={styles.infoText}>Buscando amiguinhos...</Text>
      </View>
    );
  }

  if (animais.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Nenhum animal disponível para adoção no momento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={animais}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PetCard 
            pet={item} 
            onPress={() => handlePetPress(item)}
          />
        )}
      />

      {/* Modal de Detalhes - TODAS AS INFORMAÇÕES */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        
        {selectedAnimal && (
          <View style={styles.fullScreenModal}>
            {/* Header Fixo */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedAnimal.nome}</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            {/* Conteúdo com Scroll */}
            <ScrollView 
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Foto Principal */}
              <Image 
                source={{ uri: selectedAnimal.fotoPrincipal || 'https://placehold.co/400x300/e0e0e0/757575?text=Sem+Foto' }} 
                style={styles.modalImage} 
              />
              
              <View style={styles.modalInfo}>
                {/* Informações Básicas */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Informações Básicas</Text>
                  
                  <View style={styles.tagsRow}>
                    <View style={styles.mainTag}>
                      <Text style={styles.mainTagText}>{selectedAnimal.sexo || 'Não informado'}</Text>
                    </View>
                    <View style={styles.mainTag}>
                      <Text style={styles.mainTagText}>{selectedAnimal.idade || 'Não informado'}</Text>
                    </View>
                    <View style={styles.mainTag}>
                      <Text style={styles.mainTagText}>{selectedAnimal.porte || 'Não informado'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Espécie</Text>
                      <Text style={styles.infoValue}>{selectedAnimal.especie || 'Não informada'}</Text>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Localização</Text>
                      <Text style={styles.infoValue}>{selectedAnimal.localizacao || 'Não informada'}</Text>
                    </View>
                  </View>
                </View>

                {/* Temperamento */}
                {(selectedAnimal.temperamento && selectedAnimal.temperamento.length > 0) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Temperamento</Text>
                    {renderTags(selectedAnimal.temperamento)}
                  </View>
                )}

                {/* Saúde */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Saúde</Text>
                  
                  {(selectedAnimal.saude && selectedAnimal.saude.length > 0) && (
                    <>
                      {renderTags(selectedAnimal.saude, { marginBottom: 12 })}
                    </>
                  )}
                  
                  {selectedAnimal.doencas ? (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Doenças/Condições</Text>
                      <Text style={styles.infoValue}>{selectedAnimal.doencas}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noInfoText}>Nenhuma doença ou condição especial informada</Text>
                  )}
                </View>

                {/* Exigências para Adoção */}
                {(selectedAnimal.exigencias && selectedAnimal.exigencias.length > 0) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Exigências para Adoção</Text>
                    {renderTags(selectedAnimal.exigencias)}
                  </View>
                )}

                {/* Sobre o Animal */}
                {selectedAnimal.sobre && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sobre o Animal</Text>
                    <Text style={styles.description}>{selectedAnimal.sobre}</Text>
                  </View>
                )}
                {/* Galeria de Fotos (se tiver mais fotos) */}
                {selectedAnimal.fotos && selectedAnimal.fotos.length > 1 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mais Fotos ({selectedAnimal.fotos.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.galleryContainer}>
                        {selectedAnimal.fotos.map((foto, index) => (
                          <Image 
                            key={index}
                            source={{ uri: foto }} 
                            style={styles.galleryImage} 
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  list: { 
    paddingHorizontal: 8, 
    paddingTop: 8, 
    paddingBottom: 16 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  infoText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
    fontFamily: 'Roboto-Regular',
  },
  
  // Modal Styles - TELA INTEIRA
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffffff',
    backgroundColor: '#ffe29b',
    marginTop: StatusBar.currentHeight,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#ffe29b',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#434343',
    fontFamily: 'Roboto-Regular',
    lineHeight: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Medium',
    color: '#434343',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  modalInfo: {
    padding: 16,
  },
  
  // Seções
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    color: '#f7a800',
    marginBottom: 16,
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
    color: '#f7a800',
    textTransform: 'capitalize',
  },
  
  // Grid de informações
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#434343',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666',
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
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#434343',
  },
  
  // Descrição
  description: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Roboto-Regular',
    lineHeight: 20,
  },
  
  // Texto sem informação
  noInfoText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Roboto-Regular',
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
    backgroundColor: '#f0f0f0',
  },
});