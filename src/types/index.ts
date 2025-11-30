import { Timestamp } from 'firebase/firestore';

export interface Metadata {
  compression: string;
  imagesCount: number;
  storageType: string;
  timestamp: string; 
}

export interface LocationData {
  latitude: number;
  longitude: number;
  bairro?: string;
  cidade?: string;
  estado?: string;
  enderecoCompleto?: string;
}

export interface Animal {
  id: string; 
  dataCadastro: Timestamp; 
  disponivel: boolean;
  doencas: string;
  dono: string;
  especie: 'Cachorro' | 'Gato'; 
  exigencias: string[];
  fotoPrincipal: string | null;
  fotos: string[];
  idade: 'Filhote' | 'Adulto' | 'Idoso';
  localizacao: string; // Nome do bairro/cidade (para compatibilidade)
  locationData?: LocationData; // Dados completos de localização
  metadata: Metadata; 
  nome: string;
  porte: 'Pequeno' | 'Médio' | 'Grande';
  saude: string[];
  sexo: 'Macho' | 'Fêmea';
  sobre: string;
  temperamento: string[];
  tipoCadastro: 'ADOÇÃO'; 
}