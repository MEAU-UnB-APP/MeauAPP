import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import { registerForPushNotifications } from '../../services/fcmService';
import { Colors } from '../../config/colors';
import SEButton from '../../components/SEButton';
import Icon from 'react-native-vector-icons/MaterialIcons';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, username, password);
      
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

  const handleUsernameChange = (text: string) => {
    setUsername(text);
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
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/Meau_malha.png')} 
        style={styles.backgroundImage} 
      />
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={Colors.preto}
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
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
          
          <View style={styles.buttonWrapper}>
            <SEButton
              color={Colors.roxo}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </SEButton>
            
            <View style={styles.buttonSpacing} />
            
            <SEButton
              color={Colors.roxo}
              variant="outlined"
              onPress={() => navigation.navigate('CadastroPessoal')}
            >
              Cadastro
            </SEButton>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cinza,
    padding: 16,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
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
  buttonWrapper: {
    marginTop: 8,
  },
  buttonSpacing: {
    height: 16,
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
});
