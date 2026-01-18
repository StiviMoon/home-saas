"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUser } from "@/lib/hooks/use-user";
import { reportsApiService } from "@/lib/services/reports-api.service";
import { conjuntosApiService } from "@/lib/services/conjuntos-api.service";
import { usersApiService } from "@/lib/services/users-api.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2, Plus, FileText, AlertCircle, CheckCircle2, Clock, XCircle, Building2, Home, MapPin, Calendar, Users, User as UserIcon, LogOut, Settings2, Key, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Report } from "@/lib/types/report";
import type { Conjunto } from "@/lib/types/conjunto";
import type { User } from "@/lib/types/user";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { user: userData, isLoading: userLoading, hasConjunto, isAdmin, isSuperAdmin } = useUser();
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);

  // Redirigir si no tiene conjunto (excepto super admins)
  // IMPORTANTE: Esperar a que userData esté cargado completamente antes de redirigir
  // Usar un flag para evitar redirecciones múltiples
  useEffect(() => {
    // Solo redirigir si los datos del usuario están cargados y NO es super admin
    // Asegurarse de que no hay redirecciones prematuras
    if (!userLoading && userData !== undefined) {
      // Si no es super admin y no tiene conjunto, redirigir a selección de conjunto
      // Solo redirigir si realmente no tiene conjunto (no si está en proceso de carga)
      if (userData && !isSuperAdmin && !hasConjunto) {
        router.push("/select-conjunto");
      }
    }
    // Si aún está cargando o userData es undefined/null, no hacer nada (mostrar loader)
  }, [userLoading, userData, hasConjunto, isSuperAdmin, router]);

  // Obtener conjunto del usuario
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
    enabled: !!user && !!userData?.conjunto_id && !isSuperAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Obtener usuarios del conjunto para mostrar información del creador
  const {
    data: usersData,
    isLoading: usersLoading,
  } = useQuery<{ data: User[]; count: number }>({
    queryKey: ["users", userData?.conjunto_id],
    queryFn: async () => {
      if (!user || !userData?.conjunto_id) throw new Error("No hay conjunto asignado");
      const token = await user.getIdToken();
      return await usersApiService.getUsersByConjunto(userData.conjunto_id, token);
    },
    enabled: !!user && !!userData?.conjunto_id && !isSuperAdmin,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Obtener reportes
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery<{ data: Report[]; count: number }>({
    queryKey: ["reports", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await reportsApiService.getReports(token);
    },
    enabled: !!user && (hasConjunto || isSuperAdmin),
    staleTime: 30 * 1000, // 30 segundos
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

  const reports = reportsData?.data || [];
  const reportsCount = reportsData?.count || 0;

  // Estadísticas
  const stats = {
    total: reportsCount,
    abiertos: reports.filter((r) => r.estado === "abierto").length,
    en_progreso: reports.filter((r) => r.estado === "en_progreso").length,
    resueltos: reports.filter((r) => r.estado === "resuelto").length,
    cerrados: reports.filter((r) => r.estado === "cerrado").length,
  };

  const getStatusIcon = (estado: Report["estado"]) => {
    switch (estado) {
      case "abierto":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "en_progreso":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resuelto":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "cerrado":
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (estado: Report["estado"]) => {
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

  const formatDate = (dateValue: Date | string | null | undefined): string => {
    if (!dateValue) return "Sin fecha";
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return format(date, "PP", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  // Mostrar loader mientras se cargan los datos del usuario
  // IMPORTANTE: Esperar a que userData esté completamente cargado antes de verificar conjunto
  if (userLoading || !userData) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    );
  }
  
  // Solo redirigir si NO es super admin y NO tiene conjunto DESPUÉS de que los datos se carguen
  // Esta verificación adicional evita redirecciones prematuras
  if (!isSuperAdmin && !hasConjunto && userData) {
    // Mostrar loader mientras redirige (el useEffect maneja la redirección)
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen pb-20 md:pb-8">
        {/* Header móvil sticky */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/80 border-b border-border/50 shadow-sm">
          <div className="px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Título y subtítulo */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">
                  {isSuperAdmin ? "Dashboard" : isAdmin ? "Dashboard" : "Mis Reportes"}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {isSuperAdmin
                    ? "Todos los reportes del sistema"
                    : isAdmin
                    ? "Gestiona los reportes"
                    : "Gestiona tus reportes"}
                </p>
              </div>
              
              {/* Acciones - mejor organizadas */}
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {/* Botones de administración */}
                {isSuperAdmin && (
                  <Button 
                    onClick={() => router.push("/admin")} 
                    size="sm"
                    className="gap-1.5 md:gap-2 px-2.5 md:px-3 h-9 md:h-10"
                    variant="outline"
                    aria-label="Panel de administración"
                  >
                    <Settings2 className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    <span className="hidden lg:inline text-xs md:text-sm">Panel Admin</span>
                  </Button>
                )}
                {isAdmin && !isSuperAdmin && (
                  <Button 
                    onClick={() => router.push("/dashboard/admin-conjunto")} 
                    size="sm"
                    className="gap-1.5 md:gap-2 px-2.5 md:px-3 h-9 md:h-10"
                    variant="outline"
                    aria-label="Gestionar conjunto"
                  >
                    <Users className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    <span className="hidden lg:inline text-xs md:text-sm">Gestionar</span>
                  </Button>
                )}
                
                {/* Botón cerrar sesión - con icono diferente */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    toast.info("Cerrando sesión...");
                    await logout();
                  }}
                  className="h-9 w-9 md:h-10 md:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="sr-only">Cerrar sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
          {/* Información del conjunto y unidad - móvil compacto */}
          {!isSuperAdmin && userData?.conjunto_id && (
            <Card>
              <CardContent className="p-3 md:p-4">
                {conjuntoLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conjuntoData ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Conjunto</p>
                        <p className="text-sm md:text-base font-semibold truncate">{conjuntoData.nombre}</p>
                      </div>
                    </div>
                    {userData.unidad && (
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Unidad</p>
                          <p className="text-sm md:text-base font-semibold">{userData.unidad}</p>
                        </div>
                      </div>
                    )}
                    {isAdmin && conjuntoData.codigo_acceso && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Código de Acceso</p>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Key className="h-4 w-4 text-primary shrink-0" />
                          <code className="flex-1 text-sm md:text-base font-mono font-semibold text-primary">
                            {conjuntoData.codigo_acceso}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(conjuntoData.codigo_acceso);
                                setCopiedCode(true);
                                toast.success("Código copiado al portapapeles");
                                setTimeout(() => setCopiedCode(false), 2000);
                              } catch {
                                toast.error("Error al copiar el código");
                              }
                            }}
                            aria-label="Copiar código de acceso"
                          >
                            {copiedCode ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5">
                          Comparte este código con los residentes para que se unan al conjunto
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {conjuntoData.direccion}, {conjuntoData.ciudad}
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Estadísticas - Scroll horizontal en móvil */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 min-w-max md:min-w-0">
              <Card className="min-w-[140px] md:min-w-0 shrink-0 md:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Total</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Reportes</p>
                </CardContent>
              </Card>
              <Card className="min-w-[140px] md:min-w-0 shrink-0 md:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Abiertos</CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold">{stats.abiertos}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Pendientes</p>
                </CardContent>
              </Card>
              <Card className="min-w-[140px] md:min-w-0 shrink-0 md:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium">En Progreso</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold">{stats.en_progreso}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">En proceso</p>
                </CardContent>
              </Card>
              <Card className="min-w-[140px] md:min-w-0 shrink-0 md:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Resueltos</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold">{stats.resueltos}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Completados</p>
                </CardContent>
              </Card>
              <Card className="min-w-[140px] md:min-w-0 shrink-0 md:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Cerrados</CardTitle>
                  <XCircle className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold">{stats.cerrados}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Finalizados</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Reportes */}
          <div>
            <div className="mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold">Reportes</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {isSuperAdmin
                  ? "Todos los reportes del sistema"
                  : isAdmin
                  ? "Reportes de tu conjunto residencial"
                  : "Reportes de tu conjunto residencial"}
              </p>
            </div>
            
            {(reportsLoading || (usersLoading && !isSuperAdmin && hasConjunto)) ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reportsError ? (
              <Card>
                <CardContent className="p-8 text-center text-destructive">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error al cargar los reportes</p>
                </CardContent>
              </Card>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="p-8 md:p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base md:text-lg font-medium mb-2">
                    {isSuperAdmin
                      ? "No hay reportes en el sistema"
                      : isAdmin
                      ? "No hay reportes en tu conjunto"
                      : "No tienes reportes activos"}
                  </p>
                  {!isAdmin && !isSuperAdmin && (
                    <Button
                      onClick={() => router.push("/dashboard/nuevo")}
                      className="mt-4"
                      size="lg"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear tu primer reporte
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {reports.map((report) => {
                  // Buscar el creador del reporte
                  const creator = usersMap.get(report.usuario_id) || 
                                 Array.from(usersMap.values()).find((u: User) => 
                                   u.id === report.usuario_id || u.auth_id === report.usuario_id
                                 );
                  
                  // Obtener iniciales del nombre para avatar
                  const getInitials = (name: string) => {
                    return name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                  };

                  return (
                    <Card
                      key={report.id}
                      className="cursor-pointer active:scale-[0.98] transition-native hover:shadow-md overflow-hidden will-change-transform"
                      onClick={() => router.push(`/dashboard/reportes/${report.id}`)}
                    >
                      <CardContent className="p-0">
                        {/* Header estilo Instagram - Avatar y nombre del creador */}
                        <div className="p-3 md:p-4 pb-2 md:pb-3 border-b">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/90 flex items-center justify-center shrink-0 overflow-hidden">
                              {creator ? (
                                <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm md:text-base">
                                  {getInitials(creator.nombre)}
                                </div>
                              ) : report.es_anonimo ? (
                                <UserIcon className="h-5 w-5 md:h-6 md:w-6 text-white/80" />
                              ) : (
                                <UserIcon className="h-5 w-5 md:h-6 md:w-6 text-white/80" />
                              )}
                            </div>
                            
                            {/* Información del creador */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm md:text-base text-foreground">
                                  {creator ? creator.nombre : report.es_anonimo ? "Anónimo" : "Usuario"}
                                </p>
                                {report.es_anonimo && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                    Anónimo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {formatDate(report.created_at)}
                              </p>
                            </div>

                            {/* Estado */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {getStatusIcon(report.estado)}
                              <span className="text-xs font-medium text-muted-foreground hidden md:inline">
                                {getStatusLabel(report.estado)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Imagen principal */}
                        {report.primera_foto && (
                          <div className="relative w-full h-64 md:h-80 lg:h-96 bg-muted overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={report.primera_foto.url}
                              alt={report.titulo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Contenido */}
                        <div className="p-3 md:p-4 space-y-3">
                          {/* Categoría y estado (si no hay imagen, mostrar aquí también) */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] md:text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                              {getCategoryLabel(report.categoria)}
                            </span>
                            {!report.primera_foto && (
                              <div className="flex items-center gap-1.5 text-[10px] md:text-xs">
                                {getStatusIcon(report.estado)}
                                <span className="font-medium text-muted-foreground">
                                  {getStatusLabel(report.estado)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Título y descripción */}
                          <div className="space-y-2">
                            <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-2">
                              {report.titulo}
                            </h3>
                            <p className="text-sm md:text-base text-foreground/80 line-clamp-3 leading-relaxed">
                              {report.descripcion}
                            </p>
                          </div>

                          {/* Metadata footer */}
                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{report.ubicacion}</span>
                            </span>
                            {report.primera_foto && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {formatDate(report.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB) para móvil */}
        {!isAdmin && !isSuperAdmin && (
          <Button
            onClick={() => router.push("/dashboard/nuevo")}
            size="lg"
            className="fixed bottom-20 right-4 md:hidden h-14 w-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-native z-50 will-change-transform touch-manipulation"
            aria-label="Nuevo reporte"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Nuevo reporte</span>
          </Button>
        )}
      </div>
    </AuthGuard>
  );
};

export default DashboardPage;

