import { Text } from '@react-navigation/elements';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { sendTestNotification, sendDelayedTestNotification } from '../../services/notificationService';
import { registerForPushNotifications } from '../../services/fcmService';
import { useState, useEffect } from 'react';

export function Favoritos() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Registrar para notificações quando o componente montar
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        console.log('🔔 [APP] Configurando notificações...');
        const token = await registerForPushNotifications();
        if (token) {
          setDebugInfo(prev => prev + '\n✅ Token registrado: ' + token.substring(0, 20) + '...');
          console.log('🔔 [APP] Token registrado com sucesso');
        } else {
          setDebugInfo(prev => prev + '\n❌ Falha no registro do token');
          console.log('🔔 [APP] Falha no registro do token');
        }
      } catch (error) {
        console.log('🔔 [APP] Erro na configuração:', error);
        setDebugInfo(prev => prev + '\n❌ Erro: ' + error.message);
      }
    };

    setupNotifications();
  }, []);

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      setDebugInfo(prev => prev + '\n🎯 Iniciando teste normal...');
      console.log('🎯 [APP] Botão pressionado - iniciando teste normal');
      
      const result = await sendTestNotification();
      
      setDebugInfo(prev => prev + '\n✅ Chat criado: ' + result.chatId);
      console.log('🎯 [APP] Teste concluído com sucesso:', result);
      
      Alert.alert(
        '✅ Sucesso!', 
        result.message,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('🎯 [APP] Erro no teste:', error);
      setDebugInfo(prev => prev + '\n❌ Erro: ' + error.message);
      
      Alert.alert(
        '❌ Erro', 
        error.message || 'Falha ao enviar notificação de teste',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelayedTestNotification = async () => {
    try {
      setIsLoading(true);
      setDebugInfo(prev => prev + '\n⏰ Iniciando teste com APP FECHADO...');
      console.log('⏰ [APP] Botão delayed pressionado');
      
      Alert.alert(
        '🚨 IMPORTANTE!',
        'Em 15 segundos a notificação será enviada.\n\n' +
        'FECHE COMPLETAMENTE O APP AGORA!\n\n' +
        '• Toque em "OK"\n' +
        '• Feche o app (remove from recent apps)\n' +
        '• Aguarde a notificação na BARRA',
        [{ text: 'OK, Vou Fechar o App!' }]
      );

      const result = await sendDelayedTestNotification();
      
      setDebugInfo(prev => prev + '\n✅ Chat DELAYED criado: ' + result.chatId);
      console.log('⏰ [APP] Teste delayed concluído:', result);
      
      // Esta alerta só aparecerá se você reabrir o app
      Alert.alert(
        '✅ Teste Concluído!', 
        result.message + '\n\n' +
        'Se você fechou o app, a notificação deve ter aparecido na BARRA!',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('⏰ [APP] Erro no teste delayed:', error);
      setDebugInfo(prev => prev + '\n❌ Erro delayed: ' + error.message);
      
      Alert.alert(
        '❌ Erro', 
        error.message || 'Falha ao enviar notificação delayed',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterNotifications = async () => {
    try {
      setIsLoading(true);
      setDebugInfo(prev => prev + '\n🔔 Registrando notificações...');
      console.log('🔔 [APP] Registrando notificações manualmente...');
      
      const token = await registerForPushNotifications();
      
      if (token) {
        setDebugInfo(prev => prev + '\n✅ Token: ' + token.substring(0, 20) + '...');
        Alert.alert('✅ Registrado!', 'Agora você pode receber notificações push.');
      } else {
        setDebugInfo(prev => prev + '\n⚠️ Token não obtido');
        Alert.alert('⚠️ Atenção', 'Não foi possível registrar para notificações.');
      }
    } catch (error) {
      setDebugInfo(prev => prev + '\n❌ Erro registro: ' + error.message);
      Alert.alert('❌ Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Teste de Notificações Push</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleTestNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Enviando...' : '📱 Teste Normal (App Aberto)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.delayedButton]}
        onPress={handleDelayedTestNotification}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Preparando...' : '🚨 TESTE COM APP FECHADO'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={handleRegisterNotifications}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>🔔 Registrar Notificações</Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        • <Text style={styles.bold}>Teste Normal:</Text> App aberto{'\n'}
        • <Text style={styles.bold}>Teste com App Fechado:</Text> Fecha o app após clicar{'\n'}
        • Verifique a BARRA de notificações do celular
      </Text>

      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>{debugInfo || 'Nenhuma informação ainda...'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#88c9bf',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 250,
    alignItems: 'center',
  },
  delayedButton: {
    backgroundColor: '#ff4444',
  },
  secondaryButton: {
    backgroundColor: '#ff8a65',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
  },
  debugContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
    maxHeight: 200,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});