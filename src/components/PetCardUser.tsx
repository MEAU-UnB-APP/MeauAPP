import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Card, Text, IconButton } from "react-native-paper";
import { Animal } from "../types/index";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";

const CARD = {
  width: 344,
  height: 264,
  headerH: 32,
  imageH: 183,
} as const;
const FOOTER_H = CARD.height - CARD.headerH - CARD.imageH;

interface PetCardProps {
  pet: Animal;
}

export const PetCardUser: React.FC<PetCardProps> = ({ pet }) => {
  const [disponivel, setDisponivel] = React.useState(pet.disponivel);
  const navigation = useNavigation();

  const placeholderImage =
    "https://placehold.co/344x183/e0e0e0/757575?text=Sem+Foto";

  const toggleDisponivel = async () => {
    try {
      const novoEstado = !disponivel;
      setDisponivel(novoEstado);
      const petRef = doc(db, "animais", pet.id);
      await updateDoc(petRef, { disponivel: novoEstado });
    } catch (error) {
      console.error("Não foi possível atualizar:", error);
    }
  };

  const handleCardPress = () => {
    navigation.navigate("InformacoesPets", { petId: pet.id });
  };

  return (
    <TouchableOpacity onPress={handleCardPress}>
      <Card style={styles.card} mode="elevated">
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{pet.nome}</Text>
          <IconButton
            icon={disponivel ? "eye" : "eye-off"}
            size={24}
            iconColor={disponivel ? "#434343" : "#434343"}
            onPress={toggleDisponivel}
          />
        </View>

        <Image
          source={{ uri: pet.fotoPrincipal || placeholderImage }}
          style={styles.image}
        />

        <View style={styles.footer}>
          <View style={styles.tagsRow}>
            <Text style={styles.tag}>{pet.sexo}</Text>
            <Text style={styles.tag}>{pet.idade}</Text>
            <Text style={styles.tag}>{pet.porte}</Text>
          </View>
          <Text style={styles.location}>{pet.localizacao}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD.width,
    height: CARD.height,
    alignSelf: "center",
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardHeader: {
    height: CARD.headerH,
    backgroundColor: "#fee29b",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    color: "#434343",
    fontFamily: "Roboto-Medium",
  },
  image: {
    width: CARD.width,
    height: CARD.imageH,
    backgroundColor: "#f0f0f0",
  },
  footer: {
    height: FOOTER_H,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  tagsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 4,
  },
  tag: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Roboto-Regular",
    textTransform: "capitalize",
  },
  location: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Roboto-Regular",
    textAlign: "center",
    textTransform: "capitalize",
    paddingHorizontal: 8,
  },
});
