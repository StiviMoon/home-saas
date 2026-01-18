"use client";

import { apiService } from "./api.service";
import type {
  Report,
  ReportWithDetails,
  ReportComment,
  ReportPhoto,
  CreateReportData,
  UpdateReportData,
} from "@/lib/types/report";

/**
 * Servicio para interactuar con la API de reportes
 */
export const reportsApiService = {
  /**
   * Obtiene todos los reportes (según permisos del usuario)
   */
  getReports: async (token: string): Promise<{ data: Report[]; count: number }> => {
    const response = await apiService.get<{
      success: boolean;
      data: Report[];
      count: number;
    }>("/reports", token);

    return { data: response.data, count: response.count };
  },

  /**
   * Obtiene un reporte por ID con detalles
   */
  getReportById: async (reportId: string, token: string): Promise<ReportWithDetails> => {
    const response = await apiService.get<{ success: boolean; data: ReportWithDetails }>(
      `/reports/${reportId}`,
      token
    );
    return response.data;
  },

  /**
   * Crea un nuevo reporte
   */
  createReport: async (reportData: CreateReportData, token: string): Promise<Report> => {
    const response = await apiService.post<{ success: boolean; data: Report }>(
      "/reports",
      reportData,
      token
    );
    return response.data;
  },

  /**
   * Actualiza un reporte
   */
  updateReport: async (
    reportId: string,
    reportData: UpdateReportData,
    token: string
  ): Promise<Report> => {
    const response = await apiService.put<{ success: boolean; data: Report }>(
      `/reports/${reportId}`,
      reportData,
      token
    );
    return response.data;
  },

  /**
   * Agrega un comentario a un reporte
   */
  addComment: async (
    reportId: string,
    contenido: string,
    esInterno: boolean,
    token: string
  ): Promise<ReportComment> => {
    const response = await apiService.post<{
      success: boolean;
      data: ReportComment;
    }>(
      `/reports/${reportId}/comments`,
      { contenido, es_interno: esInterno },
      token
    );
    return response.data;
  },

  /**
   * Agrega una foto a un reporte
   */
  addPhoto: async (
    reportId: string,
    cloudinaryId: string,
    url: string,
    token: string
  ): Promise<ReportPhoto> => {
    const response = await apiService.post<{
      success: boolean;
      data: ReportPhoto;
    }>(
      `/reports/${reportId}/photos`,
      { cloudinary_id: cloudinaryId, url },
      token
    );
    return response.data;
  },

  /**
   * Obtiene estadísticas de reportes (solo super admin)
   */
  getStatistics: async (token: string) => {
    const response = await apiService.get<{
      success: boolean;
      data: {
        total: number;
        por_estado: {
          abierto: { cantidad: number; porcentaje: number };
          en_progreso: { cantidad: number; porcentaje: number };
          resuelto: { cantidad: number; porcentaje: number };
          cerrado: { cantidad: number; porcentaje: number };
        };
        por_categoria: {
          infraestructura: { cantidad: number; porcentaje: number };
          seguridad: { cantidad: number; porcentaje: number };
          aseo: { cantidad: number; porcentaje: number };
          convivencia: { cantidad: number; porcentaje: number };
          otro: { cantidad: number; porcentaje: number };
        };
      };
    }>("/reports/statistics", token);
    return response.data;
  },
};

