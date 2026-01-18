"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ files, onFilesChange, maxImages = 5 }: ImageUploadProps) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Generar URLs de previsualización para los archivos
  useEffect(() => {
    // Revocar URLs anteriores primero
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    
    // Crear nuevas URLs para los archivos actuales
    const newUrls = files.map((file) => URL.createObjectURL(file));
    
    // Usar setTimeout para evitar setState sincrónico en el effect
    const timeoutId = setTimeout(() => {
      setPreviewUrls(newUrls);
    }, 0);

    // Limpiar URLs cuando el componente se desmonte o los archivos cambien
    return () => {
      clearTimeout(timeoutId);
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const remainingSlots = maxImages - files.length;
    if (remainingSlots <= 0) {
      toast.error(`Ya has seleccionado el máximo de ${maxImages} imágenes`);
      return;
    }

    const filesToAdd = Array.from(selectedFiles).slice(0, remainingSlots);

    // Validar que sean imágenes
    const validFiles = filesToAdd.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidExtension = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);
      return isValidType || isValidExtension;
    });
    
    if (validFiles.length !== filesToAdd.length) {
      const invalidCount = filesToAdd.length - validFiles.length;
      toast.error(`${invalidCount} archivo(s) no válido(s). Solo se permiten imágenes (JPG, PNG, GIF, WebP, etc.)`);
    }

    if (validFiles.length === 0) {
      toast.error("No se encontraron archivos de imagen válidos");
      return;
    }

    // Agregar los archivos nuevos
    onFilesChange([...files, ...validFiles]);
    toast.success(`${validFiles.length} imagen(es) seleccionada(s)`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input para permitir tomar otra foto
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    // Revocar la URL de previsualización antes de eliminar
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const canAddMore = files.length < maxImages;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block">Fotos del reporte</label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Agrega hasta {maxImages} fotos para documentar el problema ({files.length}/{maxImages})
        </p>
      </div>

      {/* Botones de acción - Mobile-first */}
      {canAddMore && (
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-11 md:h-10 active:scale-[0.98] transition-transform"
          >
            <ImageIcon className="h-4 w-4 mr-2 shrink-0" />
            <span>Galería</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 h-11 md:h-10 active:scale-[0.98] transition-transform"
          >
            <Camera className="h-4 w-4 mr-2 shrink-0" />
            <span>Cámara</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Vista previa de imágenes */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrls[index]}
                alt={`Preview ${index + 1}: ${file.name}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full p-2 md:p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:scale-90 touch-manipulation"
                aria-label="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje cuando se alcanza el máximo */}
      {!canAddMore && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Has alcanzado el límite de {maxImages} imágenes. Las imágenes se subirán al crear el reporte.
        </p>
      )}
    </div>
  );
};

