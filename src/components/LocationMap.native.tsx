import React from "react";
import { View, StyleSheet, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LocationData } from "../types/index";
import { Colors } from "../config/colors";

export interface LocationMapProps {
  locationData?: LocationData;
  petName: string;
}

// Função para validar latitude especificamente
const isValidLatitude = (lat: any): boolean => {
  if (typeof lat !== 'number' || isNaN(lat)) {
    return false;
  }
  return lat >= -90 && lat <= 90;
};

// Função para validar longitude especificamente
const isValidLongitude = (lng: any): boolean => {
  if (typeof lng !== 'number' || isNaN(lng)) {
    return false;
  }
  return lng >= -180 && lng <= 180;
};

export const LocationMap: React.FC<LocationMapProps> = ({
  locationData,
  petName,
}) => {
  // Validação robusta dos dados de localização
  if (
    !locationData ||
    !isValidLatitude(locationData.latitude) ||
    !isValidLongitude(locationData.longitude) ||
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

  const latitude = Number(locationData.latitude);
  const longitude = Number(locationData.longitude);
  const enderecoCompleto = locationData.enderecoCompleto;

  return (
    <View style={styles.mapContainer}>
      {enderecoCompleto && (
        <Text style={styles.addressText}>{enderecoCompleto}</Text>
      )}
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.005, // Controla o zoom inicial
            longitudeDelta: 0.005,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          mapType="standard"
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={petName || "Animal"}
            description={enderecoCompleto || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
          />
        </MapView>
      </View>
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
    color: Colors.preto,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  mapWrapper: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.cinza,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  noLocationContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cinza,
    borderRadius: 8,
    marginTop: 12,
    minHeight: 150,
  },
  noLocationText: {
    fontSize: 16,
    fontFamily: "Roboto-Medium",
    color: Colors.preto,
    marginBottom: 8,
  },
  noLocationSubtext: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: Colors.preto,
    textAlign: "center",
    opacity: 0.6,
  },
});

