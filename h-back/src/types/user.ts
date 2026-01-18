export type UserRole = "residente" | "admin" | "super_admin";

export interface User {
  id: string;
  auth_id: string;
  email: string;
  nombre: string;
  conjunto_id?: string | null;
  unidad?: string | null;
  rol: UserRole;
  created_at: Date | FirebaseFirestore.Timestamp;
  updated_at: Date | FirebaseFirestore.Timestamp;
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

