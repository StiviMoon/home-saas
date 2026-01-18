"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUser } from "@/lib/hooks/use-user";
import { usersApiService } from "@/lib/services/users-api.service";
import { conjuntosApiService } from "@/lib/services/conjuntos-api.service";
import { reportsApiService } from "@/lib/services/reports-api.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2, ArrowLeft, Building2, Users, Home, Mail, User as UserIcon, FileText, AlertCircle, CheckCircle2, Clock, XCircle, MapPin, Calendar, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/lib/types/user";
import type { Conjunto } from "@/lib/types/conjunto";
import type { Report, ReportStatus } from "@/lib/types/report";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const AdminConjuntoPage = () => {
  const { user } = useAuth();
  const { user: userData, isLoading: userLoading, isAdmin, hasConjunto } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Redirigir si no es admin o no tiene conjunto
  useEffect(() => {
    if (!userLoading && (!isAdmin || !hasConjunto)) {
      router.push("/dashboard");
    }
  }, [userLoading, isAdmin, hasConjunto, router]);

  // Obtener información del conjunto
  const {
    data: conjuntoData,
    isLoading: conjuntoLoading,
  } = useQuery<Conjunto>({
    queryKey: ["conjunto", userData?.conjunto_id],
    queryFn: async () => {
      if (!user || !userData?.conjunto_id) throw new Error("No hay conjunto asignado");
      const token = await user.getIdToken();
      return await conjuntosApiService.getConjuntoById(userData.conjunto_id, token);
    },
    enabled: !!user && !!userData?.conjunto_id && isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Obtener residentes del conjunto
  const {
    data: residentsData,
    isLoading: residentsLoading,
    error: residentsError,
  } = useQuery<{ data: User[]; count: number }>({
    queryKey: ["residents", userData?.conjunto_id],
    queryFn: async () => {
      if (!user || !userData?.conjunto_id) throw new Error("No hay conjunto asignado");
      const token = await user.getIdToken();
      return await usersApiService.getUsersByConjunto(userData.conjunto_id, token);
    },
    enabled: !!user && !!userData?.conjunto_id && isAdmin,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Obtener reportes del conjunto
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery<{ data: Report[]; count: number }>({
    queryKey: ["reports", user?.uid, userData?.conjunto_id],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await reportsApiService.getReports(token);
    },
    enabled: !!user && !!userData?.conjunto_id && isAdmin,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Crear mapa de usuarios por ID para mostrar información del creador
  // Incluir TODOS los usuarios del conjunto (no solo residentes filtrados)
  // Usar useMemo para recalcular solo cuando cambian los usuarios
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    const allUsers = residentsData?.data || [];
    
    // Mapear por id (que es igual a auth_id) y también por auth_id explícitamente para compatibilidad
    allUsers.forEach((u) => {
      // El id del usuario es el auth_id (según users.service.ts línea 47: id: userData.auth_id)
      map.set(u.id, u);
      // También mapear por auth_id explícitamente por si acaso
      if (u.auth_id && u.auth_id !== u.id) {
        map.set(u.auth_id, u);
      }
    });
    
    return map;
  }, [residentsData?.data]);

  // Mutation para actualizar el estado del reporte
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, estado }: { reportId: string; estado: ReportStatus }) => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await reportsApiService.updateReport(reportId, { estado }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", user?.uid, userData?.conjunto_id] });
      toast.success("Estado del reporte actualizado correctamente");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el reporte";
      toast.error(errorMessage);
    },
  });

  // Funciones helper para etiquetas
  const getStatusIcon = (estado: ReportStatus) => {
    switch (estado) {
      case "abierto":
        return <AlertCircle className="h-3 w-3 text-blue-500" />;
      case "en_progreso":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "resuelto":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "cerrado":
        return <XCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusLabel = (estado: ReportStatus) => {
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

  const getCategoryLabel = (categoria: Report["categoria"]) => {
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

  if (userLoading || !isAdmin || !hasConjunto) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    );
  }

  const residents = residentsData?.data || [];
  const reports = reportsData?.data || [];

  // Filtrar solo residentes (no admins) para la sección de residentes
  const onlyResidents = residents.filter((r) => r.rol === "residente");

  // Función para formatear fechas de forma segura
  const formatDate = (dateValue: Date | string | null | undefined | { toDate?: () => Date; seconds?: number }): string => {
    if (!dateValue) return "N/A";
    
    try {
      let date: Date;
      
      // Si es un string, intentar parsearlo
      if (typeof dateValue === "string") {
        date = new Date(dateValue);
      }
      // Si es un objeto Date
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Si tiene método toDate() (Firestore Timestamp)
      else if (typeof dateValue === "object" && "toDate" in dateValue && typeof dateValue.toDate === "function") {
        date = dateValue.toDate();
      }
      // Si tiene segundos (Firestore Timestamp como objeto)
      else if (typeof dateValue === "object" && "seconds" in dateValue && typeof dateValue.seconds === "number") {
        date = new Date(dateValue.seconds * 1000);
      }
      else {
        return "Formato desconocido";
      }
      
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return format(date, "PP", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateValue);
      return "Error al formatear";
    }
  };

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
                <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">
                  Panel de Administración
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  Gestiona residentes y reportes de tu conjunto
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
            {/* Información del conjunto */}
            {conjuntoData && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Conjunto Residencial</p>
                      <p className="text-lg md:text-2xl font-bold truncate">{conjuntoData.nombre}</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">
                        {conjuntoData.direccion}, {conjuntoData.ciudad}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                  <CardTitle className="text-sm font-medium">Total Residentes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="text-2xl md:text-3xl font-bold">{onlyResidents.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Residentes registrados</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                  <CardTitle className="text-sm font-medium">Con Unidad</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="text-2xl md:text-3xl font-bold">
                    {onlyResidents.filter((r) => r.unidad).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Con apartamento asignado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                  <CardTitle className="text-sm font-medium">Sin Unidad</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="text-2xl md:text-3xl font-bold">
                    {onlyResidents.filter((r) => !r.unidad).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pendientes de asignar</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Residentes */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Users className="h-4 w-4 md:h-5 md:w-5" />
                  Residentes del Conjunto ({onlyResidents.length})
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Lista de todos los residentes registrados en tu conjunto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6 pt-0">
                {residentsLoading || conjuntoLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : residentsError ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-destructive" />
                    <p className="text-base md:text-lg font-medium mb-2 text-destructive">
                      Error al cargar residentes
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(residentsError as Error).message || "No se pudieron cargar los residentes"}
                    </p>
                  </div>
                ) : onlyResidents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base md:text-lg font-medium mb-2">
                      No hay residentes registrados
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Los residentes se registrarán cuando ingresen el código del conjunto
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Vista de Cards para Móvil */}
                    <div className="md:hidden space-y-3 px-4 pb-4">
                      {onlyResidents.map((resident) => (
                        <Card key={resident.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <UserIcon className="h-5 w-5 text-primary shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm truncate">{resident.nombre}</p>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{resident.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2 border-t">
                              {resident.unidad ? (
                                <div className="flex items-center gap-1.5">
                                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-xs font-medium">{resident.unidad}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(resident.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Vista de Tabla para Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Nombre</TableHead>
                            <TableHead className="text-xs md:text-sm">Email</TableHead>
                            <TableHead className="text-xs md:text-sm">Unidad</TableHead>
                            <TableHead className="text-xs md:text-sm">Registrado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {onlyResidents.map((resident) => (
                            <TableRow key={resident.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="font-medium text-sm md:text-base">{resident.nombre}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-xs md:text-sm">{resident.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {resident.unidad ? (
                                  <div className="flex items-center gap-2">
                                    <Home className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="text-xs md:text-sm font-medium">{resident.unidad}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(resident.created_at)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lista de Reportes */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  Reportes del Conjunto ({reports.length})
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Gestiona y actualiza el estado de los reportes de tu conjunto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6 pt-0">
                {reportsLoading || residentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Cargando reportes y usuarios...</span>
                  </div>
                ) : reportsError ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-destructive" />
                    <p className="text-base md:text-lg font-medium mb-2 text-destructive">
                      Error al cargar reportes
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(reportsError as Error).message || "No se pudieron cargar los reportes"}
                    </p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base md:text-lg font-medium mb-2">
                      No hay reportes en tu conjunto
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Los residentes podrán crear reportes desde el dashboard
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Vista de Cards para Móvil */}
                    <div className="md:hidden space-y-3 px-4 pb-4">
                      {reports.map((report) => {
                          // Buscar el creador por usuario_id (que es el id del usuario en Firestore)
                          // El usuario_id en reportes es el id del usuario (que es igual a auth_id)
                          // Intentar múltiples formas de búsqueda para asegurar compatibilidad
                          let creator = usersMap.get(report.usuario_id);
                          
                          // Si no se encuentra, buscar por todos los campos posibles
                          if (!creator && usersMap.size > 0) {
                            creator = Array.from(usersMap.values()).find(u => 
                              u.id === report.usuario_id || 
                              u.auth_id === report.usuario_id
                            );
                          }
                          
                          // Debug temporal para ver qué está pasando
                          if (!creator && !report.es_anonimo) {
                            console.log("⚠️ No se encontró creador para reporte:", {
                              reportId: report.id,
                              reportTitulo: report.titulo,
                              reportUsuarioId: report.usuario_id,
                              usersMapSize: usersMap.size,
                              usuariosEnMapa: Array.from(usersMap.keys()),
                              todosLosUsuarios: Array.from(usersMap.values()).map(u => ({ id: u.id, auth_id: u.auth_id, nombre: u.nombre }))
                            });
                          }
                          
                          const isUpdating = updateReportMutation.isPending && 
                                             (updateReportMutation.variables?.reportId === report.id);
                          
                          return (
                            <Card key={report.id} className="p-4">
                              <div className="space-y-3">
                                {/* Header con título y estado */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{report.titulo}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{report.descripcion}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {getStatusIcon(report.estado)}
                                    <span className="text-xs font-medium">{getStatusLabel(report.estado)}</span>
                                  </div>
                                </div>
                                
                                {/* Info del creador */}
                                {creator ? (
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <UserIcon className="h-4 w-4 text-primary shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium">{creator.nombre}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{creator.email}</p>
                                    </div>
                                  </div>
                                ) : report.es_anonimo ? (
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-muted-foreground italic">Anónimo</span>
                                  </div>
                                ) : null}
                                
                                {/* Metadata */}
                                <div className="flex flex-wrap gap-3 pt-2 border-t">
                                  <div className="flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs">{getCategoryLabel(report.categoria)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs truncate max-w-[150px]">{report.ubicacion}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(report.created_at)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Selector de estado */}
                                <div className="pt-2 border-t">
                                  <Select
                                    value={report.estado}
                                    onChange={(e) => {
                                      const newEstado = e.target.value as ReportStatus;
                                      if (newEstado !== report.estado) {
                                        updateReportMutation.mutate({ reportId: report.id, estado: newEstado });
                                      }
                                    }}
                                    disabled={isUpdating}
                                    className="w-full h-9 text-xs"
                                  >
                                    <option value="abierto">Abierto</option>
                                    <option value="en_progreso">En Progreso</option>
                                    <option value="resuelto">Resuelto</option>
                                    <option value="cerrado">Cerrado</option>
                                  </Select>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                    </div>

                    {/* Vista de Tabla para Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Título</TableHead>
                            <TableHead className="text-xs md:text-sm">Creado por</TableHead>
                            <TableHead className="text-xs md:text-sm">Categoría</TableHead>
                            <TableHead className="text-xs md:text-sm">Ubicación</TableHead>
                            <TableHead className="text-xs md:text-sm">Fecha</TableHead>
                            <TableHead className="text-xs md:text-sm">Estado</TableHead>
                            <TableHead className="text-xs md:text-sm">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports.map((report) => {
                            // Buscar el creador por usuario_id (que es el id del usuario en Firestore)
                            // El usuario_id en reportes es el id del usuario (que es igual a auth_id)
                            // Intentar múltiples formas de búsqueda para asegurar compatibilidad
                            let creator = usersMap.get(report.usuario_id);
                            
                            // Si no se encuentra, buscar por todos los campos posibles
                            if (!creator && usersMap.size > 0) {
                              creator = Array.from(usersMap.values()).find(u => 
                                u.id === report.usuario_id || 
                                u.auth_id === report.usuario_id
                              );
                            }
                            
                            // Debug temporal para ver qué está pasando
                            if (!creator && !report.es_anonimo) {
                              console.log("⚠️ No se encontró creador para reporte:", {
                                reportId: report.id,
                                reportTitulo: report.titulo,
                                reportUsuarioId: report.usuario_id,
                                usersMapSize: usersMap.size,
                                usuariosEnMapa: Array.from(usersMap.keys()),
                                todosLosUsuarios: Array.from(usersMap.values()).map(u => ({ id: u.id, auth_id: u.auth_id, nombre: u.nombre }))
                              });
                            }
                            
                            const isUpdating = updateReportMutation.isPending && 
                                               (updateReportMutation.variables?.reportId === report.id);
                            
                            return (
                              <TableRow key={report.id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-sm md:text-base line-clamp-2">
                                    {report.titulo}
                                  </span>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {report.descripcion}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {creator ? (
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="text-xs md:text-sm font-medium">{creator.nombre}</span>
                                      <span className="text-[10px] text-muted-foreground">{creator.email}</span>
                                    </div>
                                  </div>
                                ) : report.es_anonimo ? (
                                  <span className="text-xs text-muted-foreground italic">Anónimo</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Usuario no encontrado</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-xs md:text-sm">{getCategoryLabel(report.categoria)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-xs md:text-sm truncate max-w-[120px]">{report.ubicacion}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(report.created_at)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-xs">
                                  {getStatusIcon(report.estado)}
                                  <span className="font-medium">{getStatusLabel(report.estado)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={report.estado}
                                  onChange={(e) => {
                                    const newEstado = e.target.value as ReportStatus;
                                    if (newEstado !== report.estado) {
                                      updateReportMutation.mutate({ reportId: report.id, estado: newEstado });
                                    }
                                  }}
                                  disabled={isUpdating}
                                  className="min-w-[140px] h-9 text-xs"
                                >
                                  <option value="abierto">Abierto</option>
                                  <option value="en_progreso">En Progreso</option>
                                  <option value="resuelto">Resuelto</option>
                                  <option value="cerrado">Cerrado</option>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminConjuntoPage;

