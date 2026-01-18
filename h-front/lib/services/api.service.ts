"use client";

import { verifyApiConfig } from "@/lib/utils/api-config";

/**
 * Clase para manejar las peticiones a la API
 */
class ApiService {
  private baseURL: string | null = null;

  constructor() {
    // No inicializar aquí, hacerlo lazy para evitar problemas en SSR
  }

  /**
   * Obtiene la URL base de la API
   */
  private getBaseURL(): string {
    if (!this.baseURL) {
      this.baseURL = verifyApiConfig();
    }
    return this.baseURL;
  }

  /**
   * Obtiene el token de autenticación desde Firebase Auth
   */
  private async getAuthToken(): Promise<string | null> {
    // El token se obtiene del cliente de Firebase Auth
    // Esto se manejará desde el hook useAuth
    return null;
  }

  /**
   * Realiza una petición HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.getBaseURL()}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: { error?: string; message?: string; details?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      const error = new Error(errorMessage) as Error & { status: number; details?: string };
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.getBaseURL()}${endpoint}`, {
        method: "GET",
        headers,
      });
    } catch (fetchError: unknown) {
      // Error de red (backend no disponible, CORS, etc.)
      const error = fetchError as { message?: string };
      const errorMessage = error.message || "Error de conexión";
      const isNetworkError = errorMessage.includes("Failed to fetch") || 
                            errorMessage.includes("NetworkError") ||
                            errorMessage.includes("ERR_INTERNET_DISCONNECTED") ||
                            errorMessage.includes("ERR_CONNECTION_REFUSED");
      
      if (isNetworkError) {
        const apiUrl = this.getBaseURL();
        throw new Error(
          `❌ No se pudo conectar con el servidor backend.\n\n` +
          `💡 Verifica que:\n` +
          `   • El backend esté corriendo en ${apiUrl}\n` +
          `   • El backend esté accesible desde el navegador\n` +
          `   • No haya problemas de CORS o firewall\n\n` +
          `🔧 Para iniciar el backend, ejecuta:\n` +
          `   cd back-h && npm run dev`
        ) as Error & { status: number; details?: string; isNetworkError: boolean };
      }
      
      throw fetchError;
    }

    if (!response.ok) {
      let errorData: { error?: string; message?: string; details?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      const error = new Error(errorMessage) as Error & { status: number; details?: string };
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.getBaseURL()}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    } catch (fetchError: unknown) {
      // Error de red (backend no disponible, CORS, etc.)
      const error = fetchError as { message?: string };
      const errorMessage = error.message || "Error de conexión";
      const isNetworkError = errorMessage.includes("Failed to fetch") || 
                            errorMessage.includes("NetworkError") ||
                            errorMessage.includes("ERR_INTERNET_DISCONNECTED") ||
                            errorMessage.includes("ERR_CONNECTION_REFUSED");
      
      if (isNetworkError) {
        const apiUrl = this.getBaseURL();
        throw new Error(
          `❌ No se pudo conectar con el servidor backend.\n\n` +
          `💡 Verifica que:\n` +
          `   • El backend esté corriendo en ${apiUrl}\n` +
          `   • El backend esté accesible desde el navegador\n` +
          `   • No haya problemas de CORS o firewall\n\n` +
          `🔧 Para iniciar el backend, ejecuta:\n` +
          `   cd back-h && npm run dev`
        ) as Error & { status: number; details?: string; isNetworkError: boolean };
      }
      
      throw fetchError;
    }

    if (!response.ok) {
      let errorData: { error?: string; message?: string; details?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      const error = new Error(errorMessage) as Error & { status: number; details?: string };
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.getBaseURL()}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorData: { error?: string; message?: string; details?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      const error = new Error(errorMessage) as Error & { status: number; details?: string };
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.getBaseURL()}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      let errorData: { error?: string; message?: string; details?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      const error = new Error(errorMessage) as Error & { status: number; details?: string };
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    return response.json();
  }
}

export const apiService = new ApiService();

