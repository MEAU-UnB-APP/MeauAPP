import * as React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { Animal } from '../types/index';
import ChatButton from './ChatButton';
import { Colors } from '../config/colors';

const CARD = {
  width: 344,
  height: 264,
  headerH: 32,
  imageH: 183,
} as const;
const FOOTER_H = CARD.height - CARD.headerH - CARD.imageH;

interface PetCardProps {
  pet: Animal;
  onPress: () => void;
  isOwner?: boolean;
  onToggleVisibility?: (isVisible: boolean) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ 
  pet, 
  onPress, 
  isOwner = false,
  onToggleVisibility 
}) => {
  const placeholderImage = 'https://placehold.co/344x183/e0e0e0/757575?text=Sem+Foto';
  const [disponivel, setDisponivel] = React.useState(pet.disponivel);

  // Sincronizar estado quando o pet mudar
  React.useEffect(() => {
    setDisponivel(pet.disponivel);
  }, [pet.disponivel]);

  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      const novoEstado = !disponivel;
      setDisponivel(novoEstado);
      onToggleVisibility(novoEstado);
    }
  };

  // 60% transparente = 40% de opacidade (0.4)
  const cardOpacity = isOwner && !disponivel ? 0.4 : 1;
  const headerColor = isOwner ? Colors.rosaescuro : Colors.roxo;
  const footerColor = isOwner ? Colors.rosa : Colors.roxoclaro;
  const cardBgColor = isOwner ? Colors.rosa : Colors.roxoclaro;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { opacity: cardOpacity, backgroundColor: cardBgColor }]} mode="elevated">
        <View style={[styles.cardHeader, { backgroundColor: headerColor }]}>
          <Text style={styles.cardTitle}>{pet.nome}</Text>
          <View style={styles.iconContainer}>
            {isOwner ? (
              <IconButton
                icon={disponivel ? "eye" : "eye-off"}
                size={24}
                iconColor={Colors.branco}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility();
                }}
              />
            ) : (
              <ChatButton
                animalId={pet.id}
                animalName={pet.nome}
                donoId={pet.dono}
                size={24}
                iconColor={Colors.branco}
              />
            )}
          </View>
        </View>

        <Image 
          source={{ uri: pet.fotoPrincipal || placeholderImage }} 
          style={styles.image} 
        />

        <View style={[styles.footer, { backgroundColor: footerColor }]}>
          <View style={styles.tagsRow}>
            <Text style={styles.tag}>{pet.sexo}</Text>
            <Text style={styles.tag}>{pet.idade}</Text>
            <Text style={styles.tag}>{pet.porte}</Text>
          </View>
          <Text style={styles.location}>{pet.localizacao}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD.width,
    minHeight: CARD.height,
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    color: Colors.branco,
    fontFamily: 'Roboto-Medium',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  image: {
    width: CARD.width,
    height: CARD.imageH,
    backgroundColor: Colors.cinza,
  },
  footer: {
    minHeight: FOOTER_H,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 6,
  },
  tag: {
    fontSize: 12,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
    textTransform: 'capitalize', 
  },
  location: {
    fontSize: 16,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    textTransform: 'capitalize',
    paddingHorizontal: 8,
    marginTop: 4,
  },
});