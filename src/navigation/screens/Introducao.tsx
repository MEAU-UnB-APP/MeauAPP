import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { Colors } from '../../config/colors';
import SEButton from '../../components/SEButton';

export function Introducao() {
  const navigation = useNavigation<any>();

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
          cães e gatos com facilidade.{'\n'}
          {'\n'}
          Qual o seu interesse?
        </Text>
        
        <View style={styles.buttonContainer}>
          <SEButton 
            color={Colors.roxo}
            onPress={() => navigation.navigate('Login')}
          >
            Login
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
  buttonContainer: {
    width: '80%',
    maxWidth: 300,
    gap: 16,
    marginTop: 20,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.branco,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  logoImage: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
});