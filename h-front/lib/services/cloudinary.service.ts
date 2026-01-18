"use client";

/**
 * Servicio para subir imágenes a Cloudinary usando API routes de Next.js
 * Esto es más seguro porque las credenciales se mantienen en el servidor
 */
export const cloudinaryService = {
  /**
   * Sube una imagen a Cloudinary usando la API route de Next.js
   */
  uploadImage: async (file: File): Promise<{ url: string; public_id: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || "Error al subir la imagen";
        
        console.error("Error Cloudinary:", {
          error: errorData,
          status: response.status,
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        url: data.url,
        public_id: data.public_id,
      };
    } catch (error) {
      console.error("Error al subir imagen a Cloudinary:", error);
      throw error;
    }
  },

  /**
   * Sube múltiples imágenes
   */
  uploadImages: async (files: File[]): Promise<Array<{ url: string; public_id: string }>> => {
    const uploadPromises = files.map((file) => cloudinaryService.uploadImage(file));
    return Promise.all(uploadPromises);
  },
};

