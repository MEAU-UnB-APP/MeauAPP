# 🔍 Guia de Debug - Notificações Push

## Problema Identificado

Após gerar o APK e fazer login/cadastro, a permissão de notificação não aparece e o token FCM não é registrado.

## ✅ Melhorias Implementadas

### 1. **Logs Detalhados Adicionados**

Agora o código tem logs em todas as etapas do processo:

- 🔔 Início do registro
- 📱 Plataforma detectada
- 🔐 Verificação de permissões
- 📢 Solicitação de permissão
- 🎫 Geração do token
- 💾 Salvamento no Firestore
- ✅/❌ Sucesso ou erro em cada etapa

### 2. **Tratamento de Erros Melhorado**

- Logs detalhados de erros (tipo, mensagem, stack)
- Tentativa de criar documento mesmo se não existir
- Delay adicionado para garantir que documento existe

### 3. **Delays Estratégicos**

- **Login**: 1 segundo de delay após autenticação
- **Cadastro**: 2 segundos de delay após cadastro (para garantir que documento foi criado)

## 🔍 Como Debugar

### Passo 1: Verificar Logs no Console

Conecte o dispositivo via USB e execute:

```bash
# Android
adb logcat | grep -E "🔔|📱|🔐|📢|🎫|💾|✅|❌|⚠️"

# Ou use o React Native Debugger
npx react-native log-android
```

### Passo 2: Verificar se a Função Está Sendo Chamada

Procure por estes logs no console:

```
🔔 Iniciando registro de notificações push...
📱 Plataforma: android
🔐 Verificando permissões de notificação...
```

**Se NÃO aparecer**: A função não está sendo chamada. Verifique:
- Se o usuário está autenticado
- Se o `onAuthStateChanged` está funcionando
- Se há erros no `App.tsx`

### Passo 3: Verificar Permissões

Procure por:

```
📋 Status atual da permissão: [undetermined|granted|denied]
📢 Solicitando permissão de notificação ao usuário...
📋 Novo status da permissão: [granted|denied]
```

**Se status for `undetermined` e não aparecer diálogo**:
- Pode ser problema com o build
- Verifique se as credenciais FCM estão configuradas
- Verifique se o plugin `expo-notifications` está no `app.json`

**Se status for `denied`**:
- Usuário negou permissão
- Precisa habilitar manualmente nas configurações do dispositivo

### Passo 4: Verificar Geração do Token

Procure por:

```
🎫 Gerando token FCM...
✅ Token FCM gerado com sucesso
```

**Se aparecer erro aqui**:
- Credenciais FCM podem não estar configuradas corretamente
- Verifique no EAS Dashboard se as credenciais estão configuradas
- Pode ser necessário gerar um novo build

### Passo 5: Verificar Salvamento no Firestore

Procure por:

```
💾 Preparando para salvar token no Firestore...
👤 Usuário autenticado encontrado: [userId]
💾 Tentando salvar token FCM no Firestore...
📄 Documento existe? true/false
✅ Token FCM salvo no Firestore com sucesso!
```

**Se documento não existir**:
- O código agora tenta criar mesmo assim
- Verifique se há erros de permissão no Firestore
- Verifique se o usuário foi criado corretamente

## 🐛 Problemas Comuns e Soluções

### Problema 1: Função não é chamada

**Sintomas**: Nenhum log aparece no console

**Soluções**:
1. Verifique se o usuário está autenticado:
   ```typescript
   console.log('Usuário:', auth.currentUser);
   ```

2. Verifique se o `onAuthStateChanged` está funcionando:
   - Deve aparecer: `🔐 Estado de autenticação mudou. Usuário: [userId]`

3. Verifique se há erros no `App.tsx` que impedem a execução

### Problema 2: Permissão não aparece

**Sintomas**: Logs aparecem mas diálogo não aparece

**Soluções**:
1. Verifique se o plugin está configurado no `app.json`:
   ```json
   "plugins": [
     ["expo-notifications", { ... }]
   ]
   ```

2. Verifique se gerou um novo build após adicionar o plugin:
   ```bash
   npx eas build --platform android --profile preview
   ```

3. Verifique se as credenciais FCM estão configuradas no EAS

4. Tente desinstalar e reinstalar o app

### Problema 3: Token não é gerado

**Sintomas**: Permissão concedida mas token não é gerado

**Soluções**:
1. Verifique se as credenciais FCM estão configuradas no EAS Dashboard
2. Verifique o `projectId` no código (deve ser o mesmo do `app.json`)
3. Gere um novo build após configurar credenciais

### Problema 4: Token não é salvo no Firestore

**Sintomas**: Token gerado mas não aparece no Firestore

**Soluções**:
1. Verifique se o documento do usuário existe no Firestore
2. Verifique regras de segurança do Firestore (deve permitir escrita)
3. Verifique se há erros de permissão nos logs
4. O código agora tenta criar o documento mesmo se não existir

## 📋 Checklist de Verificação

- [ ] Plugin `expo-notifications` está no `app.json`
- [ ] Credenciais FCM configuradas no EAS Dashboard
- [ ] Novo build gerado após configurar credenciais
- [ ] App instalado no dispositivo físico (não emulador)
- [ ] Logs aparecem no console
- [ ] Permissão é solicitada
- [ ] Token é gerado
- [ ] Token é salvo no Firestore

## 🔧 Comandos Úteis

```bash
# Ver logs do Android
adb logcat | grep -E "ReactNative|Expo|Notification"

# Ver logs específicos do app
adb logcat | grep -E "🔔|📱|🔐|📢|🎫|💾|✅|❌"

# Limpar cache e reinstalar
adb uninstall com.meauapp
adb install app.apk

# Verificar credenciais no EAS
npx eas credentials -p android
```

## 📞 Próximos Passos

1. **Gere um novo build** com as melhorias implementadas
2. **Instale no dispositivo** e faça login/cadastro
3. **Verifique os logs** no console usando os comandos acima
4. **Compartilhe os logs** para análise mais detalhada

Os logs agora são muito mais detalhados e vão mostrar exatamente onde o processo está falhando!

