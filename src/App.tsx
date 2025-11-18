import 'react-native-gesture-handler';
import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { createURL } from 'expo-linking';
import { View, StyleSheet, Image, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useColorScheme } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import  AppRoutes  from "./routes/AppRoutes";
import { registerForPushNotificationsAsync, setupNotificationListeners } from './services/notificationService';
import { auth } from './config/firebase';


Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/newspaper.png'),
  require('./assets/bell.png'),
]);

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

export function App() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    'SpaceMono': require('./assets/fonts/SpaceMono-Regular.ttf'),
    'Courgette-Regular': require('./assets/fonts/Courgette-Regular.ttf'), 
    'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),   
  });

    const [isSplashVisible, setSplashVisible] = useState(true);

  // Configurar notificações push quando o usuário estiver autenticado
  useEffect(() => {
    console.log('🔔 Configurando listeners de autenticação para notificações...');
    
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      console.log('🔐 Estado de autenticação mudou. Usuário:', user ? user.uid : 'null');
      
      if (user) {
        console.log('✅ Usuário autenticado detectado. Registrando notificações...');
        // Registrar token FCM quando o usuário faz login
        try {
          // Adicionar um pequeno delay para garantir que o documento do usuário existe no Firestore
          setTimeout(async () => {
            await registerForPushNotificationsAsync();
          }, 1000);
        } catch (error: any) {
          console.error('❌ Erro ao registrar notificações no App.tsx:', error);
          console.error('❌ Mensagem:', error?.message);
        }
      } else {
        console.log('👤 Usuário não autenticado. Notificações não serão registradas.');
      }
    });

    // Configurar listeners de notificações
    const notificationListeners = setupNotificationListeners(
      (notification) => {
        console.log('📬 Notificação recebida:', notification);
      },
      (response) => {
        console.log('👆 Notificação tocada:', response);
        // Aqui você pode adicionar navegação para o chat específico
        // baseado nos dados da notificação (response.notification.request.content.data)
      }
    );

    return () => {
      unsubscribeAuth();
      notificationListeners.remove();
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        setSplashVisible(false);
      }, 3000); 
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (isSplashVisible) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('./assets/images/Meau_malha.png')} 
          style={styles.backgroundImage} 
        />
        <Image 
          source={require('./assets/images/Meau_marca.png')} 
          style={styles.logoImage} 
        />
      </View>
    );
  }

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme

  return (
    <AuthProvider>
        <NavigationContainer
            theme={theme}
            linking={{
              enabled: true,
              prefixes: [prefix],
            }}
            onReady={() => {
                SplashScreen.hideAsync();
            }}
        >
            <AppRoutes />
        </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#88c9bf',
  },
  backgroundImage: {
    position: 'absolute', 
    width: '100%',
    height: '100%',
    resizeMode: 'cover', 
  },
  logoImage: {

    width: 300, 
    resizeMode: 'contain',
  },
});
