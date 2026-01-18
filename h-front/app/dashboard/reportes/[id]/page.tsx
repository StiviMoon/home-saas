"use client";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUser } from "@/lib/hooks/use-user";
import { reportsApiService } from "@/lib/services/reports-api.service";
import { usersApiService } from "@/lib/services/users-api.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  Tag,
  User as UserIcon,
  Lock,
  Settings,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReportWithDetails, ReportStatus } from "@/lib/types/report";
import type { User } from "@/lib/types/user";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ReporteDetailPage = () => {
  const { user } = useAuth();
  const { user: userData, isLoading: userLoading, isAdmin, isSuperAdmin } = useUser();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const reportId = params?.id as string;

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [esInterno, setEsInterno] = useState(false);

  // Obtener reporte por ID
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useQuery<ReportWithDetails>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!user || !reportId) throw new Error("Usuario no autenticado o ID inválido");
      const token = await user.getIdToken();
      return await reportsApiService.getReportById(reportId, token);
    },
    enabled: !!user && !!reportId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Obtener usuarios del conjunto para mostrar información del creador
  const {
    data: usersData,
    isLoading: usersLoading,
  } = useQuery<{ data: User[]; count: number }>({
    queryKey: ["users", report?.conjunto_id],
    queryFn: async () => {
      if (!user || !report?.conjunto_id) throw new Error("No hay conjunto asignado");
      const token = await user.getIdToken();
      return await usersApiService.getUsersByConjunto(report.conjunto_id, token);
    },
    enabled: !!user && !!report?.conjunto_id && !isSuperAdmin,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Crear mapa de usuarios por ID para mostrar información del creador
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    const allUsers = usersData?.data || [];
    allUsers.forEach((u) => {
      map.set(u.id, u);
      if (u.auth_id && u.auth_id !== u.id) {
        map.set(u.auth_id, u);
      }
    });
    return map;
  }, [usersData?.data]);

  // Mutación para actualizar el estado del reporte
  const updateReportMutation = useMutation({
    mutationFn: async ({ estado }: { estado: ReportStatus }) => {
      if (!user || !reportId) throw new Error("Usuario no autenticado o ID inválido");
      const token = await user.getIdToken();
      return await reportsApiService.updateReport(reportId, { estado }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      queryClient.invalidateQueries({ queryKey: ["reports", user?.uid] });
      toast.success("Estado del reporte actualizado correctamente");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el reporte";
      toast.error(errorMessage);
    },
  });

  // Mutación para agregar comentario
  const addCommentMutation = useMutation({
    mutationFn: async ({ contenido, esInterno }: { contenido: string; esInterno: boolean }) => {
      if (!user || !reportId) throw new Error("Usuario no autenticado o ID inválido");
      const token = await user.getIdToken();
      return await reportsApiService.addComment(reportId, contenido, esInterno, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      setNuevoComentario("");
      setEsInterno(false);
      toast.success("Comentario agregado exitosamente");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al agregar el comentario";
      toast.error(errorMessage);
    },
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoComentario.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    await addCommentMutation.mutateAsync({
      contenido: nuevoComentario.trim(),
      esInterno,
    });
  };

  const formatDate = (dateValue: Date | string | null | undefined): string => {
    if (!dateValue) return "Sin fecha";
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return format(date, "PPp", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  const getStatusIcon = (estado: ReportWithDetails["estado"]) => {
    switch (estado) {
      case "abierto":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case "en_progreso":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "resuelto":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "cerrado":
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (estado: ReportWithDetails["estado"]) => {
    switch (estado) {
      case "abierto":
        return "Abierto";
      case "en_progreso":
        return "En Progreso";
      case "resuelto":
        return "Resuelto";
      case "cerrado":
        return "Cerrado";
    }
  };

  const getCategoryLabel = (categoria: ReportWithDetails["categoria"]) => {
    switch (categoria) {
      case "infraestructura":
        return "Infraestructura";
      case "seguridad":
        return "Seguridad";
      case "aseo":
        return "Aseo";
      case "convivencia":
        return "Convivencia";
      case "otro":
        return "Otro";
    }
  };

  const canAddComments = isAdmin || isSuperAdmin || userData?.id === report?.usuario_id;
  const canManage = isAdmin || isSuperAdmin;

  // Buscar el creador del reporte
  const creator = report ? (usersMap.get(report.usuario_id) || 
    Array.from(usersMap.values()).find((u) => {
      const user = u as User;
      return user.id === report.usuario_id || user.auth_id === report.usuario_id;
    })) : undefined;

  // Obtener iniciales del nombre para avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (userLoading || reportLoading || (usersLoading && !isSuperAdmin && report)) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    );
  }

  if (reportError || !report) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background p-4 md:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Reporte no encontrado</h1>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="text-lg font-medium mb-2">No se pudo cargar el reporte</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {reportError instanceof Error ? reportError.message : "El reporte no existe o no tienes permisos para verlo"}
                </p>
                <Button onClick={() => router.push("/dashboard")}>
                  Volver al Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        {/* Header sticky móvil */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
          <div className="px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="h-9 w-9 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">Detalle del Reporte</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  Información completa del reporte
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
            {/* Sección de Gestión para Administradores */}
            {canManage && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Settings className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Gestión del Reporte
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Cambia el estado del reporte para gestionar su ciclo de vida
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="estado" className="text-sm font-semibold mb-2 block">
                        Estado del Reporte
                      </Label>
                      <Select
                        id="estado"
                        value={report.estado}
                        onChange={(e) => {
                          const newEstado = e.target.value as ReportStatus;
                          if (newEstado !== report.estado) {
                            updateReportMutation.mutate({ estado: newEstado });
                          }
                        }}
                        disabled={updateReportMutation.isPending}
                      >
                        <option value="abierto">Abierto</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(report.estado)}
                      <span className="font-medium">{getStatusLabel(report.estado)}</span>
                    </div>
                  </div>
                  {updateReportMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando estado...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Información del Creador */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
                  Creador del Reporte
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/90 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-primary/20">
                    {creator ? (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold text-base md:text-lg">
                        {getInitials(creator.nombre)}
                      </div>
                    ) : report.es_anonimo ? (
                      <UserIcon className="h-6 w-6 md:h-8 md:w-8 text-white/80" />
                    ) : (
                      <UserIcon className="h-6 w-6 md:h-8 md:w-8 text-white/80" />
                    )}
                  </div>
                  
                  {/* Información del creador */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base md:text-lg text-foreground">
                        {creator ? creator.nombre : report.es_anonimo ? "Anónimo" : "Usuario"}
                      </p>
                      {report.es_anonimo && (
                        <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                          Anónimo
                        </span>
                      )}
                    </div>
                    {creator && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {creator.email}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Creado el {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hero Section: Imagen principal, título y descripción */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Imagen principal del reporte (primera foto si existe) */}
                {report.fotos && report.fotos.length > 0 ? (
                  <div className="relative w-full h-64 md:h-80 lg:h-96 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.fotos[0].url}
                      alt={report.titulo}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay con información básica */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-2 wrap-break-word drop-shadow-lg">
                            {report.titulo}
                          </h1>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs md:text-sm px-2.5 py-1 bg-background/90 backdrop-blur rounded-md whitespace-nowrap">
                              <Tag className="h-3 w-3 inline mr-1" />
                              {getCategoryLabel(report.categoria)}
                            </span>
                            <div className="flex items-center gap-2 text-sm md:text-base bg-background/90 backdrop-blur px-2.5 py-1 rounded-md">
                              {getStatusIcon(report.estado)}
                              <span className="font-medium">{getStatusLabel(report.estado)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Descripción en el overlay */}
                      <p className="text-sm md:text-base text-foreground/95 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-lg">
                        {report.descripcion}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Sin imagen: Layout normal */
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg md:text-2xl mb-3 wrap-break-word">{report.titulo}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] md:text-xs px-2 py-1 bg-muted rounded-md whitespace-nowrap">
                            <Tag className="h-3 w-3 inline mr-1" />
                            {getCategoryLabel(report.categoria)}
                          </span>
                          <div className="flex items-center gap-2 text-xs md:text-sm">
                            {getStatusIcon(report.estado)}
                            <span className="font-medium">{getStatusLabel(report.estado)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                )}
              </CardContent>
            </Card>

            {/* Información Adicional */}
            {report.fotos && report.fotos.length > 0 && (
              <Card>
                <CardContent className="p-4 md:p-6 space-y-5 md:space-y-6">
                  {/* Descripción completa (si hay imagen, ya se mostró un preview arriba) */}
                  <div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Descripción Completa</h3>
                    <p className="text-sm md:text-base text-foreground/80 whitespace-pre-wrap leading-relaxed">{report.descripcion}</p>
                  </div>

                  {/* Información Adicional */}
                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium">Ubicación</p>
                        <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{report.ubicacion}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium">Fecha de Creación</p>
                        <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{formatDate(report.created_at)}</p>
                      </div>
                    </div>
                    {report.updated_at && (
                      <div className="flex items-start gap-2.5">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-medium">Última Actualización</p>
                          <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{formatDate(report.updated_at)}</p>
                        </div>
                      </div>
                    )}
                    {report.conjunto && (
                      <div className="flex items-start gap-2.5">
                        <Tag className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-medium">Conjunto</p>
                          <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{report.conjunto.nombre}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información adicional si NO hay fotos */}
            {(!report.fotos || report.fotos.length === 0) && (
              <Card>
                <CardContent className="p-4 md:p-6 space-y-5 md:space-y-6">
                  {/* Descripción completa */}
                  <div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Descripción</h3>
                    <p className="text-sm md:text-base text-foreground/80 whitespace-pre-wrap leading-relaxed">{report.descripcion}</p>
                  </div>

                  {/* Información Adicional */}
                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium">Ubicación</p>
                        <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{report.ubicacion}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium">Fecha de Creación</p>
                        <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{formatDate(report.created_at)}</p>
                      </div>
                    </div>
                    {report.updated_at && (
                      <div className="flex items-start gap-2.5">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-medium">Última Actualización</p>
                          <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{formatDate(report.updated_at)}</p>
                        </div>
                      </div>
                    )}
                    {report.conjunto && (
                      <div className="flex items-start gap-2.5">
                        <Tag className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-medium">Conjunto</p>
                          <p className="text-xs md:text-sm text-muted-foreground wrap-break-word">{report.conjunto.nombre}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fotos adicionales (si hay más de una) */}
            {report.fotos && report.fotos.length > 1 && (
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <ImageIcon className="h-4 w-4 md:h-5 md:w-5" />
                    Más Fotos ({report.fotos.length - 1})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {report.fotos.slice(1).map((foto) => (
                      <div 
                        key={foto.id} 
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-border active:scale-[0.98] transition-native cursor-pointer will-change-transform touch-manipulation group"
                        onClick={() => window.open(foto.url, '_blank')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            window.open(foto.url, '_blank');
                          }
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={foto.url}
                          alt={`Foto del reporte ${report.titulo}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comentarios */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                  Comentarios ({report.comentarios?.length || 0})
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {canAddComments
                    ? "Puedes agregar comentarios a este reporte"
                    : "Comentarios del reporte"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-5 md:space-y-6">
                {/* Formulario para agregar comentario */}
                {canAddComments && (
                  <form onSubmit={handleAddComment} className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-2">
                      <Label htmlFor="comentario" className="text-sm font-semibold">Nuevo Comentario</Label>
                      <Textarea
                        id="comentario"
                        placeholder="Escribe tu comentario aquí. Puedes agregar actualizaciones, preguntas o información relevante..."
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        rows={5}
                      />
                    </div>
                    {(isAdmin || isSuperAdmin) && (
                      <div className="flex items-start space-x-3 p-3 rounded-md bg-background/80 border border-border/50">
                        <input
                          type="checkbox"
                          id="interno"
                          checked={esInterno}
                          onChange={(e) => setEsInterno(e.target.checked)}
                          className="h-4 w-4 rounded border-input cursor-pointer mt-0.5 shrink-0 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                        <Label
                          htmlFor="interno"
                          className="text-sm font-normal cursor-pointer leading-relaxed flex-1"
                        >
                          <span className="font-medium">Comentario interno</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            Solo visible para administradores
                          </span>
                        </Label>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={addCommentMutation.isPending || !nuevoComentario.trim()}
                      className="w-full md:w-auto h-11 md:h-10 font-semibold"
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Agregar Comentario"
                      )}
                    </Button>
                  </form>
                )}

                {/* Lista de comentarios */}
                {report.comentarios && report.comentarios.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {report.comentarios.map((comentario) => (
                      <Card 
                        key={comentario.id} 
                        className={comentario.es_interno ? "border-yellow-500/50 bg-yellow-500/5" : ""}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-medium">
                                {comentario.es_interno ? (
                                  <span className="flex items-center gap-2">
                                    <Lock className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                    <span>Comentario Interno</span>
                                  </span>
                                ) : (
                                  "Comentario"
                                )}
                              </p>
                              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                {formatDate(comentario.created_at)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed wrap-break-word">{comentario.contenido}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                    <p className="text-sm md:text-base">No hay comentarios aún</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default ReporteDetailPage;

