/**
 * Configuración de la API
 */
export const API_CONFIG = {
  timeout: 30000, // 30 segundos
};

/**
 * Verifica que la configuración de la API esté correcta
 */
export const verifyApiConfig = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    const errorMessage = 
      "❌ NEXT_PUBLIC_API_URL no está configurado.\n" +
      "💡 Agrega NEXT_PUBLIC_API_URL a tu archivo .env.local\n" +
      "   Ejemplo: NEXT_PUBLIC_API_URL=http://localhost:3001/api (desarrollo)\n" +
      "   O: NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api (producción)";
    
    if (typeof window === "undefined") {
      // Server-side: lanzar error
      throw new Error(errorMessage);
    } else {
      // Client-side: mostrar error en consola
      console.error(errorMessage);
      throw new Error("NEXT_PUBLIC_API_URL no está configurado");
    }
  }
  
  return apiUrl;
};

