"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { useAuth } from "@/lib/hooks/use-auth";
import { useUser } from "@/lib/hooks/use-user";
import { conjuntosApiService } from "@/lib/services/conjuntos-api.service";
import { usersApiService } from "@/lib/services/users-api.service";
import { useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2, Building2, Key } from "lucide-react";
import type { Conjunto } from "@/lib/types/conjunto";

const SelectConjuntoPage = () => {
  const [codigo, setCodigo] = useState("");
  const [conjunto, setConjunto] = useState<Conjunto | null>(null);
  const [unidad, setUnidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const { user, logout } = useAuth();
  const { user: userData, isLoading: userLoading, hasConjunto, isSuperAdmin, refetch: refetchUser } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir cuando los datos del usuario estén completamente cargados
    // Usar userData !== undefined para diferenciar entre "cargando" y "no existe"
    if (!userLoading && userData !== undefined) {
      if (!user) {
        router.push("/login");
        return;
      }

      // Super admins no necesitan conjunto, redirigir al dashboard
      if (isSuperAdmin) {
        router.push("/dashboard");
        return;
      }

      // Si el usuario ya tiene un conjunto asignado, redirigir al dashboard
      if (hasConjunto) {
        router.push("/dashboard");
        return;
      }

      // Si no tiene conjunto y no es super admin, permitir seleccionar conjunto
      setCheckingUser(false);
    }
    // Si aún está cargando (userLoading === true), mantener el estado de carga
  }, [user, userLoading, userData, hasConjunto, isSuperAdmin, router]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!codigo || codigo.trim() === "") {
      setError("Por favor, ingresa un código de acceso");
      setLoading(false);
      return;
    }

    try {
      const conjuntoData = await conjuntosApiService.getConjuntoByCode(codigo.toUpperCase().trim());
      setConjunto(conjuntoData);
      toast.success(`Conjunto encontrado: ${conjuntoData.nombre}`);
    } catch (err: unknown) {
      console.error("Error al verificar código:", err);
      const error = err as Error & { status?: number };
      let errorMessage = "Código de acceso inválido";
      
      if (error.status === 404) {
        errorMessage = "Código de acceso no encontrado. Verifica el código e intenta de nuevo.";
      } else if (error.status === 400) {
        errorMessage = "Código de acceso requerido";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinConjunto = async () => {
    if (!user || !conjunto) {
      toast.error("Error: Usuario o conjunto no disponible");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const token = await user.getIdToken();
      
      // Actualizar usuario con conjunto_id y unidad
      await usersApiService.updateUser(
        user.uid,
        {
          conjunto_id: conjunto.id,
          unidad: unidad || undefined,
        },
        token
      );

      // Invalidar y refetch los datos del usuario
      queryClient.invalidateQueries({ queryKey: ["user", user.uid] });
      await refetchUser();

      toast.success(`¡Te has unido al conjunto exitosamente! ${conjunto.nombre} - ${unidad || "Sin unidad especificada"}`);

      // Pequeño delay para que se vea la notificación y se actualicen los datos
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: unknown) {
      console.error("Error al unirse al conjunto:", err);
      const error = err as Error & { status?: number; details?: string };
      let errorMessage = "Error al unirse al conjunto";
      
      if (error.status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (error.status === 404) {
        errorMessage = "Usuario no encontrado";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6" />
              Seleccionar Conjunto Residencial
            </CardTitle>
            <CardDescription className="text-center">
              Ingresa el código de acceso de tu conjunto residencial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div
                className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                role="alert"
              >
                {error}
              </div>
            )}

            {!conjunto ? (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de Acceso</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-0" />
                    <Input
                      id="codigo"
                      type="text"
                      placeholder="ABC123XYZ9"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      disabled={loading}
                      required
                      maxLength={10}
                      className="pl-10"
                      aria-label="Código de acceso"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El código de acceso te lo proporciona la administración de tu conjunto
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">
                      {conjunto.nombre}
                    </h3>
                  </div>
                  <p className="text-sm text-green-700">
                    {conjunto.direccion}, {conjunto.ciudad}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidad">Número de Unidad (Opcional)</Label>
                  <Input
                    id="unidad"
                    type="text"
                    placeholder="Ej: 101, A-5, Casa 12"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    disabled={loading}
                    aria-label="Número de unidad"
                  />
                  <p className="text-xs text-muted-foreground">
                    Indica tu apartamento, casa o unidad dentro del conjunto
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setConjunto(null);
                      setCodigo("");
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleJoinConjunto}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uniéndose...
                      </>
                    ) : (
                      "Unirse al Conjunto"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default SelectConjuntoPage;

