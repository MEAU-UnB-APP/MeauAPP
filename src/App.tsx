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
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


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

  useEffect(() => {
    const configureNotifications = async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('chat-updates', {
            name: 'Atualizações de chat',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const existingPermissions = await Notifications.getPermissionsAsync();
        let finalStatus = existingPermissions.status;

        if (existingPermissions.status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Permissões de notificação não concedidas.');
        }
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
    };

    configureNotifications();
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
