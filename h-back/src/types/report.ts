export type ReportCategory = "infraestructura" | "seguridad" | "aseo" | "convivencia" | "otro";
export type ReportStatus = "abierto" | "en_progreso" | "resuelto" | "cerrado";

export interface Report {
  id: string; // UUID
  conjunto_id: string; // UUID del conjunto
  usuario_id: string; // UUID del usuario creador
  titulo: string;
  descripcion: string;
  categoria: ReportCategory;
  ubicacion: string;
  estado: ReportStatus;
  es_anonimo: boolean;
  created_at: Date | FirebaseFirestore.Timestamp;
  updated_at?: Date | FirebaseFirestore.Timestamp;
  primera_foto?: ReportPhoto; // Primera foto para vista previa en lista
}

export interface ReportPhoto {
  id: string; // UUID
  reporte_id: string; // UUID del reporte
  cloudinary_id: string;
  url: string;
  created_at: Date | FirebaseFirestore.Timestamp;
}

export interface ReportComment {
  id: string; // UUID
  reporte_id: string; // UUID del reporte
  usuario_id: string; // UUID del usuario autor
  contenido: string;
  es_interno: boolean; // Solo visible para admins
  created_at: Date | FirebaseFirestore.Timestamp;
}

export interface CreateReportData {
  conjunto_id: string;
  titulo: string;
  descripcion: string;
  categoria: ReportCategory;
  ubicacion: string;
  es_anonimo?: boolean;
}

export interface UpdateReportData {
  titulo?: string;
  descripcion?: string;
  categoria?: ReportCategory;
  ubicacion?: string;
  estado?: ReportStatus;
  es_anonimo?: boolean;
}

