import {
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";
import {
  createStaticNavigation,
  StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { IconButton } from "react-native-paper";
import CustomDrawer from "../components/CustomDrawer";
// Telas
import { Introducao } from "./screens/Introducao";
import { Adotar } from "./screens/Adotar";
import { CadastroAnimal } from "./screens/CadastroAnimal";
import { Login } from "./screens/Login";
import { CadastroPessoal } from "./screens/CadastroPessoal";
import { FinalizarProcesso } from "./screens/FinalizarProcesso";
import { NotFound } from "./screens/NotFound";
import { MeuPerfil } from "./screens/MeuPerfil";
import { MeusPets } from "./screens/MeusPets";
import { Favoritos } from "./screens/Favoritos";
import { Eventos } from "./screens/Eventos";
import { Historias } from "./screens/Historias";
import { Legislacao } from "./screens/Legislacao";
import { Privacidade } from "./screens/Privacidade";
import { Termo } from "./screens/Termo";
import { Chat } from "./screens/Chat";
import { Dicas } from "./screens/Dicas";
import { InformacoesPets } from "./screens/InformacoesPets";
import { IndividualChatScreen } from "./screens/IndividualChatScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function HomeStack() {
  const navigation = useNavigation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdotarHome"
        component={Adotar}
        options={{
          title: "Adotar",
          headerStyle: { backgroundColor: "#ffd358" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
          headerTintColor: "#434343",
          headerLeft: () => (
            <IconButton
              icon="menu"
              iconColor="#434343"
              size={25}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            />
          ),
        }}
      />
      <Stack.Screen
        name="CadastroAnimal"
        component={CadastroAnimal}
        options={{
          title: "Cadastrar Animal",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
          headerTintColor: "#434343",
        }}
      />
      <Stack.Screen
        name="CadastroPessoal"
        component={CadastroPessoal}
        options={{
          title: "Cadastro Pessoal",
          headerStyle: { backgroundColor: "#ffd358" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
          headerTintColor: "#434343",
          headerLeft: () => (
            <IconButton
              icon="menu"
              iconColor="#434343"
              size={25}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            />
          ),
        }}
      />
      <Stack.Screen
        name="IndividualChat"
        component={IndividualChatScreen}
        options={({ route }) => ({
          title: route.params?.chatTitle || "Chat",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
          headerTintColor: "#434343",
        })}
      />
    </Stack.Navigator>
  );
}

export function AppDrawer() {
  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawer {...props} />}>
      <Drawer.Screen
        name="MeuPerfil"
        component={MeuPerfil}
        options={{
          title: "Meu Perfil",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="MeusPets"
        component={MeusPets}
        options={{
          title: "Meus Pets",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Favoritos"
        component={Favoritos}
        options={{
          title: "Favoritos",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "##434343",
          },
        }}
      />
      <Drawer.Screen
        name="Chat"
        component={Chat}
        options={{
          title: "Chat",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Adotar"
        component={HomeStack}
        options={{ title: "Adotar", headerShown: false }}
      />
      <Drawer.Screen
        name="Dicas"
        component={Dicas}
        options={{
          title: "Dicas",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Eventos"
        component={Eventos}
        options={{
          title: "Eventos",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Legislacao"
        component={Legislacao}
        options={{
          title: "Legislação",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Termo"
        component={Termo}
        options={{
          title: "Termo de Adoção",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Historias"
        component={Historias}
        options={{
          title: "Histórias de Adoção",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Privacidade"
        component={Privacidade}
        options={{
          title: "Política de Privacidade",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="Cadastrar Animal"
        component={CadastroAnimal}
        options={{
          title: "Cadastrar Animal",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
      <Drawer.Screen
        name="InformacoesPets"
        component={InformacoesPets}
        options={{
          title: "Informações do Pet",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
    </Drawer.Navigator>
  );
}

const RootStack = createNativeStackNavigator({
  screens: {
    Introducao: {
      screen: Introducao,
      options: {
        headerShown: false,
      },
      linking: {
        path: "",
      },
    },
    App: {
      screen: AppDrawer,
      options: {
        headerShown: false,
      },
      linking: {
        path: "app",
        screens: {
          Adotar: {
            screens: {
              AdotarHome: "adotar",
              CadastroAnimal: "cadastro-animal",
            },
          },
          MeuPerfil: "meu-perfil",
          MeusPets: "meus-pets",
          Favoritos: "favoritos",
          Chat: "chat",
          Dicas: "dicas",
          Eventos: "eventos",
          Legislacao: "legislacao",
          Termo: "termo",
          Historias: "historias",
          Privacidade: "privacidade",
          InformacoesPets: "informacoes-pets",
        },
      },
    },
    Login: {
      screen: Login,
      options: {
        title: "Fazer Login",
        headerStyle: { backgroundColor: "#88c9bf" },
        headerTitleStyle: {
          fontFamily: "Roboto-Medium",
          fontSize: 20,
          color: "#434343",
        },
        headerTintColor: "#434343",
      },
      linking: {
        path: "app/login",
      },
    },
    CadastroPessoal: {
      screen: CadastroPessoal,
      options: {
        title: "Cadastro Pessoal",
        headerStyle: { backgroundColor: "#88c9bf" },
        headerTitleStyle: {
          fontFamily: "Roboto-Medium",
          fontSize: 20,
          color: "#434343",
        },
        headerTintColor: "#434343",
      },
      linking: {
        path: "app/cadastro-pessoal",
      },
    },
    FinalizarProcesso: {
      screen: FinalizarProcesso,
      linking: {
        path: "app/finalizar-processo",
      },
    },
    IndividualChat: {
      screen: IndividualChatScreen,
      options: {
        headerStyle: { backgroundColor: "#88c9bf" },
        headerTitleStyle: {
          fontFamily: "Roboto-Medium",
          fontSize: 20,
          color: "#434343",
        },
        headerTintColor: "#434343", // Controla a cor da seta "voltar"
      },
      linking: {
        path: "app/chat/:chatRoomID",
      },
    },
    NotFound: {
      screen: NotFound,
      options: {
        title: "404",
      },
      linking: {
        path: "*",
      },
    },
  },
});

const linking = {
  prefixes: ["http://localhost:8081", "myapp://"],
  config: {
    screens: {
      Introducao: "",
      Login: "app/login",
      CadastroPessoal: "app/cadastro-pessoal",
      App: {
        path: "app",
        screens: {
          Adotar: {
            screens: {
              AdotarHome: "adotar",
              CadastroAnimal: "cadastro-animal",
            },
          },
          MeuPerfil: "meu-perfil",
          MeusPets: "meus-pets",
          InformacoesPets: "informacoes-pets",
          Favoritos: "favoritos",
          Chat: "chat",
          Dicas: "dicas",
          Eventos: "eventos",
          Legislacao: "legislacao",
          Termo: "termo",
          Historias: "historias",
          Privacidade: "privacidade",
        },
      },
      FinalizarProcesso: "app/finalizar-processo",
      NotFound: "*",
    },
  },
};

export const Navigation = createStaticNavigation(RootStack, {
  linking,
});

type HomeStackParamList = {
  AdotarHome: undefined;
  CadastroAnimal: undefined;
  CadastroPessoal: undefined;
  IndividualChat: {
    chatRoomID: string;
    chatTitle?: string;
  };
};

type DrawerParamList = {
  MeuPerfil: undefined;
  MeusPets: undefined;
  InformacoesPets: { petId: string };
  Favoritos: undefined;
  Chat: undefined;
  Adotar: NavigatorScreenParams<HomeStackParamList>;
  Dicas: undefined;
  Eventos: undefined;
  Legislacao: undefined;
  Termo: undefined;
  Historias: undefined;
  Privacidade: undefined;
};

type RootStackParamList = StaticParamList<typeof RootStack> & {
  App: NavigatorScreenParams<DrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      App: DrawerParamList;
      Introducao: undefined;
      CadastroPessoal: undefined;
      CadastroAnimal: undefined;
      Login: undefined;
      FinalizarProcesso: undefined;
      IndividualChat: {
        chatRoomID: string;
        chatTitle: string;
      };
      NotFound: undefined;
    }
  }
}
