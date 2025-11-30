O **Meau** é um aplicativo móvel desenvolvido para conectar pessoas que desejam adotar animais de estimação com abrigos e tutores que têm gatos e cachorros disponíveis para adoção. Nosso objetivo é facilitar o processo de adoção responsável, proporcionando uma experiência intuitiva e segura para encontrar seu novo companheiro.

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório do projeto:

```sh
git clone https://github.com/Niloinpng/MeauAPP.git
cd MeauAPP
```

2. Instale as dependências:

```sh
npm install
# ou
yarn install
```

### Executando o App

- Inicie o servidor de desenvolvimento:

```sh
npm start
# ou
npx expo start
```

- Para plataformas específicas:

```sh
npm run android # Para Android
```

- No terminal do servidor de desenvolvimento, você pode pressionar:
  - `a` para abrir o emulador/dispositivo Android
  - `w` para abrir no navegador web

### Gerando APK para Android

Para gerar um APK para testar no dispositivo Android:

#### Usando EAS Build 

1. Instale o EAS CLI globalmente (se ainda não tiver):
```sh
npm install -g eas-cli
```

2. Faça login no EAS:
```sh
eas login
```

3. Configure o projeto (se ainda não tiver):
```sh
eas build:configure
```

4. Gere o APK para Android:
```sh
eas build --platform android --profile preview
```

O APK será gerado na nuvem e você receberá um link para download.

## Estrutura do Projeto

```
src/
├── assets/         # Imagens e Fontes utilizadas 
├── components/     # Componentes reutilizáveis
├── navigation/     # Configuração de navegação
   └── screens/     # Telas do aplicativo
```

## Recursos

- [Documentação do React Navigation](https://reactnavigation.org/)
- [Documentação do Expo](https://docs.expo.dev/)
- [Documentação do React Native](https://reactnative.dev/)
