export interface Conjunto {
  id: string; // UUID
  nombre: string;
  direccion: string;
  ciudad: string;
  codigo_acceso: string; // Código de 10 caracteres
  created_at: Date | FirebaseFirestore.Timestamp;
}

export interface CreateConjuntoData {
  nombre: string;
  direccion: string;
  ciudad: string;
  codigo_acceso?: string; // Opcional, se genera si no se proporciona
}

export interface UpdateConjuntoData {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  codigo_acceso?: string;
}

