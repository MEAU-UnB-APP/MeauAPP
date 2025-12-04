import { NavigatorScreenParams, DrawerActions, useNavigation } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { IconButton } from "react-native-paper";
import CustomDrawer from "../components/CustomDrawer";
import { Colors } from "../config/colors";

// Telas
import { Adotar } from "./screens/Adotar";
import { CadastroAnimal } from "./screens/CadastroAnimal";
import { MeusPets } from "./screens/MeusPets";
import { Chat } from "./screens/Chat";
import { IndividualChatScreen } from "./screens/IndividualChatScreen";

const Drawer = createDrawerNavigator();


export function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        drawerStyle: {
          backgroundColor: Colors.roxoclaro,
          margin: 0,
          padding: 0,
        },
        drawerContentStyle: {
          backgroundColor: Colors.branco,
          margin: 0,
          padding: 0,
        },
        overlayColor: "transparent",
        headerStyle: { backgroundColor: Colors.roxo },
        headerTitleStyle: {
          fontFamily: "Roboto-Medium",
          fontSize: 20,
          color: Colors.branco,
        },
        headerTintColor: Colors.branco,
        headerLeft: () => (
          <IconButton
            icon="menu"
            iconColor={Colors.branco}
            size={25}
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          />
        ),
      })}
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      <Drawer.Screen
        name="Adotar"
        component={Adotar}
        options={{
          title: "Adotar",
          headerStyle: { backgroundColor: Colors.roxoclaro },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: Colors.branco,
          },
          headerTintColor: Colors.branco,
        }}
      />
      <Drawer.Screen
        name="MeusPets"
        component={MeusPets}
        options={{
          title: "Meus Pets",
          headerStyle: { backgroundColor: Colors.rosaescuro },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: Colors.branco,
          },
          headerTintColor: Colors.branco,
        }}
      />
      <Drawer.Screen
        name="Chat"
        component={Chat}
        options={{
          title: "Chat",
          headerStyle: { backgroundColor: Colors.rosa },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: Colors.branco,
          },
          headerTintColor: Colors.branco,
        }}
      />
      <Drawer.Screen
        name="Cadastrar Animal"
        component={CadastroAnimal}
        options={{
          title: "Cadastrar Animal",
          headerStyle: { backgroundColor: Colors.verde },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: Colors.preto,
          },
          headerTintColor: Colors.preto,
        }}
      />
      <Drawer.Screen
        name="IndividualChat"
        component={IndividualChatScreen}
        options={({ route }: any) => ({
          title: route.params?.chatTitle || "Chat",
          headerStyle: { backgroundColor: Colors.rosa },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: Colors.branco,
          },
          headerTintColor: Colors.branco,
          drawerItemStyle: { display: "none" },
        })}
      />
    </Drawer.Navigator>
  );
}

type HomeStackParamList = {
  AdotarHome: undefined;
  CadastroAnimal: undefined;
  CadastroPessoal: undefined;
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
  IndividualChat: {
    chatRoomID: string;
    chatTitle?: string;
  };
};

type RootStackParamList = {
  App: NavigatorScreenParams<DrawerParamList>;
};
