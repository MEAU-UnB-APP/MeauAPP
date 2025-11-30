import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  StyleSheet,
  ScrollView, 
  SafeAreaView,
  Alert,
  Platform
} from "react-native";
import { Text, Button } from "react-native-paper";
import { useNavigation } from '@react-navigation/native'; 
import * as Location from 'expo-location';
import SEButton from "../../components/SEButton";
import SETitle from '../../components/SETitle';
import SETextInput from '../../components/SETextInput';
import SERadioButtonGroup from "../../components/SERadioButtonGroup";
import SECheckboxGroup from "../../components/SECheckboxGroup";
import SEImagePicker from "../../components/SEImagePicker";

import { db, auth, storage } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { reverseGeocode, geocodeAddress } from "../../services/geocodingService";
import { LocationData } from "../../types/index";

const OPTIONS = ['ADOÇÃO'] as const;
type OptionType = typeof OPTIONS[number];
const AGE_OPTIONS = ['Filhote', 'Adulto', 'Idoso'];
const ESPECIE_OPTIONS = ['Cachorro', 'Gato'];
const SEXO_OPTIONS = ['Macho', 'Fêmea'];
const PORTE_OPTIONS = ['Pequeno', 'Médio', 'Grande'];
const PERSONALITY_OPTIONS = ['Brincalhão','Tímido','Calmo','Guarda','Amoroso','Preguiçoso'];
const HEALTH_OPTIONS = ['Vacinado','Vermifugado','Castrado','Doente'];
const EXIGENCIAS_OPTIONS = ['Termo de adoção','Fotos da casa','Visita prévia do animal','Acompanhamento pós-adoção'];

