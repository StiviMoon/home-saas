import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as reportsService from "../services/reports.service";
import * as usersService from "../services/users.service";
import type { CreateReportData, UpdateReportData, Report } from "../types/report";

/**
 * Crea un nuevo reporte
 */
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    if (!currentUser.conjunto_id) {
      return res.status(400).json({
        success: false,
        error: "El usuario debe pertenecer a un conjunto",
      });
    }

    const reportData: CreateReportData = req.body;
    const report = await reportsService.createReport(reportData, currentUser.id);

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al crear el reporte",
      details: error.message,
    });
  }
};

/**
 * Obtiene un reporte por ID
 */
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "ID de reporte requerido",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const report = await reportsService.getReportById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Reporte no encontrado",
      });
    }

    // Verificar permisos: solo puede ver reportes de su conjunto (o todos si es super admin)
    if (currentUser.rol !== "super_admin" && report.conjunto_id !== currentUser.conjunto_id) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para ver este reporte",
      });
    }

    // Obtener fotos y comentarios
    const photos = await reportsService.getReportPhotos(reportId);
    const comments = await reportsService.getReportComments(
      reportId,
      currentUser.rol === "admin" || currentUser.rol === "super_admin"
    );

    return res.status(200).json({
      success: true,
      data: {
        ...report,
        fotos: photos,
        comentarios: comments,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener el reporte",
      details: error.message,
    });
  }
};

/**
 * Obtiene reportes según el rol del usuario
 */
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    let reports: Report[] = [];

    try {
      if (currentUser.rol === "super_admin") {
        // Super admin ve todos los reportes
        reports = await reportsService.getAllReports();
      } else if (currentUser.rol === "admin" && currentUser.conjunto_id) {
        // Admin ve reportes de su conjunto
        reports = await reportsService.getReportsByConjunto(currentUser.conjunto_id);
      } else if (currentUser.conjunto_id) {
        // Residente ve reportes de su conjunto (todos los reportes del conjunto, no solo los suyos)
        reports = await reportsService.getReportsByConjunto(currentUser.conjunto_id);
      } else {
        // Si no tiene conjunto, no puede ver reportes
        reports = [];
      }

      // Obtener la primera foto de cada reporte para la vista previa
      const reportsWithFirstPhoto = await Promise.all(
        reports.map(async (report) => {
          try {
            const photos = await reportsService.getReportPhotos(report.id);
            const firstPhoto = photos.length > 0 ? photos[0] : null;
            return {
              ...report,
              primera_foto: firstPhoto || undefined,
            };
          } catch (photoError: any) {
            console.error(`Error al obtener foto para reporte ${report.id}:`, photoError);
            return {
              ...report,
              primera_foto: undefined,
            };
          }
        })
      );

      // Siempre devolver éxito, incluso si no hay reportes
      return res.status(200).json({
        success: true,
        data: reportsWithFirstPhoto || [],
        count: reportsWithFirstPhoto?.length || 0,
      });
    } catch (serviceError: any) {
      console.error("Error en servicio de reportes:", serviceError);
      // Si hay un error, devolver array vacío en lugar de fallar
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener los reportes",
      details: error.message,
    });
  }
};

/**
 * Obtiene estadísticas generales de reportes (solo super admin)
 */
export const getReportsStatistics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser || currentUser.rol !== "super_admin") {
      return res.status(403).json({
        success: false,
        error: "Solo los super administradores pueden ver estadísticas",
      });
    }

    const statistics = await reportsService.getReportsStatistics();

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener las estadísticas",
      details: error.message,
    });
  }
};

/**
 * Actualiza un reporte
 */
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "ID de reporte requerido",
      });
    }

    const report = await reportsService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Reporte no encontrado",
      });
    }

    // Verificar permisos: solo admin y super admin pueden actualizar reportes
    if (currentUser.rol !== "admin" && currentUser.rol !== "super_admin") {
      return res.status(403).json({
        success: false,
        error: "Solo los administradores pueden actualizar reportes",
      });
    }

    // Si es admin, solo puede actualizar reportes de su conjunto
    if (currentUser.rol === "admin" && report.conjunto_id !== currentUser.conjunto_id) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para actualizar este reporte",
      });
    }

    const updateData: UpdateReportData = req.body;
    await reportsService.updateReport(reportId, updateData);

    const updatedReport = await reportsService.getReportById(reportId);

    return res.status(200).json({
      success: true,
      data: updatedReport,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al actualizar el reporte",
      details: error.message,
    });
  }
};

/**
 * Agrega una foto a un reporte
 */
export const addPhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "ID de reporte requerido",
      });
    }

    const { cloudinary_id, url } = req.body;
    if (!cloudinary_id || !url) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: cloudinary_id, url",
      });
    }

    const report = await reportsService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Reporte no encontrado",
      });
    }

    // Verificar permisos: solo puede agregar fotos a reportes de su conjunto
    if (currentUser.rol !== "super_admin" && report.conjunto_id !== currentUser.conjunto_id) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para agregar fotos a este reporte",
      });
    }

    const photo = await reportsService.addReportPhoto(reportId, cloudinary_id, url);

    return res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al agregar la foto",
      details: error.message,
    });
  }
};

/**
 * Agrega un comentario a un reporte
 */
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    const currentUser = await usersService.getUserByAuthId(req.user.uid);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "ID de reporte requerido",
      });
    }

    const { contenido, es_interno } = req.body;
    if (!contenido) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: contenido",
      });
    }

    const report = await reportsService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Reporte no encontrado",
      });
    }

    // Verificar permisos: solo puede comentar en reportes de su conjunto
    if (currentUser.rol !== "super_admin" && report.conjunto_id !== currentUser.conjunto_id) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para comentar en este reporte",
      });
    }

    // Solo admin y super admin pueden crear comentarios internos
    const esInterno = (currentUser.rol === "admin" || currentUser.rol === "super_admin") && es_interno === true;

    const comment = await reportsService.addReportComment(
      reportId,
      currentUser.id,
      contenido,
      esInterno
    );

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Error al agregar el comentario",
      details: error.message,
    });
  }
};
