import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { registerForPushNotifications } from '../../services/fcmService';
import { Colors } from '../../config/colors';
import SEButton from '../../components/SEButton';
import Icon from 'react-native-vector-icons/MaterialIcons';

export function Introducao() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        console.log('🔔 Registrando notificações após login...');
        const token = await registerForPushNotifications();
        if (token) {
          console.log('✅ Token FCM registrado com sucesso após login');
        } else {
          console.warn('⚠️ Token FCM não foi obtido após login');
        }
      } catch (notificationError: any) {
        console.error('❌ Erro ao registrar notificações no login:', notificationError);
      }
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'AppDrawer', params: { screen: 'Adotar' } }],
      });
    } catch (error: any) {
      setErrorMessage('Falha: senha ou e-mail incorreto!');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <Image 
          source={require('../../assets/images/Meau_marca.png')} 
          style={styles.logoImage} 
        />
        <Text style={styles.subtitle}>
          Bem vindo ao Meau!{'\n'}
          Aqui você pode adotar e doar{'\n'}
          cães e gatos com facilidade.
        </Text>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={Colors.preto}
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha"
              placeholderTextColor={Colors.preto}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Icon 
                name={isPasswordVisible ? 'visibility' : 'visibility-off'} 
                size={24} 
                color={Colors.preto} 
              />
            </TouchableOpacity>
          </View>
          
          {errorMessage && (
            <Text style={styles.errorLabel}>{errorMessage}</Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <SEButton 
            color={Colors.roxo}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </SEButton>
          <SEButton 
            color={Colors.rosaescuro}
            onPress={() => navigation.navigate('CadastroPessoal')}
          >
            Cadastre-se
          </SEButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.roxoclaro,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.branco,
    borderWidth: 1,
    borderColor: Colors.preto,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.preto,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.branco,
    borderWidth: 1,
    borderColor: Colors.preto,
    borderRadius: 4,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.preto,
  },
  eyeIcon: {
    padding: 12,
  },
  errorLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.preto,
    backgroundColor: Colors.rosa,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    width: '80%',
    maxWidth: 300,
    gap: 16,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.branco,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  logoImage: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
});