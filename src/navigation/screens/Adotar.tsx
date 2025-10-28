import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { PetCard } from '../../components/PetCard';
import { Animal } from '../../types'; 
import { db } from '../../config/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 

export function Adotar() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

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
        renderItem={({ item }) => <PetCard pet={item} />}
      />
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
});