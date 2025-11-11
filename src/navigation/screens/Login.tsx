import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config/firebase';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, username, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'AppDrawer', params: { screen: 'Adotar' } }],
      });
    } catch (error: any) {
      Alert.alert('Erro ao fazer login', error?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Text>{isPasswordVisible ? '👁️' : '🔒'}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('CadastroPessoal')}
          >
            <Text style={styles.secondaryButtonText}>Cadastro</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.facebookButton} onPress={() => console.log('Facebook login')}>
          <View style={styles.socialButtonContent}>
            <Image 
              source={require('../../assets/images/facebook-icon.png')}
              style={styles.socialIcon}
            />
            <Text style={styles.facebookButtonText}>Entrar com Facebook</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={() => console.log('Google login')}>
          <View style={styles.socialButtonContent}>
            <Image 
              source={require('../../assets/images/google-icon.png')}
              style={styles.socialIcon}
            />
            <Text style={styles.googleButtonText}>Entrar com Google</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32, 
  },
  title: {
    fontFamily: 'Courgette-Regular',
    fontSize: 32,
    color: '#ffd358',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
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
    padding: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: '#88c9bf',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#434343',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#88c9bf',
  },
  secondaryButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#88c9bf',
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
  loginText: {
    backgroundColor: 'transparent',
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#88c9bf',
    marginTop: 24,
  },
  logoImage: {
    width: 120,
    resizeMode: 'contain',
  },
});
