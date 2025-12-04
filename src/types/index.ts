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

export interface UserMetadata {
  storageType: string;
  hasProfilePicture?: boolean;
  compression?: string;
  timestamp: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  idade: string;
  telefone: string;
  username: string;
  fotoPerfil: string | null;
  dataCadastro: Timestamp | Date;
  ultimaAtualizacao: Timestamp | Date;
  tipoUsuario: 'pessoal';
  metadata: UserMetadata;
}

export interface Animal {
  id: string; 
  dataCadastro: Timestamp; 
  disponivel: boolean; 
  dono: string; 
  especie: 'Cachorro' | 'Gato'; 
  fotos: string[]; 
  idade: 'Filhote' | 'Adulto' | 'Idoso'; 
  localizacao: string; 
  metadata: Metadata;
  nome: string; 
  porte: 'Pequeno' | 'Médio' | 'Grande'; 
  sexo: 'Macho' | 'Fêmea'; 
  tipoCadastro: 'ADOÇÃO'; 
  
  doencas: string; 
  exigencias: string[]; 
  saude: string[]; 
  sobre: string; 
  temperamento: string[]; 
  
  fotoPrincipal?: string | null; 
  locationData?: LocationData; 
}