# 📱 Implementação de Notificações Push - MeauAPP

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema de notificações push no MeauAPP, utilizando **Firebase Cloud Messaging (FCM)** integrado com **Expo** para enviar notificações quando novos chats são criados ou mensagens são enviadas.

---

## 🛠️ Ferramentas e Tecnologias Utilizadas

### 1. **Expo Notifications** (`expo-notifications`)
- **Versão**: `~0.32.12`
- **Função**: Biblioteca do Expo para gerenciar notificações push no React Native
- **Recursos**:
  - Solicitação de permissões
  - Geração de tokens FCM
  - Configuração de canais de notificação (Android)
  - Listeners para notificações recebidas e interações

### 2. **Firebase Cloud Messaging (FCM)**
- **Versão**: Integrado via Firebase Admin SDK
- **Função**: Serviço do Google para envio de notificações push
- **API Utilizada**: FCM V1 (mais moderna e segura)

### 3. **Firebase Admin SDK**
- **Versão**: `^12.7.0`
- **Função**: Permite enviar notificações do servidor (Cloud Functions)
- **Localização**: `functions/` (Cloud Functions do Firebase)

### 4. **Firebase Cloud Functions**
- **Versão**: `^6.6.0`
- **Função**: Funções serverless que disparam automaticamente quando eventos ocorrem no Firestore
- **Triggers Implementados**:
  - `onNewChatCreated`: Dispara quando um novo chat é criado
  - `onNewMessage`: Dispara quando uma nova mensagem é enviada

### 5. **Firestore (Firebase Database)**
- **Função**: Armazena os tokens FCM de cada usuário
- **Estrutura**: `usuários/{userId}/fcmToken`

### 6. **EAS (Expo Application Services)**
- **Função**: Gerencia credenciais FCM e builds do aplicativo
- **Configuração**: Credenciais FCM configuradas no EAS Dashboard

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    DISPOSITIVO MÓVEL                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App React Native (Expo)                               │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  notificationService.ts                         │  │  │
│  │  │  • Solicita permissões                          │  │  │
│  │  │  • Gera token FCM                                │  │  │
│  │  │  • Salva token no Firestore                     │  │  │
│  │  │  • Configura listeners                          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Token FCM salvo
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Firestore                                            │  │
│  │  • Armazena tokens FCM por usuário                   │  │
│  │  • Estrutura: usuários/{userId}/fcmToken            │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            │ Evento (novo chat/mensagem)    │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cloud Functions                                       │  │
│  │  • onNewChatCreated                                    │  │
│  │  • onNewMessage                                       │  │
│  │  • Busca token FCM do destinatário                    │  │
│  │  • Envia notificação via FCM                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            │ Notificação Push                │
│                            ▼                                 │
┌─────────────────────────────────────────────────────────────┐
│              FCM (Firebase Cloud Messaging)                  │
│              • Envia notificação para o dispositivo         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Push Notification
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DISPOSITIVO MÓVEL                         │
│  • Recebe notificação                                       │
│  • Exibe na barra de notificações                           │
│  • Usuário pode tocar para abrir o app                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Processo de Implementação

### Fase 1: Configuração do Cliente (App Mobile)

#### 1.1. Instalação de Dependências

```json
"expo-notifications": "~0.32.12"
```

#### 1.2. Configuração no `app.json`

```json
"plugins": [
  [
    "expo-notifications",
    {
      "icon": "./assets/splash-icon.png",
      "color": "#88c9bf",
      "sounds": [],
      "mode": "production"
    }
  ]
]
```

**Configurações**:
- **icon**: Ícone exibido nas notificações
- **color**: Cor do ícone (Android)
- **mode**: Modo de produção para builds finais

#### 1.3. Criação do Serviço de Notificações

**Arquivo**: `src/services/notificationService.ts`

**Funcionalidades Implementadas**:

1. **`registerForPushNotificationsAsync()`**
   - Verifica se é dispositivo físico (não web)
   - Solicita permissões do usuário
   - Gera token FCM via Expo
   - Configura canal de notificação Android
   - Salva token no Firestore

2. **`saveTokenToFirestore()`**
   - Salva token FCM no documento do usuário
   - Adiciona metadados: `fcmTokenUpdatedAt`, `notificationEnabled`

3. **`removeTokenFromFirestore()`**
   - Remove token quando usuário faz logout
   - Desabilita notificações

4. **`setupNotificationListeners()`**
   - Listener para notificações recebidas (app em foreground)
   - Listener para quando usuário toca na notificação

#### 1.4. Integração no App Principal

**Arquivo**: `src/App.tsx`

