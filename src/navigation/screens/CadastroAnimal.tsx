import React, { useState } from "react";
import { 
  View, 
  StyleSheet,
  ScrollView, 
  SafeAreaView,
  Alert
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from '@react-navigation/native'; 
import SEButton from "../../components/SEButton";
import SETitle from '../../components/SETitle';
import SETextInput from '../../components/SETextInput';
import SERadioButtonGroup from "../../components/SERadioButtonGroup";
import SECheckboxGroup from "../../components/SECheckboxGroup";
import SEImagePicker from "../../components/SEImagePicker";

import { db, auth, storage } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

  const [selectedType, setSelectedType] = useState<OptionType>('ADOÇÃO');
  const [nome, setNome] = useState('');
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

  const compressImage = async (uri: string, quality: number = 0.85): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        
        const response = await fetch(uri);
        const originalBlob = await response.blob();

        if (typeof document !== 'undefined') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let { width, height } = img;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (compressedBlob) => {
                if (compressedBlob) {
                  resolve(compressedBlob);
                } else {
                  reject(new Error('Falha na compressão'));
                }
              },
              'image/jpeg',
              quality
            );
          };

          img.onerror = reject;
          img.src = URL.createObjectURL(originalBlob);
        } else {
          resolve(originalBlob);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const uploadImages = async (imageUris: string[], userId: string): Promise<string[]> => {
    
    const uploadPromises = imageUris.map(async (uri, index) => {
      try {
        
        const compressedBlob = await compressImage(uri, 0.85);
        

        const imageName = `animais/${userId}/${Date.now()}_${index}.jpg`;
        const storageRef = ref(storage, imageName);

        const metadata = {
          contentType: 'image/jpeg',
          customMetadata: {
            'uploadedBy': userId,
            'uploadTime': new Date().toISOString(),
            'compressionQuality': '85%',
            'originalSize': (await (await fetch(uri)).blob()).size.toString(),
            'compressedSize': compressedBlob.size.toString(),
            'reduction': `${((1 - compressedBlob.size / (await (await fetch(uri)).blob()).size) * 100).toFixed(1)}%`
          }
        };

        const snapshot = await uploadBytes(storageRef, compressedBlob, metadata);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
      } catch (error) {
        throw new Error(`Falha no upload da imagem ${index + 1}: ${error}`);
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleFinalizar = async () => {
    
    if (!nome.trim() || !selectedEspecie || !selectedSexo || !selectedPorte || !selectedAge) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos obrigatórios (nome, espécie, sexo, porte e idade).");
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
        doencas: doencas.trim(),
        sobre: sobre.trim(),
        tipoCadastro: selectedType,
        dataCadastro: new Date(),
        dono: userId,
        fotos: fotosUrls,
        disponivel: true,
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
        
        <View style={styles.fieldGroup}>
          <SETextInput
            placeholder="Doenças do animal (opcional)"
            value={doencas}
            onChangeText={setDoencas}
          />
        </View>

        <View style={styles.fieldGroup}>
          <SETitle type="second" color="azul">EXIGÊNCIAS PARA ADOÇÃO</SETitle>
          <SECheckboxGroup
            options={EXIGENCIAS_OPTIONS}
            selectedValues={selectedExigencias}
            onSelectionChange={setSelectedExigencias}
          />
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
});
