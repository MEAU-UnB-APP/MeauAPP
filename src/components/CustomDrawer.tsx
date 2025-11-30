import React, { useState, useEffect, useCallback } from "react";
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity , Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SEButton from './SEButton';

import { auth, db } from "../config/firebase";
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import { removeTokenFromFirestore } from '../services/fcmService';


const DrawerItem = ({ label, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.drawerItem}
  >
    <Text style={styles.drawerLabel}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const [openSection, setOpenSection] = useState<string | null>('User'); 

  const [userName, setUserName] = useState('Carregando...');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "usuários", user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data?.username ?? "Usuário");
          const fotoPerfil = data?.fotoPerfil;
          if (typeof fotoPerfil === 'string' && fotoPerfil.trim().length > 0) {
            setUserPhotoUrl(fotoPerfil);
          } else {
            setUserPhotoUrl(null);
          }
        } else {
          console.log("Documento do usuário não encontrado no Firestore!");
          setUserName("Usuário");
          setUserPhotoUrl(null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setUserName("Usuário");
        setUserPhotoUrl(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); 

  const handleImageError = () => {
    setUserPhotoUrl(null);
  };

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      
      // Remover token FCM do Firestore ANTES de fazer logout
      // Isso garante que o usuário ainda está autenticado quando tentamos remover o token
      if (user) {
        try {
          console.log('🗑️ Removendo token FCM antes do logout...');
          await removeTokenFromFirestore(user.uid);
        } catch (tokenError) {
          console.error('⚠️ Erro ao remover token FCM no logout:', tokenError);
          // Não impede o logout se houver erro ao remover token
        }
      }

      // Fazer logout
      await signOut(auth);
      
      // Após o logout, reseta a navegação para a tela de Introdução
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Introducao' }],
        })
      );
    } catch (error) {
      console.error("Erro ao sair:", error);
      Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
    }
  };

  const toggleSection = (sectionName: string) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        padding: 0,
        margin: 0,
        alignItems: 'stretch',
      }}
      style={styles.drawerScroll}
    >
      <View style={styles.header}>
        {userPhotoUrl ? (
          <Image
            source={{ uri: userPhotoUrl }}
            style={styles.profileImage}
            onError={handleImageError}
          />
        ) : (
          <Image
            source={require('../assets/images/foto-do-perfil.png')}
            style={styles.profileImage}
          />
        )}
      </View>

      <View>
        <TouchableOpacity 
          style={[styles.sectionHeader, { backgroundColor: '#88c9bf' }]} 
          onPress={() => toggleSection('User')}
        >
          <Text style={styles.sectionLabel}>{userName}</Text>
          <Icon name={openSection === 'User' ? 'expand-less' : 'expand-more'} size={24} color="#757575" />
        </TouchableOpacity>
        {openSection === 'User' && (
          <View style={styles.subItemContainer}>
            <DrawerItem label="Meus Pets" onPress={() => navigation.navigate('MeusPets')} />
            <DrawerItem label="Favoritos" onPress={() => navigation.navigate('Favoritos')} />
            <DrawerItem label="Chat" onPress={() => navigation.navigate('Chat')} />
          </View>
        )}

        <TouchableOpacity 
          style={[styles.sectionHeader, { backgroundColor: '#fee29b' }]} 
          onPress={() => toggleSection('Atalhos')}
        >
          <View style={styles.sectionTitleContainer}>
            <Icon name="pets" size={24} color="#757575" />
            <Text style={styles.sectionLabel}>Atalhos</Text>
          </View>
          <Icon name={openSection === 'Atalhos' ? 'expand-less' : 'expand-more'} size={24} color="#757575" />
        </TouchableOpacity>
        {openSection === 'Atalhos' && (
          <View style={styles.subItemContainer}>
            <DrawerItem label="Cadastrar um pet" onPress={() => navigation.navigate('Cadastrar Animal')} />
            <DrawerItem label="Adotar um pet" onPress={() => navigation.navigate('Adotar')} />
          </View>
        )}
        
      </View>
      
      <View style={styles.footer}>
         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
           <Text style={styles.logoutButtonText}>SAIR</Text>
         </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerScroll: {
    backgroundColor: '#FFFFFF',
    padding: 0,
    margin: 0,
  },
  header: {
    backgroundColor: '#88c9bf',
    paddingTop: 40,
    paddingLeft: 16,
    paddingBottom: 20,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },

  drawerItem: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0', 
  },
  drawerLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#434343',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Roboto-Medium',
    color: '#434343',
    marginLeft: 16,
  },
 
  subItemContainer: {
    paddingLeft: 16, 
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#88c9bf',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#434343',
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
  },
});