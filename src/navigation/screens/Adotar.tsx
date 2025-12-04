import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Text, 
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { PetCard } from '../../components/PetCard';
import { PetDetailsModal } from '../../components/PetDetailsModal';
import { Animal } from '../../types/index'; 
import { db } from '../../config/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Colors } from '../../config/colors';
import SETitle from '../../components/SETitle'; 

type FilterValue<T> = T | null;

interface Filters {
  especie: FilterValue<'Cachorro' | 'Gato'>;
  sexo: FilterValue<'Macho' | 'Fêmea'>;
  idade: FilterValue<'Filhote' | 'Adulto' | 'Idoso'>;
  porte: FilterValue<'Pequeno' | 'Médio' | 'Grande'>;
}

export function Adotar() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [allAnimais, setAllAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    especie: null,
    sexo: null,
    idade: null,
    porte: null,
  });

useFocusEffect(
  useCallback(() => { 
    let isActive = true; 
    const fetchAnimaisDisponiveis = async () => {
      try {
        const animaisCollectionRef = collection(db, "animais");
        const q = query(animaisCollectionRef, where("disponivel", "==", true));
        const querySnapshot = await getDocs(q);
        const animaisList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Animal[];

        if (isActive) {
          setAllAnimais(animaisList);
          setAnimais(animaisList);
        }
      } catch (error) {
        console.error("Erro ao buscar animais disponíveis: ", error);
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

  // Filtrar animais baseado nos filtros selecionados
  React.useEffect(() => {
    let filtered = [...allAnimais];

    if (filters.especie) {
      filtered = filtered.filter(animal => animal.especie === filters.especie);
    }
    if (filters.sexo) {
      filtered = filtered.filter(animal => animal.sexo === filters.sexo);
    }
    if (filters.idade) {
      filtered = filtered.filter(animal => animal.idade === filters.idade);
    }
    if (filters.porte) {
      filtered = filtered.filter(animal => animal.porte === filters.porte);
    }

    setAnimais(filtered);
  }, [filters, allAnimais]);

  const handlePetPress = (animal: Animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAnimal(null);
  };

  const handleFilterChange = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      especie: null,
      sexo: null,
      idade: null,
      porte: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  const FilterButton: React.FC<{
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ label, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isSelected && styles.filterButtonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.roxo} />
        <Text style={styles.infoText}>Buscando amiguinhos...</Text>
      </View>
    );
  }

  if (allAnimais.length === 0 && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Nenhum animal disponível para adoção no momento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seção de Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {/* Filtro de Espécie */}
          <View style={styles.filterSection}>
            <SETitle type="second" color="roxo" style={styles.filterLabel}>
              Espécie
            </SETitle>
            <View style={styles.filterButtonsRow}>
              <FilterButton
                label="Todos"
                isSelected={filters.especie === null}
                onPress={() => handleFilterChange('especie', null)}
              />
              <FilterButton
                label="Cachorro"
                isSelected={filters.especie === 'Cachorro'}
                onPress={() => handleFilterChange('especie', 'Cachorro')}
              />
              <FilterButton
                label="Gato"
                isSelected={filters.especie === 'Gato'}
                onPress={() => handleFilterChange('especie', 'Gato')}
              />
            </View>
          </View>

          {/* Filtro de Sexo */}
          <View style={styles.filterSection}>
            <SETitle type="second" color="roxo" style={styles.filterLabel}>
              Sexo
            </SETitle>
            <View style={styles.filterButtonsRow}>
              <FilterButton
                label="Todos"
                isSelected={filters.sexo === null}
                onPress={() => handleFilterChange('sexo', null)}
              />
              <FilterButton
                label="Macho"
                isSelected={filters.sexo === 'Macho'}
                onPress={() => handleFilterChange('sexo', 'Macho')}
              />
              <FilterButton
                label="Fêmea"
                isSelected={filters.sexo === 'Fêmea'}
                onPress={() => handleFilterChange('sexo', 'Fêmea')}
              />
            </View>
          </View>

          {/* Filtro de Idade */}
          <View style={styles.filterSection}>
            <SETitle type="second" color="roxo" style={styles.filterLabel}>
              Idade
            </SETitle>
            <View style={styles.filterButtonsRow}>
              <FilterButton
                label="Todos"
                isSelected={filters.idade === null}
                onPress={() => handleFilterChange('idade', null)}
              />
              <FilterButton
                label="Filhote"
                isSelected={filters.idade === 'Filhote'}
                onPress={() => handleFilterChange('idade', 'Filhote')}
              />
              <FilterButton
                label="Adulto"
                isSelected={filters.idade === 'Adulto'}
                onPress={() => handleFilterChange('idade', 'Adulto')}
              />
              <FilterButton
                label="Idoso"
                isSelected={filters.idade === 'Idoso'}
                onPress={() => handleFilterChange('idade', 'Idoso')}
              />
            </View>
          </View>

          {/* Filtro de Porte */}
          <View style={styles.filterSection}>
            <SETitle type="second" color="roxo" style={styles.filterLabel}>
              Porte
            </SETitle>
            <View style={styles.filterButtonsRow}>
              <FilterButton
                label="Todos"
                isSelected={filters.porte === null}
                onPress={() => handleFilterChange('porte', null)}
              />
              <FilterButton
                label="Pequeno"
                isSelected={filters.porte === 'Pequeno'}
                onPress={() => handleFilterChange('porte', 'Pequeno')}
              />
              <FilterButton
                label="Médio"
                isSelected={filters.porte === 'Médio'}
                onPress={() => handleFilterChange('porte', 'Médio')}
              />
              <FilterButton
                label="Grande"
                isSelected={filters.porte === 'Grande'}
                onPress={() => handleFilterChange('porte', 'Grande')}
              />
            </View>
          </View>
        </ScrollView>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
          </TouchableOpacity>
        )}
      </View>

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
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.infoText}>
              Nenhum animal encontrado com os filtros selecionados.
            </Text>
          </View>
        }
      />

      <PetDetailsModal
        visible={modalVisible}
        animal={selectedAnimal}
        onClose={closeModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.branco, 
  },
  filtersContainer: {
    backgroundColor: Colors.branco,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cinza,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterSection: {
    marginRight: 24,
    minWidth: 120,
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 14,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.cinza,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.cinza,
  },
  filterButtonSelected: {
    backgroundColor: Colors.roxo,
    borderColor: Colors.roxo,
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: Colors.preto,
  },
  filterButtonTextSelected: {
    color: Colors.branco,
    fontFamily: 'Roboto-Medium',
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: Colors.rosaescuro,
  },
  clearFiltersText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: Colors.branco,
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
    minHeight: 200,
  },
  infoText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
});
