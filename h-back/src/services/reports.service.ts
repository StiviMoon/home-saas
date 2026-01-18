import { adminDb } from "../config/firebase";
import type { Report, ReportPhoto, ReportComment, CreateReportData, UpdateReportData } from "../types/report";
import { v4 as uuidv4 } from "uuid";

const REPORTS_COLLECTION = "reportes";
const REPORT_PHOTOS_COLLECTION = "reporte_fotos";
const REPORT_COMMENTS_COLLECTION = "comentarios";

/**
 * Convierte un documento de Firestore a Report
 */
const firestoreToReport = (doc: FirebaseFirestore.DocumentSnapshot): Report => {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined");

  // Convertir Timestamp de Firestore a Date si es necesario
  let created_at: Date | FirebaseFirestore.Timestamp;
  if (data.created_at && typeof data.created_at.toDate === "function") {
    created_at = data.created_at.toDate();
  } else if (data.created_at instanceof Date) {
    created_at = data.created_at;
  } else {
    created_at = new Date();
  }

  let updated_at: Date | FirebaseFirestore.Timestamp | undefined;
  if (data.updated_at) {
    if (typeof data.updated_at.toDate === "function") {
      updated_at = data.updated_at.toDate();
    } else if (data.updated_at instanceof Date) {
      updated_at = data.updated_at;
    }
  }

  return {
    id: doc.id,
    conjunto_id: data.conjunto_id,
    usuario_id: data.usuario_id,
    titulo: data.titulo,
    descripcion: data.descripcion,
    categoria: data.categoria,
    ubicacion: data.ubicacion,
    estado: data.estado || "abierto",
    es_anonimo: data.es_anonimo || false,
    created_at,
    updated_at,
  } as Report;
};

/**
 * Convierte un documento de Firestore a ReportPhoto
 */
const firestoreToReportPhoto = (doc: FirebaseFirestore.DocumentSnapshot): ReportPhoto => {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined");

  // Convertir Timestamp de Firestore a Date si es necesario
  let created_at: Date | FirebaseFirestore.Timestamp;
  if (data.created_at && typeof data.created_at.toDate === "function") {
    created_at = data.created_at.toDate();
  } else if (data.created_at instanceof Date) {
    created_at = data.created_at;
  } else {
    created_at = new Date();
  }

  return {
    id: doc.id,
    reporte_id: data.reporte_id,
    cloudinary_id: data.cloudinary_id,
    url: data.url,
    created_at,
  } as ReportPhoto;
};

/**
 * Convierte un documento de Firestore a ReportComment
 */
const firestoreToReportComment = (doc: FirebaseFirestore.DocumentSnapshot): ReportComment => {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined");

  // Convertir Timestamp de Firestore a Date si es necesario
  let created_at: Date | FirebaseFirestore.Timestamp;
  if (data.created_at && typeof data.created_at.toDate === "function") {
    created_at = data.created_at.toDate();
  } else if (data.created_at instanceof Date) {
    created_at = data.created_at;
  } else {
    created_at = new Date();
  }

  return {
    id: doc.id,
    reporte_id: data.reporte_id,
    usuario_id: data.usuario_id,
    contenido: data.contenido,
    es_interno: data.es_interno || false,
    created_at,
  } as ReportComment;
};

/**
 * Crea un nuevo reporte
 */
export const createReport = async (reportData: CreateReportData, usuarioId: string): Promise<Report> => {
  const id = uuidv4();
  const reportRef = adminDb.collection(REPORTS_COLLECTION).doc(id);

  const newReport = {
    conjunto_id: reportData.conjunto_id,
    usuario_id: usuarioId,
    titulo: reportData.titulo,
    descripcion: reportData.descripcion,
    categoria: reportData.categoria,
    ubicacion: reportData.ubicacion,
    estado: "abierto" as const,
    es_anonimo: reportData.es_anonimo || false,
    created_at: new Date(),
  };

  await reportRef.set(newReport);

  return {
    id,
    ...newReport,
  };
};

/**
 * Obtiene un reporte por ID
 */
export const getReportById = async (reportId: string): Promise<Report | null> => {
  try {
    const doc = await adminDb.collection(REPORTS_COLLECTION).doc(reportId).get();
    if (!doc.exists) return null;
    return firestoreToReport(doc);
  } catch (error: any) {
    console.error("Error al obtener reporte por ID:", error);
    throw error;
  }
};

/**
 * Obtiene reportes por conjunto
 */
