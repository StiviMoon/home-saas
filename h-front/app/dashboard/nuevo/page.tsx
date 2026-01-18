"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/lib/hooks/use-auth";
import { useUser } from "@/lib/hooks/use-user";
import { reportsApiService } from "@/lib/services/reports-api.service";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateReportData, ReportCategory } from "@/lib/types/report";
import { toast } from "sonner";
import { ImageUpload } from "@/components/reports/image-upload";

const NuevoReportePage = () => {
  const { user } = useAuth();
  const { user: userData, isLoading: userLoading, hasConjunto } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateReportData>({
    conjunto_id: userData?.conjunto_id || "",
    titulo: "",
    descripcion: "",
    categoria: "infraestructura",
    ubicacion: "",
    es_anonimo: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar conjunto_id cuando se carga el usuario
  useEffect(() => {
    if (userData?.conjunto_id) {
      setFormData((prev) => ({ ...prev, conjunto_id: userData.conjunto_id! }));
    }
  }, [userData?.conjunto_id]);

  const createReportMutation = useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await reportsApiService.createReport(reportData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Error al crear el reporte";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descripcion || !formData.ubicacion) {
      toast.error("Por favor, completa todos los campos requeridos");
      return;
    }

    if (!userData?.conjunto_id) {
      toast.error("No tienes un conjunto asignado");
      router.push("/select-conjunto");
      return;
    }

    if (!user) {
      toast.error("Usuario no autenticado");
      return;
    }

    setIsSubmitting(true);
    try {
      // PASO 1: Subir las imágenes a Cloudinary primero
      let uploadedImages: Array<{ url: string; public_id: string }> = [];
      
      if (imageFiles.length > 0) {
        toast.info("Subiendo imágenes...");
        const { cloudinaryService } = await import("@/lib/services/cloudinary.service");
        uploadedImages = await cloudinaryService.uploadImages(imageFiles);
        toast.success(`${uploadedImages.length} imagen(es) subida(s) correctamente`);
      }

      // PASO 2: Crear el reporte
      toast.info("Creando reporte...");
      const report = await createReportMutation.mutateAsync({
        ...formData,
        conjunto_id: userData.conjunto_id,
      });

      // PASO 3: Asociar las fotos al reporte
      if (uploadedImages.length > 0) {
        const token = await user.getIdToken();
        toast.info("Asociando imágenes al reporte...");
        const photoPromises = uploadedImages.map((image) =>
          reportsApiService.addPhoto(report.id, image.public_id, image.url, token)
        );
        await Promise.all(photoPromises);
      }

      // Redirigir después de crear el reporte y subir las fotos
      toast.success("¡Reporte creado exitosamente!");
      router.push("/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al crear el reporte";
      toast.error(errorMessage);
      console.error("Error al crear reporte o subir fotos:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setImageFiles(newFiles);
  };

  // Redirigir si no tiene conjunto
  useEffect(() => {
    if (!userLoading && !hasConjunto) {
      router.push("/select-conjunto");
    }
  }, [userLoading, hasConjunto, router]);

  if (userLoading || !hasConjunto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
                <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">Nuevo Reporte</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  Crea un nuevo reporte para tu conjunto residencial
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
            {/* Formulario */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  Información del Reporte
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Completa todos los campos para crear tu reporte
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="titulo" className="text-sm font-medium">Título del Reporte *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                      placeholder="Ej: Fuga de agua en el pasillo del segundo piso"
                      required
                      maxLength={100}
                      className="text-base md:text-sm" // Mejor tamaño de texto en móvil
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion" className="text-sm font-medium">Descripción *</Label>
                    <textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({ ...formData, descripcion: e.target.value })
                      }
                      placeholder="Describe el problema o situación en detalle..."
                      required
                      rows={5}
                      className="flex min-h-[120px] md:min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria" className="text-sm font-medium">Categoría *</Label>
                      <select
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) =>
                          setFormData({ ...formData, categoria: e.target.value as ReportCategory })
                        }
                        required
                        className="flex h-11 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="infraestructura">Infraestructura</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="aseo">Aseo</option>
                        <option value="convivencia">Convivencia</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ubicacion" className="text-sm font-medium">Ubicación *</Label>
                      <Input
                        id="ubicacion"
                        value={formData.ubicacion}
                        onChange={(e) =>
                          setFormData({ ...formData, ubicacion: e.target.value })
                        }
                        placeholder="Ej: Pasillo segundo piso, Apto 201"
                        required
                        className="text-base md:text-sm"
                      />
                    </div>
                  </div>

                  {/* Componente de subida de imágenes */}
                  <div className="space-y-3">
                    <ImageUpload
                      files={imageFiles}
                      onFilesChange={handleFilesChange}
                      maxImages={5}
                    />
                  </div>

                  <div className="flex items-start space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="es_anonimo"
                      checked={formData.es_anonimo}
                      onChange={(e) =>
                        setFormData({ ...formData, es_anonimo: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-input cursor-pointer mt-0.5 shrink-0"
                    />
                    <Label htmlFor="es_anonimo" className="text-sm font-normal cursor-pointer leading-relaxed">
                      Publicar como anónimo
                    </Label>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="flex-1 h-11 md:h-10"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 md:h-10 font-semibold" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        "Crear Reporte"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default NuevoReportePage;

