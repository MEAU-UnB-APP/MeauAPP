import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, FlatList } from "react-native";
import { Text, Button, ActivityIndicator, Card } from "react-native-paper";
import { useNavigation, NavigationProp } from "@react-navigation/native";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../config/firebase";
import { PhotoCarousel } from "../../components/PhotoCarousel";
import { Separator } from "../../components/Separator";
import { LocationMap } from "../../components/LocationMap";
import { Animal } from "../../types/index";

type RootStackParamList = {
  IndividualChat: {
    chatRoomID: string;
    chatTitle: string;
  };
};

export const InformacoesPets: React.FC<{ route: any }> = ({ route }) => {
  const [pet, setPet] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [showInterested, setShowInterested] = useState(false);
  const { petId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Erro", "Usuário não autenticado");
          setLoading(false);
          return;
        }

        const animaisCollectionRef = collection(db, "animais");
        const q = query(
          animaisCollectionRef,
          where("dono", "==", user.uid),
          where("__name__", "==", petId)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Erro", "Animal não encontrado");
          setLoading(false);
          return;
        }

        const petData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        } as Animal;

        setPet(petData);
      } catch (error) {
        console.error("Erro ao buscar detalhes do animal: ", error);
        Alert.alert("Erro", "Não foi possível carregar os dados do animal");
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      fetchPetDetails();
    }
  }, [petId]);

  const fetchChatsForPet = async () => {
    if (!pet) return;

    setChatsLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const chatsRef = collection(db, "chats");

      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageTimestamp", "desc")
      );

      const querySnapshot = await getDocs(q);

      const chatsList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (chat: any) =>
            chat._chatContext?.animalId === pet.id &&
            chat._chatContext?.donoId === user.uid
        );

      setChats(chatsList);
      setShowInterested(true);
    } catch (error) {
      console.error("Erro ao buscar chats: ", error);
      Alert.alert("Erro", "Não foi possível carregar os interessados");
    } finally {
      setChatsLoading(false);
    }
  };

  useEffect(() => {
    if (!pet || !showInterested) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("_chatContext.animalId", "==", pet.id),
      where("_chatContext.donoId", "==", user.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const chatsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatsList);
      },
      (error) => {
        console.error("Erro em tempo real dos chats: ", error);
      }
    );

    return () => unsubscribe();
  }, [pet, showInterested]);

  const handleRemovePet = async () => {
    if (!pet) return;

    Alert.alert(
      "Remover Animal",
      `Tem certeza que deseja remover ${pet.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "animais", pet.id));
              Alert.alert("Sucesso", "Animal removido com sucesso");
            } catch (error) {
              console.error("Erro ao remover animal: ", error);
              Alert.alert("Erro", "Não foi possível remover o animal");
            }
          },
        },
      ]
    );
  };

  const handleViewInterested = () => {
    fetchChatsForPet();
  };

  const handleBackToPetInfo = () => {
    setShowInterested(false);
    setChats([]);
  };

const handleChatPress = (chat: any) => {
  const otherUserName = chat._chatContext?.interestedName || "Interessado";
  
  navigation.navigate('IndividualChat', {
    chatRoomID: chat.id,
    chatTitle: `Chat com ${otherUserName}`
  });
};

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return (
        date.toLocaleDateString("pt-BR") +
        " " +
        date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      return "";
    }
  };

  const renderChatItem = ({ item }: { item: any }) => (
    <Card style={styles.chatCard} onPress={() => handleChatPress(item)}>
      <Card.Content>
        <Text style={styles.chatTitle}>Interessado em {pet?.nome}</Text>
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage || "Chat iniciado"}
        </Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(item.lastMessageTimestamp)}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffd358" />
        <Text style={styles.infoText}>Carregando informações...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Animal não encontrado.</Text>
      </View>
    );
  }

  if (showInterested) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Button mode="text" onPress={handleBackToPetInfo} textColor="#434343">
            ← Voltar para {pet.nome}
          </Button>
          <Text style={styles.interestedTitle}>Interessados em {pet.nome}</Text>
        </View>

        {chatsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ffd358" />
            <Text style={styles.infoText}>Buscando interessados...</Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.infoText}>
              Nenhum interessado encontrado para {pet.nome}
            </Text>
            <Text style={styles.subInfoText}>
              Quando alguém se interessar pelo seu pet, aparecerá aqui.
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.chatsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  const getSexDisplay = (sexo: string) => {
    return sexo === "Macho" ? "Macho" : "Fêmea";
  };

  const getHealthStatus = (saude: string[]) => {
    const vaccinated = saude?.includes("Vacinado") || false;
    const dewormed = saude?.includes("Vermifugado") || false;
    const castrated = saude?.includes("Castrado") || false;
    return { vaccinated, dewormed, castrated };
  };

  const getTemperamentDisplay = (temperamento: string[]) => {
    return temperamento?.join(", ") || "Não informado";
  };

  const { vaccinated, dewormed, castrated } = getHealthStatus(pet.saude || []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PhotoCarousel photos={pet.fotos || [pet.fotoPrincipal]} />

        <View style={styles.infoRow}>
          <Text style={styles.petName}>{pet.nome}</Text>
        </View>

        <View style={styles.infoRow}>
          <Info label="SEXO" value={getSexDisplay(pet.sexo)} />
          <Info label="PORTE" value={pet.porte} />
          <Info label="IDADE" value={pet.idade} />
        </View>

        <View style={styles.infoRow}>
          <Info label="LOCALIZAÇÃO" value={pet.localizacao} />
        </View>

        <View style={styles.infoRow}>
          <Info label="CASTRADO" value={castrated ? "Sim" : "Não"} />
          <Info label="VERMIFUGADO" value={dewormed ? "Sim" : "Não"} />
        </View>

        <View style={styles.infoRow}>
          <Info label="VACINADO" value={vaccinated ? "Sim" : "Não"} />
          <Info label="DOENÇAS" value={pet.doencas || "Nenhuma"} />
        </View>

        <View style={styles.infoRow}>
          <Info
            label="TEMPERAMENTO"
            value={getTemperamentDisplay(pet.temperamento)}
          />
        </View>

        <View style={styles.infoRow}>
          <Info label="ESPÉCIE" value={pet.especie} />
          <Info label="TIPO" value={pet.tipoCadastro} />
        </View>

        {pet.exigencias && pet.exigencias.length > 0 && (
          <Section
            title="EXIGÊNCIAS DO DOADOR"
            text={pet.exigencias.join(", ")}
          />
        )}

        {pet.sobre && (
          <Section
            title={`MAIS SOBRE ${pet.nome.toUpperCase()}`}
            text={pet.sobre}
          />
        )}

        <View style={styles.section}>
          <Separator />
          <Text style={styles.infoLabel}>LOCALIZAÇÃO</Text>
          <LocationMap locationData={pet.locationData} petName={pet.nome} />
        </View>

        <View style={styles.actionsRow}>
          <Button
            mode="outlined"
            textColor="#434343"
            style={styles.actionBtn}
            onPress={handleViewInterested}
          >
            Ver interessados
          </Button>
          <Button
            mode="outlined"
            textColor="#FF6B6B"
            style={[styles.actionBtn, styles.removeButton]}
            onPress={handleRemovePet}
          >
            Remover pet
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <View style={{ marginBottom: 12, flex: 1 }}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const Section = ({ title, text }: { title: string; text: string }) => (
  <View style={styles.section}>
    <Separator />
    <Text style={styles.infoLabel}>{title}</Text>
    <Text style={styles.infoValue}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingBottom: 80 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 16,
  },
  petName: {
    fontSize: 20,
    fontFamily: "Roboto-Medium",
    color: "#434343",
    textAlign: "center",
    width: "100%",
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Roboto-Regular",
    color: "#589b9b",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#757575",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 28,
    gap: 12,
  },
  actionBtn: {
    borderColor: "#88c9bf",
    borderWidth: 1,
    borderRadius: 4,
    flex: 1,
  },
  removeButton: {
    borderColor: "#FF6B6B",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  infoText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
    fontFamily: "Roboto-Regular",
  },
  subInfoText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    fontFamily: "Roboto-Regular",
    textAlign: "center",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  interestedTitle: {
    fontSize: 18,
    fontFamily: "Roboto-Medium",
    color: "#434343",
    textAlign: "center",
    marginTop: 8,
  },
  chatsList: {
    padding: 16,
  },
  chatCard: {
    marginBottom: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chatTitle: {
    fontSize: 16,
    fontFamily: "Roboto-Medium",
    color: "#434343",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#757575",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "Roboto-Regular",
    color: "#999",
  },
});
