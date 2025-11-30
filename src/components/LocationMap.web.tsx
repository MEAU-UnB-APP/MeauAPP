import React from "react";
import { View, StyleSheet, Text, Linking } from "react-native";
import { LocationData } from "../types/index";

export interface LocationMapProps {
  locationData?: LocationData;
  petName: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  locationData,
  petName,
}) => {
  // Se não houver dados de localização ou coordenadas inválidas
  if (
    !locationData ||
    !locationData.latitude ||
    !locationData.longitude ||
    (locationData.latitude === 0 && locationData.longitude === 0)
  ) {
    return (
      <View style={styles.noLocationContainer}>
        <Text style={styles.noLocationText}>
          Informação não disponível
        </Text>
        <Text style={styles.noLocationSubtext}>
          A localização do animal não foi registrada.
        </Text>
      </View>
    );
  }

  const { latitude, longitude, enderecoCompleto } = locationData;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <View style={styles.mapContainer}>
      {enderecoCompleto && (
        <Text style={styles.addressText}>{enderecoCompleto}</Text>
      )}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>📍</Text>
        <Text style={styles.coordinatesText}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      </View>
      <Text
        style={styles.openInMapsLink}
        onPress={() => {
          Linking.openURL(googleMapsUrl);
        }}
      >
        Abrir no Google Maps →
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    marginTop: 12,
  },
  addressText: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#757575",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  mapPlaceholder: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#757575",
  },
  openInMapsLink: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#88C9BF",
    marginTop: 8,
    textDecorationLine: "underline",
    paddingHorizontal: 4,
  },
  noLocationContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 12,
    minHeight: 150,
  },
  noLocationText: {
    fontSize: 16,
    fontFamily: "Roboto-Medium",
    color: "#757575",
    marginBottom: 8,
  },
  noLocationSubtext: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#999",
    textAlign: "center",
  },
});

