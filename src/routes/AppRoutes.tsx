// AppRoutes.tsx
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { AppDrawer } from "../navigation/index";
import { Introducao } from "../navigation/screens/Introducao";
import { CadastroPessoal } from "../navigation/screens/CadastroPessoal";
import { Colors } from "../config/colors";

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.roxo} />
      </View>
    );
  }

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
            name="CadastroPessoal" 
            component={CadastroPessoal} 
            />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.roxo,
  },
});

