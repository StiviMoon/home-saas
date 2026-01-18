"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { conjuntosApiService } from "@/lib/services/conjuntos-api.service";
import { usersApiService } from "@/lib/services/users-api.service";
import { reportsApiService } from "@/lib/services/reports-api.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2, Plus, Building2, Users, Key, Mail, UserCog, BarChart3, FileText, AlertCircle, CheckCircle2, Clock, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Conjunto, CreateConjuntoData } from "@/lib/types/conjunto";
import type { User } from "@/lib/types/user";

const AdminPage = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isLoading: userLoading } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Estados para crear conjunto
  const [newConjunto, setNewConjunto] = useState<CreateConjuntoData>({
    nombre: "",
    direccion: "",
    ciudad: "",
    codigo_acceso: "",
  });
  const [isCreatingConjunto, setIsCreatingConjunto] = useState(false);
  const [showCreateConjunto, setShowCreateConjunto] = useState(false);

  // Estados para asignar admin
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedConjuntoId, setSelectedConjuntoId] = useState("");
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
  const [showAssignAdmin, setShowAssignAdmin] = useState(false);

  // Estados para eliminar usuario
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Obtener todos los conjuntos
  const {
    data: conjuntosData,
    isLoading: conjuntosLoading,
  } = useQuery<Conjunto[]>({
    queryKey: ["conjuntos"],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      const response = await conjuntosApiService.getAllConjuntos(token);
      return response;
    },
    enabled: !!user && isSuperAdmin,
  });

  // Obtener todos los usuarios
  const {
    data: usersData,
    isLoading: usersLoading,
  } = useQuery<{ data: User[]; count: number }>({
    queryKey: ["all-users"],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await usersApiService.getAllUsers(token);
    },
    enabled: !!user && isSuperAdmin,
  });

  // Obtener estadísticas de reportes
  const {
    data: statisticsData,
  } = useQuery({
    queryKey: ["reports-statistics"],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await reportsApiService.getStatistics(token);
    },
    enabled: !!user && isSuperAdmin,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Mutación para crear conjunto
  const createConjuntoMutation = useMutation({
    mutationFn: async (conjuntoData: CreateConjuntoData) => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await conjuntosApiService.createConjunto(conjuntoData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conjuntos"] });
      setShowCreateConjunto(false);
      setNewConjunto({ nombre: "", direccion: "", ciudad: "", codigo_acceso: "" });
      toast.success("Conjunto creado exitosamente");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al crear conjunto";
      toast.error(errorMessage);
    },
  });

  // Mutación para asignar admin
  const assignAdminMutation = useMutation({
    mutationFn: async ({ email, conjuntoId }: { email: string; conjuntoId: string }) => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await usersApiService.assignAdminRole(email, conjuntoId, token);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      const conjuntoNombre = conjuntosData?.find(c => c.id === selectedConjuntoId)?.nombre || "conjunto";
      const email = adminEmail; // Guardar antes de limpiar
      setShowAssignAdmin(false);
      setAdminEmail("");
      setSelectedConjuntoId("");
      
      // Mostrar mensaje detallado con los cambios
      let description = "";
      
      if (data.cambios && data.cambios.length > 0) {
        description += "Cambios realizados:\n";
        data.cambios.forEach((cambio) => {
          description += `• ${cambio}\n`;
        });
        
        if (data.estado_anterior) {
          description += `\nEstado anterior:\n• Rol: ${data.estado_anterior.rol}\n• Conjunto: ${data.estado_anterior.conjunto_id || "Sin conjunto"}\n• Unidad: ${data.estado_anterior.unidad || "Sin asignar"}\n`;
        }
        
        if (data.estado_nuevo) {
          description += `\nEstado nuevo:\n• Rol: ${data.estado_nuevo.rol}\n• Conjunto: ${data.estado_nuevo.conjunto_id || "Sin conjunto"}\n• Unidad: ${data.estado_nuevo.unidad || "Sin asignar"}`;
        }
      }
      
      toast.success(`¡Rol de administrador asignado! ${email} ahora es admin de ${conjuntoNombre}`, {
        description: description || undefined,
        duration: 8000,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al asignar rol de admin";
      toast.error(errorMessage);
    },
  });

  // Mutación para eliminar usuario
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await usersApiService.deleteUser(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Usuario eliminado correctamente");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar usuario";
      toast.error(errorMessage);
    },
  });

  const handleCreateConjunto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingConjunto(true);
    try {
      await createConjuntoMutation.mutateAsync(newConjunto);
    } finally {
      setIsCreatingConjunto(false);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !selectedConjuntoId) {
      toast.error("Por favor, completa todos los campos");
      return;
    }
    setIsAssigningAdmin(true);
    try {
      await assignAdminMutation.mutateAsync({
        email: adminEmail,
        conjuntoId: selectedConjuntoId,
      });
    } finally {
      setIsAssigningAdmin(false);
    }
  };

  // Redirigir si no es super admin (después de cargar)
  useEffect(() => {
    if (!userLoading && !isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [userLoading, isSuperAdmin, router]);

  // Mostrar loader mientras se verifica el rol
  if (userLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const conjuntos = conjuntosData || [];
  const users = usersData?.data || [];
  const statistics = statisticsData;
  
  // Calcular estadísticas de usuarios
  const usersStats = {
    total: users.length,
    super_admins: users.filter((u) => u.rol === "super_admin").length,
    admins: users.filter((u) => u.rol === "admin").length,
    residentes: users.filter((u) => u.rol === "residente").length,
    con_conjunto: users.filter((u) => u.conjunto_id).length,
    sin_conjunto: users.filter((u) => !u.conjunto_id).length,
  };

  const getCategoryLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      infraestructura: "Infraestructura",
      seguridad: "Seguridad",
      aseo: "Aseo",
      convivencia: "Convivencia",
      otro: "Otro",
    };
    return labels[categoria] || categoria;
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen p-3 md:p-8">
        <div className="mx-auto max-w-7xl space-y-4 md:space-y-8">
          {/* Header */}
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-3xl font-bold tracking-tight flex items-center gap-1.5 md:gap-2">
                <UserCog className="h-4 w-4 md:h-8 md:w-8 shrink-0" />
                <span className="truncate">Panel de Super Administrador</span>
              </h1>
              <p className="text-[10px] md:text-base text-muted-foreground mt-0.5 md:mt-2 line-clamp-2">
                Gestiona conjuntos residenciales, usuarios y visualiza estadísticas generales
              </p>
            </div>
            <Button 
              onClick={() => router.push("/dashboard")} 
              variant="outline" 
              size="sm"
              className="text-[10px] md:text-base h-8 md:h-10 px-3 md:px-4 w-full md:w-auto shrink-0"
            >
              Volver al Dashboard
            </Button>
          </div>

          {/* Estadísticas Generales */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                  <CardTitle className="text-[10px] md:text-sm font-medium leading-tight">Total Reportes</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-0">
                  <div className="text-lg md:text-2xl font-bold">{statistics.total}</div>
                  <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Todos los reportes</p>
                </CardContent>
              </Card>
              <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                  <CardTitle className="text-[10px] md:text-sm font-medium leading-tight">Abiertos</CardTitle>
                  <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-0">
                  <div className="text-lg md:text-2xl font-bold">{statistics.por_estado.abierto.cantidad}</div>
                  <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    {statistics.por_estado.abierto.porcentaje}% del total
                  </p>
                </CardContent>
              </Card>
              <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                  <CardTitle className="text-[10px] md:text-sm font-medium leading-tight">En Progreso</CardTitle>
                  <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-0">
                  <div className="text-lg md:text-2xl font-bold">{statistics.por_estado.en_progreso.cantidad}</div>
                  <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    {statistics.por_estado.en_progreso.porcentaje}% del total
                  </p>
                </CardContent>
              </Card>
              <Card className="p-2 md:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                  <CardTitle className="text-[10px] md:text-sm font-medium leading-tight">Resueltos/Cerrados</CardTitle>
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-0 pt-1 md:pt-0">
                  <div className="text-lg md:text-2xl font-bold">
                    {statistics.por_estado.resuelto.cantidad + statistics.por_estado.cerrado.cantidad}
                  </div>
                  <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    {Math.round(
                      ((statistics.por_estado.resuelto.cantidad + statistics.por_estado.cerrado.cantidad) /
                        statistics.total) *
                        100 *
                        100
                    ) / 100}
                    % del total
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Estadísticas por Categoría */}
          {statistics && statistics.total > 0 && (
            <Card className="p-3 md:p-6">
              <CardHeader className="p-0 pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-xl">
                  <BarChart3 className="h-3.5 w-3.5 md:h-5 md:w-5 shrink-0" />
                  <span>Estadísticas por Categoría</span>
                </CardTitle>
                <CardDescription className="text-[10px] md:text-sm mt-1">Distribución porcentual de reportes por categoría</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3 md:space-y-4">
                  {Object.entries(statistics.por_categoria).map(([categoria, data]) => {
                    const categoryData = data as { cantidad: number; porcentaje: number };
                    return (
                      <div key={categoria}>
                        <div className="flex items-center justify-between mb-1.5 md:mb-2">
                          <span className="text-xs md:text-sm font-medium">{getCategoryLabel(categoria)}</span>
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {categoryData.cantidad} ({categoryData.porcentaje}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 md:h-2">
                          <div
                            className="bg-primary h-1.5 md:h-2 rounded-full transition-all"
                            style={{ width: `${categoryData.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas de Usuarios */}
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
            <Card className="p-2 md:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                <CardTitle className="text-[9px] md:text-xs font-medium leading-tight">Total Usuarios</CardTitle>
                <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="p-0 pt-1 md:pt-0">
                <div className="text-base md:text-2xl font-bold">{usersStats.total}</div>
              </CardContent>
            </Card>
            <Card className="p-2 md:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                <CardTitle className="text-[9px] md:text-xs font-medium leading-tight">Super Admins</CardTitle>
                <UserCog className="h-3 w-3 md:h-4 md:w-4 text-purple-500 shrink-0" />
              </CardHeader>
              <CardContent className="p-0 pt-1 md:pt-0">
                <div className="text-base md:text-2xl font-bold">{usersStats.super_admins}</div>
              </CardContent>
            </Card>
            <Card className="p-2 md:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                <CardTitle className="text-[9px] md:text-xs font-medium leading-tight">Admins</CardTitle>
                <UserCog className="h-3 w-3 md:h-4 md:w-4 text-blue-500 shrink-0" />
              </CardHeader>
              <CardContent className="p-0 pt-1 md:pt-0">
                <div className="text-base md:text-2xl font-bold">{usersStats.admins}</div>
              </CardContent>
            </Card>
            <Card className="p-2 md:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                <CardTitle className="text-[9px] md:text-xs font-medium leading-tight">Residentes</CardTitle>
                <Users className="h-3 w-3 md:h-4 md:w-4 text-gray-500 shrink-0" />
              </CardHeader>
              <CardContent className="p-0 pt-1 md:pt-0">
                <div className="text-base md:text-2xl font-bold">{usersStats.residentes}</div>
              </CardContent>
            </Card>
            <Card className="p-2 md:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0">
                <CardTitle className="text-[9px] md:text-xs font-medium leading-tight">Con Conjunto</CardTitle>
                <Building2 className="h-3 w-3 md:h-4 md:w-4 text-green-500 shrink-0" />
              </CardHeader>
              <CardContent className="p-0 pt-1 md:pt-0">
                <div className="text-base md:text-2xl font-bold">{usersStats.con_conjunto}</div>
              </CardContent>
            </Card>
          </div>

          {/* Sección de Conjuntos */}
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-6">
              <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-lg">
                    <Building2 className="h-3.5 w-3.5 md:h-5 md:w-5 shrink-0" />
                    <span className="truncate">Conjuntos Residenciales</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-sm mt-0.5 md:mt-1">
                    Crea y gestiona conjuntos residenciales
                  </CardDescription>
                </div>
                <Dialog open={showCreateConjunto} onOpenChange={setShowCreateConjunto}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 text-xs md:text-sm px-3 md:px-4">
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Crear Conjunto</span>
                      <span className="sm:hidden">Crear</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Conjunto</DialogTitle>
                      <DialogDescription>
                        Completa la información del conjunto residencial
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateConjunto} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Conjunto</Label>
                        <Input
                          id="nombre"
                          value={newConjunto.nombre}
                          onChange={(e) =>
                            setNewConjunto({ ...newConjunto, nombre: e.target.value })
                          }
                          required
                          placeholder="Ej: Conjunto Residencial Los Pinos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                          id="direccion"
                          value={newConjunto.direccion}
                          onChange={(e) =>
                            setNewConjunto({ ...newConjunto, direccion: e.target.value })
                          }
                          required
                          placeholder="Ej: Calle 123 #45-67"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ciudad">Ciudad</Label>
                        <Input
                          id="ciudad"
                          value={newConjunto.ciudad}
                          onChange={(e) =>
                            setNewConjunto({ ...newConjunto, ciudad: e.target.value })
                          }
                          required
                          placeholder="Ej: Bogotá"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigo_acceso">
                          Código de Acceso (opcional)
                        </Label>
                        <Input
                          id="codigo_acceso"
                          value={newConjunto.codigo_acceso}
                          onChange={(e) =>
                            setNewConjunto({
                              ...newConjunto,
                              codigo_acceso: e.target.value,
                            })
                          }
                          placeholder="Se generará automáticamente si se deja vacío"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateConjunto(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isCreatingConjunto}>
                          {isCreatingConjunto ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creando...
                            </>
                          ) : (
                            "Crear Conjunto"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {conjuntosLoading ? (
                <div className="flex items-center justify-center py-6 md:py-8">
                  <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
                </div>
              ) : conjuntos.length === 0 ? (
                <p className="text-[10px] md:text-sm text-muted-foreground text-center py-6 md:py-8">
                  No hay conjuntos registrados
                </p>
              ) : (
                <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] md:text-sm min-w-[120px] py-2">Nombre</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[150px] py-2">Dirección</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[80px] py-2">Ciudad</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[130px] py-2">Código</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conjuntos.map((conjunto) => (
                        <TableRow key={conjunto.id}>
                          <TableCell className="font-medium text-[10px] md:text-sm py-2">{conjunto.nombre}</TableCell>
                          <TableCell className="text-[10px] md:text-sm py-2">{conjunto.direccion}</TableCell>
                          <TableCell className="text-[10px] md:text-sm py-2">{conjunto.ciudad}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <Key className="h-2.5 w-2.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                              <code className="text-[9px] md:text-sm bg-muted px-1.5 py-0.5 md:px-2 md:py-1 rounded break-all">
                                {conjunto.codigo_acceso}
                              </code>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Usuarios y Asignar Admin */}
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-6">
              <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-lg">
                    <Users className="h-3.5 w-3.5 md:h-5 md:w-5 shrink-0" />
                    <span className="truncate">Usuarios Registrados</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-sm mt-0.5 md:mt-1">
                    Asigna rol de administrador a usuarios por email
                  </CardDescription>
                </div>
                <Dialog open={showAssignAdmin} onOpenChange={setShowAssignAdmin}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 text-xs md:text-sm px-3 md:px-4">
                      <UserCog className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Asignar Admin</span>
                      <span className="sm:hidden">Admin</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar Rol de Administrador</DialogTitle>
                      <DialogDescription>
                        Asigna el rol de administrador a un usuario por su email
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignAdmin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email del Usuario</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          required
                          placeholder="usuario@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conjunto">Conjunto a Administrar</Label>
                        <select
                          id="conjunto"
                          value={selectedConjuntoId}
                          onChange={(e) => setSelectedConjuntoId(e.target.value)}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Selecciona un conjunto</option>
                          {conjuntos.map((conjunto) => (
                            <option key={conjunto.id} value={conjunto.id}>
                              {conjunto.nombre} - {conjunto.ciudad}
                            </option>
                          ))}
                        </select>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAssignAdmin(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isAssigningAdmin}>
                          {isAssigningAdmin ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Asignando...
                            </>
                          ) : (
                            "Asignar Admin"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="flex items-center justify-center py-6 md:py-8">
                  <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-[10px] md:text-sm text-muted-foreground text-center py-6 md:py-8">
                  No hay usuarios registrados
                </p>
              ) : (
                <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] md:text-sm min-w-[140px] py-2">Email</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[90px] py-2">Nombre</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[80px] py-2">Rol</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[110px] py-2">Conjunto</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[60px] py-2">Unidad</TableHead>
                        <TableHead className="text-[10px] md:text-sm min-w-[50px] py-2">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="text-[10px] md:text-sm py-2">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-2.5 w-2.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[120px] md:max-w-none">{usuario.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] md:text-sm font-medium py-2">{usuario.nombre}</TableCell>
                          <TableCell className="py-2">
                            <span
                              className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[9px] md:text-xs font-medium whitespace-nowrap ${
                                usuario.rol === "super_admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : usuario.rol === "admin"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {usuario.rol === "super_admin"
                                ? "Super Admin"
                                : usuario.rol === "admin"
                                ? "Admin"
                                : "Residente"}
                            </span>
                          </TableCell>
                          <TableCell className="text-[10px] md:text-sm py-2">
                            {usuario.conjunto_id
                              ? conjuntos.find((c) => c.id === usuario.conjunto_id)?.nombre ||
                                "N/A"
                              : "Sin conjunto"}
                          </TableCell>
                          <TableCell className="text-[10px] md:text-sm py-2">
                            {usuario.unidad || "-"}
                          </TableCell>
                          <TableCell className="py-2">
                            {usuario.rol !== "super_admin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUserToDelete(usuario);
                                  setShowDeleteDialog(true);
                                }}
                                className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label="Eliminar usuario"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="sr-only">Eliminar usuario</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog de confirmación para eliminar usuario */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmar eliminación
                </DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              {userToDelete && (
                <div className="space-y-2 py-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{userToDelete.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    <span>{userToDelete.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rol:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      userToDelete.rol === "super_admin"
                        ? "bg-purple-100 text-purple-800"
                        : userToDelete.rol === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {userToDelete.rol === "super_admin"
                        ? "Super Admin"
                        : userToDelete.rol === "admin"
                        ? "Admin"
                        : "Residente"}
                    </span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setUserToDelete(null);
                  }}
                  disabled={isDeletingUser}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (!userToDelete) return;
                    setIsDeletingUser(true);
                    try {
                      await deleteUserMutation.mutateAsync(userToDelete.id);
                    } finally {
                      setIsDeletingUser(false);
                    }
                  }}
                  disabled={isDeletingUser}
                >
                  {isDeletingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Usuario
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminPage;

