import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { PetCardUser } from '../../components/PetCardUser';
import { getAuth} from 'firebase/auth'
import { db } from '../../config/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { Animal } from '../../types/index';

export function MeusPets() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    console.log(animais);
  }, [animais]);

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
        renderItem={({ item }) => <PetCardUser pet={item} />}
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
