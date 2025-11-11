import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, ScrollView } from 'react-native';
import SEButton from '../../components/SEButton';
import { useNavigation } from '@react-navigation/native'; 

export function Introducao() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Olá!</Text>
          <Text style={styles.subtitle}>
            Bem vindo ao Meau!{'\n'}
            Aqui você pode adotar, doar e ajudar{'\n'}
            cães e gatos com facilidade.{'\n'}
            Qual o seu interesse?
          </Text>
          
          <View style={styles.loginContainer}>
            <Pressable 
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text style={styles.loginText}>Login</Text>
            </Pressable>
            <Pressable 
              onPress={() => navigation.navigate('CadastroPessoal')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                padding: 10,
              })}
            >
              <Text style={styles.loginText}>Cadastre-se</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Image 
              source={require('../../assets/images/Meau_marca_2.png')} 
              style={styles.logoImage} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40, 
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Courgette-Regular',
    fontSize: 72,
    color: '#ffd358',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  logoImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
  },
  loginText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#88c9bf',
    textAlign: 'center',
  },
  buttonContainer: {
    width: 232,
    gap: 16,
    marginBottom: 20,
  }
});