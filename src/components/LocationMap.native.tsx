import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import { View, StyleSheet, Text, Linking, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { LocationData } from "../types/index";

export interface LocationMapProps {
  locationData?: LocationData;
  petName: string;
}

// Função para validar coordenadas
const isValidCoordinate = (value: any): boolean => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  // Latitude deve estar entre -90 e 90
  // Longitude deve estar entre -180 e 180
  return value >= -180 && value <= 180;
};

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

// Error Boundary para capturar erros do MapView
class MapErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro no MapView:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // O componente pai vai mostrar o fallback
    }
    return this.props.children;
  }
}

export const LocationMap: React.FC<LocationMapProps> = ({
  locationData,
  petName,
}) => {
  const [mapError, setMapError] = useState(false);

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
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // Se houver erro no mapa, mostrar fallback
  if (mapError) {
    return (
      <View style={styles.mapContainer}>
        {enderecoCompleto && (
          <Text style={styles.addressText}>{enderecoCompleto}</Text>
        )}
        <View style={styles.mapErrorContainer}>
          <Text style={styles.mapErrorText}>📍</Text>
          <Text style={styles.mapErrorSubtext}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
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
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      {enderecoCompleto && (
        <Text style={styles.addressText}>{enderecoCompleto}</Text>
      )}
      <View style={styles.mapWrapper}>
        <MapErrorBoundary onError={() => setMapError(true)}>
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
            onMapReady={() => {
              setMapError(false);
            }}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              title={petName}
              description={enderecoCompleto || "Localização do animal"}
            />
          </MapView>
        </MapErrorBoundary>
      </View>
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
  mapWrapper: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  map: {
    width: "100%",
    height: "100%",
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
  mapErrorContainer: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 20,
  },
  mapErrorText: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapErrorSubtext: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#757575",
    marginBottom: 12,
    textAlign: "center",
  },
});

