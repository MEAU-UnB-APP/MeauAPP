// Serviço de geocoding usando OpenStreetMap Nominatim (gratuito)
// Funciona tanto para web quanto para mobile

export interface GeocodingResult {
  bairro?: string;
  cidade?: string;
  estado?: string;
  enderecoCompleto: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodingResult> => {
  try {
    // Usando OpenStreetMap Nominatim (gratuito, sem API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MeauAPP/1.0' // Nominatim requer User-Agent
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar endereço');
    }

    const data = await response.json();
    const address = data.address || {};

    // Extrair informações do endereço
    const bairro = 
      address.suburb || 
      address.neighbourhood || 
      address.quarter || 
      address.city_district || 
      '';
    
    const cidade = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality || 
      '';
    
    const estado = 
      address.state || 
      address.region || 
      '';

    // Construir endereço completo
    const enderecoParts = [];
    if (address.road) enderecoParts.push(address.road);
    if (address.house_number) enderecoParts.push(address.house_number);
    if (bairro) enderecoParts.push(bairro);
    if (cidade) enderecoParts.push(cidade);
    if (estado) enderecoParts.push(estado);
    if (address.postcode) enderecoParts.push(address.postcode);

    const enderecoCompleto = enderecoParts.join(', ') || data.display_name || '';

    return {
      bairro: bairro || cidade || '',
      cidade: cidade || '',
      estado: estado || '',
      enderecoCompleto: enderecoCompleto || `Lat: ${latitude}, Lon: ${longitude}`
    };
  } catch (error) {
    console.error('Erro no geocoding:', error);
    throw error;
  }
};

// Função para geocoding direto (quando usuário digita endereço)
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=pt-BR`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MeauAPP/1.0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch (error) {
    console.error('Erro no geocoding de endereço:', error);
    return null;
  }
};

