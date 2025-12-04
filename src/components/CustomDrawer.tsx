import React, { useState, useEffect, useCallback } from "react";
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity , Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { auth, db } from "../config/firebase";
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import { removeTokenFromFirestore } from '../services/fcmService';


const DrawerItem = ({ label, onPress, iconName, backgroundColor }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.drawerItem, { backgroundColor: backgroundColor || '#fff' }]}
  >
    <View style={styles.drawerItemContent}>
      {iconName && (
        <Icon name={iconName} size={24} color="#757575" style={styles.drawerIcon} />
      )}
      <Text style={styles.drawerLabel}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { navigation } = props;

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
      if (user) {
        try {
          console.log('🗑️ Removendo token FCM antes do logout...');
          await removeTokenFromFirestore(user.uid);
        } catch (tokenError) {
          console.error('⚠️ Erro ao remover token FCM no logout:', tokenError);
        }
      }

      await signOut(auth);
      
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
        <View style={styles.nameItem}>
          <Text style={styles.nameLabel}>{userName}</Text>
        </View>
        <DrawerItem 
          label="Meus Pets" 
          onPress={() => navigation.navigate('MeusPets')}
          iconName="pets"
          backgroundColor="#ffc1cc"
        />
        <DrawerItem 
          label="Chat" 
          onPress={() => navigation.navigate('Chat')}
          iconName="chat-bubble-outline"
          backgroundColor="#e6e7e8"
        />
        <DrawerItem 
          label="Cadastrar um pet" 
          onPress={() => navigation.navigate('Cadastrar Animal')}
          iconName="add-circle-outline"
          backgroundColor="#cfe9e5"
        />
        <DrawerItem 
          label="Adotar um pet" 
          onPress={() => navigation.navigate('Adotar')}
          iconName="pets"
          backgroundColor="#fee29b"
        />
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerIcon: {
    marginRight: 12,
  },
  drawerLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#434343',
  },
  nameItem: {
    backgroundColor: '#88c9bf',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
  },
  nameLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#434343',
    fontWeight: 'semibold',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingVertical: 16,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#88c9bf',
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  logoutButtonText: {
    color: '#434343',
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
  },
});