```typescript
useEffect(() => {
  const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Registrar token FCM quando o usuário faz login
      await registerForPushNotificationsAsync();
    }
  });

  // Configurar listeners de notificações
  const notificationListeners = setupNotificationListeners(
    (notification) => {
      console.log('📬 Notificação recebida:', notification);
    },
    (response) => {
      console.log('👆 Notificação tocada:', response);
    }
  );

  return () => {
    unsubscribeAuth();
    notificationListeners.remove();
  };
}, []);
```

**Pontos de Integração**:
- **Login**: Registra token automaticamente quando usuário faz login
- **Cadastro**: Registra token após cadastro bem-sucedido (`CadastroPessoal.tsx`)

---

### Fase 2: Configuração do Servidor (Cloud Functions)

#### 2.1. Estrutura das Cloud Functions

**Arquivo**: `functions/index.ts`

#### 2.2. Função: `onNewChatCreated`

**Trigger**: `onDocumentCreated('chats/{chatId}')`

**Fluxo**:
1. Detecta quando um novo chat é criado no Firestore
2. Extrai informações do chat (participantes, contexto)
3. Identifica o destinatário (dono do animal)
4. Busca token FCM do destinatário no Firestore
5. Busca nome do usuário interessado (para personalizar)
6. Prepara payload da notificação
7. Envia via `admin.messaging().send()`

**Payload da Notificação**:
```typescript
{
  token: fcmToken,
  notification: {
    title: 'Nova conversa iniciada! 🐾',
    body: `${interestedUserName} demonstrou interesse em adotar ${animalName}`
  },
  data: {
    type: 'new_chat',
    chatId: chatId,
    animalId: animalId,
    animalName: animalName
  },
  android: {
    priority: 'high',
    notification: {
      channelId: 'chat-updates',
      sound: 'default',
      icon: 'ic_notification',
      color: '#88c9bf'
    }
  }
}
```

#### 2.3. Função: `onNewMessage`

**Trigger**: `onDocumentCreated('chats/{chatId}/messages/{messageId}')`

**Fluxo**:
1. Detecta quando uma nova mensagem é criada
2. Ignora mensagens do sistema
3. Identifica remetente e destinatário
4. Busca token FCM do destinatário
5. Busca nome do remetente
6. Prepara notificação com título (nome do remetente) e corpo (texto da mensagem)
7. Envia notificação

---

### Fase 3: Configuração de Credenciais FCM

#### 3.1. Problema Encontrado

- Firebase estava configurado com **FCM V1 API** (mais moderna)
- Expo ainda solicitava **Server Key** da API legada
- API legada estava desativada no projeto Firebase

#### 3.2. Solução Implementada

1. **Habilitar API Legada Temporariamente** (no Firebase Console)
   - Configurações do projeto > Cloud Messaging
   - Habilitar "API Cloud Messaging (legada)"
   - Copiar "Server Key"

2. **Configurar no EAS Dashboard**
   - Acessar: Credentials > Android > FCM
   - Colar Server Key (não arquivo JSON)
   - Salvar credenciais

#### 3.3. Importante

- As credenciais FCM são incorporadas durante o **build nativo**
- É necessário gerar um **novo APK/AAB** após configurar credenciais
- Comando: `npx eas build --platform android --profile preview`

---

## 🔄 Fluxo Completo de Funcionamento

### Cenário 1: Usuário Faz Login

```
1. Usuário faz login no app
   ↓
2. App detecta autenticação (onAuthStateChanged)
   ↓
3. Chama registerForPushNotificationsAsync()
   ↓
4. Solicita permissão de notificações (diálogo nativo)
   ↓
5. Se usuário aceitar:
   - Gera token FCM via Expo
   - Configura canal Android (chat-updates)
   - Salva token no Firestore: usuários/{userId}/fcmToken
   ↓
6. Token está pronto para receber notificações
```

### Cenário 2: Novo Chat é Criado

```
1. Usuário A demonstra interesse em animal do Usuário B
   ↓
2. App cria documento em Firestore: chats/{chatId}
   ↓
3. Cloud Function onNewChatCreated é disparada automaticamente
   ↓
4. Function busca token FCM do Usuário B no Firestore
   ↓
5. Function prepara notificação:
   - Título: "Nova conversa iniciada! 🐾"
   - Corpo: "{Nome do A} demonstrou interesse em adotar {Nome do animal}"
   - Dados: chatId, animalId, etc.
   ↓
6. Function envia notificação via admin.messaging().send()
   ↓
7. FCM entrega notificação ao dispositivo do Usuário B
   ↓
8. Notificação aparece na barra de notificações
   ↓
9. Se usuário tocar:
   - App abre
   - Listener onNotificationTapped é acionado
   - Pode navegar para o chat específico
```

### Cenário 3: Nova Mensagem é Enviada

