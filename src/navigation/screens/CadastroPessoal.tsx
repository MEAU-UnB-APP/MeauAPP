import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, storage } from "../../config/firebase";
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import SEButton from '../../components/SEButton';
import SETextInput from '../../components/SETextInput'; 
import { useNavigation } from '@react-navigation/native';
import { registerForPushNotifications } from '../../services/fcmService';

export function CadastroPessoal() {
  const navigation = useNavigation<any>();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idade, setIdade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchImageBlob = async (uri: string): Promise<Blob> => {
    try {
      const response = await fetch(uri);
      return await response.blob();
    } catch (error) {
      throw new Error(`Falha ao processar a imagem: ${error}`);
    }
  };

  const uploadProfileImage = async (imageUri: string, userId: string): Promise<string> => {
    try {
      const imageBlob = await fetchImageBlob(imageUri);
      
      const imageName = `perfis/${userId}/foto_perfil_${Date.now()}.jpg`;
      const storageRef = ref(storage, imageName);

      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          'uploadedBy': userId,
          'uploadTime': new Date().toISOString(),
          'compressionQuality': 'original',
          'type': 'profile_picture'
        }
      };

      const snapshot = await uploadBytes(storageRef, imageBlob, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      throw new Error(`Falha no upload da foto de perfil: ${error}`);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da permissão da câmera e galeria para adicionar fotos.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setModalVisible(false);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setFotoPerfil(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
    setModalVisible(false);
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setModalVisible(false);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setFotoPerfil(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
    setModalVisible(false);
  };

  const handleAddPhoto = () => {
    setModalVisible(true);
  };

  const handleRemovePhoto = () => {
    setFotoPerfil(null);
  };

  const handleCadastro = async () => {
    if (!nome || !idade || !email || !telefone || !username || !password || !confirmPassword) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Criar usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;

      const userDocRef = doc(db, "usuários", userId);

      const userData = {
        nome: nome.trim(),
        email: email.trim(),
        idade: idade.trim(),
        telefone: telefone.trim(),
        username: username.trim(),
        fotoPerfil: null,
        dataCadastro: new Date(),
        ultimaAtualizacao: new Date(),
        tipoUsuario: 'pessoal',
        metadata: {
          storageType: 'firebase_storage',
          hasProfilePicture: false,
          compression: 'none',
          timestamp: new Date().toISOString()
        }
      };

      await setDoc(userDocRef, userData);
      
      console.log('✅ Documento do usuário criado no Firestore');

      if (fotoPerfil) {
        try {
          Alert.alert("Aguarde", "Fazendo upload da foto de perfil...");
          const fotoPerfilUrl = await uploadProfileImage(fotoPerfil, userId);

          await setDoc(
            userDocRef,
            {
              fotoPerfil: fotoPerfilUrl,
              metadata: {
                storageType: 'firebase_storage',
                hasProfilePicture: true,
                compression: 'original_quality',
                timestamp: new Date().toISOString(),
              },
            },
            { merge: true }
          );
        } catch (uploadError) {
          console.error("Erro ao fazer upload da foto de perfil:", uploadError);
          Alert.alert(
            "Aviso",
            "Cadastro concluído, mas não foi possível enviar a foto de perfil agora. Você pode tentar adicionar novamente nas configurações."
          );
        }
      }

      // Limpar formulário após sucesso
      setNome('');
      setEmail('');
      setIdade('');
      setTelefone('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setFotoPerfil(null);

      // Aguardar um pouco para garantir que o documento do usuário foi criado no Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Registrar token FCM após cadastro bem-sucedido
      try {
        console.log('🔔 Registrando notificações após cadastro...');
        const token = await registerForPushNotifications();
        if (token) {
          console.log('✅ Token FCM registrado com sucesso após cadastro');
        } else {
          console.warn('⚠️ Token FCM não foi obtido após cadastro');
        }
      } catch (notificationError: any) {
        console.error('❌ Erro ao registrar notificações no cadastro:', notificationError);
        // Não interrompe o fluxo se falhar
      }

      Alert.alert(
        "Sucesso!", 
        "Cadastro realizado com sucesso! Sua conta foi criada e seus dados foram salvos.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'AppDrawer', params: { screen: 'Adotar' } }],
              }),
          },
        ],
        { cancelable: false }
      );

    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao tentar cadastrar. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este email já está em uso. Tente fazer login ou use outro email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "O email informado não é válido.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.message.includes('upload')) {
        errorMessage = "Erro ao fazer upload da foto de perfil. Você pode tentar novamente mais tarde.";
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.formContainer}>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>As informações preenchidas serão divulgadas apenas para a pessoa com a qual você realizar o processo de adoção e/ou apadrinhamento, após a formalização do processo</Text>
            </View>
            
            <View>
              <Text style={styles.sectionText}>INFORMAÇÕES PESSOAIS</Text>
            </View>
            
            <SETextInput
              placeholder="Nome Completo"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />

            <SETextInput
              placeholder="Idade"
              value={idade}
              onChangeText={setIdade}
              keyboardType="numeric"
            />
          
            <SETextInput
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <SETextInput
              placeholder="Telefone"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />
            
            <View>
              <Text style={styles.sectionText}>INFORMAÇÕES DE PERFIL</Text>
            </View>
            
            <SETextInput
              placeholder="Nome de usuário"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            
            <View style={styles.passwordContainer}>
              <SETextInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                style={styles.passwordInput}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <MaterialIcons 
                  name={isPasswordVisible ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#757575" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordContainer}>
              <SETextInput
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
                style={styles.passwordInput}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              >
                <MaterialIcons 
                  name={isConfirmPasswordVisible ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#757575" 
                />
              </TouchableOpacity>
            </View>
            
            <View>
              <Text style={styles.sectionText}>FOTO DE PERFIL</Text>
            </View>
            
            <View style={styles.addPhotoContainer}>
              {fotoPerfil ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: fotoPerfil }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                    <MaterialIcons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                  <MaterialIcons name="control-point" size={32} color="#434343" />
                  <Text style={styles.addPhotoText}>Adicionar foto</Text>
                </TouchableOpacity>
              )}
            </View>

            <SEButton 
              backgroundColor='#88C9BF' 
              onPress={handleCadastro}
              disabled={loading}
            >
              {loading ? 'CADASTRANDO...' : 'Fazer Cadastro'}
            </SEButton>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Já tenho uma conta</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.divider}>Ou cadastre-se com</Text>

          <TouchableOpacity style={styles.facebookButton} onPress={() => console.log('Facebook cadastro')}>
            <View style={styles.socialButtonContent}>
              <Image 
                source={require('../../assets/images/facebook-icon.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.facebookButtonText}>Cadastrar com Facebook</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton} onPress={() => console.log('Google cadastro')}>
            <View style={styles.socialButtonContent}>
              <Image 
                source={require('../../assets/images/google-icon.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.googleButtonText}>Cadastrar com Google</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

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
              <MaterialIcons name="camera-alt" size={24} color="#434343" />
              <Text style={styles.modalOptionText}>Tirar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickFromGallery}
            >
              <MaterialIcons name="photo-library" size={24} color="#434343" />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#cfe9e5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#434343',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#88c9bf',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 12,
  },
  addPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoButton: {
    width: 128,
    height: 128,
    backgroundColor: '#e6e7e7',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  photoContainer: {
    position: 'relative',
    width: 128,
    height: 128,
  },
  photoImage: {
    width: 128,
    height: 128,
    borderRadius: 4,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  addPhotoText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#434343',
    marginTop: 8,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#88c9bf',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#88c9bf',
  },
  divider: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#757575',
    marginVertical: 20,
    textAlign: 'center',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    width: 232,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    width: 232,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  facebookButtonText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  googleButtonText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
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
    color: '#FF6B6B',
    textAlign: 'center',
  },
});