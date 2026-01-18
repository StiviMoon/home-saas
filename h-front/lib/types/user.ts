export type UserRole = "residente" | "admin" | "super_admin";

export interface User {
  id: string; // UUID del usuario (mismo que auth_id)
  auth_id: string; // ID de Firebase Auth
  email: string;
  nombre: string;
  conjunto_id?: string; // UUID del conjunto (opcional, puede ser null)
  unidad?: string; // Número de apartamento/casa (opcional)
  rol: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  auth_id: string;
  email: string;
  nombre: string;
  conjunto_id?: string;
  unidad?: string;
  rol?: UserRole;
}

export interface UpdateUserData {
  nombre?: string;
  conjunto_id?: string;
  unidad?: string;
  rol?: UserRole;
}

