import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  ViewStyle,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../config/colors';

interface SEImagePickerProps {
  imageUris: string[];
  onImagesChange: (uris: string[]) => void;
  style?: ViewStyle;
  maxImages?: number;
}

const SEImagePicker: React.FC<SEImagePickerProps> = ({
  imageUris,
  onImagesChange,
  style,
  maxImages = 5,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos da permissão da câmera e galeria para adicionar fotos.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (imageUris.length >= maxImages) {
      Alert.alert("Limite atingido", `Você só pode adicionar até ${maxImages} fotos.`);
      setModalVisible(false);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setModalVisible(false);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        addImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
    setModalVisible(false);
  };

  const pickFromGallery = async () => {
    if (imageUris.length >= maxImages) {
      Alert.alert("Limite atingido", `Você só pode adicionar até ${maxImages} fotos.`);
      setModalVisible(false);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setModalVisible(false);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: maxImages - imageUris.length,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map(asset => asset.uri);
        addImages(newUris);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
    setModalVisible(false);
  };

  const addImage = (uri: string) => {
    if (imageUris.length >= maxImages) {
      Alert.alert("Limite atingido", `Você só pode adicionar até ${maxImages} fotos.`);
      return;
    }
    onImagesChange([...imageUris, uri]);
  };

  const addImages = (uris: string[]) => {
    const availableSlots = maxImages - imageUris.length;
    if (availableSlots <= 0) {
      Alert.alert("Limite atingido", `Você só pode adicionar até ${maxImages} fotos.`);
      return;
    }
    
    const urisToAdd = uris.slice(0, availableSlots);
    onImagesChange([...imageUris, ...urisToAdd]);
    
    if (uris.length > availableSlots) {
      Alert.alert('Algumas fotos não foram adicionadas', `Limite de ${maxImages} fotos atingido.`);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newUris = imageUris.filter((_, i) => i !== index);
    onImagesChange(newUris);
  };

  const handleRemoveAllImages = () => {
    Alert.alert(
      "Remover todas as fotos",
      "Tem certeza que deseja remover todas as fotos?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Remover",
          onPress: () => onImagesChange([]),
          style: "destructive"
        }
      ]
    );
  };

  const showImagePickerOptions = () => {
    if (imageUris.length >= maxImages) {
      Alert.alert("Limite atingido", `Você já adicionou o máximo de ${maxImages} fotos.`);
      return;
    }
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header com contador e botão de remover todas */}
      <View style={styles.header}>
        <Text style={styles.counterText}>
          Fotos ({imageUris.length}/{maxImages})
        </Text>
        {imageUris.length > 0 && (
          <TouchableOpacity onPress={handleRemoveAllImages}>
            <Text style={styles.removeAllText}>Remover todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Container principal */}
      <View style={styles.mainContainer}>
        {/* Botão para adicionar fotos - sempre visível */}
        <TouchableOpacity
          style={[
            styles.placeholderContainer,
            imageUris.length > 0 && styles.placeholderWithImages
          ]}
          onPress={showImagePickerOptions}
        >
          <Icon 
            name="control-point" 
            size={24} 
            color={imageUris.length > 0 ? Colors.roxo : Colors.preto} 
          />
          <Text style={[
            styles.placeholderText,
            imageUris.length > 0 && styles.placeholderTextWithImages
          ]}>
            {imageUris.length === 0 ? 'adicionar foto' : 'adicionar mais fotos'}
          </Text>
        </TouchableOpacity>

        {imageUris.length > 0 && (
          <ScrollView 
            horizontal 
            style={styles.imagesScrollView}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesContainer}
          >
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <ImageBackground
                  source={{ uri }}
                  style={styles.imageBackground}
                  imageStyle={styles.image}
                >
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Icon name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </ImageBackground>
                <Text style={styles.imageNumber}>{index + 1}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Mensagem de instrução quando não há imagens */}
      {imageUris.length === 0 && (
        <Text style={styles.instructionText}>
          Toque para adicionar fotos do animal
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Escolher fonte da foto</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={takePhoto}
            >
              <Icon name="camera-alt" size={24} color="#434343" />
              <Text style={styles.modalOptionText}>Tirar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickFromGallery}
            >
              <Icon name="photo-library" size={24} color="#434343" />
              <Text style={styles.modalOptionText}>Escolher da galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 128,
    borderRadius: 8,
    backgroundColor: Colors.cinza,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#434343',
  },
  removeAllText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.rosaescuro,
    textDecorationLine: 'underline',
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  placeholderContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderWithImages: {
    backgroundColor: Colors.branco,
    borderColor: Colors.roxo,
  },
  placeholderText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#757575',
    marginTop: 6,
    textAlign: 'center',
  },
  placeholderTextWithImages: {
    color: Colors.roxo,
    fontSize: 10,
  },
  imagesScrollView: {
    flex: 1,
    maxHeight: 100,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  image: {
    borderRadius: 8,
  },
  deleteButton: {
    margin: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'Roboto-Medium',
  },
  instructionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#bdbdbd',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.branco,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: '#434343',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 16,
  },
  modalOptionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#434343',
  },
  cancelOption: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  cancelOptionText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.rosaescuro,
    textAlign: 'center',
  },
});

export default SEImagePicker;