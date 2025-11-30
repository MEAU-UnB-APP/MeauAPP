import { NavigatorScreenParams, DrawerActions, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { IconButton } from "react-native-paper";
import CustomDrawer from "../components/CustomDrawer";
// Telas
import { Adotar } from "./screens/Adotar";
import { CadastroAnimal } from "./screens/CadastroAnimal";
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

const Drawer = createDrawerNavigator();


export function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        drawerStyle: {
          backgroundColor: "#FFFFFF",
          margin: 0,
          padding: 0,
          borderRightWidth: 2,
          borderRightColor: "#757575",
        },
        drawerContentStyle: {
          backgroundColor: "#FFFFFF",
          margin: 0,
          padding: 0,
        },
        overlayColor: "transparent",
        headerStyle: { backgroundColor: "#88c9bf" },
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
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
        }}
      />
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
      <Drawer.Screen
        name="IndividualChat"
        component={IndividualChatScreen}
        options={({ route }: any) => ({
          title: route.params?.chatTitle || "Chat",
          headerStyle: { backgroundColor: "#88c9bf" },
          headerTitleStyle: {
            fontFamily: "Roboto-Medium",
            fontSize: 20,
            color: "#434343",
          },
          headerTintColor: "#434343",
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
