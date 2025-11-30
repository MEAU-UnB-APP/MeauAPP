import React from "react";
import { View, StyleSheet, Text, Linking, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
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
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={petName}
          description={enderecoCompleto || "Localização do animal"}
        />
      </MapView>
      <Text
        style={styles.openInMapsLink}
        onPress={() => {
          const url = Platform.select({
            ios: `maps://maps.apple.com/?q=${latitude},${longitude}`,
            android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
          });
          if (url) {
            Linking.openURL(url).catch(() => {
              Linking.openURL(googleMapsUrl);
            });
          }
        }}
      >
        Abrir no aplicativo de mapas →
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
  map: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
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

