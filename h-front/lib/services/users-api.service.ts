"use client";

import { apiService } from "./api.service";
import type { User, CreateUserData, UpdateUserData } from "@/lib/types/user";

/**
 * Servicio para interactuar con la API de usuarios
 */
export const usersApiService = {
  /**
   * Crea un nuevo usuario
   */
  createUser: async (userData: CreateUserData, token?: string) => {
    const response = await apiService.post<{ success: boolean; data: User }>(
      "/users",
      userData,
      token
    );
    return response.data;
  },

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser: async (token: string) => {
    const response = await apiService.get<{ success: boolean; data: User }>(
      "/users/me",
      token
    );
    return response.data;
  },

  /**
   * Obtiene un usuario por ID
   */
  getUserById: async (userId: string, token: string) => {
    const response = await apiService.get<{ success: boolean; data: User }>(
      `/users/${userId}`,
      token
    );
    return response.data;
  },

  /**
   * Actualiza un usuario
   */
  updateUser: async (userId: string, userData: UpdateUserData, token: string) => {
    const response = await apiService.put<{ success: boolean; data: User }>(
      `/users/${userId}`,
      userData,
      token
    );
    return response.data;
  },

  /**
   * Obtiene usuarios por conjunto
   */
  getUsersByConjunto: async (conjuntoId: string, token: string): Promise<{ data: User[]; count: number }> => {
    const response = await apiService.get<{
      success: boolean;
      data: User[];
      count: number;
    }>(`/users/conjunto/${conjuntoId}`, token);
    // La respuesta del API tiene { success: true, data: User[], count: number }
    // Retornamos { data, count } para mantener consistencia con el frontend
    return {
      data: response.data,
      count: response.count,
    };
  },

  /**
   * Obtiene todos los usuarios (solo super admin)
   */
  getAllUsers: async (token: string): Promise<{ data: User[]; count: number }> => {
    const response = await apiService.get<{
      success: boolean;
      data: User[];
      count: number;
    }>("/users/all", token);
    return { data: response.data, count: response.count };
  },

  /**
   * Asigna rol de admin a un usuario por email (solo super admin)
   */
  assignAdminRole: async (
    email: string,
    conjuntoId: string,
    token: string
  ): Promise<{
    data: User;
    message: string;
    cambios?: string[];
    estado_anterior?: {
      rol: string;
      conjunto_id: string | null;
      unidad: string | null;
    };
    estado_nuevo?: {
      rol: string;
      conjunto_id: string | null;
      unidad: string | null;
    };
  }> => {
    const response = await apiService.post<{
      success: boolean;
      data: User;
      message: string;
      cambios?: string[];
      estado_anterior?: {
        rol: string;
        conjunto_id: string | null;
        unidad: string | null;
      };
      estado_nuevo?: {
        rol: string;
        conjunto_id: string | null;
        unidad: string | null;
      };
    }>(
      "/users/assign-admin",
      { email, conjunto_id: conjuntoId },
      token
    );
    return {
      data: response.data,
      message: response.message,
      cambios: response.cambios,
      estado_anterior: response.estado_anterior,
      estado_nuevo: response.estado_nuevo,
    };
  },

  /**
   * Elimina un usuario (solo super admin)
   */
  deleteUser: async (userId: string, token: string): Promise<void> => {
    await apiService.delete<{
      success: boolean;
      message: string;
      data: {
        id: string;
        email: string;
        nombre: string;
        rol: string;
      };
    }>(`/users/${userId}`, token);
  },
};

