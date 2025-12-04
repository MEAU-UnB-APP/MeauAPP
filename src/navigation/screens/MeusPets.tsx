import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Alert } from 'react-native';
import { PetCard } from '../../components/PetCard';
import { PetDetailsModal } from '../../components/PetDetailsModal';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { Animal } from '../../types/index';
import { Colors } from '../../config/colors';

export function MeusPets() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true; 

      const fetchAnimaisDisponiveis = async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;

          const animaisCollectionRef = collection(db, "animais");
          const q = query(animaisCollectionRef, where("dono", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (isActive) {
            const animaisList = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Animal[];

            setAnimais(animaisList);
          }
        } catch (error) {
          console.error("Erro ao buscar seus animais: ", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchAnimaisDisponiveis();

      return () => {
        isActive = false;
        setLoading(true); 
      };
    }, [])
  );

  const handleToggleVisibility = async (isVisible: boolean) => {
    if (!selectedAnimal) return;
    try {
      const petRef = doc(db, "animais", selectedAnimal.id);
      await updateDoc(petRef, { disponivel: isVisible });
      
      // Atualizar o estado local
      setAnimais(prevAnimais =>
        prevAnimais.map(animal =>
          animal.id === selectedAnimal.id ? { ...animal, disponivel: isVisible } : animal
        )
      );
      
      // Atualizar o animal selecionado
      setSelectedAnimal({ ...selectedAnimal, disponivel: isVisible });
    } catch (error) {
      console.error("Não foi possível atualizar:", error);
      Alert.alert("Erro", "Não foi possível atualizar a visibilidade do animal");
    }
  };

  const handleRemovePet = async () => {
    if (!selectedAnimal) return;
    try {
      await deleteDoc(doc(db, "animais", selectedAnimal.id));
      
      // Remover da lista local
      setAnimais(prevAnimais => prevAnimais.filter(animal => animal.id !== selectedAnimal.id));
      
      // Fechar modal
      setModalVisible(false);
      setSelectedAnimal(null);
      
      Alert.alert("Sucesso", "Animal removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover animal: ", error);
      Alert.alert("Erro", "Não foi possível remover o animal");
    }
  };

  const handlePetPress = (animal: Animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAnimal(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.roxo} />
        <Text style={styles.infoText}>Buscando amiguinhos...</Text>
      </View>
    );
  }

  if (animais.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Nenhum animal foi cadastrado.</Text>
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
            isOwner={true}
            onPress={() => handlePetPress(item)}
            onToggleVisibility={(isVisible) => {
              const petRef = doc(db, "animais", item.id);
              updateDoc(petRef, { disponivel: isVisible }).then(() => {
                setAnimais(prevAnimais =>
                  prevAnimais.map(animal =>
                    animal.id === item.id ? { ...animal, disponivel: isVisible } : animal
                  )
                );
              }).catch((error) => {
                console.error("Não foi possível atualizar:", error);
              });
            }}
          />
        )}
      />

      <PetDetailsModal
        visible={modalVisible}
        animal={selectedAnimal}
        onClose={handleCloseModal}
        isOwner={true}
        onToggleVisibility={handleToggleVisibility}
        onRemovePet={handleRemovePet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.branco,
  },
  list: { 
    paddingHorizontal: 8, 
    paddingTop: 8, 
    paddingBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.branco,
    padding: 20,
  },
  infoText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
  },
});