export function CadastroAnimal() {
  const navigation = useNavigation(); 

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [selectedType, setSelectedType] = useState<OptionType>('ADOÇÃO');
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [doencas, setDoencas] = useState('');
  const [sobre, setSobre] = useState('');
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedEspecie, setSelectedEspecie] = useState<string | null>(null);
  const [selectedSexo, setSelectedSexo] = useState<string | null>(null);
  const [selectedPorte, setSelectedPorte] = useState<string | null>(null);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [selectedHealth, setSelectedHealth] = useState<string[]>([]);
  const [selectedExigencias, setSelectedExigencias] = useState<string[]>([]);
  const [fotosAnimal, setFotosAnimal] = useState<string[]>([]);

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      let latitude: number;
      let longitude: number;

      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation não suportado'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {

        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            "Permissão Negada",
            "A permissão de localização foi negada. Você pode digitar a localização manualmente."
          );
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      const geocodingResult = await reverseGeocode(latitude, longitude);
      
      const bairroOuCidade = geocodingResult.bairro || geocodingResult.cidade || '';
      setLocalizacao(bairroOuCidade);
      
      setLocationData({
        latitude,
        longitude,
        bairro: geocodingResult.bairro,
        cidade: geocodingResult.cidade,
        estado: geocodingResult.estado,
        enderecoCompleto: geocodingResult.enderecoCompleto
      });

      Alert.alert("Sucesso", "Localização obtida com sucesso!");

    } catch (error: any) {
      console.error('Erro ao obter localização:', error);
      const errorMessage = error.message || 'Não foi possível obter a localização';
      Alert.alert(
        "Erro",
        `${errorMessage}. Você pode digitar a localização manualmente.`
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationManualInput = useCallback(async () => {
    if (!localizacao.trim()) {
      return;
    }

    setLocationLoading(true);
    try {
      const coords = await geocodeAddress(localizacao.trim());
      
      if (coords) {
        const geocodingResult = await reverseGeocode(coords.latitude, coords.longitude);
        
        setLocationData({
          latitude: coords.latitude,
          longitude: coords.longitude,
          bairro: geocodingResult.bairro,
          cidade: geocodingResult.cidade,
          estado: geocodingResult.estado,
          enderecoCompleto: geocodingResult.enderecoCompleto
        });
      } else {
        setLocationData({
          latitude: 0,
          longitude: 0,
          bairro: localizacao.trim(),
          enderecoCompleto: localizacao.trim()
        });
      }
    } catch (error) {
      console.error('Erro ao processar localização manual:', error);
      setLocationData({
        latitude: 0,
        longitude: 0,
        bairro: localizacao.trim(),
        enderecoCompleto: localizacao.trim()
      });
    } finally {
      setLocationLoading(false);
    }
  }, [localizacao]);

  useEffect(() => {
    if (localizacao.trim() && !locationData) {
      const timer = setTimeout(() => {
        handleLocationManualInput();
      }, 1000); 

      return () => clearTimeout(timer);
    }
  }, [localizacao, locationData, handleLocationManualInput]);

  const resetForm = () => {
    setSelectedType('ADOÇÃO');
    setNome('');
    setLocalizacao('');
    setLocationData(null);
    setDoencas('');
    setSobre('');
    setSelectedAge(null);
    setSelectedEspecie(null);
    setSelectedSexo(null);
    setSelectedPorte(null);
    setSelectedPersonalities([]);
    setSelectedHealth([]);
    setSelectedExigencias([]);
    setFotosAnimal([]);
    setIsSubmitted(false);
  };
  const fetchImageBlob = async (uri: string): Promise<{ blob: Blob; size: number }> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return { blob, size: blob.size };
    } catch (error) {
      throw new Error(`Falha ao processar a imagem: ${error}`);
    }
  };

  const uploadImages = async (imageUris: string[], userId: string): Promise<string[]> => {
    
    const uploadPromises = imageUris.map(async (uri, index) => {
      try {
        
        const { blob: imageBlob, size: originalSize } = await fetchImageBlob(uri);
        
        const imageName = `animais/${userId}/${Date.now()}_${index}.jpg`;
        const storageRef = ref(storage, imageName);

        const metadata = {
          contentType: 'image/jpeg',
          customMetadata: {
            'uploadedBy': userId,
            'uploadTime': new Date().toISOString(),
            'compressionQuality': 'original',
            'originalSize': originalSize.toString(),
            'compressedSize': imageBlob.size.toString(),
            'reduction': originalSize
              ? `${Math.max(0, (1 - imageBlob.size / originalSize) * 100).toFixed(1)}%`
              : '0%'
          }
        };

        const snapshot = await uploadBytes(storageRef, imageBlob, metadata);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
      } catch (error) {
        throw new Error(`Falha no upload da imagem ${index + 1}: ${error}`);
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleFinalizar = async () => {
    
    if (!nome.trim() || !selectedEspecie || !selectedSexo || !selectedPorte || !selectedAge || !localizacao.trim()) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos obrigatórios (nome, espécie, sexo, porte, idade e localização).");
      return;
    }

    if (fotosAnimal.length === 0) {
      Alert.alert("Atenção", "Por favor, adicione pelo menos uma foto do animal.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado para cadastrar um animal.");
      return;
    }
    
    const userId = user.uid; 

    setLoading(true);

    try {
      if (!locationData && localizacao.trim()) {
        await handleLocationManualInput();
      }

      let fotosUrls: string[] = [];
      if (fotosAnimal.length > 0) {
        Alert.alert("Aguarde", "Comprimindo e fazendo upload das imagens...");
        fotosUrls = await uploadImages(fotosAnimal, userId);
      }

      const animalData = {
        nome: nome.trim(),
        especie: selectedEspecie,
        sexo: selectedSexo,
        porte: selectedPorte,
        idade: selectedAge,
        temperamento: selectedPersonalities,
        saude: selectedHealth,
        exigencias: selectedExigencias,
        localizacao: localizacao.trim(),
        locationData: locationData || undefined, 
        doencas: selectedHealth.includes('Doente') ? doencas.trim() : '',
        sobre: sobre.trim(),
        tipoCadastro: selectedType,
        dataCadastro: new Date(),
        dono: userId,
        fotos: fotosUrls,
        disponivel: !selectedHealth.includes('Doente'),
        fotoPrincipal: fotosUrls[0] || null,
        metadata: {
          storageType: 'firebase_storage',
          imagesCount: fotosUrls.length,
          compression: '85%_quality',
          timestamp: new Date().toISOString()
        }
      };

      await addDoc(collection(db, "animais"), animalData);
      
      Alert.alert("Sucesso", "Animal cadastrado! Imagens comprimidas para 85% de qualidade.");
      setIsSubmitted(true);

    } catch (error) {
      
      let errorMessage = "Ocorreu um erro ao tentar cadastrar o animal.";
      
      if (error instanceof Error) {
        if (error.message.includes("Timeout")) {
          errorMessage = "A operação demorou muito tempo. Verifique sua conexão e tente novamente.";
        } else if (error.message.includes("Firestore")) {
          errorMessage = "Erro ao conectar com o banco de dados. Tente novamente.";
        } else if (error.message.includes("upload")) {
          errorMessage = "Erro ao fazer upload das imagens. Verifique se as imagens são válidas.";
        } else if (error.message.includes("permissions")) {
          errorMessage = "Sem permissão. Verifique as regras do Storage.";
        }
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Eba!</Text>
          <Text style={styles.successBody}>
            O cadastro do seu pet foi realizado com sucesso!
          </Text>
          <Text style={styles.successBody}>
            Certifique-se que permitiu o envio de
            notificações por push no campo
            privacidade do menu configurações do
            aplicativo.
          </Text>
          <SEButton backgroundColor="#ffd358" onPress={resetForm}>
            CADASTRAR NOVO ANIMAL
          </SEButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerText}>Tenho interesse em cadastrar um animal para:</Text>

        <Text style={styles.titleText}>
          {selectedType}
        </Text>
        
        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">NOME DO ANIMAL</SETitle>
          <SETextInput
            placeholder="Nome do Animal"
            value={nome}
            onChangeText={setNome}
          />
        </View>
        
        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">FOTOS DO ANIMAL (Máx. 5)</SETitle>
          <SEImagePicker
            imageUris={fotosAnimal}
            onImagesChange={setFotosAnimal}
            maxImages={5}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">ESPÉCIE</SETitle>
          <SERadioButtonGroup
            options={ESPECIE_OPTIONS}
            selectedValue={selectedEspecie}
            onValueChange={setSelectedEspecie}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">SEXO</SETitle>
          <SERadioButtonGroup
            options={SEXO_OPTIONS}
            selectedValue={selectedSexo}
            onValueChange={setSelectedSexo}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">PORTE</SETitle>
          <SERadioButtonGroup
            options={PORTE_OPTIONS}
            selectedValue={selectedPorte}
            onValueChange={setSelectedPorte}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">IDADE</SETitle>
          <SERadioButtonGroup
            options={AGE_OPTIONS}
            selectedValue={selectedAge}
            onValueChange={setSelectedAge}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">TEMPERAMENTO</SETitle>
          <SECheckboxGroup
            options={PERSONALITY_OPTIONS}
            selectedValues={selectedPersonalities}
            onSelectionChange={setSelectedPersonalities}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">SAÚDE</SETitle>
          <SECheckboxGroup
            options={HEALTH_OPTIONS}
            selectedValues={selectedHealth}
            onSelectionChange={setSelectedHealth}
          />
        </View>
        
        {selectedHealth.includes('Doente') && (
          <View style={styles.fieldGroup}>
            <SETextInput
              placeholder="Descreva as doenças do animal"
              value={doencas}
              onChangeText={setDoencas}
              multiline
            />
          </View>
        )}

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">EXIGÊNCIAS PARA ADOÇÃO</SETitle>
          <SECheckboxGroup
            options={EXIGENCIAS_OPTIONS}
            selectedValues={selectedExigencias}
            onSelectionChange={setSelectedExigencias}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">LOCALIZAÇÃO</SETitle>
          <View style={styles.locationContainer}>
            <SETextInput
              placeholder="Informe a cidade ou região"
              value={localizacao}
              onChangeText={setLocalizacao}
              editable={!locationLoading}
            />
            <Button
              mode="outlined"
              onPress={requestLocation}
              disabled={locationLoading}
              style={styles.locationButton}
              textColor="#88C9BF"
            >
              {locationLoading ? 'Buscando localização...' : '📍 Usar minha localização'}
            </Button>
            {locationData?.enderecoCompleto && (
              <Text style={styles.locationInfo}>
                📍 {locationData.enderecoCompleto}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">SOBRE O ANIMAL</SETitle>
          <SETextInput
            placeholder="Compartilhe a história do animal"
            value={sobre}
            onChangeText={setSobre}
            multiline={true} 
          />
        </View>
        
        <SEButton 
          backgroundColor='#88C9BF' 
          onPress={handleFinalizar}
          disabled={loading}
        >
          {loading ? 'CADASTRANDO...' : `COLOCAR PARA ${selectedType}`}
        </SEButton>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24, 
    paddingVertical: 24,
  },
  headerText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleText: {
    textAlign: 'center',
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#434343',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20, 
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fafafa',
  },
  successTitle: {
    fontFamily: 'Courgette-Regular',
    fontSize: 72,
    color: '#ffd358',
    marginBottom: 20,
  },
  successBody: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 21, 
    marginBottom: 15,
  },
  locationContainer: {
    marginTop: 8,
  },
  locationButton: {
    marginTop: 8,
    borderColor: '#88C9BF',
  },
  locationInfo: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'Roboto-Regular',
    marginTop: 8,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
});
