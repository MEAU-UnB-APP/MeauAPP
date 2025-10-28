import { Timestamp } from 'firebase/firestore';

export interface Metadata {
  compression: string;
  imagesCount: number;
  storageType: string;
  timestamp: string; 
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
  localizacao: string;
  metadata: Metadata; 
  nome: string;
  porte: 'Pequeno' | 'Médio' | 'Grande';
  saude: string[];
  sexo: 'Macho' | 'Fêmea';
  sobre: string;
  temperamento: string[];
  tipoCadastro: 'ADOÇÃO'; 
}