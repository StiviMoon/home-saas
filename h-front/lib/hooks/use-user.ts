"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { usersApiService } from "@/lib/services/users-api.service";
import type { User } from "@/lib/types/user";

/**
 * Hook para obtener y gestionar datos del usuario actual
 */
export const useUser = () => {
  const { user } = useAuth();

  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useQuery<User>({
    queryKey: ["user", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();
      return await usersApiService.getCurrentUser(token);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    user: userData,
    isLoading,
    error,
    refetch,
    // Super admins no necesitan conjunto, así que hasConjunto es true para ellos
    hasConjunto: !!userData?.conjunto_id || userData?.rol === "super_admin",
    isAdmin: userData?.rol === "admin" || userData?.rol === "super_admin",
    isSuperAdmin: userData?.rol === "super_admin",
  };
};
