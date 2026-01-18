"use client";

import { apiService } from "./api.service";
import type { Conjunto, CreateConjuntoData, UpdateConjuntoData } from "@/lib/types/conjunto";

/**
 * Servicio para interactuar con la API de conjuntos
 */
export const conjuntosApiService = {
  /**
   * Obtiene un conjunto por código de acceso (público)
   */
  getConjuntoByCode: async (codigo: string): Promise<Conjunto> => {
    const response = await apiService.get<{ success: boolean; data: Conjunto }>(
      `/conjuntos/code/${codigo}`
    );
    return response.data;
  },

  /**
   * Obtiene un conjunto por ID
   */
  getConjuntoById: async (conjuntoId: string, token: string): Promise<Conjunto> => {
    const response = await apiService.get<{ success: boolean; data: Conjunto }>(
      `/conjuntos/${conjuntoId}`,
      token
    );
    return response.data;
  },

  /**
   * Obtiene todos los conjuntos (según permisos)
   */
  getAllConjuntos: async (token: string): Promise<Conjunto[]> => {
    const response = await apiService.get<{ success: boolean; data: Conjunto[] }>(
      "/conjuntos",
      token
    );
    return response.data;
  },

  /**
   * Crea un nuevo conjunto (solo super_admin)
   */
  createConjunto: async (conjuntoData: CreateConjuntoData, token: string): Promise<Conjunto> => {
    const response = await apiService.post<{ success: boolean; data: Conjunto }>(
      "/conjuntos",
      conjuntoData,
      token
    );
    return response.data;
  },

  /**
   * Actualiza un conjunto (solo super_admin)
   */
  updateConjunto: async (
    conjuntoId: string,
    conjuntoData: UpdateConjuntoData,
    token: string
  ): Promise<Conjunto> => {
    const response = await apiService.put<{ success: boolean; data: Conjunto }>(
      `/conjuntos/${conjuntoId}`,
      conjuntoData,
      token
    );
    return response.data;
  },

  /**
   * Regenera el código de acceso de un conjunto
   */
  regenerateAccessCode: async (conjuntoId: string, token: string): Promise<string> => {
    const response = await apiService.post<{ success: boolean; data: { codigo_acceso: string } }>(
      `/conjuntos/${conjuntoId}/regenerate-code`,
      {},
      token
    );
    return response.data.codigo_acceso;
  },
};

