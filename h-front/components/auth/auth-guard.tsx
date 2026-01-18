"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir después de que la carga termine
    if (!loading) {
      if (requireAuth && !user) {
        router.push("/login");
      } else if (!requireAuth && user) {
        router.push("/");
      }
    }
  }, [user, loading, requireAuth, router]);

  // Si está cargando y requiere auth, mostrar loader
  // Pero si NO requiere auth (como en login), mostrar el contenido inmediatamente
  if (loading && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si requiere auth y no hay usuario, no mostrar nada (se redirigirá)
  if (requireAuth && !user && !loading) {
    return null;
  }

  // Si NO requiere auth y hay usuario, no mostrar nada (se redirigirá)
  if (!requireAuth && user && !loading) {
    return null;
  }

  // Mostrar el contenido en todos los demás casos
  return <>{children}</>;
};

