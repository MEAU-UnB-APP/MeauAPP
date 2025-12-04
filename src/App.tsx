import 'react-native-gesture-handler';
import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
import { auth } from './config/firebase';
import { registerForPushNotifications, setupNotificationHandlers } from './services/fcmService';
import { setNavigationRef, handleNotificationNavigation, setupNotifeeNavigationHandlers } from './services/notificationNavigation';
import { Colors } from './config/colors';

Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/newspaper.png'),
  require('./assets/bell.png'),
]);

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

export function App() {
  const colorScheme = useColorScheme();
  const navigationRef = useNavigationContainerRef();

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
    
    // Listener para mudanças no estado de autenticação
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      console.log('🔐 Estado de autenticação mudou. Usuário:', user ? user.uid : 'null');
      
      if (user) {
        console.log('✅ Usuário autenticado detectado. Registrando notificações...');
        // Registrar token FCM quando o usuário faz login
        // Adicionar delay para garantir que o documento do usuário existe no Firestore
        setTimeout(async () => {
          try {
            await registerForPushNotifications();
          } catch (error: any) {
            console.error('❌ Erro ao registrar notificações no App.tsx:', error);
          }
        }, 1000); // 1 segundo de delay
      } else {
        console.log('👤 Usuário não autenticado. Notificações não serão registradas.');
      }
    });

    // Configurar handlers de notificações
    const removeNotificationHandlers = setupNotificationHandlers(
      (remoteMessage) => {
        console.log('📬 Notificação recebida em foreground:', remoteMessage);
        // Aqui você pode adicionar lógica para mostrar notificação customizada
        // quando o app está em foreground
      },
      (remoteMessage) => {
        console.log('👆 Notificação tocada:', remoteMessage);
        // Navegar diretamente para o chat quando a notificação for tocada
        handleNotificationNavigation(remoteMessage);
      }
    );

    return () => {
      unsubscribeAuth();
      removeNotificationHandlers();
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

  // Configurar referência de navegação e handlers do Notifee
  useEffect(() => {
    setNavigationRef(navigationRef);
    setupNotifeeNavigationHandlers();
  }, [navigationRef]);

  return (
    <AuthProvider>
        <NavigationContainer
            ref={navigationRef}
            theme={theme}
            linking={{
              enabled: true,
              prefixes: [prefix],
            }}
            onReady={() => {
                SplashScreen.hideAsync();
                setNavigationRef(navigationRef);
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
    backgroundColor: Colors.roxo,
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
