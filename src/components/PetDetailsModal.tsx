import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Text,
} from 'react-native';
import { LocationMap } from './LocationMap';
import { Animal } from '../types/index';
import { Colors } from '../config/colors';

interface PetDetailsModalProps {
  visible: boolean;
  animal: Animal | null;
  onClose: () => void;
}

export const PetDetailsModal: React.FC<PetDetailsModalProps> = ({
  visible,
  animal,
  onClose,
}) => {
  if (!animal) return null;

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
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{animal.nome}</Text>
          <View style={styles.headerSpacer} />
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
    fontSize: 20,
    fontFamily: 'Roboto-Medium',
    color: Colors.preto,
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
});