```
1. Usuário A envia mensagem no chat
   ↓
2. App cria documento em Firestore: chats/{chatId}/messages/{messageId}
   ↓
3. Cloud Function onNewMessage é disparada automaticamente
   ↓
4. Function identifica destinatário (Usuário B)
   ↓
5. Function busca token FCM do Usuário B
   ↓
6. Function prepara notificação:
   - Título: Nome do remetente (Usuário A)
   - Corpo: Texto da mensagem (máx. 50 caracteres)
   - Dados: chatId, type: 'new_message'
   ↓
7. Function envia notificação via FCM
   ↓
8. Notificação chega no dispositivo do Usuário B
```

---

## 📊 Estrutura de Dados

### Firestore: Documento do Usuário

```typescript
usuários/{userId} {
  // ... outros campos ...
  fcmToken: "ExponentPushToken[xxxxxxxxxxxxx]",
  fcmTokenUpdatedAt: "2024-01-15T10:30:00.000Z",
  notificationEnabled: true
}
```

### Firestore: Documento de Chat

```typescript
chats/{chatId} {
  participants: ["userId1", "userId2"],
  _chatContext: {
    animalId: "animal123",
    animalName: "Rex",
    interestedId: "userId1",
    donoId: "userId2"
  },
  // ... outros campos ...
}
```

### Firestore: Documento de Mensagem

```typescript
chats/{chatId}/messages/{messageId} {
  text: "Olá! Tenho interesse em adotar.",
  user: {
    _id: "userId1",
    name: "João"
  },
  createdAt: Timestamp,
  system: false
}
```

---

## ⚙️ Configurações Técnicas

### Android: Canal de Notificação

```typescript
await Notifications.setNotificationChannelAsync('chat-updates', {
  name: 'Atualizações de Chat',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#88c9bf',
  sound: 'default',
  description: 'Notificações de novos chats e mensagens'
});
```

**Características**:
- **Importância**: HIGH (notificação aparece e faz som)
- **Vibração**: Padrão personalizado
- **Cor**: #88c9bf (cor do tema do app)
- **Som**: Padrão do sistema

### Handler de Notificações (Foreground)

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Mostra alerta
    shouldPlaySound: true,    // Toca som
    shouldSetBadge: false,    // Não atualiza badge
    shouldShowBanner: true,   // Mostra banner
    shouldShowList: true      // Aparece na lista
  })
});
```

---

## 🔐 Segurança e Boas Práticas

### 1. Validação de Permissões
- App sempre verifica permissões antes de gerar token
- Tratamento de erro quando permissão é negada

### 2. Validação de Tokens
- Cloud Functions verificam se token existe antes de enviar
- Tratamento de erro quando token é inválido

### 3. Limpeza de Tokens
- Token é removido quando usuário faz logout
- Evita envio de notificações para dispositivos deslogados

### 4. Tratamento de Erros
- Logs detalhados em todas as etapas
- Funções não quebram o fluxo principal se falharem
- Mensagens de erro claras no console

---

## 📈 Métricas e Monitoramento

### Logs do Cliente (App)
- ✅ Permissão concedida/negada
- ✅ Token gerado com sucesso
- ✅ Token salvo no Firestore
- ⚠️ Erros de configuração FCM
- 📬 Notificações recebidas
- 👆 Notificações tocadas

### Logs do Servidor (Cloud Functions)
- ✅ Notificação enviada com sucesso
- ⚠️ Usuário sem token FCM
- ⚠️ Erros ao enviar notificação
- 📊 Informações do destinatário

---

## 🚀 Deploy e Build

### Pré-requisitos
1. ✅ Credenciais FCM configuradas no EAS Dashboard
2. ✅ Cloud Functions deployadas no Firebase
3. ✅ Permissões configuradas no `app.json`

### Processo de Build

```bash
# Gerar novo build com credenciais FCM
npx eas build --platform android --profile preview

# Verificar status
npx eas build:list

# Deploy das Cloud Functions
cd functions
npm run deploy
```

### Teste Pós-Build

1. Instalar APK no dispositivo
2. Fazer login
3. Verificar token no Firestore
4. Criar chat ou enviar mensagem
5. Verificar recebimento da notificação

---

## 📚 Referências

- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

## ✅ Checklist de Implementação

- [x] Dependência `expo-notifications` instalada
- [x] Plugin configurado no `app.json`
- [x] Serviço de notificações criado (`notificationService.ts`)
- [x] Integração no `App.tsx` (login)
- [x] Integração no `CadastroPessoal.tsx` (cadastro)
- [x] Cloud Functions criadas (`onNewChatCreated`, `onNewMessage`)
- [x] Credenciais FCM configuradas no EAS
- [x] Canal de notificação Android configurado
- [x] Listeners de notificações configurados
- [x] Tratamento de erros implementado
- [x] Logs de debug adicionados
- [x] Documentação criada

---

**Data de Implementação**: Janeiro 2024  
**Versão**: 1.0.0  
**Status**: ✅ Implementado e Funcional