export const getReportsByConjunto = async (conjuntoId: string): Promise<Report[]> => {
  try {
    // Obtener sin orderBy para evitar necesidad de índice compuesto
    const snapshot = await adminDb
      .collection(REPORTS_COLLECTION)
      .where("conjunto_id", "==", conjuntoId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const reports = snapshot.docs.map((doc) => firestoreToReport(doc));
    
    // Ordenar manualmente por fecha (más reciente primero)
    return reports.sort((a, b) => {
      const dateA = a.created_at instanceof Date 
        ? a.created_at 
        : (a.created_at as any)?.toDate?.() || new Date(0);
      const dateB = b.created_at instanceof Date 
        ? b.created_at 
        : (b.created_at as any)?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error("Error al obtener reportes por conjunto:", error);
    return [];
  }
};

/**
 * Obtiene reportes por usuario
 */
export const getReportsByUser = async (usuarioId: string): Promise<Report[]> => {
  try {
    // Obtener sin orderBy para evitar necesidad de índice compuesto
    const snapshot = await adminDb
      .collection(REPORTS_COLLECTION)
      .where("usuario_id", "==", usuarioId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const reports = snapshot.docs.map((doc) => firestoreToReport(doc));
    
    // Ordenar manualmente por fecha (más reciente primero)
    return reports.sort((a, b) => {
      const dateA = a.created_at instanceof Date 
        ? a.created_at 
        : (a.created_at as any)?.toDate?.() || new Date(0);
      const dateB = b.created_at instanceof Date 
        ? b.created_at 
        : (b.created_at as any)?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error("Error al obtener reportes por usuario:", error);
    return [];
  }
};

/**
 * Obtiene todos los reportes (solo para super_admin)
 */
export const getAllReports = async (): Promise<Report[]> => {
  try {
    // Obtener sin orderBy para evitar necesidad de índice
    const snapshot = await adminDb
      .collection(REPORTS_COLLECTION)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const reports = snapshot.docs.map((doc) => firestoreToReport(doc));
    
    // Ordenar manualmente por fecha (más reciente primero)
    return reports.sort((a, b) => {
      const dateA = a.created_at instanceof Date 
        ? a.created_at 
        : (a.created_at as any)?.toDate?.() || new Date(0);
      const dateB = b.created_at instanceof Date 
        ? b.created_at 
        : (b.created_at as any)?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error("Error al obtener todos los reportes:", error);
    return [];
  }
};

/**
 * Actualiza un reporte
 */
export const updateReport = async (reportId: string, updateData: UpdateReportData): Promise<void> => {
  const reportRef = adminDb.collection(REPORTS_COLLECTION).doc(reportId);
  await reportRef.update({
    ...updateData,
    updated_at: new Date(),
  });
};

/**
 * Agrega una foto a un reporte
 */
export const addReportPhoto = async (
  reportId: string,
  cloudinaryId: string,
  url: string
): Promise<ReportPhoto> => {
  const id = uuidv4();
  const photoRef = adminDb.collection(REPORT_PHOTOS_COLLECTION).doc(id);

  const newPhoto = {
    reporte_id: reportId,
    cloudinary_id: cloudinaryId,
    url,
    created_at: new Date(),
  };

  await photoRef.set(newPhoto);

  return {
    id,
    ...newPhoto,
  };
};

/**
 * Obtiene las fotos de un reporte
 */
export const getReportPhotos = async (reportId: string): Promise<ReportPhoto[]> => {
  try {
    // Obtener sin orderBy para evitar necesidad de índice
    const snapshot = await adminDb
      .collection(REPORT_PHOTOS_COLLECTION)
      .where("reporte_id", "==", reportId)
      .get();

    const photos = snapshot.docs.map((doc) => firestoreToReportPhoto(doc));
    
    // Ordenar manualmente por fecha (más antiguo primero)
    return photos.sort((a, b) => {
      const dateA = a.created_at instanceof Date 
        ? a.created_at 
        : (a.created_at as any)?.toDate?.() || new Date(0);
      const dateB = b.created_at instanceof Date 
        ? b.created_at 
        : (b.created_at as any)?.toDate?.() || new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error: any) {
    console.error("Error al obtener fotos del reporte:", error);
    return [];
  }
};

/**
 * Agrega un comentario a un reporte
 */
export const addReportComment = async (
  reportId: string,
  usuarioId: string,
  contenido: string,
  esInterno: boolean = false
): Promise<ReportComment> => {
  const id = uuidv4();
  const commentRef = adminDb.collection(REPORT_COMMENTS_COLLECTION).doc(id);

  const newComment = {
    reporte_id: reportId,
    usuario_id: usuarioId,
    contenido,
    es_interno: esInterno,
    created_at: new Date(),
  };

  await commentRef.set(newComment);

  return {
    id,
    ...newComment,
  };
};

/**
 * Obtiene los comentarios de un reporte
 */
export const getReportComments = async (reportId: string, includeInternal: boolean = false): Promise<ReportComment[]> => {
  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection(REPORT_COMMENTS_COLLECTION)
      .where("reporte_id", "==", reportId);

    if (!includeInternal) {
      query = query.where("es_interno", "==", false);
    }

    // Obtener sin orderBy para evitar necesidad de índice compuesto
    const snapshot = await query.get();
    
    const comments = snapshot.docs.map((doc) => firestoreToReportComment(doc));
    
    // Ordenar manualmente por fecha (más antiguo primero)
    return comments.sort((a, b) => {
      const dateA = a.created_at instanceof Date 
        ? a.created_at 
        : (a.created_at as any)?.toDate?.() || new Date(0);
      const dateB = b.created_at instanceof Date 
        ? b.created_at 
        : (b.created_at as any)?.toDate?.() || new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error: any) {
    console.error("Error al obtener comentarios del reporte:", error);
    return [];
  }
};

/**
 * Obtiene estadísticas generales de reportes
 */
export const getReportsStatistics = async () => {
  try {
    const allReports = await getAllReports();
    const total = allReports.length;

    if (total === 0) {
      return {
        total: 0,
        por_estado: {
          abierto: { cantidad: 0, porcentaje: 0 },
          en_progreso: { cantidad: 0, porcentaje: 0 },
          resuelto: { cantidad: 0, porcentaje: 0 },
          cerrado: { cantidad: 0, porcentaje: 0 },
        },
        por_categoria: {
          infraestructura: { cantidad: 0, porcentaje: 0 },
          seguridad: { cantidad: 0, porcentaje: 0 },
          aseo: { cantidad: 0, porcentaje: 0 },
          convivencia: { cantidad: 0, porcentaje: 0 },
          otro: { cantidad: 0, porcentaje: 0 },
        },
      };
    }

    // Calcular por estado
    const porEstado = {
      abierto: allReports.filter((r) => r.estado === "abierto").length,
      en_progreso: allReports.filter((r) => r.estado === "en_progreso").length,
      resuelto: allReports.filter((r) => r.estado === "resuelto").length,
      cerrado: allReports.filter((r) => r.estado === "cerrado").length,
    };

    // Calcular por categoría
    const porCategoria = {
      infraestructura: allReports.filter((r) => r.categoria === "infraestructura").length,
      seguridad: allReports.filter((r) => r.categoria === "seguridad").length,
      aseo: allReports.filter((r) => r.categoria === "aseo").length,
      convivencia: allReports.filter((r) => r.categoria === "convivencia").length,
      otro: allReports.filter((r) => r.categoria === "otro").length,
    };

    return {
      total,
      por_estado: {
        abierto: {
          cantidad: porEstado.abierto,
          porcentaje: Math.round((porEstado.abierto / total) * 100 * 100) / 100,
        },
        en_progreso: {
          cantidad: porEstado.en_progreso,
          porcentaje: Math.round((porEstado.en_progreso / total) * 100 * 100) / 100,
        },
        resuelto: {
          cantidad: porEstado.resuelto,
          porcentaje: Math.round((porEstado.resuelto / total) * 100 * 100) / 100,
        },
        cerrado: {
          cantidad: porEstado.cerrado,
          porcentaje: Math.round((porEstado.cerrado / total) * 100 * 100) / 100,
        },
      },
      por_categoria: {
        infraestructura: {
          cantidad: porCategoria.infraestructura,
          porcentaje: Math.round((porCategoria.infraestructura / total) * 100 * 100) / 100,
        },
        seguridad: {
          cantidad: porCategoria.seguridad,
          porcentaje: Math.round((porCategoria.seguridad / total) * 100 * 100) / 100,
        },
        aseo: {
          cantidad: porCategoria.aseo,
          porcentaje: Math.round((porCategoria.aseo / total) * 100 * 100) / 100,
        },
        convivencia: {
          cantidad: porCategoria.convivencia,
          porcentaje: Math.round((porCategoria.convivencia / total) * 100 * 100) / 100,
        },
        otro: {
          cantidad: porCategoria.otro,
          porcentaje: Math.round((porCategoria.otro / total) * 100 * 100) / 100,
        },
      },
    };
  } catch (error: any) {
    console.error("Error al obtener estadísticas de reportes:", error);
    throw error;
  }
};

