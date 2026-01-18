"use client";

import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/services/api.service";

/**
 * Hook para verificar el estado de la API
 */
export const useApiHealth = () => {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      const response = await apiService.get<{
        success: boolean;
        message: string;
        timestamp: string;
      }>("/health");
      return response;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
};

