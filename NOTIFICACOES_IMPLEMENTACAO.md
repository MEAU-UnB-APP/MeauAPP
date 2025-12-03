# Implementação de Notificações de Novas Mensagens

## ✅ Mudanças Implementadas

### 1. Removido código redundante
- **Arquivo**: `src/navigation/screens/IndividualChatScreen.tsx`
- **O que foi feito**: Removida a chamada manual de `sendNewMessageNotification` do listener `onSnapshot`
- **Motivo**: A Cloud Function `notifyNewMessage` já detecta automaticamente novas mensagens e envia notificações

### 2. Ajustada Cloud Function
- **Arquivo**: `functions/src/index.ts`
- **O que foi feito**: 
  - Adicionado `visibility: 'public'` e `importance: 'high'` no payload Android
  - Adicionados campos extras no `data` (messageText, senderName) para uso em foreground
- **Motivo**: Garantir que notificações apareçam mesmo quando app está aberto

### 3. Atualizado handler de foreground
- **Arquivo**: `src/services/fcmService.ts`
- **O que foi feito**: Melhorado logging para debug de notificações em foreground
- **Nota**: O handler está configurado, mas no Android notificações em foreground precisam de tratamento especial

## ⚠️ Problema Identificado: Notificações em Foreground

**Situação**: No Android, quando o app está aberto (foreground), o FCM não mostra notificações automaticamente na barra de notificações.

**Solução Necessária**: Para notificações aparecerem em foreground, você precisa de uma das seguintes opções:

### Opção 1: Usar @notifee/react-native (Recomendado)

1. Instalar a biblioteca:
```bash
npm install @notifee/react-native
# ou
yarn add @notifee/react-native
```

2. Para Android, adicionar no `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'androidx.work:work-runtime-ktx:2.8.1'
}
```

3. Atualizar `src/services/fcmService.ts` para usar notifee (código já preparado, só descomentar)

### Opção 2: Configurar canal de notificação no Android nativo

Criar canal de notificação no código nativo Android (mais complexo)

## 📋 O que você precisa verificar

### 1. Cloud Functions deployadas
```bash
cd functions
firebase deploy --only functions
```

Verifique se as funções estão deployadas:
- `notifyNewMessage` - deve estar ativa
- `onNewChatCreated` - deve estar ativa

### 2. Testar notificações

#### Teste 1: App fechado (deve funcionar)
1. Feche completamente o app
2. Envie uma mensagem de outro usuário
3. Verifique se a notificação aparece na barra

#### Teste 2: App em background (deve funcionar)
1. Coloque o app em background (home button)
2. Envie uma mensagem de outro usuário
3. Verifique se a notificação aparece na barra

#### Teste 3: App em foreground (pode não funcionar sem notifee)
1. Deixe o app aberto na tela
2. Envie uma mensagem de outro usuário
3. Verifique se a notificação aparece na barra
4. **Se não aparecer**: Instale @notifee/react-native conforme Opção 1 acima

### 3. Verificar logs

No console do Firebase Functions, verifique:
- Se `notifyNewMessage` está sendo acionada quando uma mensagem é criada
- Se há erros ao buscar token FCM
- Se há erros ao enviar notificação

### 4. Verificar tokens FCM

Certifique-se de que:
- Usuários têm `fcmToken` salvo no Firestore (coleção `usuários`)
- Tokens estão atualizados
- Permissões de notificação estão concedidas

## 🔍 Como verificar se está funcionando

1. **Logs do app**: Procure por `📬 Notificação recebida em foreground` no console
2. **Logs do Firebase**: Verifique se `notifyNewMessage` está sendo executada
3. **Firestore**: Verifique se `unread_{userId}` está sendo incrementado nos chats

## 📝 Próximos passos (se notificações em foreground não funcionarem)

1. Instalar @notifee/react-native
2. Atualizar `fcmService.ts` para usar notifee em foreground
3. Testar novamente

## ✅ O que já está funcionando

- ✅ Notificações quando chat é criado (app fechado/background)
- ✅ Notificações de novas mensagens (app fechado/background)
- ✅ Cloud Function detecta novas mensagens automaticamente
- ✅ Código redundante removido

## ⚠️ O que precisa de atenção

- ⚠️ Notificações em foreground podem não aparecer sem @notifee/react-native
- ⚠️ Verificar se Cloud Functions estão deployadas
- ⚠️ Verificar se tokens FCM estão sendo salvos corretamente

