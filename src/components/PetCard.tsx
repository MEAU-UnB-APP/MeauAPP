import * as React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { Animal } from '../types';
import ChatButton from './ChatButton'; // Importando o ChatButton

const CARD = {
  width: 344,
  height: 264,
  headerH: 32,
  imageH: 183,
} as const;
const FOOTER_H = CARD.height - CARD.headerH - CARD.imageH;

interface PetCardProps {
  pet: Animal;
}

export const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const placeholderImage = 'https://placehold.co/344x183/e0e0e0/757575?text=Sem+Foto';

  return (
    <Card style={styles.card} mode="elevated">
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{pet.nome}</Text>

        {/* 2. Criar um container para os ícones ficarem juntos */}
        <View style={styles.iconContainer}>
          <ChatButton
            animalId={pet.id}
            donoId={pet.dono}
            size={24}
            iconColor="#434343"
          />
          
          {/* Seu botão de "curtir" original */}
          <IconButton
            icon="heart-outline"
            size={24}
            iconColor="#434343"
            onPress={() => {
              console.log(`Favoritou ${pet.nome}`);
            }}
          />
        </View>

      </View>

      <Image 
        source={{ uri: pet.fotoPrincipal || placeholderImage }} 
        style={styles.image} 
      />

      <View style={styles.footer}>
        <View style={styles.tagsRow}>
          <Text style={styles.tag}>{pet.sexo}</Text>
          <Text style={styles.tag}>{pet.idade}</Text>
          <Text style={styles.tag}>{pet.porte}</Text>
        </View>
        <Text style={styles.location}>{pet.localizacao}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD.width,
    height: CARD.height,
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    height: CARD.headerH,
    backgroundColor: '#fee29b',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    color: '#434343',
    fontFamily: 'Roboto-Medium',
  },
  // 4. Novo estilo para o container dos ícones
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: CARD.width,
    height: CARD.imageH,
    backgroundColor: '#f0f0f0',
  },
  footer: {
    height: FOOTER_H,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  tagsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 4,
  },
  tag: {
    fontSize: 12,
    color: '#434343',
    fontFamily: 'Roboto-Regular',
    textTransform: 'capitalize', 
  },
  location: {
    fontSize: 12,
    color: '#434343',
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    textTransform: 'capitalize',
    paddingHorizontal: 8,
  },
});
