// AppRoutes.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { AppDrawer } from "../navigation/index";
import { Introducao } from "../navigation/screens/Introducao";
import { Login } from "../navigation/screens/Login";
import { CadastroPessoal } from "../navigation/screens/CadastroPessoal";
import { CadastroAnimal } from "../navigation/screens/CadastroAnimal";

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; // pode exibir um SplashScreen

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Rotas privadas
       <Stack.Screen 
          name="AppDrawer"
          component={AppDrawer}
          />
      ) : (
        // Rotas públicas
        <>
          <Stack.Screen 
            name="Introducao" 
            component={Introducao} 
            />
          <Stack.Screen 
            name="Login" 
            component={Login} 
            />
          <Stack.Screen 
            name="CadastroPessoal" 
            component={CadastroPessoal} 
            />
            <Stack.Screen 
            name="CadastroAnimal" 
            component={CadastroAnimal} 
            />
        </>
      )}
    </Stack.Navigator>
  );
}

